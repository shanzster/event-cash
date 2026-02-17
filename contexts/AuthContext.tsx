'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  User,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
  sendPasswordResetEmail,
} from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';

interface UserData {
  uid: string;
  email: string;
  displayName: string;
  phoneNumber?: string;
  userRole: 'customer' | 'admin';
  createdAt: any;
  updatedAt: any;
}

interface AuthContextType {
  user: User | null;
  userData: UserData | null;
  loading: boolean;
  signup: (email: string, password: string, displayName: string, phoneNumber?: string) => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  // Check if we're in CMS preview mode (inside an iframe with cms=true parameter)
  const isCMSPreview = typeof window !== 'undefined' && 
                       window.location.search.includes('cms=true') &&
                       window.self !== window.top; // Only disable auth if inside an iframe
  
  // Don't restore from localStorage on mount - let onAuthStateChanged handle it
  const [user, setUser] = useState<User | null>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // If in CMS preview mode (inside iframe), don't set up auth listener
    if (isCMSPreview) {
      console.log('🔥 AUTH PROVIDER: CMS preview mode (iframe) - skipping auth');
      setUser(null);
      setUserData(null);
      setLoading(false);
      return;
    }
    
    if (process.env.NODE_ENV === 'development') {
      console.log('🔥 AUTH PROVIDER: Setting up auth listener');
    }
    let isSubscribed = true;
    
    // Set up the listener immediately
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (!isSubscribed) {
        return;
      }
      
      if (firebaseUser) {
        // Store in localStorage for Fast Refresh persistence
        if (typeof window !== 'undefined') {
          const userData = {
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            displayName: firebaseUser.displayName,
          };
          localStorage.setItem('user', JSON.stringify(userData));
        }
        
        setUser(firebaseUser);
        
        try {
          // Only fetch user data if not already set (optimization for signup flow)
          if (!userData) {
            const userDocRef = doc(db, 'users', firebaseUser.uid);
            const userDocSnap = await getDoc(userDocRef);
            
            if (userDocSnap.exists()) {
              setUserData(userDocSnap.data() as UserData);
            } else {
              setUserData(null);
            }
          }
        } catch (error) {
          if (process.env.NODE_ENV === 'development') {
            console.error('Error fetching user data:', error);
          }
          setUserData(null);
        }
        
        if (isSubscribed) {
          setLoading(false);
        }
      } else {
        // User is logged out - clear everything
        if (typeof window !== 'undefined') {
          localStorage.removeItem('user');
        }
        
        setUser(null);
        setUserData(null);
        
        if (isSubscribed) {
          setLoading(false);
        }
      }
    });

    return () => {
      isSubscribed = false;
      unsubscribe();
    };
  }, [isCMSPreview]);

  const signup = async (email: string, password: string, displayName: string, phoneNumber?: string) => {
    try {
      if (process.env.NODE_ENV === 'development') {
        console.log('=== SIGNUP ATTEMPT ===');
        console.log('Email:', email);
      }
      
      // Check if auth is properly initialized
      if (!auth || !auth.app) {
        throw new Error('Firebase Auth is not properly initialized');
      }
      
      // Create user with email and password
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      
      if (userCredential.user) {
        // Prepare user data for Firestore
        const newUserData: UserData = {
          uid: userCredential.user.uid,
          email: email,
          displayName: displayName,
          phoneNumber: phoneNumber || '',
          userRole: 'customer',
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        };
        
        // Parallelize profile update and Firestore document creation
        const userDocRef = doc(db, 'users', userCredential.user.uid);
        
        await Promise.all([
          updateProfile(userCredential.user, { displayName: displayName }),
          setDoc(userDocRef, newUserData),
        ]);
        
        // Optimistically set user data in state immediately
        // This prevents the need for a Firestore fetch in onAuthStateChanged
        setUserData(newUserData);
        setUser(userCredential.user);
        
        if (process.env.NODE_ENV === 'development') {
          console.log('✅ User created successfully:', userCredential.user.uid);
        }
      }
    } catch (error: any) {
      if (process.env.NODE_ENV === 'development') {
        console.error('=== SIGNUP ERROR ===');
        console.error('Error code:', error.code);
        console.error('Error message:', error.message);
      }
      
      // Add more specific error for configuration issues
      if (error.code === 'auth/configuration-not-found') {
        console.error('CONFIGURATION ERROR: Email/Password authentication is not properly enabled in Firebase Console');
        console.error('Please check: https://console.firebase.google.com/project/eventcash-74a3a/authentication/providers');
      }
      
      throw error;
    }
  };

  const login = async (email: string, password: string) => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      
      // Store user info in localStorage
      if (userCredential.user) {
        const userData = {
          uid: userCredential.user.uid,
          email: userCredential.user.email,
          displayName: userCredential.user.displayName,
        };
        localStorage.setItem('user', JSON.stringify(userData));
      }
      
      // The onAuthStateChanged listener will handle fetching the full user data
      if (process.env.NODE_ENV === 'development') {
        console.log('Login successful:', userCredential.user.uid);
      }
    } catch (error: any) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Login error:', error.code, error.message);
      }
      throw error;
    }
  };

  const logout = async () => {
    try {
      console.log('=== LOGOUT ATTEMPT ===');
      
      // Clear ALL localStorage to prevent any auto-login
      if (typeof window !== 'undefined') {
        localStorage.removeItem('user');
        localStorage.removeItem('managerUser');
        localStorage.clear();
      }
      
      // Clear state immediately
      setUser(null);
      setUserData(null);
      
      // Sign out from Firebase
      await signOut(auth);
      console.log('Logout successful');
    } catch (error: any) {
      console.error('=== LOGOUT ERROR ===');
      console.error('Error:', error.message);
      throw error;
    }
  };

  const resetPassword = async (email: string) => {
    await sendPasswordResetEmail(auth, email);
  };

  const value = {
    user,
    userData,
    loading,
    signup,
    login,
    logout,
    resetPassword,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
