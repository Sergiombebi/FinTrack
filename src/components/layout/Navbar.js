"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function Navbar() {
  const [user, setUser] = useState(null);
  const router = useRouter();

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    };

    getUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log("Navbar auth state change:", { event, user: session?.user?.email });
        setUser(session?.user || null);
        
        // Rediriger vers dashboard si connexion réussie ET si on n'est pas déjà sur dashboard
        if (event === 'SIGNED_IN' && session?.user && !window.location.pathname.includes('/dashboard')) {
          console.log("Redirection automatique vers dashboard depuis navbar");
          router.push('/dashboard');
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [router]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/');
  };

  return (
    <nav className="bg-white/3 backdrop-blur-md border border-white/5 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center">
            <div className="w-8 h-8 rounded-lg bg-emerald-500 flex items-center justify-center">
              <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
              </svg>
            </div>
            <span className="ml-3 text-white font-semibold text-lg">FinTrack</span>
          </div>

          {/* Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            <a href="/" className="text-zinc-300 hover:text-white transition-colors">Accueil</a>
            {user && (
              <>
                <a href="/dashboard" className="text-zinc-300 hover:text-white transition-colors">Dashboard</a>
                <a href="/analyses" className="text-zinc-300 hover:text-white transition-colors">Analyses</a>
                <a href="/budget" className="text-zinc-300 hover:text-white transition-colors">Budget</a>
              </>
            )}
          </div>

          {/* Actions utilisateur */}
          <div className="flex items-center space-x-4">
            {user ? (
              <div className="flex items-center space-x-3">
                <span className="text-zinc-300 text-sm">
                  {user.user_metadata?.nom || user.email}
                </span>
                <button
                  onClick={handleSignOut}
                  className="px-4 py-2 text-sm text-zinc-300 hover:text-white transition-colors"
                >
                  Déconnexion
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-3">
                <a
                  href="/auth/login"
                  className="px-4 py-2 text-sm text-zinc-300 hover:text-white transition-colors"
                >
                  Connexion
                </a>
                <a
                  href="/auth/register"
                  className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-black text-sm font-medium rounded-lg transition-colors"
                >
                  S'inscrire
                </a>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
