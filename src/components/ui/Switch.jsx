import React, { useId } from 'react';
import { motion } from 'framer-motion';

export default function Switch({
  options, // [{ value, label, icon, className? }] -> className permet de gérer la largeur
  value,
  onChange,
  colors = {}, // {0: {bg, border, text}, ...} OU {left, right}
}) {
  const uniqueLayoutId = useId(); // Pour éviter les conflits si plusieurs switchs sur la page
  const totalOptions = options.length;

  return (
    <div className="bg-[#09090b] p-1 rounded-full flex items-center border border-white/10 relative cursor-pointer h-12 w-full select-none overflow-hidden isolate gap-1">
      {options.map((option, index) => {
        const isActive = value === option.value;

        // --- RÉSOLUTION DES COULEURS ---
        // On cherche la config spécifique à l'index, sinon fallback sur left/right pour les switchs binaires
        let colorConfig = colors[index];
        if (!colorConfig && totalOptions === 2) {
          colorConfig = index === 0 ? colors.left : colors.right;
        }
        
        // Fallback par défaut (Indigo)
        const activeColors = colorConfig || {
          bg: 'rgba(99, 102, 241, 0.2)',
          border: 'rgba(99, 102, 241, 0.5)',
          text: 'text-indigo-400',
        };

        return (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            // Si option.className existe (ex: w-12), on l'utilise, sinon on prend flex-1 (largeur égale)
            className={`
              relative z-10 h-full flex items-center justify-center gap-2 text-[10px] uppercase tracking-wider font-bold transition-colors duration-200 rounded-full outline-none
              ${option.className ? option.className : 'flex-1'}
              ${isActive ? activeColors.text : 'text-gray-500 hover:text-gray-300'}
            `}
          >
            {/* FOND ANIMÉ (La Pillule Magique) */}
            {isActive && (
              <motion.div
                layoutId={`active-pill-${uniqueLayoutId}`}
                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                className="absolute inset-0 rounded-full shadow-lg -z-10 border"
                initial={false}
                animate={{
                  backgroundColor: activeColors.bg,
                  borderColor: activeColors.border,
                }}
              />
            )}

            {/* CONTENU DU BOUTON */}
            <span className="relative z-20 flex items-center gap-2">
              {option.icon && <option.icon size={16} />}
              {/* On cache le label si c'est un bouton rond (w-12 par ex) ou si demandé */}
              {option.label && (
                <span className={option.className?.includes('w-12') ? 'hidden md:block' : ''}>
                  {option.label}
                </span>
              )}
            </span>
          </button>
        );
      })}
    </div>
  );
}