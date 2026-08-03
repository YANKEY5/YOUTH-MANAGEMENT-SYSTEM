import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  updateDoc, 
  addDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy,
  limit
} from 'firebase/firestore';
import { db } from './config';
import { mockDb, isMockMode } from './mockDb';
import { 
  UserProfile, 
  Program, 
  Announcement, 
  Payment, 
  AttendanceRecord, 
  EventRegistration, 
  ProgramComment,
  ChatMessage
} from '../types';

// Generate Member ID (auto-generated: TAVY-YYYY-XXXX)
export const generateMemberId = (): string => {
  const year = new Date().getFullYear();
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `TAVY-${year}-${rand}`;
};

// Generate Receipt Number (REC-YYYY-XXXX)
export const generateReceiptNumber = (): string => {
  const year = new Date().getFullYear();
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `REC-${year}-${rand}`;
};

// Generate Ticket Code (TKT-XXXX-XXXX)
export const generateTicketCode = (): string => {
  const rand1 = Math.floor(1000 + Math.random() * 9000);
  const rand2 = Math.floor(1000 + Math.random() * 9000);
  return `TKT-${rand1}-${rand2}`;
};

// ----------------------------------------------------
// User Management
// ----------------------------------------------------
export const getUserProfile = async (uid: string): Promise<UserProfile | null> => {
  if (isMockMode) {
    const user = mockDb.users.find(u => u.uid === uid);
    return user || null;
  }
  
  const docRef = doc(db, 'users', uid);
  const docSnap = await getDoc(docRef);
  if (docSnap.exists()) {
    return docSnap.data() as UserProfile;
  }
  return null;
};

export const createUserProfile = async (uid: string, profile: Omit<UserProfile, 'uid' | 'createdAt'>): Promise<UserProfile> => {
  const fullProfile: UserProfile = {
    ...profile,
    uid,
    createdAt: new Date().toISOString(),
    status: profile.status || 'active',
    role: profile.role || 'member'
  };

  if (isMockMode) {
    mockDb.users.push(fullProfile);
    mockDb.save();
    return fullProfile;
  }

  await setDoc(doc(db, 'users', uid), fullProfile);
  return fullProfile;
};

export const updateUserProfile = async (uid: string, profile: Partial<UserProfile>): Promise<void> => {
  if (isMockMode) {
    const idx = mockDb.users.findIndex(u => u.uid === uid);
    if (idx !== -1) {
      mockDb.users[idx] = { ...mockDb.users[idx], ...profile } as UserProfile;
      mockDb.save();
    }
    return;
  }

  const docRef = doc(db, 'users', uid);
  await updateDoc(docRef, profile as any);
};

export const getAllUsers = async (): Promise<UserProfile[]> => {
  if (isMockMode) {
    return mockDb.users;
  }

  const querySnapshot = await getDocs(collection(db, 'users'));
  return querySnapshot.docs.map(doc => doc.data() as UserProfile);
};

// ----------------------------------------------------
// Programs / Events
// ----------------------------------------------------
export const getAllPrograms = async (): Promise<Program[]> => {
  if (isMockMode) {
    return [...mockDb.programs].sort((a, b) => b.date.localeCompare(a.date));
  }

  const q = query(collection(db, 'programs'), orderBy('date', 'desc'));
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({ ...doc.data(), programId: doc.id } as Program));
};

export const createProgram = async (prog: Omit<Program, 'programId' | 'createdAt'>): Promise<Program> => {
  const newProg = {
    ...prog,
    createdAt: new Date().toISOString()
  };

  if (isMockMode) {
    const programId = `prog-${Date.now()}`;
    const saved = { ...newProg, programId };
    mockDb.programs.push(saved);
    mockDb.save();
    return saved;
  }

  const docRef = await addDoc(collection(db, 'programs'), newProg);
  return { ...newProg, programId: docRef.id };
};

export const updateProgram = async (programId: string, data: Partial<Program>): Promise<void> => {
  if (isMockMode) {
    const idx = mockDb.programs.findIndex(p => p.programId === programId);
    if (idx !== -1) {
      mockDb.programs[idx] = { ...mockDb.programs[idx], ...data } as Program;
      mockDb.save();
    }
    return;
  }

  const docRef = doc(db, 'programs', programId);
  await updateDoc(docRef, data as any);
};

