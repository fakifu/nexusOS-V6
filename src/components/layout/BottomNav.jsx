import React from 'react';
import { motion } from 'framer-motion';
import { LayoutGrid, Wallet, Briefcase, User, Plus } from 'lucide-react';
import { SmartLink } from './SmartLink';

const MobileNavBtn = ({ icon: Icon, path, sectionKey, active }) => (
  <SmartLink
    to={path}
    sectionKey={sectionKey}
    className="relative flex-1 flex flex-col items-center justify-center h-full"
  >
    <div
      className={`flex flex-col items-center justify-center w-12 h-12 transition-all duration-300 ${
        active ? 'text-indigo-400' : 'text-gray-500 hover:text-gray-300'
      }`}
    >
      <Icon size={24} strokeWidth={active ? 2.5 : 2} />
      {active && (
        <motion.div
          layoutId="mobile-indicator"
          className="absolute bottom-1 w-1 h-1 bg-indigo-500 rounded-full shadow-[0_0_8px_#6366f1]"
          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
        />
      )}
    </div>
  </SmartLink>
);

export default function BottomNav({ activePath }) {
  return (
    <nav className="md:hidden fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-full max-w-[350px] px-4 pointer-events-none">
      <div className="flex items-center justify-between px-4 py-3 rounded-[2rem] bg-white/[0.04] backdrop-blur-xl border-t border-white/10 shadow-[0_8px_32px_0_rgba(0,0,0,0.8)] pointer-events-auto">
        <MobileNavBtn icon={LayoutGrid} path="/" active={activePath === '/'} />
        <MobileNavBtn
          icon={Wallet}
          path="/finance"
          sectionKey="finance"
          active={activePath.startsWith('/finance')}
        />

        <MobileNavBtn
          icon={Briefcase}
          path="/business"
          sectionKey="business"
          active={activePath.startsWith('/business')}
        />
        <MobileNavBtn
          icon={User}
          path="/personal"
          sectionKey="personal"
          active={activePath.startsWith('/personal')}
        />
      </div>
    </nav>
  );
}
