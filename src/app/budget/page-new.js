"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/layout/Sidebar";
import { supabase } from "@/lib/supabase";
import { getCurrentUser } from "@/lib/auth";
import { getBudgets, getExpenses, getCategories, createBudget, updateBudget, deleteBudget } from "@/lib/database";
import { useNotification } from "@/contexts/NotificationContext";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell
} from 'recharts';

export default function BudgetPage() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [budgets, setBudgets] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [categories, setCategories] = useState([]);
  const [statsLoading, setStatsLoading] = useState(true);
  const [showAddBudget, setShowAddBudget] = useState(false);
  const [editingBudget, setEditingBudget] = useState(null);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [formData, setFormData] = useState({
    category_id: '',
    amount: '',
    alert_threshold: 80
  });
  const router = useRouter();
  const { showSuccess, showError } = useNotification();

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
      
      const [budgetsData, expensesData, categoriesData] = await Promise.all([
        getBudgets(userId, selectedYear, selectedMonth + 1),
        getExpenses(userId, 1000),
        getCategories(userId)
      ]);
      
      setBudgets(budgetsData || []);
      setExpenses(expensesData || []);
      setCategories(categoriesData || []);
      
    } catch (error) {
      console.error('Erreur lors du chargement des budgets:', error);
      showError('Erreur lors du chargement des budgets');
    } finally {
      setStatsLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.category_id || !formData.amount) {
      showError('Veuillez remplir tous les champs obligatoires');
      return;
    }

    try {
      const budgetData = {
        user_id: user.id,
        category_id: formData.category_id,
        amount: parseFloat(formData.amount),
        alert_threshold: formData.alert_threshold,
        year: selectedYear,
        month: selectedMonth + 1
      };

      if (editingBudget) {
        await updateBudget(editingBudget.id, budgetData);
        showSuccess('Budget mis à jour avec succès !');
      } else {
        await createBudget(budgetData);
        showSuccess('Budget créé avec succès !');
      }

      // Réinitialiser le formulaire
      setFormData({
        category_id: '',
        amount: '',
        alert_threshold: 80
      });
      setShowAddBudget(false);
      setEditingBudget(null);
      
      // Recharger les données
      loadBudgets(user.id);
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
      showError('Erreur lors de la sauvegarde du budget');
    }
  };

  const handleEdit = (budget) => {
    setEditingBudget(budget);
    setFormData({
      category_id: budget.category_id,
      amount: budget.amount.toString(),
      alert_threshold: budget.alert_threshold
    });
    setShowAddBudget(true);
  };

  const handleDelete = async (budgetId) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce budget ?')) {
      return;
    }

    try {
      await deleteBudget(budgetId);
      showSuccess('Budget supprimé avec succès !');
      loadBudgets(user.id);
    } catch (error) {
      console.error('Erreur lors de la suppression:', error);
      showError('Erreur lors de la suppression du budget');
    }
  };

  const calculateBudgetStats = () => {
    return budgets.map(budget => {
      // Calculer les dépenses pour cette catégorie et cette période
      const categoryExpenses = expenses.filter(exp => {
        const expDate = new Date(exp.expense_date);
        return exp.category_id === budget.category_id && 
               expDate.getFullYear() === selectedYear && 
               expDate.getMonth() === selectedMonth;
      });

      const totalSpent = categoryExpenses.reduce((sum, exp) => sum + exp.amount, 0);
      const remaining = budget.amount - totalSpent;
      const percentageUsed = (totalSpent / budget.amount) * 100;
      const isOverBudget = percentageUsed > budget.alert_threshold;
      const isExceeded = totalSpent > budget.amount;

      return {
        ...budget,
        totalSpent,
        remaining,
        percentageUsed,
        isOverBudget,
        isExceeded
      };
    });
  };

  const budgetsWithStats = calculateBudgetStats();
  const totalBudget = budgetsWithStats.reduce((sum, b) => sum + b.amount, 0);
  const totalSpent = budgetsWithStats.reduce((sum, b) => sum + b.totalSpent, 0);
  const totalRemaining = totalBudget - totalSpent;

  const chartData = budgetsWithStats.map(budget => ({
    name: budget.categories?.name || 'Inconnu',
    budget: budget.amount,
    spent: budget.totalSpent,
    remaining: budget.remaining
  }));

  const COLORS = ['#10b981', '#f59e0b', '#3b82f6', '#8b5cf6', '#ef4444', '#f97316'];

  if (loading) {
    return (
      <div className="min-h-screen bg-[#080808] flex items-center justify-center">
        <div className="text-white">Chargement...</div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-[#080808] font-sans">
      <Sidebar />
      
      <main className="flex-1 overflow-y-auto pb-20 md:pb-0">
        <div className="max-w-7xl mx-auto px-6 py-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-white">Budget</h1>
              <p className="text-zinc-400 mt-2 text-sm">Gérez vos budgets mensuels</p>
            </div>
            <button
              onClick={() => setShowAddBudget(true)}
              className="px-6 py-3 bg-emerald-500 hover:bg-emerald-400 text-black font-semibold rounded-xl transition-all duration-200 hover:scale-105 flex items-center gap-2"
            >
              <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              Nouveau budget
            </button>
          </div>

          {/* Sélecteur de période */}
          <div className="bg-white/3 border border-white/5 rounded-2xl p-6 mb-8">
            <h3 className="text-white font-semibold mb-4">Période</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-white mb-2">Mois</label>
                <select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-emerald-500"
                >
                  {['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'].map((month, index) => (
                    <option key={index} value={index}>{month}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-white mb-2">Année</label>
                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-emerald-500"
                >
                  {[2024, 2023, 2022].map(year => (
                    <option key={year} value={year}>{year}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Statistiques globales */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white/3 border border-white/5 rounded-2xl p-6">
              <div className="text-3xl mb-3">💰</div>
              <div className="text-zinc-400 text-sm mb-1">Budget total</div>
              <div className="text-white text-2xl font-bold">{totalBudget.toFixed(2)} FCFA</div>
            </div>
            <div className="bg-white/3 border border-white/5 rounded-2xl p-6">
              <div className="text-3xl mb-3">💸</div>
              <div className="text-zinc-400 text-sm mb-1">Dépensé</div>
              <div className="text-white text-2xl font-bold">{totalSpent.toFixed(2)} FCFA</div>
            </div>
            <div className="bg-white/3 border border-white/5 rounded-2xl p-6">
              <div className="text-3xl mb-3">🎯</div>
              <div className="text-zinc-400 text-sm mb-1">Restant</div>
              <div className="text-white text-2xl font-bold">{totalRemaining.toFixed(2)} FCFA</div>
            </div>
          </div>

          {/* Graphique des budgets */}
          <div className="bg-white/3 border border-white/5 rounded-2xl p-8 mb-8">
            <h3 className="text-white font-semibold mb-6">Budget vs Dépenses</h3>
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="name" stroke="#9ca3af" />
                  <YAxis stroke="#9ca3af" />
                  <Tooltip 
                    formatter={(value, name) => [
                      name === 'budget' ? `Budget: ${value.toFixed(2)} FCFA` : 
                      name === 'spent' ? `Dépensé: ${value.toFixed(2)} FCFA` : 
                      `Restant: ${value.toFixed(2)} FCFA`,
                      ''
                    ]}
                    contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '8px' }}
                  />
                  <Bar dataKey="budget" fill="#10b981" />
                  <Bar dataKey="spent" fill="#ef4444" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-64 flex items-center justify-center text-zinc-400">
                Aucune donnée à afficher
              </div>
            )}
          </div>

          {/* Liste des budgets */}
          <div className="bg-white/3 border border-white/5 rounded-2xl p-8">
            <h3 className="text-white font-semibold mb-6">Détail par catégorie</h3>
            
            {statsLoading ? (
              <div className="space-y-4">
                {[1,2,3,4,5].map(i => (
                  <div key={i} className="p-4 bg-white/5 rounded-xl animate-pulse">
                    <div className="h-4 bg-white/10 rounded w-32 mb-2"></div>
                    <div className="h-3 bg-white/5 rounded w-24"></div>
                  </div>
                ))}
              </div>
            ) : budgetsWithStats.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-4xl mb-4">🎯</div>
                <p className="text-zinc-400">Aucun budget défini</p>
                <button
                  onClick={() => setShowAddBudget(true)}
                  className="mt-4 px-6 py-2 bg-emerald-500 hover:bg-emerald-400 text-black font-semibold rounded-xl transition-colors"
                >
                  Créer votre premier budget
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {budgetsWithStats.map((budget, index) => (
                  <div key={budget.id} className={`p-4 rounded-xl border ${
                    budget.isExceeded ? 'bg-red-500/10 border-red-500/20' : 
                    budget.isOverBudget ? 'bg-orange-500/10 border-orange-500/20' : 
                    'bg-white/5 border-white/10'
                  }`}>
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div 
                          className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-semibold"
                          style={{ backgroundColor: budget.categories?.color || '#6366f1' }}
                        >
                          {budget.categories?.icon || '📝'}
                        </div>
                        <div>
                          <div className="text-white font-medium">{budget.categories?.name}</div>
                          <div className="text-zinc-400 text-sm">
                            Budget: {budget.amount.toFixed(2)} FCFA
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEdit(budget)}
                          className="p-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 rounded-lg transition-colors"
                        >
                          <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828L8.586-8.586z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleDelete(budget.id)}
                          className="p-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg transition-colors"
                        >
                          <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </div>
                    
                    {/* Barre de progression */}
                    <div className="mb-3">
                      <div className="flex justify-between text-sm text-zinc-400 mb-1">
                        <span>{budget.totalSpent.toFixed(2)} FCFA dépensé</span>
                        <span>{budget.remaining.toFixed(2)} FCFA restant</span>
                      </div>
                      <div className="w-full bg-white/10 rounded-full h-3 overflow-hidden">
                        <div 
                          className={`h-full transition-all duration-300 ${
                            budget.isExceeded ? 'bg-red-500' :
                            budget.isOverBudget ? 'bg-orange-500' :
                            budget.percentageUsed > 60 ? 'bg-yellow-500' :
                            'bg-emerald-500'
                          }`}
                          style={{ width: `${Math.min(budget.percentageUsed, 100)}%` }}
                        ></div>
                      </div>
                    </div>
                    
                    {/* Alertes */}
                    {budget.isExceeded && (
                      <div className="flex items-center gap-2 text-red-400 text-sm">
                        <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 2.502H9.5c-.962 0-1.7-.742-1.7-1.66V9.172c0-.99.638-1.7-1.66-1.7H5.25c-.99 0-1.7.742-1.7 1.66v4.668c0 .99.638 1.7 1.66 1.7h8.5c.962 0 1.7-.742 1.7-1.66V9.172c0-.99-.638-1.7-1.66-1.7z" />
                        </svg>
                        <span>Budget dépassé de {(budget.totalSpent - budget.amount).toFixed(2)} FCFA</span>
                      </div>
                    )}
                    
                    {budget.isOverBudget && !budget.isExceeded && (
                      <div className="flex items-center gap-2 text-orange-400 text-sm">
                        <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 2.502H9.5c-.962 0-1.7-.742-1.7-1.66V9.172c0-.99.638-1.7-1.66-1.7H5.25c-.99 0-1.7.742-1.7 1.66v4.668C0 .99.638 1.7 1.66 1.7h8.5c.962 0 1.7-.742 1.7-1.66V9.172c0-.99-.638-1.7-1.66-1.7z" />
                        </svg>
                        <span>Alerte: {budget.percentageUsed.toFixed(0)}% du budget utilisé</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Formulaire d'ajout/modification */}
          {showAddBudget && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
              <div className="bg-[#080808] border border-white/10 rounded-2xl p-8 max-w-md w-full">
                <h3 className="text-xl font-semibold text-white mb-6">
                  {editingBudget ? 'Modifier le budget' : 'Ajouter un budget'}
                </h3>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-white mb-2">Catégorie</label>
                    <select
                      value={formData.category_id}
                      onChange={(e) => setFormData({...formData, category_id: e.target.value})}
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-emerald-500"
                      required
                    >
                      <option value="">Sélectionner une catégorie</option>
                      {categories.map(cat => (
                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-white mb-2">Montant du budget (FCFA)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.amount}
                      onChange={(e) => setFormData({...formData, amount: e.target.value})}
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500"
                      placeholder="10000"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-white mb-2">
                      Seuil d'alerte ({formData.alert_threshold}%)
                    </label>
                    <input
                      type="range"
                      min="50"
                      max="100"
                      value={formData.alert_threshold}
                      onChange={(e) => setFormData({...formData, alert_threshold: parseInt(e.target.value)})}
                      className="w-full"
                    />
                    <div className="flex justify-between text-xs text-zinc-400 mt-1">
                      <span>50%</span>
                      <span>{formData.alert_threshold}%</span>
                      <span>100%</span>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <button
                      type="submit"
                      className="flex-1 px-6 py-3 bg-emerald-500 hover:bg-emerald-400 text-black font-semibold rounded-xl transition-colors"
                    >
                      {editingBudget ? 'Mettre à jour' : 'Ajouter'}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowAddBudget(false);
                        setEditingBudget(null);
                        setFormData({
                          category_id: '',
                          amount: '',
                          alert_threshold: 80
                        });
                      }}
                      className="flex-1 px-6 py-3 bg-white/10 hover:bg-white/20 text-white font-semibold rounded-xl transition-colors"
                    >
                      Annuler
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
