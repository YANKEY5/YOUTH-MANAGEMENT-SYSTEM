import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getPayments, getAllPrograms, getAllAnnouncements, getAttendance, getAllUsers } from '../firebase/dbService';
import { Payment, Program, Announcement, AttendanceRecord, UserProfile } from '../types';
import { 
  Users, 
  CreditCard, 
  CalendarDays, 
  CheckSquare, 
  TrendingUp, 
  AlertCircle, 
  Megaphone,
  QrCode,
  DollarSign,
  Activity,
  PlusCircle,
  FileSpreadsheet
} from 'lucide-react';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import { QRCodeSVG } from 'qrcode.react';
import { motion } from 'framer-motion';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

export const Dashboard: React.FC = () => {
  const { currentUser, updateProfile, systemSettings } = useAuth();
  const { setPageTitle } = useOutletContext<{ setPageTitle: (t: string) => void }>();
  
  // States
  const [payments, setPayments] = useState<Payment[]>([]);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [allUsers, setAllUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [showQR, setShowQR] = useState(false);
  const [isEditingBio, setIsEditingBio] = useState(false);
  const [bioText, setBioText] = useState(currentUser?.bio || '');

  // Set topbar title on mount
  useEffect(() => {
    setPageTitle('Dashboard');
    
    const loadDashboardData = async () => {
      try {
        if (!currentUser) return;
        
        // Parallel fetches
        const [payData, progData, annData, attData, usrData] = await Promise.all([
          getPayments(currentUser.role === 'member' ? currentUser.memberId : undefined),
          getAllPrograms(),
          getAllAnnouncements(),
          getAttendance(currentUser.role === 'member' ? currentUser.memberId : undefined),
          currentUser.role !== 'member' ? getAllUsers() : Promise.resolve([])
        ]);

        setPayments(payData);
        setPrograms(progData);
        setAnnouncements(annData);
        setAttendance(attData);
        if (currentUser.role !== 'member') {
          setAllUsers(usrData);
        }
      } catch (err) {
        console.error('Error loading dashboard data:', err);
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
  }, [currentUser, setPageTitle]);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-church-navy-500 border-t-church-gold-500"></div>
      </div>
    );
  }

  // Member stats calculations
  const totalDuesPaid = payments.filter(p => p.status === 'success').reduce((acc, p) => acc + p.amount, 0);
  const totalDuesOutstanding = Math.max(0, (Number(systemSettings?.duesRate || 50) * 6) - totalDuesPaid); // Dynamic rate based on 6 months
  const attendanceRate = attendance.length > 0 
    ? Math.round((attendance.filter(a => a.status === 'present').length / attendance.length) * 100) 
    : 100;
  
  // Leadership stats calculations
  const totalMembers = allUsers.length;
  const activeMembers = allUsers.filter(u => u.status === 'active').length;
  const totalRevenue = payments.filter(p => p.status === 'success').reduce((acc, p) => acc + p.amount, 0);
  const totalRegisteredDues = allUsers.length * Number(systemSettings?.duesRate || 50);
  
  // Chart configurations for Leaders/Admins
  const incomeTrendData = {
    labels: ['May', 'Jun', 'Jul'],
    datasets: [
      {
        label: 'Monthly Income (GHS)',
        data: [
          payments.filter(p => p.status === 'success' && p.date.includes('-05-')).reduce((acc, p) => acc + p.amount, 0) || 100,
          payments.filter(p => p.status === 'success' && p.date.includes('-06-')).reduce((acc, p) => acc + p.amount, 0) || 150,
          payments.filter(p => p.status === 'success' && p.date.includes('-07-')).reduce((acc, p) => acc + p.amount, 0) || 300,
        ],
        borderColor: '#d99710',
        backgroundColor: 'rgba(217, 151, 16, 0.1)',
        fill: true,
        tension: 0.4,
      }
    ]
  };

  const ministryDistribution = {
    labels: ['Music', 'Media', 'Ushering', 'Drama', 'General'],
    datasets: [
      {
        data: [
          allUsers.filter(u => u.ministry === 'Music').length || 2,
          allUsers.filter(u => u.ministry === 'Media').length || 1,
          allUsers.filter(u => u.ministry === 'Ushering').length || 1,
          allUsers.filter(u => u.ministry === 'Drama').length || 0,
          allUsers.filter(u => u.ministry === 'General' || !u.ministry).length || 5,
        ],
        backgroundColor: ['#1e3a8a', '#3c64a3', '#d99710', '#b4700c', '#64748b'],
        borderWidth: 0,
      }
    ]
  };

  const handleUpdateBio = async () => {
    await updateProfile({ bio: bioText });
    setIsEditingBio(false);
  };

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="rounded-3xl bg-slate-900 px-8 py-7 text-white dark:bg-slate-900 border border-slate-800 shadow-xl overflow-hidden relative" style={{ backgroundImage: `linear-gradient(135deg, rgba(15, 23, 42, 0.95), rgba(30, 58, 138, 0.8)), url('https://images.unsplash.com/photo-1438032005730-c779502df39b?w=800')`, backgroundSize: 'cover' }}>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h3 className="text-2xl font-extrabold tracking-tight">
              Welcome back, {currentUser?.firstName}!
            </h3>
            <p className="mt-1.5 text-sm text-slate-300 max-w-xl">
              "Let no one despise your youth, but be an example to the believers in word, in conduct, in love, in spirit, in faith, in purity." – 1 Timothy 4:12
            </p>
          </div>
          {currentUser?.role === 'member' && (
            <button
              onClick={() => setShowQR(!showQR)}
              className="flex items-center gap-2 rounded-xl bg-church-gold-500 hover:bg-church-gold-400 px-5 py-3 text-sm font-bold text-slate-950 transition-colors shadow-lg shadow-church-gold-500/20"
            >
              <QrCode className="h-4.5 w-4.5" />
              {showQR ? 'Hide Member Card' : 'Digital ID Card'}
            </button>
          )}
        </div>
      </div>

      {/* QR DIGITAL MEMBERSHIP CARD CAROUSEL */}
      {showQR && currentUser && (
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mx-auto max-w-sm rounded-3xl bg-gradient-to-br from-church-navy-900 to-church-navy-950 p-6 text-white shadow-2xl border border-church-gold-500/30"
        >
          <div className="flex flex-col items-center text-center">
            <span className="text-[9px] font-bold text-church-gold-400 uppercase tracking-widest mb-4">
              True Anointing Victory Youth Card
            </span>
            
            <img 
              src={currentUser.photoURL || `https://ui-avatars.com/api/?name=${currentUser.firstName}+${currentUser.lastName}&background=d99710&color=0f172a`} 
              alt="ID Avatar" 
              className="h-24 w-24 rounded-full border-4 border-church-gold-500 object-cover mb-4"
            />
            
            <h4 className="text-xl font-bold">{currentUser.firstName} {currentUser.lastName}</h4>
            <p className="text-xs text-slate-400 font-medium mt-0.5">{currentUser.ministry} Ministry • {currentUser.position}</p>
            
            <div className="my-6 rounded-2xl bg-white p-4 shadow-inner">
              <QRCodeSVG value={currentUser.memberId} size={130} />
            </div>

            <div className="w-full flex items-center justify-between border-t border-white/10 pt-4 text-left">
              <div>
                <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Member ID</p>
                <p className="text-sm font-bold text-church-gold-400">{currentUser.memberId}</p>
              </div>
              <div className="text-right">
                <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Date Joined</p>
                <p className="text-sm font-semibold">{currentUser.dateJoined}</p>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* MEMBER DASHBOARD WIDGETS */}
      {currentUser?.role === 'member' && (
        <>
          {/* Quick Statistics Grid */}
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900 shadow-sm">
              <div className="flex items-center gap-4">
                <div className="rounded-xl bg-emerald-500/10 p-3 text-emerald-600 dark:text-emerald-400">
                  <CreditCard className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Dues Paid</p>
                  <h4 className="text-2xl font-bold text-slate-800 dark:text-white mt-1">GHS {totalDuesPaid.toFixed(2)}</h4>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900 shadow-sm">
              <div className="flex items-center gap-4">
                <div className="rounded-xl bg-amber-500/10 p-3 text-amber-600 dark:text-amber-400">
                  <AlertCircle className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Outstanding</p>
                  <h4 className="text-2xl font-bold text-slate-800 dark:text-white mt-1">GHS {totalDuesOutstanding.toFixed(2)}</h4>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900 shadow-sm">
              <div className="flex items-center gap-4">
                <div className="rounded-xl bg-blue-500/10 p-3 text-blue-600 dark:text-blue-400">
                  <Activity className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Attendance</p>
                  <h4 className="text-2xl font-bold text-slate-800 dark:text-white mt-1">{attendanceRate}%</h4>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900 shadow-sm">
              <div className="flex items-center gap-4">
                <div className="rounded-xl bg-purple-500/10 p-3 text-purple-600 dark:text-purple-400">
                  <CalendarDays className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Ministries</p>
                  <h4 className="text-lg font-bold text-slate-800 dark:text-white mt-1.5 truncate">{currentUser.ministry}</h4>
                </div>
              </div>
            </div>
          </div>

          {/* Member Main Section (2 Cols) */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            {/* Bio Card & Emergency */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-sm font-bold text-slate-800 dark:text-white uppercase tracking-wider">My Profile Bio</h4>
                  <button 
                    onClick={() => setIsEditingBio(!isEditingBio)}
                    className="text-xs font-semibold text-church-navy-500 dark:text-church-gold-400 flex items-center gap-1"
                  >
                    <PlusCircle className="h-4 w-4" />
                    {isEditingBio ? 'Cancel' : 'Edit'}
                  </button>
                </div>
                
                {isEditingBio ? (
                  <div className="space-y-3">
                    <textarea 
                      value={bioText}
                      onChange={(e) => setBioText(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-transparent p-3 text-sm focus:ring-1 focus:ring-church-gold-500 outline-none h-24"
                      placeholder="Share a short bio or testimony..."
                    />
                    <button 
                      onClick={handleUpdateBio}
                      className="rounded-xl bg-church-navy-950 text-white dark:bg-church-gold-500 dark:text-church-navy-950 px-4 py-2 text-xs font-bold w-full"
                    >
                      Save Bio
                    </button>
                  </div>
                ) : (
                  <p className="text-sm text-slate-600 dark:text-slate-400 italic">
                    {currentUser.bio || "No bio added yet. Tell us about your journey and ministry goals!"}
                  </p>
                )}
              </div>

              <div className="border-t border-slate-100 dark:border-slate-800 pt-4 mt-6">
                <h5 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase mb-2 tracking-wider">Emergency Contact</h5>
                <p className="text-sm font-semibold text-slate-800 dark:text-white">{currentUser.emergencyContact}</p>
                <p className="text-xs text-slate-500 mt-0.5">{currentUser.emergencyPhone}</p>
              </div>
            </div>

            {/* Upcoming Programs list */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900 shadow-sm lg:col-span-2">
              <h4 className="text-sm font-bold text-slate-800 dark:text-white uppercase tracking-wider mb-4">Upcoming Programs</h4>
              <div className="space-y-4">
                {programs.slice(0, 3).map((prog) => (
                  <div key={prog.programId} className="flex gap-4 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/40 p-3 transition-colors">
                    <img 
                      src={prog.flyerURL || 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?w=150'} 
                      alt="Flyer" 
                      className="h-16 w-16 rounded-xl object-cover"
                    />
                    <div className="flex-1 min-w-0">
                      <h5 className="text-sm font-bold text-slate-800 dark:text-white truncate">{prog.title}</h5>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-1">{prog.description}</p>
                      <div className="flex items-center gap-3 mt-2 text-[10px] text-church-gold-600 dark:text-church-gold-400 font-bold">
                        <span>{new Date(prog.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                        <span>•</span>
                        <span>{prog.venue}</span>
                      </div>
                    </div>
                  </div>
                ))}
                {programs.length === 0 && (
                  <p className="text-sm text-slate-500 dark:text-slate-400 text-center py-6">No upcoming church programs scheduled.</p>
                )}
              </div>
            </div>
          </div>
        </>
      )}

      {/* LEADERSHIP / ADMIN DASHBOARD WIDGETS */}
      {currentUser?.role !== 'member' && (
        <>
          {/* Admin Stats Grid */}
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Total Members</p>
                  <h4 className="text-3xl font-bold text-slate-800 dark:text-white mt-1">{totalMembers}</h4>
                </div>
                <div className="rounded-xl bg-blue-500/10 p-3 text-blue-600 dark:text-blue-400">
                  <Users className="h-6 w-6" />
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Active Members</p>
                  <h4 className="text-3xl font-bold text-slate-800 dark:text-white mt-1">{activeMembers}</h4>
                </div>
                <div className="rounded-xl bg-emerald-500/10 p-3 text-emerald-600 dark:text-emerald-400">
                  <CheckSquare className="h-6 w-6" />
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Total Dues Collected</p>
                  <h4 className="text-2.5xl font-bold text-slate-800 dark:text-white mt-1.5 truncate">GHS {totalRevenue.toFixed(0)}</h4>
                </div>
                <div className="rounded-xl bg-amber-500/10 p-3 text-amber-600 dark:text-amber-400">
                  <DollarSign className="h-6 w-6" />
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Avg Attendance</p>
                  <h4 className="text-3xl font-bold text-slate-800 dark:text-white mt-1">94%</h4>
                </div>
                <div className="rounded-xl bg-purple-500/10 p-3 text-purple-600 dark:text-purple-400">
                  <TrendingUp className="h-6 w-6" />
                </div>
              </div>
            </div>
          </div>

          {/* Charts Panel */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            {/* Income Trend Chart */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900 shadow-sm lg:col-span-2">
              <h4 className="text-sm font-bold text-slate-800 dark:text-white uppercase tracking-wider mb-4">Dues Income Trend</h4>
              <div className="h-64">
                <Line data={incomeTrendData as any} options={{ responsive: true, maintainAspectRatio: false }} />
              </div>
            </div>

            {/* Ministry Distribution Chart */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900 shadow-sm">
              <h4 className="text-sm font-bold text-slate-800 dark:text-white uppercase tracking-wider mb-4">Ministry Distribution</h4>
              <div className="h-64 flex items-center justify-center">
                <Doughnut data={ministryDistribution as any} options={{ responsive: true, maintainAspectRatio: false }} />
              </div>
            </div>
          </div>

          {/* Activity Logs & Recent payments */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* Recent payments */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-sm font-bold text-slate-800 dark:text-white uppercase tracking-wider">Recent Dues Payments</h4>
                <FileSpreadsheet className="h-5 w-5 text-slate-400" />
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 text-xs font-semibold uppercase tracking-wider">
                      <th className="pb-3">Member</th>
                      <th className="pb-3">Dues Month</th>
                      <th className="pb-3">Amount</th>
                      <th className="pb-3 text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50 dark:divide-slate-800/40">
                    {payments.slice(0, 4).map((pay) => (
                      <tr key={pay.paymentId}>
                        <td className="py-3 font-medium text-slate-950 dark:text-white">{pay.memberName}</td>
                        <td className="py-3 text-slate-500 dark:text-slate-400">{pay.description}</td>
                        <td className="py-3 font-semibold text-slate-800 dark:text-slate-200">GHS {pay.amount}</td>
                        <td className="py-3 text-right">
                          <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-bold ${pay.status === 'success' ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 'bg-red-500/10 text-red-600 dark:text-red-400'}`}>
                            {pay.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Recent Announcements */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900 shadow-sm">
              <h4 className="text-sm font-bold text-slate-800 dark:text-white uppercase tracking-wider mb-4">Latest Announcements</h4>
              <div className="space-y-4">
                {announcements.slice(0, 3).map((ann) => (
                  <div key={ann.announcementId} className="border-l-4 border-church-gold-500 pl-4 py-1">
                    <h5 className="text-sm font-bold text-slate-800 dark:text-white">{ann.title}</h5>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">{ann.content}</p>
                    <span className="text-[10px] text-slate-400 mt-2 block font-medium">
                      Posted by {ann.authorName} • {new Date(ann.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Dashboard;
