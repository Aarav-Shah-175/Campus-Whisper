import {
  doc,
  getDoc,
  runTransaction,
  Timestamp,
} from 'firebase/firestore';
import { db } from './firebase';

export type VoteType = 'upvote' | 'downvote';

export async function voteOnPost(
  postId: string,
  userId: string,
  voteType: VoteType
): Promise<void> {
  try {
    const voteId = `${postId}_${userId}`;
    const voteRef = doc(db, 'postVotes', voteId);
    const postRef = doc(db, 'posts', postId);

    await runTransaction(db, async (transaction) => {
      const [postSnapshot, voteSnapshot] = await Promise.all([
        transaction.get(postRef),
        transaction.get(voteRef),
      ]);

      if (!postSnapshot.exists()) {
        throw new Error('Post not found');
      }

      const postData = postSnapshot.data();
      let upvotes = Number(postData.upvotes) || 0;
      let downvotes = Number(postData.downvotes) || 0;
      const oldVote = voteSnapshot.exists()
        ? (voteSnapshot.data().type as VoteType)
        : null;

      if (oldVote === voteType) {
        if (voteType === 'upvote') {
          upvotes = Math.max(0, upvotes - 1);
        } else {
          downvotes = Math.max(0, downvotes - 1);
        }

        transaction.delete(voteRef);
      } else {
        if (oldVote === 'upvote') {
          upvotes = Math.max(0, upvotes - 1);
        } else if (oldVote === 'downvote') {
          downvotes = Math.max(0, downvotes - 1);
        }

        if (voteType === 'upvote') {
          upvotes += 1;
        } else {
          downvotes += 1;
        }

        transaction.set(voteRef, {
          type: voteType,
          postId,
          userId,
          updatedAt: Timestamp.now(),
        });
      }

      transaction.update(postRef, {
        upvotes,
        downvotes,
        updatedAt: Timestamp.now(),
      });
    });
  } catch (error) {
    console.error('Error voting on post:', error);
    throw error;
  }
}

export async function getUserVote(
  postId: string,
  userId: string
): Promise<VoteType | null> {
  try {
    const voteId = `${postId}_${userId}`;
    const voteRef = doc(db, 'postVotes', voteId);
    const voteDoc = await getDoc(voteRef);

    if (voteDoc.exists()) {
      return voteDoc.data().type;
    }
    return null;
  } catch (error) {
    console.error('Error fetching user vote:', error);
    throw error;
  }
}
