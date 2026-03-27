'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useFirebase } from '@/lib/firebase-context';
import { ReportList } from '@/components/admin/report-list';
import { AnalyticsPanel } from '@/components/admin/analytics-panel';
import { AppHeader } from '@/components/app-header';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Shield } from 'lucide-react';

export default function AdminDashboard() {
  const { user, isAdmin, loading } = useFirebase();
  const router = useRouter();
  const [unauthorized, setUnauthorized] = useState(false);

  useEffect(() => {
    if (!loading && (!user || !isAdmin)) {
      setUnauthorized(true);
    }
  }, [user, isAdmin, loading]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse">
          <div className="h-12 bg-muted rounded-lg w-48" />
        </div>
      </div>
    );
  }

  if (unauthorized) {
    return (
      <>
        <AppHeader />
        <main className="min-h-screen bg-background">
          <div className="max-w-4xl mx-auto px-4 py-8">
            <Button
              variant="ghost"
              onClick={() => router.back()}
              className="mb-4"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <div className="p-6 bg-destructive/10 text-destructive rounded-lg">
              <h2 className="text-lg font-semibold mb-2">Access Denied</h2>
              <p>You do not have permission to access the admin dashboard.</p>
            </div>
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      <AppHeader />
      <main className="min-h-screen">
        <div className="mx-auto max-w-5xl px-4 py-8">
          <div className="mb-8">
            <div className="rounded-[2rem] border border-border/70 bg-card/82 p-6 shadow-xl shadow-black/5">
              <div className="mb-2 flex items-center gap-2">
                <Shield className="w-6 h-6 text-primary" />
                <h1 className="text-3xl font-bold">Admin Dashboard</h1>
              </div>
              <p className="text-muted-foreground">
                Review reports, remove harmful content, and keep the forum safe.
              </p>
            </div>
          </div>

          <AnalyticsPanel />

          <Card className="border-border/70 bg-card/86 p-6 shadow-xl shadow-black/5">
            <h2 className="text-xl font-semibold mb-4">Reports</h2>
            <ReportList />
          </Card>
        </div>
      </main>
    </>
  );
}
