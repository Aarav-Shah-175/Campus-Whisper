'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Post, subscribeToPost } from '@/lib/post-service';
import { PostCard } from '@/components/post-card';
import { CommentSection } from '@/components/comment-section';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

export default function PostDetailPage() {
  const params = useParams();
  const router = useRouter();
  const postId = params.id as string;

  const [post, setPost] = useState<Post | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setIsLoading(true);
    setError(null);

    const unsubscribe = subscribeToPost(
      postId,
      (fetchedPost) => {
        if (fetchedPost) {
          setPost(fetchedPost);
          setError(null);
        } else {
          setPost(null);
          setError('Post not found');
        }
        setIsLoading(false);
      },
      (err) => {
        setError('Failed to load post');
        setIsLoading(false);
        console.error(err);
      }
    );

    return unsubscribe;
  }, [postId]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse">
          <div className="h-12 bg-muted rounded-lg w-48 mb-4" />
          <div className="h-24 bg-muted rounded-lg w-96" />
        </div>
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-3xl mx-auto px-4 py-8">
          <Button
            variant="ghost"
            onClick={() => router.back()}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <div className="p-4 bg-destructive/10 text-destructive rounded-lg">
            {error || 'Post not found'}
          </div>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto px-4 py-8">
        <Button
          variant="ghost"
          onClick={() => router.back()}
          className="mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>

        <PostCard post={post} />
        <CommentSection postId={postId} />
      </div>
    </main>
  );
}
