import { UserProfile, Program, Announcement, Payment, AttendanceRecord, EventRegistration } from '../types';

const apiKey = import.meta.env.VITE_FIREBASE_API_KEY;
export const isMockMode = 
  !apiKey || 
  apiKey === 'dummy-api-key' ||
  (typeof apiKey === 'string' && apiKey.includes('your_')) ||
  (typeof apiKey === 'string' && apiKey.includes('placeholder'));


// Mock data storage in LocalStorage
const getStorageItem = <T>(key: string, defaultValue: T): T => {
  const item = localStorage.getItem(key);
  if (!item) {
    localStorage.setItem(key, JSON.stringify(defaultValue));
    return defaultValue;
  }
  try {
    return JSON.parse(item) as T;
  } catch {
    return defaultValue;
  }
};

const setStorageItem = <T>(key: string, value: T): void => {
  localStorage.setItem(key, JSON.stringify(value));
};

// Seed Users
const initialUsers: UserProfile[] = [
  {
    uid: 'admin-uid',
    memberId: 'TAVY-2026-0001',
    firstName: 'Super',
    lastName: 'Admin',
    gender: 'Male',
    dateOfBirth: '1985-05-15',
    phone: '0558736867',
    email: 'joshuayankey19@gmail.com',
    occupation: 'Software Engineer',
    residentialAddress: 'Bibiani, Ghana',
    emergencyContact: 'Jane Admin',
    emergencyPhone: '+233 24 123 4568',
    ministry: 'Media',
    position: 'Youth Pastor',
    dateJoined: '2015-01-10',
    baptized: true,
    photoURL: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150',
    status: 'active',
    role: 'super-admin',
    bio: 'Dedicated to leading the youth of True Anointing Victory Youth into spiritual victory and purpose.',
    createdAt: '2026-01-01T00:00:00.000Z'
  },
  {
    uid: 'leader-uid',
    memberId: 'TAVY-2026-0002',
    firstName: 'Sister',
    lastName: 'Grace',
    gender: 'Female',
    dateOfBirth: '1992-08-20',
    phone: '+233 27 987 6543',
    email: 'leader@victoryyouth.org',
    occupation: 'Teacher',
    school: 'University of Ghana',
    residentialAddress: '45 Anointing Court, Kumasi',
    emergencyContact: 'John Grace',
    emergencyPhone: '+233 27 987 6544',
    ministry: 'Music',
    position: 'Choir Director',
    dateJoined: '2018-03-12',
    baptized: true,
    photoURL: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
    status: 'active',
    role: 'leader',
    bio: 'Worship leader and mentor. Passionate about music ministry and youth engagement.',
    createdAt: '2026-01-02T00:00:00.000Z'
  },
  {
    uid: 'member-uid',
    memberId: 'TAVY-2026-0003',
    firstName: 'Brother',
    lastName: 'Emmanuel',
    gender: 'Male',
    dateOfBirth: '2002-11-05',
    phone: '+233 55 456 7890',
    email: 'member@victoryyouth.org',
    occupation: 'Student',
    school: 'KNUST',
    residentialAddress: '77 Faith Avenue, Accra',
    emergencyContact: 'Mary Mensah',
    emergencyPhone: '+233 55 456 7891',
    ministry: 'Ushering',
    position: 'Member',
    dateJoined: '2022-06-15',
    baptized: true,
    photoURL: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
    status: 'active',
    role: 'member',
    bio: 'Serving God in the youth ministry. Always ready to welcome people into the house of the Lord.',
    createdAt: '2026-01-03T00:00:00.000Z'
  }
];

// Seed Programs
const initialPrograms: Program[] = [
  {
    programId: 'prog-1',
    title: 'Youth Fire Retreat 2026',
    description: 'A 3-day spiritual encounter for the youth to experience the revival and fire of God. Join us for sessions of intensive prayer, worship, and word.',
    venue: 'Victory Camp Grounds, Aburi',
    date: '2026-08-15',
    time: '18:00',
    speaker: 'Apostle Joshua Selman',
    flyerURL: 'https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?w=800',
    type: 'retreat',
    createdAt: '2026-07-01T10:00:00Z',
    createdBy: 'admin-uid'
  },
  {
    programId: 'prog-2',
    title: 'Empowerment Youth Service',
    description: 'Our regular Sunday youth service focusing on career development, academic excellence, and navigating Christian life in a modern world.',
    venue: 'Main Church Auditorium',
    date: '2026-07-26',
    time: '09:00',
    speaker: 'Pastor Jerry Eze',
    flyerURL: 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?w=800',
    type: 'youth-service',
    createdAt: '2026-07-10T12:00:00Z',
    createdBy: 'admin-uid'
  },
  {
    programId: 'prog-3',
    title: 'Mid-Year Prayer Night',
    description: 'An overnight prayer marathon to commit the second half of the year into God\'s hands. Come seeking breakthroughs and spiritual refreshing.',
    venue: 'Prayer Gardens',
    date: '2026-07-31',
    time: '22:00',
    speaker: 'Youth Leadership Team',
    flyerURL: 'https://images.unsplash.com/photo-1544427920-c49ccfb85579?w=800',
    type: 'prayer-meeting',
    createdAt: '2026-07-15T08:00:00Z',
    createdBy: 'leader-uid'
  }
];

