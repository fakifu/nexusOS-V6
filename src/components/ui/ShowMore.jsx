import React from 'react';
import { UI } from '../../designSystem'; // Nécessaire pour UI.btnGhost

export default function ShowMore({ isVisible, onClick }) {
  if (!isVisible) return null;

  return (
    <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-black via-black/80 to-transparent flex items-end justify-center pb-2 z-10 rounded-b-2xl pointer-events-none">
      <button
        onClick={onClick}
        className={`${UI.btnGhost} pointer-events-auto bg-black border border-white/20 text-xs px-8 py-3 shadow-2xl hover-bg-light backdrop-blur-md text-white font-bold rounded-full transition-all active:scale-95`}
      >
        Afficher plus
      </button>
    </div>
  );
}
