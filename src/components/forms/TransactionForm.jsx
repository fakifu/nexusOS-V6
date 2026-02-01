import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';
import { PERSONAL_CATEGORIES } from '../../utils/personalCategories';
import {
  Save,
  Trash2,
  Calendar,
  Type,
  TrendingUp,
  TrendingDown,
  FileText,
  AlignLeft,
} from 'lucide-react';
import Input from '../ui/Input';
import Switch from '../ui/Switch';
import { UI } from '../../designSystem';

export default function TransactionForm({
  transaction = null,
  onClose, // <--- Prop standard
  setClose, // <--- Au cas où tu passes un setter d'état directement
  onSuccess,
}) {
  // Création d'une fonction de fermeture sécurisée
  const handleClose = () => {
    if (onClose) onClose();
    else if (setClose) setClose(null);
  };
  const [loading, setLoading] = useState(false);

  // États du formulaire
  const [amount, setAmount] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState(''); // ✅ AJOUT DE LA NOTE
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [category, setCategory] = useState('Food & Others');
  const [isExpense, setIsExpense] = useState(true);

  // Initialisation lors de l'édition
  useEffect(() => {
    if (transaction) {
      setAmount(Math.abs(transaction.amount).toString());
      setTitle(transaction.title || '');
      setDescription(transaction.description || ''); // ✅ Chargement de la note
      setDate(transaction.date);
      setCategory(transaction.category);

      const isExp = transaction.amount < 0 || transaction.type === 'EXPENSE';
      setIsExpense(isExp);
    }
  }, [transaction]);

  const handleSubmit = async () => {
    if (!amount || !date) return;
    setLoading(true);

    const finalAmount = isExpense
      ? -Math.abs(parseFloat(amount))
      : Math.abs(parseFloat(amount));

    const payload = {
      amount: finalAmount,
      title: title,
      description: description, // ✅ Envoi de la note
      date: date,
      category: category,
      type: isExpense ? 'EXPENSE' : 'INCOME',
    };

    try {
      if (transaction) {
        const { error } = await supabase
          .from('personal_transactions')
          .update(payload)
          .eq('id', transaction.id);
        if (error) throw error;
      } else {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        const { error } = await supabase
          .from('personal_transactions')
          .insert([{ ...payload, user_id: user.id }]);
        if (error) throw error;
      }
      onSuccess();
      handleClose(); // <--- Utilise la fonction sécurisée ici
    } catch (error) {
      console.error(error);
      alert(`Erreur : ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Supprimer cette transaction ?')) return;
    setLoading(true);
    try {
      const { error } = await supabase
        .from('personal_transactions')
        .delete()
        .eq('id', transaction.id);
      if (error) throw error;
      onSuccess();
      onClose();
    } catch (err) {
      console.error(err);
      alert('Erreur lors de la suppression');
    } finally {
      setLoading(false);
    }
  };

  const switchOptions = [
    { value: true, label: 'Dépense', icon: TrendingDown },
    { value: false, label: 'Revenu', icon: TrendingUp },
  ];

  const switchColors = {
    right: {
      bg: 'rgba(16, 185, 129, 0.2)',
      border: 'rgba(16, 185, 129, 0.5)',
      text: 'text-emerald-400',
    },
    left: {
      bg: 'rgba(239, 68, 68, 0.2)',
      border: 'rgba(239, 68, 68, 0.5)',
      text: 'text-red-400',
    },
  };

  return (
    <div className="flex flex-col h-full bg-[#0A0A0A] relative overflow-hidden">
      {/* ZONE SCROLLABLE */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-8 pb-32">
        {/* 1. INPUT MONTANT */}
        <div className="flex flex-col items-center justify-center py-2 space-y-6">
          <div className="relative flex justify-center items-center gap-1">
            <Input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0"
              autoFocus={!transaction}
              style={{ width: `${Math.max(1, amount.length)}ch` }}
              className={`text-right text-6xl font-bold border-none p-0 bg-transparent w-auto min-w-[1ch] focus:ring-0 placeholder-gray-800 transition-colors duration-300 ${
                !isExpense ? 'text-emerald-400' : 'text-white'
              }`}
            />
            <span
              className={`text-6xl font-bold transition-colors duration-300 ${
                !isExpense ? 'text-emerald-600/50' : 'text-gray-600'
              }`}
            >
              €
            </span>
          </div>

          <div className="w-64">
            <Switch
              options={switchOptions}
              value={isExpense}
              onChange={setIsExpense}
              colors={switchColors}
            />
          </div>
        </div>

        {/* 2. CATÉGORIES */}
        <div className="space-y-3">
          <label className="text-xs font-bold text-gray-400 uppercase tracking-wider ml-1">
            Catégorie
          </label>
          <div className="grid grid-cols-4 gap-3">
            {Object.keys(PERSONAL_CATEGORIES).map((cat) => {
              const conf = PERSONAL_CATEGORIES[cat];
              const isSelected = category === cat;

              return (
                <button
                  key={cat}
                  onClick={() => setCategory(cat)}
                  className={`flex flex-col items-center gap-2 p-3 rounded-2xl transition-all ${
                    isSelected
                      ? 'bg-white/10 scale-105 border border-white/20'
                      : 'opacity-50 hover:opacity-100 hover:bg-white/5 border border-transparent'
                  }`}
                >
                  <div className={`p-2.5 rounded-xl ${conf.bg} ${conf.color}`}>
                    <conf.icon size={20} />
                  </div>
                  <span
                    className={`text-[10px] font-bold truncate w-full text-center ${
                      isSelected ? 'text-white' : 'text-gray-500'
                    }`}
                  >
                    {conf.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* 3. DÉTAILS (Redesign Complet) */}
        <div className="space-y-3">
          <label className="text-xs font-bold text-gray-400 uppercase tracking-wider ml-1">
            Détails
          </label>

          {/* LIGNE 1 : DATE */}
          <div className=" border border-white/5 rounded-3xl p-3 flex items-center gap-4 transition-colors focus-within:bg-white/10 focus-within:border-white/10">
            <div className="p-2 bg-indigo-500/10 rounded-xl text-indigo-400 shrink-0">
              <Calendar size={20} />
            </div>
            <div className="flex-1">
              <label className="text-[10px] text-gray-400 font-bold uppercase block mb-1">
                Date
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="bg-transparent w-full text-white font-bold outline-none [color-scheme:dark] text-sm"
              />
            </div>
          </div>

          {/* LIGNE 2 : TITRE */}
          <div className=" border border-white/5 rounded-3xl p-3 flex items-center gap-4 transition-colors focus-within:bg-white/10 focus-within:border-white/10">
            <div className="p-2 bg-blue-500/10 rounded-xl text-blue-400 shrink-0">
              <Type size={20} />
            </div>
            <div className="flex-1">
              <label className="text-[10px] text-gray-400 font-bold uppercase block mb-1">
                Titre (Optionnel)
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ex: McDo, Loyer, Freelance..."
                className="bg-transparent w-full text-white font-medium placeholder-gray-600 outline-none text-sm"
              />
            </div>
          </div>

          {/* LIGNE 3 : NOTE (NOUVEAU) */}
          <div className=" border border-white/5 rounded-3xl p-3 flex gap-4 transition-colors focus-within:bg-white/10 focus-within:border-white/10">
            <div className="p-2 bg-purple-500/10 rounded-xl text-purple-400 shrink-0 h-fit">
              <AlignLeft size={20} />
            </div>
            <div className="flex-1">
              <label className="text-[10px] text-gray-400 font-bold uppercase block mb-1">
                Note / Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Ajouter des détails..."
                rows={3}
                className="bg-transparent w-full text-white font-medium placeholder-gray-600 outline-none resize-none text-sm leading-relaxed custom-scrollbar"
              />
            </div>
          </div>
        </div>
      </div>

      {/* FOOTER ACTIONS */}
      <div className="absolute bottom-0 left-0 right-0 p-6 pt-12 bg-gradient-to-t from-[#0A0A0A] via-[#0A0A0A]/80 to-transparent backdrop-blur-md z-20">
        <div className="flex gap-3">
          {transaction && (
            <button
              onClick={handleDelete}
              className="flex items-center justify-center p-4 rounded-2xl bg-red-500/10 text-red-500 hover:bg-red-500/20 hover:scale-[0.98] transition-all border border-red-500/10"
            >
              <Trash2 size={20} />
            </button>
          )}

          <button
            onClick={handleSubmit}
            disabled={loading || !amount}
            className={`flex-1 flex items-center justify-center gap-2 py-4 rounded-2xl font-bold shadow-lg transition-all active:scale-[0.98] ${
              !amount
                ? 'bg-gray-800 text-gray-500 cursor-not-allowed'
                : !isExpense
                ? 'bg-emerald-600 text-white hover:bg-emerald-500 shadow-emerald-500/25'
                : 'bg-indigo-600 text-white hover:bg-indigo-500 shadow-indigo-500/25'
            }`}
          >
            {loading ? (
              '...'
            ) : (
              <>
                <Save size={18} />
                {transaction ? 'Mettre à jour' : 'Ajouter'}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
