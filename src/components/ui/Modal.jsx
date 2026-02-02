import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

// 👇 1. On importe ton Hook existant
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
  const [mounted, setMounted] = useState(false);

  // 👇 2. On utilise ton Hook ici (une seule ligne, c'est magique)
  useLockBodyScroll(isOpen);

  useEffect(() => {
    setMounted(true);
    const handleEsc = (e) => e.key === 'Escape' && onClose();
    if (isOpen) window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isOpen, onClose]);

  if (!mounted) return null;

  const style = VARIANTS[type] || VARIANTS.center;

  const modalContent = (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[9999] flex flex-col pointer-events-none">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className={`absolute inset-0 bg-black/60 backdrop-blur-sm pointer-events-auto flex ${style.overlay}`}
          >
            <motion.div
              initial={style.initial}
              animate={style.animate}
              exit={style.exit}
              onClick={(e) => e.stopPropagation()}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className={`${style.content} bg-[#09090b] border border-white/10 shadow-2xl flex flex-col max-h-[85vh] overflow-hidden relative`}
            >
              {/* HEADER TRANSPARENT */}
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

              {/* BODY SCROLLABLE */}
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

  return createPortal(modalContent, document.body);
}