export const deleteProgram = async (programId: string): Promise<void> => {
  if (isMockMode) {
    mockDb.programs = mockDb.programs.filter(p => p.programId !== programId);
    mockDb.comments = mockDb.comments.filter(c => c.programId !== programId);
    mockDb.registrations = mockDb.registrations.filter(r => r.programId !== programId);
    mockDb.save();
    return;
  }

  await deleteDoc(doc(db, 'programs', programId));
};

// ----------------------------------------------------
// Program Comments
// ----------------------------------------------------
export const getComments = async (programId: string): Promise<ProgramComment[]> => {
  if (isMockMode) {
    return mockDb.comments
      .filter(c => c.programId === programId)
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  }

  const q = query(
    collection(db, 'comments'), 
    where('programId', '==', programId), 
    orderBy('createdAt', 'asc')
  );
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({ ...doc.data(), commentId: doc.id } as ProgramComment));
};

export const addComment = async (comment: Omit<ProgramComment, 'commentId' | 'createdAt' | 'likes'>): Promise<ProgramComment> => {
  const newComment = {
    ...comment,
    likes: [],
    createdAt: new Date().toISOString()
  };

  if (isMockMode) {
    const commentId = `comment-${Date.now()}`;
    const saved = { ...newComment, commentId };
    mockDb.comments.push(saved);
    mockDb.save();
    return saved;
  }

  const docRef = await addDoc(collection(db, 'comments'), newComment);
  return { ...newComment, commentId: docRef.id };
};

export const likeComment = async (commentId: string, uid: string): Promise<void> => {
  if (isMockMode) {
    const comment = mockDb.comments.find(c => c.commentId === commentId);
    if (comment) {
      if (comment.likes.includes(uid)) {
        comment.likes = comment.likes.filter((id: string) => id !== uid);
      } else {
        comment.likes.push(uid);
      }
      mockDb.save();
    }
    return;
  }

  const docRef = doc(db, 'comments', commentId);
  const docSnap = await getDoc(docRef);
  if (docSnap.exists()) {
    const currentLikes = docSnap.data().likes || [];
    const updatedLikes = currentLikes.includes(uid)
      ? currentLikes.filter((id: string) => id !== uid)
      : [...currentLikes, uid];
    await updateDoc(docRef, { likes: updatedLikes });
  }
};

export const deleteComment = async (commentId: string): Promise<void> => {
  if (isMockMode) {
    // Delete comment and its replies
    mockDb.comments = mockDb.comments.filter(c => c.commentId !== commentId && c.parentId !== commentId);
    mockDb.save();
    return;
  }

  await deleteDoc(doc(db, 'comments', commentId));
};

export const updateComment = async (commentId: string, updates: Partial<ProgramComment>): Promise<void> => {
  if (isMockMode) {
    const idx = mockDb.comments.findIndex(c => c.commentId === commentId);
    if (idx !== -1) {
      mockDb.comments[idx] = { ...mockDb.comments[idx], ...updates };
      mockDb.save();
    }
    return;
  }
  const docRef = doc(db, 'comments', commentId);
  await updateDoc(docRef, updates as any);
};

// ----------------------------------------------------
// Event Registrations
// ----------------------------------------------------
export const getRegistrationsByMember = async (memberId: string): Promise<EventRegistration[]> => {
  if (isMockMode) {
    return mockDb.registrations.filter(r => r.memberId === memberId);
  }

  const q = query(collection(db, 'registrations'), where('memberId', '==', memberId));
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({ ...doc.data(), registrationId: doc.id } as EventRegistration));
};

export const registerForEvent = async (reg: Omit<EventRegistration, 'registrationId' | 'ticketCode' | 'checkedIn' | 'createdAt'>): Promise<EventRegistration> => {
  const newReg = {
    ...reg,
    ticketCode: generateTicketCode(),
    checkedIn: false,
    createdAt: new Date().toISOString()
  };

  if (isMockMode) {
    const registrationId = `reg-${Date.now()}`;
    const saved = { ...newReg, registrationId };
    mockDb.registrations.push(saved);
    mockDb.save();
    return saved;
  }

  const docRef = await addDoc(collection(db, 'registrations'), newReg);
  return { ...newReg, registrationId: docRef.id };
};

