import React, { useRef } from 'react';
import { Search, X } from 'lucide-react';

export default function SearchBar({
  value,
  onChange,
  placeholder = 'Rechercher...',
}) {
  const containerRef = useRef(null);

  const handleFocus = () => {
    // On attend un court instant que le clavier iOS commence à sortir
    setTimeout(() => {
      containerRef.current?.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      });
    }, 100);
  };

  return (
    <div
      ref={containerRef}
      /* On ajoute un scroll-margin-top égal à la hauteur de ton header (ex: 70px)
         pour que le scroll s'arrête pile en dessous.
      */
      style={{ scrollMarginTop: '130px' }}
      className="relative w-full group"
    >
      <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-gray-500 group-focus-within:text-indigo-400 transition-colors">
        <Search size={18} />
      </div>

      <input
        type="text"
        inputMode="search"
        value={value}
        onFocus={handleFocus}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full bg-white/5 rounded-[1.5rem] py-4 pl-12 pr-12 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500/50 focus:bg-white/10 transition-all shadow-inner"
      />

      {value && (
        <button
          onClick={() => onChange('')}
          className="absolute inset-y-0 right-4 flex items-center text-gray-500 hover:text-white transition-colors"
        >
          <X size={18} />
        </button>
      )}
    </div>
  );
}
