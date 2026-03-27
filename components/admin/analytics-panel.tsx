'use client';

import { useEffect, useState } from 'react';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Card } from '@/components/ui/card';
import { BarChart3, FileWarning, MessageSquareText, ShieldBan, TrendingUp } from 'lucide-react';

interface AnalyticsState {
  totalPosts: number;
  totalComments: number;
  totalReports: number;
  pendingReports: number;
  totalBannedUsers: number;
  averageCommentsPerPost: number;
  topCategory: string;
  engagementScore: number;
}

const EMPTY_ANALYTICS: AnalyticsState = {
  totalPosts: 0,
  totalComments: 0,
  totalReports: 0,
  pendingReports: 0,
  totalBannedUsers: 0,
  averageCommentsPerPost: 0,
  topCategory: 'N/A',
  engagementScore: 0,
};

export function AnalyticsPanel() {
  const [analytics, setAnalytics] = useState<AnalyticsState>(EMPTY_ANALYTICS);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const state = {
      posts: [] as any[],
      comments: [] as any[],
      reports: [] as any[],
      bannedUsers: [] as any[],
    };

    const recompute = () => {
      const activePosts = state.posts.filter((post) => !post.isDeleted);
      const safeNumber = (value: unknown) =>
        typeof value === 'number' && Number.isFinite(value) ? value : 0;

      const categoryCounts = activePosts.reduce<Record<string, number>>((counts, post) => {
        counts[post.category] = (counts[post.category] || 0) + 1;
        return counts;
      }, {});

      const topCategoryEntry = Object.entries(categoryCounts).sort((a, b) => b[1] - a[1])[0];
      const engagementScore = activePosts.reduce(
        (score, post) =>
          score +
          safeNumber(post.upvotes) +
          safeNumber(post.commentCount) * 2 -
          safeNumber(post.downvotes),
        0
      );

      const totalComments = state.comments.length;
      const totalReports = state.reports.length;
      const pendingReports = state.reports.filter((report) => report.status === 'pending').length;
      const totalBannedUsers = state.bannedUsers.length;
      const averageCommentsPerPost = activePosts.length
        ? Number((totalComments / activePosts.length).toFixed(1))
        : 0;

      setAnalytics({
        totalPosts: activePosts.length,
        totalComments,
        totalReports,
        pendingReports,
        totalBannedUsers,
        averageCommentsPerPost: Number.isFinite(averageCommentsPerPost)
          ? averageCommentsPerPost
          : 0,
        topCategory: topCategoryEntry?.[0] || 'N/A',
        engagementScore: Number.isFinite(engagementScore) ? engagementScore : 0,
      });
      setIsLoading(false);
    };

    const unsubscribePosts = onSnapshot(collection(db, 'posts'), (snapshot) => {
      state.posts = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      recompute();
    });

    const unsubscribeComments = onSnapshot(collection(db, 'comments'), (snapshot) => {
      state.comments = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      recompute();
    });

    const unsubscribeReports = onSnapshot(collection(db, 'reports'), (snapshot) => {
      state.reports = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      recompute();
    });

    const unsubscribeBannedUsers = onSnapshot(collection(db, 'bannedUsers'), (snapshot) => {
      state.bannedUsers = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      recompute();
    });

    return () => {
      unsubscribePosts();
      unsubscribeComments();
      unsubscribeReports();
      unsubscribeBannedUsers();
    };
  }, []);

  const metricCards = [
    {
      label: 'Posts',
      value: analytics.totalPosts,
      hint: `${analytics.averageCommentsPerPost} comments/post`,
      icon: MessageSquareText,
    },
    {
      label: 'Reports',
      value: analytics.totalReports,
      hint: `${analytics.pendingReports} pending`,
      icon: FileWarning,
    },
    {
      label: 'Banned users',
      value: analytics.totalBannedUsers,
      hint: 'App-level moderation',
      icon: ShieldBan,
    },
    {
      label: 'Engagement',
      value: analytics.engagementScore,
      hint: `Top category: ${analytics.topCategory}`,
      icon: TrendingUp,
    },
  ];

  return (
    <section className="mb-8 grid gap-4">
      <div className="flex items-center gap-2">
        <BarChart3 className="h-5 w-5 text-primary" />
        <h2 className="text-xl font-semibold">Forum Analytics</h2>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {metricCards.map((metric) => (
          <Card
            key={metric.label}
            className="border-border/70 bg-card/86 p-5 shadow-lg shadow-black/5"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                  {metric.label}
                </p>
                <p className="mt-3 text-3xl font-semibold">
                  {isLoading ? '...' : metric.value}
                </p>
                <p className="mt-2 text-sm text-muted-foreground">{metric.hint}</p>
              </div>
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-secondary/55 text-primary">
                <metric.icon className="h-5 w-5" />
              </div>
            </div>
          </Card>
        ))}
      </div>
    </section>
  );
}
