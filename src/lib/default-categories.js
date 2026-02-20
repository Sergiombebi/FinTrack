// Catégories par défaut pour les nouveaux utilisateurs
export const defaultCategories = [
  { name: 'Alimentation', color: '#EF4444', icon: '🍔' },
  { name: 'Transport', color: '#3B82F6', icon: '🚗' },
  { name: 'Logement', color: '#8B5CF6', icon: '🏠' },
  { name: 'Loisirs', color: '#EC4899', icon: '🎮' },
  { name: 'Santé', color: '#10B981', icon: '💊' },
  { name: 'Shopping', color: '#F59E0B', icon: '🛍️' },
  { name: 'Éducation', color: '#6366F1', icon: '📚' },
  { name: 'Autres', color: '#6B7280', icon: '📦' }
];

// Fonction pour créer les catégories par défaut pour un utilisateur
export async function createDefaultCategories(userId) {
  const { createClient } = await import('./supabase');
  const supabase = createClient();
  
  try {
    const categoriesToInsert = defaultCategories.map(cat => ({
      ...cat,
      user_id: userId
    }));
    
    const { data, error } = await supabase
      .from('categories')
      .insert(categoriesToInsert)
      .select();
    
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Erreur lors de la création des catégories par défaut:', error);
    throw error;
  }
}
