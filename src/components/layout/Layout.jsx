import React, { useState } from 'react';
import { useLocation, useOutlet, useNavigate } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';

import Header from './Header';
import Sidebar from './Sidebar';
import BottomNav from './BottomNav';
import ScrollablePage from './ScrollablePage';

export default function Layout() {
  // Hooks de React Router
  const location = useLocation(); // Pour savoir sur quelle page on est (URL)
  const navigate = useNavigate(); // Pour pouvoir changer de page par le code
  const outlet = useOutlet(); // Capture l'enfant (la page active) pour l'animer

  // État pour savoir si on a scrollé (sert à flouter le Header)
  const [isScrolled, setIsScrolled] = useState(false);

  // ===========================================================================
  // 🧠 CERVEAU DE LA NAVIGATION (SMART BACK)
  // C'est cette fonction qu'on passe au Header pour le bouton "Retour"
  // ===========================================================================
  const handleSmartBack = () => {
    const currentPath = location.pathname;

    // 1. Si on est sur le Dashboard, on ne fait rien (le bouton est désactivé visuellement)
    if (currentPath === '/') return;

    // 2. Gestion des retours "Intelligents" (Hiérarchie)
    // Si on est dans l'historique Finance -> Retour au Hub Finance (pas à l'accueil)
    if (currentPath === '/finance/history') {
      navigate('/finance');
    }
    // Si on est dans une sous-page Business -> Retour au Hub Business
    else if (
      currentPath.startsWith('/business/') &&
      currentPath !== '/business'
    ) {
      navigate('/business');
    }
    // Si on est dans une sous-page Invest -> Retour au Hub Invest
    else if (currentPath.startsWith('/invest/') && currentPath !== '/invest') {
      navigate('/invest');
    }
    // 3. Si on est à la racine d'un Hub (Finance, Business...) -> Retour Dashboard
    else if (
      ['/finance', '/business', '/personal', '/invest'].includes(currentPath)
    ) {
      navigate('/');
    }
    // 4. Par défaut : Retour en arrière standard (historique navigateur)
    else {
      navigate(-1);
    }
  };

  return (
    // CONTENEUR PRINCIPAL
    // h-screen w-screen overflow-hidden : On bloque le scroll sur le body.
    // C'est 'ScrollablePage' qui gérera le scroll interne.
    <div className="bg-black h-screen w-screen overflow-hidden text-white font-sans flex flex-col relative">
      {/* --- ARRIÈRE-PLAN (BACKGROUND) --- */}
      {/* z-[-1] pour rester derrière tout le reste. pointer-events-none pour ne pas bloquer les clics. */}
      <div className="fixed inset-0 z-[-1] pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[600px] bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-900/20 via-black to-black"></div>
      </div>

      {/* --- BARRES DE NAVIGATION FIXES --- */}
      {/* On passe handleSmartBack au Header pour que la flèche fonctionne */}
      <Header
        activePath={location.pathname}
        isScrolled={isScrolled}
        handleSmartBack={handleSmartBack}
      />
      <Sidebar activePath={location.pathname} />

      {/* --- ZONE DE CONTENU PRINCIPALE --- */}
      {/* ASTUCE CSS CRUCIALE : 'grid grid-cols-1 grid-rows-1'
          Cela crée une grille avec une seule case.
          Pourquoi ? Pour que la page qui sort (ancienne) et la page qui rentre (nouvelle)
          se superposent EXACTEMENT au même endroit pendant l'animation.
          Sans ça, la nouvelle page pousserait l'ancienne vers le bas (ou vice-versa).
      */}
      <main className="flex-1 w-full h-full relative grid grid-cols-1 grid-rows-1 overflow-hidden">
        {/* AnimatePresence Gère l'entrée/sortie des composants.
            mode="popLayout" : Permet à l'ancienne page de sortir PENDANT que la nouvelle entre.
        */}
        <AnimatePresence mode="popLayout" initial={false}>
          {/* La 'key' est vitale : elle dit à React "L'URL a changé, donc c'est une nouvelle page,
              lance l'animation !"
          */}
          <ScrollablePage
            key={location.pathname}
            onScrollChange={setIsScrolled}
          >
            {/* C'est ici que s'affiche ta page (Dashboard, Finance, etc.) */}
            {outlet}
          </ScrollablePage>
        </AnimatePresence>
      </main>

      <BottomNav activePath={location.pathname} />
    </div>
  );
}
