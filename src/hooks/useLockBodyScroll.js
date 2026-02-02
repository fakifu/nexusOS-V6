import { useLayoutEffect } from 'react';

export default function useLockBodyScroll(isLocked = true) {
  useLayoutEffect(() => {
    if (!isLocked) return;

<<<<<<< HEAD
    // 1. Création d'une balise style unique
    const styleId = 'lock-scroll-critical';
    let style = document.getElementById(styleId);

    if (!style) {
      style = document.createElement('style');
      style.id = styleId;
      document.head.appendChild(style);
    }

    // 2. Injection des règles CSS "Force Brute"
    // On cible html, body et #root pour être sûr de bloquer le coupable
    style.innerHTML = `
      html, body, #root {
        overflow: hidden !important;
        overscroll-behavior: none !important;
        touch-action: none !important; /* Bloque le scroll tactile iOS/Android */
        position: fixed !important; /* La clé pour iOS qui refuse d'obéir à overflow: hidden */
        width: 100% !important;
        left: 0 !important;
        top: 0 !important;
      }
    `;

    // 3. Nettoyage au démontage
    return () => {
      // On retire simplement la balise style, tout revient à la normale
      const el = document.getElementById(styleId);
      if (el) el.remove();
    };
  }, [isLocked]);
=======
    // 1. On sauvegarde le style original (souvent 'visible' ou '')
    const originalStyle = window.getComputedStyle(document.body).overflow;

    // 2. On bloque le scroll
    document.body.style.overflow = 'hidden';

    // 3. Fonction de nettoyage : on remet comme c'était quand le composant est démonté
    return () => {
      document.body.style.overflow = originalStyle;
    };
  }, [isLocked]); // Se ré-exécute si l'état de verrouillage change
>>>>>>> b059916d660855e6ecbbb30e2c0fbe19f4e98993
}