export const cancelRegistration = async (regId: string): Promise<void> => {
  if (isMockMode) {
    mockDb.registrations = mockDb.registrations.filter(r => r.registrationId !== regId);
    mockDb.save();
    return;
  }

  await deleteDoc(doc(db, 'registrations', regId));
};

export const checkInAttendee = async (programId: string, ticketCode: string): Promise<EventRegistration> => {
  if (isMockMode) {
    const reg = mockDb.registrations.find(r => r.programId === programId && r.ticketCode === ticketCode);
    if (!reg) throw new Error('Registration ticket not found.');
    if (reg.checkedIn) throw new Error('Ticket already scanned.');
    reg.checkedIn = true;
    reg.checkedInAt = new Date().toISOString();
    mockDb.save();
    return reg;
  }

  const q = query(
    collection(db, 'registrations'), 
    where('programId', '==', programId), 
    where('ticketCode', '==', ticketCode)
  );
  const querySnapshot = await getDocs(q);
  if (querySnapshot.empty) {
    throw new Error('Registration ticket not found.');
  }
  const docRef = querySnapshot.docs[0].ref;
  const regData = querySnapshot.docs[0].data() as EventRegistration;
  if (regData.checkedIn) {
    throw new Error('Ticket already scanned.');
  }
  
  const checkedInAt = new Date().toISOString();
  await updateDoc(docRef, { checkedIn: true, checkedInAt });
  return { ...regData, registrationId: docRef.id, checkedIn: true, checkedInAt };
};

// ----------------------------------------------------
// Dues & Payments
// ----------------------------------------------------
export const getPayments = async (memberId?: string): Promise<Payment[]> => {
  if (isMockMode) {
    if (memberId) {
      return mockDb.payments.filter(p => p.memberId === memberId).sort((a, b) => b.date.localeCompare(a.date));
    }
    return [...mockDb.payments].sort((a, b) => b.date.localeCompare(a.date));
  }

  let q = query(collection(db, 'payments'), orderBy('date', 'desc'));
  if (memberId) {
    q = query(collection(db, 'payments'), where('memberId', '==', memberId), orderBy('date', 'desc'));
  }
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({ ...doc.data(), paymentId: doc.id } as Payment));
};

export const createPayment = async (payment: Omit<Payment, 'paymentId' | 'receiptNumber' | 'date'>): Promise<Payment> => {
  const newPayment = {
    ...payment,
    receiptNumber: generateReceiptNumber(),
    date: new Date().toISOString()
  };

  if (isMockMode) {
    const paymentId = `pay-${Date.now()}`;
    const saved = { ...newPayment, paymentId };
    mockDb.payments.push(saved);
    mockDb.save();
    return saved;
  }

  const docRef = await addDoc(collection(db, 'payments'), newPayment);
  return { ...newPayment, paymentId: docRef.id };
};

// ----------------------------------------------------
// Announcements
// ----------------------------------------------------
export const getAllAnnouncements = async (): Promise<Announcement[]> => {
  if (isMockMode) {
    return [...mockDb.announcements].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  const q = query(collection(db, 'announcements'), orderBy('createdAt', 'desc'));
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({ ...doc.data(), announcementId: doc.id } as Announcement));
};

export const createAnnouncement = async (ann: Omit<Announcement, 'announcementId' | 'createdAt' | 'likes'>): Promise<Announcement> => {
  const newAnn = {
    ...ann,
    likes: [],
    createdAt: new Date().toISOString()
  };

  if (isMockMode) {
    const announcementId = `ann-${Date.now()}`;
    const saved = { ...newAnn, announcementId };
    mockDb.announcements.push(saved);
    mockDb.save();
    return saved;
  }

  const docRef = await addDoc(collection(db, 'announcements'), newAnn);
  return { ...newAnn, announcementId: docRef.id };
};

export const likeAnnouncement = async (announcementId: string, uid: string): Promise<void> => {
  if (isMockMode) {
    const ann = mockDb.announcements.find(a => a.announcementId === announcementId);
    if (ann) {
      if (ann.likes.includes(uid)) {
        ann.likes = ann.likes.filter((id: string) => id !== uid);
      } else {
        ann.likes.push(uid);
      }
      mockDb.save();
    }
    return;
  }

  const docRef = doc(db, 'announcements', announcementId);
  const docSnap = await getDoc(docRef);
  if (docSnap.exists()) {
    const currentLikes = docSnap.data().likes || [];
    const updatedLikes = currentLikes.includes(uid)
      ? currentLikes.filter((id: string) => id !== uid)
      : [...currentLikes, uid];
    await updateDoc(docRef, { likes: updatedLikes });
  }
};

