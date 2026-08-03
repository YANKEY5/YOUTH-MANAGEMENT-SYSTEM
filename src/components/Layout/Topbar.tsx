import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { isMockMode } from '../../firebase/mockDb';
import { Menu, Sun, Moon, Bell, User, Edit3, LogOut, RefreshCw, Award } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface TopbarProps {
  onMenuClick: () => void;
  title: string;
}

export const Topbar: React.FC<TopbarProps> = ({ onMenuClick, title }) => {
  const { currentUser, logout, switchDemoUser } = useAuth();
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    return localStorage.getItem('theme') === 'dark' || 
      (!localStorage.getItem('theme') && window.matchMedia('(prefers-color-scheme: dark)').matches);
  });
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [demoDropdownOpen, setDemoDropdownOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [darkMode]);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-slate-200 bg-white/80 dark:border-slate-800 dark:bg-slate-900/80 px-6 backdrop-blur-md">
      {/* Left side: Hamburger (mobile) & Title */}
      <div className="flex items-center gap-4">
        <button 
          onClick={onMenuClick}
          className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-300 lg:hidden"
        >
          <Menu className="h-6 w-6" />
        </button>
        <h2 className="text-xl font-bold text-slate-800 dark:text-white truncate">
          {title}
        </h2>
      </div>

      {/* Right side actions */}
      <div className="flex items-center gap-3">
        {/* DEMO ROLE SWITCHER (Only rendered in local Mock Mode) */}
        {isMockMode && (
          <div className="relative">
            <button
              onClick={() => setDemoDropdownOpen(!demoDropdownOpen)}
              className="inline-flex items-center gap-1.5 rounded-full bg-church-gold-100 dark:bg-church-gold-950/40 px-3 py-1.5 text-xs font-semibold text-church-gold-700 dark:text-church-gold-400 border border-church-gold-200 dark:border-church-gold-900/30 hover:bg-church-gold-200/50 transition-colors"
            >
              <RefreshCw className="h-3.5 w-3.5 animate-spin" style={{ animationDuration: '6s' }} />
              Demo: <span className="capitalize font-bold">{currentUser?.role.replace('-', ' ')}</span>
            </button>
            
            {demoDropdownOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setDemoDropdownOpen(false)} />
                <div className="absolute right-0 mt-2 z-20 w-44 rounded-xl border border-slate-200 bg-white p-1 shadow-lg dark:border-slate-800 dark:bg-slate-950">
                  <div className="px-3 py-2 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                    Switch Test Role
                  </div>
                  <button
                    onClick={() => { switchDemoUser('super-admin'); setDemoDropdownOpen(false); navigate('/dashboard'); }}
                    className="flex w-full items-center px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 rounded-lg text-left"
                  >
                    Super Admin
                  </button>
                  <button
                    onClick={() => { switchDemoUser('leader'); setDemoDropdownOpen(false); navigate('/dashboard'); }}
                    className="flex w-full items-center px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 rounded-lg text-left"
                  >
                    Leader
                  </button>
                  <button
                    onClick={() => { switchDemoUser('member'); setDemoDropdownOpen(false); navigate('/dashboard'); }}
                    className="flex w-full items-center px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 rounded-lg text-left"
                  >
                    Member
                  </button>
                </div>
              </>
            )}
          </div>
        )}

        {/* Theme Toggle */}
        <button
          onClick={() => setDarkMode(!darkMode)}
          className="rounded-xl p-2 text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
          title="Toggle Light/Dark Mode"
        >
          {darkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
        </button>

        {/* Notifications Mock */}
        <button className="relative rounded-xl p-2 text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800">
          <Bell className="h-5 w-5" />
          <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-church-gold-500 ring-2 ring-white dark:ring-slate-900" />
        </button>

        {/* User Dropdown */}
        {currentUser && (
          <div className="relative">
            <button
              onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
              className="flex items-center gap-1.5 focus:outline-none"
            >
              <img 
                src={currentUser.photoURL || `https://ui-avatars.com/api/?name=${currentUser.firstName}+${currentUser.lastName}&background=3c64a3&color=fff`} 
                alt="Avatar" 
                className="h-8.5 w-8.5 rounded-full border border-church-gold-500 object-cover"
              />
            </button>

            {profileDropdownOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setProfileDropdownOpen(false)} />
                <div className="absolute right-0 mt-2 z-20 w-48 rounded-xl border border-slate-200 bg-white p-1 shadow-lg dark:border-slate-800 dark:bg-slate-950">
                  <div className="border-b border-slate-100 px-4 py-2.5 dark:border-slate-800">
                    <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                      {currentUser.firstName} {currentUser.lastName}
                    </p>
                    <p className="text-[10px] text-slate-400 dark:text-slate-500 truncate">
                      {currentUser.email}
                    </p>
                  </div>
                  
                  <button
                    onClick={() => { setProfileDropdownOpen(false); navigate('/dashboard'); setTimeout(() => {
                      const el = document.getElementById('profile-edit-btn');
                      if (el) el.click();
                    }, 100); }}
                    className="flex w-full items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 rounded-lg"
                  >
                    <User className="h-4 w-4" />
                    My Profile
                  </button>

                  <button
                    onClick={handleLogout}
                    className="flex w-full items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-lg"
                  >
                    <LogOut className="h-4 w-4" />
                    Logout
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </header>
  );
};

export default Topbar;
