import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../store/authStore';
import { 
  MonitorSmartphone, 
  ShieldAlert, 
  History,
  Users,
  LogOut,
  ChevronLeft,
  ChevronRight,
  QrCode,
  PieChart,
  PlusCircle,
  LayoutDashboard,
  ShieldCheck,
  ClipboardCheck,
  HelpCircle,
  Settings,
  Clock
} from 'lucide-react';

const Sidebar = ({ isExpanded, toggleSidebar }) => {
  const { t } = useTranslation();
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const getMenuItems = () => {
    const roleItems = [];
    switch (user?.role) {
      case 'engineer':
        roleItems.push(
          { path: '/engineer-stats', icon: PieChart, label: t('stats.performance_analytics') },
          { path: '/devices', icon: MonitorSmartphone, label: t('sidebar.my_devices') },
          { path: '/register-device', icon: PlusCircle, label: t('sidebar.register_new') },
          { path: '/qr-tags', icon: QrCode, label: t('sidebar.qr_tags') },
        );
        break;
      case 'manager':
        roleItems.push(
          { path: '/dashboard', icon: LayoutDashboard, label: t('common.dashboard') },
          { path: '/approvals', icon: ClipboardCheck, label: t('approvals.approval_requests') },
          { path: '/users', icon: Users, label: t('sidebar.directory') },
          { path: '/audit', icon: History, label: t('sidebar.access_logs') },
        );
        break;
      case 'admin':
        roleItems.push(
          { path: '/dashboard', icon: LayoutDashboard, label: t('common.dashboard') },
          { path: '/users', icon: Users, label: t('sidebar.personnel') },
          { path: '/sessions', icon: Clock, label: t('sidebar.session_management') },
          { path: '/audit', icon: History, label: t('sidebar.system_audit') },
        );
        break;
      case 'security':
        roleItems.push(
          { path: '/dashboard', icon: LayoutDashboard, label: t('common.dashboard') },
          { path: '/audit', icon: History, label: t('sidebar.security_logs') },
        );
        break;
      case 'auditor':
        roleItems.push(
          { path: '/auditor-dashboard', icon: LayoutDashboard, label: t('sidebar.access_history', 'Lịch sử ra vào') },
          { path: '/auditor-audit-logs', icon: History, label: t('sidebar.system_audit', 'Nhật ký hệ thống') },
        );
        break;
      default:
        break;
    }

    return [
      {
        category: t('sidebar.main_operations'),
        items: roleItems
      },
      {
        category: t('common.support'),
        items: [
          { path: '/rules', icon: ShieldCheck, label: t('sidebar.compliance') },
          { path: '/support', icon: HelpCircle, label: t('sidebar.tech_help') },
          { path: '/settings', icon: Settings, label: t('sidebar.preferences') },
        ]
      }
    ];
  };

  const navGroups = getMenuItems();

  return (
    <aside className={`bg-ink border-r border-charcoal text-on-ink transition-all duration-300 ease-in-out flex flex-col h-full ${isExpanded ? 'w-64' : 'w-20'}`}>
      {/* Brand Slot (Hidden in GlobalLayout's Header if preferred, but keeping here for identity) */}
      <div className="p-md flex items-center justify-between border-b border-charcoal h-16">
        <div className="flex items-center space-x-md overflow-hidden cursor-pointer" onClick={() => navigate('/')}>
          <div className="w-8 h-8 bg-primary/20 rounded-full flex items-center justify-center text-primary flex-shrink-0">
            <ShieldCheck size={16} />
          </div>
          {isExpanded && <span className="font-bold text-base whitespace-nowrap tracking-tight">{t('sidebar.rd_hub')}</span>}
        </div>
        <button onClick={toggleSidebar} className="text-graphite hover:text-on-ink p-xxs transition-colors hidden md:block">
          {isExpanded ? <ChevronLeft size={18} /> : <ChevronRight size={18} />}
        </button>
      </div>

      {/* Navigation Groups */}
      <nav className="flex-1 px-md py-xxl space-y-xxl overflow-y-auto">
        {navGroups.map((group, groupIdx) => (
          <div key={groupIdx} className="space-y-md">
            {isExpanded && (
              <h4 className="px-md text-[10px] font-bold text-graphite uppercase tracking-[0.1em]">
                {group.category}
              </h4>
            )}
            <div className="space-y-xxs">
              {group.items.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={({ isActive }) =>
                    `flex items-center space-x-md px-md py-sm rounded-md transition-all ${
                      isActive 
                        ? 'bg-primary text-white font-bold' 
                        : 'text-steel hover:bg-ink-soft hover:text-on-ink'
                    }`
                  }
                >
                  <item.icon size={18} className="flex-shrink-0" />
                  {isExpanded && <span className="whitespace-nowrap text-caption-md">{item.label}</span>}
                </NavLink>
              ))}
            </div>
          </div>
        ))}
      </nav>

      {/* User Actions */}
      <div className="p-md border-t border-charcoal">
        <button 
          onClick={logout}
          className="flex items-center space-x-md text-bloom-coral hover:bg-bloom-wine/20 w-full px-md py-sm rounded-md transition-colors text-caption-md font-bold"
        >
          <LogOut size={18} className="flex-shrink-0" />
          {isExpanded && <span>{t('common.logout')}</span>}
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
