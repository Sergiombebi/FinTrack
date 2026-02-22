"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/layout/Sidebar";
import { supabase } from "@/lib/supabase";
import { getCurrentUser } from "@/lib/auth";
import { getExpenses, getCategories, createExpense, updateExpense, deleteExpense, createCategory, getBudgets } from "@/lib/database";
import { useNotification } from "@/contexts/NotificationContext";
import CreateCategoryModal from "@/components/ui/CreateCategoryModal";
import { defaultCategories } from "@/lib/default-categories";

export default function DepensesPage() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [expenses, setExpenses] = useState([]);
  const [categories, setCategories] = useState([]);
  const [budgets, setBudgets] = useState([]);
  const [budgetCategories, setBudgetCategories] = useState([]);
  const [statsLoading, setStatsLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);
  const [filters, setFilters] = useState({ category: '', dateRange: '', search: '' });
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [formData, setFormData] = useState({
    amount: '',
    category_id: '',
    description: '',
    expense_date: new Date().toISOString().split('T')[0]
  });
  const [newCategoryName, setNewCategoryName] = useState('');
  const [showAddCategory, setShowAddCategory] = useState(false);
  const router = useRouter();
  const { showSuccess, showError } = useNotification();

  const handleAddCategory = async () => {
    if (!newCategoryName.trim()) {
      showError('Le nom de la catégorie est requis');
      return;
    }

    try {
      const newCategory = await createCategory({
        name: newCategoryName.trim(),
        user_id: user.id
      });
      
      setCategories([...categories, newCategory]);
      setNewCategoryName('');
      setShowAddCategory(false);
      showSuccess('Catégorie ajoutée avec succès');
    } catch (error) {
      console.error('Erreur lors de l\'ajout de la catégorie:', error);
      showError('Erreur lors de l\'ajout de la catégorie');
    }
  };

  const checkBudgetStatus = (categoryId) => {
    const budget = budgets.find(b => b.category_id === categoryId);
    if (!budget) return null;

    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    
    const categoryExpenses = expenses.filter(exp => {
      const expDate = new Date(exp.expense_date);
      return exp.category_id === categoryId && 
             expDate.getMonth() === currentMonth && 
             expDate.getFullYear() === currentYear;
    });

    const totalSpent = categoryExpenses.reduce((sum, exp) => sum + exp.amount, 0);
    const remaining = budget.amount - totalSpent;
    const percentageUsed = (totalSpent / budget.amount) * 100;
    const isOverBudget = percentageUsed > budget.alert_threshold;
    const isExceeded = totalSpent > budget.amount;

    return {
      budget,
      totalSpent,
      remaining,
      percentageUsed,
      isOverBudget,
      isExceeded
    };
  };

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
      
      // Charger les données
      loadData(user.id);
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

  const loadData = async (userId) => {
    try {
      setStatsLoading(true);
      
      const [expensesData, categoriesData, budgetsData] = await Promise.all([
        getExpenses(userId, 100),
        getCategories(userId),
        getBudgets(userId, new Date().getFullYear(), new Date().getMonth() + 1)
      ]);
      
      let finalCategories = categoriesData || [];
      
      // Si aucune catégorie n'existe, créer les catégories par défaut
      if (!categoriesData || categoriesData.length === 0) {
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
      
      setExpenses(expensesData || []);
      setCategories(finalCategories);
      setBudgets(budgetsData || []);
      
      // Filtrer les catégories qui ont un budget défini
      const budgetCategoryIds = (budgetsData || []).map(b => b.category_id);
      const filteredCategories = (finalCategories || []).filter(cat => 
        budgetCategoryIds.includes(cat.id)
      );
      setBudgetCategories(filteredCategories);
    } catch (error) {
      console.error('Erreur lors du chargement des données:', error);
      showError('Erreur lors du chargement des données');
    } finally {
      setStatsLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.amount || !formData.category_id) {
      showError('Veuillez remplir tous les champs obligatoires');
      return;
    }

    try {
      const expenseData = {
        user_id: user.id,
        amount: parseFloat(formData.amount),
        category_id: formData.category_id,
        description: formData.description,
        expense_date: formData.expense_date
      };

      if (editingExpense) {
        // Mise à jour
        await updateExpense(editingExpense.id, expenseData);
        showSuccess('Dépense mise à jour avec succès !');
      } else {
        // Création
        await createExpense(expenseData);
        showSuccess('Dépense ajoutée avec succès !');
      }

      // Réinitialiser le formulaire
      setFormData({
        amount: '',
        category_id: '',
        description: '',
        expense_date: new Date().toISOString().split('T')[0]
      });
      setShowAddForm(false);
      setEditingExpense(null);
      
      // Recharger les données
      loadData(user.id);
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
      showError('Erreur lors de la sauvegarde de la dépense');
    }
  };

  const handleEdit = (expense) => {
    setEditingExpense(expense);
    setFormData({
      amount: expense.amount.toString(),
      category_id: expense.category_id,
      description: expense.description,
      expense_date: expense.expense_date.split('T')[0]
    });
    setShowAddForm(true);
  };

  const handleDelete = async (expenseId) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette dépense ?')) {
      return;
    }

    try {
      await deleteExpense(expenseId);
      showSuccess('Dépense supprimée avec succès !');
      loadData(user.id);
    } catch (error) {
      console.error('Erreur lors de la suppression:', error);
      showError('Erreur lors de la suppression de la dépense');
    }
  };

  const filteredExpenses = expenses.filter(expense => {
    if (filters.category && expense.category_id !== filters.category) return false;
    if (filters.search && !expense.description.toLowerCase().includes(filters.search.toLowerCase())) return false;
    return true;
  });

  const totalExpenses = filteredExpenses.reduce((sum, expense) => sum + expense.amount, 0);

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
              <h1 className="text-3xl font-bold text-white">Dépenses</h1>
              <p className="text-zinc-400 mt-2 text-sm">Gérez toutes vos dépenses</p>
            </div>
            <button
              onClick={() => setShowAddForm(true)}
              className="px-6 py-3 bg-emerald-500 hover:bg-emerald-400 text-black font-semibold rounded-xl transition-all duration-200 hover:scale-105 flex items-center gap-2"
            >
              <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              Nouvelle dépense
            </button>
          </div>

          {/* Statistiques */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white/3 border border-white/5 rounded-2xl p-6">
              <div className="text-2xl mb-3">💰</div>
              <div className="text-zinc-400 text-sm mb-1">Total des dépenses</div>
              <div className="text-white text-2xl font-bold">{totalExpenses.toFixed(2)} FCFA</div>
            </div>
            <div className="bg-white/3 border border-white/5 rounded-2xl p-6">
              <div className="text-2xl mb-3">📊</div>
              <div className="text-zinc-400 text-sm mb-1">Nombre de transactions</div>
              <div className="text-white text-2xl font-bold">{filteredExpenses.length}</div>
            </div>
            <div className="bg-white/3 border border-white/5 rounded-2xl p-6">
              <div className="text-2xl mb-3">💸</div>
              <div className="text-zinc-400 text-sm mb-1">Moyenne par dépense</div>
              <div className="text-white text-2xl font-bold">
                {filteredExpenses.length > 0 ? (totalExpenses / filteredExpenses.length).toFixed(2) : '0'} FCFA
              </div>
            </div>
          </div>

          {/* Filtres */}
          <div className="bg-white/3 border border-white/5 rounded-2xl p-6 mb-8">
            <h3 className="text-white font-semibold mb-4">Filtres</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <input
                type="text"
                placeholder="Rechercher une dépense..."
                value={filters.search}
                onChange={(e) => setFilters({...filters, search: e.target.value})}
                className="px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500"
              />
              <select
                value={filters.category}
                onChange={(e) => setFilters({...filters, category: e.target.value})}
                className="px-4 py-3 bg-white border border-white/10 rounded-xl text-black focus:outline-none focus:border-emerald-500"
              >
                <option value="">Toutes les catégories</option>
                {categories.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
              <input
                type="date"
                value={filters.dateRange}
                onChange={(e) => setFilters({...filters, dateRange: e.target.value})}
                className="px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          {/* Formulaire d'ajout/modification */}
          {showAddForm && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
              <div className="bg-[#080808] border border-white/10 rounded-2xl p-8 max-w-md w-full">
                <h3 className="text-xl font-semibold text-white mb-6">
                  {editingExpense ? 'Modifier la dépense' : 'Ajouter une dépense'}
                </h3>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-white mb-2">Montant (FCFA)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.amount}
                      onChange={(e) => setFormData({...formData, amount: e.target.value})}
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-white mb-2">Catégorie</label>
                    <div className="space-y-2">
                      {budgetCategories.length === 0 && (
                        <div className="bg-orange-500/20 border border-orange-500/30 rounded-lg p-3 mb-2">
                          <div className="flex items-center gap-2 text-orange-400 font-semibold mb-1">
                            <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span>Aucun budget défini ce mois-ci</span>
                          </div>
                          <div className="text-orange-300 text-sm">
                            Pour ajouter une dépense, vous devez d'abord définir des budgets.
                          </div>
                        </div>
                      )}
                      
                      <select
                        value={formData.category_id}
                        onChange={(e) => setFormData({...formData, category_id: e.target.value})}
                        className="w-full px-4 py-3 bg-white border border-white/10 rounded-xl text-black focus:outline-none focus:border-emerald-500"
                        required
                      >
                        <option value="" className="text-black">
                          {budgetCategories.length > 0 ? 'Sélectionner une catégorie avec budget' : 'Aucun budget défini ce mois-ci'}
                        </option>
                        {budgetCategories.map(cat => (
                          <option key={cat.id} value={cat.id} className="text-black">{cat.name}</option>
                        ))}
                      </select>
                      <button
                        type="button"
                        onClick={() => setShowAddCategory(!showAddCategory)}
                        className="w-full px-4 py-2 bg-emerald-500/20 border border-emerald-500/30 rounded-xl text-emerald-400 hover:bg-emerald-500/30 transition-colors text-sm"
                      >
                        {showAddCategory ? 'Annuler' : '+ Ajouter une nouvelle catégorie'}
                      </button>
                      {showAddCategory && (
                        <div className="flex space-x-2">
                          <input
                            type="text"
                            value={newCategoryName}
                            onChange={(e) => setNewCategoryName(e.target.value)}
                            className="flex-1 px-4 py-2 bg-white border border-white/10 rounded-xl text-black placeholder-zinc-500 focus:outline-none focus:border-emerald-500"
                            placeholder="Nom de la nouvelle catégorie"
                          />
                          <button
                            type="button"
                            onClick={handleAddCategory}
                            className="px-4 py-2 bg-emerald-500 text-white rounded-xl hover:bg-emerald-600 transition-colors"
                          >
                            Ajouter
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Alertes de budget */}
                  {formData.category_id && (() => {
                    const budgetStatus = checkBudgetStatus(formData.category_id);
                    if (!budgetStatus) return null;

                    const { budget, totalSpent, remaining, percentageUsed, isOverBudget, isExceeded } = budgetStatus;

                    return (
                      <div className="space-y-2">
                        {isExceeded && (
                          <div className="bg-red-500/20 border border-red-500/30 rounded-lg p-3">
                            <div className="flex items-center gap-2 text-red-400 font-semibold">
                              <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 2.502H9.5c-.962 0-1.7-.742-1.7-1.66V9.172c0-.99.638-1.7-1.66-1.7H5.25c-.99 0-1.7.742-1.7 1.66v4.668c0 .99.638 1.7 1.66 1.7h8.5c.962 0 1.7-.742 1.7-1.66V9.172c0-.99-.638-1.7-1.66-1.7z" />
                              </svg>
                              <span>⚠️ BUDGET DÉPASSÉ !</span>
                            </div>
                            <div className="text-red-300 text-sm mt-1">
                              Budget: {budget.amount.toFixed(2)} FCFA | Dépensé: {totalSpent.toFixed(2)} FCFA
                            </div>
                            <div className="text-red-300 text-sm">
                              Dépassement de {(totalSpent - budget.amount).toFixed(2)} FCFA
                            </div>
                          </div>
                        )}
                        
                        {isOverBudget && !isExceeded && (
                          <div className="bg-orange-500/20 border border-orange-500/30 rounded-lg p-3">
                            <div className="flex items-center gap-2 text-orange-400 font-semibold">
                              <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 2.502H9.5c-.962 0-1.7-.742-1.7-1.66V9.172c0-.99.638-1.7-1.66-1.7H5.25c-.99 0-1.7.742-1.7 1.66v4.668C0 .99.638 1.7 1.66 1.7h8.5c.962 0 1.7-.742 1.7-1.66V9.172c0-.99-.638-1.7-1.66-1.7z" />
                              </svg>
                              <span>⚠️ ALERTE BUDGET</span>
                            </div>
                            <div className="text-orange-300 text-sm mt-1">
                              {percentageUsed.toFixed(0)}% du budget utilisé ({remaining.toFixed(2)} FCFA restants)
                            </div>
                          </div>
                        )}

                        {percentageUsed >= 90 && !isExceeded && !isOverBudget && (
                          <div className="bg-yellow-500/20 border border-yellow-500/30 rounded-lg p-3">
                            <div className="flex items-center gap-2 text-yellow-400 font-semibold">
                              <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 2.502H9.5c-.962 0-1.7-.742-1.7-1.66V9.172c0-.99.638-1.7-1.66-1.7H5.25c-.99 0-1.7.742-1.7 1.66v4.668C0 .99.638 1.7 1.66 1.7h8.5c.962 0 1.7-.742 1.7-1.66V9.172c0-.99-.638-1.7-1.66-1.7z" />
                              </svg>
                              <span>ATTENTION</span>
                            </div>
                            <div className="text-yellow-300 text-sm mt-1">
                              {percentageUsed.toFixed(0)}% du budget utilisé - Plus que {remaining.toFixed(2)} FCFA disponibles
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })()}
                  <div>
                    <label className="block text-sm font-medium text-white mb-2">Description</label>
                    <input
                      type="text"
                      value={formData.description}
                      onChange={(e) => setFormData({...formData, description: e.target.value})}
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500"
                      placeholder="Description de la dépense"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-white mb-2">Date</label>
                    <input
                      type="date"
                      value={formData.expense_date}
                      onChange={(e) => setFormData({...formData, expense_date: e.target.value})}
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-emerald-500"
                      required
                    />
                  </div>
                  <div className="flex gap-4">
                    <button
                      type="submit"
                      className="flex-1 px-6 py-3 bg-emerald-500 hover:bg-emerald-400 text-black font-semibold rounded-xl transition-colors"
                    >
                      {editingExpense ? 'Mettre à jour' : 'Ajouter'}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowAddForm(false);
                        setEditingExpense(null);
                        setFormData({
                          amount: '',
                          category_id: '',
                          description: '',
                          expense_date: new Date().toISOString().split('T')[0]
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
          )}

          {/* Liste des dépenses */}
          <div className="bg-white/3 border border-white/5 rounded-2xl p-8">
            <h2 className="text-xl font-semibold text-white mb-6">Liste des dépenses</h2>
            
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
            ) : filteredExpenses.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-4xl mb-4">📝</div>
                <p className="text-zinc-400">Aucune dépense trouvée</p>
                <div className="flex gap-4 justify-center mt-4">
                  <button
                    onClick={() => setShowAddForm(true)}
                    className="px-6 py-2 bg-emerald-500 hover:bg-emerald-400 text-black font-semibold rounded-xl transition-colors"
                  >
                    Ajouter votre première dépense
                  </button>
                  {categories.length === 0 && (
                    <button
                      onClick={() => setShowCategoryModal(true)}
                      className="px-6 py-2 bg-blue-500 hover:bg-blue-400 text-white font-semibold rounded-xl transition-colors"
                    >
                      Créer des catégories
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredExpenses.map((expense) => (
                  <div key={expense.id} className="flex items-center justify-between p-4 bg-white/5 rounded-xl hover:bg-white/10 transition-colors">
                    <div className="flex items-center gap-3">
                      <div 
                        className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-semibold"
                        style={{ backgroundColor: expense.categories?.color || '#6366f1' }}
                      >
                        {expense.categories?.icon || '📝'}
                      </div>
                      <div>
                        <div className="text-white font-medium">{expense.description}</div>
                        <div className="text-zinc-400 text-sm">{expense.categories?.name}</div>
                        <div className="text-zinc-500 text-xs">
                          {new Date(expense.expense_date).toLocaleDateString('fr-FR')}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <div className="text-white font-semibold">-{expense.amount.toFixed(2)} FCFA</div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEdit(expense)}
                          className="p-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 rounded-lg transition-colors"
                        >
                          <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleDelete(expense.id)}
                          className="p-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg transition-colors"
                        >
                          <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Modal de création de catégories */}
          <CreateCategoryModal
            userId={user?.id}
            isOpen={showCategoryModal}
            onClose={() => setShowCategoryModal(false)}
            onCategoryCreated={(newCategories) => {
              setCategories([...categories, ...newCategories]);
            }}
          />
        </div>
      </main>
    </div>
  );
}
