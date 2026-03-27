'use client';

import { useEffect, useState } from 'react';
import { Report, getReports, updateReportStatus } from '@/lib/report-service';
import { getPost, adminDeletePost } from '@/lib/post-service';
import { getComment, adminDeleteComment } from '@/lib/comment-service';
import { banUser } from '@/lib/ban-service';
import { useFirebase } from '@/lib/firebase-context';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { formatDistanceToNow } from 'date-fns';

interface EnrichedReport extends Report {
  contentPreview: string;
  contentMissing: boolean;
}

export function ReportList() {
  const { user } = useFirebase();
  const [reports, setReports] = useState<EnrichedReport[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState<'pending' | 'all'>('pending');
  const [error, setError] = useState<string | null>(null);
  const [activeAction, setActiveAction] = useState<string | null>(null);

  const loadReports = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const allReports = await getReports(
        selectedStatus === 'pending' ? 'pending' : undefined
      );
      const enrichedReports = await Promise.all(
        allReports.map(async (report) => {
          if (report.reportedContentType === 'post') {
            const post = await getPost(report.reportedContentId);
            return {
              ...report,
              contentPreview: post?.content || 'This post has already been removed.',
              contentMissing: !post || !!post.isDeleted,
            };
          }

          const comment = await getComment(report.reportedContentId);
          return {
            ...report,
            contentPreview: comment?.content || 'This comment has already been removed.',
            contentMissing: !comment,
          };
        })
      );
      setReports(enrichedReports);
    } catch (err) {
      setError('Failed to load reports');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadReports();
  }, [selectedStatus]);

  const handleStatusUpdate = async (
    reportId: string,
    newStatus: 'reviewed' | 'resolved' | 'dismissed',
    notes: string
  ) => {
    try {
      setActiveAction(reportId);
      await updateReportStatus(reportId, newStatus, notes);
      await loadReports();
    } catch (err) {
      console.error('Error updating report:', err);
      alert('Failed to update report status');
    } finally {
      setActiveAction(null);
    }
  };

  const handleDeleteContent = async (report: EnrichedReport) => {
    const notes = prompt('Add admin notes for this content removal (optional):');
    if (notes === null) return;

    try {
      setActiveAction(`${report.id}-delete`);
      if (report.reportedContentType === 'comment') {
        await adminDeleteComment(report.reportedContentId);
      } else {
        await adminDeletePost(report.reportedContentId);
      }

      const finalNotes = notes.trim()
        ? `Content removed by admin. ${notes.trim()}`
        : 'Content removed by admin.';

      await updateReportStatus(report.id, 'resolved', finalNotes);
      await loadReports();
    } catch (err) {
      console.error('Error deleting reported content:', err);
      alert('Failed to remove reported content');
    } finally {
      setActiveAction(null);
    }
  };

  const handleBanUser = async (report: EnrichedReport) => {
    if (!user) {
      alert('You must be signed in as an admin to ban users.');
      return;
    }

    const reason = prompt(
      'Reason for banning this user. This will block them from using the forum.'
    );
    if (reason === null) return;

    try {
      setActiveAction(`${report.id}-ban`);
      await banUser(report.reportedUserId, {
        reason: reason.trim() || `Banned after ${report.reason} report`,
        bannedBy: user.uid,
        reportId: report.id,
      });

      const finalNotes = reason.trim()
        ? `User banned by admin. ${reason.trim()}`
        : 'User banned by admin.';

      await updateReportStatus(report.id, 'resolved', finalNotes);
      await loadReports();
    } catch (err) {
      console.error('Error banning user:', err);
      alert('Failed to ban user');
    }
  };

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

  if (reports.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">
          {selectedStatus === 'pending' ? 'No pending reports' : 'No reports found'}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="mb-6 flex flex-wrap gap-2">
        <Button
          variant={selectedStatus === 'pending' ? 'default' : 'outline'}
          className="rounded-full"
          onClick={() => setSelectedStatus('pending')}
        >
          Pending
        </Button>
        <Button
          variant={selectedStatus === 'all' ? 'default' : 'outline'}
          className="rounded-full"
          onClick={() => setSelectedStatus('all')}
        >
          All Reports
        </Button>
      </div>

      {reports.map((report) => (
        <Card key={report.id} className="border-border/70 bg-background/60 p-5 shadow-lg shadow-black/5">
          <div className="space-y-3">
            <div className="flex justify-between items-start">
              <div>
                <p className="font-medium">
                  {report.reportedContentType === 'post' ? 'Post' : 'Comment'} Report
                </p>
                <p className="text-sm text-muted-foreground">
                  {formatDistanceToNow(report.createdAt?.toDate?.() || new Date(), {
                    addSuffix: true,
                  })}
                </p>
              </div>
              <span
                className={`px-2 py-1 text-xs font-medium rounded ${
                  report.status === 'pending'
                    ? 'bg-yellow-500/20 text-yellow-700'
                    : report.status === 'resolved'
                      ? 'bg-green-500/20 text-green-700'
                      : 'bg-gray-500/20 text-gray-700'
                }`}
              >
                {report.status}
              </span>
            </div>

            <div>
              <p className="text-sm font-medium mb-1">Reason: {report.reason}</p>
              <p className="rounded-2xl bg-muted/80 p-3 text-sm text-foreground">
                {report.description}
              </p>
            </div>

            <div className="grid gap-2 rounded-2xl border border-border/60 bg-card/65 p-4 text-sm text-muted-foreground">
              <p>Reporter UID: <span className="font-mono text-foreground">{report.reporterUserId}</span></p>
              <p>Reported User UID: <span className="font-mono text-foreground">{report.reportedUserId}</span></p>
              <p>Author Type: <span className="text-foreground">{report.reportedUserIsAnonymous ? 'Anonymous' : 'Identified account'}</span></p>
              <p>Reported {report.reportedContentType} ID: <span className="font-mono text-foreground">{report.reportedContentId}</span></p>
            </div>

            <div>
              <p className="text-sm font-medium mb-1">
                Reported {report.reportedContentType === 'post' ? 'Post' : 'Comment'}
              </p>
              <p className="rounded-2xl bg-muted/80 p-3 text-sm text-foreground whitespace-pre-wrap break-words">
                {report.contentPreview}
              </p>
              {report.contentMissing && (
                <p className="text-xs text-muted-foreground mt-2">
                  The reported content is already unavailable in the forum.
                </p>
              )}
            </div>

            {report.adminNotes && (
              <div>
                <p className="text-sm font-medium mb-1">Admin Notes:</p>
                <p className="text-sm text-muted-foreground">{report.adminNotes}</p>
              </div>
            )}

            {report.status === 'pending' && (
              <div className="flex flex-wrap gap-2 pt-2">
                <Button
                  size="sm"
                  disabled={activeAction !== null}
                  className="rounded-full bg-green-600 hover:bg-green-700"
                  onClick={() => {
                    const notes = prompt('Add admin notes (optional):');
                    if (notes !== null) {
                      handleStatusUpdate(report.id, 'resolved', notes || '');
                    }
                  }}
                >
                  Resolve
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  disabled={activeAction !== null}
                  className="rounded-full"
                  onClick={() => {
                    const notes = prompt('Add admin notes (optional):');
                    if (notes !== null) {
                      handleStatusUpdate(report.id, 'dismissed', notes || '');
                    }
                  }}
                >
                  Dismiss
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  disabled={activeAction !== null || report.contentMissing}
                  className="rounded-full"
                  onClick={() => handleDeleteContent(report)}
                >
                  Delete {report.reportedContentType}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={activeAction !== null || report.reportedUserIsAnonymous}
                  className="rounded-full"
                  onClick={() => handleBanUser(report)}
                >
                  Ban User
                </Button>
              </div>
            )}

            {report.status === 'pending' && report.reportedUserIsAnonymous && (
              <p className="text-xs text-muted-foreground">
                Anonymous authors can only be moderated by removing the reported content.
              </p>
            )}
          </div>
        </Card>
      ))}
    </div>
  );
}
