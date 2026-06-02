import React, { useEffect, useState } from 'react';
import { activityService } from '../services/activityService';
import LoadingSpinner from '../components/LoadingSpinner';
import { History, Search, Download, Laptop, Calendar, User, Shield, Users, DoorOpen, LayoutDashboard, Filter } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { useTranslation } from 'react-i18next';
import * as XLSX from 'xlsx';

const ActivityLogsPage = () => {
    const { t } = useTranslation();
    const { user } = useAuthStore();
    const [auditLogs, setAuditLogs] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterType, setFilterType] = useState('all');

    useEffect(() => {
        loadAuditLogs();
    }, []);

    const loadAuditLogs = async () => {
        setIsLoading(true);
        try {
            const data = await activityService.getRecentActivity(500);
            setAuditLogs(data.activity || []);
        } catch (err) {
            console.error("Failed to load audit logs", err);
        } finally {
            setIsLoading(false);
        }
    };

    const categories = [
        { id: 'all', label: t('audit.all_events'), icon: <LayoutDashboard size={18} /> },
        { id: 'access', label: t('audit.access_events'), icon: <DoorOpen size={18} /> },
        { id: 'users', label: t('audit.user_events'), icon: <Users size={18} /> },
        { id: 'devices', label: t('audit.device_events'), icon: <Laptop size={18} /> },
        { id: 'security', label: t('audit.security_events'), icon: <Shield size={18} /> },
    ];

    const filteredLogs = auditLogs.filter(log => {
        const type = log.activity_type?.toLowerCase() || '';
        const desc = log.description?.toLowerCase() || '';
        const searchLower = searchTerm.toLowerCase();
        
        const matchesSearch = 
            desc.includes(searchLower) ||
            (log.full_name && log.full_name.toLowerCase().includes(searchLower)) ||
            (log.username && log.username.toLowerCase().includes(searchLower)) ||
            type.includes(searchLower);
        
        let matchesType = true;
        if (filterType === 'access') {
            matchesType = type.includes('check_in') || type.includes('check_out');
        } else if (filterType === 'users') {
            matchesType = type.includes('user') || type.includes('profile') || type.includes('login');
        } else if (filterType === 'devices') {
            matchesType = type.includes('device') && log.role !== 'security';
        } else if (filterType === 'security') {
            matchesType = type.includes('security') || desc.includes('warning') || (type.includes('device') && log.role === 'security');
        }
            
        return matchesSearch && matchesType;
    });

    const exportToExcel = () => {
        const wsData = filteredLogs.map(log => ({
            'Timestamp': new Date(log.created_at).toLocaleString(),
            'Principal': log.full_name || 'System Auto',
            'Username': log.username || '-',
            'Event Type': log.activity_type.toUpperCase(),
            'Detailed Description': log.description
        }));
        const ws = XLSX.utils.json_to_sheet(wsData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Audit_Trail");
        
        // Manual robust Blob download to ensure correct filename and extension across all browsers
        const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
        const blob = new Blob([wbout], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `HCL_Activity_Audit_${new Date().toISOString().slice(0, 10)}.xlsx`;
        document.body.appendChild(link);
        link.click();
        setTimeout(() => {
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
        }, 100);
    };

    const getActionStyle = (type, desc) => {
        if (type.includes('check_in')) return 'bg-green-50 text-green-600 border-green-100';
        if (type.includes('check_out')) return 'bg-amber-50 text-amber-600 border-amber-100';
        if (type.includes('login')) return 'bg-cloud text-steel border-fog';
        if (type.includes('security') || (desc && desc.toLowerCase().includes('warning'))) return 'bg-red-50 text-red-500 border-red-100';
        if (type.includes('delete') || type.includes('reject')) return 'bg-red-50 text-red-500 border-red-100';
        if (type.includes('update')) return 'bg-primary/5 text-primary border-primary/10';
        if (type.includes('create') || type.includes('register') || type.includes('approv')) return 'bg-primary/5 text-primary border-primary/10';
        return 'bg-cloud text-steel border-fog';
    };

    return (
        <div className="min-h-screen bg-canvas text-ink font-sans p-xl">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-xl mb-xxl">
                <div>
                    <h1 className="text-display-md tracking-tight mb-xs">{t('audit.title')}</h1>
                    <p className="text-body-md text-charcoal">{t('audit.subtitle')}</p>
                </div>
                <button 
                    onClick={exportToExcel}
                    className="flex items-center gap-xs px-xl py-sm bg-paper border border-fog text-ink font-bold rounded-md hover:bg-cloud transition shadow-soft-lift"
                >
                    <Download size={18} /> {t('audit.export_xlsx')}
                </button>
            </div>

            {/* Controls & Categories */}
            <div className="bg-paper p-xl rounded-xl shadow-floating border border-fog mb-xl space-y-xl">
                <div className="flex flex-col md:flex-row gap-xl items-center">
                    <div className="relative flex-1">
                        <Search className="absolute left-md top-1/2 -translate-y-1/2 text-steel" size={20} />
                        <input 
                            type="text" 
                            placeholder={t('audit.search_placeholder')} 
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-xxl pr-md py-sm bg-cloud border border-fog rounded-md outline-none focus:border-primary transition-all text-body-md"
                        />
                    </div>
                    <div className="bg-primary/5 px-xl py-sm rounded-md border border-primary/10 flex items-center gap-sm">
                        <span className="text-primary font-bold text-display-xs">{filteredLogs.length}</span>
                        <span className="text-caption-bold text-primary uppercase tracking-widest">{t('audit.records_identified')}</span>
                    </div>
                </div>

                <div className="flex flex-wrap gap-md">
                    {categories.map((cat) => (
                        <button
                            key={cat.id}
                            onClick={() => setFilterType(cat.id)}
                            className={`flex items-center gap-xs px-xl py-xs rounded-md font-bold text-caption-bold transition-all ${
                                filterType === cat.id
                                ? 'bg-primary text-on-ink shadow-soft-lift'
                                : 'bg-cloud text-graphite hover:text-ink hover:bg-fog'
                            }`}
                        >
                            {cat.icon}
                            {cat.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Forensics Table */}
            <div className="bg-paper rounded-xl shadow-floating border border-fog overflow-hidden">
                <div className="overflow-x-auto">
                    {isLoading ? (
                        <div className="py-xxl flex flex-col items-center">
                            <LoadingSpinner />
                            <p className="mt-md text-charcoal text-body-md font-bold">{t('audit.synchronizing')}</p>
                        </div>
                    ) : (
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-cloud text-caption-bold text-graphite uppercase tracking-widest border-b border-fog">
                                    <th className="px-xl py-md">{t('audit.col_timestamp')}</th>
                                    <th className="px-xl py-md">{t('audit.col_principal')}</th>
                                    <th className="px-xl py-md">{t('audit.col_authority')}</th>
                                    <th className="px-xl py-md">{t('audit.col_action')}</th>
                                    <th className="px-xl py-md">{t('audit.col_detail')}</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-fog">
                                {filteredLogs.length > 0 ? filteredLogs.map((log) => {
                                    const time = new Date(log.created_at);
                                    return (
                                        <tr key={log.log_id} className="hover:bg-cloud/20 transition-colors group">
                                            <td className="px-xl py-lg">
                                                <div className="flex items-center gap-md">
                                                     <Calendar size={16} className="text-steel group-hover:text-primary transition-colors" />
                                                    <div>
                                                        <p className="text-body-emphasis text-ink">{time.toLocaleDateString()}</p>
                                                        <p className="text-caption-md text-charcoal font-mono">{time.toLocaleTimeString()}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-xl py-lg">
                                                <div className="flex items-center gap-md">
                                                    <div className="w-10 h-10 rounded-full bg-cloud text-primary flex items-center justify-center border border-fog shadow-sm overflow-hidden">
                                                        {log.avatar_url ? (
                                                            <img src={log.avatar_url} alt="avatar" className="w-full h-full object-cover" />
                                                        ) : (
                                                            <User size={18} />
                                                        )}
                                                    </div>
                                                    <div>
                                                        <p className="text-body-emphasis text-ink leading-tight">{log.full_name || t('audit.system_process')}</p>
                                                        {log.username && <p className="text-caption-md text-charcoal">@{log.username}</p>}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-xl py-lg">
                                                {log.role ? (
                                                    <span className={`px-sm py-xxs rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                                                        log.role === 'admin' ? 'bg-primary/5 text-primary border-primary/10' :
                                                        log.role === 'manager' ? 'bg-primary/5 text-primary border-primary/10' :
                                                        log.role === 'security' ? 'bg-red-50 text-red-500 border-red-100' :
                                                        'bg-cloud text-steel border-fog'
                                                    }`}>
                                                        {log.role}
                                                    </span>
                                                ) : (
                                                    <span className="text-steel text-caption-md">-</span>
                                                )}
                                            </td>
                                            <td className="px-xl py-lg">
                                                <span className={`px-sm py-xxs rounded-full text-[10px] font-bold tracking-widest uppercase border ${getActionStyle(log.activity_type.toLowerCase(), log.description)}`}>
                                                    {log.activity_type.replace(/_/g, ' ')}
                                                </span>
                                            </td>
                                            <td className="px-xl py-lg max-w-lg">
                                                <p className="text-body-md text-ink leading-relaxed">
                                                    {log.description}
                                                </p>
                                                {log.metadata && log.metadata.device_ids && (
                                                    <div className="mt-sm flex flex-wrap gap-xs">
                                                        {log.metadata.device_ids.map((dId, idx) => (
                                                            <span key={idx} className="inline-flex items-center gap-xs px-xs py-xxs rounded bg-cloud text-[10px] font-bold text-steel border border-fog">
                                                                <Laptop size={12} /> #{dId}
                                                            </span>
                                                        ))}
                                                    </div>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                }) : (
                                    <tr>
                                        <td colSpan="5" className="px-xl py-xxl text-center text-charcoal text-body-md font-bold italic">
                                            {t('audit.no_records')}
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ActivityLogsPage;
