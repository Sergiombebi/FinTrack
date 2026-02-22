"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { getCurrentUser } from "@/lib/auth";
import { getMonthlyStats, getExpenses } from "@/lib/database";
import Sidebar from "@/components/layout/Sidebar";

export default function AnalysesPage() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [expenses, setExpenses] = useState([]);
  const [statsLoading, setStatsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const getUser = async () => {
      console.log("Analyses: Vérification de l'utilisateur...");
      const user = await getCurrentUser();
      
      if (!user) {
        console.log("Analyses: Redirection vers login (utilisateur non trouvé)");
        router.push("/auth/login");
        return;
      }
      
      setUser(user);
      setLoading(false);
      
      // Charger les données d'analyse
      loadAnalyticsData(user.id);
    };

    getUser();

    // Écouter les changements d'authentification
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log("Analyses: Auth state change:", { event, user: session?.user?.email });
        
        if (event === 'SIGNED_OUT') {
          console.log("Analyses: Déconnexion détectée, redirection vers login");
          router.push("/auth/login");
        } else if (session?.user) {
          console.log("Analyses: Utilisateur mis à jour:", session.user.email);
          setUser(session.user);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [router]);

  const loadAnalyticsData = async (userId) => {
    try {
      setStatsLoading(true);
      
      // Charger les statistiques mensuelles
      const monthlyStats = await getMonthlyStats(userId);
      const allExpenses = await getExpenses(userId, 100); // Plus de dépenses pour l'analyse
      
      setStats(monthlyStats);
      setExpenses(allExpenses);
    } catch (error) {
      console.error('Erreur lors du chargement des analyses:', error);
    } finally {
      setStatsLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#080808] flex items-center justify-center">
        <div className="text-white">Chargement...</div>
      </div>
    );
  }

  if (!user) {
    return null; // Sera redirigé
  }

  return (
    <div className="flex min-h-screen bg-[#080808] font-sans">
      {/* Sidebar */}
      <Sidebar />

      {/* Contenu principal */}
      <main className="flex-1 overflow-y-auto pb-20 md:pb-0">
        <div className="p-6 md:p-10 max-w-5xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">Analyses Financières</h1>
            <p className="text-zinc-400">Explorez vos habitudes de dépenses et tendances</p>
          </div>

          {/* Période d'analyse */}
          <div className="mb-8 flex flex-wrap gap-4">
            <select className="px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-emerald-500">
              <option>Ce mois</option>
              <option>Mois dernier</option>
              <option>3 derniers mois</option>
              <option>Cette année</option>
            </select>
            <button className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-black font-semibold rounded-xl transition-colors">
              📊 Générer un rapport
            </button>
          </div>

          {/* Statistiques principales */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <div className="bg-gradient-to-br from-rose-500/20 to-rose-600/5 border border-white/5 rounded-2xl p-5">
              <div className="text-2xl mb-3">💸</div>
              <p className="text-white font-bold text-lg">{stats?.totalExpenses?.toFixed(2) || '0'} FCFA</p>
              <p className="text-zinc-500 text-xs mt-1">Total dépensé</p>
            </div>
            <div className="bg-gradient-to-br from-emerald-500/20 to-emerald-600/5 border border-white/5 rounded-2xl p-5">
              <div className="text-2xl mb-3">📈</div>
              <p className="text-white font-bold text-lg">{stats?.transactionCount || '0'}</p>
              <p className="text-zinc-500 text-xs mt-1">Transactions</p>
            </div>
            <div className="bg-gradient-to-br from-blue-500/20 to-blue-600/5 border border-white/5 rounded-2xl p-5">
              <div className="text-2xl mb-3">💰</div>
              <p className="text-white font-bold text-lg">{stats?.averageExpense?.toFixed(2) || '0'} FCFA</p>
              <p className="text-zinc-500 text-xs mt-1">Dépense moyenne</p>
            </div>
            <div className="bg-gradient-to-br from-violet-500/20 to-violet-600/5 border border-white/5 rounded-2xl p-5">
              <div className="text-2xl mb-3">🎯</div>
              <p className="text-white font-bold text-lg">{stats?.highestExpense?.toFixed(2) || '0'} FCFA</p>
              <p className="text-zinc-500 text-xs mt-1">Plus grosse dépense</p>
            </div>
          </div>

          {/* Graphiques et analyses */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Répartition par catégorie */}
            <div className="bg-white/3 border border-white/5 rounded-2xl p-6">
              <h2 className="text-white font-semibold mb-4">Répartition par catégorie</h2>
              {statsLoading ? (
                <div className="flex items-center justify-center py-10">
                  <div className="text-zinc-500">Chargement...</div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span>🍔</span>
                      <span className="text-white text-sm">Restauration</span>
                    </div>
                    <span className="text-zinc-400 text-sm">35%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span>🚗</span>
                      <span className="text-white text-sm">Transport</span>
                    </div>
                    <span className="text-zinc-400 text-sm">25%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span>🛒</span>
                      <span className="text-white text-sm">Shopping</span>
                    </div>
                    <span className="text-zinc-400 text-sm">20%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span>🎮</span>
                      <span className="text-white text-sm">Loisirs</span>
                    </div>
                    <span className="text-zinc-400 text-sm">15%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span>📱</span>
                      <span className="text-white text-sm">Autres</span>
                    </div>
                    <span className="text-zinc-400 text-sm">5%</span>
                  </div>
                </div>
              )}
            </div>

            {/* Évolution temporelle */}
            <div className="bg-white/3 border border-white/5 rounded-2xl p-6">
              <h2 className="text-white font-semibold mb-4">Évolution des dépenses</h2>
              {statsLoading ? (
                <div className="flex items-center justify-center py-10">
                  <div className="text-zinc-500">Chargement...</div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="h-32 bg-white/5 rounded-lg flex items-end justify-around p-2">
                    <div className="w-8 bg-emerald-500 rounded-t" style={{height: '40%'}}></div>
                    <div className="w-8 bg-emerald-500 rounded-t" style={{height: '60%'}}></div>
                    <div className="w-8 bg-emerald-500 rounded-t" style={{height: '80%'}}></div>
                    <div className="w-8 bg-emerald-500 rounded-t" style={{height: '45%'}}></div>
                    <div className="w-8 bg-rose-500 rounded-t" style={{height: '90%'}}></div>
                    <div className="w-8 bg-emerald-500 rounded-t" style={{height: '70%'}}></div>
                    <div className="w-8 bg-emerald-500 rounded-t" style={{height: '55%'}}></div>
                  </div>
                  <div className="flex justify-between text-xs text-zinc-500">
                    <span>Lun</span>
                    <span>Mar</span>
                    <span>Mer</span>
                    <span>Jeu</span>
                    <span>Ven</span>
                    <span>Sam</span>
                    <span>Dim</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Insights et recommandations */}
          <div className="bg-white/3 border border-white/5 rounded-2xl p-6">
            <h2 className="text-white font-semibold mb-4">Insights & Recommandations</h2>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="text-2xl">💡</div>
                <div>
                  <p className="text-white font-medium text-sm">Vos dépenses ont augmenté de 15% cette semaine</p>
                  <p className="text-zinc-500 text-xs">Considérez revoir votre budget restauration</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="text-2xl">🎯</div>
                <div>
                  <p className="text-white font-medium text-sm">Vous êtes bien en dessous de votre budget mensuel</p>
                  <p className="text-zinc-500 text-xs">Continuez comme ça !</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="text-2xl">📊</div>
                <div>
                  <p className="text-white font-medium text-sm">Le samedi est votre jour de dépenses le plus élevé</p>
                  <p className="text-zinc-500 text-xs">Planifiez vos achats en semaine</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
