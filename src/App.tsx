import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Sidebar from './components/Layout/Sidebar';
import Topbar from './components/Layout/Topbar';

// Page Imports
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Programs from './pages/Programs';
import Dues from './pages/Dues';
import Announcements from './pages/Announcements';
import Members from './pages/Members';
import Attendance from './pages/Attendance';
import Vault from './pages/Vault';
import Admin from './pages/Admin';
import Chat from './pages/Chat';

// App Layout Wrapper
const AppLayout: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [pageTitle, setPageTitle] = useState('Dashboard');

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-50 text-slate-900 transition-colors duration-200 dark:bg-slate-950 dark:text-slate-100">
      {/* Sidebar Navigation */}
      <Sidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />
      
      {/* Main Container */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Topbar Header */}
        <Topbar onMenuClick={() => setSidebarOpen(true)} title={pageTitle} />
        
        {/* Scrollable View Area */}
        <main className="flex-1 overflow-y-auto p-6 md:p-8">
          <Outlet context={{ setPageTitle }} />
        </main>
      </div>
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public Authentication Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Secure Protected Routes */}
          <Route path="/" element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="programs" element={<Programs />} />
            <Route path="dues" element={<Dues />} />
            <Route path="announcements" element={<Announcements />} />
            <Route path="members" element={<Members />} />
            <Route path="vault" element={<Vault />} />
            <Route path="chat" element={<Chat />} />
            
            {/* Leaders & Admins Only */}
            <Route path="attendance" element={
              <ProtectedRoute allowedRoles={['super-admin', 'leader']}>
                <Attendance />
              </ProtectedRoute>
            } />

            {/* Super Admin Only */}
            <Route path="admin" element={
              <ProtectedRoute allowedRoles={['super-admin']}>
                <Admin />
              </ProtectedRoute>
            } />
          </Route>

          {/* Fallback Redirection */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
};

export default App;
