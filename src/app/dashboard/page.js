"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/layout/Sidebar";
import { supabase } from "@/lib/supabase";
import { getMonthlyStats, getExpenses } from "@/lib/database";

export default function DashboardPage() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);
  const [monthlyStats, setMonthlyStats] = useState(null);
  const [recentExpenses, setRecentExpenses] = useState([]);
  const router = useRouter();

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        router.push("/auth/login");
        return;
      }
      
      setUser(user);
      setLoading(false);
      
      // Charger les données du dashboard
      loadDashboardData(user.id);
    };

    getUser();

    // Écouter les changements d'authentification
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (event === 'SIGNED_OUT') {
          router.push("/auth/login");
        } else if (session?.user) {
          setUser(session.user);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [router]);

  // Fonction pour charger les données du dashboard
  const loadDashboardData = async (userId) => {
    try {
      setStatsLoading(true);
      
      // Charger les statistiques mensuelles
      const stats = await getMonthlyStats(userId);
      setMonthlyStats(stats);
      
      // Charger les dernières dépenses
      const expenses = await getExpenses(userId, 5);
      setRecentExpenses(expenses);
      
    } catch (error) {
      console.error('Erreur lors du chargement des données:', error);
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

  const stats = [
    { label: "Dépensé ce mois", valeur: `${monthlyStats?.totalExpenses?.toFixed(2) || '0'} FCFA`, icone: "💸", couleur: "from-rose-500/20 to-rose-600/5" },
    { label: "Budget restant", valeur: "0 FCFA", icone: "🎯", couleur: "from-emerald-500/20 to-emerald-600/5" },
    { label: "Transactions", valeur: monthlyStats?.transactionCount?.toString() || "0", icone: "📊", couleur: "from-blue-500/20 to-blue-600/5" },
    { label: "Économies", valeur: "0 FCFA", icone: "🏦", couleur: "from-violet-500/20 to-violet-600/5" },
  ];

  return (
    <div className="flex min-h-screen bg-[#080808] font-sans">
      {/* Sidebar */}
      <Sidebar />

      {/* Contenu principal */}
      <main className="flex-1 overflow-y-auto pb-20 md:pb-0">
        <div className="p-6 md:p-10 max-w-5xl mx-auto">
          {/* Header */}
          <div className="mb-10">
            <p className="text-zinc-500 text-sm mb-1">Bienvenue de retour 👋</p>
            <h1 className="text-3xl font-bold text-white">
              Bonjour, <span className="text-emerald-400">{user.user_metadata?.nom || user.email}</span>
            </h1>
            <p className="text-zinc-400 mt-2 text-sm">Voici un résumé de vos finances ce mois-ci.</p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
            {stats.map((stat) => (
              <div
                key={stat.label}
                className={`bg-gradient-to-br ${stat.couleur} border border-white/5 rounded-2xl p-5`}
              >
                <div className="text-2xl mb-3">{stat.icone}</div>
                <p className="text-white font-bold text-lg">{stat.valeur}</p>
                <p className="text-zinc-500 text-xs mt-1">{stat.label}</p>
              </div>
            ))}
          </div>

          {/* Dernières dépenses */}
          <div className="bg-white/3 border border-white/5 rounded-2xl p-6">
            <h2 className="text-white font-semibold mb-4">Dernières dépenses</h2>
            {statsLoading ? (
              <div className="flex items-center justify-center py-10">
                <div className="text-zinc-500">Chargement des dépenses...</div>
              </div>
            ) : recentExpenses.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <div className="text-4xl mb-3">📭</div>
                <p className="text-zinc-500 text-sm">Aucune dépense enregistrée pour ce mois.</p>
                <button className="mt-4 px-5 py-2 bg-emerald-500 hover:bg-emerald-400 text-black text-sm font-semibold rounded-xl transition-colors">
                  + Ajouter une dépense
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {recentExpenses.map((expense) => (
                  <div key={expense.id} className="flex items-center justify-between p-3 bg-white/2 rounded-xl">
                    <div className="flex items-center gap-3">
                      <div className="text-xl">{expense.categories?.icon || '📊'}</div>
                      <div>
                        <p className="text-white font-medium text-sm">{expense.description || 'Dépense'}</p>
                        <p className="text-zinc-500 text-xs">{expense.categories?.name || 'Non catégorisé'}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-rose-400 font-semibold">-{expense.amount} FCFA</p>
                      <p className="text-zinc-500 text-xs">{new Date(expense.expense_date).toLocaleDateString('fr-FR')}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Actions rapides */}
          <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
            <button className="bg-white/3 border border-white/5 rounded-2xl p-6 hover:border-emerald-500/20 hover:bg-emerald-500/3 transition-all duration-300 text-left">
              <div className="text-2xl mb-3">➕</div>
              <h3 className="text-white font-semibold mb-2">Ajouter une dépense</h3>
              <p className="text-zinc-500 text-sm">Enregistrer une nouvelle transaction</p>
            </button>
            
            <button className="bg-white/3 border border-white/5 rounded-2xl p-6 hover:border-emerald-500/20 hover:bg-emerald-500/3 transition-all duration-300 text-left">
              <div className="text-2xl mb-3">📈</div>
              <h3 className="text-white font-semibold mb-2">Voir les analyses</h3>
              <p className="text-zinc-500 text-sm">Explorer vos statistiques</p>
            </button>
            
            <button className="bg-white/3 border border-white/5 rounded-2xl p-6 hover:border-emerald-500/20 hover:bg-emerald-500/3 transition-all duration-300 text-left">
              <div className="text-2xl mb-3">🎯</div>
              <h3 className="text-white font-semibold mb-2">Gérer le budget</h3>
              <p className="text-zinc-500 text-sm">Définir vos limites mensuelles</p>
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
