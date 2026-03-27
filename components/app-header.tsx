'use client';

import { useFirebase } from '@/lib/firebase-context';
import { useRouter } from 'next/navigation';
import { ThemeToggle } from './theme-toggle';
import { Button } from './ui/button';
import Link from 'next/link';
import { MessageSquareText, LogOut, User, LogIn, Shield } from 'lucide-react';
import { useState } from 'react';

export function AppHeader() {
  const { user, isAnonymous, signOutUser } = useFirebase();
  const router = useRouter();
  const [isSigningOut, setIsSigningOut] = useState(false);

  const handleSignOut = async () => {
    setIsSigningOut(true);
    try {
      await signOutUser();
      // Redirect to login page after sign out
      router.push('/login');
    } catch (error) {
      console.error('Sign out error:', error);
      setIsSigningOut(false);
    }
  };

  return (
    <header className="sticky top-0 z-50 border-b border-border/70 bg-background/80 backdrop-blur-xl">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4">
        <Link href="/" className="group flex items-center gap-3 transition-opacity hover:opacity-90">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-primary/20 transition-transform group-hover:-rotate-3">
            <MessageSquareText className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-muted-foreground">
              Campus forum
            </p>
            <h1 className="text-lg font-semibold text-foreground">Campus Whisper</h1>
          </div>
        </Link>
        <div className="flex items-center gap-2 sm:gap-3">
          <ThemeToggle />
          <Link
            href="/admin"
            className="hidden items-center gap-2 rounded-full border border-border/70 bg-card/70 px-3 py-2 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground sm:flex"
          >
            <Shield className="h-3.5 w-3.5" />
            Admin
          </Link>

          {user && (
            <div className="flex items-center gap-2 rounded-full border border-border/70 bg-card/75 px-3 py-1.5">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <User className="w-4 h-4" />
                {isAnonymous ? 'Anonymous' : 'User'}
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSignOut}
                disabled={isSigningOut}
                className="rounded-full text-destructive hover:bg-destructive/10"
              >
                <LogOut className="w-4 h-4" />
              </Button>
            </div>
          )}

          {!user && (
            <Link href="/login">
              <Button variant="outline" size="sm" className="rounded-full bg-card/70">
                <LogIn className="w-4 h-4 mr-1" />
                Sign In
              </Button>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
