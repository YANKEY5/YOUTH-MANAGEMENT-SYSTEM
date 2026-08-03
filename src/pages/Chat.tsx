import React, { useState, useEffect, useRef } from 'react';
import { useOutletContext } from 'react-router-dom';
import { 
  Phone, 
  Video, 
  Mic, 
  MicOff, 
  VideoOff, 
  Send, 
  Image as ImageIcon, 
  X, 
  User, 
  PhoneOff, 
  Play, 
  Pause, 
  Volume2, 
  Camera, 
  Sparkles, 
  MessageSquare,
  Smile,
  ShieldAlert,
  Loader2,
  ArrowLeft
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { getChatMessages, sendChatMessage, getAllUsers } from '../firebase/dbService';
import { ChatMessage, UserProfile } from '../types';

export const Chat: React.FC = () => {
  const { setPageTitle } = useOutletContext<{ setPageTitle: (title: string) => void }>();
  const { currentUser } = useAuth();
  
  // State variables
  const [activeTab, setActiveTab] = useState<'channels' | 'dms'>('channels');
  const [activeTarget, setActiveTarget] = useState<string>('general-youth'); // channel ID or user UID
  const [targetName, setTargetName] = useState<string>('#general-youth');
  const [targetPhoto, setTargetPhoto] = useState<string>('');
  const [showMobileSidebar, setShowMobileSidebar] = useState(true);
  
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [messageText, setMessageText] = useState('');
  const [loading, setLoading] = useState(true);
  
  // Media Recording states
  const [isRecordingAudio, setIsRecordingAudio] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string>('');
  const [recordingDuration, setRecordingDuration] = useState(0);
  
  const [isRecordingVideo, setIsRecordingVideo] = useState(false);
  const [videoBlob, setVideoBlob] = useState<Blob | null>(null);
  const [videoUrl, setVideoUrl] = useState<string>('');
  
  // Call states
  const [activeCall, setActiveCall] = useState<{
    type: 'voice' | 'video';
    status: 'ringing' | 'connected' | 'ended';
    targetId: string;
    targetName: string;
    targetPhoto?: string;
  } | null>(null);
  
  const [isMuted, setIsMuted] = useState(false);
  const [isCameraOff, setIsCameraOff] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  
  // Refs
  const threadEndRef = useRef<HTMLDivElement>(null);
  const audioRecorderRef = useRef<MediaRecorder | null>(null);
  const videoRecorderRef = useRef<MediaRecorder | null>(null);
  const recordingTimerRef = useRef<NodeJS.Timeout | null>(null);
  const callTimerRef = useRef<NodeJS.Timeout | null>(null);
  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const previewVideoRef = useRef<HTMLVideoElement | null>(null);
  const ringerAudioRef = useRef<HTMLAudioElement | null>(null);

  // Set page title on load
  useEffect(() => {
    setPageTitle('Youth Chat & Calls');
    loadUsers();
  }, []);

  // Fetch messages when active target changes
  useEffect(() => {
    if (!currentUser) return;
    loadMessages();
    
    // Set up polling for messages (since we are on client-side simulation / mock db)
    const interval = setInterval(() => {
      loadMessages(true); // silent load
    }, 3000);
    
    return () => clearInterval(interval);
  }, [activeTarget, currentUser]);

  // Scroll to bottom of message thread
  useEffect(() => {
    threadEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Audio recording timer
  useEffect(() => {
    if (isRecordingAudio) {
      setRecordingDuration(0);
      recordingTimerRef.current = setInterval(() => {
        setRecordingDuration(prev => prev + 1);
      }, 1000);
    } else {
      if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
    }
    return () => {
      if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
    };
  }, [isRecordingAudio]);

  // Call duration timer
  useEffect(() => {
    if (activeCall && activeCall.status === 'connected') {
      setCallDuration(0);
      callTimerRef.current = setInterval(() => {
        setCallDuration(prev => prev + 1);
      }, 1000);
    } else {
      if (callTimerRef.current) clearInterval(callTimerRef.current);
    }
    return () => {
      if (callTimerRef.current) clearInterval(callTimerRef.current);
    };
  }, [activeCall?.status]);

  // Load user directory
  const loadUsers = async () => {
    try {
      const allUsers = await getAllUsers();
      setUsers(allUsers.filter(u => u.uid !== currentUser?.uid));
    } catch (e) {
      console.error(e);
    }
  };

  // Load chat messages
  const loadMessages = async (silent = false) => {
    if (!currentUser) return;
    try {
      if (!silent) setLoading(true);
      const msgs = await getChatMessages(activeTarget, currentUser.uid);
      setMessages(msgs);
    } catch (e) {
      console.error(e);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  // Send textual/file messages
  const handleSendMessage = async (
    type: 'text' | 'image' | 'video' | 'audio' = 'text',
    fileURL?: string,
    textOverride?: string
  ) => {
    if (!currentUser) return;
    const content = textOverride || messageText;
    if (!content.trim() && !fileURL) return;

    try {
      const msgPayload: any = {
        senderId: currentUser.uid,
        senderName: currentUser.displayName || currentUser.name || `${currentUser.firstName} ${currentUser.lastName}`.trim() || 'Anonymous',
        senderPhotoURL: currentUser.photoURL || '',
        content: content,
        type: type,
        fileURL: fileURL || ''
      };

      if (activeTarget.startsWith('general') || activeTarget.includes('-')) {
        msgPayload.channelId = activeTarget;
      } else {
        msgPayload.recipientId = activeTarget;
      }

      await sendChatMessage(msgPayload);
      setMessageText('');
      loadMessages(true);
    } catch (e) {
      console.error("Failed to send message:", e);
    }
  };

  // Start recording audio
  const startAudioRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      audioRecorderRef.current = recorder;
      
      const chunks: Blob[] = [];
      recorder.ondataavailable = (e) => chunks.push(e.data);
      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'audio/webm' });
        setAudioBlob(blob);
        setAudioUrl(URL.createObjectURL(blob));
        // Stop audio tracks
        stream.getTracks().forEach(track => track.stop());
      };
      
      recorder.start();
      setIsRecordingAudio(true);
    } catch (err) {
      alert("Microphone access is required to record voice messages.");
      console.error(err);
    }
  };

  // Stop recording audio
  const stopAudioRecording = () => {
    if (audioRecorderRef.current && isRecordingAudio) {
      audioRecorderRef.current.stop();
      setIsRecordingAudio(false);
    }
  };

  // Send voice note
  const sendVoiceNote = async () => {
    if (audioUrl) {
      // In mock/demo mode, we use the local blob URL.
      // In production, you would upload the blob to Firebase Storage first
      await handleSendMessage('audio', audioUrl, '🎤 Voice Message');
      cancelAudioRecording();
    }
  };

  // Cancel voice note recording
  const cancelAudioRecording = () => {
    setAudioBlob(null);
    setAudioUrl('');
    setIsRecordingAudio(false);
  };

  // Start recording video note
  const startVideoRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      const recorder = new MediaRecorder(stream);
      videoRecorderRef.current = recorder;
      
      if (previewVideoRef.current) {
        previewVideoRef.current.srcObject = stream;
      }

      const chunks: Blob[] = [];
      recorder.ondataavailable = (e) => chunks.push(e.data);
      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'video/webm' });
        setVideoBlob(blob);
        setVideoUrl(URL.createObjectURL(blob));
        // Stop camera tracks
        stream.getTracks().forEach(track => track.stop());
      };
      
      recorder.start();
      setIsRecordingVideo(true);
    } catch (err) {
      alert("Camera and Microphone access are required to record video notes.");
      console.error(err);
    }
  };

  // Stop recording video note
  const stopVideoRecording = () => {
    if (videoRecorderRef.current && isRecordingVideo) {
      videoRecorderRef.current.stop();
      setIsRecordingVideo(false);
    }
  };

  // Send video note
  const sendVideoNote = async () => {
    if (videoUrl) {
      await handleSendMessage('video', videoUrl, '📹 Video Clip Message');
      cancelVideoRecording();
    }
  };

  // Cancel video note recording
  const cancelVideoRecording = () => {
    setVideoBlob(null);
    setVideoUrl('');
    setIsRecordingVideo(false);
  };

  // Handle local image attachment select
  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const fakeUrl = URL.createObjectURL(file);
      // Send image message
      handleSendMessage('image', fakeUrl, '📷 Sent an image');
    }
  };

  // format recording timers
  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60).toString().padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  // Initiate call
  const initiateCall = async (type: 'voice' | 'video') => {
    if (activeTarget.startsWith('general')) return;
    
    // Ringtone simulation
    const ringer = new Audio('https://assets.mixkit.co/active_storage/sfx/1359/1359-84.wav'); 
    ringer.loop = true;
    ringer.volume = 0.5;
    try {
      await ringer.play();
    } catch (e) {
      console.warn("Autoplay audio blocked or invalid url");
    }
    (ringerAudioRef as any).current = ringer;

    setActiveCall({
      type,
      status: 'ringing',
      targetId: activeTarget,
      targetName,
      targetPhoto
    });

    // Request permissions for camera/mic
    try {
      const constraints = {
        audio: true,
        video: type === 'video'
      };
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      setLocalStream(stream);
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }
    } catch (e) {
      console.warn("Failed to get local camera stream:", e);
    }

    // Simulate peer answering after 4 seconds
    setTimeout(() => {
      setActiveCall(prev => {
        if (prev && prev.status === 'ringing') {
          // Stop ringing
          if (ringerAudioRef.current) {
            ringerAudioRef.current.pause();
          }
          return { ...prev, status: 'connected' };
        }
        return prev;
      });
    }, 4000);
  };

  // End Call
  const endCall = () => {
    if (ringerAudioRef.current) {
      ringerAudioRef.current.pause();
    }
    if (localStream) {
      localStream.getTracks().forEach(track => track.stop());
      setLocalStream(null);
    }
    setActiveCall(null);
    setIsMuted(false);
    setIsCameraOff(false);
  };

  // Toggle Mute
  const toggleMute = () => {
    if (localStream) {
      localStream.getAudioTracks().forEach(track => {
        track.enabled = !track.enabled;
      });
      setIsMuted(!isMuted);
    }
  };

  // Toggle Camera
  const toggleCamera = () => {
    if (localStream) {
      localStream.getVideoTracks().forEach(track => {
        track.enabled = !track.enabled;
      });
      setIsCameraOff(!isCameraOff);
    }
  };

  return (
    <div className="flex h-[calc(100vh-10rem)] md:h-[calc(100vh-8rem)] w-full overflow-hidden rounded-2xl bg-white shadow-xl dark:bg-slate-900 border border-slate-100 dark:border-slate-800 animate-fade-in">
      
      {/* Sidebar List */}
      <div className={`w-full md:w-80 border-r border-slate-100 dark:border-slate-800 flex flex-col h-full bg-slate-50/50 dark:bg-slate-900/50 ${showMobileSidebar ? 'flex' : 'hidden md:flex'}`}>
        
        {/* Sidebar Header Tabs */}
        <div className="flex border-b border-slate-100 dark:border-slate-800 p-2 gap-1 bg-white dark:bg-slate-900">
          <button 
            onClick={() => setActiveTab('channels')}
            className={`flex-1 py-2 px-3 text-xs font-semibold rounded-lg transition-all ${
              activeTab === 'channels' 
                ? 'bg-blue-600 text-white shadow-md' 
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            Channels
          </button>
          <button 
            onClick={() => setActiveTab('dms')}
            className={`flex-1 py-2 px-3 text-xs font-semibold rounded-lg transition-all ${
              activeTab === 'dms' 
                ? 'bg-blue-600 text-white shadow-md' 
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            Direct Messages
          </button>
        </div>

        {/* List Content */}
        <div className="flex-1 overflow-y-auto p-3 space-y-1">
          {activeTab === 'channels' ? (
            <>
              {/* Preset Channels */}
              <button 
                onClick={() => {
                  setActiveTarget('general-youth');
                  setTargetName('#general-youth');
                  setTargetPhoto('');
                  setShowMobileSidebar(false);
                }}
                className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all text-left ${
                  activeTarget === 'general-youth'
                    ? 'bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400 font-semibold'
                    : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100/50 dark:hover:bg-slate-800/50'
                }`}
              >
                <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/30 text-blue-600 flex items-center justify-center font-bold">
                  #
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold">general-youth</div>
                  <div className="text-xs text-slate-500 truncate">True Anointing general chat</div>
                </div>
              </button>

              <button 
                onClick={() => {
                  setActiveTarget('media-team');
                  setTargetName('#media-team');
                  setTargetPhoto('');
                  setShowMobileSidebar(false);
                }}
                className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all text-left ${
                  activeTarget === 'media-team'
                    ? 'bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400 font-semibold'
                    : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100/50 dark:hover:bg-slate-800/50'
                }`}
              >
                <div className="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-900/30 text-amber-600 flex items-center justify-center font-bold">
                  #
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold">media-team</div>
                  <div className="text-xs text-slate-500 truncate">Audio/Video and tech crew</div>
                </div>
              </button>
            </>
          ) : (
            users.map(u => (
              <button 
                key={u.uid}
                onClick={() => {
                  setActiveTarget(u.uid);
                  setTargetName(u.displayName || u.name || `${u.firstName} ${u.lastName}`.trim() || 'Anonymous');
                  setTargetPhoto(u.photoURL || '');
                  setShowMobileSidebar(false);
                }}
                className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all text-left ${
                  activeTarget === u.uid
                    ? 'bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400 font-semibold'
                    : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100/50 dark:hover:bg-slate-800/50'
                }`}
              >
                {u.photoURL ? (
                  <img src={u.photoURL} alt={u.firstName} className="w-9 h-9 rounded-full object-cover border border-slate-200 dark:border-slate-700" />
                ) : (
                  <div className="w-9 h-9 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-400">
                    <User className="w-4 h-4" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold truncate">{u.displayName || u.name || `${u.firstName} ${u.lastName}`}</div>
                  <div className="text-xs text-slate-500 capitalize">{u.role}</div>
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Main Chat Thread Area */}
      <div className={`flex-1 flex flex-col h-full bg-slate-50 dark:bg-slate-950/40 ${!showMobileSidebar ? 'flex' : 'hidden md:flex'}`}>
        
        {/* Chat Header */}
        <div className="h-16 border-b border-slate-100 dark:border-slate-800 px-4 md:px-6 flex items-center justify-between bg-white dark:bg-slate-900">
          <div className="flex items-center gap-3">
            {/* Mobile Back Button */}
            <button 
              onClick={() => setShowMobileSidebar(true)}
              className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-300 md:hidden mr-1"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            {targetPhoto ? (
              <img src={targetPhoto} alt={targetName || ''} className="w-10 h-10 rounded-full object-cover" />
            ) : (
              <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 flex items-center justify-center font-bold">
                {targetName && typeof targetName === 'string' && targetName.startsWith('#') ? '#' : ((targetName && typeof targetName === 'string') ? targetName.charAt(0) : '?')}
              </div>
            )}
            <div>
              <div className="font-semibold text-slate-900 dark:text-white">{targetName}</div>
              <div className="text-xs text-green-500 flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-green-500 inline-block animate-pulse"></span>
                Active Now
              </div>
            </div>
          </div>

          {/* Action Buttons for calling (Direct messages only) */}
          {!activeTarget.startsWith('general') && activeTarget !== 'media-team' && (
            <div className="flex items-center gap-2">
              <button 
                onClick={() => initiateCall('voice')}
                className="w-10 h-10 rounded-full flex items-center justify-center bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-300 transition-all"
                title="Voice Call"
              >
                <Phone className="w-4.5 h-4.5" />
              </button>
              <button 
                onClick={() => initiateCall('video')}
                className="w-10 h-10 rounded-full flex items-center justify-center bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-300 transition-all"
                title="Video Call"
              >
                <Video className="w-4.5 h-4.5" />
              </button>
            </div>
          )}
        </div>

        {/* Message Thread */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-full">
              <Loader2 className="w-8 h-8 text-blue-500 animate-spin mb-2" />
              <div className="text-sm text-slate-500">Loading chat thread...</div>
            </div>
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center max-w-sm mx-auto">
              <MessageSquare className="w-12 h-12 text-slate-300 dark:text-slate-700 mb-3" />
              <div className="font-semibold text-slate-700 dark:text-slate-300">No Messages Yet</div>
              <div className="text-xs text-slate-500 mt-1">Start the conversation by sending a text, photo, audio recording, or video message.</div>
            </div>
          ) : (
            messages.map((m) => {
              const isMine = m.senderId === currentUser?.uid;
              return (
                <div key={m.messageId} className={`flex items-start gap-3 ${isMine ? 'flex-row-reverse' : ''}`}>
                  {m.senderPhotoURL ? (
                    <img src={m.senderPhotoURL} alt={m.senderName || ''} className="w-8 h-8 rounded-full object-cover mt-1" />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 flex items-center justify-center text-xs font-semibold mt-1">
                      {m.senderName ? m.senderName.charAt(0) : 'Anonymous'.charAt(0)}
                    </div>
                  )}

                  <div className={`max-w-[70%] ${isMine ? 'items-end' : 'items-start'} flex flex-col`}>
                    <div className="text-[10px] text-slate-500 mb-1 px-1">{m.senderName || 'Anonymous'}</div>
                    
                    <div className={`p-3.5 rounded-2xl ${
                      isMine 
                        ? 'bg-blue-600 text-white rounded-tr-none' 
                        : 'bg-white text-slate-800 dark:bg-slate-900 dark:text-slate-100 rounded-tl-none border border-slate-100 dark:border-slate-800 shadow-sm'
                    }`}>
                      {/* Media Renderers */}
                      {m.type === 'text' && (
                        <p className="text-sm whitespace-pre-wrap leading-relaxed">{m.content}</p>
                      )}
                      
                      {m.type === 'image' && m.fileURL && (
                        <div className="space-y-1">
                          <img src={m.fileURL} alt="Shared Image" className="rounded-lg max-h-64 object-cover w-full cursor-pointer hover:opacity-95 transition-all" />
                          <p className="text-[11px] opacity-80 italic mt-1">{m.content}</p>
                        </div>
                      )}

                      {m.type === 'video' && m.fileURL && (
                        <div className="space-y-1">
                          <video src={m.fileURL} controls className="rounded-lg max-h-64 bg-black w-full" />
                          <p className="text-[11px] opacity-80 italic mt-1">{m.content}</p>
                        </div>
                      )}

                      {m.type === 'audio' && m.fileURL && (
                        <div className="space-y-2">
                          <audio src={m.fileURL} controls className="w-full max-w-[240px]" />
                          <p className="text-[11px] opacity-80 italic mt-1">{m.content}</p>
                        </div>
                      )}
                    </div>

                    <div className="text-[10px] text-slate-400 mt-1 px-1">
                      {new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                </div>
              );
            })
          )}
          <div ref={threadEndRef} />
        </div>

        {/* Audio / Video Message Previews */}
        <AnimatePresence>
          {audioUrl && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 p-4 flex items-center justify-between gap-4"
            >
              <div className="flex items-center gap-3 flex-1">
                <div className="w-10 h-10 bg-red-100 dark:bg-red-950/30 text-red-500 rounded-full flex items-center justify-center">
                  <Mic className="w-5 h-5 animate-pulse" />
                </div>
                <div className="flex-1">
                  <div className="text-sm font-semibold text-slate-800 dark:text-white">Voice Note Clip</div>
                  <audio src={audioUrl} controls className="w-full h-8 mt-1" />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={cancelAudioRecording} className="px-3 py-2 text-sm text-slate-500 hover:text-slate-700">Cancel</button>
                <button onClick={sendVoiceNote} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold">Send Voice Clip</button>
              </div>
            </motion.div>
          )}

          {isRecordingVideo && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-slate-900 p-4 border-t border-slate-800 flex flex-col items-center justify-center gap-4 relative"
            >
              <div className="w-80 h-48 bg-black rounded-lg overflow-hidden relative border border-slate-700">
                <video ref={previewVideoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
                <div className="absolute top-2 right-2 bg-red-600 text-white text-xs px-2 py-0.5 rounded-full flex items-center gap-1 animate-pulse">
                  <span className="w-1.5 h-1.5 rounded-full bg-white inline-block"></span>
                  RECORDING
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={stopVideoRecording} className="px-4 py-2 bg-red-600 text-white hover:bg-red-700 rounded-lg text-sm font-semibold">Stop Recording</button>
              </div>
            </motion.div>
          )}

          {videoUrl && !isRecordingVideo && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 p-4 flex items-center justify-between gap-4"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 dark:bg-blue-950/30 text-blue-500 rounded-full flex items-center justify-center">
                  <Video className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-sm font-semibold text-slate-800 dark:text-white">Video Recording Note</div>
                  <video src={videoUrl} controls className="w-48 h-28 bg-black rounded-lg mt-1" />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={cancelVideoRecording} className="px-3 py-2 text-sm text-slate-500 hover:text-slate-700">Cancel</button>
                <button onClick={sendVideoNote} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold">Send Video Clip</button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Input Bar */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center gap-3">
          
          {/* Action media buttons */}
          <div className="flex items-center gap-1.5">
            <label className="w-10 h-10 rounded-full flex items-center justify-center bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400 cursor-pointer transition-all">
              <ImageIcon className="w-4.5 h-4.5" />
              <input type="file" accept="image/*" className="hidden" onChange={handleImageSelect} />
            </label>

            {/* Voice Clip Trigger */}
            <button 
              onClick={isRecordingAudio ? stopAudioRecording : startAudioRecording}
              className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                isRecordingAudio 
                  ? 'bg-red-500 text-white animate-pulse' 
                  : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400'
              }`}
              title="Record Voice Note"
            >
              <Mic className="w-4.5 h-4.5" />
            </button>

            {/* Video Clip Trigger */}
            <button 
              onClick={startVideoRecording}
              className="w-10 h-10 rounded-full flex items-center justify-center bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400 transition-all"
              title="Record Video Note"
            >
              <Camera className="w-4.5 h-4.5" />
            </button>
          </div>

          {/* Text Input */}
          <div className="flex-1 relative">
            {isRecordingAudio ? (
              <div className="w-full h-10 bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 rounded-xl px-4 flex items-center justify-between text-sm">
                <span className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-500 inline-block animate-ping"></span>
                  Recording Voice clip... ({formatTime(recordingDuration)})
                </span>
                <button onClick={stopAudioRecording} className="font-semibold text-red-600 hover:underline">Stop</button>
              </div>
            ) : (
              <input 
                type="text"
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                placeholder={`Message ${targetName}...`}
                className="w-full bg-slate-100 focus:bg-white text-slate-800 dark:bg-slate-800 dark:text-slate-100 dark:focus:bg-slate-800/80 rounded-xl px-4 py-2.5 text-sm outline-none border border-transparent focus:border-blue-500 transition-all"
              />
            )}
          </div>

          <button 
            onClick={() => handleSendMessage()}
            disabled={!messageText.trim()}
            className="w-10 h-10 rounded-full bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Video & Voice Call Interface Overlay */}
      <AnimatePresence>
        {activeCall && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-slate-950 text-white flex flex-col justify-between p-8"
          >
            {/* Call Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-600/30 flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                  <h4 className="font-bold text-lg">True Anointing Connect</h4>
                  <p className="text-xs text-slate-400">Encrypted call connection</p>
                </div>
              </div>
              <div className="bg-slate-900 border border-slate-800 rounded-lg px-3 py-1 text-xs font-semibold text-blue-400 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-green-500 inline-block animate-pulse"></span>
                {activeCall.status === 'ringing' ? 'Ringing...' : `In Call: ${formatTime(callDuration)}`}
              </div>
            </div>

            {/* Calling Views Center */}
            <div className="flex-1 flex flex-col items-center justify-center my-8 relative max-w-4xl mx-auto w-full">
              {activeCall.type === 'video' ? (
                <div className="w-full h-full max-h-[500px] rounded-3xl bg-slate-900 overflow-hidden relative border border-slate-800 flex items-center justify-center shadow-2xl">
                  {/* Remote Video Stream Frame */}
                  {activeCall.status === 'ringing' ? (
                    <div className="flex flex-col items-center text-center">
                      {activeCall.targetPhoto ? (
                        <img src={activeCall.targetPhoto} alt={activeCall.targetName || ''} className="w-32 h-32 rounded-full object-cover border-4 border-blue-500 animate-pulse" />
                      ) : (
                        <div className="w-32 h-32 rounded-full bg-slate-800 border-4 border-blue-500 flex items-center justify-center text-white text-4xl font-bold animate-pulse">
                          {activeCall.targetName ? activeCall.targetName.charAt(0) : '?'}
                        </div>
                      )}
                      <h2 className="font-bold text-2xl mt-6">{activeCall.targetName || 'Anonymous'}</h2>
                      <p className="text-slate-400 mt-2">Calling...</p>
                    </div>
                  ) : (
                    // Connected remote video (Simulated with a mirrored stream + color overlay)
                    <div className="w-full h-full relative">
                      <video 
                        src="" 
                        autoPlay 
                        muted 
                        className="w-full h-full object-cover opacity-70 filter hue-rotate-15 animate-pulse" 
                        poster="https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=800"
                      />
                      <div className="absolute inset-0 bg-blue-900/10 flex items-center justify-center flex-col text-center p-4">
                        <span className="text-xs uppercase bg-blue-600 text-white px-2.5 py-1 rounded-full mb-3 font-semibold tracking-wider">Live Connection</span>
                        <h3 className="font-bold text-2xl">{activeCall.targetName}</h3>
                        <p className="text-sm text-slate-300 mt-1">Video Stream active</p>
                      </div>
                    </div>
                  )}

                  {/* Local Camera stream picture-in-picture float */}
                  {activeCall.status === 'connected' && !isCameraOff && (
                    <div className="absolute bottom-6 right-6 w-48 h-32 rounded-xl bg-black overflow-hidden border-2 border-white shadow-2xl z-10">
                      <video ref={localVideoRef} autoPlay playsInline muted className="w-full h-full object-cover scale-x-[-1]" />
                    </div>
                  )}
                </div>
              ) : (
                // Audio Call display
                <div className="flex flex-col items-center text-center">
                  <div className="relative">
                    {/* Ringing waves micro-animations */}
                    <div className="absolute inset-0 rounded-full bg-blue-600 opacity-20 scale-150 animate-ping"></div>
                    {activeCall.targetPhoto ? (
                      <img src={activeCall.targetPhoto} alt={activeCall.targetName || ''} className="w-40 h-40 rounded-full object-cover relative z-10 border-4 border-blue-500" />
                    ) : (
                      <div className="w-40 h-40 rounded-full bg-slate-800 border-4 border-blue-500 flex items-center justify-center text-white text-5xl font-bold relative z-10">
                        {activeCall.targetName ? activeCall.targetName.charAt(0) : '?'}
                      </div>
                    )}
                  </div>
                  <h2 className="font-bold text-3xl mt-8">{activeCall.targetName || 'Anonymous'}</h2>
                  <p className="text-blue-400 font-semibold mt-3 text-sm tracking-wider uppercase">
                    {activeCall.status === 'ringing' ? 'Calling via Voice...' : 'Connected'}
                  </p>
                </div>
              )}
            </div>

            {/* Call Control panel */}
            <div className="flex flex-col items-center gap-4">
              <div className="flex items-center gap-4">
                {/* Mute button */}
                <button 
                  onClick={toggleMute}
                  className={`w-14 h-14 rounded-full flex items-center justify-center transition border ${
                    isMuted 
                      ? 'bg-red-600 border-transparent text-white' 
                      : 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800'
                  }`}
                  title={isMuted ? 'Unmute Mic' : 'Mute Mic'}
                >
                  {isMuted ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
                </button>

                {/* End call button */}
                <button 
                  onClick={endCall}
                  className="w-16 h-16 rounded-full flex items-center justify-center bg-red-600 text-white hover:bg-red-700 transition"
                  title="End Call"
                >
                  <PhoneOff className="w-7 h-7" />
                </button>

                {/* Video toggle button */}
                {activeCall.type === 'video' && (
                  <button 
                    onClick={toggleCamera}
                    className={`w-14 h-14 rounded-full flex items-center justify-center transition border ${
                      isCameraOff 
                        ? 'bg-red-600 border-transparent text-white' 
                        : 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800'
                    }`}
                    title={isCameraOff ? 'Turn Camera On' : 'Turn Camera Off'}
                  >
                    {isCameraOff ? <VideoOff className="w-6 h-6" /> : <Video className="w-6 h-6" />}
                  </button>
                )}
              </div>
              
              <p className="text-xs text-slate-500 select-none">
                True Anointing Youth Call Session • Server Region: West Africa
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
    </div>
  );
};

export default Chat;
