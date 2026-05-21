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
import 'jspdf-autotable';

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
        'Ingress Photo URL': session.entry_photo || 'No photo',
        'Egress Photo URL': session.exit_photo || 'No photo'
      };
    });

    const ws = XLSX.utils.json_to_sheet(wsData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "ANZ_Compliance_Ledger");
    XLSX.writeFile(wb, `ANZ_Physical_Access_Audit_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  // Export to PDF
  const exportToPDF = () => {
    const doc = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4'
    });

    // Add layout background accent
    doc.setFillColor(248, 250, 252); // brand.slate
    doc.rect(0, 0, 297, 210, 'F');

    // Add corporate top bar
    doc.setFillColor(0, 44, 119); // ANZ Navy
    doc.rect(0, 0, 297, 24, 'F');

    // Title
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(15);
    doc.text("HCLTech x ANZ Strategic Alliance - Innovation Nexus", 14, 10);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(220, 220, 220);
    doc.text("HIGH-INTEGRITY E2E PHYSICAL ACCESS AUDIT LEDGER", 14, 15);
    doc.text(`Run Date: ${new Date().toLocaleString()}`, 230, 15);

    // Reset color
    doc.setTextColor(26, 26, 26);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text(t('auditor.dashboard_title', 'Đối soát Lịch sử Ra vào'), 14, 34);

    // Metadata & Filters
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(99, 99, 99);
    
    let filterString = `Filters Applied: `;
    if (startDate || endDate) filterString += `Date: [${startDate || 'Any'} to ${endDate || 'Any'}] | `;
    if (startHour || endHour) filterString += `Hours: [${startHour || '00:00'} to ${endHour || '23:59'}] | `;
    if (employeeSearch) filterString += `Employee: "${employeeSearch}" | `;
    if (deviceSearch) filterString += `Asset/Auth Mode: "${deviceSearch}" | `;
    if (filterString === `Filters Applied: `) filterString += `None (All records)`;

    doc.text(filterString, 14, 39);
    doc.text(`Total Audited Entries: ${sessions.length}`, 14, 43);

    // Table Data preparation
    const tableColumn = [
      "No.",
      t('auditor.col_employee_name', 'Nhân viên'),
      t('auditor.col_employee_code', 'Mã NV'),
      t('auditor.col_checkin_time', 'Thời gian Vào'),
      t('auditor.col_checkout_time', 'Thời gian Ra'),
      t('auditor.col_auth_method', 'Auth Mode'),
      t('auditor.col_devices_carried', 'Assets Carried'),
      "Ingress Biometrics",
      "Egress Biometrics"
    ];

    const tableRows = sessions.map((session, idx) => {
      const checkInStr = session.check_in_at ? new Date(session.check_in_at).toLocaleString() : '-';
      const checkOutStr = session.check_out_at ? new Date(session.check_out_at).toLocaleString() : (session.status === 'in' ? 'In Progress' : '-');
      const carriedAssets = session.devices && session.devices.length > 0
        ? session.devices.map(d => `${d.brand} ${d.model_name}`).join(', ')
        : 'None';
      
      const ingressPhotoText = session.entry_photo ? 'Captured' : 'None';
      const egressPhotoText = session.exit_photo ? 'Captured' : 'None';

      return [
        idx + 1,
        session.full_name,
        session.employee_code,
        checkInStr,
        checkOutStr,
        session.auth_method,
        carriedAssets,
        ingressPhotoText,
        egressPhotoText
      ];
    });

    doc.autoTable({
      startY: 47,
      head: [tableColumn],
      body: tableRows,
      theme: 'grid',
      styles: {
        fontSize: 7.5,
        font: 'helvetica',
        cellPadding: 2,
      },
      headStyles: {
        fillColor: [0, 44, 119], // ANZ Navy
        textColor: [255, 255, 255],
        fontStyle: 'bold',
      },
      alternateRowStyles: {
        fillColor: [240, 244, 248]
      },
      columnStyles: {
        0: { cellWidth: 10 },
        1: { cellWidth: 32 },
        2: { cellWidth: 18 },
        3: { cellWidth: 35 },
        4: { cellWidth: 35 },
        5: { cellWidth: 25 },
        6: { cellWidth: 60 },
        7: { cellWidth: 28 },
        8: { cellWidth: 28 }
      }
    });

    // Save
    doc.save(`ANZ_Compliance_Report_${new Date().toISOString().slice(0, 10)}.pdf`);
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
          <div className="flex items-center space-x-sm text-brand-navy mb-xs">
            <ShieldCheck size={28} className="text-brand-navy" />
            <span className="text-caption-bold tracking-widest font-extrabold uppercase bg-brand-navy/10 text-brand-navy px-xs py-xxs rounded">
              ANZ COMPLIANCE
            </span>
          </div>
          <h1 className="text-display-md font-extrabold tracking-tight text-brand-navy">
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
          <h3 className="text-caption-bold text-brand-navy uppercase tracking-widest font-extrabold flex items-center space-x-xs">
            <span className="w-2 h-2 rounded-full bg-brand-purple"></span>
            <span>Bộ lọc đối soát nâng cao</span>
          </h3>
          <button 
            type="button"
            onClick={handleResetFilters}
            className="text-caption-md font-bold text-brand-purple hover:text-brand-navy hover:underline transition-colors flex items-center gap-xxs"
          >
            <RefreshCw size={14} />
            <span>Xóa bộ lọc</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-md">
          {/* Start Date */}
          <div className="space-y-xxs">
            <label className="text-[10px] font-bold text-graphite uppercase tracking-wider block">Từ ngày</label>
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
            <label className="text-[10px] font-bold text-graphite uppercase tracking-wider block">Đến ngày</label>
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
            <label className="text-[10px] font-bold text-graphite uppercase tracking-wider block">Giờ vào từ</label>
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
            <label className="text-[10px] font-bold text-graphite uppercase tracking-wider block">Giờ vào đến</label>
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
            <label className="text-[10px] font-bold text-graphite uppercase tracking-wider block">Nhân viên (Tên/Mã)</label>
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
            <label className="text-[10px] font-bold text-graphite uppercase tracking-wider block">Thiết bị mang/Quét</label>
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
            <span>ÁP DỤNG TRUY VẤN</span>
          </button>
        </div>
      </form>

      {/* Main Ledger Table */}
      <div className="bg-white border border-fog rounded-2xl overflow-hidden shadow-soft-lift">
        
        {/* Table Header Summary info */}
        <div className="px-xl py-md bg-slate-50 border-b border-fog flex items-center justify-between">
          <span className="text-caption-bold text-brand-navy font-extrabold uppercase tracking-wider">
            SỔ CÁI HOẠT ĐỘNG RA VÀO
          </span>
          <div className="flex items-center space-x-md">
            <span className="text-caption-md text-graphite font-medium">
              Tìm thấy <strong className="text-brand-navy text-body-emphasis">{sessions.length}</strong> phiên
            </span>
            <button 
              onClick={() => fetchSessions(getActiveFilters())}
              className="p-xs text-graphite hover:text-brand-navy hover:bg-slate-200 rounded-lg transition-all active:scale-90"
              title="Đồng bộ lại"
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
                      <p className="text-body-md text-graphite font-bold">Không tìm thấy dữ liệu đối soát nào khớp</p>
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
                            <span className="text-caption-sm text-graphite italic font-medium">Không mang theo</span>
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
                                <span className="text-[9px] font-bold text-slate-400 block mt-xxs">Vào</span>
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
                                <span className="text-[9px] font-bold text-slate-400 block mt-xxs">Ra</span>
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
                    <span className="text-[9px] font-bold text-graphite uppercase tracking-wider">Nhân viên</span>
                    <p className="text-caption-bold font-extrabold text-brand-navy leading-tight">{zoomPhoto.employee}</p>
                  </div>

                  <div className="space-y-xxs">
                    <span className="text-[9px] font-bold text-graphite uppercase tracking-wider">Mã nhân viên</span>
                    <p className="text-caption-bold font-mono font-bold text-brand-blue">{zoomPhoto.code}</p>
                  </div>

                  <div className="space-y-xxs">
                    <span className="text-[9px] font-bold text-graphite uppercase tracking-wider">Thời điểm ghi nhận</span>
                    <p className="text-caption-sm font-semibold text-brand-navy">{zoomPhoto.time}</p>
                  </div>
                </div>

                <div className="p-md rounded-xl bg-blue-50 border border-blue-100 flex gap-sm text-[11px] text-brand-navy">
                  <AlertCircle size={18} className="text-brand-blue flex-shrink-0 mt-xxs" />
                  <p className="leading-relaxed font-medium">
                    Hình ảnh này được lưu trực tiếp vào ổ lưu trữ an toàn lúc xác thực và không thể chỉnh sửa hoặc xóa bởi bất kỳ người dùng nào, đảm bảo tính toàn vẹn kiểm toán.
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
