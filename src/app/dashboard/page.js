"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/layout/Sidebar";
import { supabase } from "@/lib/supabase";
import { getCurrentUser } from "@/lib/auth";
import { getMonthlyStats, getExpenses, getCategories, getBudgets, getMonthlyTrends, getBudgetTrends, calculateTrend } from "@/lib/database";
import { useNotification } from "@/contexts/NotificationContext";
import { defaultCategories } from "@/lib/default-categories";

export default function DashboardPage() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);
  const [monthlyStats, setMonthlyStats] = useState(null);
  const [recentExpenses, setRecentExpenses] = useState([]);
  const [categories, setCategories] = useState([]);
  const [budgets, setBudgets] = useState([]);
  const [budgetCategories, setBudgetCategories] = useState([]);
  const [trends, setTrends] = useState([]);
  const [budgetTrends, setBudgetTrends] = useState([]);
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [quickExpense, setQuickExpense] = useState({ amount: '', category_id: '', description: '' });
  const router = useRouter();
  const { showSuccess, showError } = useNotification();

  useEffect(() => {
    const getUser = async () => {
      console.log("Dashboard: Vérification de l'utilisateur...");
      const user = await getCurrentUser();
      
      if (!user) {
        console.log("Dashboard: Redirection vers login (utilisateur non trouvé)");
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
        console.log("Dashboard: Auth state change:", { event, user: session?.user?.email });
        
        if (event === 'SIGNED_OUT') {
          console.log("Dashboard: Déconnexion détectée, redirection vers login");
          router.push("/auth/login");
        } else if (session?.user) {
          console.log("Dashboard: Utilisateur mis à jour:", session.user.email);
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
      
      // Charger les catégories et les budgets pour le mois en cours
      const currentMonth = new Date().getMonth() + 1;
      const currentYear = new Date().getFullYear();
      
      const [cats, budgetData, expenseTrends, budgetTrendData] = await Promise.all([
        getCategories(userId),
        getBudgets(userId, currentYear, currentMonth),
        getMonthlyTrends(userId, 3),
        getBudgetTrends(userId, 3)
      ]);
      
      setTrends(expenseTrends || []);
      setBudgetTrends(budgetTrendData || []);
      
      // Si aucune catégorie n'existe, créer les catégories par défaut
      let finalCategories = cats || [];
      if (!cats || cats.length === 0) {
        try {
          const categoriesToInsert = defaultCategories.map(cat => ({
            ...cat,
            user_id: userId
          }));
          
          const { data: createdCategories, error: catError } = await supabase
            .from('categories')
            .insert(categoriesToInsert)
            .select();
          
          if (!catError && createdCategories) {
            finalCategories = createdCategories;
            showSuccess('Catégories par défaut créées automatiquement !');
          }
        } catch (error) {
          console.error('Erreur lors de la création automatique des catégories:', error);
        }
      }
      
      setCategories(finalCategories || []);
      setBudgets(budgetData || []);
      
      // Filtrer les catégories qui ont un budget défini
      const budgetCategoryIds = (budgetData || []).map(b => b.category_id);
      const filteredCategories = (finalCategories || []).filter(cat => 
        budgetCategoryIds.includes(cat.id)
      );
      setBudgetCategories(filteredCategories);
      
      // Calculer le budget total et le budget restant
      const totalBudget = (budgetData || []).reduce((sum, budget) => sum + budget.amount, 0);
      const budgetRemaining = totalBudget - (stats?.totalExpenses || 0);
      const savings = Math.max(0, budgetRemaining); // Les économies ne peuvent pas être négatives
      
      // Mettre à jour les stats avec les valeurs calculées
      setMonthlyStats({
        ...stats,
        totalBudget,
        budgetRemaining,
        savings
      });
      
    } catch (error) {
      console.error('Erreur lors du chargement des données:', error);
    } finally {
      setStatsLoading(false);
    }
  };

  // Fonction pour ajouter une dépense rapidement
  const handleQuickAddExpense = async (e) => {
    e.preventDefault();
    
    if (!quickExpense.amount || !quickExpense.category_id) {
      showError('Veuillez remplir tous les champs obligatoires');
      return;
    }

    try {
      const expense = {
        user_id: user.id,
        amount: parseFloat(quickExpense.amount),
        category_id: quickExpense.category_id,
        description: quickExpense.description || 'Dépense rapide',
        expense_date: new Date().toISOString()
      };

      const { error } = await supabase.from('expenses').insert([expense]);
      
      if (error) throw error;

      showSuccess('Dépense ajoutée avec succès !');
      setQuickExpense({ amount: '', category_id: '', description: '' });
      setShowQuickAdd(false);
      
      // Recharger les données
      loadDashboardData(user.id);
    } catch (error) {
      console.error('Erreur lors de l\'ajout de la dépense:', error);
      showError('Erreur lors de l\'ajout de la dépense');
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

  // Calculer les tendances
  const currentMonthExpenses = monthlyStats?.totalExpenses || 0;
  const previousMonthExpenses = trends.length > 1 ? trends[trends.length - 2].totalExpenses : 0;
  const expensesTrend = calculateTrend(currentMonthExpenses, previousMonthExpenses);

  const currentTransactions = monthlyStats?.transactionCount || 0;
  const previousTransactions = trends.length > 1 ? trends[trends.length - 2].transactionCount : 0;
  const transactionsTrend = calculateTrend(currentTransactions, previousTransactions);

  const currentBudget = monthlyStats?.totalBudget || 0;
  const previousBudget = budgetTrends.length > 1 ? budgetTrends[budgetTrends.length - 2].totalBudget : 0;
  const budgetTrend = calculateTrend(currentBudget, previousBudget);

  const currentSavings = monthlyStats?.savings || 0;
  const previousSavings = previousBudget > 0 ? (previousBudget - previousMonthExpenses) : 0;
  const savingsTrend = calculateTrend(currentSavings, previousSavings);

  const stats = [
    { 
      label: "Dépensé ce mois", 
      valeur: `${currentMonthExpenses.toFixed(2)} FCFA`, 
      icone: "💸", 
      couleur: "from-rose-500/20 to-rose-600/5",
      trend: expensesTrend
    },
    { 
      label: "Budget restant", 
      valeur: `${monthlyStats?.budgetRemaining?.toFixed(2) || '0'} FCFA`, 
      icone: "🎯", 
      couleur: "from-emerald-500/20 to-emerald-600/5",
      trend: budgetTrend
    },
    { 
      label: "Transactions", 
      valeur: currentTransactions.toString(), 
      icone: "📊", 
      couleur: "from-blue-500/20 to-blue-600/5",
      trend: transactionsTrend
    },
    { 
      label: "Économies", 
      valeur: `${currentSavings.toFixed(2)} FCFA`, 
      icone: "🏦", 
      couleur: "from-violet-500/20 to-violet-600/5",
      trend: savingsTrend
    },
  ];

  return (
    <div className="flex min-h-screen bg-[#080808] font-sans">
      <Sidebar />
      
      <main className="flex-1 overflow-y-auto pb-20 md:pb-0">
        <div className="max-w-7xl mx-auto px-6 py-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-white">
              Bonjour, <span className="text-emerald-400">{user.user_metadata?.nom || user.email}</span>
            </h1>
            <p className="text-zinc-400 mt-2 text-sm">Voici un résumé de vos finances ce mois-ci.</p>
          </div>

          {/* Bouton d'ajout rapide */}
          <div className="mb-8">
            <button
              onClick={() => setShowQuickAdd(!showQuickAdd)}
              className="px-6 py-3 bg-emerald-500 hover:bg-emerald-400 text-black font-semibold rounded-xl transition-all duration-200 hover:scale-105 flex items-center gap-2"
            >
              <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              Ajouter une dépense rapide
            </button>
          </div>

          {/* Formulaire d'ajout rapide */}
          {showQuickAdd && (
            <div className="mb-8 p-6 bg-white/3 border border-white/5 rounded-2xl">
              <h3 className="text-white font-semibold mb-4">Ajouter une dépense</h3>
              
              {budgetCategories.length === 0 ? (
                <div className="bg-orange-500/20 border border-orange-500/30 rounded-lg p-4 mb-4">
                  <div className="flex items-center gap-2 text-orange-400 font-semibold mb-2">
                    <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>Aucun budget défini ce mois-ci</span>
                  </div>
                  <div className="text-orange-300 text-sm mb-3">
                    Pour ajouter une dépense rapide, vous devez d'abord définir des budgets pour vos catégories.
                  </div>
                  <Link 
                    href="/budget"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-black font-semibold rounded-lg transition-colors text-sm"
                  >
                    <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                    Définir mes budgets
                  </Link>
                </div>
              ) : null}
              
              <form onSubmit={handleQuickAddExpense} className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <input
                  type="number"
                  step="0.01"
                  placeholder="Montant (FCFA)"
                  value={quickExpense.amount}
                  onChange={(e) => setQuickExpense({...quickExpense, amount: e.target.value})}
                  className="px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500"
                  required
                />
                <select
                  value={quickExpense.category_id}
                  onChange={(e) => setQuickExpense({...quickExpense, category_id: e.target.value})}
                  className="px-4 py-3 bg-white border border-white/10 rounded-xl text-black focus:outline-none focus:border-emerald-500"
                  required
                >
                  <option value="" className="text-black">
                    {budgetCategories.length > 0 ? 'Sélectionner une catégorie avec budget' : 'Aucun budget défini ce mois-ci'}
                  </option>
                  {budgetCategories.map(cat => (
                    <option key={cat.id} value={cat.id} className="text-black">{cat.name}</option>
                  ))}
                </select>
                <input
                  type="text"
                  placeholder="Description (optionnel)"
                  value={quickExpense.description}
                  onChange={(e) => setQuickExpense({...quickExpense, description: e.target.value})}
                  className="px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500"
                />
                <button
                  type="submit"
                  className="px-6 py-3 bg-emerald-500 hover:bg-emerald-400 text-black font-semibold rounded-xl transition-colors"
                >
                  Ajouter
                </button>
              </form>
            </div>
          )}

          {/* Stats */}
          {statsLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-10">
              {[1,2,3,4].map(i => (
                <div key={i} className="bg-white/3 border border-white/5 rounded-2xl p-6 animate-pulse">
                  <div className="h-8 w-8 bg-white/10 rounded-lg mb-3"></div>
                  <div className="h-4 bg-white/10 rounded mb-2"></div>
                  <div className="h-3 bg-white/5 rounded w-3/4"></div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-10">
              {stats.map((stat, index) => (
                <div
                  key={index}
                  className={`bg-gradient-to-br ${stat.couleur} border border-white/5 rounded-2xl p-6 hover:scale-105 transition-transform duration-200`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="text-3xl">{stat.icone}</div>
                    {stat.trend && (
                      <div className={`flex items-center gap-1 text-xs ${stat.trend.color}`}>
                        <span>{stat.trend.icon}</span>
                        <span>{stat.trend.percentage.toFixed(1)}%</span>
                      </div>
                    )}
                  </div>
                  <div className="text-white font-semibold text-sm mb-1">{stat.label}</div>
                  <div className="text-white text-2xl font-bold">{stat.valeur}</div>
                  {stat.trend && (
                    <div className="text-white/60 text-xs mt-2">
                      {stat.trend.label} vs mois dernier
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Dépenses récentes */}
          <div className="bg-white/3 border border-white/5 rounded-2xl p-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-white">Dépenses récentes</h2>
              <a href="/depenses" className="text-emerald-400 hover:text-emerald-300 text-sm transition-colors">
                Voir tout →
              </a>
            </div>
            
            {statsLoading ? (
              <div className="space-y-4">
                {[1,2,3,4,5].map(i => (
                  <div key={i} className="flex items-center justify-between p-4 bg-white/5 rounded-xl animate-pulse">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-white/10 rounded-lg"></div>
                      <div>
                        <div className="h-4 bg-white/10 rounded w-32 mb-2"></div>
                        <div className="h-3 bg-white/5 rounded w-24"></div>
                      </div>
                    </div>
                    <div className="h-5 bg-white/10 rounded w-20"></div>
                  </div>
                ))}
              </div>
            ) : recentExpenses.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-4xl mb-4">�</div>
                <p className="text-zinc-400">Aucune dépense ce mois-ci</p>
                <button
                  onClick={() => setShowQuickAdd(true)}
                  className="mt-4 px-6 py-2 bg-emerald-500 hover:bg-emerald-400 text-black font-semibold rounded-xl transition-colors"
                >
                  Ajouter votre première dépense
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {recentExpenses.map((expense) => (
                  <div key={expense.id} className="flex items-center justify-between p-4 bg-white/5 rounded-xl hover:bg-white/10 transition-colors">
                    <div className="flex items-center gap-3">
                      <div 
                        className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-semibold"
                        style={{ backgroundColor: expense.categories?.color || '#6366f1' }}
                      >
                        {expense.categories?.icon || '�'}
                      </div>
                      <div>
                        <div className="text-white font-medium">{expense.description}</div>
                        <div className="text-zinc-400 text-sm">{expense.categories?.name}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-white font-semibold">-{expense.amount.toFixed(2)} FCFA</div>
                      <div className="text-zinc-500 text-xs">
                        {new Date(expense.expense_date).toLocaleDateString('fr-FR')}
                      </div>
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
