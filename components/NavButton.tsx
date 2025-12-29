import React from 'react';

interface NavButtonProps {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}

export const NavButton: React.FC<NavButtonProps> = ({ active, onClick, icon, label }) => (
  <button 
    onClick={onClick}
    className={`flex flex-col items-center justify-center gap-1.5 transition-all flex-1 ${active ? 'text-indigo-600' : 'text-slate-400 hover:text-slate-600'}`}
    aria-label={label}
    aria-current={active ? 'page' : undefined}
  >
    <div className={`p-2 rounded-xl transition-colors ${active ? 'bg-indigo-50' : 'bg-transparent'}`}>
      {icon}
    </div>
    <span className="text-[9px] font-black uppercase tracking-[0.2em]">{label}</span>
  </button>
);

