import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  Search, 
  Calendar, 
  Clock, 
  RefreshCw, 
  Laptop, 
  User, 
  Eye, 
  X, 
  Maximize2,
  FileSpreadsheet,
  FileText,
  ShieldCheck,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { accessService } from '../services/accessService';
import Alert from '../components/Alert';
import LoadingSpinner from '../components/LoadingSpinner';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';

const AuditorDashboard = () => {
  const { t } = useTranslation();
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters state
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [startHour, setStartHour] = useState('');
  const [endHour, setEndHour] = useState('');
  const [employeeSearch, setEmployeeSearch] = useState('');
  const [deviceSearch, setDeviceSearch] = useState('');

  // Zoom Modal state
  const [zoomPhoto, setZoomPhoto] = useState(null);

  const fetchSessions = useCallback(async (filters = {}) => {
    setLoading(true);
    try {
      const data = await accessService.getAuditorSessions(filters);
      setSessions(data.sessions || []);
      setError(null);
    } catch (err) {
      console.error('Failed to load auditor sessions:', err);
      setError(t('errors.error_loading_data', 'Không thể tải dữ liệu ra vào.'));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  const getActiveFilters = () => {
    const filters = {};
    if (startDate) filters.startDate = startDate;
    if (endDate) filters.endDate = endDate;
    if (startHour) filters.startHour = startHour;
    if (endHour) filters.endHour = endHour;
    if (employeeSearch) filters.employeeSearch = employeeSearch;
    if (deviceSearch) filters.deviceSearch = deviceSearch;
    return filters;
  };

  const handleApplyFilters = (e) => {
    e.preventDefault();
    fetchSessions(getActiveFilters());
  };

  const handleResetFilters = () => {
    setStartDate('');
    setEndDate('');
    setStartHour('');
    setEndHour('');
    setEmployeeSearch('');
    setDeviceSearch('');
    fetchSessions({});
  };

  // Export to Excel
  const exportToExcel = () => {
    const wsData = sessions.map((session, index) => {
      const checkInTime = session.check_in_at ? new Date(session.check_in_at).toLocaleString() : '-';
      const checkOutTime = session.check_out_at ? new Date(session.check_out_at).toLocaleString() : (session.status === 'in' ? 'Đang trong phòng' : '-');
      const statusText = session.status === 'in' 
        ? t('sessions.in_progress', 'Trong phòng') 
        : session.status === 'out' 
        ? t('sessions.closed', 'Đã ra') 
        : t('sessions.forced', 'Đóng cưỡng bức');
      
      const carriedDevices = session.devices && session.devices.length > 0
        ? session.devices.map(d => `${d.brand} ${d.model_name} (S/N: ${d.serial_number})`).join(', ')
        : 'None';

      return {
        'No.': index + 1,
        'Employee Name': session.full_name,
        'Employee Code': session.employee_code,
        'Username': session.username,
        'Check-In Timestamp': checkInTime,
        'Check-Out Timestamp': checkOutTime,
        'Session Status': statusText,
        'Auth Mode': session.auth_method,
        'Assets Carried': carriedDevices,
        'Audit Notes/Reason': session.notes || '',
        'Ingress Photo URL': session.entry_photo ? (session.entry_photo.startsWith('data:') ? 'Captured (Base64)' : session.entry_photo) : 'No photo',
        'Egress Photo URL': session.exit_photo ? (session.exit_photo.startsWith('data:') ? 'Captured (Base64)' : session.exit_photo) : 'No photo'
      };
    });

    const ws = XLSX.utils.json_to_sheet(wsData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "ANZ_Compliance_Ledger");
    
    // Manual robust Blob download to ensure correct filename and extension across all browsers
    const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([wbout], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `ANZ_Physical_Access_Audit_${new Date().toISOString().slice(0, 10)}.xlsx`;
    document.body.appendChild(link);
    link.click();
    setTimeout(() => {
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }, 100);
  };

  // Export to PDF — dùng html2canvas để render đúng tiếng Việt
  const exportToPDF = async () => {
    // 1. Build HTML content với font hỗ trợ Unicode và style rõ ràng
    const runDate = new Date().toLocaleString();
    let filterString = 'None (All records)';
    const parts = [];
    if (startDate || endDate) parts.push(`Date: [${startDate || 'Any'} → ${endDate || 'Any'}]`);
    if (startHour || endHour) parts.push(`Hours: [${startHour || '00:00'} → ${endHour || '23:59'}]`);
    if (employeeSearch) parts.push(`Employee: "${employeeSearch}"`);
    if (deviceSearch) parts.push(`Asset/Auth: "${deviceSearch}"`);
    if (parts.length > 0) filterString = parts.join(' | ');

    const tableRows = sessions.map((session, idx) => {
      const checkInStr = session.check_in_at ? new Date(session.check_in_at).toLocaleString() : '-';
      const checkOutStr = session.check_out_at
        ? new Date(session.check_out_at).toLocaleString()
        : (session.status === 'in' ? 'In Progress' : '-');
      const carriedAssets = session.devices && session.devices.length > 0
        ? session.devices.map(d => `${d.brand} ${d.model_name}`).join(', ')
        : 'None';
      const ingressText = session.entry_photo ? 'Captured' : 'None';
      const egressText = session.exit_photo ? 'Captured' : 'None';
      const rowBg = idx % 2 === 0 ? '#ffffff' : '#f8fafc';
      
      return `
        <tr style="background:${rowBg}; border-bottom: 1px solid #e2e8f0;">
          <td style="padding: 10px 12px; text-align: center; font-size: 11px; line-height: 1.5; vertical-align: middle;">${idx + 1}</td>
          <td style="padding: 10px 12px; font-weight: 600; font-size: 11px; line-height: 1.5; vertical-align: middle; color: #0f172a;">${session.full_name || ''}</td>
          <td style="padding: 10px 12px; font-size: 11px; line-height: 1.5; vertical-align: middle; font-family: monospace; color: #475569;">${session.employee_code || ''}</td>
          <td style="padding: 10px 12px; font-size: 11px; line-height: 1.5; vertical-align: middle; color: #334155;">${checkInStr}</td>
          <td style="padding: 10px 12px; font-size: 11px; line-height: 1.5; vertical-align: middle; color: #334155;">${checkOutStr}</td>
          <td style="padding: 10px 12px; font-size: 11px; line-height: 1.5; vertical-align: middle; font-weight: 600; color: #0284c7; text-transform: uppercase;">${session.auth_method || ''}</td>
          <td style="padding: 10px 12px; font-size: 11px; line-height: 1.5; vertical-align: middle; color: #475569; max-width: 180px; word-wrap: break-word; white-space: normal;">${carriedAssets}</td>
          <td style="padding: 10px 12px; text-align: center; font-size: 11px; line-height: 1.5; vertical-align: middle; color: #334155;">${ingressText}</td>
          <td style="padding: 10px 12px; text-align: center; font-size: 11px; line-height: 1.5; vertical-align: middle; color: #334155;">${egressText}</td>
        </tr>`;
    }).join('');

    const htmlContent = `
      <div id="pdf-export-root" style="font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; width: 1120px; background: #f8fafc; padding: 0; box-sizing: border-box;">
        <!-- Header bar -->
        <div style="background: #002c77; color: #ffffff; padding: 18px 24px; box-sizing: border-box;">
          <div style="font-size: 18px; font-weight: 700; letter-spacing: 0.5px; line-height: 1.3;">HCLTech x ANZ Strategic Alliance - Innovation Nexus</div>
          <div style="font-size: 11px; color: #cbd5e1; margin-top: 4px; font-weight: 500;">HIGH-INTEGRITY E2E PHYSICAL ACCESS AUDIT LEDGER</div>
          <div style="font-size: 11px; color: #cbd5e1; float: right; margin-top: -15px; font-weight: 500;">Run Date: ${runDate}</div>
        </div>
        
        <!-- Title + meta -->
        <div style="padding: 20px 24px 10px 24px; box-sizing: border-box;">
          <div style="font-size: 16px; font-weight: 700; color: #0f172a; margin-bottom: 6px; line-height: 1.3;">${t('auditor.dashboard_title', 'Kiểm soát Lịch sử Ra vào')}</div>
          <div style="font-size: 11px; color: #64748b; font-weight: 500; line-height: 1.4;">Filters Applied: <span style="color: #334155; font-weight: 600;">${filterString}</span></div>
          <div style="font-size: 11px; color: #64748b; font-weight: 500; line-height: 1.4; margin-top: 2px;">Total Audited Entries: <span style="color: #334155; font-weight: 600;">${sessions.length}</span></div>
        </div>
        
        <!-- Table -->
        <div style="padding: 10px 24px 24px 24px; box-sizing: border-box;">
          <table style="width: 100%; border-collapse: collapse; background: #ffffff; border: 1px solid #e2e8f0; box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.05);">
            <thead>
              <tr style="background: #002c77; color: #ffffff;">
                <th style="padding: 12px; text-align: center; font-size: 11px; font-weight: 700; width: 40px; border-bottom: 2px solid #e2e8f0;">No.</th>
                <th style="padding: 12px; text-align: left; font-size: 11px; font-weight: 700; width: 160px; border-bottom: 2px solid #e2e8f0;">${t('auditor.col_employee_name', 'Nhân viên')}</th>
                <th style="padding: 12px; text-align: left; font-size: 11px; font-weight: 700; width: 90px; border-bottom: 2px solid #e2e8f0;">${t('auditor.col_employee_code', 'Mã NV')}</th>
                <th style="padding: 12px; text-align: left; font-size: 11px; font-weight: 700; width: 160px; border-bottom: 2px solid #e2e8f0;">${t('auditor.col_checkin_time', 'Thời gian Vào')}</th>
                <th style="padding: 12px; text-align: left; font-size: 11px; font-weight: 700; width: 160px; border-bottom: 2px solid #e2e8f0;">${t('auditor.col_checkout_time', 'Thời gian Ra')}</th>
                <th style="padding: 12px; text-align: left; font-size: 11px; font-weight: 700; width: 110px; border-bottom: 2px solid #e2e8f0;">${t('auditor.col_auth_method', 'Phương thức')}</th>
                <th style="padding: 12px; text-align: left; font-size: 11px; font-weight: 700; width: 220px; border-bottom: 2px solid #e2e8f0;">${t('auditor.col_devices_carried', 'Thiết bị mang theo')}</th>
                <th style="padding: 12px; text-align: center; font-size: 11px; font-weight: 700; width: 110px; border-bottom: 2px solid #e2e8f0;">Ingress Biometrics</th>
                <th style="padding: 12px; text-align: center; font-size: 11px; font-weight: 700; width: 110px; border-bottom: 2px solid #e2e8f0;">Egress Biometrics</th>
              </tr>
            </thead>
            <tbody>
              ${tableRows}
            </tbody>
          </table>
        </div>
      </div>`;

    // 2. Tạo container ẩn nhưng vẫn trong luồng layout chính để render chính xác font và kích thước
    const container = document.createElement('div');
    container.style.cssText = 'position: absolute; left: 0; top: 0; width: 1120px; opacity: 0.01; pointer-events: none; z-index: -9999;';
    container.innerHTML = htmlContent;
    document.body.appendChild(container);

    try {
      // 3. Chụp canvas với scale cao hơn để chữ cực kỳ sắc nét
      const canvas = await html2canvas(container.querySelector('#pdf-export-root'), {
        scale: 2,
        useCORS: true,
        backgroundColor: '#f8fafc',
        logging: false,
      });

      // 4. Tạo PDF từ canvas
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
      const pageW = pdf.internal.pageSize.getWidth();
      const pageH = pdf.internal.pageSize.getHeight();

      const imgW = pageW;
      const imgH = (canvas.height * imgW) / canvas.width;

      if (imgH <= pageH) {
        pdf.addImage(imgData, 'PNG', 0, 0, imgW, imgH);
      } else {
        // Chia trang nếu nội dung dài
        let yOffset = 0;
        while (yOffset < imgH) {
          if (yOffset > 0) pdf.addPage();
          pdf.addImage(imgData, 'PNG', 0, -yOffset, imgW, imgH);
          yOffset += pageH;
        }
      }

      pdf.save(`ANZ_Compliance_Report_${new Date().toISOString().slice(0, 10)}.pdf`);
    } finally {
      document.body.removeChild(container);
    }
  };

  const getStatusBadge = (session) => {
    switch (session.status) {
      case 'in':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-600 border border-emerald-100 shadow-sm animate-pulse">
            <Clock size={12} className="mr-1" />
            {t('sessions.in_progress', 'Trong phòng')}
          </span>
        );
      case 'out':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-brand-blue border border-blue-100 shadow-sm">
            <CheckCircle2 size={12} className="mr-1" />
            {t('sessions.closed', 'Đã ra')}
          </span>
        );
      case 'forced_close':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-600 border border-amber-100 shadow-sm">
            <AlertCircle size={12} className="mr-1" />
            {t('sessions.forced', 'Đóng cưỡng bức')}
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-brand-slate text-ink font-sans p-xl space-y-xl animate-in fade-in duration-500">
      
      {/* Header section with HCL / ANZ Brand Identity */}
      <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-md border-b border-fog pb-lg">
        <div>
          <h1 className="text-display-md font-extrabold tracking-tight text-black">
            {t('auditor.dashboard_title', 'Đối soát Lịch sử Ra vào')}
          </h1>
          <p className="text-body-md text-graphite mt-xs max-w-3xl">
            {t('auditor.dashboard_subtitle', 'Trang đối soát độc lập, giám sát dữ liệu ra vào và phương thức xác thực.')}
          </p>
        </div>
        
        {/* Reports Trigger */}
        <div className="flex flex-wrap gap-sm">
          <button 
            onClick={exportToExcel}
            className="flex items-center gap-xs px-xl py-sm bg-white hover:bg-slate-50 border border-fog text-brand-navy font-bold rounded-lg transition-all active:scale-95 shadow-soft-lift"
          >
            <FileSpreadsheet size={18} className="text-emerald-600" />
            <span>{t('auditor.export_excel', 'Xuất báo cáo Excel')}</span>
          </button>

          <button 
            onClick={exportToPDF}
            className="flex items-center gap-xs px-xl py-sm bg-brand-navy hover:bg-brand-navy/90 text-white font-bold rounded-lg transition-all active:scale-95 shadow-floating"
          >
            <FileText size={18} />
            <span>{t('auditor.export_pdf', 'Xuất báo cáo PDF')}</span>
          </button>
        </div>
      </div>

      {error && <Alert type="error" message={error} onClose={() => setError(null)} />}

      {/* Advanced Query Builder (Filters) */}
      <form onSubmit={handleApplyFilters} className="bg-white p-xl rounded-2xl border border-fog shadow-soft-lift space-y-lg">
        <div className="flex items-center justify-between">
          <h3 className="text-caption-bold text-black uppercase tracking-widest font-extrabold flex items-center space-x-xs">
            <span className="w-2 h-2 rounded-full bg-brand-purple"></span>
            <span>{t('auditor.advanced_filter_title')}</span>
          </h3>
          <button 
            type="button"
            onClick={handleResetFilters}
            className="text-caption-md font-bold text-brand-purple hover:text-brand-navy hover:underline transition-colors flex items-center gap-xxs"
          >
            <RefreshCw size={14} />
            <span>{t('auditor.clear_filters')}</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-md">
          {/* Start Date */}
          <div className="space-y-xxs">
            <label className="text-[10px] font-bold text-graphite uppercase tracking-wider block">{t('auditor.from_date')}</label>
            <div className="relative">
              <Calendar className="absolute left-md top-1/2 -translate-y-1/2 text-steel" size={16} />
              <input 
                type="date" 
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full bg-brand-slate border border-fog rounded-xl py-sm pl-11 pr-md text-caption-md font-bold text-brand-navy focus:outline-none focus:border-brand-navy focus:bg-white transition-all"
              />
            </div>
          </div>

          {/* End Date */}
          <div className="space-y-xxs">
            <label className="text-[10px] font-bold text-graphite uppercase tracking-wider block">{t('auditor.to_date')}</label>
            <div className="relative">
              <Calendar className="absolute left-md top-1/2 -translate-y-1/2 text-steel" size={16} />
              <input 
                type="date" 
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full bg-brand-slate border border-fog rounded-xl py-sm pl-11 pr-md text-caption-md font-bold text-brand-navy focus:outline-none focus:border-brand-navy focus:bg-white transition-all"
              />
            </div>
          </div>

          {/* Start Hour */}
          <div className="space-y-xxs">
            <label className="text-[10px] font-bold text-graphite uppercase tracking-wider block">{t('auditor.ingress_from_hour')}</label>
            <div className="relative">
              <Clock className="absolute left-md top-1/2 -translate-y-1/2 text-steel" size={16} />
              <input 
                type="time" 
                value={startHour}
                onChange={(e) => setStartHour(e.target.value)}
                className="w-full bg-brand-slate border border-fog rounded-xl py-sm pl-11 pr-md text-caption-md font-bold text-brand-navy focus:outline-none focus:border-brand-navy focus:bg-white transition-all"
              />
            </div>
          </div>

          {/* End Hour */}
          <div className="space-y-xxs">
            <label className="text-[10px] font-bold text-graphite uppercase tracking-wider block">{t('auditor.ingress_to_hour')}</label>
            <div className="relative">
              <Clock className="absolute left-md top-1/2 -translate-y-1/2 text-steel" size={16} />
              <input 
                type="time" 
                value={endHour}
                onChange={(e) => setEndHour(e.target.value)}
                className="w-full bg-brand-slate border border-fog rounded-xl py-sm pl-11 pr-md text-caption-md font-bold text-brand-navy focus:outline-none focus:border-brand-navy focus:bg-white transition-all"
              />
            </div>
          </div>

          {/* Employee Search */}
          <div className="space-y-xxs">
            <label className="text-[10px] font-bold text-graphite uppercase tracking-wider block">{t('auditor.employee_label')}</label>
            <div className="relative">
              <User className="absolute left-md top-1/2 -translate-y-1/2 text-steel" size={16} />
              <input 
                type="text" 
                placeholder="VD: AUD001..."
                value={employeeSearch}
                onChange={(e) => setEmployeeSearch(e.target.value)}
                className="w-full bg-brand-slate border border-fog rounded-xl py-sm pl-11 pr-md text-caption-md text-brand-navy placeholder:text-steel focus:outline-none focus:border-brand-navy focus:bg-white transition-all"
              />
            </div>
          </div>

          {/* Device / Auth method Search */}
          <div className="space-y-xxs">
            <label className="text-[10px] font-bold text-graphite uppercase tracking-wider block">{t('auditor.device_label')}</label>
            <div className="relative">
              <Laptop className="absolute left-md top-1/2 -translate-y-1/2 text-steel" size={16} />
              <input 
                type="text" 
                placeholder="VD: face, Apple..."
                value={deviceSearch}
                onChange={(e) => setDeviceSearch(e.target.value)}
                className="w-full bg-brand-slate border border-fog rounded-xl py-sm pl-11 pr-md text-caption-md text-brand-navy placeholder:text-steel focus:outline-none focus:border-brand-navy focus:bg-white transition-all"
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-xs">
          <button 
            type="submit" 
            className="flex items-center justify-center space-x-sm px-xxl py-sm bg-brand-blue hover:bg-brand-blue/90 text-white rounded-xl text-caption-bold font-bold transition-all shadow-soft-lift active:scale-95"
          >
            <Search size={16} />
            <span>{t('auditor.apply_query')}</span>
          </button>
        </div>
      </form>

      {/* Main Ledger Table */}
      <div className="bg-white border border-fog rounded-2xl overflow-hidden shadow-soft-lift">
        
        {/* Table Header Summary info */}
        <div className="px-xl py-md bg-slate-50 border-b border-fog flex items-center justify-between">
          <span className="text-caption-bold text-black font-extrabold uppercase tracking-wider">
            {t('auditor.access_ledger')}
          </span>
          <div className="flex items-center space-x-md">
            <span className="text-caption-md text-graphite font-medium">
              {t('auditor.found_sessions', { count: sessions.length })}
            </span>
            <button 
              onClick={() => fetchSessions(getActiveFilters())}
              className="p-xs text-graphite hover:text-brand-navy hover:bg-slate-200 rounded-lg transition-all active:scale-90"
              title={t('auditor.sync')}
            >
              <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/55 text-[10px] font-bold text-graphite uppercase tracking-[0.08em] border-b border-fog">
                <th className="px-xl py-md text-center w-12">No.</th>
                <th className="px-xl py-md">{t('auditor.col_employee_name', 'Nhân viên')}</th>
                <th className="px-xl py-md">{t('auditor.col_checkin_time', 'Thời gian Vào')}</th>
                <th className="px-xl py-md">{t('auditor.col_checkout_time', 'Thời gian Ra')}</th>
                <th className="px-xl py-md">{t('auditor.col_auth_method', 'Phương thức xác thực')}</th>
                <th className="px-xl py-md">{t('auditor.col_devices_carried', 'Thiết bị mang theo')}</th>
                <th className="px-xl py-md text-center">{t('auditor.col_auth_photo', 'Ảnh chụp')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-fog text-brand-navy">
              {loading ? (
                <tr>
                  <td colSpan="7" className="px-xl py-xxxl text-center">
                    <LoadingSpinner />
                  </td>
                </tr>
              ) : sessions.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-xl py-xxxl text-center text-steel italic">
                    <div className="flex flex-col items-center justify-center space-y-md">
                      <ShieldCheck size={48} className="text-slate-300" />
                      <p className="text-body-md text-graphite font-bold">{t('auditor.no_sessions_found')}</p>
                    </div>
                  </td>
                </tr>
              ) : (
                sessions.map((session, index) => {
                  const checkInTime = new Date(session.check_in_at);
                  const checkOutTime = session.check_out_at ? new Date(session.check_out_at) : null;
                  
                  return (
                    <tr key={session.session_id} className="hover:bg-slate-50/50 transition-colors group">
                      {/* Index */}
                      <td className="px-xl py-lg text-center font-mono text-caption-bold text-graphite">
                        {index + 1}
                      </td>

                      {/* Employee Info */}
                      <td className="px-xl py-lg">
                        <div className="flex items-center space-x-md">
                          <div className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center overflow-hidden border border-fog flex-shrink-0">
                            {session.avatar_url ? (
                              <img src={session.avatar_url} alt="" className="w-full h-full object-cover" />
                            ) : (
                              <User size={16} className="text-slate-400" />
                            )}
                          </div>
                          <div>
                            <div className="text-caption-bold text-brand-navy font-bold">{session.full_name}</div>
                            <div className="text-caption-sm text-graphite flex items-center font-semibold">
                              <span className="font-mono">{session.employee_code}</span>
                              <span className="mx-xs">•</span>
                              <span>@{session.username}</span>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Check-In */}
                      <td className="px-xl py-lg">
                        <div className="text-caption-bold text-brand-navy font-bold">
                          {checkInTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                        </div>
                        <div className="text-[11px] text-graphite font-medium">
                          {checkInTime.toLocaleDateString()}
                        </div>
                      </td>

                      {/* Check-Out / Status */}
                      <td className="px-xl py-lg">
                        {checkOutTime ? (
                          <>
                            <div className="text-caption-bold text-brand-navy font-bold">
                              {checkOutTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                            </div>
                            <div className="text-[11px] text-graphite font-medium">
                              {checkOutTime.toLocaleDateString()}
                            </div>
                          </>
                        ) : (
                          <div className="pt-xxs">{getStatusBadge(session)}</div>
                        )}
                      </td>

                      {/* Auth Method */}
                      <td className="px-xl py-lg">
                        <span className="text-caption-bold text-brand-navy font-bold uppercase tracking-wider">
                          {session.auth_method}
                        </span>
                      </td>

                      {/* Devices Carried */}
                      <td className="px-xl py-lg max-w-xs">
                        <div className="flex flex-wrap gap-xxs">
                          {session.devices && session.devices.length > 0 ? (
                            session.devices.map((device, devIdx) => (
                              <span 
                                key={devIdx} 
                                className="inline-flex items-center gap-xxs px-xs py-xxs rounded bg-brand-slate text-[10px] font-bold text-brand-navy border border-fog"
                                title={`S/N: ${device.serial_number}`}
                              >
                                <Laptop size={10} className="text-brand-blue" />
                                <span>{device.brand} {device.model_name}</span>
                              </span>
                            ))
                          ) : (
                            <span className="text-caption-sm text-graphite italic font-medium">{t('auditor.no_devices')}</span>
                          )}
                        </div>
                      </td>

                      {/* Authentication Photos (Zoom interactive) */}
                      <td className="px-xl py-lg">
                        <div className="flex items-center justify-center space-x-md">
                          {/* Checkin Photo */}
                          <div className="text-center">
                            {session.entry_photo ? (
                              <div className="relative group/thumb cursor-pointer" onClick={() => setZoomPhoto({
                                url: session.entry_photo,
                                title: t('auditor.checkin_photo', 'Ảnh Check-in'),
                                employee: session.full_name,
                                code: session.employee_code,
                                time: checkInTime.toLocaleString()
                              })}>
                                <img 
                                  src={session.entry_photo} 
                                  alt="entry" 
                                  className="w-12 h-12 rounded object-cover border border-fog shadow-inner group-hover/thumb:opacity-75 transition-all"
                                />
                                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover/thumb:opacity-100 bg-brand-navy/40 rounded transition-opacity">
                                  <Eye size={14} className="text-white" />
                                </div>
                                <span className="text-[9px] font-bold text-slate-400 block mt-xxs">{t('auditor.in_label')}</span>
                              </div>
                            ) : (
                              <span className="text-[10px] text-slate-400 italic block">No Photo</span>
                            )}
                          </div>

                          {/* Checkout Photo */}
                          <div className="text-center">
                            {session.exit_photo ? (
                              <div className="relative group/thumb cursor-pointer" onClick={() => setZoomPhoto({
                                url: session.exit_photo,
                                title: t('auditor.checkout_photo', 'Ảnh Check-out'),
                                employee: session.full_name,
                                code: session.employee_code,
                                time: checkOutTime ? checkOutTime.toLocaleString() : '-'
                              })}>
                                <img 
                                  src={session.exit_photo} 
                                  alt="exit" 
                                  className="w-12 h-12 rounded object-cover border border-fog shadow-inner group-hover/thumb:opacity-75 transition-all"
                                />
                                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover/thumb:opacity-100 bg-brand-navy/40 rounded transition-opacity">
                                  <Eye size={14} className="text-white" />
                                </div>
                                <span className="text-[9px] font-bold text-slate-400 block mt-xxs">{t('auditor.out_label')}</span>
                              </div>
                            ) : (
                              <span className="text-[10px] text-slate-400 italic block">No Photo</span>
                            )}
                          </div>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Face Biometrics Zoom Modal */}
      {zoomPhoto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-md animate-in fade-in duration-300">
          {/* Backdrop */}
          <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-md" onClick={() => setZoomPhoto(null)}></div>
          
          {/* Modal content */}
          <div className="relative bg-white border border-slate-200 w-full max-w-xl rounded-2xl shadow-2xl overflow-hidden scale-in duration-300">
            <div className="p-xl border-b border-fog bg-slate-50 flex items-center justify-between">
              <h3 className="text-display-xs font-extrabold text-brand-navy flex items-center space-x-sm">
                <ShieldCheck size={22} className="text-brand-purple" />
                <span>{zoomPhoto.title}</span>
              </h3>
              <button 
                onClick={() => setZoomPhoto(null)}
                className="text-graphite hover:text-brand-navy p-xs hover:bg-slate-200 rounded-full transition-all"
              >
                <X size={18} />
              </button>
            </div>
            
            <div className="p-xl flex flex-col md:flex-row gap-xl items-center bg-slate-50/30">
              {/* Photo Display */}
              <div className="w-full md:w-2/3 h-80 rounded-xl overflow-hidden border border-fog bg-black flex items-center justify-center shadow-lg relative group">
                <img 
                  src={zoomPhoto.url} 
                  alt="Zoom biometrics" 
                  className="w-full h-full object-contain"
                />
                <div className="absolute bottom-md right-md bg-brand-navy/70 backdrop-blur px-sm py-xxs rounded text-[10px] text-white flex items-center space-x-xxs">
                  <Maximize2 size={10} />
                  <span className="font-mono">VERIFIED AUDIT IMAGE</span>
                </div>
              </div>
              
              {/* Context info for Auditor */}
              <div className="w-full md:w-1/3 space-y-md">
                <div className="bg-white p-md rounded-xl border border-fog shadow-inner space-y-sm">
                  <div className="space-y-xxs">
                    <span className="text-[9px] font-bold text-graphite uppercase tracking-wider">{t('auditor.col_employee_name')}</span>
                    <p className="text-caption-bold font-extrabold text-brand-navy leading-tight">{zoomPhoto.employee}</p>
                  </div>

                  <div className="space-y-xxs">
                    <span className="text-[9px] font-bold text-graphite uppercase tracking-wider">{t('auditor.employee_code_label')}</span>
                    <p className="text-caption-bold font-mono font-bold text-brand-blue">{zoomPhoto.code}</p>
                  </div>

                  <div className="space-y-xxs">
                    <span className="text-[9px] font-bold text-graphite uppercase tracking-wider">{t('auditor.record_timestamp')}</span>
                    <p className="text-caption-sm font-semibold text-brand-navy">{zoomPhoto.time}</p>
                  </div>
                </div>

                <div className="p-md rounded-xl bg-blue-50 border border-blue-100 flex gap-sm text-[11px] text-brand-navy">
                  <AlertCircle size={18} className="text-brand-blue flex-shrink-0 mt-xxs" />
                  <p className="leading-relaxed font-medium">
                    {t('auditor.biometrics_note')}
                  </p>
                </div>
              </div>
            </div>

            <div className="p-lg bg-slate-50 border-t border-fog flex justify-end">
              <button
                onClick={() => setZoomPhoto(null)}
                className="px-xl py-sm bg-brand-navy hover:bg-brand-navy/90 text-white rounded-lg text-caption-bold font-bold transition-all active:scale-95"
              >
                {t('common.close', 'Đóng')}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default AuditorDashboard;
