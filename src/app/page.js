"use client";
import Sidebar from "@/components/layout/Sidebar";

// Simuler un utilisateur connecté (à remplacer par Supabase Auth plus tard)
const utilisateurConnecte = null; // mettre un objet user quand connecté

const stats = [
  { label: "Dépensé ce mois", valeur: "0 FCFA", icone: "💸", couleur: "from-rose-500/20 to-rose-600/5" },
  { label: "Budget restant", valeur: "0 FCFA", icone: "🎯", couleur: "from-emerald-500/20 to-emerald-600/5" },
  { label: "Transactions", valeur: "0", icone: "📊", couleur: "from-blue-500/20 to-blue-600/5" },
  { label: "Économies", valeur: "0 FCFA", icone: "🏦", couleur: "from-violet-500/20 to-violet-600/5" },
];

const fonctionnalites = [
  {
    titre: "Suivi en temps réel",
    description: "Enregistrez chaque dépense instantanément et gardez un œil sur vos finances à tout moment.",
    icone: "⚡",
  },
  {
    titre: "Analyses intelligentes",
    description: "Des graphiques clairs pour comprendre où va votre argent et identifier vos habitudes.",
    icone: "📈",
  },
  {
    titre: "Gestion du budget",
    description: "Définissez des limites par catégorie et recevez des alertes avant de les dépasser.",
    icone: "🎯",
  },
];

export default function Home() {
  const estConnecte = !!utilisateurConnecte;

  return (
    <div className="flex min-h-screen bg-[#080808] font-sans">
      {/* Sidebar */}
      <Sidebar />

      {/* Contenu principal */}
      <main className="flex-1 overflow-y-auto pb-20 md:pb-0">
        {estConnecte ? (
          /* ===== VUE CONNECTÉE ===== */
          <div className="p-6 md:p-10 max-w-5xl mx-auto">
            {/* Header */}
            <div className="mb-10">
              <p className="text-zinc-500 text-sm mb-1">Bienvenue de retour 👋</p>
              <h1 className="text-3xl font-bold text-white">
                Bonjour, <span className="text-emerald-400">{utilisateurConnecte?.nom}</span>
              </h1>
              <p className="text-zinc-400 mt-2 text-sm">Voici un résumé de vos finances ce mois-ci.</p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
              {stats.map((stat) => (
                <div
                  key={stat.label}
                  className={`bg-gradient-to-br ${stat.couleur} border border-white/5 rounded-2xl p-5`}
                >
                  <div className="text-2xl mb-3">{stat.icone}</div>
                  <p className="text-white font-bold text-lg">{stat.valeur}</p>
                  <p className="text-zinc-500 text-xs mt-1">{stat.label}</p>
                </div>
              ))}
            </div>

            {/* Dernières dépenses */}
            <div className="bg-white/3 border border-white/5 rounded-2xl p-6">
              <h2 className="text-white font-semibold mb-4">Dernières dépenses</h2>
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <div className="text-4xl mb-3">📭</div>
                <p className="text-zinc-500 text-sm">Aucune dépense enregistrée pour ce mois.</p>
                <button className="mt-4 px-5 py-2 bg-emerald-500 hover:bg-emerald-400 text-black text-sm font-semibold rounded-xl transition-colors">
                  + Ajouter une dépense
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* ===== VUE NON CONNECTÉE (Landing Page) ===== */
          <div className="flex flex-col min-h-screen">
            {/* Hero Section */}
            <div className="relative flex flex-col items-center justify-center flex-1 px-6 py-24 text-center overflow-hidden">
              {/* Background effect */}
              <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-emerald-500/5 rounded-full blur-3xl" />
                <div className="absolute top-1/4 right-1/4 w-[300px] h-[300px] bg-teal-500/5 rounded-full blur-2xl" />
              </div>

              {/* Badge */}
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/5 text-emerald-400 text-xs font-medium mb-8">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Gestion financière personnelle
              </div>

              {/* Titre */}
              <h1 className="text-5xl md:text-6xl font-bold text-white leading-tight tracking-tight mb-6 max-w-2xl">
                Maîtrisez vos{" "}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-400">
                  dépenses
                </span>
              </h1>

              <p className="text-zinc-400 text-lg max-w-md mb-10 leading-relaxed">
                Suivez, analysez et optimisez vos finances personnelles en toute simplicité.
              </p>

              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row items-center gap-4">
                <a
                  href="/auth/login"
                  className="px-8 py-3.5 bg-emerald-500 hover:bg-emerald-400 text-black font-semibold rounded-xl transition-all duration-200 hover:scale-105 text-sm"
                >
                  Commencer gratuitement
                </a>
                <a
                  href="/auth/login"
                  className="px-8 py-3.5 border border-white/10 hover:border-white/20 text-white font-medium rounded-xl transition-all duration-200 text-sm hover:bg-white/5"
                >
                  Se connecter
                </a>
              </div>
            </div>

            {/* Fonctionnalités */}
            <div className="px-6 py-16 max-w-4xl mx-auto w-full">
              <h2 className="text-center text-white font-bold text-2xl mb-2">Tout ce dont vous avez besoin</h2>
              <p className="text-center text-zinc-500 text-sm mb-10">Simple, puissant, efficace.</p>

              <div className="grid md:grid-cols-3 gap-5">
                {fonctionnalites.map((f) => (
                  <div
                    key={f.titre}
                    className="bg-white/3 border border-white/5 rounded-2xl p-6 hover:border-emerald-500/20 hover:bg-emerald-500/3 transition-all duration-300"
                  >
                    <div className="text-3xl mb-4">{f.icone}</div>
                    <h3 className="text-white font-semibold mb-2 text-sm">{f.titre}</h3>
                    <p className="text-zinc-500 text-sm leading-relaxed">{f.description}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Footer */}
            <footer className="border-t border-white/5 px-6 py-6 text-center">
              <p className="text-zinc-600 text-xs">© 2025 FinTrack — Suivi de dépenses personnel</p>
            </footer>
          </div>
        )}
      </main>
    </div>
  );
}