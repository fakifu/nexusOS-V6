import { useLayoutEffect } from 'react';

export default function useLockBodyScroll(isLocked = true) {
  useLayoutEffect(() => {
    if (!isLocked) return;

    // 1. On sauvegarde le style original (souvent 'visible' ou '')
    const originalStyle = window.getComputedStyle(document.body).overflow;

    // 2. On bloque le scroll
    document.body.style.overflow = 'hidden';

    // 3. Fonction de nettoyage : on remet comme c'était quand le composant est démonté
    return () => {
      document.body.style.overflow = originalStyle;
    };
  }, [isLocked]); // Se ré-exécute si l'état de verrouillage change
}
