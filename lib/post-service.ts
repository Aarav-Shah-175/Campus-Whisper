import {
  collection,
  addDoc,
  onSnapshot,
  getDocs,
  getDoc,
  doc,
  updateDoc,
  increment,
  Timestamp,
  QuerySnapshot,
  DocumentData,
  Unsubscribe,
} from 'firebase/firestore';
import { db } from './firebase';

export interface Post {
  id: string;
  userId: string;
  authorIsAnonymous?: boolean;
  content: string;
  postType?: 'text' | 'poll';
  category: string;
  upvotes: number;
  downvotes: number;
  commentCount: number;
  pollOptions?: PollOption[];
  createdAt: Timestamp;
  updatedAt: Timestamp;
  isDeleted?: boolean;
}

export interface PollOption {
  id: string;
  text: string;
  voteCount: number;
}

export interface PostInput {
  content: string;
  category: string;
  authorIsAnonymous?: boolean;
  postType?: 'text' | 'poll';
  pollOptions?: PollOption[];
}

export async function createPost(userId: string, data: PostInput): Promise<string> {
  try {
    const docRef = await addDoc(collection(db, 'posts'), {
      userId,
      authorIsAnonymous: !!data.authorIsAnonymous,
      content: data.content,
      postType: data.postType || 'text',
      category: data.category,
      upvotes: 0,
      downvotes: 0,
      commentCount: 0,
      pollOptions: data.pollOptions || [],
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });
    return docRef.id;
  } catch (error) {
    console.error('Error creating post:', error);
    throw error;
  }
}

export async function getPosts(pageLimit: number = 20): Promise<Post[]> {
  try {
    const querySnapshot = await getDocs(collection(db, 'posts'));
    return mapPostsSnapshot(querySnapshot).slice(0, pageLimit);
  } catch (error) {
    console.error('Error fetching posts:', error);
    throw error;
  }
}

export async function getPostsByCategory(
  category: string,
  pageLimit: number = 20
): Promise<Post[]> {
  try {
    const allPosts = await getPosts(pageLimit * 5);
    return allPosts.filter((post) => post.category === category).slice(0, pageLimit);
  } catch (error) {
    console.error('Error fetching posts by category:', error);
    throw error;
  }
}

export async function getPost(postId: string): Promise<Post | null> {
  try {
    const docRef = doc(db, 'posts', postId);
    const docSnapshot = await getDoc(docRef);
    if (docSnapshot.exists()) {
      const post = {
        id: docSnapshot.id,
        ...docSnapshot.data(),
      } as Post;

      return post.isDeleted ? null : post;
    }
    return null;
  } catch (error) {
    console.error('Error fetching post:', error);
    throw error;
  }
}

export async function deletePost(postId: string, userId: string): Promise<void> {
  try {
    const postRef = doc(db, 'posts', postId);
    const postDoc = await getDoc(postRef);

    if (!postDoc.exists()) {
      throw new Error('Post not found');
    }

    const postData = postDoc.data();
    if (postData.userId !== userId) {
      throw new Error('Unauthorized');
    }

    await updateDoc(postRef, {
      isDeleted: true,
      updatedAt: Timestamp.now(),
    });
  } catch (error) {
    console.error('Error deleting post:', error);
    throw error;
  }
}

export async function adminDeletePost(postId: string): Promise<void> {
  try {
    const postRef = doc(db, 'posts', postId);
    await updateDoc(postRef, {
      isDeleted: true,
      updatedAt: Timestamp.now(),
    });
  } catch (error) {
    console.error('Error admin deleting post:', error);
    throw error;
  }
}

function mapPostsSnapshot(snapshot: QuerySnapshot<DocumentData>): Post[] {
  return snapshot.docs
    .map((snapshotDoc) => ({
      id: snapshotDoc.id,
      ...snapshotDoc.data(),
    }) as Post)
    .filter((post) => !post.isDeleted)
    .sort((a, b) => b.createdAt.toMillis() - a.createdAt.toMillis());
}

export function subscribeToPosts(
  onPosts: (posts: Post[]) => void,
  onError?: (error: Error) => void
): Unsubscribe {
  return onSnapshot(
    collection(db, 'posts'),
    (snapshot) => {
      onPosts(mapPostsSnapshot(snapshot));
    },
    (error) => {
      console.error('Error subscribing to posts:', error);
      onError?.(error);
    }
  );
}

export function subscribeToPost(
  postId: string,
  onPost: (post: Post | null) => void,
  onError?: (error: Error) => void
): Unsubscribe {
  return onSnapshot(
    doc(db, 'posts', postId),
    (snapshot) => {
      if (!snapshot.exists()) {
        onPost(null);
        return;
      }

      const post = {
        id: snapshot.id,
        ...snapshot.data(),
      } as Post;

      onPost(post.isDeleted ? null : post);
    },
    (error) => {
      console.error('Error subscribing to post:', error);
      onError?.(error);
    }
  );
}
