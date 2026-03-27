import { doc, getDoc, setDoc, Timestamp } from 'firebase/firestore';
import { db } from './firebase';

export interface BanRecord {
  userId: string;
  reason: string;
  bannedBy: string;
  reportId?: string;
  createdAt: Timestamp;
}

interface BanInput {
  reason: string;
  bannedBy: string;
  reportId?: string;
}

export async function banUser(userId: string, data: BanInput): Promise<void> {
  try {
    await setDoc(doc(db, 'bannedUsers', userId), {
      userId,
      reason: data.reason,
      bannedBy: data.bannedBy,
      reportId: data.reportId || null,
      createdAt: Timestamp.now(),
    });
  } catch (error) {
    console.error('Error banning user:', error);
    throw error;
  }
}

export async function getBanRecord(userId: string): Promise<BanRecord | null> {
  try {
    const banDoc = await getDoc(doc(db, 'bannedUsers', userId));

    if (!banDoc.exists()) {
      return null;
    }

    return banDoc.data() as BanRecord;
  } catch (error) {
    console.error('Error fetching ban record:', error);
    throw error;
  }
}
