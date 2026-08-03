import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getAllAnnouncements, createAnnouncement, likeAnnouncement, deleteAnnouncement } from '../firebase/dbService';
import { Announcement } from '../types';
import { 
  Megaphone, 
  Heart, 
  Trash2, 
  Plus, 
  Calendar, 
  User, 
  Share2, 
  CheckCircle,
  HelpCircle,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const Announcements: React.FC = () => {
  const { currentUser } = useAuth();
  const { setPageTitle } = useOutletContext<{ setPageTitle: (t: string) => void }>();

  // Data States
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);

  // Modals/Forms
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [newType, setNewType] = useState<'announcement' | 'birthday' | 'prayer-request' | 'reminder'>('announcement');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    setPageTitle('Announcements');
    loadAnnouncements();
  }, [setPageTitle]);

  const loadAnnouncements = async () => {
    try {
      const data = await getAllAnnouncements();
      setAnnouncements(data);
    } catch (err) {
      console.error('Error loading announcements:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !newTitle.trim() || !newContent.trim()) return;
    try {
      const newAnn = await createAnnouncement({
        title: newTitle.trim(),
        content: newContent.trim(),
        type: newType,
        authorId: currentUser.uid,
        authorName: `${currentUser.firstName} ${currentUser.lastName}`,
        authorRole: currentUser.role
      });
      setAnnouncements([newAnn, ...announcements]);
      setShowCreateModal(false);
      // Reset Form
      setNewTitle('');
      setNewContent('');
      setNewType('announcement');
    } catch (err) {
      console.error('Error creating announcement:', err);
    }
  };

  const handleLikeAnnouncement = async (annId: string) => {
    if (!currentUser) return;
    try {
      await likeAnnouncement(annId, currentUser.uid);
      setAnnouncements(announcements.map(ann => {
        if (ann.announcementId === annId) {
          const hasLiked = ann.likes.includes(currentUser.uid);
          return {
            ...ann,
            likes: hasLiked
              ? ann.likes.filter(id => id !== currentUser.uid)
              : [...ann.likes, currentUser.uid]
          };
        }
        return ann;
      }));
    } catch (err) {
      console.error('Error liking announcement:', err);
    }
  };

  const handleDeleteAnnouncement = async (annId: string) => {
    if (!window.confirm('Are you sure you want to delete this announcement?')) return;
    try {
      await deleteAnnouncement(annId);
      setAnnouncements(announcements.filter(ann => ann.announcementId !== annId));
    } catch (err) {
      console.error('Error deleting announcement:', err);
    }
  };

  const handleShareAnnouncement = (ann: Announcement) => {
    const shareText = `*${ann.title}* - TRUE ANOINTING VICTORY YOUTH\n\n${ann.content}\n\nPosted by ${ann.authorName}`;
    navigator.clipboard.writeText(shareText);
    setCopiedId(ann.announcementId);
    setTimeout(() => setCopiedId(null), 2000);
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-church-navy-500 border-t-church-gold-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      
      {/* Create Button Banner (Leaders / Admins) */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Megaphone className="h-5.5 w-5.5 text-church-gold-500" />
          <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">
            Stay up to date with the latest news, birthdays, and prayer requests.
          </p>
        </div>

        {currentUser && currentUser.role !== 'member' && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 rounded-xl bg-church-navy-950 hover:bg-church-navy-900 text-white dark:bg-church-gold-500 dark:text-church-navy-950 px-5 py-3 text-sm font-bold shadow-md transition-colors shrink-0"
          >
            <Plus className="h-4.5 w-4.5" />
            Post Notice
          </button>
        )}
      </div>

      {/* Announcements Wall (List) */}
      <div className="space-y-6">
        {announcements.map((ann) => {
          const hasLiked = currentUser ? ann.likes.includes(currentUser.uid) : false;
          
          let cardBorder = 'border-slate-200 dark:border-slate-800';
          let badgeColor = 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400';
          
          if (ann.type === 'birthday') {
            cardBorder = 'border-pink-200 dark:border-pink-900/20';
            badgeColor = 'bg-pink-100 text-pink-600 dark:bg-pink-950/40 dark:text-pink-400';
          } else if (ann.type === 'prayer-request') {
            cardBorder = 'border-purple-200 dark:border-purple-900/20';
            badgeColor = 'bg-purple-100 text-purple-600 dark:bg-purple-950/40 dark:text-purple-400';
          } else if (ann.type === 'reminder') {
            cardBorder = 'border-amber-200 dark:border-amber-900/20';
            badgeColor = 'bg-amber-100 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400';
          }

          return (
            <div 
              key={ann.announcementId}
              className={`rounded-2xl border bg-white p-6 shadow-sm dark:bg-slate-900 flex flex-col justify-between ${cardBorder}`}
            >
              <div>
                {/* Author Info header */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-full bg-church-navy-700 text-white flex items-center justify-center font-bold text-xs">
                      {ann.authorName.charAt(0)}
                    </div>
                    <div>
                      <h5 className="text-xs font-bold text-slate-905 dark:text-white leading-none">{ann.authorName}</h5>
                      <span className="text-[10px] text-slate-400 mt-1 block capitalize">{ann.authorRole.replace('-', ' ')}</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <span className={`rounded-full px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-wider ${badgeColor}`}>
                      {ann.type}
                    </span>
                    {currentUser && currentUser.role !== 'member' && (
                      <button
                        onClick={() => handleDeleteAnnouncement(ann.announcementId)}
                        className="rounded-lg p-1 text-slate-400 hover:text-red-500 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Announcement Content */}
                <h4 className="text-base font-extrabold text-slate-900 dark:text-white leading-snug">
                  {ann.title}
                </h4>
                <p className="text-sm text-slate-600 dark:text-slate-350 mt-2 leading-relaxed whitespace-pre-line">
                  {ann.content}
                </p>
              </div>

              {/* Action Bar */}
              <div className="border-t border-slate-100 dark:border-slate-800/80 pt-4 mt-6 flex items-center justify-between text-xs font-bold text-slate-400">
                <div className="flex items-center gap-4">
                  <button 
                    onClick={() => handleLikeAnnouncement(ann.announcementId)}
                    className={`flex items-center gap-1.5 hover:text-red-500 transition-colors ${hasLiked ? 'text-red-500' : ''}`}
                  >
                    <Heart className={`h-4.5 w-4.5 ${hasLiked ? 'fill-current' : ''}`} />
                    {ann.likes.length} Likes
                  </button>
                  <button 
                    onClick={() => handleShareAnnouncement(ann)}
                    className="flex items-center gap-1.5 hover:text-church-navy-500 dark:hover:text-church-gold-400 transition-colors"
                  >
                    {copiedId === ann.announcementId ? <CheckCircle className="h-4.5 w-4.5 text-emerald-500" /> : <Share2 className="h-4.5 w-4.5" />}
                    {copiedId === ann.announcementId ? 'Copied!' : 'Share'}
                  </button>
                </div>
                <div className="flex items-center gap-1 text-[10px] text-slate-400 font-medium">
                  <Calendar className="h-3.5 w-3.5" />
                  <span>{new Date(ann.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
            </div>
          );
        })}
        {announcements.length === 0 && (
          <p className="text-sm text-slate-500 dark:text-slate-400 text-center py-12">No announcements posted on the wall.</p>
        )}
      </div>

      {/* CREATE MODAL (Leaders / Admins) */}
      <AnimatePresence>
        {showCreateModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="max-w-md w-full bg-white dark:bg-slate-900 rounded-3xl overflow-hidden shadow-2xl border border-slate-200 dark:border-slate-800"
            >
              <div className="border-b border-slate-100 dark:border-slate-850 p-5 flex items-center justify-between">
                <h4 className="text-base font-bold text-slate-900 dark:text-white uppercase tracking-wider">Post New Notice</h4>
                <button onClick={() => setShowCreateModal(false)} className="rounded-xl p-1 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-850">
                  <X className="h-5.5 w-5.5" />
                </button>
              </div>

              <form onSubmit={handleCreateAnnouncement} className="p-6 space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Notice Category *</label>
                  <select
                    value={newType}
                    onChange={(e: any) => setNewType(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 py-2.5 px-4 text-sm outline-none focus:border-church-gold-500"
                  >
                    <option value="announcement">General Announcement</option>
                    <option value="birthday">Birthday Celebration</option>
                    <option value="prayer-request">Prayer Request</option>
                    <option value="reminder">Due / Event Reminder</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Title *</label>
                  <input 
                    type="text" 
                    required
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 py-2.5 px-4 text-sm outline-none focus:border-church-gold-500"
                    placeholder="e.g. Choir Rehearsal Postponed"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Content Details *</label>
                  <textarea 
                    required
                    value={newContent}
                    onChange={(e) => setNewContent(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 py-2.5 px-4 text-sm outline-none focus:border-church-gold-500 h-28"
                    placeholder="Provide full details of the notice here..."
                  />
                </div>

                <button 
                  type="submit"
                  className="w-full rounded-xl bg-church-navy-950 text-white dark:bg-church-gold-500 dark:text-church-navy-950 py-3.5 text-sm font-bold hover:opacity-90 mt-4"
                >
                  Publish Notice
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
};

export default Announcements;
