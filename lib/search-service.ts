import {
  collection,
  query,
  where,
  getDocs,
} from 'firebase/firestore';
import { db } from './firebase';
import { Post } from './post-service';

export async function searchPostsByContent(searchTerm: string): Promise<Post[]> {
  try {
    if (!searchTerm.trim()) {
      return [];
    }

    const lowerSearchTerm = searchTerm.toLowerCase();

    // Fetch all non-deleted posts and filter client-side
    // Firestore doesn't support full-text search without Algolia or similar
    const q = query(
      collection(db, 'posts')
    );

    const querySnapshot = await getDocs(q);
    const allPosts = querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Post[];

    // Filter posts based on content
    return allPosts.filter((post) => {
      if (post.isDeleted) return false;
      const content = post.content.toLowerCase();
      const category = post.category.toLowerCase();
      return content.includes(lowerSearchTerm) || category.includes(lowerSearchTerm);
    });
  } catch (error) {
    console.error('Error searching posts:', error);
    throw error;
  }
}

export async function getPostsByCategory(category: string): Promise<Post[]> {
  try {
    const q = query(
      collection(db, 'posts'),
      where('category', '==', category)
    );

    const querySnapshot = await getDocs(q);
    const posts = querySnapshot.docs.map((snapshotDoc) => ({
      id: snapshotDoc.id,
      ...snapshotDoc.data(),
    })) as Post[];

    return posts
      .filter((post) => !post.isDeleted)
      .sort((a, b) => b.createdAt.toMillis() - a.createdAt.toMillis());
  } catch (error) {
    console.error('Error fetching posts by category:', error);
    throw error;
  }
}

export async function getTrendingPosts(limit: number = 10): Promise<Post[]> {
  try {
    // Fetch recent posts and sort by engagement (upvotes + comments)
    const q = query(
      collection(db, 'posts')
    );

    const querySnapshot = await getDocs(q);
    const allPosts = querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Post[];

    // Sort by engagement score
    const engagement = allPosts
      .filter((post) => !post.isDeleted)
      .map((post) => ({
      ...post,
      engagementScore: post.upvotes + post.commentCount * 2,
    }));

    return engagement
      .sort((a, b) => b.engagementScore - a.engagementScore)
      .slice(0, limit)
      .map(({ engagementScore, ...post }) => post);
  } catch (error) {
    console.error('Error fetching trending posts:', error);
    throw error;
  }
}
