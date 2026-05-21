import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  Database, 
  User, 
  RefreshCw, 
  Calendar,
  Layers,
  ChevronDown,
  ChevronRight,
  AlertCircle
} from 'lucide-react';
import { activityService } from '../services/activityService';
import Alert from '../components/Alert';
import LoadingSpinner from '../components/LoadingSpinner';

const AuditorAuditLogsPage = () => {
  const { t } = useTranslation();
  const [auditLogs, setAuditLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters state
  const [actorSearch, setActorSearch] = useState('');
  const [targetTableFilter, setTargetTableFilter] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Row expand state for JSON payloads
  const [expandedRows, setExpandedRows] = useState({});

  const fetchAuditLogs = useCallback(async () => {
    setLoading(true);
    try {
      const filters = {};
      if (targetTableFilter !== 'all') {
        filters.target_table = targetTableFilter;
      }
      const data = await activityService.getAuditLogs(filters);
      setAuditLogs(data.auditLogs || []);
      setError(null);
    } catch (err) {
      console.error('Failed to load system audit logs:', err);
      setError(t('errors.error_loading_data', 'Không thể tải nhật ký thay đổi hệ thống.'));
    } finally {
      setLoading(false);
    }
  }, [targetTableFilter, t]);

  useEffect(() => {
    fetchAuditLogs();
  }, [fetchAuditLogs]);

  const toggleRow = (rowId) => {
    setExpandedRows(prev => ({
      ...prev,
      [rowId]: !prev[rowId]
    }));
  };

  const handleResetFilters = () => {
    setActorSearch('');
    setTargetTableFilter('all');
    setStartDate('');
    setEndDate('');
    fetchAuditLogs();
  };

  // Client side filtering for actor and date
  const filteredLogs = auditLogs.filter(log => {
    // Actor search
    const matchesActor = 
      !actorSearch || 
      log.actor_name?.toLowerCase().includes(actorSearch.toLowerCase()) ||
      log.actor_username?.toLowerCase().includes(actorSearch.toLowerCase());

    // Date range
    const logTime = new Date(log.created_at);
    let matchesDate = true;
    if (startDate) {
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      if (logTime < start) matchesDate = false;
    }
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      if (logTime > end) matchesDate = false;
    }

    return matchesActor && matchesDate;
  });

  const getActionColor = (action) => {
    const act = action?.toLowerCase() || '';
    if (act.includes('delete')) return 'bg-red-50 text-red-600 border-red-100';
    if (act.includes('update')) return 'bg-blue-50 text-blue-600 border-blue-100';
    if (act.includes('insert') || act.includes('create') || act.includes('approve')) return 'bg-emerald-50 text-emerald-600 border-emerald-100';
    if (act.includes('reject') || act.includes('force_close')) return 'bg-amber-50 text-amber-600 border-amber-100';
    return 'bg-slate-50 text-slate-600 border-slate-100';
  };

  const formatJSON = (val) => {
    if (!val) return '-';
    try {
      const parsed = typeof val === 'string' ? JSON.parse(val) : val;
      return JSON.stringify(parsed, null, 2);
    } catch (e) {
      return String(val);
    }
  };

  return (
    <div className="min-h-screen bg-brand-slate text-ink font-sans p-xl space-y-xl animate-in fade-in duration-500">
      
      {/* Page Header */}
      <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-md border-b border-fog pb-lg">
        <div>
          <div className="flex items-center space-x-sm text-brand-navy mb-xs">
            <Database size={28} className="text-brand-navy" />
            <span className="text-caption-bold tracking-widest font-extrabold uppercase bg-brand-navy/10 text-brand-navy px-xs py-xxs rounded">
              SYSTEM INTEGRITY AUDIT TRAIL
            </span>
          </div>
          <h1 className="text-display-md font-extrabold tracking-tight text-brand-navy">
            {t('auditor.audit_logs_title', 'Nhật ký Thay đổi Hệ thống')}
          </h1>
          <p className="text-body-md text-graphite mt-xs max-w-3xl">
            {t('auditor.audit_logs_subtitle', 'Nhật ký kiểm toán chi tiết về các thay đổi dữ liệu của quản trị viên và hệ thống.')}
          </p>
        </div>

        <div>
          <button 
            onClick={fetchAuditLogs}
            className="flex items-center gap-xs px-xl py-sm bg-white hover:bg-slate-50 border border-fog text-brand-navy font-bold rounded-lg transition-all active:scale-95 shadow-soft-lift"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            <span>{t('common.refresh', 'Tải lại')}</span>
          </button>
        </div>
      </div>

      {error && <Alert type="error" message={error} onClose={() => setError(null)} />}

      {/* Query Filter Controls */}
      <div className="bg-white p-xl rounded-2xl border border-fog shadow-soft-lift space-y-lg">
        <h3 className="text-caption-bold text-brand-navy uppercase tracking-widest font-extrabold flex items-center space-x-xs">
          <span className="w-2 h-2 rounded-full bg-brand-purple"></span>
          <span>Bộ lọc nhật ký</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-md">
          {/* Target Table filter */}
          <div className="space-y-xxs">
            <label className="text-[10px] font-bold text-graphite uppercase tracking-wider block">Bảng bị tác động</label>
            <div className="relative">
              <Layers className="absolute left-md top-1/2 -translate-y-1/2 text-steel" size={16} />
              <select
                value={targetTableFilter}
                onChange={(e) => setTargetTableFilter(e.target.value)}
                className="w-full bg-brand-slate border border-fog rounded-xl py-sm pl-11 pr-md text-caption-bold text-brand-navy focus:outline-none focus:border-brand-navy focus:bg-white transition-all appearance-none cursor-pointer"
              >
                <option value="all">Tất cả bảng dữ liệu</option>
                <option value="users">users (Nhân sự & Tài khoản)</option>
                <option value="devices">devices (Thiết bị/Tài sản)</option>
                <option value="sessions">sessions (Phiên ra vào)</option>
              </select>
              <ChevronDown className="absolute right-md top-1/2 -translate-y-1/2 text-steel pointer-events-none" size={16} />
            </div>
          </div>

          {/* Actor search */}
          <div className="space-y-xxs">
            <label className="text-[10px] font-bold text-graphite uppercase tracking-wider block">Người thực hiện (Tên/User)</label>
            <div className="relative">
              <User className="absolute left-md top-1/2 -translate-y-1/2 text-steel" size={16} />
              <input 
                type="text" 
                placeholder="Tìm quản trị viên..."
                value={actorSearch}
                onChange={(e) => setActorSearch(e.target.value)}
                className="w-full bg-brand-slate border border-fog rounded-xl py-sm pl-11 pr-md text-caption-md text-brand-navy placeholder:text-steel focus:outline-none focus:border-brand-navy focus:bg-white transition-all"
              />
            </div>
          </div>

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
        </div>

        <div className="flex justify-between items-center pt-xs border-t border-slate-100">
          <span className="text-caption-md text-graphite font-medium">
            Có <strong className="text-brand-navy font-bold">{filteredLogs.length}</strong> nhật ký khớp điều kiện lọc
          </span>
          <button 
            onClick={handleResetFilters}
            className="px-xl py-sm bg-slate-100 hover:bg-slate-200 text-brand-navy rounded-xl text-caption-bold font-bold transition-all active:scale-95"
          >
            Nhập lại bộ lọc
          </button>
        </div>
      </div>

      {/* Main Logs Table */}
      <div className="bg-white border border-fog rounded-2xl overflow-hidden shadow-soft-lift">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-[10px] font-bold text-graphite uppercase tracking-[0.08em] border-b border-fog">
                <th className="px-xl py-md text-center w-12">Expand</th>
                <th className="px-xl py-md">{t('auditor.col_actor', 'Người thực hiện')}</th>
                <th className="px-xl py-md">{t('auditor.col_target_table', 'Bảng tác động')}</th>
                <th className="px-xl py-md">{t('auditor.col_action', 'Hành động')}</th>
                <th className="px-xl py-md">{t('auditor.col_record_id', 'ID Bản ghi')}</th>
                <th className="px-xl py-md">{t('auditor.col_reason', 'Lý do thay đổi')}</th>
                <th className="px-xl py-md">{t('audit.col_timestamp', 'Thời gian')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-fog text-brand-navy">
              {loading ? (
                <tr>
                  <td colSpan="7" className="px-xl py-xxxl text-center">
                    <LoadingSpinner />
                  </td>
                </tr>
              ) : filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-xl py-xxxl text-center text-steel italic">
                    <div className="flex flex-col items-center justify-center space-y-md">
                      <Database size={48} className="text-slate-300" />
                      <p className="text-body-md text-graphite font-bold">{t('auditor.no_audit_logs', 'Không tìm thấy nhật ký thay đổi nào.')}</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => {
                  const logTime = new Date(log.created_at);
                  const isExpanded = !!expandedRows[log.log_id];
                  
                  return (
                    <React.Fragment key={log.log_id}>
                      <tr 
                        className={`hover:bg-slate-50/55 transition-colors cursor-pointer ${isExpanded ? 'bg-slate-50/20' : ''}`}
                        onClick={() => toggleRow(log.log_id)}
                      >
                        {/* Toggle expand button */}
                        <td className="px-xl py-lg text-center">
                          <button className="text-graphite hover:text-brand-navy transition-colors">
                            {isExpanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                          </button>
                        </td>

                        {/* Actor details */}
                        <td className="px-xl py-lg">
                          <div className="flex items-center space-x-sm">
                            <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center border border-fog font-bold text-brand-blue text-xs uppercase shadow-inner">
                              {log.actor_name?.charAt(0) || 'A'}
                            </div>
                            <div>
                              <div className="text-caption-bold text-brand-navy font-bold leading-tight">{log.actor_name}</div>
                              <div className="text-caption-sm text-graphite font-mono">@{log.actor_username}</div>
                            </div>
                          </div>
                        </td>

                        {/* Target scope */}
                        <td className="px-xl py-lg font-semibold">
                          <span className="font-mono text-caption-md bg-slate-100 border border-fog px-xs py-xxs rounded">
                            {log.target_table}
                          </span>
                        </td>

                        {/* Action type badge */}
                        <td className="px-xl py-lg">
                          <span className={`px-sm py-xxs rounded-full text-[10px] font-extrabold tracking-wider uppercase border ${getActionColor(log.action)}`}>
                            {log.action?.replace(/_/g, ' ')}
                          </span>
                        </td>

                        {/* Target ID */}
                        <td className="px-xl py-lg font-mono text-caption-sm text-graphite">
                          #{log.target_id}
                        </td>

                        {/* Reason */}
                        <td className="px-xl py-lg max-w-xs">
                          <p className="text-caption-md font-medium text-brand-navy truncate-2-lines" title={log.reason}>
                            {log.reason || <span className="text-slate-400 italic">Không có lý do</span>}
                          </p>
                        </td>

                        {/* Timestamp */}
                        <td className="px-xl py-lg">
                          <div className="text-caption-bold text-brand-navy font-bold">
                            {logTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                          </div>
                          <div className="text-[11px] text-graphite font-medium">
                            {logTime.toLocaleDateString()}
                          </div>
                        </td>
                      </tr>

                      {/* Collapsible JSON diff details */}
                      {isExpanded && (
                        <tr>
                          <td colSpan="7" className="bg-slate-50/50 p-xl border-t border-b border-fog">
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-xl">
                              
                              {/* Old state */}
                              <div className="space-y-xs">
                                <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center space-x-xs">
                                  <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>
                                  <span>{t('auditor.col_old_value', 'Giá trị cũ')}</span>
                                </h4>
                                <pre className="font-mono text-[11px] bg-slate-900 text-emerald-400 p-md rounded-xl overflow-x-auto shadow-inner max-h-80 border border-charcoal">
                                  {formatJSON(log.old_value)}
                                </pre>
                              </div>

                              {/* New state */}
                              <div className="space-y-xs">
                                <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center space-x-xs">
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                                  <span>{t('auditor.col_new_value', 'Giá trị mới')}</span>
                                </h4>
                                <pre className="font-mono text-[11px] bg-slate-900 text-cyan-300 p-md rounded-xl overflow-x-auto shadow-inner max-h-80 border border-charcoal">
                                  {formatJSON(log.new_value)}
                                </pre>
                              </div>
                            </div>

                            <div className="mt-md p-md rounded-xl bg-blue-50/45 border border-blue-100 flex items-start gap-sm text-[11px] text-brand-navy">
                              <AlertCircle size={16} className="text-brand-blue flex-shrink-0 mt-xxs" />
                              <div>
                                <p className="font-bold uppercase tracking-wider text-[9px] text-brand-blue mb-xxs">Chỉ dẫn đối soát</p>
                                <p className="leading-relaxed">
                                  Hãy đối chiếu cấu trúc dữ liệu trước và sau sự kiện để xem các trường thay đổi (chẳng hạn như role, status, device approve/reject hoặc notes). Thông tin nhạy cảm như password hashes đã được hệ thống tự động loại bỏ trước khi lưu trữ vào nhật ký này.
                                </p>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};

export default AuditorAuditLogsPage;
