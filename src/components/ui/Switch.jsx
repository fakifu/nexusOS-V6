import React, { useId } from 'react';
import { motion } from 'framer-motion';

export default function Switch({ options, value, onChange, colors = {} }) {
  const uniqueLayoutId = useId();
  const totalOptions = options.length;

  return (
    <div className="bg-[#09090b] p-1 rounded-full flex items-center border border-white/10 relative cursor-pointer h-12 w-full select-none overflow-hidden isolate gap-1">
      {options.map((option, index) => {
        const isActive = value === option.value;

        let colorConfig = colors[index];
        if (!colorConfig && totalOptions === 2) {
          colorConfig = index === 0 ? colors.left : colors.right;
        }

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
            className={`
              relative z-10 h-full flex items-center justify-center gap-2 text-[10px] uppercase tracking-wider font-bold transition-colors duration-200 rounded-full
              ${option.className ? option.className : 'flex-1'}
              ${
                isActive
                  ? activeColors.text
                  : 'text-gray-500 hover:text-gray-300'
              }
            `}
          >
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
            <span className="relative z-20 flex items-center gap-2">
              {option.icon && <option.icon size={16} />}
              {option.label && (
                <span
                  className={option.className?.includes('w-12') ? 'hidden' : ''}
                >
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