// Seed Announcements
const initialAnnouncements: Announcement[] = [
  {
    announcementId: 'ann-1',
    title: 'Monthly Youth Dues Reminder',
    content: 'Dear youth members, this is a friendly reminder to pay our monthly dues of GHS 50. This supports youth programs, charity outreach, and welfare activities. Payments can be securely made via Paystack directly on the Dues page. God bless you for your faithfulness!',
    type: 'reminder',
    authorId: 'admin-uid',
    authorName: 'Super Admin',
    authorRole: 'super-admin',
    likes: ['member-uid', 'leader-uid'],
    createdAt: '2026-07-20T08:00:00Z'
  },
  {
    announcementId: 'ann-2',
    title: 'Happy Birthday, Sister Grace!',
    content: 'We celebrate our Choir Director, Sister Grace, on her birthday today! Thank you for your leadership, sacrifice, and the beautiful music you bring into our lives. May God multiply His grace upon you. Wish her well in the comments!',
    type: 'birthday',
    authorId: 'admin-uid',
    authorName: 'Super Admin',
    authorRole: 'super-admin',
    likes: ['member-uid'],
    createdAt: '2026-07-22T06:00:00Z'
  },
  {
    announcementId: 'ann-3',
    title: 'Prayer Request for Youth Examinations',
    content: 'Let us lift up our high school and university students currently writing their mid-semester and final exams. Pray for retentive memory, academic success, and peace of mind during this season. Share your exam schedules or specific requests here.',
    type: 'prayer-request',
    authorId: 'leader-uid',
    authorName: 'Sister Grace',
    authorRole: 'leader',
    likes: ['member-uid', 'admin-uid'],
    createdAt: '2026-07-21T14:30:00Z'
  }
];

// Seed Payments
const initialPayments: Payment[] = [
  {
    paymentId: 'pay-1',
    memberId: 'TAVY-2026-0003',
    memberName: 'Brother Emmanuel',
    amount: 50,
    reference: 'TAVY-PAY-1001-XYZ',
    status: 'success',
    date: '2026-05-10T11:45:00Z',
    receiptNumber: 'REC-2026-0001',
    method: 'Paystack',
    description: 'Monthly Dues - May 2026'
  },
  {
    paymentId: 'pay-2',
    memberId: 'TAVY-2026-0003',
    memberName: 'Brother Emmanuel',
    amount: 50,
    reference: 'TAVY-PAY-1002-XYZ',
    status: 'success',
    date: '2026-06-12T10:15:00Z',
    receiptNumber: 'REC-2026-0002',
    method: 'Paystack',
    description: 'Monthly Dues - June 2026'
  },
  {
    paymentId: 'pay-3',
    memberId: 'TAVY-2026-0002',
    memberName: 'Sister Grace',
    amount: 100,
    reference: 'TAVY-PAY-1003-XYZ',
    status: 'success',
    date: '2026-07-05T14:20:00Z',
    receiptNumber: 'REC-2026-0003',
    method: 'Paystack',
    description: 'Monthly Dues - July 2026 (Double payment)'
  }
];

// Seed Registrations
const initialRegistrations: EventRegistration[] = [
  {
    registrationId: 'reg-1',
    programId: 'prog-1',
    programTitle: 'Youth Fire Retreat 2026',
    programDate: '2026-08-15',
    programTime: '18:00',
    memberId: 'TAVY-2026-0003',
    memberName: 'Brother Emmanuel',
    email: 'member@victoryyouth.org',
    ticketCode: 'TKT-FIRE-9821-EM',
    checkedIn: false,
    createdAt: '2026-07-15T09:00:00Z'
  }
];

