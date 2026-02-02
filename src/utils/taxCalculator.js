// src/utils/taxCalculator.js

export const TAX_REGIMES = {
  MICRO_STANDARD: { label: 'Micro-Entreprise (Standard)' },
  MICRO_ACRE: { label: 'Micro-Entreprise (ACRE -50%)' },
  UNDECLARED: { label: 'Non Déclaré / Perso' },
};

export const calculateTax = ({
  amount,
  type = 'RESELL',
  regime = 'MICRO_STANDARD',
  allRates = [],
  year = new Date().getFullYear(),
}) => {
  // 1. Sécurité de base
  if (!amount || amount <= 0 || regime === 'UNDECLARED') return 0;

  // 2. Récupération des taux
  // A. On cherche l'année exacte
  let ratesForYear = allRates.find((r) => r.year === year);

  // B. (NOUVEAU) Si l'année n'existe pas (ex: 2026), on prend l'année la plus récente disponible
  if (!ratesForYear && allRates.length > 0) {
    // On trie par année décroissante et on prend la première
    const sortedRates = [...allRates].sort((a, b) => b.year - a.year);
    ratesForYear = sortedRates[0];
    console.warn(
      `[Tax] Année ${year} introuvable. Utilisation des taux de ${ratesForYear.year}.`
    );
  }

  // 3. FAILSAFE ULTIME : Si vraiment rien en DB, on renvoie 0
  if (!ratesForYear) {
    console.error(`[Tax] CRITIQUE : Aucun taux trouvé dans la configuration.`);
    return 0;
  }

  // 4. Détermination du taux applicable
  const baseRate =
    type === 'SERVICE' ? ratesForYear.rate_service : ratesForYear.rate_resell;

  let finalRate = baseRate / 100;

  // 5. Application du modificateur ACRE
  if (regime === 'MICRO_ACRE') {
    finalRate = finalRate / 2;
  }

  // 6. Calcul final
  const tax = amount * finalRate;
  return Math.ceil(tax * 100) / 100;
};
