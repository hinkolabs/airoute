'use client';

import { useState, useEffect } from 'react';
import { Bookmark } from 'lucide-react';
import { setRouteFavorite, getFavorites } from '@/lib/favorites';
import { useAuth } from '@/app/_providers/auth-provider';

type SaveRouteButtonProps = {
  routeSlug: string;
  routeName: string;
};

export function SaveRouteButton({ routeSlug, routeName }: SaveRouteButtonProps) {
  const { user } = useAuth();
  const [isSaved, setIsSaved] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showWarning, setShowWarning] = useState(false);

  // Load initial saved state
  useEffect(() => {
    async function checkSaved() {
      try {
        const favorites = await getFavorites();
        setIsSaved(favorites.routes.includes(routeSlug));
      } catch (error) {
        console.error('Error checking saved route:', error);
      }
    }
    checkSaved();
  }, [routeSlug, user]);

  const handleToggle = async () => {
    setIsLoading(true);
    setShowWarning(false);

    try {
      // Toggle: if currently saved, remove it; otherwise set it
      const newRouteSlug = isSaved ? null : routeSlug;
      const result = await setRouteFavorite(newRouteSlug);

      if (result.blocked) {
        setShowWarning(true);
        setTimeout(() => setShowWarning(false), 3000);
      } else {
        setIsSaved(result.routes.includes(routeSlug));
      }
    } catch (error) {
      console.error('Error toggling route favorite:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-2">
      <button
        onClick={handleToggle}
        disabled={isLoading}
        className={`w-full inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold transition ${
          isSaved
            ? 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30'
            : 'border border-slate-700 bg-slate-900/50 text-slate-300 hover:border-emerald-500/50 hover:bg-slate-800'
        } disabled:opacity-50 disabled:cursor-not-allowed`}
      >
        <Bookmark className={`h-4 w-4 ${isSaved ? 'fill-emerald-400' : ''}`} />
        {isSaved ? `Saved: ${routeName}` : `Save this route`}
      </button>

      {/* Guest warning */}
      {showWarning && !user && (
        <div className="rounded-lg border border-amber-500/50 bg-amber-500/10 px-4 py-2 text-xs text-amber-400 text-center">
          Guest limit: 1 route. Sign in for more!
        </div>
      )}
    </div>
  );
}

