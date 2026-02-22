"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/layout/Sidebar";
import { supabase } from "@/lib/supabase";
import { getCurrentUser } from "@/lib/auth";
import { useNotification } from "@/contexts/NotificationContext";

export default function SettingsPage() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [profileData, setProfileData] = useState({
    nom: '',
    email: '',
    telephone: '',
    devise: 'FCFA',
    langue: 'fr'
  });
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [activeTab, setActiveTab] = useState('profile');
  const [saving, setSaving] = useState(false);
  const router = useRouter();
  const { showSuccess, showError } = useNotification();

  useEffect(() => {
    const getUser = async () => {
      const user = await getCurrentUser();
      if (!user) {
        router.push("/auth/login");
        return;
      }
      setUser(user);
      setLoading(false);
      
      // Charger les données du profil
      setProfileData({
        nom: user.user_metadata?.nom || '',
        email: user.email || '',
        telephone: user.user_metadata?.telephone || '',
        devise: user.user_metadata?.devise || 'FCFA',
        langue: user.user_metadata?.langue || 'fr'
      });
    };

    getUser();

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

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      const { error } = await supabase.auth.updateUser({
        data: {
          nom: profileData.nom,
          telephone: profileData.telephone,
          devise: profileData.devise,
          langue: profileData.langue
        }
      });

      if (error) throw error;

      showSuccess('Profil mis à jour avec succès !');
    } catch (error) {
      console.error('Erreur lors de la mise à jour du profil:', error);
      showError('Erreur lors de la mise à jour du profil');
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordUpdate = async (e) => {
    e.preventDefault();
    setSaving(true);

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      showError('Les mots de passe ne correspondent pas');
      setSaving(false);
      return;
    }

    if (passwordData.newPassword.length < 6) {
      showError('Le mot de passe doit contenir au moins 6 caractères');
      setSaving(false);
      return;
    }

    try {
      const { error } = await supabase.auth.updateUser({
        password: passwordData.newPassword
      });

      if (error) throw error;

      showSuccess('Mot de passe mis à jour avec succès !');
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
    } catch (error) {
      console.error('Erreur lors de la mise à jour du mot de passe:', error);
      showError('Erreur lors de la mise à jour du mot de passe');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer votre compte ? Cette action est irréversible.')) {
      return;
    }

    if (!confirm('Cette action supprimera définitivement toutes vos données. Voulez-vous continuer ?')) {
      return;
    }

    try {
      const { error } = await supabase.rpc('delete_user_account');
      if (error) throw error;

      showSuccess('Compte supprimé avec succès');
      await supabase.auth.signOut();
      router.push('/');
    } catch (error) {
      console.error('Erreur lors de la suppression du compte:', error);
      showError('Erreur lors de la suppression du compte');
    }
  };

  const handleExportData = async () => {
    try {
      // Récupérer toutes les données de l'utilisateur
      const [expenses, categories, budgets] = await Promise.all([
        supabase.from('expenses').select('*').eq('user_id', user.id),
        supabase.from('categories').select('*').eq('user_id', user.id),
        supabase.from('budgets').select('*').eq('user_id', user.id)
      ]);

      const exportData = {
        profile: {
          email: user.email,
          nom: user.user_metadata?.nom,
          telephone: user.user_metadata?.telephone,
          created_at: user.created_at
        },
        expenses: expenses.data || [],
        categories: categories.data || [],
        budgets: budgets.data || [],
        exportDate: new Date().toISOString()
      };

      // Créer et télécharger le fichier JSON
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `fintrack-data-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      showSuccess('Données exportées avec succès !');
    } catch (error) {
      console.error('Erreur lors de l\'export des données:', error);
      showError('Erreur lors de l\'export des données');
    }
  };

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
        <div className="max-w-4xl mx-auto px-6 py-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-white">Paramètres</h1>
            <p className="text-zinc-400 mt-2 text-sm">Gérez votre profil et vos préférences</p>
          </div>

          {/* Onglets */}
          <div className="flex gap-1 mb-8 bg-white/5 p-1 rounded-xl">
            <button
              onClick={() => setActiveTab('profile')}
              className={`flex-1 px-4 py-3 rounded-lg font-medium transition-colors ${
                activeTab === 'profile' 
                  ? 'bg-emerald-500 text-black' 
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              Profil
            </button>
            <button
              onClick={() => setActiveTab('security')}
              className={`flex-1 px-4 py-3 rounded-lg font-medium transition-colors ${
                activeTab === 'security' 
                  ? 'bg-emerald-500 text-black' 
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              Sécurité
            </button>
            <button
              onClick={() => setActiveTab('data')}
              className={`flex-1 px-4 py-3 rounded-lg font-medium transition-colors ${
                activeTab === 'data' 
                  ? 'bg-emerald-500 text-black' 
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              Données
            </button>
          </div>

          {/* Contenu des onglets */}
          {activeTab === 'profile' && (
            <div className="bg-white/3 border border-white/5 rounded-2xl p-8">
              <h3 className="text-xl font-semibold text-white mb-6">Informations du profil</h3>
              <form onSubmit={handleProfileUpdate} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-white mb-2">Nom complet</label>
                  <input
                    type="text"
                    value={profileData.nom}
                    onChange={(e) => setProfileData({...profileData, nom: e.target.value})}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500"
                    placeholder="Jean Dupont"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-white mb-2">Email</label>
                  <input
                    type="email"
                    value={profileData.email}
                    disabled
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500 opacity-50"
                  />
                  <p className="text-zinc-500 text-xs mt-1">L'email ne peut pas être modifié</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-white mb-2">Téléphone</label>
                  <input
                    type="tel"
                    value={profileData.telephone}
                    onChange={(e) => setProfileData({...profileData, telephone: e.target.value})}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500"
                    placeholder="+225 00 00 00 00"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-white mb-2">Devise</label>
                    <select
                      value={profileData.devise}
                      onChange={(e) => setProfileData({...profileData, devise: e.target.value})}
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-emerald-500"
                    >
                      <option value="FCFA">FCFA</option>
                      <option value="EUR">EUR</option>
                      <option value="USD">USD</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-white mb-2">Langue</label>
                    <select
                      value={profileData.langue}
                      onChange={(e) => setProfileData({...profileData, langue: e.target.value})}
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-emerald-500"
                    >
                      <option value="fr">Français</option>
                      <option value="en">English</option>
                    </select>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={saving}
                  className="w-full px-6 py-3 bg-emerald-500 hover:bg-emerald-400 text-black font-semibold rounded-xl transition-colors disabled:opacity-50"
                >
                  {saving ? 'Enregistrement...' : 'Enregistrer les modifications'}
                </button>
              </form>
            </div>
          )}

          {activeTab === 'security' && (
            <div className="space-y-6">
              <div className="bg-white/3 border border-white/5 rounded-2xl p-8">
                <h3 className="text-xl font-semibold text-white mb-6">Changer le mot de passe</h3>
                <form onSubmit={handlePasswordUpdate} className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-white mb-2">Nouveau mot de passe</label>
                    <input
                      type="password"
                      value={passwordData.newPassword}
                      onChange={(e) => setPasswordData({...passwordData, newPassword: e.target.value})}
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500"
                      placeholder="••••••••"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-white mb-2">Confirmer le mot de passe</label>
                    <input
                      type="password"
                      value={passwordData.confirmPassword}
                      onChange={(e) => setPasswordData({...passwordData, confirmPassword: e.target.value})}
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500"
                      placeholder="••••••••"
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={saving}
                    className="w-full px-6 py-3 bg-emerald-500 hover:bg-emerald-400 text-black font-semibold rounded-xl transition-colors disabled:opacity-50"
                  >
                    {saving ? 'Mise à jour...' : 'Mettre à jour le mot de passe'}
                  </button>
                </form>
              </div>

              <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-8">
                <h3 className="text-xl font-semibold text-red-400 mb-6">Zone de danger</h3>
                <div className="space-y-4">
                  <p className="text-zinc-300">
                    La suppression de votre compte est irréversible et entraînera la perte de toutes vos données.
                  </p>
                  <button
                    onClick={handleDeleteAccount}
                    className="w-full px-6 py-3 bg-red-500 hover:bg-red-400 text-white font-semibold rounded-xl transition-colors"
                  >
                    Supprimer mon compte
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'data' && (
            <div className="space-y-6">
              <div className="bg-white/3 border border-white/5 rounded-2xl p-8">
                <h3 className="text-xl font-semibold text-white mb-6">Gestion des données</h3>
                <div className="space-y-6">
                  <div>
                    <h4 className="text-white font-medium mb-3">Exporter vos données</h4>
                    <p className="text-zinc-400 text-sm mb-4">
                      Téléchargez toutes vos données (dépenses, catégories, budgets) au format JSON.
                    </p>
                    <button
                      onClick={handleExportData}
                      className="px-6 py-3 bg-blue-500 hover:bg-blue-400 text-white font-semibold rounded-xl transition-colors"
                    >
                      Exporter mes données
                    </button>
                  </div>

                  <div className="border-t border-white/10 pt-6">
                    <h4 className="text-white font-medium mb-3">Statistiques de stockage</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="bg-white/5 rounded-xl p-4">
                        <div className="text-2xl mb-2">📝</div>
                        <div className="text-zinc-400 text-sm">Dépenses</div>
                        <div className="text-white text-xl font-bold">0</div>
                      </div>
                      <div className="bg-white/5 rounded-xl p-4">
                        <div className="text-2xl mb-2">🏷️</div>
                        <div className="text-zinc-400 text-sm">Catégories</div>
                        <div className="text-white text-xl font-bold">0</div>
                      </div>
                      <div className="bg-white/5 rounded-xl p-4">
                        <div className="text-2xl mb-2">🎯</div>
                        <div className="text-zinc-400 text-sm">Budgets</div>
                        <div className="text-white text-xl font-bold">0</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white/3 border border-white/5 rounded-2xl p-8">
                <h3 className="text-xl font-semibold text-white mb-6">À propos</h3>
                <div className="space-y-4 text-zinc-400">
                  <div className="flex justify-between">
                    <span>Version</span>
                    <span className="text-white">1.0.0</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Dernière mise à jour</span>
                    <span className="text-white">{new Date().toLocaleDateString('fr-FR')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Compte créé le</span>
                    <span className="text-white">
                      {user?.created_at ? new Date(user.created_at).toLocaleDateString('fr-FR') : 'N/A'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
