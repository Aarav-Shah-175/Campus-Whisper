import {
  collection,
  addDoc,
  query,
  where,
  onSnapshot,
  getDocs,
  deleteDoc,
  doc,
  getDoc,
  updateDoc,
  increment,
  Timestamp,
  QuerySnapshot,
  DocumentData,
  Unsubscribe,
} from 'firebase/firestore';
import { db } from './firebase';

export interface Comment {
  id: string;
  postId: string;
  parentCommentId?: string;
  userId: string;
  authorIsAnonymous?: boolean;
  content: string;
  upvotes: number;
  downvotes: number;
  replyCount: number;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  isDeleted?: boolean;
}

export interface CommentInput {
  postId: string;
  content: string;
  parentCommentId?: string;
  authorIsAnonymous?: boolean;
}

export async function createComment(
  userId: string,
  data: CommentInput
): Promise<string> {
  try {
    const docRef = await addDoc(collection(db, 'comments'), {
      postId: data.postId,
      parentCommentId: data.parentCommentId || null,
      userId,
      authorIsAnonymous: !!data.authorIsAnonymous,
      content: data.content,
      upvotes: 0,
      downvotes: 0,
      replyCount: 0,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });

    // Update post comment count
    const postRef = doc(db, 'posts', data.postId);
    await updateDoc(postRef, { commentCount: increment(1) });

    return docRef.id;
  } catch (error) {
    console.error('Error creating comment:', error);
    throw error;
  }
}

export async function getCommentsByPost(postId: string): Promise<Comment[]> {
  try {
    const querySnapshot = await getDocs(
      query(collection(db, 'comments'), where('postId', '==', postId))
    );
    return mapCommentsByPostSnapshot(querySnapshot);
  } catch (error) {
    console.error('Error fetching comments:', error);
    throw error;
  }
}

export async function getReplies(commentId: string): Promise<Comment[]> {
  try {
    const querySnapshot = await getDocs(
      query(collection(db, 'comments'), where('parentCommentId', '==', commentId))
    );
    return mapRepliesSnapshot(querySnapshot);
  } catch (error) {
    console.error('Error fetching replies:', error);
    throw error;
  }
}

export async function getComment(commentId: string): Promise<Comment | null> {
  try {
    const commentRef = doc(db, 'comments', commentId);
    const commentDoc = await getDoc(commentRef);

    if (!commentDoc.exists()) {
      return null;
    }

    return {
      id: commentDoc.id,
      ...commentDoc.data(),
    } as Comment;
  } catch (error) {
    console.error('Error fetching comment:', error);
    throw error;
  }
}

async function getCommentThreadReplies(parentCommentId: string): Promise<Comment[]> {
  const repliesSnapshot = await getDocs(
    query(collection(db, 'comments'), where('parentCommentId', '==', parentCommentId))
  );

  const directReplies = repliesSnapshot.docs.map((replyDoc) => ({
    id: replyDoc.id,
    ...replyDoc.data(),
  })) as Comment[];

  const nestedReplies = await Promise.all(
    directReplies.map((reply) => getCommentThreadReplies(reply.id))
  );

  return [...directReplies, ...nestedReplies.flat()];
}

async function deleteCommentThread(commentId: string): Promise<{ deletedCount: number; postId: string }> {
  const rootComment = await getComment(commentId);

  if (!rootComment) {
    throw new Error('Comment not found');
  }

  const descendantComments = await getCommentThreadReplies(commentId);
  const commentsToDelete = [rootComment, ...descendantComments];

  await Promise.all(
    commentsToDelete.map((comment) => deleteDoc(doc(db, 'comments', comment.id)))
  );

  return {
    deletedCount: commentsToDelete.length,
    postId: rootComment.postId,
  };
}

export async function deleteComment(commentId: string, userId: string): Promise<void> {
  try {
    const commentRef = doc(db, 'comments', commentId);
    const commentDoc = await getDoc(commentRef);

    if (!commentDoc.exists()) {
      throw new Error('Comment not found');
    }

    const commentData = commentDoc.data();
    if (commentData.userId !== userId) {
      throw new Error('Unauthorized');
    }

    const { deletedCount, postId } = await deleteCommentThread(commentId);
    const postRef = doc(db, 'posts', postId);
    await updateDoc(postRef, { commentCount: increment(-deletedCount) });
  } catch (error) {
    console.error('Error deleting comment:', error);
    throw error;
  }
}

export async function adminDeleteComment(commentId: string): Promise<void> {
  try {
    const { deletedCount, postId } = await deleteCommentThread(commentId);
    const postRef = doc(db, 'posts', postId);
    await updateDoc(postRef, { commentCount: increment(-deletedCount) });
  } catch (error) {
    console.error('Error admin deleting comment:', error);
    throw error;
  }
}

function mapCommentsByPostSnapshot(snapshot: QuerySnapshot<DocumentData>): Comment[] {
  return snapshot.docs
    .filter((snapshotDoc) => snapshotDoc.data().parentCommentId === null)
    .map((snapshotDoc) => ({
      id: snapshotDoc.id,
      ...snapshotDoc.data(),
    }) as Comment)
    .sort((a, b) => b.createdAt.toMillis() - a.createdAt.toMillis());
}

function mapRepliesSnapshot(snapshot: QuerySnapshot<DocumentData>): Comment[] {
  return snapshot.docs
    .map((snapshotDoc) => ({
      id: snapshotDoc.id,
      ...snapshotDoc.data(),
    }) as Comment)
    .sort((a, b) => a.createdAt.toMillis() - b.createdAt.toMillis());
}

export function subscribeToCommentsByPost(
  postId: string,
  onComments: (comments: Comment[]) => void,
  onError?: (error: Error) => void
): Unsubscribe {
  return onSnapshot(
    query(collection(db, 'comments'), where('postId', '==', postId)),
    (snapshot) => {
      onComments(mapCommentsByPostSnapshot(snapshot));
    },
    (error) => {
      console.error('Error subscribing to comments:', error);
      onError?.(error);
    }
  );
}

export function subscribeToReplies(
  commentId: string,
  onReplies: (comments: Comment[]) => void,
  onError?: (error: Error) => void
): Unsubscribe {
  return onSnapshot(
    query(collection(db, 'comments'), where('parentCommentId', '==', commentId)),
    (snapshot) => {
      onReplies(mapRepliesSnapshot(snapshot));
    },
    (error) => {
      console.error('Error subscribing to replies:', error);
      onError?.(error);
    }
  );
}
