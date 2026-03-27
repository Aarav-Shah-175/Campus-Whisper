'use client';

import React from "react"

import { useState } from 'react';
import { createComment } from '@/lib/comment-service';
import { useFirebase } from '@/lib/firebase-context';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';

interface CommentFormProps {
  postId: string;
  parentCommentId?: string;
  onCommentAdded?: () => void;
  isReply?: boolean;
  onCancel?: () => void;
}

export function CommentForm({
  postId,
  parentCommentId,
  onCommentAdded,
  isReply,
  onCancel,
}: CommentFormProps) {
  const { user, isAnonymous } = useFirebase();
  const [content, setContent] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      setError('You must be signed in to comment');
      return;
    }

    if (!content.trim()) {
      setError('Comment cannot be empty');
      return;
    }

    if (content.length > 500) {
      setError('Comment cannot exceed 500 characters');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      await createComment(user.uid, {
        postId,
        content: content.trim(),
        parentCommentId,
        authorIsAnonymous: isAnonymous,
      });
      setContent('');
      onCommentAdded?.();
    } catch (err) {
      setError('Failed to post comment. Please try again.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className={`border-border/70 p-4 shadow-lg shadow-black/5 ${isReply ? 'bg-muted/45' : 'bg-card/80'}`}>
      <form onSubmit={handleSubmit} className="space-y-3">
        <Textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder={isReply ? 'Write a reply...' : 'Share your thoughts...'}
          className="min-h-24 resize-none rounded-[1.25rem] border-border/70 bg-background px-4 py-3 shadow-sm"
          disabled={isLoading}
        />

        <div className="flex justify-between items-start">
          <div className="text-xs text-muted-foreground">
            {isReply ? 'Replies stay nested in the thread.' : 'Comments help shape the conversation.'} {content.length}/500
          </div>

          <div className="flex gap-2">
            {isReply && onCancel && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={onCancel}
                disabled={isLoading}
                className="rounded-full"
              >
                Cancel
              </Button>
            )}
            <Button
              type="submit"
              disabled={isLoading || !content.trim()}
              size="sm"
              className="rounded-full px-4"
            >
              {isLoading ? 'Posting...' : isReply ? 'Reply' : 'Comment'}
            </Button>
          </div>
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}
      </form>
    </Card>
  );
}
