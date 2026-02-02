import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';
import { TAX_REGIMES } from '../../utils/taxCalculator.js';
import { Save, Plus, Trash2, Bot, Package, Tag, Euro } from 'lucide-react';

// --- IMPORTS SYSTEM ---
import { UI, SHAPES, TEXT } from '../../designSystem';
import Switch from '../ui/Switch';
import CustomSelect from '../ui/CustomSelect';
import { formatEuro } from '../../utils/format';

export default function NewBatchForm({ onClose, onSuccess }) {
  const [loading, setLoading] = useState(false);
  const [isBotMode, setIsBotMode] = useState(false);
  const [brandSuggestions, setBrandSuggestions] = useState([]);
  const [activeSuggestionId, setActiveSuggestionId] = useState(null);
  const [dropdownPosition, setDropdownPosition] = useState({
    top: 0,
    left: 0,
    width: 0,
  });

  const [batchInfo, setBatchInfo] = useState({
    name: '',
    purchase_date: new Date().toISOString().split('T')[0],
    total_cost: '',
    tax_profile: 'MICRO_STANDARD',
  });

  const [groups, setGroups] = useState([
    { id: 1, name: '', brand: '', count: 1, manualPrice: '' },
  ]);

  // Chargement des marques
  useEffect(() => {
    const fetchBrands = async () => {
      try {
        const { data } = await supabase
          .from('resell_items')
          .select('brand')
          .not('brand', 'is', null)
          .limit(100);

        if (data) {
          const uniqueBrands = [
            ...new Set(data.map((item) => item.brand).filter(Boolean)),
          ];
          setBrandSuggestions(uniqueBrands.sort());
        }
      } catch (err) {
        console.error(err);
      }
    };
    fetchBrands();
  }, []);

  // Calculs Stats
  const stats = (() => {
    let fixedCost = 0,
      fixedCount = 0,
      variableCount = 0,
      itemsTotalManualPrice = 0;

    groups.forEach((g) => {
      const qty = parseInt(g.count) || 0;
      if (g.manualPrice !== '') {
        const p = parseFloat(g.manualPrice);
        fixedCost += p * qty;
        fixedCount += qty;
        itemsTotalManualPrice += p * qty;
      } else {
        variableCount += qty;
      }
    });

    const totalBudget = parseFloat(batchInfo.total_cost) || 0;
    const autoUnitCost =
      variableCount > 0
        ? Math.max(0, (totalBudget - fixedCost) / variableCount)
        : 0;

    return {
      totalBudget,
      totalCount: fixedCount + variableCount,
      autoUnitCost,
      itemsTotalManualPrice,
    };
  })();

  const isFormValid =
    groups.every((g) => g.name?.trim() !== '' && g.brand?.trim() !== '') &&
    (isBotMode
      ? true
      : batchInfo.name?.trim() !== '' && batchInfo.total_cost !== '');

  // Actions Groupes
  const addGroup = () =>
    setGroups([
      ...groups,
      { id: Date.now(), name: '', brand: '', count: 1, manualPrice: '' },
    ]);
  const removeGroup = (id) => {
    if (groups.length > 1) setGroups(groups.filter((g) => g.id !== id));
  };
  const updateGroup = (id, field, value) =>
    setGroups(groups.map((g) => (g.id === id ? { ...g, [field]: value } : g)));
  const selectBrand = (groupId, brandName) => {
    updateGroup(groupId, 'brand', brandName);
    setActiveSuggestionId(null);
  };

  // Submit
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isFormValid || loading) return;
    setLoading(true);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      let targetBatchId;
      const now = new Date();

      // Logique Création Batch (Identique à avant)
      if (isBotMode) {
        const monthName = now.toLocaleString('fr-FR', {
          month: 'long',
          year: 'numeric',
        });
        const botBatchName = `Fast Cop - ${
          monthName.charAt(0).toUpperCase() + monthName.slice(1)
        }`;

        const { data: existingBatch } = await supabase
          .from('inventory_batches')
          .select('id, total_cost, item_count')
          .eq('name', botBatchName)
          .eq('batch_type', 'BOT')
          .single();

        if (existingBatch) {
          targetBatchId = existingBatch.id;
          await supabase
            .from('inventory_batches')
            .update({
              total_cost:
                existingBatch.total_cost + stats.itemsTotalManualPrice,
              item_count: existingBatch.item_count + stats.totalCount,
            })
            .eq('id', targetBatchId);
        } else {
          const { data: newBatch, error } = await supabase
            .from('inventory_batches')
            .insert([
              {
                user_id: user.id,
                name: botBatchName,
                purchase_date: now,
                total_cost: stats.itemsTotalManualPrice,
                item_count: stats.totalCount,
                status: 'DELIVERED',
                tax_profile: batchInfo.tax_profile,
                batch_type: 'BOT',
              },
            ])
            .select()
            .single();
          if (error) throw error;
          targetBatchId = newBatch.id;
        }
      } else {
        const { data: batchData, error } = await supabase
          .from('inventory_batches')
          .insert([
            {
              user_id: user.id,
              name: batchInfo.name,
              purchase_date: batchInfo.purchase_date || null,
              total_cost: stats.totalBudget,
              item_count: stats.totalCount,
              status: 'ACTIVE',
              tax_profile: batchInfo.tax_profile,
              batch_type: 'STANDARD',
            },
          ])
          .select()
          .single();
        if (error) throw error;
        targetBatchId = batchData.id;
      }

      // Création Items
      const itemsToCreate = [];
      groups.forEach((group) => {
        const qty = parseInt(group.count) || 0;
        const finalUnitPrice =
          group.manualPrice !== ''
            ? parseFloat(group.manualPrice)
            : stats.autoUnitCost;
        for (let i = 0; i < qty; i++) {
          itemsToCreate.push({
            user_id: user.id,
            batch_id: targetBatchId,
            name: group.name,
            brand: group.brand,
            status: 'Unpublished',
            purchase_price: finalUnitPrice,
            tax_profile: batchInfo.tax_profile,
          });
        }
      });

      if (itemsToCreate.length > 0) {
        await supabase.from('resell_items').insert(itemsToCreate);
      }

      // Succès
      if (onSuccess) onSuccess(); // Rafraichit la liste parent
      if (onClose) onClose(); // Ferme la modale
    } catch (error) {
      console.error(error);
      alert('Erreur: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const inputStyle =
    'w-full bg-black/40 border border-white/5 rounded-xl py-3 px-4 font-bold text-sm text-white outline-none focus:ring-1 focus:ring-indigo-500/50 transition-all placeholder-gray-700';

  return (
    <div
      className="flex flex-col h-full bg-[#0A0A0A] relative overflow-hidden"
      onClick={() => setActiveSuggestionId(null)}
    >
      {/* 1. HEADER FIXE (Z-30 pour être au dessus du dégradé et de la liste) */}
      <div className="relative z-[100] bg-[#0A0A0A] pt-4 px-6 pb-4">
        <Switch
          options={[
            { value: 'STANDARD', label: 'STANDARD', icon: Package },
            { value: 'BOT', label: 'FAST COP', icon: Bot },
          ]}
          value={isBotMode ? 'BOT' : 'STANDARD'}
          onChange={(val) => setIsBotMode(val === 'BOT')}
          colors={{
            0: {
              bg: 'rgba(99, 102, 241, 0.1)',
              border: 'rgba(99, 102, 241, 0.3)',
              text: 'text-indigo-400',
            },
            1: {
              bg: 'rgba(139, 92, 246, 0.1)',
              border: 'rgba(139, 92, 246, 0.3)',
              text: 'text-violet-400',
            },
          }}
        />
        {/* ✨ LE VRAI DÉGRADÉ FLOU ✨ */}
        {/* Positionné en bas du header, il descend sur le contenu pour flouter l'arrivée */}
        <div className="absolute -bottom-16 left-0 right-0 h-16 bg-gradient-to-b from-[#0A0A0A] to-transparent pointer-events-none" />
      </div>

      {/* 2. CONTENU SCROLLABLE */}
      {/* pb-40 : Zone de sécurité immense pour que la dernière carte dépasse le footer */}
      <div
        className="flex-1 overflow-y-auto custom-scrollbar px-4 space-y-6 pb-48 pt-6"
        onScroll={() => setActiveSuggestionId(null)}
      >
        {/* CONFIGURATION (Standard Only) */}
        {!isBotMode && (
          <div className="p-5 bg-[#111] rounded-[2rem] border border-white/5 space-y-6 relative z-[60]">
            <div className="grid grid-cols-1 gap-6">
              <div className="space-y-2">
                <label className={TEXT.label}>Nom du lot</label>
                <div className="relative group">
                  <Tag
                    size={16}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600 group-focus-within:text-indigo-400 transition-colors"
                  />
                  <input
                    required
                    type="text"
                    value={batchInfo.name}
                    onChange={(e) =>
                      setBatchInfo({ ...batchInfo, name: e.target.value })
                    }
                    className={`${inputStyle} pl-12`}
                    placeholder="Ex: Colis Vinted Hiver"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className={TEXT.label}>Coût Global (€)</label>
                  <div className="relative group">
                    <Euro
                      size={16}
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600 group-focus-within:text-indigo-400 transition-colors"
                    />
                    <input
                      required
                      type="number"
                      step="0.01"
                      inputMode="decimal"
                      value={batchInfo.total_cost}
                      onChange={(e) =>
                        setBatchInfo({
                          ...batchInfo,
                          total_cost: e.target.value,
                        })
                      }
                      className={`${inputStyle} pl-12 text-indigo-400`}
                      placeholder="0.00"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className={TEXT.label}>Date</label>
                  <input
                    type="date"
                    value={batchInfo.purchase_date}
                    onChange={(e) =>
                      setBatchInfo({
                        ...batchInfo,
                        purchase_date: e.target.value,
                      })
                    }
                    className={`${inputStyle} [color-scheme:dark] text-gray-400`}
                  />
                </div>
              </div>
            </div>
            <div className="relative z-0">
              <CustomSelect
                label="Régime Fiscal"
                value={batchInfo.tax_profile}
                options={Object.entries(TAX_REGIMES).map(([k, i]) => ({
                  value: k,
                  label: i.label,
                }))}
                onChange={(v) => setBatchInfo({ ...batchInfo, tax_profile: v })}
              />
            </div>
          </div>
        )}

        {/* INVENTAIRE */}
        <div className="space-y-4 pb-10">
          <div className="flex justify-between items-center px-2">
            <h2 className="text-sm font-bold text-white uppercase tracking-widest">
              Articles
            </h2>
            <button
              type="button"
              onClick={addGroup}
              className="text-indigo-400 font-black text-[10px] uppercase tracking-widest flex items-center gap-1 active:scale-95 transition-all hover:text-indigo-300"
            >
              <Plus size={14} /> Ajouter une ligne
            </button>
          </div>

          {groups.map((group, index) => (
            <div
              key={group.id}
              // Plus besoin de z-index complexe ici, le menu est en fixed
              className="p-5 bg-[#111] rounded-[2rem] border border-white/5 space-y-4 relative !overflow-visible"
            >
              <div className="flex gap-4">
                <div className="w-20 shrink-0 space-y-2">
                  <label className={TEXT.label}>Qté</label>
                  <input
                    type="number"
                    min="1"
                    inputMode="numeric"
                    value={group.count}
                    onChange={(e) =>
                      updateGroup(group.id, 'count', e.target.value)
                    }
                    className={`${inputStyle} text-center !px-0`}
                  />
                </div>
                <div className="flex-1 space-y-2">
                  <label className={TEXT.label}>Désignation</label>
                  <input
                    type="text"
                    placeholder="Ex: Hoodie"
                    value={group.name}
                    onChange={(e) =>
                      updateGroup(group.id, 'name', e.target.value)
                    }
                    className={inputStyle}
                  />
                </div>
              </div>
              <div className="flex gap-3 items-end relative !overflow-visible">
                <div className="flex-1 space-y-2 relative !overflow-visible">
                  <label className={TEXT.label}>Marque</label>
                  <input
                    type="text"
                    placeholder="Nike..."
                    value={group.brand}
                    onClick={(e) => {
                      e.stopPropagation();
                      // CALCUL DE POSITION (Magie ici)
                      const rect = e.currentTarget.getBoundingClientRect();
                      setDropdownPosition({
                        top: rect.bottom + 8, // Juste en dessous de l'input
                        left: rect.left,
                        width: rect.width,
                      });
                      setActiveSuggestionId(group.id);
                    }}
                    onChange={(e) => {
                      updateGroup(group.id, 'brand', e.target.value);
                      // Mise à jour position en temps réel
                      const rect = e.currentTarget.getBoundingClientRect();
                      setDropdownPosition({
                        top: rect.bottom + 8,
                        left: rect.left,
                        width: rect.width,
                      });
                      setActiveSuggestionId(group.id);
                    }}
                    className={inputStyle}
                  />
                  {activeSuggestionId === group.id &&
                    brandSuggestions.length > 0 && (
                      <div
                        // POSITION FIXED : Sort du flux et passe au-dessus du footer (Z-100)
                        className="fixed z-[100] bg-[#1A1A1A] border border-white/20 rounded-2xl overflow-hidden shadow-[0_10px_40px_rgba(0,0,0,0.9)] backdrop-blur-xl animate-fade-in custom-scrollbar"
                        style={{
                          top: dropdownPosition.top,
                          left: dropdownPosition.left,
                          width: dropdownPosition.width,
                          maxHeight: '12rem',
                          overflowY: 'auto',
                        }}
                      >
                        {brandSuggestions
                          .filter((b) =>
                            b.toLowerCase().includes(group.brand.toLowerCase())
                          )
                          .slice(0, 5)
                          .map((b, i) => (
                            <div
                              key={i}
                              onClick={(e) => {
                                e.stopPropagation();
                                selectBrand(group.id, b);
                              }}
                              className="p-4 hover:bg-indigo-600/20 hover:text-indigo-400 cursor-pointer font-bold text-xs border-b border-white/5 last:border-0 transition-colors text-gray-300"
                            >
                              {b}
                            </div>
                          ))}
                      </div>
                    )}
                </div>
                <div className="w-28 space-y-2">
                  <label className={TEXT.label}>P.U (€)</label>
                  <input
                    type="number"
                    step="0.01"
                    inputMode="decimal"
                    value={
                      group.manualPrice ||
                      (isBotMode ? '' : stats.autoUnitCost.toFixed(2))
                    }
                    onChange={(e) =>
                      updateGroup(group.id, 'manualPrice', e.target.value)
                    }
                    className={`${inputStyle} text-right ${
                      group.manualPrice
                        ? 'border-indigo-500/50 text-indigo-400'
                        : 'text-gray-500'
                    }`}
                  />
                </div>
                <button
                  type="button"
                  onClick={() => removeGroup(group.id)}
                  className="w-[50px] h-[46px] bg-red-500/10 text-red-500 rounded-xl border border-red-500/10 flex items-center justify-center hover:bg-red-500/20 transition-all active:scale-95 shrink-0"
                >
                  <Trash2 size={20} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 3. FOOTER ACTIONS (Liquid Glass & Large) */}
      <div className="absolute bottom-0 left-0 right-0 p-2 pb-3 z-50">
        <div className="mx-1 bg-[#0A0A0A]/60 backdrop-blur-xl border border-white/10 rounded-[1.6rem] p-3 shadow-[0_-10px_40px_rgba(0,0,0,0.6)]">
          {/* Carte Total avec fond léger */}
          <div className="flex justify-between items-center px-6 py-4 bg-white/5 rounded-2xl border border-white/5 mb-3">
            <span className="text-xs text-gray-400 font-bold uppercase tracking-widest">
              Total : <span className="text-white">{stats.totalCount} pcs</span>
            </span>
            <span className="font-black text-indigo-400 text-lg">
              {formatEuro(
                isBotMode ? stats.itemsTotalManualPrice : stats.totalBudget
              )}
            </span>
          </div>

          <button
            onClick={handleSubmit}
            disabled={loading || !isFormValid}
            className={`w-full py-5 rounded-[1.8rem] font-black text-xs uppercase tracking-widest flex justify-center items-center gap-3 transition-all shadow-lg active:scale-[0.98] ${
              loading || !isFormValid
                ? 'bg-gray-900 text-gray-600 border border-white/5 cursor-not-allowed'
                : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-900/30'
            }`}
          >
            {loading ? 'ENREGISTREMENT...' : 'VALIDER LE STOCK'}
            {!loading && <Save size={18} />}
          </button>
        </div>
      </div>
    </div>
  );
}
