import React, { useEffect, useState } from 'react';
import { supabase } from '../../supabaseClient';
import { PERSONAL_CATEGORIES } from '../../utils/personalCategories';
import {
  ArrowLeft,
  Plus,
  TrendingUp,
  TrendingDown,
  Wallet,
  Calendar,
  X,
  Check,
  Type,
  Settings,
  ChevronDown,
  ChevronUp,
  FileText,
  History,
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { formatEuro } from '../../utils/format';
import { motion, AnimatePresence } from 'framer-motion';

// --- IMPORTS OPTIMISÉS ---
import { UI, COLORS, SHAPES, TEXT } from '../../designSystem';
import Input from '../../components/ui/Input'; // 👈 Le Smart Input
import Switch from '../../components/ui/Switch';
import Modal from '../../components/ui/Modal';
import ConfirmModal from '../../components/ui/ConfirmModal';
import BudgetForm from '../../components/forms/BudgetForm';
import TransactionForm from '../../components/forms/TransactionForm';
import { getMonthBoundaries, formatDisplayDate } from '../../utils/date';
import ShowMore from '../../components/ui/ShowMore';
import BigNumber from '../../components/ui/BigNumber';
import SearchBar from '../../components/ui/SearchBar';
import {
  universalSearch,
  formatTransactionForSearch,
} from '../../utils/searchFilters';

// COMPOSANT LOCAL: SELECTEUR DE CATÉGORIE
const CategorySelector = ({ selected, onSelect }) => (
  <div>
    <label className={`${TEXT.label} mb-3 block px-1`}>Catégorie</label>
    <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto custom-scrollbar pr-1">
      {Object.keys(PERSONAL_CATEGORIES).map((cat) => {
        const conf = PERSONAL_CATEGORIES[cat];
        const isSelected = selected === cat;
        return (
          <button
            key={cat}
            onClick={() => onSelect(cat)}
            type="button"
            className={`flex items-center gap-3 p-3 rounded-2xl border text-left transition-all group relative overflow-hidden ${
              isSelected
                ? 'bg-indigo-500/20 border-indigo-500/50 shadow-[0_0_15px_rgba(99,102,241,0.3)]'
                : 'bg-white/5 border-white/5 hover:bg-white/10 opacity-70 hover:opacity-100'
            }`}
          >
            <div
              className={`w-8 h-8 rounded-lg flex items-center justify-center transition-transform group-hover:scale-110 ${conf.bg} ${conf.color}`}
            >
              <conf.icon size={14} />
            </div>
            <span
              className={`text-xs font-bold ${
                isSelected ? 'text-white' : 'text-gray-400'
              }`}
            >
              {conf.label}
            </span>
          </button>
        );
      })}
    </div>
  </div>
);

export default function DashboardFinance() {
  // DONNÉES
  const [loading, setLoading] = useState(true);
  const [allTransactions, setAllTransactions] = useState([]); // ✅ Le réservoir (2 ans glissants)
  const [displayedTransactions, setDisplayedTransactions] = useState([]); // ✅ L'affichage (Mois ou Recherche)
  const [stats, setStats] = useState({ balance: 0, income: 0, expense: 0 });
  const [netExpenses, setNetExpenses] = useState([]);
  const [budgets, setBudgets] = useState({});
  const [currentMonth, setCurrentMonth] = useState(new Date());

  // RECHERCHE
  const [searchQuery, setSearchQuery] = useState(''); // ✅ C'est pertinent ici, on le garde

  //IDK STATES
  const navigate = useNavigate();

  // UI STATES
  const [showAddForm, setShowAddForm] = useState(false);
  const [showBudgetModal, setShowBudgetModal] = useState(false);
  const [visibleTxCount, setVisibleTxCount] = useState(10);
  const [expandBudgets, setExpandBudgets] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState(null);
  const [transactionToDelete, setTransactionToDelete] = useState(null);
  const [showTransactionModal, setShowTransactionModal] = useState(false);

  // FORMULAIRE STATE
  const [isExpense, setIsExpense] = useState(true);
  const [amount, setAmount] = useState('');
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Food & Others');

  // ✅ CORRECTION DATE : Initialisation en heure locale (YYYY-MM-DD)
  const [date, setDate] = useState(new Date().toLocaleDateString('en-CA'));

  const [description, setDescription] = useState('');
  const [saveLoading, setSaveLoading] = useState(false);

  const monthKey = `${currentMonth.getFullYear()}-${String(
    currentMonth.getMonth() + 1
  ).padStart(2, '0')}`;

  const switchOptions = [
    { value: true, label: 'Dépense', icon: TrendingDown },
    { value: false, label: 'Revenu', icon: TrendingUp },
  ];
  const switchColors = {
    left: {
      bg: 'rgba(239, 68, 68, 0.2)',
      border: 'rgba(239, 68, 68, 0.5)',
      text: 'text-red-500',
    },
    right: {
      bg: 'rgba(16, 185, 129, 0.2)',
      border: 'rgba(16, 185, 129, 0.5)',
      text: 'text-emerald-400',
    },
  };

  useEffect(() => {
    fetchData();
    setVisibleTxCount(10);
  }, [currentMonth]);

  const fetchData = async () => {
    setLoading(true);

    // 1. Préparation des dates
    const { startStr, endStr } = getMonthBoundaries(currentMonth);

    const twoYearsAgo = new Date();
    twoYearsAgo.setFullYear(twoYearsAgo.getFullYear() - 2);
    const searchLimitDate = twoYearsAgo.toISOString().split('T')[0];

    const year = currentMonth.getFullYear();
    const monthStr = String(currentMonth.getMonth() + 1).padStart(2, '0');
    const currentMonthKey = `${year}-${monthStr}`;

    try {
      // 2. Requêtes Supabase
      const [balanceRes, transactionsRes, budgetRes] = await Promise.all([
        supabase.from('personal_transactions').select('amount'),
        supabase
          .from('personal_transactions')
          .select('*')
          .gte('date', searchLimitDate) // On récupère 2 ans pour la recherche
          .order('date', { ascending: false }),
        supabase
          .from('monthly_budgets')
          .select('*')
          .lte('month_key', currentMonthKey)
          .order('month_key', { ascending: false }),
      ]);

      // 3. Traitement du Solde Total (Toutes dates confondues)
      const totalBalance =
        balanceRes.data?.reduce((acc, t) => acc + (t.amount || 0), 0) || 0;

      // 4. Stockage du réservoir (Les 2 ans glissants)
      const rawTransactions = transactionsRes.data || [];
      setAllTransactions(rawTransactions); // 👈 C'est ici qu'on remplit le réservoir

      // 5. Calcul des stats DU MOIS SEULEMENT (pour les cartes du Dashboard)
      // On filtre en local parmi les 2 ans pour éviter un appel API supplémentaire
      const monthData = rawTransactions.filter(
        (t) => t.date >= startStr && t.date <= endStr
      );

      const categoryTotals = monthData.reduce((acc, t) => {
        acc[t.category] = (acc[t.category] || 0) + t.amount;
        return acc;
      }, {});

      let netIncome = 0;
      let netExpenseTotal = 0;
      const expensesList = [];

      Object.entries(categoryTotals).forEach(([cat, amount]) => {
        if (amount > 0) netIncome += amount;
        else if (amount < 0) {
          const absAmount = Math.abs(amount);
          netExpenseTotal += absAmount;
          expensesList.push([cat, absAmount]);
        }
      });

      // 6. Traitement des Budgets
      const effectiveBudgets = {};
      if (budgetRes.data) {
        budgetRes.data.forEach((b) => {
          if (effectiveBudgets[b.category] === undefined) {
            effectiveBudgets[b.category] = b.amount;
          }
        });
      }

      // Fusion Budgets / Dépenses
      const existingCategories = new Set(expensesList.map((item) => item[0]));
      Object.keys(effectiveBudgets).forEach((cat) => {
        if (effectiveBudgets[cat] > 0 && !existingCategories.has(cat)) {
          expensesList.push([cat, 0]);
        }
      });

      // Tri Final
      expensesList.sort(
        (a, b) =>
          b[1] - a[1] ||
          (effectiveBudgets[b[0]] || 0) - (effectiveBudgets[a[0]] || 0)
      );

      // 7. Mise à jour des états
      setStats({
        balance: totalBalance,
        income: netIncome,
        expense: netExpenseTotal,
      });
      setBudgets(effectiveBudgets);
      setNetExpenses(expensesList);
    } catch (err) {
      console.error('Erreur fetchData:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveTransaction = async () => {
    if (!amount) return alert('Montant requis');
    setSaveLoading(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      const finalAmount = isExpense
        ? -Math.abs(parseFloat(amount))
        : Math.abs(parseFloat(amount));
      const finalTitle =
        title.trim() || PERSONAL_CATEGORIES[category]?.label || category;

      // ✅ CORRECTION : On envoie 'title' (pas label) et 'type'
      const { error } = await supabase.from('personal_transactions').insert({
        user_id: user.id,
        amount: finalAmount,
        title: finalTitle,
        category,
        date,
        description,
        type: isExpense ? 'EXPENSE' : 'INCOME', // Colonne Type ajoutée
      });

      if (error) throw error;
      setAmount('');
      setTitle('');
      setDescription('');
      setIsExpense(true);
      setShowAddForm(false);
      fetchData();
    } catch (err) {
      alert(err.message);
    } finally {
      setSaveLoading(false);
    }
  };

  const confirmDelete = async () => {
    if (!transactionToDelete) return;
    await supabase
      .from('personal_transactions')
      .delete()
      .eq('id', transactionToDelete);
    setTransactionToDelete(null);
    setEditingTransaction(null);
    fetchData();
  };

  const visibleExpenses = expandBudgets ? netExpenses : netExpenses.slice(0, 3);
  const safeIncome = stats?.income || 0;
  const safeExpense = stats?.expense || 0;
  const monthlyBalance = safeIncome - safeExpense;

  useEffect(() => {
    // 1. Si on a une recherche, on calcule le filtre sur les 2 ans
    if (searchQuery.trim() !== '') {
      const filtered = universalSearch(
        allTransactions,
        searchQuery,
        formatTransactionForSearch
      );
      setDisplayedTransactions(filtered);
    }
    // 2. Sinon, on se contente du filtre par mois (beaucoup plus rapide)
    else {
      const { startStr, endStr } = getMonthBoundaries(currentMonth);
      const filteredByMonth = allTransactions.filter(
        (t) => t.date >= startStr && t.date <= endStr
      );
      setDisplayedTransactions(filteredByMonth);
    }
  }, [searchQuery, allTransactions, currentMonth]);

  return (
    <div className="w-full space-y-8">
      {/* 1. SOLDE CARD */}
      <BigNumber
        label="Solde Actuel"
        value={stats.balance || 0}
        subLabel="Mois en cours"
        subValue={monthlyBalance}
        color="indigo"
      />

      {/* 2. FORMULAIRE D'AJOUT IN-PAGE */}
      <div className="overflow-hidden relative z-10">
        <AnimatePresence mode="wait" initial={false}>
          {!showAddForm ? (
            <motion.button
              key="add-btn"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.15 } }}
              onClick={() => setShowAddForm(true)}
              // ✅ UTILISATION DU UI.btnPrimary (Maintenant Indigo)
              className={`${UI.btnPrimary} w-full py-4 text-lg rounded-[2.5rem]`}
            >
              <Plus size={24} /> Nouvelle Transaction
            </motion.button>
          ) : (
            <motion.div
              key="add-form"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.35, ease: [0.25, 0.1, 0.25, 1] }}
            >
              <div className={UI.card + ' p-6 border-white/20'}>
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: 0.1 }}
                >
                  <div className="flex justify-between items-center mb-6">
                    <h3 className={TEXT.h3}>Ajouter</h3>
                    <button
                      onClick={() => setShowAddForm(false)}
                      className="p-2 bg-white/5 rounded-full text-gray-400 hover:text-white transition"
                    >
                      <X size={18} />
                    </button>
                  </div>
                  <div className="space-y-6">
                    <div className="flex flex-col items-center justify-center">
                      {/* On utilise flex-row pour aligner Input + Euro */}
                      <div className="relative w-full flex justify-center items-center gap-2">
                        {/* ✅ SMART INPUT DYNAMIQUE */}
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="0" // On met 0 au lieu de 0.00 pour simplifier la largeur au début
                          autoFocus
                          value={amount}
                          onChange={(e) => setAmount(e.target.value)}
                          // ASTUCE UX : On calcule la largeur en fonction du nombre de caractères (+1 pour le confort)
                          // L'unité 'ch' correspond à la largeur du caractère '0'
                          style={{
                            width: `${Math.max(1, (amount || '').length)}ch`,
                          }}
                          className={`
                            text-right text-5xl font-bold border-none p-0 bg-transparent w-auto min-w-[1ch]
                            placeholder-gray-600 focus:ring-0
                            ${isExpense ? 'text-white' : 'text-emerald-400'}
                          `}
                        />

                        {/* Le signe Euro qui reste collé */}
                        <span
                          className={`text-5xl font-bold ${
                            isExpense ? 'text-gray-500' : 'text-emerald-600/50'
                          }`}
                        >
                          €
                        </span>
                      </div>

                      {/* Switch Dépense/Revenu en dessous */}
                      <div className="mt-6 w-full flex justify-center">
                        <Switch
                          options={switchOptions}
                          value={isExpense}
                          onChange={setIsExpense}
                          colors={switchColors}
                        />
                      </div>
                    </div>
                    <div className="space-y-3">
                      <div className="bg-white/5 border border-white/5 rounded-3xl p-3 flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-black/40 flex items-center justify-center text-gray-400">
                          <Type size={18} />
                        </div>
                        {/* ✅ SMART INPUT */}
                        <div className="flex-1">
                          <label className={TEXT.label}>Titre</label>
                          <Input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className="font-bold text-white border-none p-0"
                            placeholder="Optionnel..."
                          />
                        </div>
                      </div>
                      <div className="bg-white/5 border border-white/5 rounded-3xl p-3 flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-black/40 flex items-center justify-center text-gray-400">
                          <Calendar size={18} />
                        </div>
                        {/* ✅ SMART INPUT : Type date */}
                        <div className="flex-1">
                          <label className={TEXT.label}>Date</label>
                          <Input
                            type="date"
                            value={date}
                            onChange={(e) => setDate(e.target.value)}
                            className="font-bold text-white border-none p-0"
                          />
                        </div>
                      </div>
                      <CategorySelector
                        selected={category}
                        onSelect={setCategory}
                      />
                      <div className="bg-white/5 border border-white/5 rounded-3xl p-4">
                        <div className="flex items-center gap-2 mb-2 text-gray-400">
                          <FileText size={14} />
                          <span className={TEXT.label}>Note</span>
                        </div>
                        <textarea
                          value={description}
                          onChange={(e) => setDescription(e.target.value)}
                          className="w-full bg-transparent text-sm text-gray-300 outline-none resize-none placeholder-gray-600"
                          rows={2}
                          placeholder="..."
                        />
                      </div>
                    </div>
                    {/* ✅ BOUTON INDIGO PAR DÉFAUT */}
                    <button
                      onClick={handleSaveTransaction}
                      disabled={!amount || saveLoading}
                      className={`${UI.btnPrimary} w-full py-4 rounded-3xl`}
                    >
                      {saveLoading ? (
                        '...'
                      ) : (
                        <>
                          <Check size={20} /> Valider
                        </>
                      )}
                    </button>
                  </div>
                </motion.div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* 3. NAVIGATEUR MOIS (LOGIQUE CORRIGÉE "BUG DU 31") */}
      <div
        className={`flex justify-between items-center ${UI.card} p-1 ${SHAPES.btn}`}
      >
        <button
          onClick={() => {
            // On prend le mois actuel, on va au 1er du mois précédent
            const newDate = new Date(
              currentMonth.getFullYear(),
              currentMonth.getMonth() - 1,
              1
            );
            setCurrentMonth(newDate);
          }}
          className="p-3 text-gray-500 hover:text-white hover:bg-white/5 rounded-xl transition"
        >
          <ArrowLeft size={16} />
        </button>

        <span className="text-sm font-bold text-white flex items-center gap-2 uppercase tracking-wide">
          <Calendar size={14} className="text-indigo-500" />
          {currentMonth.toLocaleString('fr-FR', {
            month: 'long',
            year: 'numeric',
          })}
        </span>

        <button
          onClick={() => {
            // On prend le mois actuel, on va au 1er du mois suivant
            const newDate = new Date(
              currentMonth.getFullYear(),
              currentMonth.getMonth() + 1,
              1
            );
            setCurrentMonth(newDate);
          }}
          className="p-3 text-gray-500 hover:text-white hover:bg-white/5 rounded-xl transition"
        >
          <ArrowLeft size={16} className="rotate-180" />
        </button>
      </div>

      {/* 4. STATS & BUDGETS */}
      <div className="grid grid-cols-2 gap-6">
        <div className={`${UI.cardCompact} p-4`}>
          <p className={`${TEXT.label} flex items-center gap-1`}>
            <TrendingUp size={12} className="text-emerald-500" /> Revenus
          </p>
          <p className={`text-xl font-bold text-emerald-400 ${TEXT.value}`}>
            +{formatEuro(stats.income)}
          </p>
        </div>
        <div className={`${UI.cardCompact} p-4`}>
          <p className={`${TEXT.label} flex items-center gap-1`}>
            <TrendingDown size={12} className="text-red-500" /> Dépenses
          </p>
          <p className={`text-xl font-bold text-red-500 ${TEXT.value}`}>
            -{formatEuro(stats.expense)}
          </p>
        </div>
      </div>

      {/* 5. CARTE DÉPENSES & BUDGETS (Triée par importance) */}
      <div className="space-y-3">
        <div className="flex justify-between items-center px-1">
          {/* Titre mis à jour pour refléter la réalité */}
          <h3 className={TEXT.label}>Dépenses & Budgets</h3>

          <div className="flex gap-3">
            <button
              onClick={() => setExpandBudgets(!expandBudgets)}
              className="text-xs text-gray-500 flex items-center gap-1 hover:text-white transition"
            >
              {expandBudgets ? (
                <ChevronUp size={14} />
              ) : (
                <ChevronDown size={14} />
              )}
              {expandBudgets ? 'Réduire' : 'Top 3'}
            </button>

            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowBudgetModal(true);
              }}
              className="text-xs text-indigo-400 flex items-center gap-1 hover:text-indigo-300 transition font-bold"
            >
              <Settings size={12} /> Régler
            </button>
          </div>
        </div>

        <div
          onClick={() => setExpandBudgets(!expandBudgets)}
          className={`bg-[#050505] border border-white/10 rounded-[1.8rem] relative overflow-hidden p-4 space-y-4 cursor-pointer hover:border-white/30 group transition-colors`}
        >
          {visibleExpenses.length === 0 ? (
            <div className="text-center py-6">
              <p className="text-gray-500 text-sm mb-2">
                Rien à afficher ce mois-ci.
              </p>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowBudgetModal(true);
                }}
                className="text-indigo-400 text-xs font-bold hover:underline"
              >
                Définir un budget
              </button>
            </div>
          ) : (
            <>
              {visibleExpenses.map(([cat, amount]) => {
                const conf =
                  PERSONAL_CATEGORIES[cat] ||
                  PERSONAL_CATEGORIES['Food & Others'];
                const budget = budgets[cat] ? parseFloat(budgets[cat]) : 0;
                const hasBudget = budget > 0;

                // Calcul du pourcentage (uniquement si budget existe)
                let percent = 0;
                let barColor = 'bg-gray-700';

                if (hasBudget) {
                  percent = Math.min(100, (amount / budget) * 100);
                  if (percent < 75) barColor = 'bg-emerald-500';
                  else if (percent < 100) barColor = 'bg-amber-500';
                  else barColor = 'bg-red-500';
                }

                return (
                  <div key={cat} className="relative">
                    <div className="flex justify-between items-center mb-1.5 text-sm">
                      {/* Icône + Nom */}
                      <div className="flex items-center gap-3">
                        <div
                          className={`p-2 rounded-lg ${conf.bg} ${conf.color}`}
                        >
                          <conf.icon size={14} />
                        </div>
                        <span className="font-bold text-gray-300 text-xs group-hover:text-white transition-colors">
                          {conf.label}
                        </span>
                      </div>

                      {/* Montants */}
                      <div className="text-right">
                        <span
                          className={`font-bold text-white text-sm ${TEXT.value}`}
                        >
                          {formatEuro(amount)}
                        </span>
                        {/* Affiche le "/ 500€" SEULEMENT s'il y a un budget */}
                        {hasBudget && (
                          <span className="text-[10px] text-gray-500 ml-1">
                            / {formatEuro(budget)}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Barre de progression : Visible SEULEMENT s'il y a un budget */}
                    {hasBudget ? (
                      <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden mt-1">
                        <motion.div
                          className={`h-full rounded-full ${barColor}`}
                          initial={{ width: 0 }}
                          animate={{ width: `${percent}%` }}
                          transition={{ duration: 1, ease: 'easeOut' }}
                        />
                      </div>
                    ) : // Optionnel : Si pas de budget, on peut mettre une toute petite ligne grise
                    // ou rien du tout. Ici je mets rien pour alléger.
                    null}
                  </div>
                );
              })}

              {!expandBudgets &&
                visibleExpenses.length < netExpenses.length && (
                  <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-[#050505] to-transparent flex justify-center items-end pb-1 pointer-events-none">
                    <ChevronDown size={12} className="text-gray-600" />
                  </div>
                )}
            </>
          )}
        </div>
      </div>

      {/* --- 6. BARRE D'OUTILS (RECHERCHE + HISTORIQUE) --- */}
      <div className="space-y-3"> {/* Parent principal avec très peu d'espace entre enfants */}
        
        {/* 1. Titre */}
        <div className="flex justify-between items-center px-1">
          <h3 className={TEXT.label}>
            {searchQuery
              ? `Résultats (${displayedTransactions.length})`
              : 'Transactions'}
          </h3>
        </div>

        {/* 2. Barre de recherche + Historique */}
        <div className="flex gap-2 items-center">
          <div className="flex-1">
            <SearchBar
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder="Chercher une transaction..."
            />
          </div>

          <button
            onClick={() => {
              console.log("Navigation vers l'historique...");
              navigate('/finance/history');
            }}
            className="h-[52px] w-[52px] flex items-center justify-center bg-white/5 border border-white/10 rounded-[1.2rem] text-gray-400 hover:text-white hover:bg-white/10 transition-all active:scale-95 shadow-lg shrink-0"
            title="Historique complet"
          >
            <History size={22} />
          </button>
        </div>

        {/* 3. Liste des Transactions */}
        <div className="space-y-2 pt-1"> {/* Un seul conteneur space-y-2 ici */}
          {displayedTransactions.length === 0 ? (
            <div className={`${UI.card} p-8 text-center text-gray-500 italic`}>
              {searchQuery
                ? 'Aucun résultat pour cette recherche.'
                : 'Aucune transaction ce mois-ci.'}
            </div>
          ) : (
            <>
              {displayedTransactions.slice(0, visibleTxCount).map((t) => {
                const conf =
                  PERSONAL_CATEGORIES[t.category] ||
                  PERSONAL_CATEGORIES['Food & Others'];

                return (
                  <div
                    key={t.id}
                    onClick={() => setEditingTransaction(t)}
                    className={`${UI.cardInteractive} ${SHAPES.item} flex justify-between items-center p-3`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`p-2.5 rounded-xl ${conf.bg} ${conf.color} border ${conf.border}`}>
                        <conf.icon size={18} />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-white line-clamp-1">
                          {t.title || t.category}
                        </p>
                        <p className="text-[10px] text-gray-500">
                          {formatDisplayDate(t.date)}
                        </p>
                      </div>
                    </div>

                    <span className={`font-bold ${TEXT.value} ${t.amount > 0 ? 'text-emerald-400' : 'text-white'}`}>
                      {t.amount > 0 ? '+' : ''}
                      {formatEuro(t.amount)}
                    </span>
                  </div>
                );
              })}

              {/* Bouton Voir Plus */}
              {visibleTxCount < displayedTransactions.length && (
                <div className="pt-1">
                  <ShowMore
                    isVisible={true}
                    onClick={() => setVisibleTxCount((prev) => prev + 10)}
                  />
                </div>
              )}
            </>
          )}
        </div>
      </div>


      {/* --- MODALES --- */}
      <Modal
        isOpen={showBudgetModal}
        onClose={() => setShowBudgetModal(false)}
        title="Budgets du mois"
        type="center"
        icon={Settings}
      >
        <BudgetForm
          monthKey={monthKey}
          currentBudgets={budgets}
          onSuccess={fetchData}
          onClose={() => setShowBudgetModal(false)}
        />
      </Modal>

      {/* MODALE DE MODIFICATION (ET AJOUT VIA "+" PETIT BOUTON) */}
      <Modal
        // S'ouvre si on édite (editingTransaction existe) OU si on clique sur ajouter (showTransactionModal est true)
        isOpen={!!editingTransaction || showTransactionModal}
        onClose={() => {
          setEditingTransaction(null);
          setShowTransactionModal(false);
        }}
        // Change le titre selon le contexte
        title={
          editingTransaction
            ? 'Modifier la transaction'
            : 'Nouvelle transaction'
        }
        type="bottom"
      >
        <TransactionForm
          // Passe la transaction si on modifie (sinon null)
          transaction={editingTransaction}
          // ✅ IMPORTANT : Quand c'est fini, on recharge les données
          onSuccess={fetchData}
          // Fermeture propre
          onClose={() => {
            setEditingTransaction(null);
            setShowTransactionModal(false);
          }}
        />
      </Modal>

      <ConfirmModal
        isOpen={!!transactionToDelete}
        onClose={() => setTransactionToDelete(null)}
        onConfirm={confirmDelete}
        title="Supprimer ?"
        message="Cette action est irréversible."
        isDanger={true}
      />
    </div>
  );
}
