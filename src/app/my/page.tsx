"use client";

import { useEffect, useState } from "react";
import { User, Bookmark, History, LogIn, LogOut } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/_providers/auth-provider";
import { getFavorites, type FavoritesData } from "@/lib/favorites";

const __DEV__ = process.env.NODE_ENV !== 'production';

export default function MyPage() {
  const router = useRouter();
  const { user, loading, signOut } = useAuth();
  const [favorites, setFavorites] = useState<FavoritesData>({ tools: [], routes: [] });
  const [loadingFavorites, setLoadingFavorites] = useState(true);

  useEffect(() => {
    async function loadFavorites() {
      if (__DEV__) console.log('[MyPage] loadFavorites start, user:', user?.id ?? 'guest');
      
      try {
        const data = await getFavorites();
        if (__DEV__) console.log('[MyPage] getFavorites success:', data);
        setFavorites(data);
      } catch (error) {
        console.error('[MyPage] Error loading favorites:', error);
        // Set empty state on error to stop loading spinner
        setFavorites({ tools: [], routes: [] });
      } finally {
        if (__DEV__) console.log('[MyPage] loadFavorites complete, setting loadingFavorites=false');
        setLoadingFavorites(false);
      }
    }
    
    // Only load favorites after auth has finished loading
    if (!loading) {
      loadFavorites();
    } else {
      if (__DEV__) console.log('[MyPage] Waiting for auth to finish loading...');
    }
  }, [user, loading]);

  const handleSignIn = () => {
    // Navigate to Coming Soon page instead of actual auth
    router.push("/auth/coming-soon");
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      // Reload favorites after sign out
      const data = await getFavorites();
      setFavorites(data);
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  return (
    <div className="min-h-[calc(100vh-80px)] bg-background px-4 pt-3 pb-24 text-foreground">
      <div className="mx-auto flex max-w-4xl flex-col gap-6">
        {/* Header */}
        <header className="mt-6 space-y-2 text-center">
          <div className="flex justify-center">
            <div className="rounded-full bg-primary/10 p-4">
              <User className="h-8 w-8 text-primary" />
            </div>
          </div>
          <h1 className="text-2xl font-semibold sm:text-3xl">My Airoute</h1>
          <p className="text-sm text-muted-foreground sm:text-base">
            Manage your saved tools, history, and preferences.
          </p>
          
          {/* Auth Button */}
          {loading ? (
            <div className="text-xs text-muted-foreground">Loading...</div>
          ) : user ? (
            <div className="flex flex-col items-center gap-2">
              <p className="text-xs text-muted-foreground">
                Signed in as {user.email}
              </p>
              <button
                onClick={handleSignOut}
                className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-sm font-medium text-foreground transition hover:border-border hover:bg-muted"
              >
                <LogOut className="h-4 w-4" />
                Sign out
              </button>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <button
                onClick={handleSignIn}
                className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90"
              >
                <LogIn className="h-4 w-4" />
                Sign in with Google
              </button>
              <span className="text-xs text-muted-foreground">Coming soon</span>
            </div>
          )}
        </header>

        {/* Dashboard Grid */}
        <div className="mt-8 grid gap-4 md:grid-cols-2">
          {/* Saved Tools Card */}
          <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                <Bookmark className="h-6 w-6 text-primary" />
              </div>
              <h2 className="text-xl font-bold">Saved Tools</h2>
            </div>
            <p className="mb-4 text-sm text-muted-foreground">
              Your bookmarked AI tools appear here.
              {!user && (
                <span className="block mt-1 text-xs text-primary">
                  Guest: {favorites.tools.length}/3 saved
                </span>
              )}
            </p>
            {loadingFavorites ? (
              <div className="text-center text-sm text-muted-foreground">Loading...</div>
            ) : favorites.tools.length > 0 ? (
              <div className="space-y-2">
                {favorites.tools.map((toolSlug) => (
                  <Link
                    key={toolSlug}
                    href={`/tools/${toolSlug}`}
                    className="block rounded-lg border border-border bg-card px-3 py-2 text-sm text-card-foreground transition hover:border-primary/50 hover:bg-muted/50"
                  >
                    {toolSlug}
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-center text-sm text-muted-foreground">
                No saved tools yet
              </div>
            )}
          </div>

          {/* History Card */}
          <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                <History className="h-6 w-6 text-primary" />
              </div>
              <h2 className="text-xl font-bold">History</h2>
            </div>
            <p className="mb-4 text-sm text-muted-foreground">
              Recently viewed AI tools.
            </p>
            <div className="text-center text-sm text-muted-foreground">
              No history yet
            </div>
          </div>

          {/* Settings Card */}
          <div className="rounded-2xl border border-border bg-card p-6 shadow-sm md:col-span-2">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                <User className="h-6 w-6 text-primary" />
              </div>
              <h2 className="text-xl font-bold">Settings</h2>
            </div>
            <p className="text-sm text-slate-400">
              Account settings and preferences coming soon.
            </p>
          </div>
        </div>

        {/* More Features Coming Soon Notice */}
        <div className="mt-8 rounded-2xl border border-primary/20 bg-primary/5 p-6 text-center">
          <p className="text-sm text-slate-400">
            🚀{" "}
            <strong className="text-slate-50">
              More features coming soon:
            </strong>{" "}
            Tool collections, usage analytics, and personalized
            recommendations.
          </p>
        </div>
      </div>
    </div>
  );
}
