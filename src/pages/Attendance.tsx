import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  getAttendance, 
  getAllPrograms, 
  getAllUsers, 
  recordAttendance,
  checkInAttendee
} from '../firebase/dbService';
import { Program, UserProfile, AttendanceRecord } from '../types';
import { 
  CheckSquare, 
  Calendar, 
  QrCode, 
  Search, 
  Filter, 
  UserCheck, 
  AlertCircle, 
  Activity,
  CheckCircle,
  FileSpreadsheet
} from 'lucide-react';

export const Attendance: React.FC = () => {
  const { currentUser } = useAuth();
  const { setPageTitle } = useOutletContext<{ setPageTitle: (t: string) => void }>();

  // Data States
  const [programs, setPrograms] = useState<Program[]>([]);
  const [members, setMembers] = useState<UserProfile[]>([]);
  const [pastAttendance, setPastAttendance] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);

  // Form selections (Recording)
  const [selectedProgramId, setSelectedProgramId] = useState('');
  const [attendanceDate, setAttendanceDate] = useState(new Date().toISOString().split('T')[0]);
  const [roster, setRoster] = useState<{ [uid: string]: { status: 'present' | 'absent' | 'excused', remarks: string } }>({});
  
  // QR/Ticket Scan Simulator
  const [scanTicketCode, setScanTicketCode] = useState('');
  const [scanMessage, setScanMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  
  // History tab search/filters
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'record' | 'history' | 'scan'>('record');

  useEffect(() => {
    setPageTitle('Attendance Tracker');
    loadTrackerData();
  }, [setPageTitle]);

  const loadTrackerData = async () => {
    try {
      const [progs, usrs, attLog] = await Promise.all([
        getAllPrograms(),
        getAllUsers(),
        getAttendance()
      ]);
      
      setPrograms(progs);
      const mbrsOnly = usrs.filter(u => u.role === 'member');
      setMembers(mbrsOnly);
      setPastAttendance(attLog);

      if (progs.length > 0) {
        setSelectedProgramId(progs[0].programId);
      }

      // Initialize roster mapping
      const initialRoster: typeof roster = {};
      mbrsOnly.forEach(m => {
        initialRoster[m.uid] = { status: 'present', remarks: '' };
      });
      setRoster(initialRoster);
    } catch (err) {
      console.error('Failed to load attendance tracker datasets:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = (uid: string, status: 'present' | 'absent' | 'excused') => {
    setRoster(prev => ({
      ...prev,
      [uid]: { ...prev[uid], status }
    }));
  };

  const handleRemarksChange = (uid: string, remarks: string) => {
    setRoster(prev => ({
      ...prev,
      [uid]: { ...prev[uid], remarks }
    }));
  };

  const handleRecordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !selectedProgramId) return;

    const prog = programs.find(p => p.programId === selectedProgramId);
    if (!prog) return;

    const records: Omit<AttendanceRecord, 'attendanceId' | 'createdAt'>[] = Object.keys(roster).map(uid => {
      const member = members.find(m => m.uid === uid);
      return {
        date: attendanceDate,
        programId: selectedProgramId,
        programTitle: prog.title,
        memberId: member?.memberId || '',
        memberName: `${member?.firstName} ${member?.lastName}`,
        status: roster[uid].status,
        remarks: roster[uid].remarks,
        recordedBy: currentUser.uid,
        recordedByName: `${currentUser.firstName} ${currentUser.lastName}`
      };
    });

    try {
      setLoading(true);
      await recordAttendance(records);
      alert('Attendance roster successfully logged!');
      // Reload history logs
      const attLog = await getAttendance();
      setPastAttendance(attLog);
      setActiveTab('history');
    } catch (err) {
      console.error('Error recording attendance:', err);
    } finally {
      setLoading(false);
    }
  };

  // QR / Ticket Scanner simulator
  const handleTicketCheckIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!scanTicketCode.trim() || !selectedProgramId) return;
    setScanMessage(null);
    try {
      const reg = await checkInAttendee(selectedProgramId, scanTicketCode.trim());
      setScanMessage({
        type: 'success',
        text: `Checked in successfully: ${reg.memberName} (Ticket ${reg.ticketCode})`
      });
      setScanTicketCode('');
      
      // Update roster
      const memberUser = members.find(m => m.memberId === reg.memberId);
      if (memberUser) {
        setRoster(prev => ({
          ...prev,
          [memberUser.uid]: { status: 'present', remarks: 'Checked in via ticket scanning' }
        }));
      }

      // Reload logs
      const attLog = await getAttendance();
      setPastAttendance(attLog);
    } catch (err: any) {
      setScanMessage({
        type: 'error',
        text: err.message || 'Ticket scanning failed. Invalid code or event mismatch.'
      });
    }
  };

  const filteredHistory = pastAttendance.filter(a => 
    a.memberName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    a.programTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
    a.remarks?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-church-navy-500 border-t-church-gold-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      
      {/* Navigation tabs */}
      <div className="border-b border-slate-200 dark:border-slate-800">
        <div className="flex gap-4">
          <button
            onClick={() => setActiveTab('record')}
            className={`border-b-2 px-4 py-2 text-sm font-bold transition-colors ${activeTab === 'record' ? 'border-church-gold-500 text-slate-900 dark:text-white' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
          >
            Record Roll Call
          </button>
          <button
            onClick={() => setActiveTab('scan')}
            className={`border-b-2 px-4 py-2 text-sm font-bold transition-colors ${activeTab === 'scan' ? 'border-church-gold-500 text-slate-900 dark:text-white' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
          >
            Ticket Scanner (QR)
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`border-b-2 px-4 py-2 text-sm font-bold transition-colors ${activeTab === 'history' ? 'border-church-gold-500 text-slate-900 dark:text-white' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
          >
            Attendance Logs
          </button>
        </div>
      </div>

      {/* RECORD TAB CONTENT */}
      {activeTab === 'record' && (
        <form onSubmit={handleRecordSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 rounded-2xl bg-white dark:bg-slate-900 p-5 border border-slate-200 dark:border-slate-800/80 shadow-sm">
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase">Select Program *</label>
              <select
                value={selectedProgramId}
                onChange={(e) => setSelectedProgramId(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-950 py-3 px-4 text-sm outline-none focus:border-church-gold-500"
              >
                {programs.map(p => (
                  <option key={p.programId} value={p.programId}>{p.title} ({p.date})</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase">Roll Call Date *</label>
              <input 
                type="date"
                required
                value={attendanceDate}
                onChange={(e) => setAttendanceDate(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-950 py-2.5 px-4 text-sm outline-none focus:border-church-gold-500"
              />
            </div>
          </div>

          {/* Roster list */}
          <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 text-xs font-semibold uppercase tracking-wider bg-slate-50 dark:bg-slate-950/20">
                    <th className="p-4">Member Name</th>
                    <th className="p-4">Member ID</th>
                    <th className="p-4">Roster Status</th>
                    <th className="p-4">Remarks / Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 dark:divide-slate-800/40">
                  {members.map((member) => (
                    <tr key={member.uid} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/10">
                      <td className="p-4 font-bold text-slate-900 dark:text-white">
                        {member.firstName} {member.lastName}
                      </td>
                      <td className="p-4 text-xs font-mono font-semibold text-slate-500">{member.memberId}</td>
                      <td className="p-4">
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => handleStatusChange(member.uid, 'present')}
                            className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${roster[member.uid]?.status === 'present' ? 'bg-emerald-500 text-white shadow-sm' : 'bg-slate-100 hover:bg-slate-200 text-slate-600 dark:bg-slate-800 dark:text-slate-400'}`}
                          >
                            Present
                          </button>
                          <button
                            type="button"
                            onClick={() => handleStatusChange(member.uid, 'absent')}
                            className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${roster[member.uid]?.status === 'absent' ? 'bg-red-500 text-white shadow-sm' : 'bg-slate-100 hover:bg-slate-200 text-slate-600 dark:bg-slate-800 dark:text-slate-400'}`}
                          >
                            Absent
                          </button>
                          <button
                            type="button"
                            onClick={() => handleStatusChange(member.uid, 'excused')}
                            className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${roster[member.uid]?.status === 'excused' ? 'bg-amber-500 text-white shadow-sm' : 'bg-slate-100 hover:bg-slate-200 text-slate-600 dark:bg-slate-800 dark:text-slate-400'}`}
                          >
                            Excused
                          </button>
                        </div>
                      </td>
                      <td className="p-4">
                        <input 
                          type="text" 
                          placeholder="e.g. sick leave, late arrival"
                          value={roster[member.uid]?.remarks || ''}
                          onChange={(e) => handleRemarksChange(member.uid, e.target.value)}
                          className="rounded-lg border border-slate-200 dark:border-slate-800 bg-transparent py-1.5 px-3 text-xs w-full outline-none focus:border-church-gold-500"
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <button 
            type="submit"
            className="w-full rounded-xl bg-church-navy-950 text-white dark:bg-church-gold-500 dark:text-church-navy-950 py-3.5 text-sm font-bold shadow-md hover:opacity-90"
          >
            Submit Attendance Roster
          </button>
        </form>
      )}

      {/* SCAN TICKET TAB */}
      {activeTab === 'scan' && (
        <div className="max-w-md mx-auto rounded-3xl border border-slate-200 bg-white p-6 shadow-md dark:border-slate-800 dark:bg-slate-900 text-center">
          <QrCode className="h-12 w-12 text-church-gold-500 mx-auto mb-4" />
          <h4 className="text-base font-bold text-slate-900 dark:text-white uppercase tracking-wider">Simulate Ticket Scan Check-In</h4>
          <p className="text-xs text-slate-500 mt-1 leading-relaxed">
            Enter the ticket reference code manually (found on the member's event ticket registration card) to verify and check them in.
          </p>

          <form onSubmit={handleTicketCheckIn} className="mt-6 space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase text-left">Select Program Event</label>
              <select
                value={selectedProgramId}
                onChange={(e) => setSelectedProgramId(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-950 py-2.5 px-3.5 text-sm outline-none"
              >
                {programs.map(p => (
                  <option key={p.programId} value={p.programId}>{p.title}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase text-left">Ticket Reference Code</label>
              <input 
                type="text" 
                required
                value={scanTicketCode}
                onChange={(e) => setScanTicketCode(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-950 py-2.5 px-3.5 text-sm outline-none focus:border-church-gold-500 font-mono"
                placeholder="e.g. TKT-FIRE-9821-EM"
              />
            </div>

            <button 
              type="submit"
              className="w-full rounded-xl bg-church-navy-950 text-white dark:bg-church-gold-500 dark:text-church-navy-950 py-3 text-sm font-bold"
            >
              Verify & Check In
            </button>
          </form>

          {/* Scanner response alerts */}
          {scanMessage && (
            <div className={`mt-5 flex items-start gap-2.5 rounded-xl p-4 text-xs font-semibold border ${scanMessage.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400' : 'bg-red-500/10 border-red-500/20 text-red-600 dark:text-red-400'}`}>
              <CheckSquare className="h-4.5 w-4.5 shrink-0" />
              <p className="text-left">{scanMessage.text}</p>
            </div>
          )}
        </div>
      )}

      {/* HISTORY LOGS TAB */}
      {activeTab === 'history' && (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-2 text-slate-850 dark:text-white">
              <Activity className="h-5 w-5 text-church-gold-500" />
              <h4 className="text-sm font-bold uppercase tracking-wider">Attendance Log History</h4>
            </div>

            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input 
                type="text" 
                placeholder="Search history logs..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="rounded-xl border border-slate-200 bg-slate-50 dark:border-slate-850 dark:bg-slate-950 py-2 pl-9 pr-4 text-xs outline-none focus:border-church-gold-500 w-52"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 text-xs font-semibold uppercase tracking-wider">
                  <th className="pb-3">Date</th>
                  <th className="pb-3">Program Event</th>
                  <th className="pb-3">Member Name</th>
                  <th className="pb-3">Status</th>
                  <th className="pb-3">Remarks</th>
                  <th className="pb-3 text-right">Recorded By</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 dark:divide-slate-800/40">
                {filteredHistory.map((att) => (
                  <tr key={att.attendanceId} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/10">
                    <td className="py-3 text-xs text-slate-500 dark:text-slate-400">{att.date}</td>
                    <td className="py-3 font-semibold text-slate-800 dark:text-slate-200">{att.programTitle}</td>
                    <td className="py-3 font-bold text-slate-900 dark:text-white">{att.memberName}</td>
                    <td className="py-3">
                      <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-bold ${att.status === 'present' ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : att.status === 'absent' ? 'bg-red-500/10 text-red-600 dark:text-red-400' : 'bg-amber-500/10 text-amber-600 dark:text-amber-400'}`}>
                        {att.status}
                      </span>
                    </td>
                    <td className="py-3 text-xs text-slate-400 italic truncate max-w-xs">{att.remarks || 'None'}</td>
                    <td className="py-3 text-right text-xs text-slate-400 font-semibold">{att.recordedByName}</td>
                  </tr>
                ))}
                {filteredHistory.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-500 dark:text-slate-400 text-sm">
                      No attendance log records found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

    </div>
  );
};

export default Attendance;
