import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getAllUsers, updateUserProfile } from '../firebase/dbService';
import { UserProfile, UserRole, UserStatus } from '../types';
import { 
  Search, 
  Filter, 
  Download, 
  MoreVertical, 
  Shield, 
  Ban, 
  CheckCircle,
  FileSpreadsheet,
  X,
  Phone,
  Mail,
  MapPin,
  Calendar,
  AlertCircle
} from 'lucide-react';

export const Members: React.FC = () => {
  const { currentUser } = useAuth();
  const { setPageTitle } = useOutletContext<{ setPageTitle: (t: string) => void }>();

  // Data States
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);

  // Search/Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [filterGender, setFilterGender] = useState('all');
  const [filterMinistry, setFilterMinistry] = useState('all');
  const [filterRole, setFilterRole] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');

  // Detail Modal
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [editingRole, setEditingRole] = useState<UserRole>('member');
  const [editingStatus, setEditingStatus] = useState<UserStatus>('active');

  useEffect(() => {
    setPageTitle('Members Directory');
    loadUsers();
  }, [setPageTitle]);

  const loadUsers = async () => {
    try {
      const data = await getAllUsers();
      setUsers(data);
    } catch (err) {
      console.error('Error loading users:', err);
    } finally {
      setLoading(false);
    }
  };

  // Admin Actions
  const handleUpdateRole = async (uid: string, role: UserRole) => {
    if (!window.confirm(`Are you sure you want to change this user's role to ${role}?`)) return;
    try {
      await updateUserProfile(uid, { role });
      setUsers(users.map(u => u.uid === uid ? { ...u, role } : u));
      if (selectedUser?.uid === uid) {
        setSelectedUser({ ...selectedUser, role });
      }
    } catch (err) {
      console.error('Failed to update role:', err);
    }
  };

  const handleUpdateStatus = async (uid: string, status: UserStatus) => {
    if (!window.confirm(`Are you sure you want to change this user's status to ${status}?`)) return;
    try {
      await updateUserProfile(uid, { status });
      setUsers(users.map(u => u.uid === uid ? { ...u, status } : u));
      if (selectedUser?.uid === uid) {
        setSelectedUser({ ...selectedUser, status });
      }
    } catch (err) {
      console.error('Failed to update status:', err);
    }
  };

  // CSV Export Utility
  const handleExportCSV = () => {
    const headers = ['Member ID', 'First Name', 'Last Name', 'Email', 'Phone', 'Gender', 'Ministry', 'Position', 'Role', 'Status', 'Date Joined'];
    const rows = filteredUsers.map(u => [
      u.memberId,
      u.firstName,
      u.lastName,
      u.email,
      u.phone,
      u.gender,
      u.ministry,
      u.position,
      u.role,
      u.status,
      u.dateJoined
    ]);

    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(','), ...rows.map(e => e.map(val => `"${val}"`).join(","))].join("\n");
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `TAVY_Members_Export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Filter application logic
  const filteredUsers = users.filter(u => {
    const matchesSearch = 
      `${u.firstName} ${u.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.memberId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (u.phone && u.phone.includes(searchTerm)) ||
      (u.occupation && u.occupation.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesGender = filterGender === 'all' || u.gender === filterGender;
    const matchesMinistry = filterMinistry === 'all' || u.ministry === filterMinistry;
    const matchesRole = filterRole === 'all' || u.role === filterRole;
    const matchesStatus = filterStatus === 'all' || u.status === filterStatus;

    return matchesSearch && matchesGender && matchesMinistry && matchesRole && matchesStatus;
  });

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-church-navy-500 border-t-church-gold-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      
      {/* Search & Actions Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Filters */}
        <div className="grid grid-cols-2 md:flex flex-1 gap-3">
          <div className="relative col-span-2 md:flex-1">
            <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search members by name, ID, phone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-xs outline-none focus:border-church-navy-500 dark:border-slate-800 dark:bg-slate-900"
            />
          </div>

          <select
            value={filterGender}
            onChange={(e) => setFilterGender(e.target.value)}
            className="rounded-xl border border-slate-200 bg-white py-2.5 px-3 text-xs outline-none dark:border-slate-800 dark:bg-slate-900"
          >
            <option value="all">All Genders</option>
            <option value="Male">Male</option>
            <option value="Female">Female</option>
          </select>

          <select
            value={filterMinistry}
            onChange={(e) => setFilterMinistry(e.target.value)}
            className="rounded-xl border border-slate-200 bg-white py-2.5 px-3 text-xs outline-none dark:border-slate-800 dark:bg-slate-900"
          >
            <option value="all">All Ministries</option>
            <option value="Music">Music</option>
            <option value="Media">Media</option>
            <option value="Ushering">Ushering</option>
            <option value="Drama">Drama</option>
            <option value="Prayer">Prayer</option>
            <option value="General">General / None</option>
          </select>

          {currentUser?.role !== 'member' && (
            <>
              <select
                value={filterRole}
                onChange={(e) => setFilterRole(e.target.value)}
                className="rounded-xl border border-slate-200 bg-white py-2.5 px-3 text-xs outline-none dark:border-slate-800 dark:bg-slate-900"
              >
                <option value="all">All Roles</option>
                <option value="super-admin">Super Admin</option>
                <option value="leader">Leaders</option>
                <option value="member">Members</option>
              </select>

              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="rounded-xl border border-slate-200 bg-white py-2.5 px-3 text-xs outline-none dark:border-slate-800 dark:bg-slate-900"
              >
                <option value="all">All Statuses</option>
                <option value="active">Active</option>
                <option value="suspended">Suspended</option>
              </select>
            </>
          )}
        </div>

        {/* CSV Export */}
        <button
          onClick={handleExportCSV}
          className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 py-3 px-4 text-xs font-bold hover:bg-slate-50 transition-colors shrink-0"
        >
          <Download className="h-4 w-4" />
          Export CSV
        </button>
      </div>

      {/* Directory Table */}
      <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 text-xs font-semibold uppercase tracking-wider bg-slate-50 dark:bg-slate-950/20">
                <th className="p-4">Name</th>
                <th className="p-4">Member ID</th>
                <th className="p-4">Ministry</th>
                <th className="p-4">Phone</th>
                <th className="p-4">Role</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-slate-800/40">
              {filteredUsers.map((user) => (
                <tr key={user.uid} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/10 transition-colors">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <img 
                        src={user.photoURL || `https://ui-avatars.com/api/?name=${user.firstName}+${user.lastName}&background=3c64a3&color=fff`} 
                        alt="Avatar" 
                        className="h-9 w-9 rounded-full object-cover border border-slate-200"
                      />
                      <div>
                        <p className="font-bold text-slate-900 dark:text-white">{user.firstName} {user.lastName}</p>
                        <p className="text-[10px] text-slate-400">{user.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="p-4 text-xs font-mono font-semibold text-slate-500">{user.memberId}</td>
                  <td className="p-4">
                    <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">{user.ministry}</span>
                  </td>
                  <td className="p-4 text-xs text-slate-500">{user.phone || 'N/A'}</td>
                  <td className="p-4 capitalize text-xs">
                    <span className={`inline-flex rounded-full px-2 py-0.5 font-bold ${user.role === 'super-admin' ? 'bg-red-500/10 text-red-600 dark:text-red-400' : user.role === 'leader' ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400' : 'bg-blue-500/10 text-blue-600 dark:text-blue-400'}`}>
                      {user.role.replace('-', ' ')}
                    </span>
                  </td>
                  <td className="p-4 capitalize text-xs">
                    <span className={`inline-flex rounded-full px-2.5 py-0.5 font-bold ${user.status === 'active' ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 'bg-red-500/10 text-red-600 dark:text-red-400'}`}>
                      {user.status}
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    <button
                      onClick={() => { setSelectedUser(user); setEditingRole(user.role); setEditingStatus(user.status); }}
                      className="text-xs font-bold text-church-navy-500 dark:text-church-gold-400 hover:underline"
                    >
                      View Profile
                    </button>
                  </td>
                </tr>
              ))}
              {filteredUsers.length === 0 && (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-500 dark:text-slate-400 text-sm">
                    No members registered matching search query.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* DETAIL MODAL OVERLAY */}
      {selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm">
          <div className="relative w-full max-w-2xl rounded-3xl bg-white dark:bg-slate-900 p-6 shadow-2xl border border-slate-200 dark:border-slate-800 max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex justify-between items-start border-b border-slate-100 dark:border-slate-800 pb-4 mb-5">
              <div>
                <h4 className="text-lg font-bold text-slate-900 dark:text-white">Youth Member Profile</h4>
                <p className="text-xs text-slate-400 mt-0.5">Member ID: {selectedUser.memberId}</p>
              </div>
              <button 
                onClick={() => setSelectedUser(null)}
                className="rounded-xl p-1 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="space-y-6">
              {/* Profile Card Header */}
              <div className="flex flex-col sm:flex-row items-center gap-4 bg-slate-50 dark:bg-slate-950/20 p-4 rounded-2xl border border-slate-100 dark:border-slate-800/40">
                <img 
                  src={selectedUser.photoURL || `https://ui-avatars.com/api/?name=${selectedUser.firstName}+${selectedUser.lastName}&background=3c64a3&color=fff`} 
                  alt="Avatar" 
                  className="h-20 w-20 rounded-full border-2 border-church-gold-500 object-cover"
                />
                <div className="text-center sm:text-left flex-1 min-w-0">
                  <h3 className="text-lg font-extrabold text-slate-900 dark:text-white leading-none">
                    {selectedUser.firstName} {selectedUser.lastName}
                  </h3>
                  <p className="text-xs text-slate-400 font-semibold mt-1">Ministry of {selectedUser.ministry} • {selectedUser.position}</p>
                  <p className="text-xs text-slate-400 mt-0.5">Joined on {new Date(selectedUser.dateJoined).toLocaleDateString()}</p>
                  {selectedUser.bio && (
                    <p className="text-xs text-slate-500 italic mt-2.5 max-w-md">"{selectedUser.bio}"</p>
                  )}
                </div>
              </div>

              {/* Data Grid fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                  <Phone className="h-4.5 w-4.5 text-church-gold-500 shrink-0" />
                  <span>Phone: <strong className="text-slate-900 dark:text-slate-200">{selectedUser.phone || 'N/A'}</strong></span>
                </div>
                <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                  <Mail className="h-4.5 w-4.5 text-church-gold-500 shrink-0" />
                  <span>Email: <strong className="text-slate-900 dark:text-slate-200">{selectedUser.email}</strong></span>
                </div>
                <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                  <MapPin className="h-4.5 w-4.5 text-church-gold-500 shrink-0" />
                  <span>Address: <strong className="text-slate-900 dark:text-slate-200">{selectedUser.residentialAddress}</strong></span>
                </div>
                <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                  <Calendar className="h-4.5 w-4.5 text-church-gold-500 shrink-0" />
                  <span>Date of Birth: <strong className="text-slate-900 dark:text-slate-200">{selectedUser.dateOfBirth}</strong></span>
                </div>
                <div className="col-span-1 sm:col-span-2 border-t border-slate-100 dark:border-slate-800/60 pt-4 mt-2">
                  <h5 className="font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wide mb-2">Emergency Details</h5>
                  <div className="grid grid-cols-2 gap-2 text-slate-600 dark:text-slate-400">
                    <span>Contact: <strong className="text-slate-900 dark:text-slate-200">{selectedUser.emergencyContact}</strong></span>
                    <span>Emergency Phone: <strong className="text-slate-900 dark:text-slate-200">{selectedUser.emergencyPhone}</strong></span>
                  </div>
                </div>
              </div>

              {/* ADMIN CONTROLS MODIFIER WIDGET (Visible only for Super Admin) */}
              {currentUser && currentUser.role === 'super-admin' && currentUser.uid !== selectedUser.uid && (
                <div className="border-t border-slate-150 dark:border-slate-800/80 pt-5 space-y-4">
                  <h5 className="text-xs font-bold text-red-600 dark:text-red-400 uppercase tracking-widest flex items-center gap-1.5">
                    <Shield className="h-4 w-4" /> System Admin Control Panel
                  </h5>

                  <div className="grid grid-cols-2 gap-4">
                    {/* Role update drop */}
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Modify System Role</label>
                      <select
                        value={editingRole}
                        onChange={(e) => {
                          const val = e.target.value as UserRole;
                          setEditingRole(val);
                          handleUpdateRole(selectedUser.uid, val);
                        }}
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-950 py-2 px-3 text-xs outline-none"
                      >
                        <option value="member">Member</option>
                        <option value="leader">Youth Leader</option>
                        <option value="super-admin">Super Admin</option>
                      </select>
                    </div>

                    {/* Status Toggle */}
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Suspend / Suspend Status</label>
                      <select
                        value={editingStatus}
                        onChange={(e) => {
                          const val = e.target.value as UserStatus;
                          setEditingStatus(val);
                          handleUpdateStatus(selectedUser.uid, val);
                        }}
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-950 py-2 px-3 text-xs outline-none"
                      >
                        <option value="active">Active</option>
                        <option value="suspended">Suspended</option>
                        <option value="inactive">Inactive</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default Members;
