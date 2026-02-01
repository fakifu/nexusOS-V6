import React, { useRef, useLayoutEffect } from 'react';
import { motion, useIsPresent } from 'framer-motion';
import { UI } from '../../designSystem';

// --- VARIATION : DELAYED LATERAL SLIDE ---
const pageVariants = {
  // 1. DÉPART : La page est invisible et décalée vers la DROITE (x: 40)
  initial: { 
    opacity: 0, 
    x: 40 
  },
  
  // 2. ARRIVÉE : Elle glisse vers le CENTRE (x: 0)
  in: { 
    opacity: 1, 
    x: 0,
    transition: {
      // ⏳ C'est ici le secret pour masquer le chargement :
      // On attend 0.15s avant de lancer l'animation d'entrée.
      // Pendant ce temps, React et Supabase chargent les chiffres.
      delay: 0.1, 
      duration: 0.35, 
      ease: [0.25, 1, 0.5, 1] // Courbe "Cubic Bezier" très douce (Style iOS)
    }
  },
  
  // 3. SORTIE : L'ancienne page part vers la GAUCHE (x: -40)
  out: { 
    opacity: 0, 
    x: -40,
    transition: {
      duration: 0.2, // Elle part vite pour laisser la place
      ease: "easeIn"
    }
  },
};

// On garde une transition par défaut vide car on a tout défini dans les variants
const pageTransition = {};

export default function ScrollablePage({ children, onScrollChange }) {
  const isPresent = useIsPresent();
  const scrollRef = useRef(null);
  
  // Sert uniquement à figer l'image pendant l'animation de sortie
  const frozenScrollY = useRef(0);

  // 1. GESTION DU SCROLL EN TEMPS RÉEL
  const handleScroll = (e) => {
    if (isPresent) {
      const y = e.target.scrollTop;
      frozenScrollY.current = y;
      // On informe le Header pour l'effet de verre
      if (onScrollChange) onScrollChange(y > 20);
    }
  };

  // 2. LE FIX VISUEL (Empêche le saut vers le haut pendant la sortie)
  useLayoutEffect(() => {
    // Si la page est en train de partir...
    if (!isPresent && scrollRef.current) {
      // ... on la force à rester figée visuellement
      scrollRef.current.scrollTop = frozenScrollY.current;
    }
  });

  return (
    <motion.div
      initial="initial"
      animate="in"
      exit="out"
      variants={pageVariants}
      transition={pageTransition}
      className="col-start-1 row-start-1 w-full h-full min-h-0"
    >
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className={`h-full w-full overflow-y-auto overflow-x-hidden custom-scrollbar 
          ${UI.layout.mainOffset} 
          ${UI.layout.pagePadding} 
          ${UI.layout.verticalSpacer}`}
      >
        <div className={UI.layout.container}>
          {children}
        </div>
      </div>
    </motion.div>
  );
}