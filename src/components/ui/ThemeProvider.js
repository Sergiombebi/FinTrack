"use client";

import { COLORS, SPACING, BORDERS, TYPOGRAPHY, ANIMATIONS } from "@/lib/constants";

// Hook pour utiliser les couleurs du thème
export function useTheme() {
  return {
    colors: COLORS,
    spacing: SPACING,
    borders: BORDERS,
    typography: TYPOGRAPHY,
    animations: ANIMATIONS,
  };
}

// Classes CSS utilitaires pour le thème
export const themeClasses = {
  // Fond
  bg: {
    primary: COLORS.background,
    secondary: COLORS.sidebar,
    card: COLORS.cardBg,
  },
  
  // Texte
  text: {
    primary: 'text-white',
    secondary: 'text-zinc-400',
    muted: 'text-zinc-500',
    accent: 'text-emerald-400',
  },
  
  // Bordures
  border: {
    default: 'border-white/5',
    hover: 'border-white/10',
    accent: 'border-emerald-500/20',
  },
  
  // Boutons
  button: {
    primary: 'bg-emerald-500 hover:bg-emerald-400 text-black font-semibold transition-colors',
    secondary: 'border border-white/10 hover:border-white/20 text-white font-medium transition-colors',
    ghost: 'text-zinc-500 hover:text-white hover:bg-white/5 transition-colors',
  },
  
  // Cartes
  card: 'bg-white/3 border border-white/5 rounded-2xl',
  cardHover: 'hover:border-emerald-500/20 hover:bg-emerald-500/3 transition-all duration-300',
  
  // Transitions
  transition: 'transition-all duration-200',
  transitionSlow: 'transition-all duration-300',
  
  // Arrondis
  rounded: {
    sm: 'rounded-lg',
    md: 'rounded-xl',
    lg: 'rounded-2xl',
    full: 'rounded-full',
  },
};

// Fonctions utilitaires pour les gradients
export const getGradientClass = (type) => {
  const gradients = {
    primary: 'from-emerald-400 to-teal-400',
    rose: 'from-rose-500/20 to-rose-600/5',
    emerald: 'from-emerald-500/20 to-emerald-600/5',
    blue: 'from-blue-500/20 to-blue-600/5',
    violet: 'from-violet-500/20 to-violet-600/5',
  };
  return gradients[type] || gradients.primary;
};

// Fonction pour obtenir la couleur de statut
export const getStatusColor = (status) => {
  const colors = {
    success: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
    error: 'text-rose-400 bg-rose-500/10 border-rose-500/20',
    warning: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20',
    info: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
    default: 'text-zinc-400 bg-zinc-500/10 border-zinc-500/20',
  };
  return colors[status] || colors.default;
};
