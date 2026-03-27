'use client';

import { Post } from '@/lib/post-service';
import { formatDistanceToNow } from 'date-fns';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  MessageCircle,
  ThumbsUp,
  ThumbsDown,
  Flag,
  ArrowUpRight,
  EyeOff,
  BarChart3,
  Check,
} from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { getUserVote, voteOnPost, VoteType } from '@/lib/vote-service';
import { getUserPollVote, voteOnPoll } from '@/lib/poll-vote-service';
import { useFirebase } from '@/lib/firebase-context';
import { ReportModal } from './report-modal';
import { getAnonymousLabel } from '@/lib/anonymous-label';

interface PostCardProps {
  post: Post;
  onVote?: () => void;
}

export function PostCard({ post, onVote }: PostCardProps) {
  const { user } = useFirebase();
  const [userVote, setUserVote] = useState<VoteType | null>(null);
  const [userPollVote, setUserPollVote] = useState<string | null>(null);
  const [isVoting, setIsVoting] = useState(false);
  const [isPollVoting, setIsPollVoting] = useState(false);
  const [upvotes, setUpvotes] = useState(post.upvotes);
  const [downvotes, setDownvotes] = useState(post.downvotes);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportSuccess, setReportSuccess] = useState(false);

  useEffect(() => {
    setUpvotes(post.upvotes);
    setDownvotes(post.downvotes);
  }, [post.upvotes, post.downvotes]);

  useEffect(() => {
    let isMounted = true;

    const loadUserState = async () => {
      if (!user) {
        setUserVote(null);
        setUserPollVote(null);
        return;
      }

      try {
        const [existingVote, existingPollVote] = await Promise.all([
          getUserVote(post.id, user.uid),
          post.postType === 'poll' ? getUserPollVote(post.id, user.uid) : Promise.resolve(null),
        ]);

        if (isMounted) {
          setUserVote(existingVote);
          setUserPollVote(existingPollVote);
        }
      } catch (error) {
        console.error('Error loading user post state:', error);
      }
    };

    loadUserState();

    return () => {
      isMounted = false;
    };
  }, [post.id, post.postType, user]);

  const handleVote = async (voteType: VoteType) => {
    if (!user) return;

    setIsVoting(true);
    try {
      await voteOnPost(post.id, user.uid, voteType);

      if (userVote === voteType) {
        if (voteType === 'upvote') {
          setUpvotes((prev) => prev - 1);
        } else {
          setDownvotes((prev) => prev - 1);
        }
        setUserVote(null);
      } else if (!userVote) {
        if (voteType === 'upvote') {
          setUpvotes((prev) => prev + 1);
        } else {
          setDownvotes((prev) => prev + 1);
        }
        setUserVote(voteType);
      } else {
        if (userVote === 'upvote') {
          setUpvotes((prev) => prev - 1);
          setDownvotes((prev) => prev + 1);
        } else {
          setUpvotes((prev) => prev + 1);
          setDownvotes((prev) => prev - 1);
        }
        setUserVote(voteType);
      }

      onVote?.();
    } catch (error) {
      console.error('Error voting:', error);
    } finally {
      setIsVoting(false);
    }
  };

  const handlePollVote = async (optionId: string) => {
    if (!user || userPollVote === optionId) return;

    setIsPollVoting(true);
    try {
      await voteOnPoll(post.id, user.uid, optionId);
      setUserPollVote(optionId);
      onVote?.();
    } catch (error) {
      console.error('Error voting on poll:', error);
    } finally {
      setIsPollVoting(false);
    }
  };

  const createdAt = post.createdAt?.toDate?.() || new Date();
  const totalPollVotes = (post.pollOptions || []).reduce(
    (totalVotes, option) => totalVotes + (option.voteCount || 0),
    0
  );
  const authorLabel = getAnonymousLabel(post.userId, post.id);

  return (
    <Card className="mb-4 gap-0 overflow-hidden border-border/70 bg-card/85 p-0 shadow-lg shadow-black/5 transition-transform duration-200 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-primary/10">
      <div className="flex items-start justify-between gap-4 border-b border-border/60 px-5 py-4">
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center rounded-full bg-secondary/60 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-secondary-foreground">
              {post.category}
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-muted/70 px-3 py-1 text-xs text-muted-foreground">
              <EyeOff className="h-3.5 w-3.5" />
              {authorLabel}
            </span>
            {post.postType === 'poll' && (
              <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                <BarChart3 className="h-3.5 w-3.5" />
                Poll
              </span>
            )}
          </div>
          <span className="text-xs text-muted-foreground">
            {formatDistanceToNow(createdAt, { addSuffix: true })}
          </span>
        </div>
        <button
          onClick={() => setShowReportModal(true)}
          className="rounded-full border border-border/70 p-2 transition hover:bg-muted"
          title="Report post"
        >
          <Flag className="w-4 h-4 text-muted-foreground" />
        </button>
      </div>

      {reportSuccess && (
        <div className="mb-3 rounded-xl bg-green-500/10 p-2 text-xs text-green-700">
          Thank you for reporting. Our team will review this content.
        </div>
      )}

      <div className="px-5 py-5">
        <p className="mb-5 whitespace-pre-wrap break-words text-[15px] leading-7 text-foreground sm:text-base">
          {post.content}
        </p>

        {post.postType === 'poll' && post.pollOptions && post.pollOptions.length > 0 && (
          <div className="mb-5 space-y-3 rounded-[1.4rem] border border-border/70 bg-background/70 p-4">
            {post.pollOptions.map((option) => {
              const voteCount = option.voteCount || 0;
              const percentage = totalPollVotes > 0 ? Math.round((voteCount / totalPollVotes) * 100) : 0;
              const isSelected = userPollVote === option.id;

              return (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => handlePollVote(option.id)}
                  disabled={isPollVoting}
                  className={`relative w-full overflow-hidden rounded-2xl border px-4 py-3 text-left transition ${
                    isSelected
                      ? 'border-primary bg-primary/10'
                      : 'border-border/70 bg-card hover:bg-muted/60'
                  }`}
                >
                  <span
                    className="absolute inset-y-0 left-0 bg-primary/10 transition-all"
                    style={{ width: `${percentage}%` }}
                  />
                  <span className="relative flex items-center justify-between gap-4">
                    <span className="flex items-center gap-2 text-sm font-medium text-foreground">
                      {isSelected && <Check className="h-4 w-4 text-primary" />}
                      {option.text}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {voteCount} vote{voteCount === 1 ? '' : 's'} - {percentage}%
                    </span>
                  </span>
                </button>
              );
            })}
            <p className="text-xs text-muted-foreground">
              {totalPollVotes} total vote{totalPollVotes === 1 ? '' : 's'}
            </p>
          </div>
        )}

        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant={userVote === 'upvote' ? 'default' : 'outline'}
            size="sm"
            onClick={() => handleVote('upvote')}
            disabled={isVoting}
            className="rounded-full"
          >
            <ThumbsUp className="mr-1 h-4 w-4" />
            {upvotes}
          </Button>

          <Button
            variant={userVote === 'downvote' ? 'destructive' : 'outline'}
            size="sm"
            onClick={() => handleVote('downvote')}
            disabled={isVoting}
            className="rounded-full"
          >
            <ThumbsDown className="mr-1 h-4 w-4" />
            {downvotes}
          </Button>

          <Link href={`/posts/${post.id}`}>
            <Button variant="secondary" size="sm" className="rounded-full">
              <MessageCircle className="mr-1 h-4 w-4" />
              {post.commentCount}
            </Button>
          </Link>
          <Link href={`/posts/${post.id}`} className="ml-auto">
            <Button variant="ghost" size="sm" className="rounded-full">
              Open thread
              <ArrowUpRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </div>

      {showReportModal && (
        <ReportModal
          contentId={post.id}
          contentType="post"
          reportedUserId={post.userId}
          reportedUserIsAnonymous={post.authorIsAnonymous}
          onClose={() => setShowReportModal(false)}
          onSuccess={() => {
            setReportSuccess(true);
            setTimeout(() => setReportSuccess(false), 5000);
          }}
        />
      )}
    </Card>
  );
}
