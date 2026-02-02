<<<<<<< HEAD
import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../../supabaseClient';
import { calculateTax } from '../../utils/taxCalculator';
import {
  Package,
  History,
  Wallet,
  Landmark,
  Plus,
  Minus,
  X,
  GraduationCap,
  FileText,
  ChevronRight,
} from 'lucide-react';
import { formatEuro } from '../../utils/format';

// --- NOUVEAUX IMPORTS SYSTEM ---
import { UI, TEXT } from '../../designSystem';
import BigNumber from '../../components/ui/BigNumber';
import Modal from '../../components/ui/Modal';
import TreasuryForm from '../../components/forms/TreasuryForm';

export default function DashboardBusiness() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [totalTreasury, setTotalTreasury] = useState(0);

  // Gestion Modale & UI
  const [showTreasuryActions, setShowTreasuryActions] = useState(false);
  const [modalConfig, setModalConfig] = useState({
    show: false,
    type: 'DEPOSIT',
  });

  useEffect(() => {
    fetchGlobalTreasury();
  }, []);

  const fetchGlobalTreasury = async () => {
    setLoading(true);
    try {
      // On récupère aussi les tax_settings pour le calcul sans faille
      const [
        resellReq,
        formationMetricsReq,
        formationExtraReq,
        expensesReq,
        batchesReq,
        treasuryReq,
        taxSettingsReq,
      ] = await Promise.all([
        supabase.from('view_dashboard_resell').select('*').eq('status', 'Sold'),
        supabase.from('formation_metrics').select('*'),
        supabase.from('formation_incomes').select('*'),
        supabase.from('business_expenses').select('*'),
        supabase.from('inventory_batches').select('*'),
        supabase.from('treasury_operations').select('*'),
        supabase.from('tax_settings').select('*'),
      ]);

      const allRates = taxSettingsReq.data || [];
      let balance = 0;

      // 1. Mouvements Trésorerie (Directs)
      treasuryReq.data?.forEach((op) => (balance += op.amount));

      // 2. Achats Stock (Dépenses)
      batchesReq.data?.forEach((batch) => {
        if (batch.status !== 'DRAFT') balance -= batch.total_cost || 0;
      });

      // 3. Ventes Resell (Net d'impôt calculé par l'utilitaire strict)
      resellReq.data?.forEach((item) => {
        const amount = item.sold_price || 0;
        const tax = calculateTax({
          amount,
          type: 'RESELL',
          regime: item.tax_profile || 'MICRO_STANDARD',
          allRates,
          year: new Date(item.sold_at || Date.now()).getFullYear(),
        });
        balance += amount - tax;
      });

      // 4. Revenus Formation (Net d'impôt)
      formationMetricsReq.data?.forEach((m) => {
        const amount = (m.subscriber_count || 0) * (m.subscription_price || 0);
        if (amount > 0) {
          const tax = calculateTax({
            amount,
            type: 'SERVICE',
            regime: 'MICRO_STANDARD',
            allRates,
            year: new Date().getFullYear(),
          });
          balance += amount - tax;
        }
      });

      formationExtraReq.data?.forEach((e) => {
        const amount = e.amount || 0;
        const tax = calculateTax({
          amount,
          type: 'SERVICE',
          regime: 'MICRO_STANDARD',
          allRates,
          year: new Date(e.date || Date.now()).getFullYear(),
        });
        balance += amount - tax;
      });

      // 5. Frais Généraux
      expensesReq.data?.forEach((exp) => (balance -= exp.amount || 0));

      setTotalTreasury(balance);
    } catch (err) {
      console.error('Erreur calcul trésorerie:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full space-y-8 pb-24">
      {/* 1. HERO SECTION (Utilisation de BigNumber) */}
      <div className="relative pt-4">
        <BigNumber
          label="Trésorerie Globale"
          value={totalTreasury}
          color={totalTreasury >= 0 ? 'emerald' : 'red'}
          icon={Landmark}
          loading={loading}
        />

        {/* Actions Trésorerie Épurées */}
        <div className="mt-6 flex items-center justify-center gap-3">
          {!showTreasuryActions ? (
            <button
              onClick={() => setShowTreasuryActions(true)}
              className="bg-white/5 border border-white/10 px-6 py-2.5 rounded-full flex items-center gap-2 text-sm font-bold text-gray-300 transition-all active:scale-95 hover-bg-soft shadow-lg"
            >
              <Wallet size={16} className="text-amber-500" /> Gérer
            </button>
          ) : (
            <div className="flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2">
              <button
                onClick={() => setModalConfig({ show: true, type: 'DEPOSIT' })}
                className="w-10 h-10 rounded-full bg-emerald-500/20 border border-emerald-500/50 flex items-center justify-center text-emerald-400 active:scale-90"
              >
                <Plus size={20} />
              </button>
              <button
                onClick={() =>
                  setModalConfig({ show: true, type: 'WITHDRAWAL' })
                }
                className="w-10 h-10 rounded-full bg-red-500/20 border border-red-500/50 flex items-center justify-center text-red-400 active:scale-90"
              >
                <Minus size={20} />
              </button>
              <button
                onClick={() => setShowTreasuryActions(false)}
                className="w-10 h-10 rounded-full bg-gray-800 border border-gray-700 flex items-center justify-center text-gray-400 active:scale-90"
              >
                <X size={18} />
              </button>
            </div>
          )}

          <button
            onClick={() => navigate('/business/history')}
            className="bg-white/5 border border-white/10 w-10 h-10 rounded-full flex items-center justify-center text-gray-400 active:scale-95 hover-bg-soft shadow-lg"
          >
            <History size={18} />
          </button>
        </div>
      </div>

      {/* 2. NAVIGATION CARDS (Pôles d'activité) */}
      <div className="px-2 space-y-3">
        <h3 className={TEXT.label + ' pl-2'}>Pôles d'activité</h3>

        <div className="grid gap-3">
          {/* RESELL CARD */}
          <Link to="/business/resell" className="block group">
            <div className="bg-[#050505] border border-white/5 p-5 rounded-[2.2rem] relative overflow-hidden transition-all shadow-hover-fix group-active:scale-[0.98]">
              <div className="flex justify-between items-center relative z-10">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-teal-500/10 border border-teal-500/20 rounded-2xl flex items-center justify-center text-teal-400 group-hover:scale-110 transition-transform">
                    <Package size={22} />
                  </div>
                  <div>
                    <h4 className="font-bold text-white group-hover:text-teal-400 transition-colors">
                      Resell Vinted
                    </h4>
                    <p className="text-[10px] text-gray-500 uppercase tracking-widest">
                      Stock, Ventes & Bénéfices
                    </p>
                  </div>
                </div>
                <ChevronRight
                  size={18}
                  className="text-gray-600 group-hover:text-white transition-colors"
                />
              </div>
            </div>
          </Link>

          {/* FORMATION CARD */}
          <Link to="/business/formation" className="block group">
            <div className="bg-[#050505] border border-white/5 p-5 rounded-[2.2rem] relative overflow-hidden transition-all shadow-hover-fix group-active:scale-[0.98]">
              <div className="flex justify-between items-center relative z-10">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-rose-500/10 border border-rose-500/20 rounded-2xl flex items-center justify-center text-rose-400 group-hover:scale-110 transition-transform">
                    <GraduationCap size={22} />
                  </div>
                  <div>
                    <h4 className="font-bold text-white group-hover:text-rose-400 transition-colors">
                      Formation
                    </h4>
                    <p className="text-[10px] text-gray-500 uppercase tracking-widest">
                      Membres & Revenus
                    </p>
                  </div>
                </div>
                <ChevronRight
                  size={18}
                  className="text-gray-600 group-hover:text-white transition-colors"
                />
              </div>
            </div>
          </Link>

          {/* FISCALITÉ CARD */}
          <Link to="/business/fiscalite" className="block group">
            <div className="bg-[#050505] border border-white/5 p-5 rounded-[2.2rem] relative overflow-hidden transition-all shadow-hover-fix group-active:scale-[0.98]">
              <div className="flex justify-between items-center relative z-10">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-amber-500/10 border border-amber-500/20 rounded-2xl flex items-center justify-center text-amber-400 group-hover:scale-110 transition-transform">
                    <FileText size={22} />
                  </div>
                  <div>
                    <h4 className="font-bold text-white group-hover:text-amber-400 transition-colors">
                      Fiscalité
                    </h4>
                    <p className="text-[10px] text-gray-500 uppercase tracking-widest">
                      Taxes & Déclarations
                    </p>
                  </div>
                </div>
                <ChevronRight
                  size={18}
                  className="text-gray-600 group-hover:text-white transition-colors"
                />
              </div>
            </div>
          </Link>
        </div>
      </div>

      {/* MODALE TRÉSORERIE (Logique Template + Form) */}
      <Modal
        isOpen={modalConfig.show}
        onClose={() => setModalConfig({ ...modalConfig, show: false })}
        title="Trésorerie"
        icon={Wallet}
        type="bottom"
      >
        <TreasuryForm
          initialType={modalConfig.type}
          onSuccess={() => {
            fetchGlobalTreasury();
            setModalConfig({ ...modalConfig, show: false });
          }}
        />
      </Modal>
    </div>
  );
}
=======
import React from 'react';

export default function DashboardBusiness() {
  return (
    <div className="text-white">
      <h1 className="text-3xl font-bold mb-4">Business Hub</h1>
      <p className="text-gray-400">Gestion des revenus, taxes et stocks.</p>
    </div>
  );
}
>>>>>>> b059916d660855e6ecbbb30e2c0fbe19f4e98993
