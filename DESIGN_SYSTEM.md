# Système de Design - FinTrack

## 🎨 Palette de Couleurs

### Couleurs Principales
- **Background**: `#080808` - Fond principal sombre
- **Sidebar**: `#0f0f0f` - Fond de la barre latérale
- **Foreground**: `#ffffff` - Texte principal
- **Primary**: `#10b981` (Emeraude) - Actions principales
- **Primary Hover**: `#34d399` - État survol des boutons

### Couleurs Secondaires
- **Rose**: `#f43f5e` - Dépenses/Alertes
- **Blue**: `#3b82f6` - Informations/Analyses
- **Violet**: `#8b5cf6` - Économies/Statistiques
- **Teal**: `#14b8a6` - Succès/Validation

### Neutres
- **Border**: `rgba(255, 255, 255, 0.05)` - Bordures subtiles
- **Card BG**: `rgba(255, 255, 255, 0.03)` - Fond des cartes
- **Text Muted**: `#71717a` - Texte secondaire
- **Text Secondary**: `#a1a1aa` - Texte tertiaire

## 🎯 Gradients Prédéfinis

```css
/* Primaire */
from-emerald-400 to-teal-400

/* Statistiques */
from-rose-500/20 to-rose-600/5    /* Dépenses */
from-emerald-500/20 to-emerald-600/5  /* Budget */
from-blue-500/20 to-blue-600/5    /* Analyses */
from-violet-500/20 to-violet-600/5  /* Économies */
```

## 📐 Espacements

| Nom | Taille | Usage |
|-----|--------|-------|
| xs  | 0.25rem | Espacements très petits |
| sm  | 0.5rem  | Espacements entre éléments proches |
| md  | 1rem    | Espacements standards |
| lg  | 1.5rem  | Espacements modérés |
| xl  | 2rem    | Espacements larges |
| 2xl | 3rem    | Espacements très larges |
| 3xl | 4rem    | Espacements sectionnels |

## 🔲 Bordures et Arrondis

### Rayons
- `sm`: 0.375rem (6px) - Petits éléments
- `md`: 0.5rem (8px) - Éléments standards
- `lg`: 0.75rem (12px) - Cartes
- `xl`: 1rem (16px) - Grandes cartes
- `full`: 9999px - Boutons et avatars

### Largeurs
- `thin`: 1px - Bordures subtiles
- `normal`: 2px - Bordures standards
- `thick`: 4px - Bordures accentuées

## ✨ Typographie

### Tailles
- `xs`: 12px - Légendes, étiquettes
- `sm`: 14px - Texte secondaire
- `base`: 16px - Texte par défaut
- `lg`: 18px - Texte important
- `xl`: 20px - Sous-titres
- `2xl`: 24px - Titres de section
- `3xl`: 30px - Titres importants
- `4xl`: 36px - Grands titres
- `5xl`: 48px - Titres hero
- `6xl`: 60px - Titres très grands

### Poids
- `light`: 300 - Texte délicat
- `normal`: 400 - Texte standard
- `medium`: 500 - Texte semi-important
- `semibold`: 600 - Texte important
- `bold`: 700 - Texte très important

## 🎬 Animations

### Durées
- `fast`: 150ms - Micro-interactions
- `normal`: 200ms - Transitions standards
- `slow`: 300ms - Animations complexes

### Easing
- `default`: cubic-bezier(0.4, 0, 0.2, 1) - Animations naturelles
- `in`: cubic-bezier(0.4, 0, 1, 1) - Entrée douce
- `out`: cubic-bezier(0, 0, 0.2, 1) - Sortie douce

## 📱 Breakpoints

| Nom | Taille | Usage |
|-----|--------|-------|
| sm  | 640px  | Mobile landscape |
| md  | 768px  | Tablettes |
| lg  | 1024px | Petits desktops |
| xl  | 1280px | Desktops standards |
| 2xl | 1536px | Grands écrans |

## 🎯 Utilisation avec les Composants

### Boutons
```jsx
// Primaire
<button className="bg-emerald-500 hover:bg-emerald-400 text-black font-semibold transition-colors">
  Action principale
</button>

// Secondaire
<button className="border border-white/10 hover:border-white/20 text-white font-medium transition-colors">
  Action secondaire
</button>
```

### Cartes
```jsx
<div className="bg-white/3 border border-white/5 rounded-2xl p-6 hover:border-emerald-500/20 hover:bg-emerald-500/3 transition-all duration-300">
  Contenu de la carte
</div>
```

### Statistiques
```jsx
<div className="bg-gradient-to-br from-emerald-500/20 to-emerald-600/5 border border-white/5 rounded-2xl p-5">
  <div className="text-2xl mb-3">💸</div>
  <p className="text-white font-bold text-lg">0 FCFA</p>
  <p className="text-zinc-500 text-xs mt-1">Dépensé ce mois</p>
</div>
```

## 📁 Structure des Fichiers

```
src/
├── lib/
│   └── constants.js          # Constantes de design
├── components/
│   └── ui/
│       └── ThemeProvider.js  # Hook et utilitaires de thème
└── app/
    └── globals.css          # Variables CSS globales
```

## 🔄 Comment Maintenir la Cohérence

1. **Utiliser les constantes** dans `/lib/constants.js`
2. **Importer le hook `useTheme`** pour accéder aux couleurs
3. **Utiliser les classes utilitaires** dans `ThemeProvider.js`
4. **Ne jamais hardcoder** les couleurs directement dans les composants
5. **Préférer les gradients prédéfinis** pour les cartes de statistiques

## 🎨 Exemple d'Utilisation

```jsx
import { useTheme, themeClasses } from '@/components/ui/ThemeProvider';

function MonComposant() {
  const { colors } = useTheme();
  
  return (
    <div className={themeClasses.card}>
      <h2 className="text-white font-semibold">Titre</h2>
      <p className="text-zinc-500 text-sm">Description</p>
      <button className={themeClasses.button.primary}>
        Action
      </button>
    </div>
  );
}
```
