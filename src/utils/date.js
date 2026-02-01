/**
 * Utilitaires pour gérer les dates proprement (Local vs UTC)
 * Objectif : Éviter les décalages de jours dus aux fuseaux horaires
 */

// Retourne une date au format YYYY-MM-DD (format local, sans conversion UTC)
export const formatdateToISO = (date) => {
  if (!date) return '';
  const d = new Date(date);
  // On décale la date pour compenser le fuseau horaire avant de toISOString
  // C'est une méthode robuste pour garder "ce que l'utilisateur voit"
  const offset = d.getTimezoneOffset();
  const localDate = new Date(d.getTime() - offset * 60 * 1000);
  return localDate.toISOString().split('T')[0];
};

// Retourne le premier et le dernier jour du mois pour une requête BDD
// Format de retour : { startStr: '2026-02-01', endStr: '2026-02-28' }
export const getMonthBoundaries = (dateObj) => {
  const year = dateObj.getFullYear();
  const month = dateObj.getMonth();

  // Astuce du "Midi" encapsulée ici : on se met à 12h pour éviter les sauts de jour
  const startObj = new Date(year, month, 1, 12, 0, 0);
  const endObj = new Date(year, month + 1, 0, 12, 0, 0);

  return {
    startStr: startObj.toISOString().split('T')[0],
    endStr: endObj.toISOString().split('T')[0],
  };
};

// Formate une date string (2026-01-31) en affichage français (31/01/2026)
export const formatDisplayDate = (dateStr) => {
  if (!dateStr) return '';
  // On découpe manuellement pour éviter toute interprétation de fuseau horaire par le navigateur
  const [year, month, day] = dateStr.split('-');
  return `${day}/${month}/${year}`;
};
