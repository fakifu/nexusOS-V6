import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';
import { UI } from '../../designSystem'; // Assure-toi que le chemin est bon depuis ce fichier

export default function CustomSelect({
  label,
  value,
  options,
  onChange,
  placeholder = 'Sélectionner',
}) {
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef(null);

  // Fermer si on clique ailleurs
  useEffect(() => {
    function handleClickOutside(event) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [wrapperRef]);

  // Trouver le label de la valeur actuelle
  const selectedLabel =
    options.find((opt) => opt.value === value)?.label || value || placeholder;

  return (
    <div className="relative w-full" ref={wrapperRef}>
      {label && (
        <label className="block text-[10px] text-gray-500 uppercase font-black tracking-widest mb-2 px-1">
          {label}
        </label>
      )}

      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full flex justify-between items-center ${
          UI.input
        } cursor-pointer hover:border-white/20 active:scale-[0.99] transition-all duration-200 ${
          isOpen ? 'border-indigo-500 ring-1 ring-indigo-500/20 bg-white/5' : ''
        }`}
      >
        <span
          className={`truncate font-bold ${
            !value ? 'text-gray-500' : 'text-white'
          }`}
        >
          {selectedLabel}
        </span>
        <ChevronDown
          size={18}
          className={`text-gray-500 transition-transform duration-300 ${
            isOpen ? 'rotate-180 text-indigo-400' : ''
          }`}
        />
      </button>

      {isOpen && (
        <div className="absolute z-[100] w-full mt-2 bg-[#0A0A0A]/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.8)] max-h-64 overflow-y-auto custom-scrollbar animate-fade-in origin-top">
          <div className="p-1.5">
            {options.map((opt) => (
              <div
                key={opt.value}
                onClick={() => {
                  onChange(opt.value);
                  setIsOpen(false);
                }}
                className={`px-4 py-3 rounded-xl cursor-pointer flex justify-between items-center group transition-all duration-200 ${
                  opt.value === value
                    ? 'bg-indigo-600/10 text-indigo-400'
                    : 'text-gray-400 hover:bg-white/5 hover:text-white'
                }`}
              >
                <span className="text-xs font-bold">{opt.label}</span>
                {opt.value === value && (
                  <Check size={14} className="text-indigo-400" />
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
