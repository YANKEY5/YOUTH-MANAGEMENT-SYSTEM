import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  getAllPrograms, 
  createProgram, 
  deleteProgram, 
  getComments, 
  addComment, 
  likeComment, 
  deleteComment, 
  updateComment,
  registerForEvent,
  getRegistrationsByMember,
  cancelRegistration
} from '../firebase/dbService';
import { Program, ProgramComment, EventRegistration } from '../types';
import { 
  Calendar, 
  MapPin, 
  User, 
  Plus, 
  PlusCircle,
  MessageSquare, 
  Heart, 
  Trash2, 
  Pin, 
  EyeOff, 
  Ticket, 
  X, 
  Check, 
  Search,
  SlidersHorizontal,
  Download,
  AlertCircle
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { motion, AnimatePresence } from 'framer-motion';

export const Programs: React.FC = () => {
  const { currentUser } = useAuth();
  const { setPageTitle } = useOutletContext<{ setPageTitle: (t: string) => void }>();

  // Data States
  const [programs, setPrograms] = useState<Program[]>([]);
  const [registrations, setRegistrations] = useState<EventRegistration[]>([]);
  const [activeComments, setActiveComments] = useState<ProgramComment[]>([]);
  const [loading, setLoading] = useState(true);

  // Filter/Search States
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState('all');

  // Modals/Panels
  const [selectedProgram, setSelectedProgram] = useState<Program | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [registeredTicket, setRegisteredTicket] = useState<EventRegistration | null>(null);

  // Form States (New Program)
  const [newProgTitle, setNewProgTitle] = useState('');
  const [newProgDesc, setNewProgDesc] = useState('');
  const [newProgVenue, setNewProgVenue] = useState('');
  const [newProgDate, setNewProgDate] = useState('');
  const [newProgTime, setNewProgTime] = useState('');
  const [newProgSpeaker, setNewProgSpeaker] = useState('');
  const [newProgFlyer, setNewProgFlyer] = useState('');
  const [newProgType, setNewProgType] = useState<any>('youth-service');

  // Comment Form States
  const [commentText, setCommentText] = useState('');
  const [replyToId, setReplyToId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState('');

  useEffect(() => {
    setPageTitle('Programs & Events');
    loadProgramsAndRegistrations();
  }, [setPageTitle, currentUser]);

  const loadProgramsAndRegistrations = async () => {
    try {
      const progs = await getAllPrograms();
      setPrograms(progs);
      
      if (currentUser) {
        const regs = await getRegistrationsByMember(currentUser.memberId);
        setRegistrations(regs);
      }
    } catch (err) {
      console.error('Failed to load programs/registrations:', err);
    } finally {
      setLoading(false);
    }
  };

  // Comments fetcher when program is selected
  useEffect(() => {
    if (selectedProgram) {
      const fetchComments = async () => {
        const comms = await getComments(selectedProgram.programId);
        setActiveComments(comms);
      };
      fetchComments();
    } else {
      setActiveComments([]);
    }
  }, [selectedProgram]);

  const handleCreateProgram = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    try {
      const newProg = await createProgram({
        title: newProgTitle,
        description: newProgDesc,
        venue: newProgVenue,
        date: newProgDate,
        time: newProgTime,
        speaker: newProgSpeaker,
        flyerURL: newProgFlyer || 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?w=800',
        type: newProgType,
        createdBy: currentUser.uid
      });
      setPrograms([newProg, ...programs]);
      setShowCreateModal(false);
      // Reset form
      setNewProgTitle('');
      setNewProgDesc('');
      setNewProgVenue('');
      setNewProgDate('');
      setNewProgTime('');
      setNewProgSpeaker('');
      setNewProgFlyer('');
    } catch (err) {
      console.error('Failed to create program:', err);
    }
  };

  const handleFlyerFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setNewProgFlyer(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDeleteProgram = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm('Are you sure you want to delete this program? All comments and registrations will be deleted.')) return;
    try {
      await deleteProgram(id);
      setPrograms(programs.filter(p => p.programId !== id));
      if (selectedProgram?.programId === id) setSelectedProgram(null);
    } catch (err) {
      console.error('Failed to delete program:', err);
    }
  };

  // Event Registration Handlers
  const handleRegisterEvent = async (program: Program) => {
    if (!currentUser) return;
    try {
      const reg = await registerForEvent({
        programId: program.programId,
        programTitle: program.title,
        programDate: program.date,
        programTime: program.time,
        memberId: currentUser.memberId,
        memberName: `${currentUser.firstName} ${currentUser.lastName}`,
        email: currentUser.email
      });
      setRegistrations([...registrations, reg]);
      setRegisteredTicket(reg);
    } catch (err) {
      console.error('Registration failed:', err);
    }
  };

  const handleCancelRegistration = async (programId: string) => {
    if (!window.confirm('Are you sure you want to cancel your registration?')) return;
    const reg = registrations.find(r => r.programId === programId);
    if (!reg) return;
    try {
      await cancelRegistration(reg.registrationId);
      setRegistrations(registrations.filter(r => r.registrationId !== reg.registrationId));
      setRegisteredTicket(null);
    } catch (err) {
      console.error('Cancel registration failed:', err);
    }
  };

  // Comments Handlers
  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !selectedProgram || !commentText.trim()) return;
    try {
      const comm = await addComment({
        programId: selectedProgram.programId,
        userId: currentUser.uid,
        userName: `${currentUser.firstName} ${currentUser.lastName}`,
        userPhotoURL: currentUser.photoURL,
        message: commentText.trim()
      });
      setActiveComments([...activeComments, comm]);
      setCommentText('');
    } catch (err) {
      console.error('Comment failed:', err);
    }
  };

  const handleAddReply = async (e: React.FormEvent, parentId: string) => {
    e.preventDefault();
    if (!currentUser || !selectedProgram || !replyText.trim()) return;
    try {
      const comm = await addComment({
        programId: selectedProgram.programId,
        userId: currentUser.uid,
        userName: `${currentUser.firstName} ${currentUser.lastName}`,
        userPhotoURL: currentUser.photoURL,
        message: replyText.trim(),
        parentId
      });
      setActiveComments([...activeComments, comm]);
      setReplyText('');
      setReplyToId(null);
    } catch (err) {
      console.error('Reply failed:', err);
    }
  };

  const handleLikeComment = async (commentId: string) => {
    if (!currentUser) return;
    try {
      await likeComment(commentId, currentUser.uid);
      setActiveComments(activeComments.map(c => {
        if (c.commentId === commentId) {
          const liked = c.likes.includes(currentUser.uid);
          return {
            ...c,
            likes: liked 
              ? c.likes.filter(id => id !== currentUser.uid)
              : [...c.likes, currentUser.uid]
          };
        }
        return c;
      }));
    } catch (err) {
      console.error('Like failed:', err);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!window.confirm('Delete this comment?')) return;
    try {
      await deleteComment(commentId);
      setActiveComments(activeComments.filter(c => c.commentId !== commentId && c.parentId !== commentId));
    } catch (err) {
      console.error('Delete failed:', err);
    }
  };

  const handleUpdateComment = async (commentId: string) => {
    if (!editingText.trim()) return;
    try {
      await updateComment(commentId, { message: editingText.trim() });
      setActiveComments(activeComments.map(c => 
        c.commentId === commentId ? { ...c, message: editingText.trim() } : c
      ));
      setEditingCommentId(null);
    } catch (err) {
      console.error('Edit comment failed:', err);
    }
  };

  const handlePinComment = async (commentId: string, currentPinned: boolean) => {
    try {
      await updateComment(commentId, { pinned: !currentPinned });
      setActiveComments(activeComments.map(c => 
        c.commentId === commentId ? { ...c, pinned: !currentPinned } : c
      ));
    } catch (err) {
      console.error('Pin failed:', err);
    }
  };

  const handleHideComment = async (commentId: string, currentHidden: boolean) => {
    try {
      await updateComment(commentId, { hidden: !currentHidden });
      setActiveComments(activeComments.map(c => 
        c.commentId === commentId ? { ...c, hidden: !currentHidden } : c
      ));
    } catch (err) {
      console.error('Hide failed:', err);
    }
  };

  const saveToCalendar = (program: Program) => {
    // Generate simulated calendar invite
    const title = encodeURIComponent(program.title);
    const details = encodeURIComponent(program.description);
    const location = encodeURIComponent(program.venue);
    const dateStr = program.date.replace(/-/g, '');
    const googleUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${dateStr}T090000Z/${dateStr}T110000Z&details=${details}&location=${location}`;
    window.open(googleUrl, '_blank');
  };

  // Filter programs
  const filteredPrograms = programs.filter(p => {
    const matchesSearch = p.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          p.speaker.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = selectedType === 'all' || p.type === selectedType;
    return matchesSearch && matchesType;
  });

  return (
    <div className="space-y-6">
      
      {/* Search & Actions Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        {/* Filters */}
        <div className="flex flex-1 flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3.5 h-4 w-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search programs by title or speaker..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-10 pr-4 text-sm focus:border-church-navy-500 focus:ring-1 focus:ring-church-navy-500 outline-none dark:border-slate-800 dark:bg-slate-900"
            />
          </div>
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm focus:border-church-navy-500 outline-none dark:border-slate-800 dark:bg-slate-900"
          >
            <option value="all">All Event Types</option>
            <option value="retreat">Retreats</option>
            <option value="prayer-meeting">Prayer Meetings</option>
            <option value="conference">Conferences</option>
            <option value="youth-service">Youth Services</option>
            <option value="evangelism">Evangelism</option>
          </select>
        </div>

        {/* Create program button (Leaders / Admins) */}
        {currentUser && currentUser.role !== 'member' && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 rounded-xl bg-church-navy-950 hover:bg-church-navy-900 text-white dark:bg-church-gold-500 dark:text-church-navy-950 px-5 py-3 text-sm font-bold shadow-md transition-colors shrink-0"
          >
            <Plus className="h-5 w-5" />
            New Program
          </button>
        )}
      </div>

      {/* Programs List Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredPrograms.map((prog) => {
          const isRegistered = registrations.some(r => r.programId === prog.programId);
          return (
            <div 
              key={prog.programId}
              onClick={() => setSelectedProgram(prog)}
              className="group cursor-pointer rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 dark:border-slate-800 dark:bg-slate-900 flex flex-col h-full"
            >
              {/* Event Image */}
              <div className="relative h-48 w-full bg-slate-100 overflow-hidden">
                <img 
                  src={prog.flyerURL || 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?w=800'} 
                  alt="Flyer" 
                  className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <span className="absolute top-4 left-4 rounded-full bg-slate-900/80 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-church-gold-400 backdrop-blur-sm">
                  {prog.type.replace('-', ' ')}
                </span>
                
                {currentUser && currentUser.role !== 'member' && (
                  <button
                    onClick={(e) => handleDeleteProgram(prog.programId, e)}
                    className="absolute top-4 right-4 rounded-xl bg-red-500/80 hover:bg-red-600 p-2 text-white transition-colors"
                  >
                    <Trash2 className="h-4.5 w-4.5" />
                  </button>
                )}
              </div>

              {/* Event Content */}
              <div className="p-5 flex-1 flex flex-col">
                <h4 className="text-base font-bold text-slate-800 dark:text-white line-clamp-1 leading-snug">
                  {prog.title}
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 line-clamp-2 leading-relaxed flex-1">
                  {prog.description}
                </p>

                <div className="border-t border-slate-100 dark:border-slate-800/60 pt-4 mt-5 space-y-2">
                  <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                    <Calendar className="h-4 w-4 text-church-gold-500" />
                    <span>{new Date(prog.date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })} at {prog.time}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                    <MapPin className="h-4 w-4 text-church-gold-500" />
                    <span className="truncate">{prog.venue}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                    <User className="h-4 w-4 text-church-gold-500" />
                    <span>Speaker: {prog.speaker}</span>
                  </div>
                </div>

                {isRegistered && (
                  <div className="mt-4 flex items-center justify-center gap-1.5 rounded-xl bg-emerald-500/10 py-2.5 text-xs font-bold text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                    <Check className="h-4 w-4" />
                    Registered
                  </div>
                )}
              </div>
            </div>
          );
        })}
        {filteredPrograms.length === 0 && (
          <div className="col-span-full py-16 text-center">
            <AlertCircle className="h-10 w-10 text-slate-400 mx-auto mb-3" />
            <p className="text-slate-500 dark:text-slate-400 text-sm">No programs matching your search or filters.</p>
          </div>
        )}
      </div>

      {/* TICKET POPUP */}
      <AnimatePresence>
        {registeredTicket && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="max-w-sm w-full bg-white dark:bg-slate-900 rounded-3xl overflow-hidden shadow-2xl border border-slate-200 dark:border-slate-800"
            >
              <div className="bg-gradient-to-br from-church-navy-700 to-church-navy-900 p-5 text-white text-center relative">
                <button 
                  onClick={() => setRegisteredTicket(null)}
                  className="absolute top-4 right-4 text-white/70 hover:text-white"
                >
                  <X className="h-5 w-5" />
                </button>
                <Ticket className="h-8 w-8 text-church-gold-400 mx-auto mb-2" />
                <h4 className="text-lg font-bold">Virtual Admission Ticket</h4>
                <p className="text-[10px] text-slate-300 font-medium uppercase mt-0.5 tracking-wider">TAVY Events check-in</p>
              </div>

              <div className="p-6 flex flex-col items-center">
                <h5 className="text-base font-bold text-slate-850 dark:text-white text-center leading-snug">
                  {registeredTicket.programTitle}
                </h5>
                <p className="text-xs text-slate-500 mt-1">{registeredTicket.programDate} at {registeredTicket.programTime}</p>
                
                <div className="my-6 p-4 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl bg-slate-50 dark:bg-slate-950">
                  <QRCodeSVG value={registeredTicket.ticketCode} size={140} />
                </div>

                <div className="w-full text-center border-t border-slate-100 dark:border-slate-800/80 pt-4">
                  <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">Ticket Code</p>
                  <p className="text-sm font-bold text-church-gold-600 dark:text-church-gold-400 mt-0.5">{registeredTicket.ticketCode}</p>
                  <p className="text-xs text-slate-500 mt-2 font-medium">Present this QR code to leaders at the event venue check-in.</p>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* DETAIL MODAL PANEL (SLIDEOUT PANEL/MODAL) */}
      <AnimatePresence>
        {selectedProgram && (
          <div className="fixed inset-0 z-40 flex justify-end bg-slate-950/60 backdrop-blur-sm">
            <div className="fixed inset-0 cursor-pointer" onClick={() => setSelectedProgram(null)} />
            <motion.div 
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'tween', duration: 0.35 }}
              className="relative z-50 flex h-full w-full max-w-2xl flex-col bg-white shadow-2xl dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800"
            >
              {/* Header */}
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 p-5">
                <div className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-church-gold-500" />
                  <span className="text-sm font-bold uppercase tracking-wider text-church-gold-600 dark:text-church-gold-400">
                    Program Details
                  </span>
                </div>
                <button 
                  onClick={() => setSelectedProgram(null)}
                  className="rounded-xl p-1.5 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              {/* Scrollable details */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                
                {/* Event Cover Flyer */}
                <div className="h-60 w-full overflow-hidden rounded-2xl bg-slate-100">
                  <img 
                    src={selectedProgram.flyerURL || 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?w=800'} 
                    alt="Flyer" 
                    className="h-full w-full object-cover"
                  />
                </div>

                {/* Title & Info */}
                <div>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white leading-tight">{selectedProgram.title}</h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mt-2 leading-relaxed">{selectedProgram.description}</p>
                </div>

                <div className="grid grid-cols-2 gap-4 rounded-2xl bg-slate-50 dark:bg-slate-950 p-4 border border-slate-100 dark:border-slate-800/40">
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Date & Time</span>
                    <p className="text-sm font-semibold mt-0.5">{selectedProgram.date} at {selectedProgram.time}</p>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Venue</span>
                    <p className="text-sm font-semibold mt-0.5">{selectedProgram.venue}</p>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Speaker</span>
                    <p className="text-sm font-semibold mt-0.5">{selectedProgram.speaker}</p>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Status</span>
                    <p className="text-sm font-semibold text-emerald-600 dark:text-emerald-400 mt-0.5">Active / Open</p>
                  </div>
                </div>

                {/* Buttons (Register / Calendar) */}
                {currentUser && (
                  <div className="flex gap-3">
                    {registrations.some(r => r.programId === selectedProgram.programId) ? (
                      <div className="flex-1 flex gap-2">
                        <button
                          onClick={() => {
                            const r = registrations.find(x => x.programId === selectedProgram.programId);
                            if (r) setRegisteredTicket(r);
                          }}
                          className="flex-1 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm py-3.5 flex items-center justify-center gap-2"
                        >
                          <Ticket className="h-4.5 w-4.5" />
                          View Ticket QR
                        </button>
                        <button
                          onClick={() => handleCancelRegistration(selectedProgram.programId)}
                          className="rounded-xl border border-red-200 dark:border-red-900/30 px-4 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 text-xs font-bold"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => handleRegisterEvent(selectedProgram)}
                        className="flex-1 rounded-xl bg-gradient-to-r from-church-gold-500 to-church-gold-600 text-slate-950 font-bold text-sm py-3.5 hover:from-church-gold-400 hover:to-church-gold-500 transition-colors shadow-md shadow-church-gold-500/10"
                      >
                        Register for Event
                      </button>
                    )}
                    <button
                      onClick={() => saveToCalendar(selectedProgram)}
                      className="rounded-xl border border-slate-200 dark:border-slate-800 px-5 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 py-3.5 text-sm font-bold flex items-center gap-1.5"
                    >
                      <Download className="h-4.5 w-4.5" />
                      Calendar
                    </button>
                  </div>
                )}

                {/* Comments Section */}
                <div className="border-t border-slate-100 dark:border-slate-800 pt-6 space-y-4">
                  <h4 className="text-sm font-bold text-slate-850 dark:text-white uppercase tracking-wider flex items-center gap-2">
                    <MessageSquare className="h-4.5 w-4.5 text-church-gold-500" />
                    Discussion Comments ({activeComments.filter(c => !c.hidden).length})
                  </h4>

                  {/* Add comment Form */}
                  <form onSubmit={handleAddComment} className="flex gap-3">
                    <input 
                      type="text" 
                      placeholder="Add an encouraging comment or question..."
                      value={commentText}
                      onChange={(e) => setCommentText(e.target.value)}
                      className="flex-1 rounded-xl border border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-950 py-3 px-4 text-sm outline-none focus:border-church-gold-500"
                    />
                    <button 
                      type="submit" 
                      className="rounded-xl bg-church-navy-950 text-white dark:bg-church-gold-500 dark:text-church-navy-950 px-5 py-3 text-sm font-bold"
                    >
                      Post
                    </button>
                  </form>

                  {/* Comments List */}
                  <div className="space-y-4 pt-2">
                    {/* Render comments that don't have parents (Top level) */}
                    {activeComments.filter(c => !c.parentId).map(comment => {
                      const isOwner = currentUser?.uid === comment.userId;
                      const hasLiked = currentUser ? comment.likes.includes(currentUser.uid) : false;
                      const replies = activeComments.filter(r => r.parentId === comment.commentId);
                      
                      // Skip if hidden unless Leader/Admin
                      if (comment.hidden && currentUser?.role === 'member') return null;

                      return (
                        <div key={comment.commentId} className={`rounded-2xl border p-4 space-y-3 transition-colors ${comment.pinned ? 'border-church-gold-300 bg-church-gold-50/20 dark:border-church-gold-900/20' : 'border-slate-100 dark:border-slate-800/40 bg-slate-50/50 dark:bg-slate-950/20'}`}>
                          
                          {/* Author & Header */}
                          <div className="flex items-start justify-between">
                            <div className="flex items-center gap-2.5">
                              <img 
                                src={comment.userPhotoURL || `https://ui-avatars.com/api/?name=${comment.userName}&background=3c64a3&color=fff`} 
                                alt="Author" 
                                className="h-8 w-8 rounded-full object-cover"
                              />
                              <div>
                                <div className="flex items-center gap-1.5">
                                  <span className="text-xs font-bold text-slate-900 dark:text-white">{comment.userName}</span>
                                  {comment.pinned && (
                                    <span className="inline-flex items-center gap-0.5 rounded-full bg-church-gold-100 dark:bg-church-gold-950/40 px-1.5 py-0.5 text-[9px] font-bold text-church-gold-700 dark:text-church-gold-400 border border-church-gold-200/20">
                                      <Pin className="h-2.5 w-2.5" /> Pinned
                                    </span>
                                  )}
                                  {comment.hidden && (
                                    <span className="inline-flex items-center gap-0.5 rounded-full bg-red-100 px-1.5 py-0.5 text-[9px] font-bold text-red-600">
                                      Hidden
                                    </span>
                                  )}
                                </div>
                                <span className="text-[10px] text-slate-400">{new Date(comment.createdAt).toLocaleDateString()}</span>
                              </div>
                            </div>

                            {/* Moderator / Edit Actions */}
                            <div className="flex items-center gap-1.5">
                              {/* Pin/Hide for Leaders / Admins */}
                              {currentUser && currentUser.role !== 'member' && (
                                <>
                                  <button 
                                    onClick={() => handlePinComment(comment.commentId, comment.pinned || false)}
                                    className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded text-slate-400 hover:text-church-gold-500"
                                  >
                                    <Pin className="h-3.5 w-3.5" />
                                  </button>
                                  <button 
                                    onClick={() => handleHideComment(comment.commentId, comment.hidden || false)}
                                    className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded text-slate-400 hover:text-red-500"
                                  >
                                    <EyeOff className="h-3.5 w-3.5" />
                                  </button>
                                </>
                              )}

                              {/* Owner Delete or Admin Delete */}
                              {(isOwner || (currentUser && currentUser.role === 'super-admin')) && (
                                <button 
                                  onClick={() => handleDeleteComment(comment.commentId)}
                                  className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded text-slate-400 hover:text-red-600"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              )}
                            </div>
                          </div>

                          {/* Message Body */}
                          {editingCommentId === comment.commentId ? (
                            <div className="flex gap-2">
                              <input 
                                type="text"
                                value={editingText}
                                onChange={(e) => setEditingText(e.target.value)}
                                className="flex-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-transparent py-1.5 px-3 text-xs outline-none focus:border-church-gold-500"
                              />
                              <button 
                                onClick={() => handleUpdateComment(comment.commentId)}
                                className="bg-church-navy-950 text-white dark:bg-church-gold-500 dark:text-church-navy-950 px-3 py-1.5 text-[10px] font-bold rounded-lg"
                              >
                                Save
                              </button>
                            </div>
                          ) : (
                            <p className="text-xs text-slate-700 dark:text-slate-350">{comment.message}</p>
                          )}

                          {/* Reaction bar */}
                          <div className="flex items-center gap-4 text-[10px] font-bold text-slate-400">
                            <button 
                              onClick={() => handleLikeComment(comment.commentId)}
                              className={`flex items-center gap-1 hover:text-red-500 ${hasLiked ? 'text-red-500' : ''}`}
                            >
                              <Heart className={`h-3.5 w-3.5 ${hasLiked ? 'fill-current' : ''}`} />
                              {comment.likes.length} Likes
                            </button>

                            <button 
                              onClick={() => { setReplyToId(replyToId === comment.commentId ? null : comment.commentId); setReplyText(''); }}
                              className="hover:text-church-navy-500 dark:hover:text-church-gold-400"
                            >
                              Reply
                            </button>

                            {isOwner && !editingCommentId && (
                              <button 
                                onClick={() => { setEditingCommentId(comment.commentId); setEditingText(comment.message); }}
                                className="hover:text-slate-600"
                              >
                                Edit
                              </button>
                            )}
                          </div>

                          {/* Reply Box */}
                          {replyToId === comment.commentId && (
                            <form onSubmit={(e) => handleAddReply(e, comment.commentId)} className="flex gap-2 mt-2 pt-2 border-t border-slate-100 dark:border-slate-800/40">
                              <input 
                                type="text"
                                placeholder="Write a reply..."
                                value={replyText}
                                onChange={(e) => setReplyText(e.target.value)}
                                className="flex-1 rounded-lg border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 py-1.5 px-3 text-xs outline-none focus:border-church-gold-500"
                              />
                              <button 
                                type="submit"
                                className="rounded-lg bg-church-navy-950 text-white dark:bg-church-gold-500 dark:text-church-navy-950 px-3 py-1.5 text-xs font-bold"
                              >
                                Reply
                              </button>
                            </form>
                          )}

                          {/* Thread Replies */}
                          {replies.length > 0 && (
                            <div className="space-y-3 border-l-2 border-slate-100 dark:border-slate-800 pl-4 mt-3">
                              {replies.map(reply => {
                                const isReplyOwner = currentUser?.uid === reply.userId;
                                const hasLikedReply = currentUser ? reply.likes.includes(currentUser.uid) : false;

                                if (reply.hidden && currentUser?.role === 'member') return null;

                                return (
                                  <div key={reply.commentId} className="space-y-1.5">
                                    <div className="flex items-center justify-between">
                                      <div className="flex items-center gap-2">
                                        <img 
                                          src={reply.userPhotoURL || `https://ui-avatars.com/api/?name=${reply.userName}&background=3c64a3&color=fff`} 
                                          alt="Reply Author" 
                                          className="h-6 w-6 rounded-full object-cover"
                                        />
                                        <span className="text-[11px] font-bold text-slate-900 dark:text-white">{reply.userName}</span>
                                        {reply.hidden && <span className="text-[8px] bg-red-100 text-red-600 px-1 rounded">Hidden</span>}
                                      </div>

                                      <div className="flex items-center gap-1">
                                        {currentUser && currentUser.role !== 'member' && (
                                          <button 
                                            onClick={() => handleHideComment(reply.commentId, reply.hidden || false)}
                                            className="p-0.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded text-slate-400 hover:text-red-500"
                                          >
                                            <EyeOff className="h-3 w-3" />
                                          </button>
                                        )}
                                        {(isReplyOwner || (currentUser && currentUser.role === 'super-admin')) && (
                                          <button 
                                            onClick={() => handleDeleteComment(reply.commentId)}
                                            className="p-0.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded text-slate-400 hover:text-red-600"
                                          >
                                            <Trash2 className="h-3 w-3" />
                                          </button>
                                        )}
                                      </div>
                                    </div>

                                    {editingCommentId === reply.commentId ? (
                                      <div className="flex gap-2">
                                        <input 
                                          type="text"
                                          value={editingText}
                                          onChange={(e) => setEditingText(e.target.value)}
                                          className="flex-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-transparent py-1 px-2.5 text-[11px] outline-none"
                                        />
                                        <button 
                                          onClick={() => handleUpdateComment(reply.commentId)}
                                          className="bg-church-navy-950 text-white dark:bg-church-gold-500 dark:text-church-navy-950 px-2 py-1 text-[9px] font-bold rounded"
                                        >
                                          Save
                                        </button>
                                      </div>
                                    ) : (
                                      <p className="text-xs text-slate-600 dark:text-slate-400 pl-8">{reply.message}</p>
                                    )}

                                    <div className="flex items-center gap-3 pl-8 text-[9px] font-bold text-slate-400">
                                      <button 
                                        onClick={() => handleLikeComment(reply.commentId)}
                                        className={`flex items-center gap-0.5 hover:text-red-500 ${hasLikedReply ? 'text-red-500' : ''}`}
                                      >
                                        <Heart className={`h-3 w-3 ${hasLikedReply ? 'fill-current' : ''}`} />
                                        {reply.likes.length} Likes
                                      </button>
                                      
                                      {isReplyOwner && !editingCommentId && (
                                        <button 
                                          onClick={() => { setEditingCommentId(reply.commentId); setEditingText(reply.message); }}
                                          className="hover:text-slate-600"
                                        >
                                          Edit
                                        </button>
                                      )}
                                      <span className="text-[9px] text-slate-400">{new Date(reply.createdAt).toLocaleDateString()}</span>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          )}

                        </div>
                      );
                    })}
                    {activeComments.length === 0 && (
                      <p className="text-xs text-slate-500 text-center py-4">No comments posted yet. Be the first to encourage the ministry!</p>
                    )}
                  </div>
                </div>

              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* CREATE MODAL (Leaders / Admins) */}
      <AnimatePresence>
        {showCreateModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="max-w-lg w-full bg-white dark:bg-slate-900 rounded-3xl overflow-hidden shadow-2xl border border-slate-200 dark:border-slate-800"
            >
              <div className="border-b border-slate-100 dark:border-slate-850 p-5 flex items-center justify-between">
                <h4 className="text-base font-bold text-slate-900 dark:text-white uppercase tracking-wider">Schedule New Program</h4>
                <button onClick={() => setShowCreateModal(false)} className="rounded-xl p-1 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-850">
                  <X className="h-5.5 w-5.5" />
                </button>
              </div>

              <form onSubmit={handleCreateProgram} className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <label className="block text-xs font-semibold text-slate-500 mb-1">Title *</label>
                    <input 
                      type="text" 
                      required
                      value={newProgTitle}
                      onChange={(e) => setNewProgTitle(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 py-2.5 px-4 text-sm outline-none focus:border-church-gold-500"
                      placeholder="Youth Fire Conference 2026"
                    />
                  </div>

                  <div className="col-span-2">
                    <label className="block text-xs font-semibold text-slate-500 mb-1">Description *</label>
                    <textarea 
                      required
                      value={newProgDesc}
                      onChange={(e) => setNewProgDesc(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 py-2.5 px-4 text-sm outline-none focus:border-church-gold-500 h-20"
                      placeholder="Give a summary of the program goals and expectations..."
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1">Date *</label>
                    <input 
                      type="date" 
                      required
                      value={newProgDate}
                      onChange={(e) => setNewProgDate(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 py-2.5 px-4 text-sm outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1">Time *</label>
                    <input 
                      type="time" 
                      required
                      value={newProgTime}
                      onChange={(e) => setNewProgTime(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 py-2.5 px-4 text-sm outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1">Venue *</label>
                    <input 
                      type="text" 
                      required
                      value={newProgVenue}
                      onChange={(e) => setNewProgVenue(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 py-2.5 px-4 text-sm outline-none"
                      placeholder="Main Chapel Auditorium"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1">Speaker *</label>
                    <input 
                      type="text" 
                      required
                      value={newProgSpeaker}
                      onChange={(e) => setNewProgSpeaker(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 py-2.5 px-4 text-sm outline-none"
                      placeholder="Pastor John Doe"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider">Program Flyer / Image</label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* Left: File Picker / Preview */}
                      <div className="relative flex flex-col items-center justify-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl p-4 bg-slate-50/50 dark:bg-slate-950/20 hover:bg-slate-50 dark:hover:bg-slate-950/50 transition-colors group min-h-[120px]">
                        {newProgFlyer ? (
                          <div className="relative w-full h-full min-h-[100px] flex flex-col items-center justify-center">
                            <img 
                              src={newProgFlyer} 
                              alt="Flyer Preview" 
                              className="h-20 w-auto rounded-lg object-contain shadow-md mb-2" 
                            />
                            <button
                              type="button"
                              onClick={() => setNewProgFlyer('')}
                              className="text-[10px] font-bold text-red-500 hover:text-red-600 transition-colors uppercase tracking-wider"
                            >
                              Remove Image
                            </button>
                          </div>
                        ) : (
                          <label className="cursor-pointer flex flex-col items-center justify-center w-full h-full text-center py-2">
                            <div className="h-9 w-9 rounded-xl bg-church-gold-500/10 text-church-gold-600 flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
                              <PlusCircle className="h-5 w-5" />
                            </div>
                            <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300">Upload Image File</span>
                            <span className="text-[9px] text-slate-400 mt-0.5">Drag & drop or browse</span>
                            <input 
                              type="file" 
                              accept="image/*" 
                              onChange={handleFlyerFileChange}
                              className="hidden" 
                            />
                          </label>
                        )}
                      </div>
                      
                      {/* Right: URL Input alternative */}
                      <div className="flex flex-col justify-center space-y-2">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center sm:text-left">— OR —</span>
                        <div>
                          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Paste Image URL</label>
                          <input 
                            type="url" 
                            value={newProgFlyer.startsWith('data:') ? '' : newProgFlyer}
                            onChange={(e) => setNewProgFlyer(e.target.value)}
                            className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 py-2.5 px-4 text-xs outline-none"
                            placeholder="https://example.com/flyer.jpg"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1">Program Type *</label>
                    <select
                      value={newProgType}
                      onChange={(e) => setNewProgType(e.target.value as any)}
                      className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-900 py-2.5 px-4 text-sm text-white outline-none"
                    >
                      <option value="retreat">Retreat</option>
                      <option value="prayer-meeting">Prayer Meeting</option>
                      <option value="conference">Conference</option>
                      <option value="youth-service">Youth Service</option>
                      <option value="evangelism">Evangelism</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                </div>

                <button 
                  type="submit"
                  className="w-full rounded-xl bg-church-navy-950 text-white dark:bg-church-gold-500 dark:text-church-navy-950 py-3.5 text-sm font-bold hover:opacity-90 mt-4"
                >
                  Schedule Event
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
};

export default Programs;
