'use client';

import React from "react"

import { useState } from 'react';
import { createPost } from '@/lib/post-service';
import { useFirebase } from '@/lib/firebase-context';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { BarChart3, PenSquare, Plus, X } from 'lucide-react';

const CATEGORIES = ['General', 'Academics', 'Social', 'Housing', 'Food', 'Events', 'Help'];
const MAX_POLL_OPTIONS = 4;
const MIN_POLL_OPTIONS = 2;

interface CreatePostFormProps {
  onPostCreated?: () => void;
}

function createPollOptionId(index: number) {
  return `option_${index + 1}`;
}

export function CreatePostForm({ onPostCreated }: CreatePostFormProps) {
  const { user, isAnonymous } = useFirebase();
  const [postType, setPostType] = useState<'text' | 'poll'>('text');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('General');
  const [pollOptions, setPollOptions] = useState(['', '']);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handlePollOptionChange = (index: number, value: string) => {
    setPollOptions((currentOptions) =>
      currentOptions.map((option, optionIndex) =>
        optionIndex === index ? value : option
      )
    );
  };

  const addPollOption = () => {
    setPollOptions((currentOptions) =>
      currentOptions.length >= MAX_POLL_OPTIONS
        ? currentOptions
        : [...currentOptions, '']
    );
  };

  const removePollOption = (index: number) => {
    setPollOptions((currentOptions) =>
      currentOptions.length <= MIN_POLL_OPTIONS
        ? currentOptions
        : currentOptions.filter((_, optionIndex) => optionIndex !== index)
    );
  };

  const resetForm = () => {
    setContent('');
    setCategory('General');
    setPollOptions(['', '']);
    setPostType('text');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      setError('You must be signed in to post');
      return;
    }

    if (!content.trim()) {
      setError(postType === 'poll' ? 'Poll question is required' : 'Post content is required');
      return;
    }

    if (content.length > 1000) {
      setError('Post content cannot exceed 1000 characters');
      return;
    }

    const trimmedPollOptions = pollOptions.map((option) => option.trim()).filter(Boolean);

    if (postType === 'poll') {
      if (trimmedPollOptions.length < MIN_POLL_OPTIONS) {
        setError('Polls need at least 2 answer options');
        return;
      }

      const uniqueOptions = new Set(trimmedPollOptions.map((option) => option.toLowerCase()));
      if (uniqueOptions.size !== trimmedPollOptions.length) {
        setError('Poll options must be unique');
        return;
      }
    }

    setIsLoading(true);
    setError(null);

    try {
      await createPost(user.uid, {
        content: content.trim(),
        category,
        authorIsAnonymous: isAnonymous,
        postType,
        pollOptions:
          postType === 'poll'
            ? trimmedPollOptions.map((option, index) => ({
                id: createPollOptionId(index),
                text: option,
                voteCount: 0,
              }))
            : [],
      });
      resetForm();
      onPostCreated?.();
    } catch (err) {
      setError('Failed to create post. Please try again.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="mb-6 overflow-hidden border-border/70 bg-card/85 p-0 shadow-xl shadow-primary/5">
      <div className="border-b border-border/60 bg-secondary/30 px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
            {postType === 'poll' ? <BarChart3 className="h-4 w-4" /> : <PenSquare className="h-4 w-4" />}
          </div>
          <div>
            <h3 className="text-lg font-semibold">
              {postType === 'poll' ? 'Create an anonymous poll' : 'Start a new whisper'}
            </h3>
            <p className="text-sm text-muted-foreground">
              {postType === 'poll'
                ? 'Ask the campus a question and collect votes anonymously.'
                : 'Keep it respectful, specific, and helpful for your campus community.'}
            </p>
          </div>
        </div>
      </div>
      <form onSubmit={handleSubmit} className="space-y-5 p-6">
        <div className="grid gap-4 sm:grid-cols-[180px_1fr] sm:items-start">
          <label className="pt-2 text-sm font-medium text-muted-foreground">
            Format
          </label>
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant={postType === 'text' ? 'default' : 'outline'}
              className="rounded-full"
              onClick={() => setPostType('text')}
            >
              Whisper
            </Button>
            <Button
              type="button"
              variant={postType === 'poll' ? 'default' : 'outline'}
              className="rounded-full"
              onClick={() => setPostType('poll')}
            >
              Poll
            </Button>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-[180px_1fr] sm:items-start">
          <label htmlFor="category" className="pt-2 text-sm font-medium text-muted-foreground">
            Category
          </label>
          <select
            id="category"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full rounded-2xl border border-border/70 bg-background px-4 py-3 text-foreground shadow-sm transition focus:outline-none focus:ring-2 focus:ring-primary"
          >
            {CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>

        <div className="grid gap-4 sm:grid-cols-[180px_1fr] sm:items-start">
          <label htmlFor="content" className="pt-2 text-sm font-medium text-muted-foreground">
            {postType === 'poll' ? 'Poll question' : 'Your post'}
          </label>
          <div>
            <Textarea
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder={
                postType === 'poll'
                  ? 'Ask something the campus can vote on...'
                  : 'Share a question, confession, observation, or heads-up for the community...'
              }
              className="min-h-32 resize-none rounded-[1.4rem] border-border/70 bg-background px-4 py-3 shadow-sm"
              disabled={isLoading}
            />
            <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
              <span>Posts are anonymous to the community.</span>
              <span>{content.length}/1000</span>
            </div>
          </div>
        </div>

        {postType === 'poll' && (
          <div className="grid gap-4 sm:grid-cols-[180px_1fr] sm:items-start">
            <label className="pt-2 text-sm font-medium text-muted-foreground">
              Poll options
            </label>
            <div className="space-y-3">
              {pollOptions.map((option, index) => (
                <div key={`${index}-${pollOptions.length}`} className="flex items-center gap-2">
                  <input
                    value={option}
                    onChange={(e) => handlePollOptionChange(index, e.target.value)}
                    placeholder={`Option ${index + 1}`}
                    disabled={isLoading}
                    className="w-full rounded-2xl border border-border/70 bg-background px-4 py-3 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="rounded-full"
                    disabled={isLoading || pollOptions.length <= MIN_POLL_OPTIONS}
                    onClick={() => removePollOption(index)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                className="rounded-full"
                disabled={isLoading || pollOptions.length >= MAX_POLL_OPTIONS}
                onClick={addPollOption}
              >
                <Plus className="mr-2 h-4 w-4" />
                Add option
              </Button>
            </div>
          </div>
        )}

        {error && <p className="text-sm text-destructive">{error}</p>}

        <Button
          type="submit"
          disabled={isLoading || !content.trim()}
          className="w-full rounded-full py-6 text-sm font-semibold"
        >
          {isLoading ? 'Posting...' : postType === 'poll' ? 'Publish Poll' : 'Post Anonymously'}
        </Button>
      </form>
    </Card>
  );
}
