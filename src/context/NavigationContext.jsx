import React, { createContext, useContext, useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const NavigationContext = createContext();

export function NavigationProvider({ children }) {
  const location = useLocation();

  // On garde JUSTE la mémoire des onglets (utile pour la Sidebar)
  const [memory, setMemory] = useState({
    finance: '/finance',
    business: '/business',
    invest: '/invest',
    personal: '/personal',
  });

  useEffect(() => {
    const path = location.pathname;
    if (path.startsWith('/finance'))
      setMemory((p) => ({ ...p, finance: path }));
    else if (path.startsWith('/business'))
      setMemory((p) => ({ ...p, business: path }));
    else if (path.startsWith('/invest'))
      setMemory((p) => ({ ...p, invest: path }));
    else if (path.startsWith('/personal'))
      setMemory((p) => ({ ...p, personal: path }));
  }, [location.pathname]);

  return (
    // Plus de saveScrollPosition ni getScrollPosition ici
    <NavigationContext.Provider value={{ memory }}>
      {children}
    </NavigationContext.Provider>
  );
}

export const useNavigation = () => useContext(NavigationContext);
