import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, ArrowRight, Zap, AlertTriangle } from 'lucide-react';
import { UI, TEXT, COLORS } from '../../designSystem';

export default function Login() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const { signIn, signUp } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (isSignUp) {
        const { error } = await signUp({ email, password });
        if (error) throw error;
      } else {
        const { error } = await signIn({ email, password });
        if (error) throw error;
      }
      navigate('/');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-black p-4 relative overflow-hidden">
      {/* Fond d'ambiance (Glow) */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-indigo-600/20 blur-[120px] rounded-full pointer-events-none" />

      {/* Carte Login */}
      <div
        className={`${UI.card} w-full max-w-md p-8 shadow-2xl relative z-10 border-white/20`}
      >
        {/* Header */}
        <div className="text-center mb-10">
          <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-indigo-500/30">
            <Zap size={24} className="text-white" fill="white" />
          </div>
          <h1 className={`${TEXT.h2} mb-2`}>
            {isSignUp ? 'Créer un compte' : 'Bienvenue'}
          </h1>
          <p className="text-gray-400 text-sm">
            {isSignUp
              ? "Commence ton Life OS aujourd'hui"
              : 'Connecte-toi pour accéder à ton dashboard'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Input Email */}
          <div className="space-y-1">
            <label className={UI.label}>Email</label>
            <div className="relative group">
              <Mail
                className="absolute left-0 bottom-3 text-gray-500 group-focus-within:text-indigo-400 transition-colors"
                size={20}
              />
              <input
                type="email"
                placeholder="exemple@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className={`${UI.input} pl-8`}
              />
            </div>
          </div>

          {/* Input Password */}
          <div className="space-y-1">
            <label className={UI.label}>Mot de passe</label>
            <div className="relative group">
              <Lock
                className="absolute left-0 bottom-3 text-gray-500 group-focus-within:text-indigo-400 transition-colors"
                size={20}
              />
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className={`${UI.input} pl-8`}
              />
            </div>
          </div>

          {/* Message Erreur */}
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm p-4 rounded-xl flex items-center gap-3 animate-fade-in">
              <AlertTriangle size={18} className="shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Bouton Submit */}
          <button
            type="submit"
            disabled={loading}
            className={`${UI.btnPrimary} w-full py-4 rounded-xl text-lg shadow-lg shadow-indigo-500/20 mt-4`}
          >
            {loading ? (
              <span className="animate-pulse">Chargement...</span>
            ) : (
              <>
                {isSignUp ? "S'inscrire" : 'Se connecter'}
                <ArrowRight size={20} />
              </>
            )}
          </button>
        </form>

        {/* Toggle Login/Signup */}
        <div className="mt-8 text-center pt-6 border-t border-white/5">
          <button
            onClick={() => setIsSignUp(!isSignUp)}
            className={`${UI.btnGhost} w-full text-sm py-3 rounded-xl border-dashed border-white/10`}
          >
            {isSignUp
              ? 'Déjà un compte ? Se connecter'
              : 'Pas de compte ? Créer un compte'}
          </button>
        </div>
      </div>
    </div>
  );
}
