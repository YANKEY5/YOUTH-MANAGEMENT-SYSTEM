import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  onAuthStateChanged, 
  signInWithEmailAndPassword, 
  signOut, 
  sendPasswordResetEmail,
  signInWithPopup
} from 'firebase/auth';
import type { User as FirebaseUser } from 'firebase/auth';
import { auth, googleProvider } from '../firebase/config';
import { isMockMode, mockDb } from '../firebase/mockDb';
import { getUserProfile, createUserProfile, updateUserProfile, generateMemberId } from '../firebase/dbService';
import { UserProfile, SystemSettings, PaymentSetting } from '../types';

interface AuthContextType {
  currentUser: UserProfile | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<UserProfile>;
  loginWithGoogle: () => Promise<UserProfile>;
  register: (email: string, password: string, profile: Omit<UserProfile, 'uid' | 'memberId' | 'createdAt' | 'role' | 'status'>) => Promise<UserProfile>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updateProfile: (updates: Partial<UserProfile>) => Promise<void>;
  switchDemoUser: (role: 'super-admin' | 'leader' | 'member') => void;
  systemSettings: SystemSettings;
  updateSystemSettings: (settings: SystemSettings) => void;
  paymentSettings: PaymentSetting[];
  updatePaymentSettings: (settings: PaymentSetting[]) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [systemSettings, setSystemSettings] = useState<SystemSettings>(() => {
    const defaultSettings: SystemSettings = {
      churchName: 'TRUE ANOINTING VICTORY YOUTH',
      duesRate: '50',
      allowRegistration: true,
      emailNotify: true,
      offlineSupport: true,
      paystackPublicKey: ''
    };

    const saved = localStorage.getItem('tavy_settings');
    if (saved) {
      try {
        return { ...defaultSettings, ...JSON.parse(saved) };
      } catch (e) {
        // Fallback to default settings
      }
    }
    return defaultSettings;
  });

