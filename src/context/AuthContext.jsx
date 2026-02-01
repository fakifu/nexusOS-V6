import React, { createContext, useState, useEffect, useContext } from 'react';
import { supabase } from '../lib/supabase';

// 1. On crée le "Cercle de Confiance" (le Contexte)
const AuthContext = createContext();

// 2. Le Composant "Provider" qui va envelopper toute l'application
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // A. Au chargement de l'app, on vérifie s'il y a déjà une session active
    const checkSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      setUser(session?.user ?? null);
      setLoading(false);
    };

    checkSession();

    // B. On met en place un "Écouteur" (Listener)
    // Dès que quelqu'un se connecte ou se déconnecte, Supabase nous prévient ici.
    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    // Nettoyage quand le composant est détruit
    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  // Les données qu'on partage à toute l'app
  const value = {
    user,
    loading,
    // Fonctions helpers pour se connecter/déconnecter facilement
    signIn: (data) => supabase.auth.signInWithPassword(data),
    signUp: (data) => supabase.auth.signUp(data),
    signOut: () => supabase.auth.signOut(),
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

// 3. Le Hook personnalisé pour utiliser le contexte facilement
// Au lieu d'importer useContext partout, on utilisera juste useAuth()
export const useAuth = () => {
  return useContext(AuthContext);
};
