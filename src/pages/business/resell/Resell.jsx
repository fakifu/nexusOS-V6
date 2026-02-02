import React, { useEffect, useState, useMemo } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '../../../supabaseClient';
import { calculateTax } from '../../../utils/taxCalculator';
import { formatEuro } from '../../../utils/format';

// --- ICONS ---
import {
  Package,
  TrendingUp,
  Search,
  Shirt,
  Filter,
  X,
  Bot,
  FileText,
  Plus,
  SlidersHorizontal,
  Layers,
  Box,
  ArrowRight,
  TrendingDown,
} from 'lucide-react';

// --- COMPONENTS ---
import Modal from '../../../components/ui/Modal';
import ItemDetailForm from '../../../components/forms/ItemDetailForm';
import NewBatchForm from '../../../components/forms/NewBatchForm';
import CustomSelect from '../../../components/ui/CustomSelect';
import ExpenseSection from './ExpenseSection'; // Assure-toi que ce chemin est bon
import Switch from '../../../components/ui/Switch'; // J'utilise ton composant Switch UI optimisé
import { UI, SHAPES, TEXT } from '../../../designSystem';
import SearchBar from '../../../components/ui/SearchBar';

export default function Resell() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // Gestion de l'onglet actif (Items vs Batches)
  const activeTab = searchParams.get('view') || 'items';
  const handleTabChange = (val) => {
    // Si c'est un booléen (du Switch), on convertit
    const view = val === true ? 'items' : val === false ? 'batches' : val;
    setSearchParams({ view }, { replace: true });
  };

  // --- STATES ---
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ revenue: 0, profit: 0, itemsSold: 0 });
  const [allItems, setAllItems] = useState([]);
  const [allBatches, setAllBatches] = useState([]);

  // UI States
  const [showFilterPanel, setShowFilterPanel] = useState(false);
  const [selectedItemForModal, setSelectedItemForModal] = useState(null);
  const [showAllItems, setShowAllItems] = useState(false);
  const [showAllBatches, setShowAllBatches] = useState(false);
  const [totalExpenses, setTotalExpenses] = useState(0);
  const [isNewBatchModalOpen, setIsNewBatchModalOpen] = useState(false);

  // Filter States
  const [brandSearchTerm, setBrandSearchTerm] = useState('');
  const [batchSearch, setBatchSearch] = useState('');
  const [batchTaxFilter, setBatchTaxFilter] = useState('ALL');
  const [archiveFilter, setArchiveFilter] = useState('ACTIVE'); // 'ACTIVE' | 'ARCHIVED'

  const [filters, setFilters] = useState({
    search: '',
    status: 'ALL',
    sort: 'DATE_DESC',
    minPrice: '',
    maxPrice: '',
    selectedBatchId: 'ALL',
    selectedBrand: 'ALL',
    year: new Date().getFullYear().toString(),
    source: 'ALL',
  });

  // --- INITIALIZATION ---
  useEffect(() => {
    fetchData();
  }, []);

  // --- DATA FETCHING & LOGIC ---
  const fetchData = async () => {
    setLoading(true);
    try {
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

      const [resellsRes, itemsRes, batchesRes] = await Promise.all([
        supabase.from('view_dashboard_resell').select('*'),
        supabase
          .from('resell_items')
          .select(
            '*, inventory_batches!inner (id, name, status, tax_profile, total_cost, item_count, batch_type)'
          )
          .order('created_at', { ascending: false }),
        supabase
          .from('inventory_batches')
          .select('*')
          .order('created_at', { ascending: false }),
      ]);

      const resells = resellsRes.data || [];
      const itemsData = itemsRes.data || [];
      const batchesData = batchesRes.data || [];

      // 1. Calcul Stats Mensuelles
      const currentMonthSales = resells.filter((i) => {
        if (i.status !== 'Sold' || !i.sale_date) return false;
        const saleDate = new Date(i.sale_date);
        return saleDate >= startOfMonth && saleDate <= endOfMonth;
      });

      const monthlyRevenue = currentMonthSales.reduce(
        (acc, curr) => acc + (curr.sold_price || 0),
        0
      );

      const currentMonthInvestments = batchesData.filter((b) => {
        const date = new Date(b.purchase_date || b.created_at);
        return date >= startOfMonth && date <= endOfMonth;
      });
      const monthlyInvest = currentMonthInvestments.reduce(
        (acc, b) => acc + (b.total_cost || 0),
        0
      );

      const monthlyTax = currentMonthSales.reduce(
        (acc, item) => acc + calculateTax(item.sold_price, item.tax_profile),
        0
      );

      setStats({
        revenue: monthlyRevenue,
        profit: monthlyRevenue - monthlyTax - monthlyInvest,
        itemsSold: currentMonthSales.length,
      });

      // 2. Logique d'archivage automatique des ballots
      const batchesToArchive = [];
      const updatedBatches = batchesData.map((batch) => {
        const batchItems = itemsData.filter((i) => i.batch_id === batch.id);
        const soldCount = batchItems.filter((i) => i.status === 'Sold').length;

        // Auto-Archive si complet
        if (
          batch.item_count > 0 &&
          soldCount === batch.item_count &&
          !batch.is_archived
        ) {
          batchesToArchive.push(batch.id);
          return { ...batch, is_archived: true };
        }
        // Désarchivage si retour en stock (litige)
        if (soldCount < batch.item_count && batch.is_archived) {
          supabase
            .from('inventory_batches')
            .update({ is_archived: false })
            .eq('id', batch.id);
          return { ...batch, is_archived: false };
        }
        return batch;
      });

      if (batchesToArchive.length > 0) {
        await supabase
          .from('inventory_batches')
          .update({ is_archived: true })
          .in('id', batchesToArchive);
      }

      setAllItems(itemsData);
      setAllBatches(updatedBatches);
    } catch (error) {
      console.error('Erreur FetchData:', error);
    } finally {
      setLoading(false);
    }
  };

  // Optimistic UI Update
  const updateItemLocally = (itemId, newData) => {
    setAllItems((prevItems) =>
      prevItems.map((item) =>
        item.id === itemId ? { ...item, ...newData } : item
      )
    );
  };

  // Delete Logic
  const handleDeleteItem = async (itemToDelete) => {
    const currentBatch = itemToDelete.inventory_batches;
    if (!currentBatch) return alert('Erreur: Ballot introuvable.');

    // Recalcul du coût du ballot
    const newTotalCost = Math.max(
      0,
      currentBatch.total_cost - itemToDelete.purchase_price
    );
    const newItemCount = Math.max(0, currentBatch.item_count - 1);

    try {
      await supabase
        .from('inventory_batches')
        .update({ total_cost: newTotalCost, item_count: newItemCount })
        .eq('id', currentBatch.id);

      await supabase.from('resell_items').delete().eq('id', itemToDelete.id);

      setAllItems(allItems.filter((i) => i.id !== itemToDelete.id));
      fetchData(); // Refresh global pour synchro stats
      setSelectedItemForModal(null);
    } catch (error) {
      alert('Erreur: ' + error.message);
    }
  };

  // --- FILTERS LOGIC ---
  const getFilteredItems = useMemo(() => {
    return allItems
      .filter((item) => {
        // Exclure brouillons
        if (item.inventory_batches?.status === 'DRAFT') return false;

        // Filtre Année
        const itemYear = item.sale_date
          ? new Date(item.sale_date).getFullYear()
          : new Date(item.created_at).getFullYear();
        if (filters.year !== 'ALL' && itemYear.toString() !== filters.year)
          return false;

        // Filtre Source (Bot/Batch)
        if (
          filters.source === 'BOT' &&
          item.inventory_batches?.batch_type !== 'BOT'
        )
          return false;
        if (
          filters.source === 'BATCH' &&
          item.inventory_batches?.batch_type === 'BOT'
        )
          return false;

        // Recherche textuelle
        const searchTerms = filters.search
          .toLowerCase()
          .split(' ')
          .filter(Boolean);
        const searchMatch =
          searchTerms.length === 0 ||
          searchTerms.every(
            (term) =>
              (item.name?.toLowerCase() || '').includes(term) ||
              (item.brand?.toLowerCase() || '').includes(term)
          );
        if (!searchMatch) return false;

        // Filtre Statut
        if (filters.status === 'SOLD' && item.status !== 'Sold') return false;
        if (
          filters.status === 'AVAILABLE' &&
          item.status !== 'Unpublished' &&
          item.status !== 'Listed'
        )
          return false;

        // Filtres Spécifiques
        if (
          filters.selectedBatchId !== 'ALL' &&
          item.batch_id !== filters.selectedBatchId
        )
          return false;
        if (
          filters.selectedBrand !== 'ALL' &&
          item.brand !== filters.selectedBrand
        )
          return false;

        // Filtre Prix (Nouveau)
        if (
          filters.minPrice &&
          (item.sold_price || item.listed_price) < parseFloat(filters.minPrice)
        )
          return false;
        if (
          filters.maxPrice &&
          (item.sold_price || item.listed_price) > parseFloat(filters.maxPrice)
        )
          return false;

        return true;
      })
      .sort((a, b) => {
        if (filters.sort === 'DATE_ASC')
          return new Date(a.created_at) - new Date(b.created_at);
        return new Date(b.created_at) - new Date(a.created_at);
      });
  }, [allItems, filters]);

  const getFilteredBatches = useMemo(() => {
    return allBatches.filter(
      (b) =>
        b.batch_type !== 'BOT' &&
        b.name.toLowerCase().includes(filters.search.toLowerCase()) &&
        (filters.year === 'ALL' ||
          !b.purchase_date ||
          new Date(b.purchase_date).getFullYear().toString() ===
            filters.year) &&
        (batchTaxFilter === 'ALL' || b.tax_profile === batchTaxFilter) &&
        (archiveFilter === 'ACTIVE' ? !b.is_archived : b.is_archived)
    );
  }, [allBatches, filters.search, filters.year, batchTaxFilter, archiveFilter]);

  // --- DERIVED DATA ---
  const displayedItems = showAllItems
    ? getFilteredItems
    : getFilteredItems.slice(0, 10);
  const displayedBatches = showAllBatches
    ? getFilteredBatches
    : getFilteredBatches.slice(0, 5);
  const activeFiltersCount = Object.values(filters).filter(
    (v) =>
      v !== '' &&
      v !== 'ALL' &&
      v !== 'DATE_DESC' &&
      v !== new Date().getFullYear().toString()
  ).length;

  // Dropdown Lists
  const uniqueBrands = [
    ...new Set(allItems.map((i) => i.brand).filter(Boolean)),
  ].sort();
  const filteredBrandsList = uniqueBrands.filter((b) =>
    b.toLowerCase().includes(brandSearchTerm.toLowerCase())
  );
  const dropdownBatches = allBatches.filter(
    (b) =>
      b.batch_type !== 'BOT' &&
      b.name.toLowerCase().includes(batchSearch.toLowerCase())
  );
  const years = [
    ...new Set(allItems.map((i) => new Date(i.created_at).getFullYear())),
  ].sort((a, b) => b - a);

  // --- HELPERS ---
  const getStatusColor = (status) => {
    switch (status) {
      case 'PAID':
        return 'text-blue-400';
      case 'SHIPPED':
        return 'text-orange-400';
      case 'DELIVERED':
        return 'text-green-400';
      default:
        return 'text-gray-500';
    }
  };

  const resellSwitchColors = {
    left: {
      bg: 'rgba(99, 102, 241, 0.2)',
      border: 'rgba(99, 102, 241, 0.5)',
      text: 'text-indigo-400',
    },
    right: {
      bg: 'rgba(59, 130, 246, 0.2)',
      border: 'rgba(59, 130, 246, 0.5)',
      text: 'text-blue-400',
    },
  };

  return (
    <div className="space-y-6 relative pb-20">
      {/* 1. KPI SECTION */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className={`${UI.cardCompact} p-4`}>
          <p className="text-gray-500 text-[10px] uppercase font-bold tracking-wider">
            Chiffre d'Affaires
          </p>
          <p className="text-xl font-bold text-white mt-1">
            {formatEuro(stats.revenue)}
          </p>
        </div>
        <div className={`${UI.cardCompact} p-4`}>
          <p className="text-gray-500 text-[10px] uppercase font-bold tracking-wider">
            Profit Net (Mois)
          </p>
          <p
            className={`text-xl font-bold mt-1 ${
              stats.profit - totalExpenses >= 0
                ? 'text-emerald-400'
                : 'text-red-500'
            }`}
          >
            {stats.profit - totalExpenses >= 0 ? '+' : ''}
            {formatEuro(stats.profit - totalExpenses)}
          </p>
        </div>
        <div className={`${UI.cardCompact} p-4`}>
          <p className="text-gray-500 text-[10px] uppercase font-bold tracking-wider">
            Taxes (Estim.)
          </p>
          <p className="text-xl font-bold text-red-400 mt-1">
            -
            {formatEuro(
              allItems
                .filter(
                  (i) =>
                    i.status === 'Sold' &&
                    new Date(i.sale_date).getMonth() === new Date().getMonth()
                )
                .reduce(
                  (acc, i) => acc + calculateTax(i.sold_price, i.tax_profile),
                  0
                )
            )}
          </p>
        </div>
        <div className={`${UI.cardCompact} p-4`}>
          <p className="text-gray-500 text-[10px] uppercase font-bold tracking-wider">
            Ventes (Mois)
          </p>
          <p className="text-xl font-bold text-white mt-1">
            {stats.itemsSold}{' '}
            <span className="text-xs font-normal text-gray-500">pcs</span>
          </p>
        </div>
      </div>

      {/* 2. ACTIONS RAPIDES */}
      <div className="flex gap-3">
        <button
          onClick={() => setIsNewBatchModalOpen(true)}
          className="w-full bg-indigo-600/10 border border-indigo-600/30 p-3 rounded-[2rem] flex justify-center items-center gap-2 text-indigo-400 font-bold text-sm hover:bg-indigo-600/20 transition-all active:scale-95 shadow-lg shadow-indigo-900/10"
        >
          <Plus size={18} />
          Nouveau Ballot
        </button>
        {/* Le bouton "Nouvelle Vente" a été supprimé comme demandé */}
      </div>

      {/* 3. RECHERCHE & NAVIGATION */}
      <div className="space-y-4">
        {/* 👇 REMPLACEMENT ICI */}
        <SearchBar
          placeholder={
            activeTab === 'items'
              ? 'Rechercher un article...'
              : 'Rechercher un ballot...'
          }
          value={filters.search}
          onChange={(e) => setFilters({ ...filters, search: e.target.value })}
        />

        <div className="w-full">
          <Switch
            value={activeTab === 'items'}
            onChange={handleTabChange}
            options={[
              { value: true, label: 'Articles', icon: Shirt },
              { value: false, label: 'Ballots', icon: Package },
            ]}
            colors={resellSwitchColors}
          />
        </div>
      </div>

      {/* 4. CONTENU PRINCIPAL */}
      {/* VUE ARTICLES */}
      {activeTab === 'items' && !loading && (
        <div className="space-y-3 relative pb-4">
          {/* Bar de Filtres Rapides */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 no-scrollbar">
            {['ALL', 'AVAILABLE', 'SOLD'].map((status) => (
              <button
                key={status}
                onClick={() => setFilters({ ...filters, status })}
                className={`px-4 py-1.5 rounded-full text-xs font-bold border whitespace-nowrap transition ${
                  filters.status === status
                    ? 'bg-white text-black border-white'
                    : 'bg-transparent text-gray-500 border-white/10'
                }`}
              >
                {status === 'ALL'
                  ? 'Tous'
                  : status === 'AVAILABLE'
                  ? 'En Stock'
                  : 'Vendus'}
              </button>
            ))}
            <div className="w-px h-4 bg-white/10 mx-1"></div>
            <button
              onClick={() => setShowFilterPanel(true)}
              className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold border transition shrink-0 ${
                activeFiltersCount > 0
                  ? 'bg-teal-500/20 text-teal-400 border-teal-500/50'
                  : 'bg-transparent text-gray-500 border-white/10'
              }`}
            >
              <SlidersHorizontal size={14} /> Filtres
              {activeFiltersCount > 0 && (
                <span className="bg-teal-500 text-black text-[10px] w-4 h-4 rounded-full flex items-center justify-center ml-1">
                  {activeFiltersCount}
                </span>
              )}
            </button>
          </div>

          {/* Liste Articles */}
          {displayedItems.length > 0 ? (
            displayedItems.map((item) => (
              <div
                key={item.id}
                onClick={() => setSelectedItemForModal(item)}
                className={`${UI.cardInteractive} ${SHAPES.item} flex justify-between items-center p-3`}
              >
                <div className="flex items-center gap-4">
                  <div
                    className={`p-3 rounded-xl ${
                      item.status === 'Sold'
                        ? 'bg-green-500/10 text-green-400'
                        : 'bg-blue-500/10 text-blue-400'
                    }`}
                  >
                    <Shirt size={20} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-white text-sm">
                        {item.brand || 'Marque Inconnue'}
                      </h3>
                      {item.inventory_batches?.batch_type === 'BOT' && (
                        <Bot size={12} className="text-purple-400" />
                      )}
                    </div>
                    <p className="text-xs text-gray-500 line-clamp-1">
                      {item.name}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p
                    className={`font-bold ${
                      item.status === 'Sold'
                        ? 'text-green-400'
                        : 'text-gray-400'
                    }`}
                  >
                    {item.status === 'Sold'
                      ? `+${formatEuro(item.sold_price)}`
                      : `-${formatEuro(item.purchase_price)}`}
                  </p>
                  <p className="text-[10px] text-gray-600">
                    {item.status === 'Sold' ? 'Vendu' : 'Stock'}
                  </p>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-10 text-gray-500 text-sm">
              Aucun article trouvé.
            </div>
          )}

          {/* Bouton Voir Plus */}
          {getFilteredItems.length > 10 && !showAllItems && (
            <div className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-black via-black/95 to-transparent flex items-end justify-center pb-6 z-30 pointer-events-none">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowAllItems(true);
                }}
                className={`${UI.btnGhost} pointer-events-auto bg-black border border-white/20 text-xs px-8 py-3 shadow-2xl hover:bg-white/10 backdrop-blur-md text-white font-bold rounded-full transition-all active:scale-95`}
              >
                Afficher plus ({getFilteredItems.length})
              </button>
            </div>
          )}
        </div>
      )}

      {/* VUE BALLOTS */}
      {activeTab === 'batches' && !loading && (
        <div className="space-y-6 relative pb-24">
          {/* Filtres Ballots */}
          <div className="flex flex-col items-center gap-4 mb-4">
            <div className="w-full max-w-[340px]">
              <Switch
                value={archiveFilter === 'ARCHIVED'} // Adaptation boolean
                onChange={(val) =>
                  setArchiveFilter(val ? 'ARCHIVED' : 'ACTIVE')
                }
                options={[
                  { value: false, label: 'EN COURS', icon: Layers },
                  { value: true, label: 'ARCHIVÉS', icon: Box },
                ]}
                colors={{
                  left: {
                    bg: 'rgba(99, 102, 241, 0.1)',
                    border: 'rgba(99, 102, 241, 0.3)',
                    text: 'text-indigo-400',
                  },
                  right: {
                    bg: 'rgba(59, 130, 246, 0.1)',
                    border: 'rgba(59, 130, 246, 0.3)',
                    text: 'text-blue-400',
                  },
                }}
              />
            </div>

            {/* Chips Taxes */}
            <div className="flex flex-wrap justify-center gap-2 w-full">
              {[
                { val: 'ALL', label: 'TOUS' },
                { val: 'MICRO_STANDARD', label: 'STANDARD' },
                { val: 'MICRO_ACRE', label: 'ACRE' },
                { val: 'UNDECLARED', label: 'NON DÉCLARÉ' },
              ].map((chip) => (
                <button
                  key={chip.val}
                  onClick={() => setBatchTaxFilter(chip.val)}
                  className={`px-3 py-1.5 rounded-full text-[9px] font-bold uppercase tracking-widest border transition-all ${
                    batchTaxFilter === chip.val
                      ? 'bg-white text-black border-white'
                      : 'bg-[#0A0A0A] text-gray-500 border-white/5'
                  }`}
                >
                  {chip.label}
                </button>
              ))}
            </div>
          </div>

          {/* Liste Ballots */}
          <div className="space-y-4">
            {displayedBatches.length > 0 ? (
              displayedBatches.map((batch) => {
                const batchItems = allItems.filter(
                  (i) => i.batch_id === batch.id && i.status === 'Sold'
                );
                const batchRevenue = batchItems.reduce(
                  (acc, curr) => acc + (curr.sold_price || 0),
                  0
                );
                const taxes = batchItems.reduce(
                  (acc, i) => acc + calculateTax(i.sold_price, i.tax_profile),
                  0
                );
                const netProfit = batchRevenue - batch.total_cost - taxes;
                const progress =
                  batch.item_count > 0
                    ? (batchItems.length / batch.item_count) * 100
                    : 0;

                return (
                  <Link
                    key={batch.id}
                    to={`/business/batch/${batch.id}`}
                    className={`${UI.cardInteractive} block overflow-hidden rounded-[1.2rem] border-white/5 p-0 group`}
                  >
                    <div className="p-5 flex justify-between items-start">
                      <div>
                        <h3 className="font-bold text-white text-base group-hover:text-indigo-400 transition-colors">
                          {batch.name}
                        </h3>
                        <div className="flex gap-2 mt-1.5 items-center">
                          <span
                            className={`text-[9px] font-bold px-2 py-0.5 rounded-full border border-white/5 bg-white/5 uppercase tracking-tighter ${getStatusColor(
                              batch.status
                            )}`}
                          >
                            {batch.status}
                          </span>
                          <span className="text-[9px] text-gray-500 font-bold uppercase tracking-widest flex items-center gap-1">
                            <FileText size={10} />{' '}
                            {batch.tax_profile.replace('_', ' ')}
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-[9px] text-gray-500 uppercase font-bold tracking-widest mb-0.5">
                          Net Réel
                        </p>
                        <p
                          className={`text-lg font-bold ${
                            netProfit >= 0
                              ? 'text-emerald-400'
                              : 'text-orange-400'
                          }`}
                        >
                          {netProfit > 0 ? '+' : ''}
                          {formatEuro(netProfit)}
                        </p>
                      </div>
                    </div>
                    {/* Progress Bar */}
                    <div className="px-5 pb-5">
                      <div className="flex justify-between items-center mb-1.5">
                        <span className="text-[9px] text-gray-600 font-bold uppercase">
                          Ventes : {batchItems.length}/{batch.item_count}
                        </span>
                        <span className="text-[9px] text-gray-400 font-bold">
                          {Math.round(progress)}%
                        </span>
                      </div>
                      <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-700 ${
                            progress === 100
                              ? 'bg-emerald-500'
                              : 'bg-indigo-500'
                          }`}
                          style={{ width: `${progress}%` }}
                        ></div>
                      </div>
                    </div>
                  </Link>
                );
              })
            ) : (
              <div className="text-center py-10 border border-dashed border-white/10 rounded-3xl bg-white/5">
                <p className="text-gray-500 text-[10px] font-bold uppercase tracking-widest">
                  Aucun ballot trouvé
                </p>
              </div>
            )}
          </div>

          {/* Bouton Voir Plus Ballots */}
          {getFilteredBatches.length > 5 && !showAllBatches && (
            <div className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-black via-black/95 to-transparent flex items-end justify-center pb-6 z-30 pointer-events-none">
              <button
                onClick={(e) => {
                  e.preventDefault();
                  setShowAllBatches(true);
                }}
                className={`${UI.btnGhost} pointer-events-auto bg-[#0A0A0A] border border-white/20 text-[10px] uppercase tracking-widest px-8 py-3 shadow-2xl hover:bg-white/10 backdrop-blur-md text-white font-bold rounded-full transition-all active:scale-95`}
              >
                Voir tout ({getFilteredBatches.length})
              </button>
            </div>
          )}
        </div>
      )}

      {/* 5. DÉPENSES MENSUELLES */}
      <div className="mt-6">
        <ExpenseSection
          category="RESELL"
          currentMonthKey={`${new Date().getFullYear()}-${String(
            new Date().getMonth() + 1
          ).padStart(2, '0')}`}
          onExpenseChange={setTotalExpenses}
        />
      </div>

      {/* MODALE DETAIL ITEM */}
      <Modal
        isOpen={!!selectedItemForModal}
        onClose={() => setSelectedItemForModal(null)}
        title="Détails Article"
        type="bottom" // 👈 C'est ça qui fait l'effet tiroir du bas
        icon={Shirt} // Importe Shirt de lucide-react
      >
        <ItemDetailForm
          item={selectedItemForModal}
          onClose={() => setSelectedItemForModal(null)}
          onDelete={handleDeleteItem} // Ta fonction existante dans Resell.jsx
          onUpdate={fetchData} // Ta fonction existante
          onOptimisticUpdate={updateItemLocally} // Ta fonction existante
        />
      </Modal>

      {/* MODALE NOUVEAU BALLOT */}
      <Modal
        isOpen={isNewBatchModalOpen}
        onClose={() => setIsNewBatchModalOpen(false)}
        title="Nouveau Stock"
        icon={Package}
      >
        <NewBatchForm
          onClose={() => setIsNewBatchModalOpen(false)}
          onSuccess={fetchData} // Important : recharge les données après création
        />
      </Modal>

      {/* FILTER PANEL (Slide-over) */}
      {showFilterPanel && (
        <div className="fixed inset-0 z-[100] flex justify-end items-start isolate">
          <div
            className="absolute inset-0 bg-black/80 backdrop-blur-sm transition-opacity"
            onClick={() => setShowFilterPanel(false)}
          ></div>
          <div className="relative w-[340px] m-4 max-h-[92vh] bg-[#050505] border border-white/10 rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.5)] overflow-hidden animate-slide-in-right flex flex-col">
            {/* Header Panel */}
            <div className="p-6 border-b border-white/5 flex justify-between items-center bg-[#050505] shrink-0">
              <div>
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <Filter size={20} className="text-indigo-400" /> Filtres
                </h2>
              </div>
              <button
                onClick={() => setShowFilterPanel(false)}
                className="w-10 h-10 bg-white/5 rounded-full flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/10 transition border border-white/5"
              >
                <X size={20} />
              </button>
            </div>

            {/* Scrollable Content */}
            <div className="p-6 overflow-y-auto custom-scrollbar flex-1 space-y-8">
              <div className="flex justify-end">
                <button
                  onClick={() =>
                    setFilters({
                      search: '',
                      status: 'ALL',
                      sort: 'DATE_DESC',
                      minPrice: '',
                      maxPrice: '',
                      selectedBatchId: 'ALL',
                      selectedBrand: 'ALL',
                      year: 'ALL',
                      source: 'ALL',
                    })
                  }
                  className="text-[10px] uppercase tracking-tighter text-red-500 font-bold flex items-center gap-1"
                >
                  <X size={12} /> Réinitialiser
                </button>
              </div>

              {/* Année */}
              <div className="space-y-3">
                <label className="text-[10px] text-gray-500 uppercase font-bold tracking-widest block px-1">
                  Année
                </label>
                <div className="flex gap-2 flex-wrap">
                  <button
                    onClick={() => setFilters({ ...filters, year: 'ALL' })}
                    className={`px-4 py-2 text-xs font-bold rounded-xl border ${
                      filters.year === 'ALL'
                        ? 'bg-white text-black border-white'
                        : 'bg-black border-white/10 text-gray-400'
                    }`}
                  >
                    Toutes
                  </button>
                  {years.map((y) => (
                    <button
                      key={y}
                      onClick={() =>
                        setFilters({ ...filters, year: y.toString() })
                      }
                      className={`px-4 py-2 text-xs font-bold rounded-xl border ${
                        filters.year === y.toString()
                          ? 'bg-white text-black border-white'
                          : 'bg-black border-white/10 text-gray-400'
                      }`}
                    >
                      {y}
                    </button>
                  ))}
                </div>
              </div>

              {/* Prix Min/Max (Nouveau - Optimisé Mobile) */}
              <div className="space-y-3">
                <label className="text-[10px] text-gray-500 uppercase font-bold tracking-widest block px-1">
                  Prix (€)
                </label>
                <div className="flex gap-3">
                  <div className="flex-1">
                    <input
                      type="number"
                      inputMode="decimal" // Force clavier numérique
                      placeholder="Min"
                      value={filters.minPrice}
                      onChange={(e) =>
                        setFilters({ ...filters, minPrice: e.target.value })
                      }
                      className={`${UI.input} text-center`}
                    />
                  </div>
                  <div className="flex items-center text-gray-600">
                    <ArrowRight size={14} />
                  </div>
                  <div className="flex-1">
                    <input
                      type="number"
                      inputMode="decimal" // Force clavier numérique
                      placeholder="Max"
                      value={filters.maxPrice}
                      onChange={(e) =>
                        setFilters({ ...filters, maxPrice: e.target.value })
                      }
                      className={`${UI.input} text-center`}
                    />
                  </div>
                </div>
              </div>

              {/* Tri */}
              <div className="space-y-3">
                <CustomSelect
                  label="Trier par"
                  value={filters.sort}
                  options={[
                    { value: 'DATE_DESC', label: 'Plus Récent' },
                    { value: 'DATE_ASC', label: 'Plus Ancien' },
                  ]}
                  onChange={(v) => setFilters({ ...filters, sort: v })}
                />
              </div>

              {/* Ballot Search */}
              <div className="space-y-3">
                <label className="text-[10px] text-gray-500 uppercase font-bold tracking-widest block px-1">
                  Ballot
                </label>
                <div className="relative group">
                  <Search
                    size={14}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-indigo-400"
                  />
                  <input
                    type="text"
                    placeholder="Nom du ballot..."
                    value={batchSearch}
                    onChange={(e) => setBatchSearch(e.target.value)}
                    className="w-full bg-black border border-white/10 rounded-2xl py-3 pl-11 pr-4 text-xs text-white placeholder-gray-700 focus:border-indigo-500/50 outline-none"
                  />
                </div>
                <div className="max-h-36 overflow-y-auto space-y-1 border border-white/5 rounded-2xl p-2 bg-black/40 custom-scrollbar">
                  <button
                    onClick={() =>
                      setFilters({ ...filters, selectedBatchId: 'ALL' })
                    }
                    className={`w-full text-left px-4 py-2.5 text-[11px] font-bold rounded-xl ${
                      filters.selectedBatchId === 'ALL'
                        ? 'bg-indigo-500/10 text-indigo-400'
                        : 'text-gray-500 hover:bg-white/5'
                    }`}
                  >
                    Tous les ballots
                  </button>
                  {dropdownBatches.map((b) => (
                    <button
                      key={b.id}
                      onClick={() =>
                        setFilters({ ...filters, selectedBatchId: b.id })
                      }
                      className={`w-full text-left px-4 py-2.5 text-[11px] font-bold rounded-xl truncate ${
                        filters.selectedBatchId === b.id
                          ? 'bg-indigo-500/10 text-indigo-400'
                          : 'text-gray-500 hover:bg-white/5'
                      }`}
                    >
                      {b.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Brand Search */}
              <div className="space-y-3">
                <label className="text-[10px] text-gray-500 uppercase font-bold tracking-widest block px-1">
                  Marque
                </label>
                <div className="relative group">
                  <Search
                    size={14}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-indigo-400"
                  />
                  <input
                    type="text"
                    placeholder="Chercher une marque..."
                    value={brandSearchTerm}
                    onChange={(e) => setBrandSearchTerm(e.target.value)}
                    className="w-full bg-black border border-white/10 rounded-2xl py-3 pl-11 pr-4 text-xs text-white placeholder-gray-700 focus:border-indigo-500/50 outline-none"
                  />
                </div>
                <div className="max-h-36 overflow-y-auto space-y-1 border border-white/5 rounded-2xl p-2 bg-black/40 custom-scrollbar">
                  <button
                    onClick={() =>
                      setFilters({ ...filters, selectedBrand: 'ALL' })
                    }
                    className={`w-full text-left px-4 py-2.5 text-[11px] font-bold rounded-xl ${
                      filters.selectedBrand === 'ALL'
                        ? 'bg-indigo-500/10 text-indigo-400'
                        : 'text-gray-500 hover:bg-white/5'
                    }`}
                  >
                    Toutes les marques
                  </button>
                  {filteredBrandsList.map((b) => (
                    <button
                      key={b}
                      onClick={() =>
                        setFilters({ ...filters, selectedBrand: b })
                      }
                      className={`w-full text-left px-4 py-2.5 text-[11px] font-bold rounded-xl truncate ${
                        filters.selectedBrand === b
                          ? 'bg-indigo-500/10 text-indigo-400'
                          : 'text-gray-500 hover:bg-white/5'
                      }`}
                    >
                      {b}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Footer Panel */}
            <div className="p-6 border-t border-white/5 bg-[#050505] shrink-0">
              <button
                onClick={() => setShowFilterPanel(false)}
                className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-4 rounded-2xl transition-all shadow-lg shadow-indigo-900/20 active:scale-95 flex items-center justify-center gap-2"
              >
                Afficher {getFilteredItems.length} résultats
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
