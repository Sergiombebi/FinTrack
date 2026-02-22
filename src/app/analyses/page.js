"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/layout/Sidebar";
import { supabase } from "@/lib/supabase";
import { getCurrentUser } from "@/lib/auth";
import { getMonthlyStats, getExpenses, getCategories } from "@/lib/database";
import { useNotification } from "@/contexts/NotificationContext";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  Legend
} from 'recharts';

export default function AnalysesPage() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [expenses, setExpenses] = useState([]);
  const [categories, setCategories] = useState([]);
  const [statsLoading, setStatsLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('month');
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const router = useRouter();
  const { showSuccess, showError } = useNotification();

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
      
      // Charger les données selon la période
      let expensesData;
      if (timeRange === 'month') {
        expensesData = await getExpenses(userId, 100);
        // Filtrer pour le mois sélectionné
        expensesData = expensesData.filter(exp => {
          const expDate = new Date(exp.expense_date);
          return expDate.getFullYear() === selectedYear && expDate.getMonth() === selectedMonth;
        });
      } else if (timeRange === 'year') {
        expensesData = await getExpenses(userId, 500);
        // Filtrer pour l'année sélectionnée
        expensesData = expensesData.filter(exp => {
          const expDate = new Date(exp.expense_date);
          return expDate.getFullYear() === selectedYear;
        });
      } else {
        expensesData = await getExpenses(userId, 1000);
      }
      
      const categoriesData = await getCategories(userId);
      
      setExpenses(expensesData);
      setCategories(categoriesData);
      
      // Calculer les statistiques
      const monthlyStats = calculateStats(expensesData, categoriesData);
      setStats(monthlyStats);
      
    } catch (error) {
      console.error('Erreur lors du chargement des analyses:', error);
      showError('Erreur lors du chargement des analyses');
    } finally {
      setStatsLoading(false);
    }
  };

  const calculateStats = (expensesData, categoriesData) => {
    const totalExpenses = expensesData.reduce((sum, exp) => sum + exp.amount, 0);
    const transactionCount = expensesData.length;
    const averageExpense = transactionCount > 0 ? totalExpenses / transactionCount : 0;

    // Dépenses par catégorie
    const expensesByCategory = categoriesData.map(category => {
      const categoryExpenses = expensesData.filter(exp => exp.category_id === category.id);
      return {
        name: category.name,
        value: categoryExpenses.reduce((sum, exp) => sum + exp.amount, 0),
        color: category.color,
        icon: category.icon,
        count: categoryExpenses.length
      };
    }).filter(cat => cat.value > 0);

    // Évolution mensuelle
    const monthlyEvolution = calculateMonthlyEvolution(expensesData);

    return {
      totalExpenses,
      transactionCount,
      averageExpense,
      expensesByCategory,
      monthlyEvolution
    };
  };

  const calculateMonthlyEvolution = (expensesData) => {
    const monthlyData = {};
    
    expensesData.forEach(expense => {
      const date = new Date(expense.expense_date);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      
      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = 0;
      }
      monthlyData[monthKey] += expense.amount;
    });

    return Object.entries(monthlyData)
      .map(([month, total]) => ({
        month: month.split('-')[1] + '/' + month.split('-')[0].substr(2),
        total
      }))
      .sort((a, b) => {
        const [monthA, yearA] = a.month.split('/');
        const [monthB, yearB] = b.month.split('/');
        if (yearA !== yearB) return yearA - yearB;
        return monthA - monthB;
      })
      .slice(-6); // Derniers 6 mois
  };

  const pieChartData = stats?.expensesByCategory || [];
  const lineChartData = stats?.monthlyEvolution || [];

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
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-white">Analyses financières</h1>
            <p className="text-zinc-400 mt-2 text-sm">Visualisez et analysez vos dépenses</p>
          </div>

          {/* Filtres */}
          <div className="bg-white/3 border border-white/5 rounded-2xl p-6 mb-8">
            <h3 className="text-white font-semibold mb-4">Période d'analyse</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-white mb-2">Période</label>
                <select
                  value={timeRange}
                  onChange={(e) => setTimeRange(e.target.value)}
                  className="w-full px-4 py-3 bg-white border border-white/10 rounded-xl text-black focus:outline-none focus:border-emerald-500"
                >
                  <option value="month">Mois</option>
                  <option value="year">Année</option>
                  <option value="all">Tout le temps</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-white mb-2">Année</label>
                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                  className="w-full px-4 py-3 bg-white border border-white/10 rounded-xl text-black focus:outline-none focus:border-emerald-500"
                >
                  {[2026, 2025, 2024, 2023, 2022].map(year => (
                    <option key={year} value={year}>{year}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-white mb-2">Mois</label>
                <select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                  disabled={timeRange !== 'month'}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-emerald-500 disabled:opacity-50"
                >
                  {['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'].map((month, index) => (
                    <option key={index} value={index}>{month}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {statsLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="bg-white/3 border border-white/5 rounded-2xl p-8 animate-pulse">
                <div className="h-64 bg-white/5 rounded-lg"></div>
              </div>
              <div className="bg-white/3 border border-white/5 rounded-2xl p-8 animate-pulse">
                <div className="h-64 bg-white/5 rounded-lg"></div>
              </div>
            </div>
          ) : (
            <>
              {/* Statistiques principales */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                <div className="bg-white/3 border border-white/5 rounded-2xl p-6">
                  <div className="text-3xl mb-3">💰</div>
                  <div className="text-zinc-400 text-sm mb-1">Total des dépenses</div>
                  <div className="text-white text-2xl font-bold">{stats?.totalExpenses?.toFixed(2) || '0'} FCFA</div>
                </div>
                <div className="bg-white/3 border border-white/5 rounded-2xl p-6">
                  <div className="text-3xl mb-3">📊</div>
                  <div className="text-zinc-400 text-sm mb-1">Transactions</div>
                  <div className="text-white text-2xl font-bold">{stats?.transactionCount || 0}</div>
                </div>
                <div className="bg-white/3 border border-white/5 rounded-2xl p-6">
                  <div className="text-3xl mb-3">📈</div>
                  <div className="text-zinc-400 text-sm mb-1">Moyenne par dépense</div>
                  <div className="text-white text-2xl font-bold">{stats?.averageExpense?.toFixed(2) || '0'} FCFA</div>
                </div>
                <div className="bg-white/3 border border-white/5 rounded-2xl p-6">
                  <div className="text-3xl mb-3">🏷️</div>
                  <div className="text-zinc-400 text-sm mb-1">Catégories utilisées</div>
                  <div className="text-white text-2xl font-bold">{stats?.expensesByCategory?.length || 0}</div>
                </div>
              </div>

              {/* Graphiques */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                {/* Graphique en camembert */}
                <div className="bg-white/3 border border-white/5 rounded-2xl p-8">
                  <h3 className="text-white font-semibold mb-6">Répartition par catégorie</h3>
                  {pieChartData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={pieChartData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {pieChartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value) => `${value.toFixed(2)} FCFA`} />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-64 flex items-center justify-center text-zinc-400">
                      Aucune donnée à afficher
                    </div>
                  )}
                </div>

                {/* Graphique d'évolution */}
                <div className="bg-white/3 border border-white/5 rounded-2xl p-8">
                  <h3 className="text-white font-semibold mb-6">Évolution mensuelle</h3>
                  {lineChartData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={lineChartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                        <XAxis dataKey="month" stroke="#9ca3af" />
                        <YAxis stroke="#9ca3af" />
                        <Tooltip 
                          formatter={(value) => [`${value.toFixed(2)} FCFA`, 'Total']}
                          contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '8px' }}
                        />
                        <Line 
                          type="monotone" 
                          dataKey="total" 
                          stroke="#10b981" 
                          strokeWidth={2}
                          dot={{ fill: '#10b981', r: 4 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-64 flex items-center justify-center text-zinc-400">
                      Aucune donnée à afficher
                    </div>
                  )}
                </div>
              </div>

              {/* Tableau des catégories */}
              <div className="bg-white/3 border border-white/5 rounded-2xl p-8">
                <h3 className="text-white font-semibold mb-6">Détail par catégorie</h3>
                {stats?.expensesByCategory?.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-white">
                      <thead>
                        <tr className="border-b border-white/10">
                          <th className="text-left py-3 px-4">Catégorie</th>
                          <th className="text-right py-3 px-4">Montant total</th>
                          <th className="text-right py-3 px-4">Nombre</th>
                          <th className="text-right py-3 px-4">Moyenne</th>
                        </tr>
                      </thead>
                      <tbody>
                        {stats.expensesByCategory.map((category, index) => (
                          <tr key={index} className="border-b border-white/5 hover:bg-white/5">
                            <td className="py-3 px-4">
                              <div className="flex items-center gap-2">
                                <span className="text-lg">{category.icon}</span>
                                <span>{category.name}</span>
                              </div>
                            </td>
                            <td className="text-right py-3 px-4 font-semibold">{category.value.toFixed(2)} FCFA</td>
                            <td className="text-right py-3 px-4">{category.count}</td>
                            <td className="text-right py-3 px-4">
                              {category.count > 0 ? (category.value / category.count).toFixed(2) : '0'} FCFA
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-12 text-zinc-400">
                    Aucune dépense à analyser
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
