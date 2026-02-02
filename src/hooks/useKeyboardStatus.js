import { useState, useEffect } from 'react';

export default function useKeyboardStatus() {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const handleFocus = (e) => {
      // On vérifie si l'élément qui prend le focus est un champ de texte
      const isTextInput =
        (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') &&
        !['checkbox', 'radio', 'submit', 'button', 'file'].includes(
          e.target.type
        );

      if (isTextInput) {
        setIsOpen(true);
      }
    };

    const handleBlur = () => {
      // Quand on sort du champ, on considère que le clavier se ferme
      setIsOpen(false);
    };

    // focusin/out bouillonnent, contrairement à focus/blur, donc on capte tout
    window.addEventListener('focusin', handleFocus);
    window.addEventListener('focusout', handleBlur);

    return () => {
      window.removeEventListener('focusin', handleFocus);
      window.removeEventListener('focusout', handleBlur);
    };
  }, []);

  return isOpen;
}
