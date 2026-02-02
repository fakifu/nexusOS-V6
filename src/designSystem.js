export const COLORS = {
  primary: 'indigo-500',
  secondary: 'emerald-400',
  danger: 'red-500',
  surface: 'bg-[#0A0A0A]',
  card: 'bg-[#050505]',
  border: 'border-white/10',
  text: 'text-gray-200',
};

export const SHAPES = {
  rounded: 'rounded-2xl',
  card: 'rounded-[2.5rem]',
  btn: 'rounded-2xl',
  item: 'rounded-3xl',
};

export const UI = {
  // Layout
  layout: {
<<<<<<< HEAD
    sidebarWidth: 'w-72', // La largeur physique (288px)
    topMargin: 'top-4 md:top-6',

    // L'espace total à gauche pour le contenu sur PC
    // (Sidebar 288px + 48px de gouttière = 336px)
    mainOffset: 'md:pl-[336px]',
    headerOffset: 'md:left-[336px]',

    // Marges horizontales (Mobile : 8px | PC : 40px à droite)
    pagePadding: 'px-4 md:px-0 md:pr-10',

    // Marges verticales pour éviter la superposition
    verticalSpacer: 'pt-24 pb-32',

    // Pour les éléments internes qui doivent respirer
    container: 'w-full relative min-h-full',
=======
    sidebarWidth: "w-72", // La largeur physique (288px)
    topMargin: "top-2 md:top-6",
    
    // L'espace total à gauche pour le contenu sur PC 
    // (Sidebar 288px + 48px de gouttière = 336px)
    mainOffset: "md:pl-[336px]", 
    headerOffset: "md:left-[336px]",
    
    // Marges horizontales (Mobile : 8px | PC : 40px à droite)
    pagePadding: "px-2 md:px-0 md:pr-10",
    
    // Marges verticales pour éviter la superposition
    verticalSpacer: "pt-24 pb-32",
    
    // Pour les éléments internes qui doivent respirer
    container: "w-full relative min-h-full"
>>>>>>> b059916d660855e6ecbbb30e2c0fbe19f4e98993
  },

  // Cards
  card: `bg-[#050505] border border-white/10 ${SHAPES.card} relative overflow-hidden`,
<<<<<<< HEAD
  cardInteractive: `bg-[#050505] border border-white/5 transition-all cursor-pointer active:scale-[0.98] ${SHAPES.item} shadow-hover-fix`,
=======
  cardInteractive: `bg-[#050505] border border-white/5 hover:border-white/20 hover:bg-white/5 transition-all cursor-pointer active:scale-[0.98] ${SHAPES.item}`,
>>>>>>> b059916d660855e6ecbbb30e2c0fbe19f4e98993
  cardCompact: `bg-[#050505] border border-white/5 rounded-3xl`,

  // Modal
  modalOverlay:
    'fixed inset-0 z-[60] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in',
  modalContent: `bg-[#0A0A0A] border border-white/10 w-full max-w-sm mx-auto rounded-[2rem] shadow-2xl relative overflow-hidden animate-slide-up`,

  // Buttons (CORRIGÉ : Indigo par défaut, plus de blanc)
<<<<<<< HEAD
  btnPrimary: `bg-indigo-600 text-white font-bold flex items-center justify-center gap-2 transition-colors active:scale-95 shadow-lg shadow-indigo-900/20 btn-primary-fix`,

  btnGhost: `bg-transparent border border-white/10 text-gray-400 transition-colors active:scale-95 flex items-center justify-center gap-2 btn-ghost-fix`,
=======
  btnPrimary: `bg-indigo-600 text-white font-bold flex items-center justify-center gap-2 hover:bg-indigo-500 transition-colors active:scale-95 shadow-lg shadow-indigo-900/20`,

  btnGhost: `bg-transparent border border-white/10 text-gray-400 hover:text-white hover:border-white/30 hover:bg-white/5 transition-colors active:scale-95 flex items-center justify-center gap-2`,
>>>>>>> b059916d660855e6ecbbb30e2c0fbe19f4e98993

  // Inputs
  input: `w-full bg-transparent border-b border-gray-800 focus:border-white py-2 text-white outline-none transition-colors placeholder-gray-600`,
  label: `block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1`,
};

export const TEXT = {
  h1: 'text-3xl md:text-4xl font-black tracking-tight text-white',
  h2: 'text-2xl font-bold text-white',
  h3: 'text-xl font-bold text-white',
  label: 'text-[10px] font-bold text-gray-500 uppercase tracking-widest',
  // CORRIGÉ : J'ai retiré 'font-mono' ici 👇
  value: 'font-bold tracking-tight',
};