// Seed Attendance
const initialAttendance: AttendanceRecord[] = [
  {
    attendanceId: 'att-1',
    date: '2026-07-12',
    programId: 'prog-2',
    programTitle: 'Empowerment Youth Service',
    memberId: 'TAVY-2026-0003',
    memberName: 'Brother Emmanuel',
    status: 'present',
    remarks: 'Active participant',
    recordedBy: 'leader-uid',
    recordedByName: 'Sister Grace',
    createdAt: '2026-07-12T11:00:00Z'
  },
  {
    attendanceId: 'att-2',
    date: '2026-07-12',
    programId: 'prog-2',
    programTitle: 'Empowerment Youth Service',
    memberId: 'TAVY-2026-0002',
    memberName: 'Sister Grace',
    status: 'present',
    remarks: 'Led praise and worship',
    recordedBy: 'admin-uid',
    recordedByName: 'Super Admin',
    createdAt: '2026-07-12T11:05:00Z'
  }
];

// Seed Comments
const initialComments: any[] = [
  {
    commentId: 'c-1',
    programId: 'prog-1',
    userId: 'member-uid',
    userName: 'Brother Emmanuel',
    userPhotoURL: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
    message: 'Can\'t wait for this retreat! I am fasting and preparing my heart. God will definitely visit us.',
    likes: ['leader-uid', 'admin-uid'],
    createdAt: '2026-07-16T12:00:00Z'
  },
  {
    commentId: 'c-2',
    programId: 'prog-1',
    userId: 'leader-uid',
    userName: 'Sister Grace',
    userPhotoURL: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
    message: 'Amen, Brother Emmanuel! Let us all prepare, it\'s going to be a life-changing encounter.',
    likes: ['member-uid'],
    createdAt: '2026-07-16T15:30:00Z',
    parentId: 'c-1'
  }
];

const initialMessages = [
  {
    messageId: 'm-1',
    senderId: 'admin-uid',
    senderName: 'Super Admin',
    senderPhotoURL: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150',
    channelId: 'general-youth',
    content: 'Welcome to the TRUE ANOINTING VICTORY YOUTH communication platform! Here we can chat, share encouraging resources, and coordinate youth programs.',
    type: 'text',
    createdAt: '2026-07-22T08:00:00Z'
  },
  {
    messageId: 'm-2',
    senderId: 'leader-uid',
    senderName: 'Sister Grace',
    senderPhotoURL: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
    channelId: 'general-youth',
    content: 'Praise the Lord! So glad we have this platform. Let us use it to grow in unity and spirit.',
    type: 'text',
    createdAt: '2026-07-22T08:15:00Z'
  }
];

// Mock database class implementing state management and updates
export class MockDatabase {
  users: UserProfile[];
  programs: Program[];
  announcements: Announcement[];
  payments: Payment[];
  registrations: EventRegistration[];
  attendance: AttendanceRecord[];
  comments: any[];
  messages: any[];

  constructor() {
    this.users = getStorageItem('tavy_users', initialUsers);
    
    // Auto-update super-admin profile to match new details
    const adminIndex = this.users.findIndex(u => u.uid === 'admin-uid');
    if (adminIndex !== -1) {
      const admin = this.users[adminIndex];
      if (admin.email !== 'joshuayankey19@gmail.com' || admin.phone !== '0558736867' || admin.residentialAddress !== 'Bibiani, Ghana') {
        this.users[adminIndex] = {
          ...admin,
          email: 'joshuayankey19@gmail.com',
          phone: '0558736867',
          residentialAddress: 'Bibiani, Ghana'
        };
        setStorageItem('tavy_users', this.users);
      }
    }

    this.programs = getStorageItem('tavy_programs', initialPrograms);
    this.announcements = getStorageItem('tavy_announcements', initialAnnouncements);
    this.payments = getStorageItem('tavy_payments', initialPayments);
    this.registrations = getStorageItem('tavy_registrations', initialRegistrations);
    this.attendance = getStorageItem('tavy_attendance', initialAttendance);
    this.comments = getStorageItem('tavy_comments', initialComments);
    this.messages = getStorageItem('tavy_messages', initialMessages);
  }

  save() {
    setStorageItem('tavy_users', this.users);
    setStorageItem('tavy_programs', this.programs);
    setStorageItem('tavy_announcements', this.announcements);
    setStorageItem('tavy_payments', this.payments);
    setStorageItem('tavy_registrations', this.registrations);
    setStorageItem('tavy_attendance', this.attendance);
    setStorageItem('tavy_comments', this.comments);
    setStorageItem('tavy_messages', this.messages);
  }

  // Generic methods to handle CRUD
  getCollection(name: string) {
    return (this as any)[name];
  }

  updateCollection(name: string, data: any[]) {
    (this as any)[name] = data;
    this.save();
  }
}

export const mockDb = new MockDatabase();
export default mockDb;
