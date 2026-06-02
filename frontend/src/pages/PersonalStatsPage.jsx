import React, { useEffect, useState } from 'react';
import { accessService } from '../services/accessService';
import { useAuthStore } from '../store/authStore';
import LoadingSpinner from '../components/LoadingSpinner';
import { useLanguageStore } from '../store/languageStore';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Cell } from 'recharts';
import { PieChart, Clock, Calendar, TrendingUp, Monitor, ShieldCheck, History, ChevronLeft, ChevronRight, Activity, ArrowRight } from 'lucide-react';

const PersonalStatsPage = () => {
    const { t } = useLanguageStore();
    const [stats, setStats] = useState(null);
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);

    const getStartOfWeek = (date) => {
        const d = new Date(date);
        const day = d.getDay();
        const diff = d.getDate() - day + (day === 0 ? -6 : 1);
        d.setDate(diff);
        d.setHours(0, 0, 0, 0);
        return d;
    };

    const [currentWeekStart, setCurrentWeekStart] = useState(getStartOfWeek(new Date()));

    const { socket, user } = useAuthStore();

    useEffect(() => {
        Promise.all([fetchStats(), fetchHistory()]).finally(() => setLoading(false));
    }, []);

    useEffect(() => {
        if (socket) {
            const handleUpdate = () => {
                fetchStats();
                fetchHistory();
            };
            socket.on('occupancy_update', handleUpdate);
            return () => socket.off('occupancy_update', handleUpdate);
        }
    }, [socket]);

    const fetchStats = async () => {
        try {
            const data = await accessService.getPersonalStats();
            setStats(data);
        } catch (err) {
            console.error("Failed to fetch personal stats", err);
        }
    };

    const fetchHistory = async () => {
        try {
            const data = await accessService.getAccessHistory();
            setHistory(data.history || []);
        } catch (err) {
            console.error("Failed to fetch access history", err);
        }
    };

    const getDuration = (checkIn, checkOut) => {
        if (!checkOut) return null;
        const diff = new Date(checkOut) - new Date(checkIn);
        const hours = Math.floor(diff / 3600000);
        const minutes = Math.floor((diff % 3600000) / 60000);
        if (hours === 0) return `${minutes}m`;
        return `${hours}h ${minutes}m`;
    };

    const groupHistoryByDate = (historyList) => {
        if (!historyList) return {};
        const grouped = {};
        historyList.forEach(log => {
            const dateStr = new Date(log.check_in_time).toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
            if (!grouped[dateStr]) {
                grouped[dateStr] = [];
            }
            grouped[dateStr].push(log);
        });
        return grouped;
    };

    if (loading) return <div className="min-h-screen bg-canvas flex items-center justify-center"><LoadingSpinner /></div>;

    const currentWeekEnd = new Date(currentWeekStart);
    currentWeekEnd.setDate(currentWeekEnd.getDate() + 6);
    currentWeekEnd.setHours(23, 59, 59, 999);

    const filteredHistory = history.filter(log => {
        const logDate = new Date(log.check_in_time);
        return logDate >= currentWeekStart && logDate <= currentWeekEnd;
    });

    const prevWeek = () => {
        const newDate = new Date(currentWeekStart);
        newDate.setDate(newDate.getDate() - 7);
        setCurrentWeekStart(newDate);
    };

    const nextWeek = () => {
        const newDate = new Date(currentWeekStart);
        newDate.setDate(newDate.getDate() + 7);
        setCurrentWeekStart(newDate);
    };

    const chartData = stats?.durations?.map(d => ({
        date: new Date(d.check_in_time).toLocaleDateString('en-US', { day: '2-digit', month: '2-digit' }),
        hours: parseFloat(d.duration_hours).toFixed(1)
    })).reverse() || [];

    const isCurrentlyInRoom = history.length > 0 && history[0].status === 'checked_in';

    return (
        <div className="min-h-screen bg-canvas text-ink font-sans p-xl">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-xl mb-xxl">
                <div>
                    <h1 className="text-display-md tracking-tight mb-xs">{t('stats.performance_analytics')}</h1>
                    <p className="text-body-md text-charcoal">{t('stats.performance_desc')}</p>
                </div>
                <div className="flex items-center gap-md bg-paper border border-fog p-sm rounded-md shadow-soft-lift">
                    <div className="w-12 h-12 rounded-full bg-primary text-on-ink flex items-center justify-center font-bold text-xl overflow-hidden border border-fog">
                        {user?.avatar_url ? (
                            <img src={user.avatar_url} alt={user.full_name} className="w-full h-full object-cover" />
                        ) : (
                            user?.full_name?.charAt(0).toUpperCase()
                        )}
                    </div>
                    <div>
                        <p className="text-body-emphasis text-ink leading-none">{user?.full_name}</p>
                        <p className="text-caption-md text-charcoal mt-xs font-mono">{user?.employee_code || 'HCL_ADMIN'}</p>
                    </div>
                </div>
            </div>

            {/* Core Metrics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-xl mb-xxl">
                <div className="bg-paper border border-fog p-xl rounded-xl shadow-soft-lift">
                    <div className="flex justify-between items-start mb-md">
                        <p className="text-caption-bold text-graphite uppercase tracking-widest">{t('total_stays')}</p>
                        <Calendar size={18} className="text-primary" />
                    </div>
                    <p className="text-display-xs font-bold text-ink">{stats?.totalStays || 0}</p>
                    <p className="text-caption-md text-charcoal mt-xs">{t('total_stays_desc')}</p>
                </div>

                <div className="bg-paper border border-fog p-xl rounded-xl shadow-soft-lift">
                    <div className="flex justify-between items-start mb-md">
                        <p className="text-caption-bold text-graphite uppercase tracking-widest">{t('mean_duration')}</p>
                        <Clock size={18} className="text-primary" />
                    </div>
                    <p className="text-display-xs font-bold text-ink">{stats?.avgDurationHours || 0} <span className="text-body-md text-charcoal">{t('hours')}</span></p>
                    <p className="text-caption-md text-charcoal mt-xs">{t('mean_duration_desc')}</p>
                </div>

                <div className="bg-paper border border-fog p-xl rounded-xl shadow-soft-lift">
                    <div className="flex justify-between items-start mb-md">
                        <p className="text-caption-bold text-graphite uppercase tracking-widest">{t('engagement')}</p>
                        <TrendingUp size={18} className="text-green-600" />
                    </div>
                    <p className="text-display-xs font-bold text-green-600">Optimal</p>
                    <p className="text-caption-md text-charcoal mt-xs">{t('engagement_desc')}</p>
                </div>

                <div className="bg-paper border border-fog p-xl rounded-xl shadow-soft-lift relative overflow-hidden">
                    <div className="flex justify-between items-start mb-md">
                        <p className="text-caption-bold text-graphite uppercase tracking-widest">{t('presence_state')}</p>
                        <ShieldCheck size={18} className={isCurrentlyInRoom ? 'text-primary' : 'text-charcoal'} />
                    </div>
                    {isCurrentlyInRoom ? (
                        <div>
                            <p className="text-display-xs font-bold text-primary">{t('active')}</p>
                            <p className="text-caption-md text-primary mt-xs font-bold">{t('in_lab')}</p>
                        </div>
                    ) : (
                        <div>
                            <p className="text-display-xs font-bold text-charcoal">{t('inactive')}</p>
                            <p className="text-caption-md text-charcoal mt-xs">{t('external_facility')}</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Visualization & Recent Activity */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-xl mb-xxl">
                <div className="lg:col-span-2 bg-paper p-xl rounded-xl shadow-floating border border-fog">
                    <div className="flex justify-between items-center mb-xl">
                        <div className="flex items-center gap-xs text-primary">
                            <Activity size={20} />
                            <h2 className="text-body-emphasis uppercase tracking-widest">{t('temporal_engagement')}</h2>
                        </div>
                        <span className="text-caption-bold text-primary bg-primary/5 px-sm py-xxs rounded border border-primary/10">{t('past_7_days')}</span>
                    </div>
                    <div className="h-[350px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" opacity={0.5} />
                                <XAxis dataKey="date" stroke="#6b7280" fontSize={11} tickLine={false} axisLine={false} dy={10} />
                                <YAxis stroke="#6b7280" fontSize={11} tickLine={false} axisLine={false} />
                                <Tooltip
                                    cursor={{ fill: 'rgba(102, 16, 242, 0.05)' }}
                                    contentStyle={{ backgroundColor: '#fff', borderRadius: '4px', border: '1px solid #e5e7eb', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                    labelStyle={{ fontWeight: 'bold', marginBottom: '4px' }}
                                    itemStyle={{ color: '#6610f2', fontWeight: 'bold', fontSize: '12px' }}
                                />
                                <Bar dataKey="hours" radius={[2, 2, 0, 0]} barSize={40}>
                                    {chartData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill="#6610f2" />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="bg-paper p-xl rounded-xl shadow-floating border border-fog flex flex-col">
                    <div className="flex items-center gap-xs text-primary mb-xl">
                        <History size={20} />
                        <h2 className="text-body-emphasis uppercase tracking-widest">{t('recent_events')}</h2>
                    </div>
                    <div className="space-y-md overflow-y-auto pr-xs flex-1 max-h-[350px]">
                        {stats?.recentActivity?.map((activity) => (
                            <div key={activity.log_id} className="p-md bg-cloud rounded-md border border-fog hover:border-primary transition-colors">
                                <div className="flex justify-between items-start mb-sm">
                                    <p className="text-caption-bold text-ink">
                                        {activity.event_type === 'check_in' ? t('lab_inbound') : t('lab_outbound')}
                                    </p>
                                    <span className="text-[10px] font-mono text-charcoal bg-fog px-xs py-xxs rounded">#{activity.log_id}</span>
                                </div>
                                <p className="text-caption-md text-charcoal flex items-center gap-xs">
                                    <Clock size={12} />
                                    {new Date(activity.created_at).toLocaleString()}
                                </p>
                            </div>
                        ))}
                        {!stats?.recentActivity?.length && (
                            <div className="h-full flex flex-col items-center justify-center text-graphite opacity-50 italic py-xxl">
                                <History size={32} className="mb-sm" />
                                <p className="text-caption-md">{t('no_activity')}</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Detailed Historical Ledger */}
            <div className="bg-paper p-xl rounded-xl shadow-floating border border-fog">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-xl mb-xl pb-xl border-b border-fog">
                    <div className="flex items-center gap-xs text-primary">
                        <Activity size={24} />
                        <h2 className="text-display-xs text-ink">{t('access_chronology')}</h2>
                    </div>

                    <div className="flex items-center gap-sm bg-cloud border border-fog p-xxs rounded-md">
                        <button onClick={prevWeek} className="p-xs hover:bg-fog rounded transition text-graphite hover:text-primary"><ChevronLeft size={20} /></button>
                        <div className="px-md text-caption-bold text-ink min-w-[220px] text-center">
                            {currentWeekStart.toLocaleDateString('en-US', { day: '2-digit', month: 'short' })} - {currentWeekEnd.toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </div>
                        <button onClick={nextWeek} className="p-xs hover:bg-fog rounded transition text-graphite hover:text-primary"><ChevronRight size={20} /></button>
                    </div>
                </div>

                {filteredHistory.length === 0 ? (
                    <div className="py-xxl text-center border-2 border-dashed border-fog rounded-xl">
                        <Clock size={48} className="text-charcoal mx-auto mb-md opacity-20" />
                        <h3 className="text-body-emphasis text-ink">{t('zero_data')}</h3>
                        <p className="text-caption-md text-charcoal">{t('no_records_desc')}</p>
                    </div>
                ) : (
                    <div className="space-y-xxl">
                        {Object.entries(groupHistoryByDate(filteredHistory)).map(([date, logs]) => (
                            <div key={date}>
                                <div className="flex items-center gap-md mb-xl">
                                    <div className="bg-primary/5 text-primary px-md py-xxs rounded border border-primary/10 text-caption-bold uppercase tracking-widest flex items-center gap-xs">
                                        <Calendar size={14} /> {date}
                                    </div>
                                    <div className="h-px flex-1 bg-fog"></div>
                                </div>

                                <div className="space-y-md">
                                    {logs.map((log) => (
                                        <div key={log.id} className="bg-cloud border border-fog rounded-xl p-xl flex flex-col md:flex-row items-center justify-between group hover:border-primary transition-all duration-300">
                                            <div className="flex flex-col gap-sm w-full md:w-32 mb-md md:mb-0">
                                                <span className="text-[10px] font-bold text-graphite bg-fog px-sm py-xxs rounded self-start">{t('session')} #{log.id}</span>
                                                <span className={`px-sm py-xxs rounded-full text-[10px] font-bold uppercase tracking-widest self-start border ${
                                                    log.status === 'checked_in' ? 'bg-green-50 text-green-600 border-green-100' : 'bg-charcoal text-on-ink border-charcoal'
                                                }`}>
                                                    {log.status === 'checked_in' ? t('active') : t('released')}
                                                </span>
                                            </div>

                                            <div className="flex flex-1 items-center justify-center gap-xl w-full md:w-auto px-xl">
                                                <div className="flex flex-col items-center gap-xs">
                                                    <span className="text-[10px] font-bold text-graphite uppercase tracking-widest flex items-center gap-xxs"><Clock size={12} className="text-green-600" /> {t('inbound')}</span>
                                                    <span className="text-body-emphasis font-mono text-ink bg-paper px-md py-sm rounded border border-fog shadow-sm">
                                                        {new Date(log.check_in_time).toLocaleTimeString('en-US', { hour12: false })}
                                                    </span>
                                                </div>
                                                <ArrowRight size={16} className="text-charcoal mt-md" />
                                                <div className="flex flex-col items-center gap-xs">
                                                    <span className="text-[10px] font-bold text-graphite uppercase tracking-widest flex items-center gap-xxs"><Clock size={12} className="text-red-500" /> {t('outbound')}</span>
                                                    <span className={`text-body-emphasis font-mono px-md py-sm rounded border shadow-sm ${log.check_out_time ? 'text-ink bg-paper border-fog' : 'text-graphite bg-cloud border-fog border-dashed italic'}`}>
                                                        {log.check_out_time ? new Date(log.check_out_time).toLocaleTimeString('en-US', { hour12: false }) : '--:--:--'}
                                                    </span>
                                                </div>
                                            </div>

                                            <div className="w-full md:w-48 mt-md md:mt-0 flex flex-row md:flex-col items-center md:items-end justify-between md:justify-center border-t md:border-t-0 md:border-l border-fog pt-md md:pt-0 md:pl-xl">
                                                <span className="text-caption-bold text-graphite uppercase tracking-widest mb-xxs">{t('telemetry')}</span>
                                                {log.check_out_time ? (
                                                    <span className="text-body-emphasis text-primary bg-primary/5 px-md py-sm rounded border border-primary/10">
                                                        {getDuration(log.check_in_time, log.check_out_time)}
                                                    </span>
                                                ) : (
                                                    <span className="text-caption-bold text-green-600 bg-green-50 px-md py-sm rounded border border-green-100 animate-pulse">
                                                        {t('monitoring')}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default PersonalStatsPage;
