"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { getCurrentUser } from "@/lib/auth";
import { getExpenses } from "@/lib/database";
import Sidebar from "@/components/layout/Sidebar";

export default function DepensesPage() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [expenses, setExpenses] = useState([]);
  const [statsLoading, setStatsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const getUser = async () => {
      console.log("Dépenses: Vérification de l'utilisateur...");
      const user = await getCurrentUser();
      
      if (!user) {
        console.log("Dépenses: Redirection vers login (utilisateur non trouvé)");
        router.push("/auth/login");
        return;
      }
      
      setUser(user);
      setLoading(false);
      
      // Charger les dépenses
      loadExpenses(user.id);
    };

    getUser();

    // Écouter les changements d'authentification
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log("Dépenses: Auth state change:", { event, user: session?.user?.email });
        
        if (event === 'SIGNED_OUT') {
          console.log("Dépenses: Déconnexion détectée, redirection vers login");
          router.push("/auth/login");
        } else if (session?.user) {
          console.log("Dépenses: Utilisateur mis à jour:", session.user.email);
          setUser(session.user);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [router]);

  const loadExpenses = async (userId) => {
    try {
      setStatsLoading(true);
      const expenses = await getExpenses(userId);
      setExpenses(expenses);
    } catch (error) {
      console.error('Erreur lors du chargement des dépenses:', error);
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
            <h1 className="text-3xl font-bold text-white mb-2">Mes Dépenses</h1>
            <p className="text-zinc-400">Gérez et suivez toutes vos dépenses</p>
          </div>

          {/* Actions rapides */}
          <div className="mb-8 flex flex-col sm:flex-row gap-4">
            <button className="px-6 py-3 bg-emerald-500 hover:bg-emerald-400 text-black font-semibold rounded-xl transition-colors">
              + Ajouter une dépense
            </button>
            <button className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white font-semibold rounded-xl transition-colors">
              📊 Voir les statistiques
            </button>
          </div>

          {/* Liste des dépenses */}
          <div className="bg-white/3 border border-white/5 rounded-2xl p-6">
            <h2 className="text-white font-semibold mb-4">Historique des dépenses</h2>
            
            {statsLoading ? (
              <div className="flex items-center justify-center py-10">
                <div className="text-zinc-500">Chargement des dépenses...</div>
              </div>
            ) : expenses.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <div className="text-4xl mb-3">📭</div>
                <p className="text-zinc-500 text-sm mb-4">Aucune dépense enregistrée.</p>
                <button className="px-5 py-2 bg-emerald-500 hover:bg-emerald-400 text-black text-sm font-semibold rounded-xl transition-colors">
                  + Ajouter votre première dépense
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {expenses.map((expense) => (
                  <div key={expense.id} className="flex items-center justify-between p-4 bg-white/2 rounded-xl hover:bg-white/5 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="text-xl">{expense.categories?.icon || '📊'}</div>
                      <div>
                        <p className="text-white font-medium">{expense.description || 'Dépense'}</p>
                        <p className="text-zinc-500 text-sm">{expense.categories?.name || 'Non catégorisé'}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-rose-400 font-semibold text-lg">-{expense.amount} FCFA</p>
                      <p className="text-zinc-500 text-sm">{new Date(expense.expense_date).toLocaleDateString('fr-FR')}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
