"use client";
import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useNotification } from "@/contexts/NotificationContext";
import { defaultCategories } from "@/lib/default-categories";

export default function CreateCategoryModal({ userId, isOpen, onClose, onCategoryCreated }) {
  const [categories, setCategories] = useState(defaultCategories);
  const [loading, setLoading] = useState(false);
  const { showSuccess, showError } = useNotification();

  const handleCreateDefaultCategories = async () => {
    setLoading(true);
    try {
      const categoriesToInsert = categories.map(cat => ({
        ...cat,
        user_id: userId
      }));
      
      const { data, error } = await supabase
        .from('categories')
        .insert(categoriesToInsert)
        .select();

      if (error) throw error;

      showSuccess('Catégories par défaut créées avec succès !');
      onCategoryCreated(data);
      onClose();
    } catch (error) {
      console.error('Erreur lors de la création des catégories:', error);
      showError('Erreur lors de la création des catégories');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCustomCategory = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    
    const category = {
      name: formData.get('name'),
      color: formData.get('color'),
      icon: formData.get('icon'),
      user_id: userId
    };

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('categories')
        .insert([category])
        .select()
        .single();

      if (error) throw error;

      showSuccess('Catégorie créée avec succès !');
      onCategoryCreated([data]);
      onClose();
    } catch (error) {
      console.error('Erreur lors de la création de la catégorie:', error);
      showError('Erreur lors de la création de la catégorie');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-[#080808] border border-white/10 rounded-2xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <h3 className="text-xl font-semibold text-white mb-6">Créer des catégories</h3>
        
        <div className="space-y-6">
          {/* Option 1: Catégories par défaut */}
          <div className="bg-white/3 border border-white/5 rounded-xl p-6">
            <h4 className="text-white font-medium mb-4">Catégories par défaut</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
              {defaultCategories.map((cat, index) => (
                <div key={index} className="text-center p-3 bg-white/5 rounded-lg">
                  <div className="text-2xl mb-2">{cat.icon}</div>
                  <div className="text-xs text-white">{cat.name}</div>
                </div>
              ))}
            </div>
            <button
              onClick={handleCreateDefaultCategories}
              disabled={loading}
              className="w-full px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-black font-semibold rounded-xl transition-colors disabled:opacity-50"
            >
              {loading ? 'Création...' : 'Créer ces catégories'}
            </button>
          </div>

          {/* Séparateur */}
          <div className="flex items-center gap-4">
            <div className="flex-1 h-px bg-white/10"></div>
            <span className="text-zinc-400 text-sm">OU</span>
            <div className="flex-1 h-px bg-white/10"></div>
          </div>

          {/* Option 2: Catégorie personnalisée */}
          <div className="bg-white/3 border border-white/5 rounded-xl p-6">
            <h4 className="text-white font-medium mb-4">Catégorie personnalisée</h4>
            <form onSubmit={handleCreateCustomCategory} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-white mb-2">Nom de la catégorie</label>
                <input
                  type="text"
                  name="name"
                  required
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500"
                  placeholder="Ex: Restaurant, Transport, etc."
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-white mb-2">Couleur</label>
                  <input
                    type="color"
                    name="color"
                    required
                    defaultValue="#3B82F6"
                    className="w-full h-12 bg-white/5 border border-white/10 rounded-xl cursor-pointer"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-white mb-2">Icône</label>
                  <select
                    name="icon"
                    required
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-emerald-500"
                  >
                    <option value="🍔">🍔 Nourriture</option>
                    <option value="🚗">🚗 Transport</option>
                    <option value="🏠">🏠 Maison</option>
                    <option value="🎮">🎮 Loisirs</option>
                    <option value="💊">💊 Santé</option>
                    <option value="🛍️">🛍️ Shopping</option>
                    <option value="📚">📚 Éducation</option>
                    <option value="💼">💼 Travail</option>
                    <option value="✈️">✈️ Voyage</option>
                    <option value="🎁">🎁 Cadeaux</option>
                    <option value="📱">📱 Technologie</option>
                    <option value="🏃">🏃 Sport</option>
                    <option value="🎬">🎬 Cinéma</option>
                    <option value="☕">☕ Café</option>
                    <option value="📦">📦 Autres</option>
                  </select>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full px-4 py-2 bg-blue-500 hover:bg-blue-400 text-white font-semibold rounded-xl transition-colors disabled:opacity-50"
              >
                {loading ? 'Création...' : 'Créer cette catégorie'}
              </button>
            </form>
          </div>
        </div>

        <button
          onClick={onClose}
          className="mt-6 w-full px-4 py-2 bg-white/10 hover:bg-white/20 text-white font-semibold rounded-xl transition-colors"
        >
          Annuler
        </button>
      </div>
    </div>
  );
}
