import React, { useState } from 'react';
import { Save, AlertCircle } from 'lucide-react';
import { supabase } from '../../supabaseClient';
import { PERSONAL_CATEGORIES } from '../../utils/personalCategories';
import { UI } from '../../designSystem';
import Input from '../ui/Input';

export default function BudgetForm({
  monthKey,
  currentBudgets,
  onSuccess,
  onClose,
}) {
  const [loading, setLoading] = useState(false);
  const [localBudgets, setLocalBudgets] = useState({ ...currentBudgets });
  const [error, setError] = useState(null);

  const handleSave = async () => {
    setLoading(true);
    setError(null);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      // On prépare les données à envoyer
      const updates = Object.keys(localBudgets)
        .map((cat) => {
          const rawValue = localBudgets[cat];
          // On convertit en nombre, ou 0 si vide
          const amount =
            rawValue === '' || rawValue === undefined
              ? 0
              : parseFloat(rawValue);

          return {
            user_id: user.id,
            month_key: monthKey,
            category: cat,
            amount: amount,
          };
        })
        // On ne garde que les budgets qui ont une valeur positive (ou 0 pour écraser)
        .filter((item) => item.amount >= 0);

      if (updates.length > 0) {
        // C'EST ICI QUE ÇA SE JOUE :
        // OnConflict doit correspondre exactement à la contrainte créée en SQL
        const { error } = await supabase
          .from('monthly_budgets')
          .upsert(updates, { onConflict: 'user_id, month_key, category' });

        if (error) throw error;
      }

      onSuccess();
      onClose();
    } catch (err) {
      console.error('Erreur save budget:', err);
      setError("Impossible d'enregistrer. Vérifie ta connexion.");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (cat, value) => {
    if (parseFloat(value) < 0) return;
    setLocalBudgets((prev) => ({ ...prev, [cat]: value }));
  };

  const hasBudget = (cat) => {
    const val = localBudgets[cat];
    return val !== '' && val !== undefined && parseFloat(val) > 0;
  };

  return (
    // H-FULL est important pour prendre toute la hauteur de la modale
    <div className="flex flex-col h-full bg-[#0A0A0A] overflow-hidden relative">
      {/* 1. HEADER (Fixe & Transparent) */}
      <div className="absolute top-0 left-0 right-0 z-10 px-6 py-4 bg-gradient-to-b from-[#0A0A0A] via-[#0A0A0A]/90 to-transparent backdrop-blur-md border-b border-white/5">
        <p className="text-sm text-indigo-300 flex items-center gap-2 font-medium">
          <AlertCircle size={14} />
          Définis tes plafonds pour ce mois.
        </p>
      </div>

      {/* 2. LISTE (Scrollable - Prend tout l'espace restant) */}
      {/* pt-16 pour compenser le header fixe, pb-28 pour le footer fixe */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-3 min-h-0 pt-16 pb-28">
        {Object.keys(PERSONAL_CATEGORIES).map((cat) => {
          const conf = PERSONAL_CATEGORIES[cat];
          const isActive = hasBudget(cat);

          return (
            <div
              key={cat}
              className={`flex items-center justify-between gap-3 p-3 rounded-2xl border transition-all ${
                isActive
                  ? 'bg-white/5 border-white/10'
                  : 'bg-transparent border-transparent opacity-60 hover:opacity-100 hover:bg-white/5'
              }`}
            >
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div
                  className={`p-2.5 rounded-xl shrink-0 ${conf.bg} ${conf.color}`}
                >
                  <conf.icon size={18} />
                </div>
                <span className="text-sm font-bold text-gray-200 truncate">
                  {conf.label}
                </span>
              </div>

              <div className="relative w-28 shrink-0">
                <div
                  className={`flex items-center bg-[#151515] border rounded-xl focus-within:border-indigo-500 focus-within:ring-1 focus-within:ring-indigo-500/50 transition-all overflow-hidden ${
                    isActive ? 'border-indigo-500/30' : 'border-white/10'
                  }`}
                >
                  <Input
                    type="number"
                    value={localBudgets[cat] || ''}
                    onChange={(e) => handleChange(cat, e.target.value)}
                    placeholder="0"
                    // On retire padding-right pour coller au symbole €
                    className="w-full bg-transparent border-none text-right font-bold text-white py-2 pl-2 pr-1 text-base"
                  />
                  <div className="pr-3 pl-1 text-gray-500 font-bold text-sm select-none bg-[#151515] h-full flex items-center">
                    €
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* 3. FOOTER (Fixe & Transparent) */}
      <div className="absolute bottom-0 left-0 right-0 z-10 p-6 border-t border-white/5 bg-gradient-to-t from-[#0A0A0A] via-[#0A0A0A]/90 to-transparent backdrop-blur-md">
        {error && (
          <p className="text-red-400 text-xs text-center mb-3 font-bold">
            {error}
          </p>
        )}

        <button
          onClick={handleSave}
          disabled={loading}
          className={`${UI.btnPrimary} w-full py-4 rounded-3xl shadow-lg shadow-indigo-900/20`}
        >
          {loading ? (
            'Sauvegarde...'
          ) : (
            <>
              <Save size={18} /> Enregistrer
            </>
          )}
        </button>
      </div>
    </div>
  );
}
