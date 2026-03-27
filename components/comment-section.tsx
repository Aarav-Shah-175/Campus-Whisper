'use client';

import { useEffect, useState } from 'react';
import { subscribeToCommentsByPost, Comment } from '@/lib/comment-service';
import { CommentItem } from './comment-item';
import { CommentForm } from './comment-form';

interface CommentSectionProps {
  postId: string;
  onCommentAdded?: () => void;
}

export function CommentSection({ postId, onCommentAdded }: CommentSectionProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setIsLoading(true);
    setError(null);

    const unsubscribe = subscribeToCommentsByPost(
      postId,
      (fetchedComments) => {
        setComments(fetchedComments);
        setIsLoading(false);
      },
      () => {
        setError('Failed to load comments');
        setIsLoading(false);
      }
    );

    return unsubscribe;
  }, [postId]);

  const handleCommentAdded = () => {
    onCommentAdded?.();
  };

  const handleTopLevelCommentDeleted = (commentId: string) => {
    setComments((currentComments) =>
      currentComments.filter((comment) => comment.id !== commentId)
    );
    onCommentAdded?.();
  };

  return (
    <div className="mt-10 space-y-6">
      <div>
        <div className="mb-5 flex items-end justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
              Discussion
            </p>
            <h3 className="mt-2 text-2xl font-semibold">Comments</h3>
          </div>
          <div className="rounded-full bg-secondary/45 px-3 py-2 text-xs text-muted-foreground">
            {comments.length} top-level thread{comments.length === 1 ? '' : 's'}
          </div>
        </div>

        <div className="mb-6">
          <CommentForm postId={postId} onCommentAdded={handleCommentAdded} />
        </div>

        {isLoading && (
          <div className="space-y-4">
            {[...Array(2)].map((_, i) => (
              <div key={i} className="h-20 bg-muted rounded-lg animate-pulse" />
            ))}
          </div>
        )}

        {error && (
          <div className="p-4 bg-destructive/10 text-destructive rounded-lg">
            {error}
          </div>
        )}

        {!isLoading && comments.length === 0 && (
          <p className="text-muted-foreground text-center py-8">
            No comments yet. Be the first to comment!
          </p>
        )}

        <div className="space-y-4">
          {comments.map((comment) => (
            <CommentItem
              key={comment.id}
              comment={comment}
              onCommentDeleted={handleTopLevelCommentDeleted}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
