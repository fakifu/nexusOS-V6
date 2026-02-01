/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        background: '#000000', // Noir OLED
        surface: '#050505', // Gris très foncé (Cartes)
        primary: '#6366f1', // Indigo (Couleur d'accent)
      },
      borderRadius: {
        box: '2.5rem', // 🟣 Règle pour les Conteneurs (Cartes)
        field: '1.5rem', // 🟣 Règle pour les Champs (Inputs, Boutons)
      },
    },
  },
  plugins: [],
};
