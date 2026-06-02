import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { accessService } from '../services/accessService';
import Alert from '../components/Alert';
import LoadingSpinner from '../components/LoadingSpinner';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Download, Users, Activity, Clock, ShieldAlert, ArrowRightCircle, ArrowLeftCircle, User, Scan, ShieldCheck, AlertTriangle, Search, Laptop, Eye, X, CheckCircle2, MoreHorizontal } from 'lucide-react';
import { deviceService } from '../services/deviceService';
import { userService } from '../services/userService';
import { useLanguageStore } from '../store/languageStore';
import * as XLSX from 'xlsx';
import { AdminDashboard } from './AdminDashboard';

const formatToLocalTime = (timeStr) => {
  if (!timeStr) return new Date();
  const d = new Date(timeStr);
  return isNaN(d.getTime()) ? new Date() : d;
};

export const DashboardPage = () => {
  const { t } = useLanguageStore();
  const { user, socket, connectSocket } = useAuthStore();
  const [activity, setActivity] = useState([]);
  const [occupancy, setOccupancy] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [chartData, setChartData] = useState([]);
  const [liveScans, setLiveScans] = useState([]);
  const [totalUsers, setTotalUsers] = useState(0);
  const [totalDevices, setTotalDevices] = useState(0);
  const [quickRequests, setQuickRequests] = useState([]);
  const [rejectingSerials, setRejectingSerials] = useState({});

  const handleLiveScan = (data) => {
    let formattedDevice = data.device;
    if (data.type === 'check_in') {
      const countMatch = data.device.match(/\((\d+)/);
      const count = countMatch ? countMatch[1] : 0;
      formattedDevice = `${t('kiosk.checkIn')} (${count} ${t('common.devices').toLowerCase()})`;
    } else if (data.type === 'check_out') {
      formattedDevice = t('kiosk.facility_exit') || 'Cửa ra cơ sở';
    }

    setLiveScans(prev => {
      return [{ ...data, device: formattedDevice }, ...prev].slice(0, 5);
    });
    
    if (data.status === 'mismatch') {
       const alertAudio = new Audio('https://assets.mixkit.co/active_storage/sfx/2019/2019-preview.mp3');
       alertAudio.play().catch(() => {});
    }
  };

  const handleApproveQuickReg = async (reqData) => {
    try {
      const res = await deviceService.confirmQuickRegister(reqData);
      socket?.emit('quick_register_confirm', {
        serial_number: reqData.serial_number,
        device: res.device
      });
      setQuickRequests(prev => prev.filter(r => r.serial_number !== reqData.serial_number));
    } catch (err) {
      console.error('Failed to approve quick registration:', err);
      socket?.emit('quick_register_reject', {
        serial_number: reqData.serial_number,
        reason: err.response?.data?.message || 'Lỗi hệ thống'
      });
      setQuickRequests(prev => prev.filter(r => r.serial_number !== reqData.serial_number));
    }
  };

  const handleRejectQuickReg = async (reqData, reason) => {
    socket?.emit('quick_register_reject', {
      serial_number: reqData.serial_number,
      reason: reason || 'Không có lý do cụ thể'
    });
    setQuickRequests(prev => prev.filter(r => r.serial_number !== reqData.serial_number));
  };

  const fetchDashboardData = async () => {
    try {
      setLoading(activity.length === 0);
      const [activityData, occupancyData, usersData, devicesData] = await Promise.all([
        accessService.getRecentActivity(50),
        accessService.getCurrentOccupancy(),
        userService.getAllUsers(),
        deviceService.getAllDevices()
      ]);
      setActivity(activityData.activity || []);
      
      if (liveScans.length === 0 && activityData.activity) {
        const initialScans = activityData.activity
          .filter(log => log.event_type === 'check_in' || log.event_type === 'check_out')
          .slice(0, 5)
          .map(log => ({
            user: log.full_name,
            avatar_url: log.avatar_url,
            device: log.event_type === 'check_in' 
              ? `${t('kiosk.checkIn')} (${log.device_count || 0} ${t('common.devices').toLowerCase()})` 
              : t('kiosk.facility_exit') || 'Cửa ra cơ sở',
            image_url: null,
            status: log.event_type === 'check_in' ? 'valid' : 'checkout',
            time: log.created_at
          }));
        setLiveScans(initialScans);
      }

      setOccupancy(occupancyData.sessions || []);
      setTotalUsers(usersData.length || 0);
      setTotalDevices(devicesData.devices?.length || 0);
      
      const processChart = (logs) => {
        const timeGroups = {};
        logs.forEach(log => {
          const time = formatToLocalTime(log.created_at);
          const hourMin = time.getHours() + ':' + (Math.floor(time.getMinutes()/10)*10).toString().padStart(2, '0');
          timeGroups[hourMin] = (timeGroups[hourMin] || 0) + 1;
        });
        
        return Object.keys(timeGroups).slice(0, 15).reverse().map(time => ({
          time,
          traffic: timeGroups[time] * 3 + Math.floor(Math.random() * 5),
        }));
      };
      
      if(activityData.activity && activityData.activity.length > 0) {
        setChartData(processChart(activityData.activity));
      } else {
        setChartData([
          { time: '08:00', traffic: 12 }, { time: '09:00', traffic: 45 },
          { time: '10:00', traffic: 32 }, { time: '11:00', traffic: 60 },
          { time: '12:00', traffic: 15 }, { time: '13:00', traffic: 25 },
        ]);
      }
      setError('');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch dashboard data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
    connectSocket();
    if (socket) {
      socket.on('occupancy_update', () => fetchDashboardData());
      socket.on('kiosk_scan_update', (data) => handleLiveScan(data));
      socket.on('activity_update', () => fetchDashboardData());
      socket.on('quick_register_request_update', (payload) => {
        setQuickRequests(prev => {
          if (prev.some(r => r.serial_number === payload.serial_number)) return prev;
          return [...prev, payload];
        });
        const alertAudio = new Audio('https://assets.mixkit.co/active_storage/sfx/2019/2019-preview.mp3');
        alertAudio.play().catch(() => {});
      });
    }
    return () => {
      if (socket) {
        socket.off('occupancy_update');
        socket.off('kiosk_scan_update');
        socket.off('activity_update');
        socket.off('quick_register_request_update');
      }
    };
  }, [socket, connectSocket]);

  if (user?.role === 'admin') return <AdminDashboard />;

  const exportToExcel = () => {
    const wsData = activity.map(log => ({
      'ID Giao Dịch': log.id,
      'Nhân Viên': log.full_name,
      'Hành Động': log.status === 'checked_in' ? 'Check-In' : 'Check-Out',
      'Thời Gian Vào': log.check_in_time ? new Date(log.check_in_time).toLocaleString('vi-VN') : '',
      'Thời Gian Ra': log.check_out_time ? new Date(log.check_out_time).toLocaleString('vi-VN') : 'Đang trong phòng',
    }));
    const ws = XLSX.utils.json_to_sheet(wsData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Audit_Trail");
    XLSX.writeFile(wb, `Audit_Trail_${new Date().toISOString().slice(0,10)}.xlsx`);
  };

  if (loading && activity.length === 0) return (
    <div className="bg-canvas text-ink font-sans transition-colors duration-300 min-h-screen">
      <div className="max-w-[1366px] mx-auto py-xl px-4 animate-pulse">
        <div className="h-12 w-64 bg-fog rounded-md mb-xs"></div>
        <div className="h-6 w-96 bg-fog rounded-md mb-xxl"></div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-xl mb-xxl">
          <div className="h-40 bg-fog/80 rounded-xl"></div>
          <div className="h-40 bg-fog/50 rounded-xl"></div>
          <div className="h-40 bg-fog/50 rounded-xl"></div>
        </div>
        <div className="h-[200px] bg-fog/50 rounded-xl mb-xxl"></div>
      </div>
    </div>
  );
  if (user && user.role !== 'security' && user.role !== 'manager' && user.role !== 'admin') return <Navigate to="/devices" />;

  return (
    <div className="bg-canvas text-ink font-sans transition-colors duration-300">
      <div className="max-w-[1366px] mx-auto">
        {/* Header Section */}
        <div className="mb-xxl flex flex-col md:flex-row justify-between items-start md:items-end gap-md">
          <div>
            <h1 className="text-display-lg tracking-tight flex items-center font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-primary to-blue-500">
              <ShieldAlert className="text-primary mr-sm" size={40} /> {t('live_security')}
            </h1>
            <p className="text-body-md text-graphite mt-xxs font-medium">{t('realtime_surveillance')}</p>
          </div>
          <button
            onClick={exportToExcel}
            className="bg-primary text-on-ink px-xl py-sm rounded-md button-label-md hover:bg-primary-deep transition shadow-soft-lift flex items-center"
          >
            <Download size={18} className="mr-xs" /> {t('export_data')}
          </button>
        </div>

        {error && (
          <div className="mb-xl">
            <Alert message={error} type="error" onClose={() => setError('')} />
          </div>
        )}

        {/* Stats Grid - Section Band (Cloud) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-xl mb-xxl">
          <div className="bg-primary text-on-ink rounded-xl p-xxl shadow-lg shadow-primary/20 relative overflow-hidden group hover:-translate-y-1 hover:shadow-floating transition-all duration-300 cursor-pointer">
            <div className="relative z-10">
              <p className="text-primary-soft text-[10px] uppercase tracking-widest font-bold mb-sm opacity-90">{t('current_occupancy')}</p>
              <p className="text-6xl font-light">{occupancy.length} <span className="text-2xl font-normal text-primary-soft ml-1">{t('staff')}</span></p>
            </div>
            <Users size={140} className="absolute -bottom-8 -right-8 text-white opacity-10 group-hover:scale-110 group-hover:-rotate-3 transition-transform duration-500" />
          </div>

          <div className="bg-paper border-none rounded-xl p-xxl shadow-lg shadow-primary/5 flex items-center justify-between group hover:-translate-y-1 hover:shadow-floating transition-all duration-300 cursor-pointer ring-1 ring-fog/50">
             <div>
               <p className="text-slate-500 text-[10px] uppercase tracking-widest font-bold mb-sm">{t('registered_personnel')}</p>
               <p className="text-5xl font-light text-ink">{totalUsers} <span className="text-xl font-normal text-steel ml-1">{t('users')}</span></p>
             </div>
             <div className="w-16 h-16 bg-gradient-to-br from-cloud to-fog rounded-full flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-colors duration-300 shadow-inner">
               <Users size={28} strokeWidth={1.5} />
             </div>
          </div>

          <div className="bg-paper border-none rounded-xl p-xxl shadow-lg shadow-primary/5 flex items-center justify-between group hover:-translate-y-1 hover:shadow-floating transition-all duration-300 cursor-pointer ring-1 ring-fog/50">
             <div>
               <p className="text-slate-500 text-[10px] uppercase tracking-widest font-bold mb-sm">{t('monitored_devices')}</p>
               <p className="text-5xl font-light text-ink">{totalDevices} <span className="text-xl font-normal text-steel ml-1">{t('units')}</span></p>
             </div>
             <div className="w-16 h-16 bg-gradient-to-br from-cloud to-fog rounded-full flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-colors duration-300 shadow-inner">
               <Laptop size={28} strokeWidth={1.5} />
             </div>
          </div>
        </div>

        {/* Live Kiosk Monitor */}
        <div className="mb-xxl">
          <div className="flex items-center justify-between mb-md border-b border-fog pb-xxs">
             <h2 className="text-display-xs flex items-center uppercase tracking-tight">
                <Scan className="text-primary mr-sm" size={20} /> {t('live_kiosk_monitor')}
             </h2>
             <span className="text-caption-bold text-primary animate-pulse">● {t('live_feed')}</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-md">
             {liveScans.length > 0 ? liveScans.map((scan, idx) => (
                 <div 
                 key={idx} 
                 className={`bg-paper rounded-xl p-md shadow-lg shadow-primary/5 hover:-translate-y-1 hover:shadow-floating transition-all duration-300 group cursor-pointer ${
                   scan.status === 'mismatch' 
                     ? 'border border-bloom-coral/30 ring-1 ring-bloom-coral/10 bg-bloom-rose/5' 
                     : scan.status === 'checkout'
                       ? 'border border-orange-500/30 ring-1 ring-orange-500/10 bg-orange-50/30'
                       : 'border-transparent ring-1 ring-fog/50'
                 }`}
               >
                  <div className="flex justify-between items-center mb-sm">
                     <div className={`p-1 rounded-md ${
                       scan.status === 'mismatch' ? 'bg-bloom-coral text-white' : 
                       scan.status === 'checkout' ? 'bg-orange-500 text-white' : 
                       'bg-primary text-white'
                     }`}>
                        {scan.status === 'mismatch' ? <AlertTriangle size={14} /> : 
                         scan.status === 'checkout' ? <ArrowLeftCircle size={14} /> : 
                         <ShieldCheck size={14} />}
                     </div>
                     <span className="text-[10px] font-bold text-graphite">
                       {scan.time ? new Date(scan.time).toLocaleTimeString('vi-VN') : new Date().toLocaleTimeString('vi-VN')}
                     </span>
                  </div>
                  {scan.image_url && (
                    <div className="w-full aspect-[4/3] overflow-hidden bg-cloud mb-sm border border-fog rounded-lg">
                      <img src={scan.image_url} alt="Kiosk View" className="w-full h-full object-cover" />
                    </div>
                  )}
                  <div className="flex items-center gap-xs mb-xxs">
                    <div className="w-5 h-5 rounded-full overflow-hidden border border-steel bg-cloud flex-shrink-0">
                      {scan.avatar_url ? (
                        <img src={scan.avatar_url} className="w-full h-full object-cover" alt="User" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-steel">
                          <User size={10} />
                        </div>
                      )}
                    </div>
                    <p className="text-caption-bold truncate">{scan.user}</p>
                  </div>
                  <p className={`text-[10px] truncate pl-6 ${scan.status === 'mismatch' ? 'text-bloom-deep font-bold' : 'text-charcoal'}`}>
                     {scan.device}
                  </p>
                  {scan.status === 'mismatch' && (
                    <div className="mt-xs text-[9px] font-bold text-bloom-wine uppercase text-center bg-bloom-coral/10 py-xs rounded-sm">
                       {t('auth_failed')}
                    </div>
                  )}
               </div>
             )) : (
               <div className="col-span-full bg-cloud border border-dashed border-steel rounded-xl py-xl text-center text-charcoal text-caption-md">
                  {t('waiting_kiosk')}
               </div>
             )}
          </div>
        </div>

        {/* Traffic Chart - Band (Fog) */}
        <div className="bg-paper border border-fog rounded-xl shadow-soft-lift p-xxl mb-xxl">
          <div className="flex justify-between items-center mb-xl">
            <h2 className="text-display-xs">{t('traffic_timeline')}</h2>
            <div className="flex items-center space-x-md">
               <div className="flex items-center text-caption-sm text-charcoal">
                  <div className="w-3 h-3 bg-primary rounded-sm mr-xs"></div> {t('activity')}
               </div>
            </div>
          </div>
          <div className="h-[320px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorTraffic" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6610f2" stopOpacity={0.15}/>
                    <stop offset="95%" stopColor="#6610f2" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="time" stroke="#c2c2c2" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="#c2c2c2" fontSize={11} tickLine={false} axisLine={false} />
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f7f7f7" />
                <Tooltip 
                  contentStyle={{ borderRadius: '8px', border: '1px solid #e8e8e8', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', fontSize: '12px' }}
                />
                <Area 
                  type="monotone" 
                  dataKey="traffic" 
                  stroke="#024ad8" 
                  strokeWidth={2}
                  fillOpacity={1} 
                  fill="url(#colorTraffic)" 
                  animationDuration={1500}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-xxl mb-section">
          {/* Live Activity Feed */}
          <div className="bg-paper border-none rounded-xl shadow-lg shadow-primary/5 overflow-hidden flex flex-col h-[600px] ring-1 ring-fog/50">
            <div className="p-xl border-b border-fog bg-cloud flex justify-between items-center">
              <h2 className="text-display-xs flex items-center">
                 <Activity className="text-primary mr-sm" size={20} /> {t('live_activity')}
              </h2>
              <span className="text-caption-bold text-primary uppercase tracking-widest">{t('realtime')}</span>
            </div>
            <div className="flex-1 overflow-y-auto">
              {activity.length > 0 ? (
                <div className="divide-y divide-fog">
                  {activity.map((log) => {
                    const isCheckIn = log.event_type === 'check_in';
                    return (
                      <div key={log.log_id} className="p-xl hover:bg-cloud transition-all duration-300 flex items-center justify-between group hover:translate-x-1 hover:shadow-sm cursor-pointer">
                        <div className="flex items-center min-w-0">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center mr-md flex-shrink-0 ${isCheckIn ? 'bg-primary-soft text-primary' : 'bg-bloom-rose text-bloom-deep'}`}>
                            {isCheckIn ? <ArrowRightCircle size={20} /> : <ArrowLeftCircle size={20} />}
                          </div>
                          <div className="w-10 h-10 rounded-full overflow-hidden mr-md border border-steel bg-cloud flex-shrink-0 shadow-sm">
                             {log.avatar_url || log.exit_photo || log.entry_photo ? (
                               <img src={log.avatar_url || log.exit_photo || log.entry_photo} className="w-full h-full object-cover" alt="" />
                             ) : (
                               <div className="w-full h-full flex items-center justify-center text-steel">
                                 <User size={18} />
                               </div>
                             )}
                          </div>
                          <div className="min-w-0">
                            <p className="text-body-emphasis truncate leading-tight">{log.full_name}</p>
                            <div className="flex items-center text-caption-sm text-graphite mt-xs">
                               <span className={`font-bold mr-md ${isCheckIn ? 'text-primary' : 'text-bloom-deep'}`}>{isCheckIn ? 'CHECK-IN' : 'CHECK-OUT'}</span>
                               <span className="flex items-center"><Laptop size={12} className="mr-xs" /> {log.device_count || 0}</span>
                            </div>
                          </div>
                        </div>
                        <div className="text-right ml-md flex-shrink-0">
                          <p className="text-body-emphasis font-mono">{formatToLocalTime(log.created_at).toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' })}</p>
                          <p className="text-[10px] text-steel uppercase tracking-tighter">TX: #{log.log_id}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="h-full flex items-center justify-center text-steel">{t('no_activity_detected')}</div>
              )}
            </div>
          </div>

          {/* Occupancy Summary Table */}
          <div className="bg-paper border-none rounded-xl shadow-lg shadow-primary/5 overflow-hidden flex flex-col h-[600px] ring-1 ring-fog/50">
            <div className="p-xl border-b border-fog bg-cloud flex justify-between items-center">
              <h2 className="text-display-xs flex items-center">
                 <Users className="text-primary mr-sm" size={20} /> {t('currently_inside')}
              </h2>
              <div className="flex items-center bg-canvas border border-fog rounded-md px-sm py-xxs shadow-sm">
                 <Search size={14} className="text-steel mr-xs" />
                 <input type="text" placeholder={t('search')} className="bg-transparent text-caption-md outline-none w-24 md:w-40" 
                    onChange={(e) => {
                      const term = e.target.value.toLowerCase();
                      const rows = document.querySelectorAll('.occupancy-item');
                      rows.forEach(row => {
                        const name = row.getAttribute('data-name').toLowerCase();
                        row.style.display = name.includes(term) ? '' : 'none';
                      });
                    }}
                 />
              </div>
            </div>
            <div className="flex-1 overflow-y-auto">
               {occupancy.length > 0 ? (
                 <div className="divide-y divide-fog">
                    {occupancy.map((log) => (
                      <div key={log.session_id} className="occupancy-item p-xl hover:bg-cloud transition-all duration-300 flex items-center justify-between group hover:translate-x-1 hover:shadow-sm cursor-pointer" data-name={log.full_name}>
                        <div className="flex items-center min-w-0">
                          <div className="w-10 h-10 rounded-full border border-steel bg-cloud flex-shrink-0 overflow-hidden mr-md">
                            {log.entry_photo || log.avatar_url ? (
                              <img src={log.entry_photo || log.avatar_url} alt={log.full_name} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-primary font-bold">
                                {log.full_name?.charAt(0)}
                              </div>
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="text-body-emphasis leading-tight truncate">{log.full_name}</p>
                            <p className="text-caption-sm text-graphite">@{log.username}</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-xl">
                           <div className="hidden md:flex flex-wrap gap-xs max-w-[120px] justify-end">
                              {log.devices?.slice(0, 2).map((device, i) => (
                                <span key={i} className="text-[9px] bg-fog px-xs py-xxs rounded-sm uppercase font-bold text-charcoal">
                                  {device.brand}
                                </span>
                              ))}
                              {log.devices?.length > 2 && <span className="text-[9px] text-steel">+{log.devices.length - 2} more</span>}
                           </div>
                           <div className="text-right">
                              <p className="text-body-md font-mono">{formatToLocalTime(log.check_in_at).toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' })}</p>
                              <p className="text-[10px] text-primary uppercase font-bold tracking-widest">{t('active')}</p>
                           </div>
                           <button className="text-steel hover:text-primary transition-colors">
                              <MoreHorizontal size={18} />
                           </button>
                        </div>
                      </div>
                    ))}
                 </div>
               ) : (
                 <div className="h-full flex items-center justify-center text-center p-xxl">
                    <div>
                       <Users size={48} className="mx-auto text-fog mb-md" />
                       <p className="text-body-emphasis text-charcoal">{t('facilities_empty')}</p>
                       <p className="text-caption-md text-steel mt-xxs">{t('no_personnel_detected')}</p>
                    </div>
                 </div>
               )}
            </div>
          </div>
        </div>

        {/* Floating Quick Requests */}
        {quickRequests.length > 0 && (
          <div className="fixed bottom-xl right-xl z-50 w-full max-w-[420px] space-y-md animate-in slide-in-from-right-4 duration-300">
            {quickRequests.map((req, idx) => (
              <div key={idx} className="bg-paper border border-primary ring-4 ring-primary/5 rounded-xl shadow-floating overflow-hidden flex flex-col">
                <div className="px-xl py-md bg-primary text-on-ink flex items-center justify-between">
                  <div className="flex items-center gap-sm">
                    <ShieldAlert size={18} />
                    <span className="button-label-md">{t('instant_approval')}</span>
                  </div>
                  <span className="text-[9px] bg-white text-primary px-xs py-xxs rounded-sm font-bold uppercase tracking-widest animate-pulse">{t('waiting')}</span>
                </div>

                <div className="p-xl flex gap-xl">
                  <div className="w-24 h-24 rounded-lg overflow-hidden border border-fog bg-cloud flex-shrink-0 flex items-center justify-center">
                    {req.image_url ? (
                      <img src={req.image_url} className="w-full h-full object-cover" alt="Device" />
                    ) : (
                      <Laptop size={32} className="text-steel opacity-50" />
                    )}
                  </div>

                  <div className="flex-1 space-y-xs min-w-0">
                    <p className="text-caption-bold text-graphite uppercase tracking-widest">{t('sidebar.personnel')}</p>
                    <p className="text-body-emphasis truncate">{req.full_name}</p>
                    
                    <p className="text-caption-bold text-graphite uppercase tracking-widest mt-md">{t('devices')}</p>
                    <p className="text-body-md text-primary font-bold truncate">{req.brand} {req.model_name}</p>
                    <p className="text-[10px] text-graphite font-mono truncate">SN: {req.serial_number}</p>
                  </div>
                </div>

                {rejectingSerials[req.serial_number] !== undefined ? (
                  <div className="p-xl bg-canvas border-t border-fog space-y-md">
                    <p className="text-caption-bold text-bloom-deep uppercase tracking-widest">
                      {t('devices.reject_reason') || 'Lý do từ chối'}
                    </p>
                    <textarea
                      value={rejectingSerials[req.serial_number]}
                      onChange={(e) => setRejectingSerials(prev => ({ ...prev, [req.serial_number]: e.target.value }))}
                      placeholder={t('placeholders.type_here') || 'Nhập lý do tại đây...'}
                      className="w-full p-sm text-body-md border border-bloom-coral/30 rounded-md bg-paper focus:outline-none focus:ring-2 focus:ring-bloom-coral/20 resize-none h-20"
                      autoFocus
                    />
                    <div className="flex gap-md">
                      <button
                        onClick={() => {
                          setRejectingSerials(prev => {
                            const copy = { ...prev };
                            delete copy[req.serial_number];
                            return copy;
                          });
                        }}
                        className="flex-1 py-sm button-label-md text-graphite border border-fog rounded-md hover:bg-cloud transition"
                      >
                        {t('modal.cancel') || 'Hủy'}
                      </button>
                      <button
                        onClick={() => {
                          const reason = rejectingSerials[req.serial_number];
                          handleRejectQuickReg(req, reason);
                          setRejectingSerials(prev => {
                            const copy = { ...prev };
                            delete copy[req.serial_number];
                            return copy;
                          });
                        }}
                        className="flex-1 py-sm button-label-md bg-bloom-coral text-white rounded-md shadow-soft-lift hover:bg-bloom-wine transition"
                      >
                        {t('common.confirm') || 'Xác nhận'}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="p-md bg-cloud border-t border-fog flex gap-md">
                    <button
                      onClick={() => setRejectingSerials(prev => ({ ...prev, [req.serial_number]: '' }))}
                      className="flex-1 py-sm button-label-md text-bloom-deep border border-bloom-coral/30 rounded-md hover:bg-bloom-rose/20 transition"
                    >
                      {t('dashboard.reject')}
                    </button>
                    <button
                      onClick={() => handleApproveQuickReg(req)}
                      className="flex-2 py-sm button-label-md bg-primary text-on-ink rounded-md shadow-soft-lift hover:bg-primary-deep transition"
                    >
                      {t('dashboard.authorize_entry')}
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default DashboardPage;
