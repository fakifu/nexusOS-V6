import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, Zap, Search } from 'lucide-react';
import { UI } from '../../designSystem';

export default function Header({ activePath, isScrolled, handleSmartBack }) {
  // --- LOGIQUE TITRE ---
  const getPageTitle = (path) => {
    if (path === '/') return 'Dashboard';
    if (path.startsWith('/finance')) return 'Finance';
    if (path.startsWith('/business')) return 'Business';
    if (path.startsWith('/invest')) return 'Investissements';
    if (path.startsWith('/personal')) return 'Personnel';
    return 'NexusOS';
  };

  const isDashboard = activePath === '/';
  const pageTitle = getPageTitle(activePath);

  // On montre la flèche si on n'est pas sur le Dashboard
  const showBackArrow = !isDashboard;

  return (
    <header
      className={`fixed ${UI.layout.topMargin} left-0 right-0 z-40 transition-all pointer-events-none 
        ${UI.layout.headerOffset} 
        ${UI.layout.pagePadding}`}
    >
      <div
        className={`
          flex justify-between items-center pointer-events-auto 
          rounded-[1.8rem] px-6 py-3 transition-all duration-500 ease-out
          
          /* ✅ EFFET DE VERRE IDENTIQUE AU BOTTOM NAV */
          bg-white/[0.04] backdrop-blur-xl border border-white/10
          shadow-[0_8px_32px_0_rgba(0,0,0,0.8)]
          ${isScrolled ? 'scale-[0.98]' : 'scale-100'}
        `}
      >
        {/* --- PARTIE GAUCHE : BOUTON DYNAMIQUE + TITRE --- */}
        <div className="flex items-center gap-4">
          <button
            onClick={handleSmartBack}
            // Le bouton n'est cliquable que si on n'est pas sur le dashboard
            className={`
              w-10 h-10 rounded-xl flex items-center justify-center text-white 
              relative overflow-hidden active:scale-90 transition-all
              ${isDashboard ? 'cursor-default' : 'cursor-pointer'}
              bg-gradient-to-br from-indigo-500/90 to-violet-600/90 
              shadow-[0_4px_12px_rgba(79,70,229,0.3)]
            `}
          >
            <AnimatePresence mode="wait">
              {showBackArrow ? (
                <motion.div
                  key="arrow"
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  transition={{ duration: 0.2, ease: 'easeOut' }}
                >
                  <ChevronLeft size={24} strokeWidth={2.5} />
                </motion.div>
              ) : (
                <motion.div
                  key="logo"
                  initial={{ opacity: 0, scale: 0.5, rotate: -20 }}
                  animate={{ opacity: 1, scale: 1, rotate: 0 }}
                  exit={{ opacity: 0, scale: 0.5 }}
                  transition={{ duration: 0.2 }}
                >
                  <Zap size={20} fill="white" strokeWidth={0} />
                </motion.div>
              )}
            </AnimatePresence>
          </button>

          {/* --- TITRE ANIMÉ --- */}
          <div className="overflow-hidden">
            <AnimatePresence mode="wait">
              <motion.span
                key={pageTitle}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3, ease: 'circOut' }}
                className="font-bold text-lg text-white tracking-tight block capitalize"
              >
                {pageTitle}
              </motion.span>
            </AnimatePresence>
          </div>
        </div>

        {/* --- PARTIE DROITE : SEARCH / AVATAR --- */}
        <div className="flex items-center gap-4">
          {/* Ton code de recherche et avatar ici... */}
        </div>
      </div>
    </header>
  );
}
