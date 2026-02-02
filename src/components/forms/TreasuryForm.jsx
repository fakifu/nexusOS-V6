import React, { useState } from 'react';
import { supabase } from '../../supabaseClient';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Save,
  ArrowDownLeft,
  ArrowUpRight,
  Wallet,
  Calendar,
  FileText,
  ArrowRightLeft,
  Loader2,
} from 'lucide-react';
import Switch from '../ui/Switch';

export default function TreasuryForm({ onSuccess, initialType = 'DEPOSIT' }) {
  const [loading, setLoading] = useState(false);
  const [type, setType] = useState(initialType);
  const [formData, setFormData] = useState({
    amount: '',
    date: new Date().toLocaleDateString('en-CA'),
    description: '',
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.amount) return;
    setLoading(true);

    try {
      // 1. Récupération User
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();
      if (userError || !user) throw new Error('Utilisateur non authentifié');

      // --- [MODIF 1] : PRÉPARATION DU LIEN ET DU TEMPS ---
      const linkId = window.crypto.randomUUID(); // Génère l'ID unique de liaison
      const now = new Date();
      const timePart = now.toTimeString().split(' ')[0];
      const fullTimestamp = `${formData.date}T${timePart}`;
      // ------------------------------------------------

      const amountValue = parseFloat(formData.amount);
      const businessAmount = amountValue * (type === 'WITHDRAWAL' ? -1 : 1);

      // 2. Préparation Business
      const businessPromise = supabase.from('treasury_operations').insert([
        {
          user_id: user.id,
          link_id: linkId, // <--- [MODIF 2] : On injecte le lien ici
          date: formData.date,
          created_at: fullTimestamp,
          amount: businessAmount,
          type: type,
          description:
            formData.description ||
            (type === 'INITIAL'
              ? 'Solde Initial'
              : type === 'DEPOSIT'
              ? 'Apport'
              : 'Retrait'),
        },
      ]);

      // 3. Préparation Perso (Le Pont)
      let personalPromise = Promise.resolve({ error: null });
      if (type !== 'INITIAL') {
        const personalAmount = businessAmount * -1;
        personalPromise = supabase.from('personal_transactions').insert([
          {
            user_id: user.id,
            link_id: linkId, // <--- [MODIF 3] : On injecte le MÊME lien ici
            date: formData.date,
            created_at: fullTimestamp, // On force aussi l'heure en Finance pour le tri
            amount: personalAmount,
            category: 'Business',
            description:
              type === 'DEPOSIT'
                ? 'Virement vers Business'
                : 'Retrait/Salaire Business',
            type: personalAmount < 0 ? 'EXPENSE' : 'INCOME',
          },
        ]);
      }

      const [resB, resP] = await Promise.all([
        businessPromise,
        personalPromise,
      ]);

      if (resB.error) throw resB.error;
      if (resP.error) throw resP.error;

      onSuccess();
    } catch (err) {
      console.error('Erreur Tréso:', err.message);
      alert("Erreur lors de l'enregistrement : " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const colors = {
    0: {
      bg: 'rgba(16, 185, 129, 0.2)',
      border: 'rgba(16, 185, 129, 0.5)',
      text: 'text-emerald-400',
    },
    1: {
      bg: 'rgba(239, 68, 68, 0.2)',
      border: 'rgba(239, 68, 68, 0.5)',
      text: 'text-red-400',
    },
    2: {
      bg: 'rgba(234, 179, 8, 0.2)',
      border: 'rgba(234, 179, 8, 0.5)',
      text: 'text-yellow-400',
    },
  };

  const activeColorClass =
    type === 'DEPOSIT'
      ? 'text-emerald-400'
      : type === 'WITHDRAWAL'
      ? 'text-red-400'
      : 'text-yellow-400';

  return (
    <form onSubmit={handleSubmit} className="p-6 space-y-8">
      <Switch
        options={[
          {
            value: 'DEPOSIT',
            label: 'Apport',
            icon: ArrowDownLeft,
            className: 'flex-1',
          },
          {
            value: 'WITHDRAWAL',
            label: 'Retrait',
            icon: ArrowUpRight,
            className: 'flex-1',
          },
          {
            value: 'INITIAL',
            label: 'Initial',
            icon: Wallet,
            className: 'w-12 flex-none',
          },
        ]}
        value={type}
        onChange={setType}
        colors={colors}
      />

      <div className="text-center">
        <input
          autoFocus
          type="number"
          step="0.01"
          required
          placeholder="0.00"
          value={formData.amount}
          onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
          className={`w-full bg-transparent text-center text-6xl font-black outline-none placeholder-gray-800 transition-colors ${activeColorClass}`}
        />
      </div>

      <div className="space-y-3">
        <div className="bg-white/5 border border-white/5 rounded-3xl px-4 py-3 flex items-center gap-3 focus-within:border-white/20 transition-colors">
          <Calendar size={18} className="text-gray-500" />
          <input
            type="date"
            value={formData.date}
            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
            className="bg-transparent text-white font-bold outline-none flex-1 text-sm"
          />
        </div>
        <div className="bg-white/5 border border-white/5 rounded-3xl px-4 py-3 flex items-center gap-3 focus-within:border-white/20 transition-colors">
          <FileText size={18} className="text-gray-500" />
          <input
            type="text"
            placeholder="Note..."
            value={formData.description}
            onChange={(e) =>
              setFormData({ ...formData, description: e.target.value })
            }
            className="bg-transparent text-white font-bold outline-none flex-1 text-sm placeholder-gray-600"
          />
        </div>
      </div>

      <div className="min-h-[40px] flex items-center justify-center">
        <AnimatePresence mode="wait">
          {type !== 'INITIAL' && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="flex items-center gap-3 px-2 opacity-60 w-full"
            >
              <ArrowRightLeft size={14} className="text-indigo-400 shrink-0" />
              <p className="text-[10px] text-indigo-300 font-medium">
                Synchronisation automatique avec les finances.
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <button
        type="submit"
        disabled={loading}
        className={`w-full py-5 rounded-[2rem] font-black text-sm uppercase tracking-widest flex items-center justify-center gap-3 transition-all shadow-xl active:scale-95 text-white
          ${
            type === 'DEPOSIT'
              ? 'bg-emerald-600 shadow-emerald-900/20'
              : type === 'WITHDRAWAL'
              ? 'bg-red-600 shadow-red-900/20'
              : 'bg-yellow-600 shadow-yellow-900/20 text-white'
          }`}
      >
        {loading ? (
          <Loader2 size={20} className="animate-spin" />
        ) : (
          <>
            <Save size={20} /> Valider
          </>
        )}
      </button>
    </form>
  );
}