export const deleteAnnouncement = async (announcementId: string): Promise<void> => {
  if (isMockMode) {
    mockDb.announcements = mockDb.announcements.filter(a => a.announcementId !== announcementId);
    mockDb.save();
    return;
  }

  await deleteDoc(doc(db, 'announcements', announcementId));
};

// ----------------------------------------------------
// Attendance
// ----------------------------------------------------
export const getAttendance = async (memberId?: string): Promise<AttendanceRecord[]> => {
  if (isMockMode) {
    if (memberId) {
      return mockDb.attendance.filter(a => a.memberId === memberId).sort((a, b) => b.date.localeCompare(a.date));
    }
    return [...mockDb.attendance].sort((a, b) => b.date.localeCompare(a.date));
  }

  let q = query(collection(db, 'attendance'), orderBy('date', 'desc'));
  if (memberId) {
    q = query(collection(db, 'attendance'), where('memberId', '==', memberId), orderBy('date', 'desc'));
  }
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({ ...doc.data(), attendanceId: doc.id } as AttendanceRecord));
};

export const recordAttendance = async (records: Omit<AttendanceRecord, 'attendanceId' | 'createdAt'>[]): Promise<void> => {
  const createdAt = new Date().toISOString();
  
  if (isMockMode) {
    records.forEach(rec => {
      const attendanceId = `att-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      mockDb.attendance.push({ ...rec, attendanceId, createdAt });
    });
    mockDb.save();
    return;
  }

  // Write batch or sequential sets in Firebase
  for (const rec of records) {
    await addDoc(collection(db, 'attendance'), { ...rec, createdAt });
  }
};

// ----------------------------------------------------
// Chat & Messages Platform
// ----------------------------------------------------
export const getChatMessages = async (channelIdOrUserId: string, currentUserId: string): Promise<ChatMessage[]> => {
  if (isMockMode) {
    // Filter messages for either group channel or DM
    return mockDb.messages
      .filter(m => {
        if (m.channelId) {
          return m.channelId === channelIdOrUserId;
        }
        // Direct Message: message belongs to this DM thread (sender=user1 and recipient=user2 OR sender=user2 and recipient=user1)
        return (m.senderId === currentUserId && m.recipientId === channelIdOrUserId) ||
               (m.senderId === channelIdOrUserId && m.recipientId === currentUserId);
      })
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  }

  // Live Firebase Query
  let q;
  if (channelIdOrUserId.startsWith('general') || channelIdOrUserId.includes('-')) {
    // Group Channel Query
    q = query(
      collection(db, 'messages'),
      where('channelId', '==', channelIdOrUserId),
      orderBy('createdAt', 'asc')
    );
  } else {
    // Direct Message Queries are more complex in Firestore due to composite filters,
    // so we pull messages where sender or recipient is involved and filter in client, or query twice
    // For simplicity, we query messages involving the current user and filter thread on client
    q = query(
      collection(db, 'messages'),
      orderBy('createdAt', 'asc')
    );
  }
  const querySnapshot = await getDocs(q);
  const allMsgs = querySnapshot.docs.map(doc => ({ ...doc.data(), messageId: doc.id } as ChatMessage));
  
  if (channelIdOrUserId.startsWith('general') || channelIdOrUserId.includes('-')) {
    return allMsgs;
  }
  
  // Filter DM messages client-side
  return allMsgs.filter(m => 
    (m.senderId === currentUserId && m.recipientId === channelIdOrUserId) ||
    (m.senderId === channelIdOrUserId && m.recipientId === currentUserId)
  );
};

export const sendChatMessage = async (msg: Omit<ChatMessage, 'messageId' | 'createdAt'>): Promise<ChatMessage> => {
  const newMsg = {
    ...msg,
    createdAt: new Date().toISOString()
  };

  if (isMockMode) {
    const messageId = `msg-${Date.now()}`;
    const saved = { ...newMsg, messageId };
    mockDb.messages.push(saved);
    mockDb.save();
    return saved;
  }

  const docRef = await addDoc(collection(db, 'messages'), newMsg);
  return { ...newMsg, messageId: docRef.id };
};

