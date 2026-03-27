import {
  collection,
  addDoc,
  query,
  where,
  getDocs,
  deleteDoc,
  doc,
  getDoc,
  Timestamp,
  updateDoc,
} from 'firebase/firestore';
import { db } from './firebase';

export type ReportType = 'spam' | 'inappropriate' | 'harassment' | 'misinformation' | 'other';
export type ReportStatus = 'pending' | 'reviewed' | 'resolved' | 'dismissed';
export type ReportableType = 'post' | 'comment';

export interface Report {
  id: string;
  reportedUserId: string;
  reportedUserIsAnonymous?: boolean;
  reportedContentId: string;
  reportedContentType: ReportableType;
  reporterUserId: string;
  reason: ReportType;
  description: string;
  status: ReportStatus;
  adminNotes?: string;
  createdAt: Timestamp;
  resolvedAt?: Timestamp;
}

export interface ReportInput {
  reportedContentId: string;
  reportedContentType: ReportableType;
  reportedUserId: string;
  reportedUserIsAnonymous?: boolean;
  reason: ReportType;
  description: string;
}

export async function createReport(
  reporterUserId: string,
  data: ReportInput
): Promise<string> {
  try {
    if (!data.reportedUserId?.trim()) {
      throw new Error('Missing reported user information');
    }

    // Check if user has already reported this content
    const existingReports = await getDocs(
      query(
        collection(db, 'reports'),
        where('reportedContentId', '==', data.reportedContentId),
        where('reporterUserId', '==', reporterUserId)
      )
    );

    if (existingReports.docs.length > 0) {
      throw new Error('You have already reported this content');
    }

    const docRef = await addDoc(collection(db, 'reports'), {
      ...data,
      reportedUserIsAnonymous: !!data.reportedUserIsAnonymous,
      reporterUserId,
      status: 'pending',
      createdAt: Timestamp.now(),
    });

    return docRef.id;
  } catch (error) {
    const message = error instanceof Error ? error.message : '';
    if (
      message !== 'You have already reported this content' &&
      message !== 'Missing reported user information'
    ) {
      console.error('Error creating report:', error);
    }
    throw error;
  }
}

export async function getReports(
  status?: ReportStatus
): Promise<Report[]> {
  try {
    let q;
    if (status) {
      q = query(
        collection(db, 'reports'),
        where('status', '==', status)
      );
    } else {
      q = query(collection(db, 'reports'));
    }

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs
      .map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }))
      .sort((a, b) => b.createdAt.toMillis() - a.createdAt.toMillis()) as Report[];
  } catch (error) {
    console.error('Error fetching reports:', error);
    throw error;
  }
}

export async function updateReportStatus(
  reportId: string,
  status: ReportStatus,
  adminNotes?: string
): Promise<void> {
  try {
    const reportRef = doc(db, 'reports', reportId);
    await updateDoc(reportRef, {
      status,
      adminNotes,
      resolvedAt: status === 'resolved' || status === 'dismissed' ? Timestamp.now() : null,
    });
  } catch (error) {
    console.error('Error updating report status:', error);
    throw error;
  }
}

export async function deleteReport(reportId: string): Promise<void> {
  try {
    await deleteDoc(doc(db, 'reports', reportId));
  } catch (error) {
    console.error('Error deleting report:', error);
    throw error;
  }
}

export async function getReportsByContent(
  contentId: string,
  contentType: ReportableType
): Promise<Report[]> {
  try {
    const q = query(
      collection(db, 'reports'),
      where('reportedContentId', '==', contentId),
      where('reportedContentType', '==', contentType)
    );

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Report[];
  } catch (error) {
    console.error('Error fetching reports for content:', error);
    throw error;
  }
}