  const [paymentSettings, setPaymentSettings] = useState<PaymentSetting[]>(() => {
    const saved = localStorage.getItem('tavy_payment_settings');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      } catch (e) {
        // Fallback
      }
    }
    return [
      { id: 'dues', name: 'Monthly Dues', amount: 50, isFixed: false, isDues: true },
      { id: 'welfare', name: 'Welfare Contribution', amount: 10, isFixed: false, isDues: false },
      { id: 'special-offering', name: 'Special Offering', amount: 0, isFixed: false, isDues: false }
    ];
  });

  const updateSystemSettings = (newSettings: SystemSettings) => {
    setSystemSettings(newSettings);
    localStorage.setItem('tavy_settings', JSON.stringify(newSettings));
    
    // Sync paymentSettings if duesRate changed
    const updatedPaymentSettings = paymentSettings.map(s => {
      if (s.id === 'dues' || s.isDues) {
        return { ...s, amount: Number(newSettings.duesRate) };
      }
      return s;
    });
    if (JSON.stringify(updatedPaymentSettings) !== JSON.stringify(paymentSettings)) {
      setPaymentSettings(updatedPaymentSettings);
      localStorage.setItem('tavy_payment_settings', JSON.stringify(updatedPaymentSettings));
    }
  };

  const updatePaymentSettings = (newSettings: PaymentSetting[]) => {
    setPaymentSettings(newSettings);
    localStorage.setItem('tavy_payment_settings', JSON.stringify(newSettings));
    
    // Sync duesRate setting if dues amount changed
    const duesSetting = newSettings.find(s => s.id === 'dues' || s.isDues);
    if (duesSetting && duesSetting.amount.toString() !== systemSettings.duesRate) {
      setSystemSettings(prev => {
        const updated = { ...prev, duesRate: duesSetting.amount.toString() };
        localStorage.setItem('tavy_settings', JSON.stringify(updated));
        return updated;
      });
    }
  };

  // Setup Listener
  useEffect(() => {
    if (isMockMode) {
      // Mock mode checks if there is a session stored in localStorage
      const savedUser = localStorage.getItem('tavy_session');
      if (savedUser) {
        try {
          const parsed = JSON.parse(savedUser) as UserProfile;
          // Refresh from mock database to get latest
          const fresh = mockDb.users.find(u => u.uid === parsed.uid);
          setCurrentUser(fresh || parsed);
        } catch {
          setCurrentUser(null);
        }
      } else {
        // Auto log in member-uid by default for easy testing if no session exists
        const defaultMember = mockDb.users.find(u => u.role === 'member') || null;
        if (defaultMember) {
          localStorage.setItem('tavy_session', JSON.stringify(defaultMember));
          setCurrentUser(defaultMember);
        }
      }
      setLoading(false);
      return;
    }

    // Real Firebase Mode
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
      setLoading(true);
      if (firebaseUser) {
        try {
          let profile = await getUserProfile(firebaseUser.uid);
          if (!profile) {
            // If user exists in Auth but not in Users collection (e.g. first Google Login)
            const names = firebaseUser.displayName?.split(' ') || ['User', ''];
            profile = await createUserProfile(firebaseUser.uid, {
              memberId: generateMemberId(),
              firstName: names[0] || 'Member',
              lastName: names.slice(1).join(' ') || 'User',
              email: firebaseUser.email || '',
              gender: 'Unspecified',
              dateOfBirth: '',
              phone: firebaseUser.phoneNumber || '',
              residentialAddress: '',
              emergencyContact: '',
              emergencyPhone: '',
              ministry: 'General',
              position: 'Member',
              dateJoined: new Date().toISOString().split('T')[0],
              baptized: false,
              photoURL: firebaseUser.photoURL || '',
              status: 'active',
              role: 'member'
            });
          }
          
          if (profile.status === 'suspended') {
            await signOut(auth);
            setCurrentUser(null);
            alert('Your account has been suspended. Please contact leadership.');
          } else {
            setCurrentUser(profile);
          }
        } catch (error) {
          console.error('Error fetching user profile:', error);
          setCurrentUser(null);
        }
      } else {
        setCurrentUser(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const login = async (email: string, password: string): Promise<UserProfile> => {
    setLoading(true);
    try {
      if (isMockMode) {
        const user = mockDb.users.find(u => u.email.toLowerCase() === email.toLowerCase());
        if (!user) {
          throw new Error('User not found. Try joshuayankey19@gmail.com, leader@victoryyouth.org, or member@victoryyouth.org.');
        }
        if (user.status === 'suspended') {
          throw new Error('Your account has been suspended. Please contact leadership.');
        }
        localStorage.setItem('tavy_session', JSON.stringify(user));
        setCurrentUser(user);
        return user;
      }

      const credentials = await signInWithEmailAndPassword(auth, email, password);
      const profile = await getUserProfile(credentials.user.uid);
      if (!profile) {
        throw new Error('User profile does not exist.');
      }
      if (profile.status === 'suspended') {
        await signOut(auth);
        throw new Error('Your account has been suspended. Please contact leadership.');
      }
      setCurrentUser(profile);
      return profile;
    } finally {
      setLoading(false);
    }
  };

  const loginWithGoogle = async (): Promise<UserProfile> => {
    setLoading(true);
    try {
      if (isMockMode) {
        // In mock mode, log in as member
        const user = mockDb.users.find(u => u.role === 'member') || mockDb.users[0];
        localStorage.setItem('tavy_session', JSON.stringify(user));
        setCurrentUser(user);
        return user;
      }

      const result = await signInWithPopup(auth, googleProvider);
      let profile = await getUserProfile(result.user.uid);
      if (!profile) {
        const names = result.user.displayName?.split(' ') || ['User', ''];
        profile = await createUserProfile(result.user.uid, {
          memberId: generateMemberId(),
          firstName: names[0] || 'Member',
          lastName: names.slice(1).join(' ') || 'User',
          email: result.user.email || '',
          gender: 'Unspecified',
          dateOfBirth: '',
          phone: result.user.phoneNumber || '',
          residentialAddress: '',
          emergencyContact: '',
          emergencyPhone: '',
          ministry: 'General',
          position: 'Member',
          dateJoined: new Date().toISOString().split('T')[0],
          baptized: false,
          photoURL: result.user.photoURL || '',
          status: 'active',
          role: 'member'
        });
      }
      if (profile.status === 'suspended') {
        await signOut(auth);
        throw new Error('Your account has been suspended. Please contact leadership.');
      }
      setCurrentUser(profile);
      return profile;
    } finally {
      setLoading(false);
    }
  };

  const register = async (
    email: string, 
    password: string, 
    profile: Omit<UserProfile, 'uid' | 'memberId' | 'createdAt' | 'role' | 'status'>
  ): Promise<UserProfile> => {
    setLoading(true);
    try {
      const memberId = generateMemberId();
      
      if (isMockMode) {
        const exists = mockDb.users.some(u => u.email.toLowerCase() === email.toLowerCase());
        if (exists) {
          throw new Error('User with this email already exists.');
        }
        
        const uid = `mock-uid-${Date.now()}`;
        const newProfile = await createUserProfile(uid, {
          ...profile,
          memberId,
          role: 'member',
          status: 'active'
        });
        
        localStorage.setItem('tavy_session', JSON.stringify(newProfile));
        setCurrentUser(newProfile);
        return newProfile;
      }

      // Firebase Flow: Since we can't create users on auth easily without cloud, we register them
      // and create their document. Note: Firebase client SDK creates user via createUserWithEmailAndPassword.
      const { createUserWithEmailAndPassword } = await import('firebase/auth');
      const credentials = await createUserWithEmailAndPassword(auth, email, password);
      
      const newProfile = await createUserProfile(credentials.user.uid, {
        ...profile,
        memberId,
        role: 'member',
        status: 'active'
      });
      
      setCurrentUser(newProfile);
      return newProfile;
    } finally {
      setLoading(false);
    }
  };

  const logout = async (): Promise<void> => {
    setLoading(true);
    try {
      if (isMockMode) {
        localStorage.removeItem('tavy_session');
        setCurrentUser(null);
        return;
      }
      await signOut(auth);
      setCurrentUser(null);
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async (email: string): Promise<void> => {
    if (isMockMode) {
      alert(`[Demo Mode] Password reset email link simulated for: ${email}`);
      return;
    }
    await sendPasswordResetEmail(auth, email);
  };

  const updateProfile = async (updates: Partial<UserProfile>): Promise<void> => {
    if (!currentUser) return;
    
    // Prevent member from changing role/status/memberId
    if (currentUser.role === 'member') {
      delete updates.role;
      delete updates.status;
      delete updates.memberId;
    }

    await updateUserProfile(currentUser.uid, updates);
    setCurrentUser(prev => prev ? { ...prev, ...updates } as UserProfile : null);
  };

  // Helper for testing roles easily
  const switchDemoUser = (role: 'super-admin' | 'leader' | 'member') => {
    if (!isMockMode) return;
    const user = mockDb.users.find(u => u.role === role);
    if (user) {
      localStorage.setItem('tavy_session', JSON.stringify(user));
      setCurrentUser(user);
    }
  };

  return (
    <AuthContext.Provider value={{
      currentUser,
      loading,
      login,
      loginWithGoogle,
      register,
      logout,
      resetPassword,
      updateProfile,
      switchDemoUser,
      systemSettings,
      updateSystemSettings,
      paymentSettings,
      updatePaymentSettings
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
