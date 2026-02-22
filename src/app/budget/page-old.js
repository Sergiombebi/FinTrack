"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { getCurrentUser } from "@/lib/auth";
import { getBudgets } from "@/lib/database";
import Sidebar from "@/components/layout/Sidebar";

export default function BudgetPage() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [budgets, setBudgets] = useState([]);
  const [statsLoading, setStatsLoading] = useState(true);
  const [showAddBudget, setShowAddBudget] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const getUser = async () => {
      console.log("Budget: Vérification de l'utilisateur...");
      const user = await getCurrentUser();
      
      if (!user) {
        console.log("Budget: Redirection vers login (utilisateur non trouvé)");
        router.push("/auth/login");
        return;
      }
      
      setUser(user);
      setLoading(false);
      
      // Charger les budgets
      loadBudgets(user.id);
    };

    getUser();

    // Écouter les changements d'authentification
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log("Budget: Auth state change:", { event, user: session?.user?.email });
        
        if (event === 'SIGNED_OUT') {
          console.log("Budget: Déconnexion détectée, redirection vers login");
          router.push("/auth/login");
        } else if (session?.user) {
          console.log("Budget: Utilisateur mis à jour:", session.user.email);
          setUser(session.user);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [router]);

  const loadBudgets = async (userId) => {
    try {
      setStatsLoading(true);
      const budgets = await getBudgets(userId);
      setBudgets(budgets);
    } catch (error) {
      console.error('Erreur lors du chargement des budgets:', error);
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
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">Gestion du Budget</h1>
              <p className="text-zinc-400">Définissez et suivez vos limites mensuelles</p>
            </div>
            <button 
              onClick={() => setShowAddBudget(true)}
              className="px-6 py-3 bg-emerald-500 hover:bg-emerald-400 text-black font-semibold rounded-xl transition-colors"
            >
              + Nouveau budget
            </button>
          </div>

          {/* Résumé global */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <div className="bg-gradient-to-br from-emerald-500/20 to-emerald-600/5 border border-white/5 rounded-2xl p-5">
              <div className="text-2xl mb-3">🎯</div>
              <p className="text-white font-bold text-lg">50,000 FCFA</p>
              <p className="text-zinc-500 text-xs mt-1">Budget total mensuel</p>
            </div>
            <div className="bg-gradient-to-br from-amber-500/20 to-amber-600/5 border border-white/5 rounded-2xl p-5">
              <div className="text-2xl mb-3">💸</div>
              <p className="text-white font-bold text-lg">32,500 FCFA</p>
              <p className="text-zinc-500 text-xs mt-1">Dépensé ce mois</p>
            </div>
            <div className="bg-gradient-to-br from-blue-500/20 to-blue-600/5 border border-white/5 rounded-2xl p-5">
              <div className="text-2xl mb-3">💰</div>
              <p className="text-white font-bold text-lg">17,500 FCFA</p>
              <p className="text-zinc-500 text-xs mt-1">Restant ce mois</p>
            </div>
          </div>

          {/* Liste des budgets par catégorie */}
          <div className="bg-white/3 border border-white/5 rounded-2xl p-6">
            <h2 className="text-white font-semibold mb-4">Budgets par catégorie</h2>
            
            {statsLoading ? (
              <div className="flex items-center justify-center py-10">
                <div className="text-zinc-500">Chargement des budgets...</div>
              </div>
            ) : budgets.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <div className="text-4xl mb-3">🎯</div>
                <p className="text-zinc-500 text-sm mb-4">Aucun budget défini.</p>
                <button 
                  onClick={() => setShowAddBudget(true)}
                  className="px-5 py-2 bg-emerald-500 hover:bg-emerald-400 text-black text-sm font-semibold rounded-xl transition-colors"
                >
                  + Créer votre premier budget
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Budget Restauration */}
                <div className="p-4 bg-white/2 rounded-xl">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">🍔</span>
                      <div>
                        <p className="text-white font-medium">Restauration</p>
                        <p className="text-zinc-500 text-sm">15,000 FCFA / 20,000 FCFA</p>
                      </div>
                    </div>
                    <span className="text-amber-400 font-semibold">75%</span>
                  </div>
                  <div className="w-full bg-white/10 rounded-full h-2">
                    <div className="bg-gradient-to-r from-emerald-500 to-amber-500 h-2 rounded-full" style={{width: '75%'}}></div>
                  </div>
                  <p className="text-zinc-500 text-xs mt-2">5,000 FCFA restants</p>
                </div>

                {/* Budget Transport */}
                <div className="p-4 bg-white/2 rounded-xl">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">🚗</span>
                      <div>
                        <p className="text-white font-medium">Transport</p>
                        <p className="text-zinc-500 text-sm">8,000 FCFA / 15,000 FCFA</p>
                      </div>
                    </div>
                    <span className="text-emerald-400 font-semibold">53%</span>
                  </div>
                  <div className="w-full bg-white/10 rounded-full h-2">
                    <div className="bg-gradient-to-r from-emerald-500 to-emerald-400 h-2 rounded-full" style={{width: '53%'}}></div>
                  </div>
                  <p className="text-zinc-500 text-xs mt-2">7,000 FCFA restants</p>
                </div>

                {/* Budget Shopping */}
                <div className="p-4 bg-white/2 rounded-xl">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">🛒</span>
                      <div>
                        <p className="text-white font-medium">Shopping</p>
                        <p className="text-zinc-500 text-sm">9,500 FCFA / 10,000 FCFA</p>
                      </div>
                    </div>
                    <span className="text-rose-400 font-semibold">95%</span>
                  </div>
                  <div className="w-full bg-white/10 rounded-full h-2">
                    <div className="bg-gradient-to-r from-amber-500 to-rose-500 h-2 rounded-full" style={{width: '95%'}}></div>
                  </div>
                  <p className="text-rose-400 text-xs mt-2">500 FCFA restants ⚠️</p>
                </div>

                {/* Budget Loisirs */}
                <div className="p-4 bg-white/2 rounded-xl">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">🎮</span>
                      <div>
                        <p className="text-white font-medium">Loisirs</p>
                        <p className="text-zinc-500 text-sm">0 FCFA / 5,000 FCFA</p>
                      </div>
                    </div>
                    <span className="text-emerald-400 font-semibold">0%</span>
                  </div>
                  <div className="w-full bg-white/10 rounded-full h-2">
                    <div className="bg-gradient-to-r from-emerald-500 to-emerald-400 h-2 rounded-full" style={{width: '0%'}}></div>
                  </div>
                  <p className="text-zinc-500 text-xs mt-2">5,000 FCFA restants</p>
                </div>
              </div>
            )}
          </div>

          {/* Alertes et recommandations */}
          <div className="mt-8 bg-white/3 border border-white/5 rounded-2xl p-6">
            <h2 className="text-white font-semibold mb-4">Alertes & Recommandations</h2>
            <div className="space-y-3">
              <div className="flex items-start gap-3 p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl">
                <span className="text-xl">⚠️</span>
                <div>
                  <p className="text-rose-400 font-medium text-sm">Budget Shopping presque atteint</p>
                  <p className="text-zinc-500 text-xs">Il ne vous reste que 500 FCFA pour ce mois</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
                <span className="text-xl">✅</span>
                <div>
                  <p className="text-emerald-400 font-medium text-sm">Budget Transport bien géré</p>
                  <p className="text-zinc-500 text-xs">Vous êtes en dessous de votre limite</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Modal d'ajout de budget */}
      {showAddBudget && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-[#080808] border border-white/10 rounded-2xl p-6 max-w-md w-full">
            <h3 className="text-white font-semibold text-lg mb-4">Créer un nouveau budget</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-white mb-2">Catégorie</label>
                <select className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-emerald-500">
                  <option>Sélectionner une catégorie</option>
                  <option>🍔 Restauration</option>
                  <option>🚗 Transport</option>
                  <option>🛒 Shopping</option>
                  <option>🎮 Loisirs</option>
                  <option>📱 Autres</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-white mb-2">Budget mensuel (FCFA)</label>
                <input 
                  type="number" 
                  placeholder="10000"
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>
            
            <div className="flex gap-3 mt-6">
              <button 
                onClick={() => setShowAddBudget(false)}
                className="flex-1 px-4 py-3 bg-white/10 hover:bg-white/20 text-white font-semibold rounded-xl transition-colors"
              >
                Annuler
              </button>
              <button className="flex-1 px-4 py-3 bg-emerald-500 hover:bg-emerald-400 text-black font-semibold rounded-xl transition-colors">
                Créer le budget
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
