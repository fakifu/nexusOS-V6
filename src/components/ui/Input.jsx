import React from 'react';
import { UI } from '../../designSystem';

export default function Input({ className = '', type = 'text', ...props }) {
  // Si c'est un nombre, on force le pavé numérique decimal (pour avoir la virgule sur iPhone/Android)
  const inputMode =
    props.inputMode || (type === 'number' ? 'decimal' : undefined);

  return (
    <input
      type={type}
      inputMode={inputMode}
      // On combine le style de base UI.input avec tes classes perso (className)
      className={`${UI.input} ${className}`}
      {...props}
    />
  );
}
