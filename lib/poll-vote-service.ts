import {
  collection,
  doc,
  getDoc,
  runTransaction,
  setDoc,
} from 'firebase/firestore';
import { db } from './firebase';
import { PollOption } from './post-service';

export async function voteOnPoll(
  postId: string,
  userId: string,
  optionId: string
): Promise<void> {
  const voteRef = doc(db, 'pollVotes', `${postId}_${userId}`);
  const postRef = doc(db, 'posts', postId);

  await runTransaction(db, async (transaction) => {
    const [postSnapshot, voteSnapshot] = await Promise.all([
      transaction.get(postRef),
      transaction.get(voteRef),
    ]);

    if (!postSnapshot.exists()) {
      throw new Error('Poll post not found');
    }

    const postData = postSnapshot.data();
    const options = Array.isArray(postData.pollOptions)
      ? [...(postData.pollOptions as PollOption[])]
      : [];

    const nextOptions = options.map((option) => ({ ...option }));
    const newOption = nextOptions.find((option) => option.id === optionId);

    if (!newOption) {
      throw new Error('Poll option not found');
    }

    const previousOptionId = voteSnapshot.exists()
      ? String(voteSnapshot.data().optionId)
      : null;

    if (previousOptionId === optionId) {
      return;
    }

    if (previousOptionId) {
      const previousOption = nextOptions.find((option) => option.id === previousOptionId);
      if (previousOption) {
        previousOption.voteCount = Math.max(0, (previousOption.voteCount || 0) - 1);
      }
    }

    newOption.voteCount = (newOption.voteCount || 0) + 1;

    transaction.update(postRef, {
      pollOptions: nextOptions,
    });

    transaction.set(voteRef, {
      postId,
      userId,
      optionId,
    });
  });
}

export async function getUserPollVote(
  postId: string,
  userId: string
): Promise<string | null> {
  const voteRef = doc(db, 'pollVotes', `${postId}_${userId}`);
  const voteSnapshot = await getDoc(voteRef);

  if (!voteSnapshot.exists()) {
    return null;
  }

  return String(voteSnapshot.data().optionId);
}
