import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from './firebase';
import { format } from 'date-fns';

export interface ClosedDay {
  id: string;
  date: string; // YYYY-MM-DD format
  reason: string;
  createdAt: any;
}

/**
 * Check if a specific date is closed/unavailable
 */
export async function isDateClosed(date: Date | string): Promise<boolean> {
  try {
    const dateStr = typeof date === 'string' ? date : format(date, 'yyyy-MM-dd');
    
    const closedDaysRef = collection(db, 'closedDays');
    const q = query(closedDaysRef, where('date', '==', dateStr));
    const snapshot = await getDocs(q);
    
    return !snapshot.empty;
  } catch (error) {
    console.error('Error checking if date is closed:', error);
    return false;
  }
}

/**
 * Get all closed days
 */
export async function getAllClosedDays(): Promise<ClosedDay[]> {
  try {
    const closedDaysRef = collection(db, 'closedDays');
    const snapshot = await getDocs(closedDaysRef);
    
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as ClosedDay[];
  } catch (error) {
    console.error('Error fetching closed days:', error);
    return [];
  }
}

/**
 * Get closed day information for a specific date
 */
export async function getClosedDayInfo(date: Date | string): Promise<ClosedDay | null> {
  try {
    const dateStr = typeof date === 'string' ? date : format(date, 'yyyy-MM-dd');
    
    const closedDaysRef = collection(db, 'closedDays');
    const q = query(closedDaysRef, where('date', '==', dateStr));
    const snapshot = await getDocs(q);
    
    if (snapshot.empty) return null;
    
    const doc = snapshot.docs[0];
    return {
      id: doc.id,
      ...doc.data()
    } as ClosedDay;
  } catch (error) {
    console.error('Error getting closed day info:', error);
    return null;
  }
}
