import React from 'react';
import { Search, X } from 'lucide-react';
import { UI } from '../../designSystem';

export default function SearchBar({
  value,
  onChange,
  placeholder = 'Rechercher...',
}) {
  return (
    <div className="relative w-full group">
      <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-gray-500 group-focus-within:text-indigo-400 transition-colors">
        <Search size={18} />
      </div>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full bg-white/5 border border-white/10 rounded-[1.5rem] py-4 pl-12 pr-12 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500/50 focus:bg-white/10 transition-all shadow-inner"
      />
      {value && (
        <button
          onClick={() => onChange('')}
<<<<<<< HEAD
          className="absolute inset-y-0 right-4 flex items-center text-gray-500 hover-text-bright transition-colors"
=======
          className="absolute inset-y-0 right-4 flex items-center text-gray-500 hover:text-white transition-colors"
>>>>>>> b059916d660855e6ecbbb30e2c0fbe19f4e98993
        >
          <X size={18} />
        </button>
      )}
    </div>
  );
}
