"use client";
import { supabase } from "./supabase";

// Fonction pour vérifier l'authentification avec retry
export async function getCurrentUser(retries = 2) {
  console.log(`getCurrentUser: Tentative ${retries > 1 ? `avec retry (${3 - retries}/2)` : 'initiale'}`);
  
  for (let i = 0; i < retries; i++) {
    try {
      // Essayer d'abord avec getSession (plus fiable)
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        console.error("getCurrentUser: Erreur getSession:", sessionError);
        if (i < retries - 1) {
          console.log("getCurrentUser: Nouvelle tentative dans 500ms...");
          await new Promise(resolve => setTimeout(resolve, 500));
          continue;
        }
      }
      
      if (session?.user) {
        console.log("getCurrentUser: Utilisateur trouvé via getSession:", session.user.email);
        return session.user;
      }
      
      // Si getSession ne fonctionne pas, essayer getUser
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError) {
        console.error("getCurrentUser: Erreur getUser:", userError);
        if (i < retries - 1) {
          console.log("getCurrentUser: Nouvelle tentative dans 500ms...");
          await new Promise(resolve => setTimeout(resolve, 500));
          continue;
        }
      }
      
      console.log("getCurrentUser: Utilisateur trouvé via getUser:", user?.email || "null");
      return user;
    } catch (error) {
      console.error("getCurrentUser: Exception:", error);
      if (i < retries - 1) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }
  }
  
  console.log("getCurrentUser: Aucun utilisateur trouvé après toutes les tentatives");
  return null;
}

// Fonction pour vérifier si une route nécessite une authentification
export function requiresAuth(pathname) {
  const publicRoutes = ['/auth/login', '/auth/register', '/auth/reset-password', '/auth/update-password', '/auth/callback', '/'];
  return !publicRoutes.some(route => pathname.startsWith(route));
}
