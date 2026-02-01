import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
// ✅ AJOUT : On ajoute les icônes pour le style (et au cas où tu en voulais)
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

const formatMoney = (val) => {
  // SÉCURITÉ : Si val n'est pas un nombre, on renvoie 0€ pour éviter le crash
  if (val === undefined || val === null || isNaN(val)) return '0 €';
  
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0,
  }).format(val);
};

export default function BigNumber({
  label = "TITRE",
  value = 0,
  subLabel = null,
  subValue = null,
  color = "indigo"
}) {
  
  const glowColors = {
    indigo: 'bg-indigo-500/20',
    rose: 'bg-rose-500/20',
    emerald: 'bg-emerald-500/20',
    amber: 'bg-amber-500/20',
    blue: 'bg-blue-500/20',
  };

  const selectedGlow = glowColors[color] || glowColors.indigo;

  // Détermination de l'icône et de la couleur pour la sous-valeur
  let SubIcon = Minus;
  let subColor = 'text-gray-500';
  
  if (subValue !== null && !isNaN(subValue)) {
    if (subValue > 0) {
      SubIcon = TrendingUp;
      subColor = 'text-emerald-500';
    } else if (subValue < 0) {
      SubIcon = TrendingDown;
      subColor = 'text-red-500';
    }
  }

  return (
    <div className="flex flex-col items-center justify-center py-10 relative mb-6">
      
      {/* 1. EFFET DE LUEUR (GLOW) */}
      <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-40 h-40 ${selectedGlow} blur-[80px] rounded-full pointer-events-none`} />
      
      {/* 2. LABEL DU HAUT */}
      <span className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.3em] mb-3 relative z-10">
        {label}
      </span>

      {/* 3. GROS CHIFFRE ANIMÉ */}
      <AnimatePresence mode="wait">
        <motion.h1
          // SÉCURITÉ : On s'assure que la key est une string ou un number valide
          key={value || 0}
          initial={{ opacity: 0, scale: 0.9, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 200, damping: 20 }}
          className="text-6xl md:text-8xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-white via-white to-gray-600 relative z-10 py-2"
        >
          {formatMoney(value)}
        </motion.h1>
      </AnimatePresence>

      {/* 4. SOUS-LIGNE (Optionnelle) */}
      {(subLabel || subValue !== null) && (
        <div className="relative z-10 flex items-center gap-2 mt-2">
          {subLabel && (
            <span className="text-xs font-bold text-gray-600 uppercase tracking-widest">
              {subLabel}
            </span>
          )}
          
          {subValue !== null && (
            <div className={`flex items-center gap-1 text-lg font-bold ${subColor}`}>
              <SubIcon size={16} />
              <span>
                {subValue > 0 ? '+' : ''}
                {formatMoney(subValue)}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}