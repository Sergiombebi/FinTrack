import { supabase } from './supabase'

// CATEGORIES
export async function getCategories(userId) {
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .eq('user_id', userId)
    .order('name')
  
  if (error) throw error
  return data
}

export async function createCategory(category) {
  const { data, error } = await supabase
    .from('categories')
    .insert([category])
    .select()
    .single()
  
  if (error) throw error
  return data
}

// EXPENSES
export async function getExpenses(userId, limit = 50) {
  const { data, error } = await supabase
    .from('expenses')
    .select(`
      *,
      categories (name, color, icon)
    `)
    .eq('user_id', userId)
    .order('expense_date', { ascending: false })
    .limit(limit)
  
  if (error) throw error
  return data
}

export async function createExpense(expense) {
  const { data, error } = await supabase
    .from('expenses')
    .insert([expense])
    .select(`
      *,
      categories (name, color, icon)
    `)
    .single()
  
  if (error) throw error
  return data
}

export async function updateExpense(expenseId, expense) {
  const { data, error } = await supabase
    .from('expenses')
    .update(expense)
    .eq('id', expenseId)
    .select(`
      *,
      categories (name, color, icon)
    `)
    .single()
  
  if (error) throw error
  return data
}

export async function deleteExpense(expenseId) {
  const { error } = await supabase
    .from('expenses')
    .delete()
    .eq('id', expenseId)
  
  if (error) throw error
  return true
}

// STATISTICS
export async function getMonthlyStats(userId, year = new Date().getFullYear(), month = new Date().getMonth() + 1) {
  // Calculer les dates de début et de fin du mois
  const startDate = new Date(year, month - 1, 1).toISOString().split('T')[0];
  const endDate = new Date(year, month, 0).toISOString().split('T')[0]; // Dernier jour du mois
  
  // Total des dépenses du mois
  const { data: expenses, error: expensesError } = await supabase
    .from('expenses')
    .select('amount')
    .eq('user_id', userId)
    .gte('expense_date', startDate)
    .lte('expense_date', endDate)
  
  if (expensesError) throw expensesError
  
  const totalExpenses = expenses?.reduce((sum, exp) => sum + parseFloat(exp.amount), 0) || 0
  
  // Dépenses par catégorie
  const { data: categoryStats, error: categoryError } = await supabase
    .from('expenses')
    .select(`
      amount,
      categories (name, color, icon)
    `)
    .eq('user_id', userId)
    .gte('expense_date', startDate)
    .lte('expense_date', endDate)
  
  if (categoryError) throw categoryError
  
  const expensesByCategory = categoryStats?.reduce((acc, exp) => {
    const category = exp.categories
    if (!acc[category.name]) {
      acc[category.name] = {
        name: category.name,
        color: category.color,
        icon: category.icon,
        total: 0
      }
    }
    acc[category.name].total += parseFloat(exp.amount)
    return acc
  }, {})
  
  return {
    totalExpenses,
    expensesByCategory: Object.values(expensesByCategory),
    transactionCount: expenses?.length || 0
  }
}

// TENDANCES ET COMPARAISONS
export async function getMonthlyTrends(userId, months = 3) {
  const trends = [];
  const currentDate = new Date();
  
  for (let i = 0; i < months; i++) {
    const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    
    const stats = await getMonthlyStats(userId, year, month);
    trends.push({
      month: month - 1,
      year,
      monthName: ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'][month - 1],
      totalExpenses: stats?.totalExpenses || 0,
      transactionCount: stats?.transactionCount || 0
    });
  }
  
  return trends.reverse(); // Du plus ancien au plus récent
}

export async function getBudgetTrends(userId, months = 3) {
  const trends = [];
  const currentDate = new Date();
  
  for (let i = 0; i < months; i++) {
    const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    
    const budgets = await getBudgets(userId, year, month);
    const totalBudget = budgets?.reduce((sum, budget) => sum + budget.amount, 0) || 0;
    
    trends.push({
      month: month - 1,
      year,
      monthName: ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'][month - 1],
      totalBudget
    });
  }
  
  return trends.reverse(); // Du plus ancien au plus récent
}

export function calculateTrend(current, previous) {
  if (!previous || previous === 0) return { percentage: 0, direction: 'stable', icon: '➡️' };
  
  const percentage = ((current - previous) / previous) * 100;
  
  if (percentage > 0) {
    return {
      percentage: Math.abs(percentage),
      direction: 'up',
      icon: '📈',
      color: 'text-red-400', // Augmentation = mauvais pour les dépenses
      label: 'augmentation'
    };
  } else if (percentage < 0) {
    return {
      percentage: Math.abs(percentage),
      direction: 'down',
      icon: '📉',
      color: 'text-emerald-400', // Diminution = bon pour les dépenses
      label: 'baisse'
    };
  } else {
    return {
      percentage: 0,
      direction: 'stable',
      icon: '➡️',
      color: 'text-zinc-400',
      label: 'stable'
    };
  }
}

// BUDGETS
export async function getBudgets(userId, year = new Date().getFullYear(), month = new Date().getMonth() + 1) {
  const { data, error } = await supabase
    .from('budgets')
    .select(`
      *,
      categories (name, color, icon)
    `)
    .eq('user_id', userId)
    .eq('year', year)
    .eq('month', month)
  
  if (error) throw error
  return data
}

export async function createBudget(budget) {
  try {
    // Essayer d'abord avec alert_threshold
    const { data, error } = await supabase
      .from('budgets')
      .insert([budget])
      .select(`
        *,
        categories (name, color, icon)
      `)
      .single()

    if (error) {
      // Si l'erreur concerne alert_threshold, essayer sans
      if (error.message.includes('alert_threshold') || error.code === 'PGRST204') {
        const { data: dataWithoutThreshold, error: errorWithoutThreshold } = await supabase
          .from('budgets')
          .insert([{
            user_id: budget.user_id,
            category_id: budget.category_id,
            amount: budget.amount,
            year: budget.year,
            month: budget.month
          }])
          .select(`
            *,
            categories (name, color, icon)
          `)
          .single()

        if (errorWithoutThreshold) throw errorWithoutThreshold
        return dataWithoutThreshold
      }
      throw error
    }
    
    return data
  } catch (error) {
    console.error('Erreur lors de la création du budget:', error)
    throw error
  }
}

export async function updateBudget(budgetId, budget) {
  const { data, error } = await supabase
    .from('budgets')
    .update(budget)
    .eq('id', budgetId)
    .select(`
      *,
      categories (name, color, icon)
    `)
    .single()
  
  if (error) throw error
  return data
}

export async function deleteBudget(budgetId) {
  const { error } = await supabase
    .from('budgets')
    .delete()
    .eq('id', budgetId)
  
  if (error) throw error
  return true
}
