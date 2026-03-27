'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useFirebase } from '@/lib/firebase-context';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, ShieldCheck, Sparkles, MessageSquareText } from 'lucide-react';
import Link from 'next/link';

function getAuthErrorMessage(error: unknown) {
  const code = typeof error === 'object' && error !== null && 'code' in error
    ? String((error as { code?: string }).code)
    : '';

  switch (code) {
    case 'auth/operation-not-allowed':
    case 'auth/admin-restricted-operation':
    case 'auth/configuration-not-found':
      return 'Anonymous sign-in is disabled in Firebase. Enable Authentication > Sign-in method > Anonymous in the Firebase console.';
    case 'auth/network-request-failed':
      return 'Sign-in failed because the app could not reach Firebase. Check your internet connection and Firebase config.';
    case 'auth/invalid-api-key':
      return 'The Firebase API key is invalid. Recheck the Firebase environment variables.';
    case 'auth/too-many-requests':
      return 'Firebase temporarily blocked sign-in after too many attempts. Please wait a moment and try again.';
    default:
      return 'Failed to sign in anonymously. Please try again.';
  }
}

function getGoogleAuthErrorMessage(error: unknown) {
  const code = typeof error === 'object' && error !== null && 'code' in error
    ? String((error as { code?: string }).code)
    : '';

  switch (code) {
    case 'auth/cancelled-popup-request':
      return 'A Google sign-in popup is already open. Finish that one or close it, then try again.';
    case 'auth/popup-closed-by-user':
      return 'Google sign-in was canceled before completion.';
    case 'auth/popup-blocked':
      return 'Your browser blocked the Google sign-in popup. Allow popups for this site and try again.';
    case 'auth/network-request-failed':
      return 'Google sign-in failed because the app could not reach Firebase. Check your internet connection and try again.';
    default:
      return 'Failed to sign in with Google. Please try again.';
  }
}

export default function LoginPage() {
  const { user, loading, signInWithGoogle, signInAnonymously, banMessage } = useFirebase();
  const router = useRouter();
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!loading && user) {
    router.push('/');
    return null;
  }

  const handleGoogleSignIn = async () => {
    setIsSigningIn(true);
    setError(null);
    try {
      await signInWithGoogle();
      router.push('/');
    } catch (err) {
      setError(getGoogleAuthErrorMessage(err));
    } finally {
      setIsSigningIn(false);
    }
  };

  const handleAnonymousSignIn = async () => {
    setIsSigningIn(true);
    setError(null);
    try {
      await signInAnonymously();
      router.push('/');
    } catch (err) {
      setError(getAuthErrorMessage(err));
    } finally {
      setIsSigningIn(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span>Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen px-4 py-10">
      <div className="mx-auto grid w-full max-w-6xl gap-8 lg:grid-cols-[1.1fr_0.9fr]">
        <section className="flex flex-col justify-center rounded-[2rem] border border-border/70 bg-card/70 p-8 shadow-xl shadow-primary/5 backdrop-blur sm:p-10">
          <div className="inline-flex w-fit items-center gap-2 rounded-full border border-border/70 bg-background/70 px-3 py-1 text-xs font-medium text-muted-foreground">
            <MessageSquareText className="h-3.5 w-3.5 text-primary" />
            Private campus pulse
          </div>
          <h1 className="mt-6 max-w-xl text-4xl font-semibold tracking-tight sm:text-5xl">
            Enter the student conversation without putting yourself on display.
          </h1>
          <p className="mt-4 max-w-xl text-base leading-7 text-muted-foreground">
            Campus Whisper is built for questions, confessions, warnings, and moments
            that need honesty more than identity.
          </p>
          <div className="mt-8 grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl bg-secondary/45 p-4">
              <ShieldCheck className="h-5 w-5 text-primary" />
              <p className="mt-3 text-sm font-medium">Anonymous by design</p>
            </div>
            <div className="rounded-2xl bg-secondary/45 p-4">
              <Sparkles className="h-5 w-5 text-primary" />
              <p className="mt-3 text-sm font-medium">Fast to join</p>
            </div>
            <div className="rounded-2xl bg-secondary/45 p-4">
              <MessageSquareText className="h-5 w-5 text-primary" />
              <p className="mt-3 text-sm font-medium">Made for campus life</p>
            </div>
          </div>
        </section>

        <Card className="space-y-6 border-border/70 bg-card/88 p-8 shadow-2xl shadow-black/10">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">
              Sign in
            </p>
            <h2 className="mt-2 text-3xl font-semibold">Join Campus Whisper</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Use Google or enter anonymously. Both let you read, post, comment, and report.
            </p>
          </div>

          {error && (
            <div className="rounded-2xl bg-destructive/10 p-4 text-sm text-destructive">
              {error}
            </div>
          )}

          {!error && banMessage && (
            <div className="rounded-2xl bg-destructive/10 p-4 text-sm text-destructive">
              Your account has been banned from Campus Whisper. Reason: {banMessage}
            </div>
          )}

          <div>
            <Button
              onClick={handleGoogleSignIn}
              disabled={isSigningIn}
              className="w-full rounded-full border border-border/70 bg-white py-6 text-black hover:bg-gray-100"
              variant="outline"
            >
              {isSigningIn ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Signing in...
                </>
              ) : (
                <>
                  <svg
                    className="w-5 h-5 mr-2"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                  >
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                  </svg>
                  Continue with Google
                </>
              )}
            </Button>
          </div>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="bg-card px-2 text-muted-foreground">or</span>
            </div>
          </div>

          <div>
            <Button
              onClick={handleAnonymousSignIn}
              disabled={isSigningIn}
              className="w-full rounded-full py-6"
              variant="secondary"
            >
              {isSigningIn ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Signing in...
                </>
              ) : (
                'Continue Anonymously'
              )}
            </Button>
          </div>

          <p className="text-center text-xs text-muted-foreground">
            By continuing, you agree to our Terms of Service and Privacy Policy.
          </p>
        </Card>
      </div>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        <Link href="/" className="text-primary hover:underline">
          Back to community
        </Link>
      </p>
    </div>
  );
}
