import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '../../supabaseClient';
import {
  Tag,
  Trash2,
  AlertTriangle,
  RotateCcw,
  Edit3,
  Check,
  X,
  DollarSign,
  Calendar,
  Calculator,
} from 'lucide-react';
import { formatEuro } from '../../utils/format';
// Ensure this path matches your file structure exactly
import { calculateTax } from '../../utils/taxCalculator';
import ConfirmModal from '../ui/ConfirmModal';

export default function ItemDetailForm({
  item,
  onClose,
  onDelete,
  onUpdate,
  onOptimisticUpdate,
}) {
  // --- STATES ---
  const [taxRates, setTaxRates] = useState([]); // Stores tax configuration from DB

  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
  const [isConfirmingRestock, setIsConfirmingRestock] = useState(false);
  const [isEditingPrice, setIsEditingPrice] = useState(false);

  // Sale States
  const [isSelling, setIsSelling] = useState(false);
  const [salePrice, setSalePrice] = useState('');
  const [saleDate, setSaleDate] = useState(
    new Date().toISOString().split('T')[0]
  );

  // Price Edit State
  const [newSalePrice, setNewSalePrice] = useState(item?.sold_price || '');

  if (!item) return null;
  const isSold = item.status === 'Sold';

  // --- 1. FETCH TAX RATES (Once on mount) ---
  useEffect(() => {
    const fetchTaxSettings = async () => {
      const { data, error } = await supabase.from('tax_settings').select('*');
      if (!error && data) {
        setTaxRates(data);
      } else if (error) {
        console.error('Error fetching tax settings:', error);
      }
    };
    fetchTaxSettings();
  }, []);

  // --- 2. ROBUST CALCULATION VIA TAXCALCULATOR ---
  const stats = useMemo(() => {
    if (!isSold || !item.sold_price) return null;

    // Determine sale year for historical tax rates
    const saleYear = item.sold_date
      ? new Date(item.sold_date).getFullYear()
      : new Date().getFullYear();

    // Call robust utility
    const taxAmount = calculateTax({
      amount: item.sold_price,
      type: 'RESELL',
      regime: item.tax_profile || 'MICRO_STANDARD', // Default fallback
      allRates: taxRates, // Pass full DB config
      year: saleYear,
    });

    const revenue = item.sold_price;
    const cost = item.purchase_price || 0;
    const netProfit = revenue - cost - taxAmount;

    return {
      revenue,
      cost,
      taxAmount,
      netProfit,
      saleYear,
    };
  }, [item, isSold, taxRates]);

  // --- BUSINESS LOGIC ---

  // A. SELL ITEM
  const handleMarkAsSold = async () => {
    if (!salePrice) return;

    const price = parseFloat(salePrice);

    const optimisticData = {
      status: 'Sold',
      sold_price: price,
      sold_date: saleDate, // Correct DB column name
    };

    if (onOptimisticUpdate) onOptimisticUpdate(item.id, optimisticData);
    if (onClose) onClose();

    try {
      const { error } = await supabase
        .from('resell_items')
        .update(optimisticData)
        .eq('id', item.id);

      if (error) throw error;
      if (onUpdate) onUpdate();
    } catch (err) {
      console.error(err);
      alert('Erreur lors de la vente : ' + err.message);
      if (onUpdate) onUpdate(); // Rollback visual update
    }
  };

  // B. RESTOCK (Cancel Sale)
  const handleReturnToStock = async () => {
    const optimisticData = {
      status: 'AVAILABLE',
      sold_price: null,
      sold_date: null,
    };

    if (onOptimisticUpdate) onOptimisticUpdate(item.id, optimisticData);
    if (onClose) onClose();
    setIsConfirmingRestock(false);

    try {
      await supabase
        .from('resell_items')
        .update(optimisticData)
        .eq('id', item.id);
      if (onUpdate) onUpdate();
    } catch (err) {
      console.error(err);
    }
  };

  // C. UPDATE PRICE
  const handleUpdateSalePrice = async () => {
    if (!newSalePrice) return;
    const price = parseFloat(newSalePrice);
    const optimisticData = { sold_price: price };

    if (onOptimisticUpdate) onOptimisticUpdate(item.id, optimisticData);
    setIsEditingPrice(false);

    try {
      await supabase
        .from('resell_items')
        .update(optimisticData)
        .eq('id', item.id);
      if (onUpdate) onUpdate();
    } catch (err) {
      console.error(err);
    }
  };

  // D. DELETE
  const executeDelete = async () => {
    if (onDelete) {
      await onDelete(item);
      if (onClose) onClose();
    }
  };

  // --- RENDER LITIGE ACTIONS (Clean, no card) ---
  const renderLitigeActions = () => {
    if (isEditingPrice) {
      return (
        <div className="flex gap-2 w-full animate-fade-in mt-4">
          <div className="relative flex-1">
            <input
              autoFocus
              type="number"
              value={newSalePrice}
              onChange={(e) => setNewSalePrice(e.target.value)}
              className="w-full h-12 bg-[#1A1A1A] border border-indigo-500 rounded-xl px-4 text-white text-lg font-bold outline-none"
              placeholder="0.00"
            />
          </div>
          <button
            onClick={handleUpdateSalePrice}
            className="w-12 h-12 bg-indigo-600 rounded-xl text-white flex items-center justify-center shadow-lg active:scale-95 transition-transform"
          >
            <Check size={20} />
          </button>
          <button
            onClick={() => setIsEditingPrice(false)}
            className="w-12 h-12 bg-white/5 rounded-xl text-gray-400 flex items-center justify-center hover:bg-white/10"
          >
            <X size={20} />
          </button>
        </div>
      );
    }

    return (
      <div className="flex gap-4 mt-6 justify-center opacity-70 hover:opacity-100 transition-opacity">
        <button
          onClick={() => setIsConfirmingRestock(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-full hover:bg-white/5 transition-colors"
        >
          <RotateCcw size={14} className="text-gray-400" />
          <span className="text-[10px] font-bold uppercase text-gray-400">
            Annuler Vente
          </span>
        </button>
        <button
          onClick={() => setIsEditingPrice(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-full hover:bg-white/5 transition-colors"
        >
          <Edit3 size={14} className="text-indigo-400" />
          <span className="text-[10px] font-bold uppercase text-indigo-400">
            Modifier Prix
          </span>
        </button>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full bg-[#0A0A0A] relative overflow-hidden">
      {/* SCROLLABLE CONTENT */}
      <div className="flex-1 overflow-y-auto custom-scrollbar px-6 pt-8 pb-12 space-y-8">
        {/* HEADER */}
        <div className="text-center space-y-2">
          <div className="w-20 h-20 rounded-[1.5rem] bg-gradient-to-br from-white/10 to-white/5 mx-auto flex items-center justify-center border border-white/10 mb-5 text-indigo-400 shadow-[0_0_30px_rgba(99,102,241,0.1)]">
            <Tag size={32} />
          </div>
          <h2 className="text-2xl font-black text-white tracking-tight uppercase leading-none">
            {item.brand}
          </h2>
          <p className="text-gray-400 font-medium text-base">{item.name}</p>
          {item.size && (
            <div className="inline-block mt-3 px-4 py-1.5 bg-white/5 rounded-lg border border-white/5">
              <span className="text-xs font-bold text-gray-300 uppercase tracking-wider">
                Taille {item.size}
              </span>
            </div>
          )}
        </div>

        {/* PRICE & STATS */}
        <div className="grid grid-cols-2 gap-3">
          {/* Purchase Box: Fixed height */}
          <div className="h-24 p-4 bg-[#111] rounded-[2rem] border border-white/5 flex flex-col items-center justify-center gap-1">
            <span className="text-[10px] uppercase font-bold text-gray-500 tracking-widest">
              Achat
            </span>
            <p className="text-2xl font-black text-white">
              -{formatEuro(item.purchase_price)}
            </p>
          </div>

          {/* Sale Box: Fixed height identical to Purchase */}
          <div
            className={`h-24 p-4 rounded-[2rem] border flex flex-col items-center justify-center gap-1 ${
              isSold
                ? 'bg-indigo-500/10 border-indigo-500/20'
                : 'bg-[#050505] border-white/5 opacity-50'
            }`}
          >
            <span
              className={`text-[10px] uppercase font-bold tracking-widest ${
                isSold ? 'text-indigo-400' : 'text-gray-600'
              }`}
            >
              Vente
            </span>
            <p
              className={`text-2xl font-black ${
                isSold ? 'text-indigo-400' : 'text-gray-600'
              }`}
            >
              {isSold ? `+${formatEuro(item.sold_price)}` : '--'}
            </p>
          </div>
        </div>

        {/* --- MAIN ACTION AREA --- */}

        {/* 1. PROFIT CALCULATION (If Sold) */}
        {isSold && stats && (
          <div className="space-y-6 pt-2">
            {/* NET PROFIT (Calculated after tax) */}
            <div className="flex flex-col items-center justify-center gap-1">
              <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                Bénéfice Net (Après Taxes)
              </span>
              <span
                className={`text-4xl font-black ${
                  stats.netProfit > 0 ? 'text-green-400' : 'text-red-400'
                }`}
              >
                {formatEuro(stats.netProfit)}
              </span>
            </div>

            {/* URSSAF DETAIL (Elegant Display) */}
            <div className="bg-[#0A0A0A] border border-white/5 rounded-3xl p-4 flex justify-between items-center px-6 mx-2">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/5 rounded-lg text-gray-400">
                  <Calculator size={16} />
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                    Cotisations Urssaf
                  </span>
                  <span className="text-[10px] text-gray-600 font-medium">
                    Estimé sur vente{' '}
                    {item.sold_date
                      ? new Date(item.sold_date).getFullYear()
                      : ''}
                  </span>
                </div>
              </div>
              <span className="text-sm font-bold text-gray-300">
                -{formatEuro(stats.taxAmount)}
              </span>
            </div>

            {/* Modification Zone */}
            {renderLitigeActions()}

            {/* Discrete Delete Button */}
            <button
              onClick={() => setIsConfirmingDelete(true)}
              className="w-full py-2 text-red-500/40 hover:text-red-500 text-[10px] font-bold uppercase tracking-widest transition-colors flex items-center justify-center gap-2"
            >
              <Trash2 size={14} /> Supprimer définitivement
            </button>
          </div>
        )}

        {/* 2. SALE FORM (If selling) */}
        {!isSold && isSelling && (
          <div className="bg-[#111] border border-white/5 rounded-[2rem] p-5 space-y-4 animate-slide-up">
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                Finaliser la vente
              </h3>
              <button
                onClick={() => setIsSelling(false)}
                className="p-2 bg-white/5 rounded-full hover:bg-white/10 text-gray-400"
              >
                <X size={16} />
              </button>
            </div>

            <div className="space-y-1">
              <label className="text-[9px] font-bold text-gray-500 uppercase ml-1">
                Prix de vente
              </label>
              <div className="relative group">
                <input
                  autoFocus
                  type="number"
                  value={salePrice}
                  onChange={(e) => setSalePrice(e.target.value)}
                  className="w-full h-14 bg-[#0A0A0A] border border-white/10 rounded-3xl pl-10 pr-4 text-white text-xl font-bold outline-none focus:border-indigo-500 transition-colors"
                  placeholder="0.00"
                />
                <DollarSign
                  size={18}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-indigo-500 transition-colors"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[9px] font-bold text-gray-500 uppercase ml-1">
                Date de vente
              </label>
              <div className="relative">
                <input
                  type="date"
                  value={saleDate}
                  onChange={(e) => setSaleDate(e.target.value)}
                  className="w-full h-14 bg-[#0A0A0A] border border-white/10 rounded-3xl pl-10 pr-4 text-white text-sm font-bold outline-none [color-scheme:dark] focus:border-indigo-500 transition-colors"
                />
                <Calendar
                  size={16}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500"
                />
              </div>
            </div>

            <button
              onClick={handleMarkAsSold}
              className="w-full h-14 bg-indigo-600 hover:bg-indigo-500 text-white rounded-3xl font-black uppercase tracking-widest text-sm transition-all shadow-lg shadow-indigo-900/20 flex items-center justify-center gap-2 mt-2"
            >
              Valider la vente
            </button>
          </div>
        )}

        {/* 3. STANDARD ACTIONS (If Available) */}
        {!isSold && !isSelling && (
          <div className="space-y-4 pt-4">
            {/* Large Standard Sell Button */}
            <button
              onClick={() => setIsSelling(true)}
              className="w-full py-5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-[2rem] font-black text-sm uppercase tracking-widest shadow-lg shadow-indigo-900/20 active:scale-[0.98] transition-all flex items-center justify-center gap-3"
            >
              <DollarSign size={20} strokeWidth={2.5} />
              Vendre l'article
            </button>

            {/* Discrete Delete Button */}
            <button
              onClick={() => setIsConfirmingDelete(true)}
              className="w-full py-2 text-red-500/40 hover:text-red-500 text-[10px] font-bold uppercase tracking-widest transition-colors"
            >
              Supprimer l'article
            </button>
          </div>
        )}
      </div>

      {/* --- WARNING MODALS --- */}

      {/* 1. Delete */}
      <ConfirmModal
        isOpen={isConfirmingDelete}
        onClose={() => setIsConfirmingDelete(false)}
        onConfirm={executeDelete}
        title="Supprimer l'article ?"
        message="Cette action est irréversible. Le coût du lot sera recalculé."
        isDanger={true}
      />

      {/* 2. Restock (Cancel Sale) */}
      <ConfirmModal
        isOpen={isConfirmingRestock}
        onClose={() => setIsConfirmingRestock(false)}
        onConfirm={handleReturnToStock}
        title="Annuler la vente ?"
        message="L'article retournera dans votre stock comme 'Disponible'. Les données de vente seront effacées."
        isDanger={true}
        confirmLabel="Confirmer le retour"
      />
    </div>
  );
}
