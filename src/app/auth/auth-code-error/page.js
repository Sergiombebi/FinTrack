"use client";
import Link from "next/link";

export default function AuthCodeErrorPage() {
  return (
    <div className="min-h-screen bg-[#080808] flex items-center justify-center px-4">
      <div className="w-full max-w-md text-center">
        {/* Icône d'erreur */}
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 rounded-full bg-rose-500/20 border border-rose-500/20 flex items-center justify-center">
            <svg width="32" height="32" fill="none" viewBox="0 0 24 24" stroke="#f43f5e" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
        </div>

        {/* Titre */}
        <h1 className="text-2xl font-bold text-white mb-4">Erreur d'authentification</h1>
        
        {/* Message */}
        <p className="text-zinc-400 text-sm mb-8">
          Une erreur s'est produite lors de l'authentification. Le lien a peut-être expiré ou est invalide.
        </p>

        {/* Actions */}
        <div className="space-y-3">
          <Link
            href="/auth/login"
            className="block w-full py-3 bg-emerald-500 hover:bg-emerald-400 text-black font-semibold rounded-xl transition-all duration-200 text-center"
          >
            Retour à la connexion
          </Link>
          
          <Link
            href="/auth/register"
            className="block w-full py-3 border border-white/10 hover:border-white/20 text-white font-medium rounded-xl transition-all duration-200 text-center"
          >
            Créer un compte
          </Link>
        </div>

        {/* Aide */}
        <div className="mt-8 p-4 bg-white/3 border border-white/5 rounded-xl">
          <p className="text-zinc-500 text-xs">
            Si le problème persiste, veuillez réessayer ou contacter le support.
          </p>
        </div>
      </div>
    </div>
  );
}
