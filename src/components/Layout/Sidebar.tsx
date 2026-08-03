import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { 
  LayoutDashboard, 
  Users, 
  CreditCard, 
  CalendarDays, 
  Megaphone, 
  CheckSquare, 
  ShieldCheck, 
  FolderLock,
  LogOut,
  X,
  Church,
  MessageSquare
} from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, setIsOpen }) => {
  const { currentUser, logout, systemSettings } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const navItems = [
    { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['super-admin', 'leader', 'member'] },
    { to: '/programs', label: 'Programs & Events', icon: CalendarDays, roles: ['super-admin', 'leader', 'member'] },
    { to: '/dues', label: 'Monthly Dues', icon: CreditCard, roles: ['super-admin', 'leader', 'member'] },
    { to: '/announcements', label: 'Announcements', icon: Megaphone, roles: ['super-admin', 'leader', 'member'] },
    { to: '/members', label: 'Members Directory', icon: Users, roles: ['super-admin', 'leader', 'member'] },
    { to: '/chat', label: 'Youth Chat & Calls', icon: MessageSquare, roles: ['super-admin', 'leader', 'member'] },
    { to: '/attendance', label: 'Attendance', icon: CheckSquare, roles: ['super-admin', 'leader'] },
    { to: '/vault', label: 'Document Vault', icon: FolderLock, roles: ['super-admin', 'leader', 'member'] },
    { to: '/admin', label: 'System Admin', icon: ShieldCheck, roles: ['super-admin'] },
  ];

  const filteredItems = navItems.filter(item => 
    currentUser && item.roles.includes(currentUser.role)
  );

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-sm lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar Container */}
      <aside className={`
        fixed bottom-0 top-0 left-0 z-50 flex w-72 flex-col 
        border-r border-slate-200 bg-white px-5 py-6 dark:border-slate-800 dark:bg-slate-900
        transition-transform duration-300 lg:static lg:translate-x-0
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        {/* Logo Section */}
        <div className="flex items-center justify-between px-2 mb-8">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-church-navy-700 to-church-navy-900 text-church-gold-400">
              <Church className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-sm font-bold tracking-tight text-church-navy-950 dark:text-white leading-none uppercase max-w-[170px] truncate" title={systemSettings?.churchName}>
                {systemSettings?.churchName || 'TAVY SYSTEM'}
              </h1>
              <span className="text-[9px] font-semibold text-church-gold-600 dark:text-church-gold-400 uppercase tracking-widest">
                Youth Ministry
              </span>
            </div>
          </div>
          <button 
            onClick={() => setIsOpen(false)}
            className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-300 lg:hidden"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 space-y-1.5 px-1 overflow-y-auto">
          {filteredItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={() => setIsOpen(false)}
              className={({ isActive }) => `
                flex items-center gap-3.5 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-200
                ${isActive 
                  ? 'bg-church-navy-950 text-white dark:bg-church-gold-500 dark:text-church-navy-950 shadow-md shadow-church-navy-950/10 dark:shadow-church-gold-500/10' 
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800/60 dark:hover:text-white'
                }
              `}
            >
              <item.icon className="h-5 w-5 shrink-0" />
              {item.label}
            </NavLink>
          ))}
        </nav>

        {/* User Card & Logout Footer */}
        {currentUser && (
          <div className="mt-auto border-t border-slate-100 pt-5 dark:border-slate-800">
            <div className="flex items-center gap-3 px-2 mb-4">
              <img 
                src={currentUser.photoURL || `https://ui-avatars.com/api/?name=${currentUser.firstName}+${currentUser.lastName}&background=3c64a3&color=fff`} 
                alt="Profile" 
                className="h-10 w-10 rounded-full border border-church-gold-500 object-cover"
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                  {currentUser.firstName} {currentUser.lastName}
                </p>
                <p className="text-xs text-church-gold-600 dark:text-church-gold-400 font-medium capitalize">
                  {currentUser.role.replace('-', ' ')}
                </p>
              </div>
            </div>
            
            <button
              onClick={handleLogout}
              className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
            >
              <LogOut className="h-5 w-5 shrink-0" />
              Log Out
            </button>
          </div>
        )}
      </aside>
    </>
  );
};

export default Sidebar;
