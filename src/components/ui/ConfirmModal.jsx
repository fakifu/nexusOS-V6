import React from 'react';
import Modal from './Modal';
import { AlertTriangle } from 'lucide-react';

export default function ConfirmModal({ isOpen, onClose, onConfirm, title, message, isDanger = false }) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} type="alert">
      <div className="p-6">
        <div className={`w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4 border ${
          isDanger ? 'bg-red-500/10 text-red-500 border-red-500/20' : 'bg-indigo-500/10 text-indigo-500 border-indigo-500/20'
        }`}>
          <AlertTriangle size={28} />
        </div>
        <h3 className="text-xl font-bold text-white mb-2">{title}</h3>
        <p className="text-gray-400 text-sm mb-6 leading-relaxed">{message}</p>
        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 py-3 rounded-xl border border-white/10 text-gray-300 font-bold hover:bg-white/5 transition">
            Annuler
          </button>
          <button onClick={() => { onConfirm(); onClose(); }} className={`flex-1 py-3 rounded-xl font-bold text-white shadow-lg transition transform active:scale-95 ${
            isDanger ? 'bg-red-600 hover:bg-red-500 shadow-red-900/20' : 'bg-indigo-600'
          }`}>
            Confirmer
          </button>
        </div>
      </div>
    </Modal>
  );
}