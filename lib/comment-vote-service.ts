import {
  collection,
  doc,
  setDoc,
  getDoc,
  deleteDoc,
  updateDoc,
  increment,
} from 'firebase/firestore';
import { db } from './firebase';

export type VoteType = 'upvote' | 'downvote';

export async function voteOnComment(
  commentId: string,
  userId: string,
  voteType: VoteType
): Promise<void> {
  try {
    // Use top-level commentVotes collection for consistent permission handling
    const voteId = `${commentId}_${userId}`;
    const voteRef = doc(db, 'commentVotes', voteId);
    const existingVote = await getDoc(voteRef);

    const commentRef = doc(db, 'comments', commentId);

    if (existingVote.exists()) {
      const oldVote = existingVote.data().type;

      if (oldVote === voteType) {
        // Remove vote
        await deleteDoc(voteRef);
        if (voteType === 'upvote') {
          await updateDoc(commentRef, { upvotes: increment(-1) });
        } else {
          await updateDoc(commentRef, { downvotes: increment(-1) });
        }
      } else {
        // Change vote
        await setDoc(voteRef, { type: voteType, commentId, userId });
        if (oldVote === 'upvote') {
          await updateDoc(commentRef, {
            upvotes: increment(-1),
            downvotes: increment(1),
          });
        } else {
          await updateDoc(commentRef, {
            upvotes: increment(1),
            downvotes: increment(-1),
          });
        }
      }
    } else {
      // New vote
      await setDoc(voteRef, { type: voteType, commentId, userId });
      if (voteType === 'upvote') {
        await updateDoc(commentRef, { upvotes: increment(1) });
      } else {
        await updateDoc(commentRef, { downvotes: increment(1) });
      }
    }
  } catch (error) {
    console.error('Error voting on comment:', error);
    throw error;
  }
}

export async function getUserCommentVote(
  commentId: string,
  userId: string
): Promise<VoteType | null> {
  try {
    const voteId = `${commentId}_${userId}`;
    const voteRef = doc(db, 'commentVotes', voteId);
    const voteDoc = await getDoc(voteRef);

    if (voteDoc.exists()) {
      return voteDoc.data().type;
    }
    return null;
  } catch (error) {
    console.error('Error fetching user comment vote:', error);
    throw error;
  }
}
