import React, { useState, useEffect } from 'react';
import { supabase } from '../../../supabaseClient'; // 3 niveaux car dans pages/business/resell
import {
  ChevronDown,
  Receipt,
  Plus,
  Trash2,
  Loader2,
  X,
  AlertCircle,
} from 'lucide-react';
import { formatEuro } from '../../../utils/format';
import { UI } from '../../../designSystem';

export default function ExpenseSection({
  category,
  currentMonthKey,
  onExpenseChange,
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);

  const [newExpense, setNewExpense] = useState({
    title: '',
    amount: '',
    date: new Date().toISOString().split('T')[0],
  });

  // Calcul du total
  const total = expenses.reduce((acc, curr) => acc + (curr.amount || 0), 0);

  // État du bouton confirmer
  const isFormInvalid =
    !newExpense.title ||
    !newExpense.amount ||
    parseFloat(newExpense.amount) <= 0;

  useEffect(() => {
    fetchExpenses();
  }, [currentMonthKey, category]);

  useEffect(() => {
    if (onExpenseChange) onExpenseChange(total);
  }, [total, onExpenseChange]);

  const fetchExpenses = async () => {
    setLoading(true);
    try {
      const startDate = `${currentMonthKey}-01`;
      // Astuce pour trouver le dernier jour du mois sans bug
      const [year, month] = currentMonthKey.split('-');
      const lastDay = new Date(year, month, 0).getDate();
      const endDate = `${currentMonthKey}-${lastDay}`;

      const { data, error } = await supabase
        .from('business_expenses')
        .select('*')
        .eq('category', category)
        .gte('date', startDate)
        .lte('date', endDate)
        .order('date', { ascending: false });

      if (error) throw error;
      setExpenses(data || []);
    } catch (err) {
      console.error('Erreur fetch:', err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAddExpense = async (e) => {
    e.preventDefault();
    if (isFormInvalid) return;

    try {
      const { data, error } = await supabase
        .from('business_expenses')
        .insert([
          {
            name: newExpense.title,
            amount: Math.abs(parseFloat(newExpense.amount)), // On force la valeur positive
            date: newExpense.date,
            category: category,
            is_recurring: false,
          },
        ])
        .select();

      if (error) throw error;
      if (data) {
        setExpenses((prev) => [data[0], ...prev]);
        setNewExpense({
          title: '',
          amount: '',
          date: new Date().toISOString().split('T')[0],
        });
        setShowAddForm(false);
      }
    } catch (err) {
      console.error('Erreur insert:', err.message);
      alert("Erreur lors de l'ajout : " + err.message);
    }
  };

  const deleteExpense = async (id) => {
    if (!window.confirm('Supprimer cette dépense ?')) return;
    try {
      const { error } = await supabase
        .from('business_expenses')
        .delete()
        .eq('id', id);
      if (error) throw error;
      setExpenses((prev) => prev.filter((e) => e.id !== id));
    } catch (err) {
      console.error('Erreur delete:', err.message);
    }
  };

  return (
    <div className="w-full">
      {/* TOGGLE PRINCIPAL */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className={`${UI.cardInteractive} w-full p-5 flex items-center justify-between group`}
      >
        <div className="flex items-center gap-4">
          <div className="p-3 bg-red-500/10 rounded-2xl text-red-500 group-hover:scale-110 transition-transform shadow-lg shadow-red-900/10">
            <Receipt size={22} />
          </div>
          <div className="text-left">
            <h3 className="text-sm font-bold text-white uppercase tracking-widest">
              Frais Mensuels
            </h3>
            <p className="text-[10px] text-gray-500 font-medium italic">
              Déductibles
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-[10px] text-gray-500 uppercase font-bold tracking-widest">
              Total
            </p>
            <p className="text-lg font-bold text-red-500">
              -{formatEuro(total)}
            </p>
          </div>
          <div
            className={`p-2 rounded-full bg-white/5 text-gray-500 group-hover:text-white transition-all duration-300 ${
              isExpanded ? 'rotate-180 bg-white/10 text-white' : ''
            }`}
          >
            <ChevronDown size={20} />
          </div>
        </div>
      </button>

      {/* CONTENU DÉROULANT */}
      {isExpanded && (
        <div className="mt-4 bg-[#0A0A0A] border border-white/5 rounded-[2.5rem] p-6 space-y-6 animate-fade-in shadow-2xl">
          <div className="flex justify-between items-center">
            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
              <AlertCircle size={14} /> Historique
            </h4>
            <button
              onClick={() => setShowAddForm(!showAddForm)}
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-[10px] font-bold uppercase transition-all active:scale-95 border ${
                showAddForm
                  ? 'bg-transparent text-gray-400 border-white/10 hover:text-white'
                  : 'bg-white text-black border-white hover:bg-gray-200 shadow-lg shadow-white/10'
              }`}
            >
              {showAddForm ? <X size={14} /> : <Plus size={14} />}
              {showAddForm ? 'Fermer' : 'Ajouter'}
            </button>
          </div>

          {/* FORMULAIRE D'AJOUT */}
          {showAddForm && (
            <form
              onSubmit={handleAddExpense}
              className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-5 bg-black border border-white/10 rounded-[2rem] animate-slide-in-top"
            >
              <input
                type="text"
                placeholder="Libellé (ex: Scotch, Carton...)"
                className={UI.input}
                autoFocus
                value={newExpense.title}
                onChange={(e) =>
                  setNewExpense({ ...newExpense, title: e.target.value })
                }
              />
              <div className="relative">
                <input
                  type="number"
                  inputMode="decimal" // Clavier numérique mobile
                  min="0"
                  step="0.01"
                  placeholder="Montant"
                  className={`${UI.input} pr-8`}
                  value={newExpense.amount}
                  onChange={(e) =>
                    setNewExpense({ ...newExpense, amount: e.target.value })
                  }
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 font-bold">
                  €
                </span>
              </div>

              <button
                type="submit"
                disabled={isFormInvalid}
                className={`rounded-2xl font-black text-[10px] uppercase tracking-widest py-4 transition-all active:scale-95 ${
                  isFormInvalid
                    ? 'bg-gray-900 text-gray-600 border border-white/5 cursor-not-allowed'
                    : 'bg-red-500 text-white shadow-[0_10px_20px_rgba(239,68,68,0.2)] hover:bg-red-600 border border-red-500'
                }`}
              >
                Confirmer
              </button>
            </form>
          )}

          {/* LISTE DES FRAIS */}
          <div className="space-y-2">
            {loading ? (
              <div className="flex justify-center py-8">
                <Loader2 size={24} className="animate-spin text-indigo-500" />
              </div>
            ) : expenses.length === 0 ? (
              <div className="text-center py-8 border border-dashed border-white/10 rounded-2xl">
                <p className="text-xs text-gray-600 font-bold uppercase tracking-widest">
                  Aucune dépense ce mois-ci
                </p>
              </div>
            ) : (
              expenses.map((exp) => (
                <div
                  key={exp.id}
                  className={`${UI.cardInteractive} flex justify-between items-center p-4 !rounded-2xl group`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-1 h-8 bg-red-500 rounded-full opacity-60"></div>
                    <div>
                      <p className="text-sm font-bold text-white">{exp.name}</p>
                      <p className="text-[10px] text-gray-500 font-medium">
                        {new Date(exp.date).toLocaleDateString('fr-FR')}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-sm font-bold text-red-500">
                      -{formatEuro(exp.amount)}
                    </span>
                    <button
                      type="button"
                      onClick={() => deleteExpense(exp.id)}
                      className="w-8 h-8 flex items-center justify-center rounded-full bg-white/5 text-gray-500 hover:bg-red-500/10 hover:text-red-500 transition-all opacity-0 group-hover:opacity-100"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
