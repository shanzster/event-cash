'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  User,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
} from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';

interface ManagerData {
  uid: string;
  email: string;
  displayName: string;
  role: 'manager' | 'admin';
  createdAt: any;
  updatedAt: any;
}

interface ManagerContextType {
  managerUser: User | null;
  managerData: ManagerData | null;
  loading: boolean;
  managerLogin: (email: string, password: string) => Promise<void>;
  managerSignup: (email: string, password: string, displayName: string) => Promise<void>;
  managerLogout: () => Promise<void>;
  isManager: boolean;
}

const ManagerContext = createContext<ManagerContextType | undefined>(undefined);

export const ManagerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [managerUser, setManagerUser] = useState<User | null>(null);
  const [managerData, setManagerData] = useState<ManagerData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          // Check if this user is a manager
          const managerDocRef = doc(db, 'managers', user.uid);
          const managerDocSnap = await getDoc(managerDocRef);

          if (managerDocSnap.exists()) {
            const data = managerDocSnap.data() as ManagerData;
            setManagerUser(user);
            setManagerData(data);
          } else {
            // Not a manager, sign out
            await signOut(auth);
            setManagerUser(null);
            setManagerData(null);
          }
        } catch (error) {
          console.error('Error fetching manager data:', error);
          setManagerUser(null);
          setManagerData(null);
        }
      } else {
        setManagerUser(null);
        setManagerData(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const managerLogin = async (email: string, password: string) => {
    const result = await signInWithEmailAndPassword(auth, email, password);

    // Verify this user is a manager
    const managerDocRef = doc(db, 'managers', result.user.uid);
    const managerDocSnap = await getDoc(managerDocRef);

    if (!managerDocSnap.exists()) {
      await signOut(auth);
      throw new Error('This account is not authorized as a manager');
    }

    const managerInfo = managerDocSnap.data() as ManagerData;
    setManagerUser(result.user);
    setManagerData(managerInfo);
  };

  const managerSignup = async (email: string, password: string, displayName: string) => {
    const result = await createUserWithEmailAndPassword(auth, email, password);

    // Create manager document
    const managerDocRef = doc(db, 'managers', result.user.uid);
    const newManagerData: ManagerData = {
      uid: result.user.uid,
      email,
      displayName,
      role: 'manager',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    await setDoc(managerDocRef, newManagerData);
    setManagerUser(result.user);
    setManagerData(newManagerData);
  };

  const managerLogout = async () => {
    try {
      console.log('=== MANAGER LOGOUT ATTEMPT ===');
      
      // Clear manager state immediately
      setManagerUser(null);
      setManagerData(null);
      
      // Clear any localStorage that might persist auth state
      if (typeof window !== 'undefined') {
        localStorage.removeItem('user');
        localStorage.removeItem('managerUser');
        localStorage.clear(); // Clear all localStorage to ensure no auth persistence
      }
      
      // Sign out from Firebase
      await signOut(auth);
      console.log('Manager logout successful');
    } catch (error: any) {
      console.error('=== MANAGER LOGOUT ERROR ===');
      console.error('Error:', error.message);
      throw error;
    }
  };

  const value = {
    managerUser,
    managerData,
    loading,
    managerLogin,
    managerSignup,
    managerLogout,
    isManager: !!managerUser && !!managerData,
  };

  return (
    <ManagerContext.Provider value={value}>{children}</ManagerContext.Provider>
  );
};

export const useManager = () => {
  const context = useContext(ManagerContext);
  if (!context) {
    throw new Error('useManager must be used within ManagerProvider');
  }
  return context;
};
