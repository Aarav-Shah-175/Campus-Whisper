'use client';

import React from "react"

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { createReport, ReportType, ReportableType } from '@/lib/report-service';
import { useFirebase } from '@/lib/firebase-context';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { X } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';

interface ReportModalProps {
  contentId: string;
  contentType: ReportableType;
  reportedUserId?: string;
  reportedUserIsAnonymous?: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

const REPORT_REASONS: { value: ReportType; label: string }[] = [
  { value: 'spam', label: 'Spam' },
  { value: 'inappropriate', label: 'Inappropriate Content' },
  { value: 'harassment', label: 'Harassment' },
  { value: 'misinformation', label: 'Misinformation' },
  { value: 'other', label: 'Other' },
];

export function ReportModal({
  contentId,
  contentType,
  reportedUserId,
  reportedUserIsAnonymous,
  onClose,
  onSuccess,
}: ReportModalProps) {
  const { user } = useFirebase();
  const [reason, setReason] = useState<ReportType>('spam');
  const [description, setDescription] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !isLoading) {
        onClose();
      }
    };

    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleEscape);

    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleEscape);
    };
  }, [isLoading, onClose]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      setError('You must be signed in to report content');
      return;
    }

    if (!reportedUserId?.trim()) {
      setError('This content cannot be reported because the author information is missing.');
      return;
    }

    if (user.uid === reportedUserId) {
      setError('You cannot report your own content');
      return;
    }

    if (!description.trim()) {
      setError('Please provide a description');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      await createReport(user.uid, {
        reportedContentId: contentId,
        reportedContentType: contentType,
        reportedUserId: reportedUserId.trim(),
        reportedUserIsAnonymous: !!reportedUserIsAnonymous,
        reason,
        description: description.trim(),
      });

      onSuccess?.();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to submit report');
    } finally {
      setIsLoading(false);
    }
  };

  if (!mounted) {
    return null;
  }

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/55 p-4 backdrop-blur-sm"
      onClick={() => {
        if (!isLoading) {
          onClose();
        }
      }}
    >
      <Card
        className="w-full max-w-lg border-border/70 bg-card/95 shadow-2xl shadow-black/25"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="p-6">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">Report Content</h3>
              <p className="text-sm text-muted-foreground">
                Help the moderators understand what happened.
              </p>
            </div>
            <button
              onClick={onClose}
              disabled={isLoading}
              className="rounded-full p-2 transition hover:bg-muted"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="reason" className="mb-2 block text-sm font-medium">
                Report Reason
              </label>
              <select
                id="reason"
                value={reason}
                onChange={(e) => setReason(e.target.value as ReportType)}
                disabled={isLoading}
                className="w-full rounded-2xl border border-border/70 bg-background px-4 py-3 text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              >
                {REPORT_REASONS.map((r) => (
                  <option key={r.value} value={r.value}>
                    {r.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="description" className="mb-2 block text-sm font-medium">
                Description
              </label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Please explain why you're reporting this content..."
                className="min-h-28 resize-none rounded-[1.25rem] border-border/70 bg-background px-4 py-3"
                disabled={isLoading}
              />
              <div className="mt-1 text-xs text-muted-foreground">
                {description.length}/500
              </div>
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}

            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="ghost"
                onClick={onClose}
                disabled={isLoading}
                className="rounded-full"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isLoading || !description.trim()}
                className="rounded-full"
              >
                {isLoading ? 'Submitting...' : 'Submit Report'}
              </Button>
            </div>
          </form>
        </div>
      </Card>
    </div>,
    document.body
  );
}
