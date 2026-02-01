import React, { useEffect, useState } from 'react';
import { supabase } from '../../supabaseClient';
import { PERSONAL_CATEGORIES } from '../../utils/personalCategories';
import {
  TrendingUp,
  PieChart,
  PiggyBank,
  AlertTriangle,
  Calendar,
  Edit2,
} from 'lucide-react';
import { formatEuro } from '../../utils/format';
import { UI, SHAPES, TEXT } from '../../designSystem';

// --- IMPORTS CORRIGÉS ---
import Switch from '../../components/ui/Switch';
import Modal from '../../components/ui/Modal';
import TransactionForm from '../../components/forms/TransactionForm';
import ShowMore from '../../components/ui/ShowMore';

export default function FinanceHistory() {
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('MONTHS');
  const [monthlyStats, setMonthlyStats] = useState([]);
  const [yearlyStats, setYearlyStats] = useState([]);

  // États UI
  const [selectedMonth, setSelectedMonth] = useState(null);
  const [selectedYear, setSelectedYear] = useState(null);
  const [editingTransaction, setEditingTransaction] = useState(null);
  const [transactionToDelete, setTransactionToDelete] = useState(null);

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const { data } = await supabase
        .from('personal_transactions')
        .select('*')
        .order('date', { ascending: false });

      if (data) {
        // On récupère les nouveaux calculs
        const { mStats, yStats } = processData(data);

        // Si une modale de mois est ouverte, on la synchronise
        if (selectedMonth) {
          const updatedMonth = mStats.find((m) => m.key === selectedMonth.key);
          if (updatedMonth) setSelectedMonth(updatedMonth);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const processData = (data) => {
    const mBuckets = {};
    const yBuckets = {};
    data.forEach((t) => {
      if (!t.date || t.amount === undefined) return;
      const monthKey = t.date.substring(0, 7);
      const yearKey = t.date.substring(0, 4);
      if (!mBuckets[monthKey]) mBuckets[monthKey] = [];
      mBuckets[monthKey].push(t);
      if (!yBuckets[yearKey]) yBuckets[yearKey] = [];
      yBuckets[yearKey].push(t);
    });

    const calculateNetStats = (transactions, key) => {
      const catTotals = {};
      let totalBalance = 0;
      let netIncome = 0;
      let netExpense = 0;
      transactions.forEach((t) => {
        if (!catTotals[t.category]) catTotals[t.category] = 0;
        catTotals[t.category] += t.amount;
        totalBalance += t.amount;
      });
      const netCategories = {};
      Object.entries(catTotals).forEach(([cat, amount]) => {
        if (amount > 0) netIncome += amount;
        else if (amount < 0) {
          const abs = Math.abs(amount);
          netExpense += abs;
          netCategories[cat] = abs;
        }
      });
      return {
        key,
        balance: totalBalance,
        income: netIncome,
        expense: netExpense,
        categories: netCategories,
        transactions,
      };
    };

    const mStats = Object.keys(mBuckets)
      .map((key) => calculateNetStats(mBuckets[key], key))
      .sort((a, b) => b.key.localeCompare(a.key));

    const yStats = Object.keys(yBuckets)
      .map((key) => calculateNetStats(yBuckets[key], key))
      .sort((a, b) => b.key.localeCompare(a.key));

    // 4. Mise à jour des états globaux
    setMonthlyStats(mStats);
    setYearlyStats(yStats);

    // 5. Rendu des données pour permettre la synchronisation des modales
    return { mStats, yStats };
  };

  const confirmDelete = async () => {
    if (!transactionToDelete) return;
    try {
      await supabase
        .from('personal_transactions')
        .delete()
        .eq('id', transactionToDelete);
      setTransactionToDelete(null);
      setEditingTransaction(null);
      if (selectedMonth) setSelectedMonth(null);
      fetchHistory();
    } catch (err) {
      alert('Erreur suppression');
    }
  };

  const [showAllMonths, setShowAllMonths] = useState(false);

  return (
    <div className="space-y-6 w-full pb-24">
      {/* SWITCH HEADER */}
      <div className="sticky top-0 z-30 flex justify-center py-4 pointer-events-none">
        {/* On augmente la largeur max ici (w-64 ou w-72) */}
        <div className="pointer-events-auto shadow-2xl rounded-full w-72">
          <Switch
            value={viewMode}
            onChange={setViewMode}
            options={[
              { value: 'MONTHS', label: 'Mensuel' },
              { value: 'YEARS', label: 'Annuel' },
            ]}
            // 👇 SI tu veux modifier les couleurs, fais-le ici simplement.
            // Sinon, retire la prop 'colors' pour utiliser le défaut du composant.
            colors={{
              activeText: 'text-white',
              bg: 'bg-white/10 backdrop-blur-md', // Fond de la track
              indicator: 'bg-indigo-600', // La pilule qui bouge
            }}
          />
        </div>
      </div>

      {/* VUE MENSUELLE */}
      {viewMode === 'MONTHS' && (
        <div className="relative">
          {' '}
          {/* Conteneur parent relatif indispensable */}
          <div className="space-y-4 animate-fade-in pb-24">
            {/* On affiche tout si showAllMonths est vrai, 
         sinon on coupe aux 6 premiers 
      */}
            {(showAllMonths ? monthlyStats : monthlyStats.slice(0, 6)).map(
              (stat) => {
                const date = new Date(stat.key + '-01');
                const savingsRate =
                  stat.income > 0
                    ? Math.round(
                        ((stat.income - stat.expense) / stat.income) * 100
                      )
                    : 0;
                const isPositive = stat.balance >= 0;

                return (
                  <div
                    key={stat.key}
                    onClick={() => setSelectedMonth(stat)}
                    className={`${UI.cardInteractive} p-5 ${SHAPES.card} group`}
                  >
                    <div className="flex justify-between items-start mb-4">
                      <h3
                        className={`${TEXT.h3} capitalize flex items-center gap-2`}
                      >
                        <Calendar size={16} className="text-gray-500" />
                        {date.toLocaleString('fr-FR', {
                          month: 'long',
                          year: 'numeric',
                        })}
                      </h3>
                      {/* Badge standardisé avec variables de couleur */}
                      <div
                        className={`px-3 py-1 rounded-full text-xs font-bold border ${
                          isPositive
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                            : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                        }`}
                      >
                        {isPositive ? '+' : ''}
                        {formatEuro(stat.balance)}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div>
                        <p className={TEXT.label}>Entrées</p>
                        <p
                          className={`text-emerald-400 font-bold text-sm ${TEXT.value}`}
                        >
                          +{formatEuro(stat.income)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className={TEXT.label}>Sorties</p>
                        <p
                          className={`text-rose-400 font-bold text-sm ${TEXT.value}`}
                        >
                          -{formatEuro(stat.expense)}
                        </p>
                      </div>
                    </div>

                    <div className="bg-white/5 p-2 px-3 rounded-xl flex items-center justify-between border border-white/5">
                      <div className="flex items-center gap-2">
                        <PiggyBank size={14} className="text-amber-500" />
                        <span className="text-xs text-gray-400">Épargne</span>
                      </div>
                      <span
                        className={`text-sm font-bold ${
                          savingsRate > 0 ? 'text-amber-400' : 'text-gray-500'
                        }`}
                      >
                        {savingsRate}%
                      </span>
                    </div>
                  </div>
                );
              }
            )}
          </div>
          {/* LE BOUTON SHOW MORE */}
          <div className="absolute bottom-0 left-0 right-0 translate-y-[-60px] pointer-events-none">
            <ShowMore
              isVisible={!showAllMonths && monthlyStats.length > 6}
              onClick={() => setShowAllMonths(true)}
            />
          </div>
        </div>
      )}

      {/* VUE ANNUELLE */}
      {viewMode === 'YEARS' && (
        <div className="space-y-4">
          {yearlyStats.map((stat) => {
            const isPositive = stat.balance >= 0;
            return (
              <div
                key={stat.key}
                onClick={() => setSelectedYear(stat)}
                className={`${UI.cardInteractive} p-6 ${SHAPES.card} relative overflow-hidden`}
              >
                <div className="absolute top-0 right-0 p-6 opacity-5 pointer-events-none">
                  <TrendingUp size={100} className="text-white" />
                </div>
                <h3 className={`${TEXT.h1} mb-6`}>{stat.key}</h3>
                <div className="space-y-3 relative z-10">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Revenus</span>
                    <span
                      className={`text-emerald-400 font-bold ${TEXT.value}`}
                    >
                      +{formatEuro(stat.income)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Dépenses</span>
                    <span className={`text-rose-400 font-bold ${TEXT.value}`}>
                      -{formatEuro(stat.expense)}
                    </span>
                  </div>
                  <div className="w-full h-px bg-white/10 my-2"></div>
                  <div className="flex justify-between items-center">
                    <span className="text-white font-bold">Résultat</span>
                    <span
                      className={`text-xl font-bold ${
                        isPositive ? 'text-indigo-400' : 'text-rose-500'
                      } ${TEXT.value}`}
                    >
                      {isPositive ? '+' : ''}
                      {formatEuro(stat.balance)}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 🟢 MODALE 1 : DETAIL MOIS */}
      <Modal
        isOpen={!!selectedMonth}
        onClose={() => setSelectedMonth(null)}
        title={
          selectedMonth
            ? new Date(selectedMonth.key + '-01').toLocaleString('fr-FR', {
                month: 'long',
                year: 'numeric',
              })
            : ''
        }
        icon={Calendar}
        type="center"
      >
        <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-2">
          {selectedMonth?.transactions.map((t) => {
            const conf =
              PERSONAL_CATEGORIES[t.category] ||
              PERSONAL_CATEGORIES['Food & Others'];
            return (
              <div
                key={t.id}
                onClick={() => setEditingTransaction(t)}
                className={`${UI.card} flex justify-between items-center p-3 hover:bg-white/5 cursor-pointer active:scale-98 transition-transform border border-transparent hover:border-white/10`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`p-2 rounded-xl ${conf.bg} ${conf.color} border ${conf.border}`}
                  >
                    <conf.icon size={16} />
                  </div>
                  <div>
                    <p
                      className={`text-sm font-bold text-white line-clamp-1 ${TEXT.value}`}
                    >
                      {t.title || t.category}
                    </p>
                    <p className="text-[10px] text-gray-500">
                      {new Date(t.date).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <span
                  className={`font-bold text-sm ${
                    t.amount > 0 ? 'text-emerald-400' : 'text-white'
                  } ${TEXT.value}`}
                >
                  {t.amount > 0 ? '+' : ''}
                  {formatEuro(t.amount)}
                </span>
              </div>
            );
          })}
        </div>
      </Modal>

      {/* 🟢 MODALE 2 : DETAIL ANNEE */}
      <Modal
        isOpen={!!selectedYear}
        onClose={() => setSelectedYear(null)}
        title={`Bilan ${selectedYear?.key}`}
        icon={PieChart}
        type="center"
      >
        <div className="flex-1 overflow-y-auto custom-scrollbar p-5 space-y-4">
          <div className="text-center mb-2">
            <p className="text-gray-400 text-xs uppercase tracking-widest">
              Total Dépenses
            </p>
            <p className={`text-3xl font-bold text-white mt-1 ${TEXT.value}`}>
              {selectedYear && formatEuro(selectedYear.expense)}
            </p>
          </div>
          {selectedYear &&
            Object.entries(selectedYear.categories)
              .sort((a, b) => b[1] - a[1])
              .map(([cat, amount]) => {
                const conf =
                  PERSONAL_CATEGORIES[cat] ||
                  PERSONAL_CATEGORIES['Food & Others'];
                const percent = Math.round(
                  (amount / selectedYear.expense) * 100
                );
                return (
                  <div key={cat} className="group">
                    <div className="flex justify-between items-center mb-1 text-sm">
                      <div className="flex items-center gap-2">
                        <div
                          className={`p-1.5 rounded-lg ${conf.bg} ${conf.color}`}
                        >
                          <conf.icon size={12} />
                        </div>
                        <span className="font-medium text-gray-300">
                          {conf.label}
                        </span>
                      </div>
                      <div className="text-right flex items-center gap-2">
                        <span className={`font-bold text-white ${TEXT.value}`}>
                          {formatEuro(amount)}
                        </span>
                        <span className="text-[10px] text-gray-500 w-8 text-right">
                          {percent}%
                        </span>
                      </div>
                    </div>
                    <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full opacity-80 ${conf.color.replace(
                          'text-',
                          'bg-'
                        )}`}
                        style={{ width: `${percent}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })}
        </div>
      </Modal>

      {/* 🟢 MODALE 3 : ÉDITION */}
      <Modal
        isOpen={!!editingTransaction}
        onClose={() => setEditingTransaction(null)}
        title="Modifier la transaction"
        icon={Edit2}
        type="center"
      >
        {editingTransaction && (
          <TransactionForm
            key={editingTransaction.id}
            transaction={editingTransaction}
            onSuccess={() => {
              // 1. On rafraîchit la liste globale (pour le dashboard en dessous)
              fetchHistory();

              // 2. CHIRURGIE : On met à jour l'item dans la modale "Détails du mois" ouverte
              if (selectedMonth) {
                setSelectedMonth((prev) => ({
                  ...prev,
                  transactions: prev.transactions.map((t) =>
                    t.id === editingTransaction.id
                      ? { ...t, ...editingTransaction } // On pourrait aussi refetcher, mais c'est plus rapide ainsi
                      : t
                  ),
                }));
              }

              setEditingTransaction(null);
            }}
            onClose={() => setEditingTransaction(null)}
          />
        )}
      </Modal>

      {/* 🟢 MODALE 4 : ALERT SUPPRESSION */}
      <Modal
        isOpen={!!transactionToDelete}
        onClose={() => setTransactionToDelete(null)}
        type="alert"
      >
        <div className="p-6 text-center flex flex-col items-center">
          <div className="w-12 h-12 bg-red-500/10 rounded-full flex items-center justify-center mb-4 text-red-500 border border-red-500/20 shadow-[0_0_15px_rgba(239,68,68,0.2)]">
            <AlertTriangle size={24} />
          </div>
          <h3 className={`${TEXT.h3} mb-2`}>Supprimer ?</h3>
          <p className="text-gray-400 text-sm mb-6">
            Cette action est définitive.
          </p>
          <div className="flex gap-3 w-full">
            <button
              onClick={() => setTransactionToDelete(null)}
              className={`${UI.btnGhost} flex-1 justify-center`}
            >
              Annuler
            </button>
            <button
              onClick={confirmDelete}
              className={`${UI.btnPrimary} flex-1 justify-center bg-red-600 hover:bg-red-500 shadow-red-900/20`}
            >
              Confirmer
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
