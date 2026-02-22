"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { getCurrentUser } from "@/lib/auth";

export default function HomePage() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const getUser = async () => {
      console.log("Home: Vérification de l'utilisateur...");
      const user = await getCurrentUser();
      
      if (user) {
        console.log("Home: Utilisateur trouvé, redirection vers dashboard");
        router.push("/dashboard");
        return;
      }
      
      setUser(null);
      setLoading(false);
    };

    getUser();

    // Écouter les changements d'authentification
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log("Home: Auth state change:", { event, user: session?.user?.email });
        
        if (event === 'SIGNED_IN' && session?.user && !window.location.pathname.includes('/dashboard')) {
          console.log("Home: Redirection automatique vers dashboard");
          router.push('/dashboard');
        } else if (event === 'SIGNED_OUT') {
          console.log("Home: Utilisateur déconnecté");
          setUser(null);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#080808] flex items-center justify-center">
        <div className="text-white">Chargement...</div>
      </div>
    );
  }

  // Si l'utilisateur est connecté, il sera redirigé vers dashboard
  // Sinon, afficher la page d'accueil pour les non-connectés
  return (
    <div className="min-h-screen bg-[#080808]">
      {/* Navigation principale */}
      <nav className="border-b border-white/5">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-500 flex items-center justify-center">
              <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <span className="text-white font-semibold text-lg">FinTrack</span>
          </div>
          
          <div className="flex items-center gap-4">
            <Link href="/auth/login" className="text-zinc-400 hover:text-white transition-colors">
              Se connecter
            </Link>
            <Link href="/auth/register" className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-black font-semibold rounded-xl transition-colors">
              S'inscrire
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="max-w-6xl mx-auto px-6 py-20">
        <div className="text-center mb-16">
          <h1 className="text-5xl md:text-6xl font-bold text-white mb-6">
            Maîtrisez vos <span className="text-emerald-400">finances</span> en un clic
          </h1>
          <p className="text-xl text-zinc-400 mb-8 max-w-2xl mx-auto">
            Suivez vos dépenses, analysez vos habitudes et atteignez vos objectifs financiers avec notre application intuitive et moderne.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/auth/register" className="px-8 py-4 bg-emerald-500 hover:bg-emerald-400 text-black font-semibold rounded-xl transition-colors text-lg">
              Commencer gratuitement
            </Link>
            <Link href="/auth/login" className="px-8 py-4 bg-white/10 hover:bg-white/20 text-white font-semibold rounded-xl transition-colors text-lg">
              Se connecter
            </Link>
          </div>
        </div>

        {/* Fonctionnalités */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          <div className="bg-white/3 border border-white/5 rounded-2xl p-8 text-center">
            <div className="text-4xl mb-4">⚡</div>
            <h3 className="text-white font-semibold text-lg mb-3">Suivi en temps réel</h3>
            <p className="text-zinc-400 text-sm">Enregistrez chaque dépense instantanément et gardez un œil sur vos finances à tout moment.</p>
          </div>
          
          <div className="bg-white/3 border border-white/5 rounded-2xl p-8 text-center">
            <div className="text-4xl mb-4">📈</div>
            <h3 className="text-white font-semibold text-lg mb-3">Analyses intelligentes</h3>
            <p className="text-zinc-400 text-sm">Des graphiques clairs pour comprendre où va votre argent et identifier vos habitudes.</p>
          </div>
          
          <div className="bg-white/3 border border-white/5 rounded-2xl p-8 text-center">
            <div className="text-4xl mb-4">🎯</div>
            <h3 className="text-white font-semibold text-lg mb-3">Gestion du budget</h3>
            <p className="text-zinc-400 text-sm">Définissez des limites par catégorie et recevez des alertes avant de les dépasser.</p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-16">
          <div className="text-center">
            <div className="text-3xl font-bold text-emerald-400 mb-2">10K+</div>
            <div className="text-zinc-500 text-sm">Utilisateurs actifs</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-emerald-400 mb-2">50M+</div>
            <div className="text-zinc-500 text-sm">FCFA économisés</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-emerald-400 mb-2">4.8⭐</div>
            <div className="text-zinc-500 text-sm">Note moyenne</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-emerald-400 mb-2">99.9%</div>
            <div className="text-zinc-500 text-sm">Uptime</div>
          </div>
        </div>

        {/* CTA Final */}
        <div className="bg-gradient-to-r from-emerald-500/20 to-teal-600/5 border border-emerald-500/20 rounded-2xl p-12 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">Prêt à reprendre le contrôle de vos finances ?</h2>
          <p className="text-zinc-400 mb-8 max-w-2xl mx-auto">
            Rejoignez des milliers d'utilisateurs qui ont déjà transformé leur relation avec l'argent.
          </p>
          <Link href="/auth/register" className="px-8 py-4 bg-emerald-500 hover:bg-emerald-400 text-black font-semibold rounded-xl transition-colors text-lg">
            Créer mon compte gratuit
          </Link>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-white/5 py-8">
        <div className="max-w-6xl mx-auto px-6 text-center">
          <p className="text-zinc-500 text-sm">© 2024 FinTrack. Tous droits réservés.</p>
        </div>
      </footer>
    </div>
  );
}
