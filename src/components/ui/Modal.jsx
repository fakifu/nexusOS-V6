import React, { useEffect, useState } from 'react';
<<<<<<< HEAD
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

// 👇 1. On importe ton Hook existant
=======
import { createPortal } from 'react-dom'; // 👈 L'outil magique
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
>>>>>>> b059916d660855e6ecbbb30e2c0fbe19f4e98993
import useLockBodyScroll from '../../hooks/useLockBodyScroll';

const VARIANTS = {
  center: {
    overlay: 'items-center justify-center p-4',
    content: 'w-full max-w-md rounded-[2rem]',
    initial: { opacity: 0, scale: 0.95, y: 10 },
    animate: { opacity: 1, scale: 1, y: 0 },
    exit: { opacity: 0, scale: 0.95, y: 10 },
  },
  bottom: {
    overlay: 'items-end sm:items-center justify-center sm:p-4',
    content: 'w-full sm:max-w-md rounded-t-[2.5rem] sm:rounded-[2.5rem]',
    initial: { y: '100%' },
    animate: { y: 0 },
    exit: { y: '100%' },
  },
  alert: {
    overlay: 'items-center justify-center p-6',
    content: 'w-full max-w-xs rounded-[2rem] text-center',
    initial: { opacity: 0, scale: 0.9 },
    animate: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 0.9 },
  },
};

export default function Modal({
  isOpen,
  onClose,
  title,
  children,
  type = 'center',
  icon: Icon,
}) {
<<<<<<< HEAD
  const [mounted, setMounted] = useState(false);

  // 👇 2. On utilise ton Hook ici (une seule ligne, c'est magique)
  useLockBodyScroll(isOpen);

=======
  // Petite astuce pour éviter les erreurs "document undefined" lors du rendu serveur (SSR)
  const [mounted, setMounted] = useState(false);

  useLockBodyScroll(isOpen);
>>>>>>> b059916d660855e6ecbbb30e2c0fbe19f4e98993
  useEffect(() => {
    setMounted(true);
    const handleEsc = (e) => e.key === 'Escape' && onClose();
    if (isOpen) window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isOpen, onClose]);

<<<<<<< HEAD
=======
  // Si on n'est pas encore "monté" dans le navigateur, on ne rend rien
>>>>>>> b059916d660855e6ecbbb30e2c0fbe19f4e98993
  if (!mounted) return null;

  const style = VARIANTS[type] || VARIANTS.center;

<<<<<<< HEAD
  const modalContent = (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[9999] flex flex-col pointer-events-none">
=======
  // On crée le JSX de la modale
  const modalContent = (
    <AnimatePresence>
      {isOpen && (
        // z-[9999] assure que la modale passe AU-DESSUS de tout, même des headers fixes
        <div className="fixed inset-0 z-[9999] flex flex-col pointer-events-none">
          {/* Overlay avec Backdrop Blur qui couvre TOUT l'écran */}
>>>>>>> b059916d660855e6ecbbb30e2c0fbe19f4e98993
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className={`absolute inset-0 bg-black/60 backdrop-blur-sm pointer-events-auto flex ${style.overlay}`}
          >
<<<<<<< HEAD
=======
            {/* Contenu de la modale */}
>>>>>>> b059916d660855e6ecbbb30e2c0fbe19f4e98993
            <motion.div
              initial={style.initial}
              animate={style.animate}
              exit={style.exit}
              onClick={(e) => e.stopPropagation()}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className={`${style.content} bg-[#09090b] border border-white/10 shadow-2xl flex flex-col max-h-[85vh] overflow-hidden relative`}
            >
<<<<<<< HEAD
              {/* HEADER TRANSPARENT */}
=======
              {/* HEADER TRANSPARENT (Ta demande précédente) */}
>>>>>>> b059916d660855e6ecbbb30e2c0fbe19f4e98993
              {type !== 'alert' && (
                <div className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between px-6 h-16 bg-gradient-to-b from-black/40 to-transparent backdrop-blur-md border-b border-white/5">
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    {Icon && <Icon size={18} className="text-indigo-400" />}
                    {title}
                  </h3>
                  <button
                    onClick={onClose}
                    className="p-1 rounded-full bg-white/5 text-gray-400 hover:text-white transition border border-white/5 hover:bg-white/10"
                  >
                    <X size={20} />
                  </button>
                </div>
              )}

<<<<<<< HEAD
              {/* BODY SCROLLABLE */}
=======
              {/* BODY */}
>>>>>>> b059916d660855e6ecbbb30e2c0fbe19f4e98993
              <div
                className={`flex-1 min-h-0 relative flex flex-col ${
                  type !== 'alert' ? 'pt-16' : ''
                }`}
              >
                {children}
              </div>
            </motion.div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );

<<<<<<< HEAD
=======
  // 👇 C'est ici que la magie opère : On injecte directement dans <body>
>>>>>>> b059916d660855e6ecbbb30e2c0fbe19f4e98993
  return createPortal(modalContent, document.body);
}
