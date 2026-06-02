import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  Users, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  Lock, 
  Search,
  Filter,
  RefreshCw,
  MoreVertical,
  LogOut,
  Calendar
} from 'lucide-react';
import { accessService } from '../services/accessService';
import Alert from '../components/Alert';
import LoadingSpinner from '../components/LoadingSpinner';

const SessionManagementPage = () => {
  const { t } = useTranslation();
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('active'); // active, completed, overdue
  const [searchTerm, setSearchTerm] = useState('');
  const [isForceClosing, setIsForceClosing] = useState(false);
  const [selectedSession, setSelectedSession] = useState(null);
  const [closeReason, setCloseReason] = useState('');

  const fetchSessions = async () => {
    setLoading(true);
    try {
      const data = await accessService.getAdminSessions();
      setSessions(data.sessions);
      setError(null);
    } catch (err) {
      setError(t('errors.error_loading_data'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSessions();
  }, []);

  const handleForceClose = async () => {
    if (!selectedSession) return;
    setIsForceClosing(true);
    try {
      await accessService.forceCloseSession(selectedSession.session_id, closeReason);
      await fetchSessions();
      setSelectedSession(null);
      setCloseReason('');
    } catch (err) {
      setError(t('errors.error_saving_data'));
    } finally {
      setIsForceClosing(false);
    }
  };

  const filteredSessions = sessions.filter(session => {
    const matchesSearch = 
      session.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      session.employee_code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      session.username?.toLowerCase().includes(searchTerm.toLowerCase());

    if (!matchesSearch) return false;

    if (activeTab === 'active') {
      return session.status === 'in' && !session.is_overdue;
    } else if (activeTab === 'overdue') {
      return session.is_overdue;
    } else {
      return session.status !== 'in';
    }
  });

  const getStatusBadge = (session) => {
    if (session.is_overdue) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-bloom-coral/10 text-bloom-coral">
          <AlertCircle size={12} className="mr-1" />
          {t('sessions.overdue')}
        </span>
      );
    }
    
    switch (session.status) {
      case 'in':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary">
            <Clock size={12} className="mr-1" />
            {t('sessions.in_progress')}
          </span>
        );
      case 'out':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-500/10 text-green-500">
            <CheckCircle2 size={12} className="mr-1" />
            {t('sessions.closed')}
          </span>
        );
      case 'forced_close':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-500/10 text-orange-500">
            <Lock size={12} className="mr-1" />
            {t('sessions.forced')}
          </span>
        );
      default:
        return null;
    }
  };

  const formatDuration = (checkIn, checkOut) => {
    const start = new Date(checkIn);
    const end = checkOut ? new Date(checkOut) : new Date();
    const diffMs = end - start;
    const diffHrs = Math.floor(diffMs / 3600000);
    const diffMins = Math.floor((diffMs % 3600000) / 60000);
    return `${diffHrs}h ${diffMins}m`;
  };

  return (
    <div className="space-y-xxl animate-in fade-in duration-500">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-md">
        <div>
          <h1 className="text-display-md tracking-tight mb-xs text-on-surface">{t('sessions.title')}</h1>
          <p className="text-body-md text-graphite mt-xs">{t('sessions.subtitle')}</p>
        </div>
        <button 
          onClick={fetchSessions}
          className="flex items-center space-x-xs px-md py-sm bg-surface hover:bg-surface-soft border border-charcoal rounded-lg text-on-surface transition-all active:scale-95"
        >
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          <span className="text-caption-md font-bold uppercase tracking-wider">{t('common.refresh')}</span>
        </button>
      </div>

      {error && <Alert type="error" message={error} onClose={() => setError(null)} />}

      {/* Tabs & Search */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-xl items-end">
        <div className="lg:col-span-8">
          <div className="flex p-xs bg-ink rounded-xl border border-charcoal w-fit">
            {[
              { id: 'active', label: t('sessions.active'), icon: Clock, color: 'text-primary' },
              { id: 'overdue', label: t('sessions.overdue'), icon: AlertCircle, color: 'text-bloom-coral' },
              { id: 'completed', label: t('sessions.completed'), icon: CheckCircle2, color: 'text-green-500' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-sm px-xl py-md rounded-lg transition-all ${
                  activeTab === tab.id 
                    ? 'bg-charcoal text-white shadow-lg' 
                    : 'text-steel hover:text-on-ink'
                }`}
              >
                <tab.icon size={18} className={activeTab === tab.id ? tab.color : ''} />
                <span className="text-caption-md font-bold uppercase tracking-wide">{tab.label}</span>
              </button>
            ))}
          </div>
        </div>
        <div className="lg:col-span-4">
          <div className="relative group">
            <Search className="absolute left-md top-1/2 -translate-y-1/2 text-steel group-focus-within:text-primary transition-colors" size={18} />
            <input
              type="text"
              placeholder={t('user_management.search_people')}
              className="w-full bg-ink border border-charcoal rounded-xl py-md pl-11 pr-md text-on-ink focus:outline-none focus:border-primary transition-all placeholder:text-steel"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Sessions Table */}
      <div className="bg-surface border border-charcoal rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-ink-soft/30 border-b border-charcoal">
                <th className="px-xl py-md text-[10px] font-bold text-graphite uppercase tracking-[0.1em]">{t('activity_logs.user')}</th>
                <th className="px-xl py-md text-[10px] font-bold text-graphite uppercase tracking-[0.1em]">{t('sessions.check_in')}</th>
                <th className="px-xl py-md text-[10px] font-bold text-graphite uppercase tracking-[0.1em]">{t('sessions.duration')}</th>
                <th className="px-xl py-md text-[10px] font-bold text-graphite uppercase tracking-[0.1em]">{t('sessions.status')}</th>
                <th className="px-xl py-md text-[10px] font-bold text-graphite uppercase tracking-[0.1em] text-right">{t('common.actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-charcoal/50 text-on-surface">
              {loading ? (
                <tr>
                  <td colSpan="5" className="px-xl py-xxxl text-center">
                    <LoadingSpinner />
                  </td>
                </tr>
              ) : filteredSessions.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-xl py-xxxl text-center text-steel italic">
                    <div className="flex flex-col items-center space-y-md">
                      <Calendar size={48} className="opacity-20" />
                      <p>{t('sessions.no_sessions')}</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredSessions.map((session) => (
                  <tr key={session.session_id} className="hover:bg-ink-soft/10 transition-colors group">
                    <td className="px-xl py-md">
                      <div className="flex items-center space-x-md">
                        <div className="w-10 h-10 rounded-full bg-charcoal flex items-center justify-center overflow-hidden border border-charcoal shadow-inner">
                          {session.avatar_url ? (
                            <img src={session.avatar_url} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <Users size={18} className="text-steel" />
                          )}
                        </div>
                        <div>
                          <div className="text-body-md font-bold">{session.full_name}</div>
                          <div className="text-caption-sm text-steel flex items-center">
                            <span className="font-mono">{session.employee_code}</span>
                            <span className="mx-2">•</span>
                            <span className="capitalize">{session.username}</span>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-xl py-md">
                      <div className="text-body-md font-medium">
                        {new Date(session.check_in_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                      <div className="text-caption-sm text-steel">
                        {new Date(session.check_in_at).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-xl py-md">
                      <div className="text-body-md font-mono text-primary">
                        {formatDuration(session.check_in_at, session.check_out_at)}
                      </div>
                    </td>
                    <td className="px-xl py-md">
                      {getStatusBadge(session)}
                    </td>
                    <td className="px-xl py-md text-right">
                      {session.status === 'in' && (
                        <button
                          onClick={() => setSelectedSession(session)}
                          className="p-sm text-steel hover:text-bloom-coral hover:bg-bloom-coral/10 rounded-lg transition-all active:scale-90 tooltip"
                          title={t('sessions.force_close')}
                        >
                          <LogOut size={18} />
                        </button>
                      )}
                      <button className="p-sm text-steel hover:text-on-surface rounded-lg transition-all ml-xs">
                        <MoreVertical size={18} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Force Close Modal */}
      {selectedSession && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-md animate-in fade-in duration-300">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setSelectedSession(null)}></div>
          <div className="relative bg-white border border-slate-200 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden scale-in duration-300">
            <div className="p-xl border-b border-slate-200 bg-slate-50">
              <h3 className="text-h4 font-bold text-slate-900 flex items-center space-x-md">
                <Lock className="text-rose-500" size={24} />
                <span>{t('sessions.force_close')}</span>
              </h3>
            </div>
            <div className="p-xl space-y-xl">
              <div className="bg-slate-50 p-md rounded-xl space-y-sm">
                <p className="text-caption-md text-slate-500">{t('sessions.force_close_confirm')}</p>
                <div className="flex items-center space-x-md p-sm bg-white rounded-lg border border-slate-200">
                  <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-xs">
                    {selectedSession.full_name?.charAt(0)}
                  </div>
                  <div className="text-body-md font-bold text-slate-900">{selectedSession.full_name}</div>
                </div>
              </div>
              
              <div className="space-y-sm">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{t('sessions.force_close_reason')}</label>
                <textarea
                  className="w-full bg-white border border-slate-200 rounded-xl p-md text-slate-900 focus:outline-none focus:border-blue-500 transition-all min-h-[100px] resize-none placeholder:text-slate-400"
                  placeholder={t('sessions.force_close_placeholder')}
                  value={closeReason}
                  onChange={(e) => setCloseReason(e.target.value)}
                />
              </div>
            </div>
            <div className="p-xl bg-slate-50 flex justify-end space-x-md border-t border-slate-200">
              <button
                onClick={() => setSelectedSession(null)}
                className="px-xl py-md text-caption-md font-bold text-slate-500 hover:text-slate-800 transition-colors"
                disabled={isForceClosing}
              >
                {t('common.cancel')}
              </button>
              <button
                onClick={handleForceClose}
                disabled={isForceClosing}
                className="px-xl py-md bg-rose-500 hover:bg-rose-600 text-white rounded-lg text-caption-md font-bold transition-all shadow-lg active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-sm"
              >
                {isForceClosing && <RefreshCw size={14} className="animate-spin" />}
                <span>{t('sessions.force_close')}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SessionManagementPage;
