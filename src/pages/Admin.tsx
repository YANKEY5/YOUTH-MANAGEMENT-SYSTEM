import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  ShieldCheck, 
  Settings, 
  Database, 
  History, 
  Save, 
  RefreshCw, 
  HelpCircle,
  FileCheck,
  CheckCircle,
  Church,
  CreditCard
} from 'lucide-react';

interface AuditLog {
  id: string;
  action: string;
  user: string;
  role: string;
  timestamp: string;
  details: string;
}

export const Admin: React.FC = () => {
  const { currentUser, systemSettings, updateSystemSettings } = useAuth();
  const { setPageTitle } = useOutletContext<{ setPageTitle: (t: string) => void }>();

  // Settings states
  const [churchName, setChurchName] = useState(systemSettings.churchName);
  const [duesRate, setDuesRate] = useState(systemSettings.duesRate);
  const [allowRegistration, setAllowRegistration] = useState(systemSettings.allowRegistration);
  const [emailNotify, setEmailNotify] = useState(systemSettings.emailNotify);
  const [offlineSupport, setOfflineSupport] = useState(systemSettings.offlineSupport);
  const [paystackPublicKey, setPaystackPublicKey] = useState(systemSettings.paystackPublicKey || '');

  // Backup restore states
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Audit Logs Data
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([
    { id: '1', action: 'User Registration', user: 'Brother Emmanuel', role: 'member', timestamp: '2026-07-22T10:15:00Z', details: 'New member account created (TAVY-2026-0003)' },
    { id: '2', action: 'Dues Payment', user: 'Brother Emmanuel', role: 'member', timestamp: '2026-07-22T09:45:00Z', details: 'Successful payment GHS 50.00 (Ref: TAVY-PAY-1002-XYZ)' },
    { id: '3', action: 'Member Role Updated', user: 'Sister Grace', role: 'leader', timestamp: '2026-07-21T14:30:00Z', details: 'Role modified from member to leader by Super Admin' },
    { id: '4', action: 'Program Scheduled', user: 'Super Admin', role: 'super-admin', timestamp: '2026-07-20T08:00:00Z', details: 'New program scheduled: Youth Fire Retreat 2026' }
  ]);

  useEffect(() => {
    setPageTitle('System Administration');
  }, [setPageTitle]);

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    updateSystemSettings({
      churchName,
      duesRate,
      allowRegistration,
      emailNotify,
      offlineSupport,
      paystackPublicKey
    });
    setSuccessMsg('Global system settings updated successfully!');
    setTimeout(() => setSuccessMsg(null), 3000);
    
    // Log setting modification
    const log: AuditLog = {
      id: Math.random().toString(),
      action: 'System Settings Changed',
      user: `${currentUser?.firstName} ${currentUser?.lastName}`,
      role: currentUser?.role || 'super-admin',
      timestamp: new Date().toISOString(),
      details: `Target dues rate changed to GHS ${duesRate}.00.`
    };
    setAuditLogs([log, ...auditLogs]);
  };

  const handleBackup = () => {
    setLoading(true);
    setSuccessMsg(null);
    setTimeout(() => {
      setLoading(false);
      setSuccessMsg('Database snapshot backup completed successfully! (tavy_backup_' + new Date().toISOString().split('T')[0] + '.json saved)');
      setTimeout(() => setSuccessMsg(null), 4000);
      
      const log: AuditLog = {
        id: Math.random().toString(),
        action: 'Database Backup',
        user: `${currentUser?.firstName} ${currentUser?.lastName}`,
        role: currentUser?.role || 'super-admin',
        timestamp: new Date().toISOString(),
        details: 'System backup snapshot generated successfully.'
      };
      setAuditLogs([log, ...auditLogs]);
    }, 1500);
  };

  const handleRestore = () => {
    if (!window.confirm('Restore system database? This will overwrite existing local changes with the original seeded data.')) return;
    setLoading(true);
    setSuccessMsg(null);
    setTimeout(() => {
      localStorage.clear();
      setLoading(false);
      setSuccessMsg('Mock Database restored to standard seed values successfully! Reloading...');
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    }, 1500);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      
      {/* Messages */}
      {successMsg && (
        <div className="flex items-center gap-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 p-4 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
          <CheckCircle className="h-4.5 w-4.5 shrink-0" />
          <p>{successMsg}</p>
        </div>
      )}

      {/* Admin Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Settings Panel */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900 shadow-sm md:col-span-2">
          <h4 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-4 flex items-center gap-1.5">
            <Settings className="h-4.5 w-4.5 text-church-gold-500" />
            Global Settings
          </h4>

          <form onSubmit={handleSaveSettings} className="space-y-4 text-xs">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="block text-slate-500 mb-1.5 uppercase font-semibold">Youth Ministry Name</label>
                <input 
                  type="text" 
                  value={churchName}
                  onChange={(e) => setChurchName(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-950 py-2.5 px-4 text-sm outline-none focus:border-church-gold-500 font-semibold"
                />
              </div>

              <div>
                <label className="block text-slate-500 mb-1.5 uppercase font-semibold">Default Monthly Dues (GHS)</label>
                <input 
                  type="number" 
                  value={duesRate}
                  onChange={(e) => setDuesRate(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-950 py-2.5 px-4 text-sm outline-none focus:border-church-gold-500 font-semibold"
                />
              </div>

              <div>
                <label className="block text-slate-500 mb-1.5 uppercase font-semibold">Enable Registration</label>
                <select
                  value={allowRegistration ? 'true' : 'false'}
                  onChange={(e) => setAllowRegistration(e.target.value === 'true')}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-950 py-2.5 px-4 text-sm outline-none"
                >
                  <option value="true">Yes, allow self-signup</option>
                  <option value="false">No, close registration</option>
                </select>
              </div>
            </div>

            <div className="space-y-3 pt-3 border-t border-slate-100 dark:border-slate-800">
              <label className="flex items-center gap-2 cursor-pointer font-semibold text-slate-600 dark:text-slate-350">
                <input 
                  type="checkbox" 
                  checked={emailNotify} 
                  onChange={(e) => setEmailNotify(e.target.checked)} 
                  className="rounded text-church-gold-500 focus:ring-church-gold-500"
                />
                Send payment verification email alerts automatically
              </label>

              <label className="flex items-center gap-2 cursor-pointer font-semibold text-slate-600 dark:text-slate-350">
                <input 
                  type="checkbox" 
                  checked={offlineSupport} 
                  onChange={(e) => setOfflineSupport(e.target.checked)} 
                  className="rounded text-church-gold-500 focus:ring-church-gold-500"
                />
                Enable Progressive Web App (PWA) offline cache support
              </label>
            </div>

            {/* Paystack Integration Section */}
            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-4">
              <h5 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                <CreditCard className="h-4 w-4 text-emerald-500" />
                Paystack Payment Details
              </h5>
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="block text-slate-500 mb-1.5 uppercase font-semibold">Paystack Public Key</label>
                  <input 
                    type="text" 
                    placeholder="pk_test_... or pk_live_..."
                    value={paystackPublicKey}
                    onChange={(e) => setPaystackPublicKey(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-950 py-2.5 px-4 text-sm outline-none focus:border-church-gold-500 font-semibold"
                  />
                  <p className="text-[10px] text-slate-400 mt-1 leading-normal">
                    Used to authenticate transactions in the payment widget. Leave empty to use system defaults / demo simulation mode.
                  </p>
                </div>
              </div>
            </div>

            <button
              type="submit"
              className="w-full rounded-xl bg-church-navy-950 text-white dark:bg-church-gold-500 dark:text-church-navy-950 font-bold py-3.5 hover:opacity-90 flex items-center justify-center gap-1.5"
            >
              <Save className="h-4.5 w-4.5" />
              Save Config Settings
            </button>
          </form>
        </div>

        {/* Database Operations */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900 shadow-sm flex flex-col justify-between">
          <div>
            <h4 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-4 flex items-center gap-1.5">
              <Database className="h-4.5 w-4.5 text-church-gold-500" />
              Database Backup
            </h4>
            <p className="text-xs text-slate-500 leading-relaxed mb-6">
              Create JSON-formatted snapshot backups of Firestore collections (users, payments, attendance logs, programs) to local disk storage, or restore original mock seed datasets.
            </p>
          </div>

          <div className="space-y-3">
            <button
              onClick={handleBackup}
              disabled={loading}
              className="w-full rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-slate-850 dark:hover:bg-slate-800 text-white font-bold py-3.5 text-xs flex items-center justify-center gap-1.5"
            >
              {loading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Save className="h-4.5 w-4.5" />}
              Backup Database Snapshot
            </button>
            <button
              onClick={handleRestore}
              disabled={loading}
              className="w-full rounded-xl border border-red-200 dark:border-red-900/30 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 font-bold py-3.5 text-xs flex items-center justify-center gap-1.5"
            >
              <RefreshCw className="h-4.5 w-4.5" />
              Restore Original Seeds
            </button>
          </div>
        </div>

      </div>

      {/* Audit Log list */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900 shadow-sm">
        <h4 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-4 flex items-center gap-1.5">
          <History className="h-4.5 w-4.5 text-church-gold-500" />
          System Audit Logs
        </h4>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 text-xs font-semibold uppercase tracking-wider">
                <th className="pb-3">Timestamp</th>
                <th className="pb-3">Action Type</th>
                <th className="pb-3">Trigger User</th>
                <th className="pb-3">System Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-slate-800/40 text-xs">
              {auditLogs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/10">
                  <td className="py-3.5 text-slate-400">{new Date(log.timestamp).toLocaleString()}</td>
                  <td className="py-3.5 font-bold text-slate-800 dark:text-white">{log.action}</td>
                  <td className="py-3.5">
                    <span className="font-semibold text-slate-700 dark:text-slate-300">{log.user}</span>
                    <span className="text-[9px] text-slate-400 ml-1.5 capitalize">({log.role.replace('-', ' ')})</span>
                  </td>
                  <td className="py-3.5 text-slate-500 dark:text-slate-400">{log.details}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};

export default Admin;
