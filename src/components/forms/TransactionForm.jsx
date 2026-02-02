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
<<<<<<< HEAD
  AlignLeft,
} from 'lucide-react';

// 💡 IMPORT UI : On récupère tes composants visuels
import Input from '../ui/Input';
import Switch from '../ui/Switch';
// 💡 IMPORT MODALE : Indispensable pour remplacer le window.confirm moche
import ConfirmModal from '../ui/ConfirmModal';

export default function TransactionForm({
  transaction = null,
  onClose,
  setClose,
  onSuccess,
}) {
  // 💡 GESTION FERMETURE : Permet de gérer les différents cas (props vs state)
=======
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
>>>>>>> b059916d660855e6ecbbb30e2c0fbe19f4e98993
  const handleClose = () => {
    if (onClose) onClose();
    else if (setClose) setClose(null);
  };
<<<<<<< HEAD

  const [loading, setLoading] = useState(false);

  // ------------------------------------------------------------
  // 1. ÉTATS DU FORMULAIRE (STATES)
  // ------------------------------------------------------------
  const [amount, setAmount] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
=======
  const [loading, setLoading] = useState(false);

  // États du formulaire
  const [amount, setAmount] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState(''); // ✅ AJOUT DE LA NOTE
>>>>>>> b059916d660855e6ecbbb30e2c0fbe19f4e98993
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [category, setCategory] = useState('Food & Others');
  const [isExpense, setIsExpense] = useState(true);

<<<<<<< HEAD
  // 💡 NOUVEAU STATE : Gère l'affichage de la modale de confirmation
  // On le met ici avec les autres states pour s'y retrouver.
  // false = modale cachée, true = modale visible.
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // ------------------------------------------------------------
  // 2. CHARGEMENT DES DONNÉES (SI ÉDITION)
  // ------------------------------------------------------------
=======
  // Initialisation lors de l'édition
>>>>>>> b059916d660855e6ecbbb30e2c0fbe19f4e98993
  useEffect(() => {
    if (transaction) {
      setAmount(Math.abs(transaction.amount).toString());
      setTitle(transaction.title || '');
<<<<<<< HEAD
      setDescription(transaction.description || '');
      setDate(transaction.date);
      setCategory(transaction.category);
      // Détection auto : Dépense ou Revenu ?
=======
      setDescription(transaction.description || ''); // ✅ Chargement de la note
      setDate(transaction.date);
      setCategory(transaction.category);

>>>>>>> b059916d660855e6ecbbb30e2c0fbe19f4e98993
      const isExp = transaction.amount < 0 || transaction.type === 'EXPENSE';
      setIsExpense(isExp);
    }
  }, [transaction]);

<<<<<<< HEAD
  // ------------------------------------------------------------
  // 3. LOGIQUE D'ENREGISTREMENT (SUBMIT)
  // ------------------------------------------------------------
=======
>>>>>>> b059916d660855e6ecbbb30e2c0fbe19f4e98993
  const handleSubmit = async () => {
    if (!amount || !date) return;
    setLoading(true);

<<<<<<< HEAD
    // Calcul du montant final (Négatif si dépense, Positif si revenu)
=======
>>>>>>> b059916d660855e6ecbbb30e2c0fbe19f4e98993
    const finalAmount = isExpense
      ? -Math.abs(parseFloat(amount))
      : Math.abs(parseFloat(amount));

    const payload = {
      amount: finalAmount,
      title: title,
<<<<<<< HEAD
      description: description,
=======
      description: description, // ✅ Envoi de la note
>>>>>>> b059916d660855e6ecbbb30e2c0fbe19f4e98993
      date: date,
      category: category,
      type: isExpense ? 'EXPENSE' : 'INCOME',
    };

    try {
      if (transaction) {
<<<<<<< HEAD
        // --- CAS MISE À JOUR ---
=======
>>>>>>> b059916d660855e6ecbbb30e2c0fbe19f4e98993
        const { error } = await supabase
          .from('personal_transactions')
          .update(payload)
          .eq('id', transaction.id);
        if (error) throw error;
      } else {
<<<<<<< HEAD
        // --- CAS CRÉATION ---
=======
>>>>>>> b059916d660855e6ecbbb30e2c0fbe19f4e98993
        const {
          data: { user },
        } = await supabase.auth.getUser();
        const { error } = await supabase
          .from('personal_transactions')
          .insert([{ ...payload, user_id: user.id }]);
        if (error) throw error;
      }
<<<<<<< HEAD

      // Tout s'est bien passé
      onSuccess();
      handleClose();
    } catch (error) {
      console.error(error);
      // 💡 NOTE : Ici, idéalement, utilise un système de Toast/Notification
      // J'ai retiré le alert() comme demandé, l'erreur est dans la console.
=======
      onSuccess();
      handleClose(); // <--- Utilise la fonction sécurisée ici
    } catch (error) {
      console.error(error);
      alert(`Erreur : ${error.message}`);
>>>>>>> b059916d660855e6ecbbb30e2c0fbe19f4e98993
    } finally {
      setLoading(false);
    }
  };

<<<<<<< HEAD
  // ------------------------------------------------------------
  // 4. LOGIQUE DE SUPPRESSION (DELETE)
  // ------------------------------------------------------------

  // A. LE DÉCLENCHEUR : C'est ce que le bouton "Poubelle" appelle.
  // Il ne supprime rien, il ouvre juste la modale.
  const handleDeleteClick = () => {
    setShowDeleteModal(true);
  };

  // B. L'EXÉCUTEUR : C'est ce que la modale appelle quand on clique sur "Confirmer".
  // C'est ici que se trouve la logique complexe "backend".
  const executeDelete = async () => {
    setLoading(true);

    try {
      // On récupère toutes les infos nécessaires depuis le state 'formData' (ici 'transaction' ou states locaux)
      // J'utilise les variables du state local car 'transaction' peut être null en création (bien que rare pour un delete)
      // Mais pour un delete fiable, on utilise l'objet 'transaction' passé en prop.
      const id = transaction.id;
      const link_id = transaction.link_id;
      const cat = transaction.category;

      // 💡 SCÉNARIO 1 : Suppression Moderne (Via Link ID)
      // C'est le cas idéal : on a un ID commun, on nettoie les deux tables d'un coup.
      if (link_id) {
        const deletePerso = supabase
          .from('personal_transactions')
          .delete()
          .eq('link_id', link_id);
        const deleteBus = supabase
          .from('treasury_operations')
          .delete()
          .eq('link_id', link_id);

        const [resP, resB] = await Promise.all([deletePerso, deleteBus]);

        if (resP.error) throw resP.error;
        if (resB.error) throw resB.error;

        console.log('Suppression bidirectionnelle réussie (Link ID)');
      }

      // 💡 SCÉNARIO 2 : Suppression Legacy (Sans Link ID)
      // C'est le filet de sécurité pour tes anciennes données.
      else {
        // 1. On détermine dans quelle table on se trouve principalement
        // Astuce : si la catégorie existe dans l'objet transaction, c'est du perso.
        const isPersonal = cat !== undefined;
        const mainTable = isPersonal
          ? 'personal_transactions'
          : 'treasury_operations';

        // Supprime la ligne principale
        const { error } = await supabase.from(mainTable).delete().eq('id', id);
        if (error) throw error;

        // 2. Logique miroir manuelle (Le "Bricolage" propre)

        // Cas : On est côté Perso et c'est une cat 'Business'
        if (isPersonal && cat === 'Business') {
          await supabase
            .from('treasury_operations')
            .delete()
            .eq('date', date) // Utilise la date du state
            .eq('amount', parseFloat(amount) * -1); // Cherche montant inversé
        }
        // Cas : On est côté Business (si ce form est utilisé là-bas)
        else if (!isPersonal) {
          await supabase
            .from('personal_transactions')
            .delete()
            .eq('date', date)
            .eq('amount', parseFloat(amount) * -1)
            .eq('category', 'Business');
        }
      }

      // SUCCÈS
      if (onSuccess) onSuccess();
      handleClose();
    } catch (error) {
      console.error('Erreur suppression:', error);
      // Pas d'alert, juste un log console. Le loading s'arrêtera via le finally.
    } finally {
      setLoading(false);
      // Pas besoin de fermer la modale manuellement ici, le composant ConfirmModal le fait.
    }
  };

  // ------------------------------------------------------------
  // 5. CONFIGURATION UI
  // ------------------------------------------------------------
=======
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

>>>>>>> b059916d660855e6ecbbb30e2c0fbe19f4e98993
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

<<<<<<< HEAD
  // ------------------------------------------------------------
  // 6. RENDU (JSX)
  // ------------------------------------------------------------
=======
>>>>>>> b059916d660855e6ecbbb30e2c0fbe19f4e98993
  return (
    <div className="flex flex-col h-full bg-[#0A0A0A] relative overflow-hidden">
      {/* ZONE SCROLLABLE */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-8 pb-32">
<<<<<<< HEAD
        {/* INPUT MONTANT */}
=======
        {/* 1. INPUT MONTANT */}
>>>>>>> b059916d660855e6ecbbb30e2c0fbe19f4e98993
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

<<<<<<< HEAD
        {/* CATÉGORIES */}
=======
        {/* 2. CATÉGORIES */}
>>>>>>> b059916d660855e6ecbbb30e2c0fbe19f4e98993
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
<<<<<<< HEAD
                      : 'opacity-50 hover:opacity-100 hover-bg-soft border border-transparent'
=======
                      : 'opacity-50 hover:opacity-100 hover:bg-white/5 border border-transparent'
>>>>>>> b059916d660855e6ecbbb30e2c0fbe19f4e98993
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

<<<<<<< HEAD
        {/* DÉTAILS */}
=======
        {/* 3. DÉTAILS (Redesign Complet) */}
>>>>>>> b059916d660855e6ecbbb30e2c0fbe19f4e98993
        <div className="space-y-3">
          <label className="text-xs font-bold text-gray-400 uppercase tracking-wider ml-1">
            Détails
          </label>

<<<<<<< HEAD
          {/* DATE */}
          <div className="border border-white/5 rounded-3xl p-3 flex items-center gap-4 transition-colors focus-within:bg-white/10 focus-within:border-white/10">
=======
          {/* LIGNE 1 : DATE */}
          <div className=" border border-white/5 rounded-3xl p-3 flex items-center gap-4 transition-colors focus-within:bg-white/10 focus-within:border-white/10">
>>>>>>> b059916d660855e6ecbbb30e2c0fbe19f4e98993
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

<<<<<<< HEAD
          {/* TITRE */}
          <div className="border border-white/5 rounded-3xl p-3 flex items-center gap-4 transition-colors focus-within:bg-white/10 focus-within:border-white/10">
=======
          {/* LIGNE 2 : TITRE */}
          <div className=" border border-white/5 rounded-3xl p-3 flex items-center gap-4 transition-colors focus-within:bg-white/10 focus-within:border-white/10">
>>>>>>> b059916d660855e6ecbbb30e2c0fbe19f4e98993
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

<<<<<<< HEAD
          {/* NOTE */}
          <div className="border border-white/5 rounded-3xl p-3 flex gap-4 transition-colors focus-within:bg-white/10 focus-within:border-white/10">
=======
          {/* LIGNE 3 : NOTE (NOUVEAU) */}
          <div className=" border border-white/5 rounded-3xl p-3 flex gap-4 transition-colors focus-within:bg-white/10 focus-within:border-white/10">
>>>>>>> b059916d660855e6ecbbb30e2c0fbe19f4e98993
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
<<<<<<< HEAD
              type="button" // 💡 IMPORTANT : Empêche le submit du formulaire
              onClick={handleDeleteClick} // 💡 Ouvre la modale au lieu de faire un confirm() natif
              className="flex items-center justify-center p-4 rounded-[1.3rem] bg-red-500/10 text-red-500 hover:bg-red-500/20 hover:scale-[0.98] transition-all border border-red-500/10"
=======
              onClick={handleDelete}
              className="flex items-center justify-center p-4 rounded-2xl bg-red-500/10 text-red-500 hover:bg-red-500/20 hover:scale-[0.98] transition-all border border-red-500/10"
>>>>>>> b059916d660855e6ecbbb30e2c0fbe19f4e98993
            >
              <Trash2 size={20} />
            </button>
          )}

          <button
            onClick={handleSubmit}
            disabled={loading || !amount}
<<<<<<< HEAD
            className={`flex-1 flex items-center justify-center gap-2 py-4 rounded-3xl font-bold shadow-lg transition-all active:scale-[0.98] ${
=======
            className={`flex-1 flex items-center justify-center gap-2 py-4 rounded-2xl font-bold shadow-lg transition-all active:scale-[0.98] ${
>>>>>>> b059916d660855e6ecbbb30e2c0fbe19f4e98993
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
<<<<<<< HEAD

      {/* 💡 INTÉGRATION DE LA MODALE CONFIRMATION 
        On la place tout à la fin pour qu'elle s'affiche par-dessus le reste (Z-index géré dans le composant Modal).
      */}
      <ConfirmModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={executeDelete}
        title="Supprimer l'opération ?"
        // 💡 LOGIQUE DYNAMIQUE DU MESSAGE :
        message={`Cette action est irréversible.${
          ['Business', 'Invest'].includes(category)
            ? ' Attention : la transaction liée dans la Trésorerie sera également supprimée.'
            : ''
        }`}
        isDanger={true}
      />
=======
>>>>>>> b059916d660855e6ecbbb30e2c0fbe19f4e98993
    </div>
  );
}
