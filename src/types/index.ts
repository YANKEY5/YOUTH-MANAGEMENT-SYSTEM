export type UserRole = 'super-admin' | 'leader' | 'member';
export type UserStatus = 'active' | 'suspended' | 'inactive';

export interface UserProfile {
  uid: string;
  memberId: string; // Auto-generated
  firstName: string;
  lastName: string;
  gender: string;
  dateOfBirth: string;
  phone: string;
  email: string;
  occupation?: string;
  school?: string;
  residentialAddress: string;
  emergencyContact: string;
  emergencyPhone: string;
  ministry: string; // e.g. Music, Ushering, Media, Drama, etc.
  position: string; // e.g. Coordinator, Assistant, Member
  dateJoined: string;
  baptized: boolean;
  photoURL?: string;
  status: UserStatus;
  role: UserRole;
  bio?: string;
  createdAt: string;
  documents?: {
    nationalId?: string;
    birthCertificate?: string;
    medicalInfo?: string;
  };
}

export interface Payment {
  paymentId: string;
  memberId: string;
  memberName: string;
  amount: number;
  reference: string;
  status: 'pending' | 'success' | 'failed';
  date: string;
  receiptNumber: string;
  method: string; // e.g. Paystack, Cash, Bank Transfer
  description: string; // e.g. Monthly Dues - July 2026
}

export interface Program {
  programId: string;
  title: string;
  description: string;
  venue: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:MM
  speaker: string;
  flyerURL?: string;
  type: 'retreat' | 'prayer-meeting' | 'conference' | 'youth-service' | 'evangelism' | 'other';
  createdAt: string;
  createdBy: string;
}

export interface ProgramComment {
  commentId: string;
  programId: string;
  userId: string;
  userName: string;
  userPhotoURL?: string;
  message: string;
  likes: string[]; // uids of users who liked
  createdAt: string;
  parentId?: string; // for replies
  pinned?: boolean;
  hidden?: boolean;
}

export interface Announcement {
  announcementId: string;
  title: string;
  content: string;
  type: 'announcement' | 'birthday' | 'prayer-request' | 'reminder';
  authorId: string;
  authorName: string;
  authorRole: UserRole;
  likes: string[]; // uids of users who liked
  createdAt: string;
  commentsCount?: number;
}

export interface AttendanceRecord {
  attendanceId: string;
  date: string; // YYYY-MM-DD
  programId: string;
  programTitle: string;
  memberId: string;
  memberName: string;
  status: 'present' | 'absent' | 'excused';
  remarks?: string;
  recordedBy: string; // uid
  recordedByName: string;
  createdAt: string;
}

export interface EventRegistration {
  registrationId: string;
  programId: string;
  programTitle: string;
  programDate: string;
  programTime: string;
  memberId: string;
  memberName: string;
  email: string;
  ticketCode: string; // Random ticket UUID or code
  checkedIn: boolean;
  checkedInAt?: string;
  createdAt: string;
}

export interface Testimony {
  testimonyId: string;
  userId: string;
  userName: string;
  userPhotoURL?: string;
  title: string;
  content: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
}

export interface PrayerRequest {
  requestId: string;
  userId: string;
  userName: string;
  title: string;
  content: string;
  isPrivate: boolean;
  createdAt: string;
}

export interface ChatMessage {
  messageId: string;
  senderId: string;
  senderName: string;
  senderPhotoURL?: string;
  recipientId?: string; // for direct messages
  channelId?: string; // for group channel chats
  content: string;
  type: 'text' | 'image' | 'video' | 'audio';
  fileURL?: string;
  createdAt: string;
}

export interface SystemSettings {
  churchName: string;
  duesRate: string;
  allowRegistration: boolean;
  emailNotify: boolean;
  offlineSupport: boolean;
  paystackPublicKey?: string;
}

export interface PaymentSetting {
  id: string;
  name: string;
  amount: number;
  isFixed: boolean;
  isDues: boolean;
}

