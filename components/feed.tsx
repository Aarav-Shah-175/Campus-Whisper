'use client';

import { useEffect, useState } from 'react';
import { Post, subscribeToPosts } from '@/lib/post-service';
import { PostCard } from './post-card';

interface FeedProps {
  category?: string;
  refresh?: boolean;
  searchQuery?: string;
  mode?: 'latest' | 'trending';
}

function matchesSearch(post: Post, searchQuery?: string) {
  if (!searchQuery?.trim()) {
    return true;
  }

  const lowerSearchTerm = searchQuery.toLowerCase();
  return (
    post.content.toLowerCase().includes(lowerSearchTerm) ||
    post.category.toLowerCase().includes(lowerSearchTerm)
  );
}

function sortPosts(posts: Post[], mode: 'latest' | 'trending') {
  if (mode === 'trending') {
    return [...posts].sort((a, b) => {
      const scoreA =
        a.upvotes * 3 - a.downvotes + a.commentCount * 4 +
        Math.max(0, 72 - (Date.now() - a.createdAt.toMillis()) / 36e5);
      const scoreB =
        b.upvotes * 3 - b.downvotes + b.commentCount * 4 +
        Math.max(0, 72 - (Date.now() - b.createdAt.toMillis()) / 36e5);
      return scoreB - scoreA;
    });
  }

  return [...posts].sort((a, b) => b.createdAt.toMillis() - a.createdAt.toMillis());
}

export function Feed({ category, refresh, searchQuery, mode = 'latest' }: FeedProps) {
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setIsLoading(true);
    setError(null);

    const unsubscribe = subscribeToPosts(
      (allPosts) => {
        const filteredPosts = allPosts.filter((post) => {
          if (category && post.category !== category) {
            return false;
          }

          return matchesSearch(post, searchQuery);
        });

        setPosts(sortPosts(filteredPosts, mode).slice(0, 50));
        setIsLoading(false);
      },
      () => {
        setError('Failed to load posts');
        setIsLoading(false);
      }
    );

    return unsubscribe;
  }, [refresh, category, searchQuery, mode]);

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-32 bg-muted rounded-lg animate-pulse" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-destructive/10 text-destructive rounded-lg">
        {error}
      </div>
    );
  }

  if (posts.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">No posts yet. Be the first to share!</p>
      </div>
    );
  }

  return (
    <div>
      {posts.map((post) => (
        <PostCard key={post.id} post={post} />
      ))}
    </div>
  );
}
