import React from 'react';

export default function DashboardGeneral() {
  return (
    <div className="space-y-6 text-white animate-fade-in">
      <h1 className="text-3xl font-bold tracking-tight">Vue d'ensemble</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Cartes temporaires pour voir que ça marche */}
        <div className="p-6 rounded-[2rem] bg-[#111] border border-white/10">
          <h3 className="text-gray-400 font-bold mb-2">Finance</h3>
          <p className="text-2xl font-bold">-- €</p>
        </div>
        <div className="p-6 rounded-[2rem] bg-[#111] border border-white/10">
          <h3 className="text-gray-400 font-bold mb-2">Business</h3>
          <p className="text-2xl font-bold">-- €</p>
        </div>
        <div className="p-6 rounded-[2rem] bg-[#111] border border-white/10">
          <h3 className="text-gray-400 font-bold mb-2">Habitudes</h3>
          <p className="text-2xl font-bold">0 / 5</p>
        </div>
      </div>
    </div>
  );
}
