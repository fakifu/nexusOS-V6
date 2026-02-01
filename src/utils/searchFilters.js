/**
 * Moteur de recherche polyvalent
 * @param {Array} data - Le tableau d'objets (transactions, habits, etc.)
 * @param {String} query - La saisie utilisateur
 * @param {Function} formatFn - Comment transformer l'objet en texte de recherche
 */
export const universalSearch = (data, query, formatFn) => {
  if (!query) return data;

  // On découpe la recherche en mots (ex: ["samedi", "janvier"])
  const searchTerms = query.toLowerCase().trim().split(/\s+/);

  return data.filter((item) => {
    const searchableString = formatFn(item).toLowerCase();

    // La magie : TOUS les mots saisis doivent être présents dans le sac de mots
    return searchTerms.every((term) => searchableString.includes(term));
  });
};

// --- LOGIQUE SPÉCIFIQUE AUX TRANSACTIONS ---
export const formatTransactionForSearch = (t) => {
  const dateObj = new Date(t.date);
  const [y, m, d] = t.date.split('-');

  // Noms des mois pour recherche textuelle
  const months = [
    'janvier',
    'fevrier',
    'mars',
    'avril',
    'mai',
    'juin',
    'juillet',
    'aout',
    'septembre',
    'octobre',
    'novembre',
    'decembre',
  ];

  // Noms des jours
  const days = [
    'dimanche',
    'lundi',
    'mardi',
    'mercredi',
    'jeudi',
    'vendredi',
    'samedi',
  ];

  const amount = Math.abs(t.amount).toString();
  const typeLabel = t.amount > 0 ? 'revenu + entree' : 'depense - sortie';

  return `
    ${t.title} 
    ${t.category} 
    ${t.description || ''} 
    ${amount} ${amount}€ 
    ${typeLabel}
    ${d}-${m}-${y} ${d}/${m}/${y} ${d}-${m}-${y.slice(2)}
    ${months[dateObj.getMonth()]} 
    ${days[dateObj.getDay()]}
  `
    .toLowerCase()
    .trim();
};

// --- LOGIQUE SPÉCIFIQUE AU RESELL (Anticipation) ---
export const formatResellForSearch = (item) => {
  return `${item.name} ${item.brand} ${item.size} ${item.price}€`.trim();
};
