import React from 'react';
import { motion } from 'framer-motion';
import {
  LayoutGrid,
  Wallet,
  Briefcase,
  TrendingUp,
  User,
  Plus,
  Zap,
} from 'lucide-react';
import { SmartLink } from './SmartLink';
import { UI } from '../../designSystem';

const SidebarLink = ({ icon: Icon, label, path, sectionKey, activePath }) => {
  const isActive =
    path === '/' ? activePath === '/' : activePath.startsWith(path);

  return (
    <SmartLink
      to={path}
      sectionKey={sectionKey}
      className="block w-full outline-none group cursor-pointer relative isolate"
    >
      <div
        className={`relative flex items-center gap-4 px-5 py-3.5 z-10 transition-colors duration-200 ${
          isActive ? 'text-white' : 'text-gray-500 group-hover:text-white'
        }`}
      >
        <Icon
          size={20}
          strokeWidth={isActive ? 2.5 : 2}
          className={`transition-colors duration-200 ${
            isActive ? 'text-indigo-400' : 'group-hover:text-white'
          }`}
        />
        <span className="font-medium text-sm tracking-wide">{label}</span>
      </div>

      {/* Fond Actif Animé */}
      {isActive && (
        <motion.div
          layoutId="sidebar-active-bg"
          className="absolute inset-0 bg-indigo-600/10 border border-indigo-500/20 rounded-2xl shadow-[0_0_20px_rgba(79,70,229,0.15)] z-0"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ type: 'spring', stiffness: 350, damping: 30 }}
        >
          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-indigo-500 rounded-r-full shadow-[0_0_12px_#6366f1]" />
        </motion.div>
      )}

      {/* Hover Effect */}
      {!isActive && (
        <div className="absolute inset-0 rounded-2xl bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-0" />
      )}
    </SmartLink>
  );
};

export default function Sidebar({ activePath }) {
  return (
    <aside
      className={`hidden md:flex fixed left-6 ${UI.layout.topMargin} bottom-6 w-72 z-50 flex-col`}
    >
      <div className="flex-1 flex flex-col px-6 py-8 rounded-[2.5rem] bg-[#0A0A0A]/95 backdrop-blur-2xl border border-white/10 shadow-2xl relative overflow-hidden">
        {/* Glow Top */}
        <div className="absolute top-0 left-0 w-full h-32 bg-indigo-500/5 blur-[60px] pointer-events-none"></div>

        {/* Logo */}
        <div className="flex items-center gap-3 mb-10 pl-2">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/20">
            <Zap size={20} fill="white" />
          </div>
          <span className="font-bold text-xl text-white tracking-tight">
            Nexus<span className="text-indigo-500">OS</span>
          </span>
        </div>

        {/* Links */}
        <div className="space-y-2 flex-1 relative">
          <SidebarLink
            icon={LayoutGrid}
            label="Dashboard"
            path="/"
            activePath={activePath}
          />
          <SidebarLink
            icon={Wallet}
            label="Finance"
            path="/finance"
            sectionKey="finance"
            activePath={activePath}
          />
          <SidebarLink
            icon={Briefcase}
            label="Business"
            path="/business"
            sectionKey="business"
            activePath={activePath}
          />
          <SidebarLink
            icon={TrendingUp}
            label="Investissements"
            path="/invest"
            sectionKey="invest"
            activePath={activePath}
          />
          <SidebarLink
            icon={User}
            label="Personnel"
            path="/personal"
            sectionKey="personal"
            activePath={activePath}
          />
        </div>
      </div>
    </aside>
  );
}
