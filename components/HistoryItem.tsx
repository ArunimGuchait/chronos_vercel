import React from 'react';
import { Trash2 } from 'lucide-react';
import { TaskRecord } from '../types';

interface HistoryItemProps {
  item: TaskRecord;
  formatTime: (s: number) => string;
  onDelete: () => void;
}

export const HistoryItem: React.FC<HistoryItemProps> = ({ item, formatTime, onDelete }) => (
  <div className="bg-white p-5 rounded-[1.5rem] border border-slate-200 shadow-sm flex justify-between items-center group relative hover:border-slate-300 transition-all">
    <div className="space-y-1.5 overflow-hidden pr-2 flex-grow">
      <h5 className="font-black text-slate-800 truncate text-sm">{item.taskName}</h5>
      <div className="flex items-center gap-3">
        <span className="text-[10px] text-slate-400 tabular-nums font-bold">
          {new Date(item.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </span>
        <div className="flex gap-1.5 overflow-hidden">
          {item.tags.map(t => (
            <span key={t} className="text-[9px] bg-slate-50 text-slate-500 px-2 py-0.5 rounded-lg lowercase font-black border border-slate-100">#{t}</span>
          ))}
        </div>
      </div>
    </div>
    
    <div className="flex items-center gap-4 flex-shrink-0 ml-4">
      <div className="text-right">
        <div className="text-base font-black tabular-nums text-slate-900">{formatTime(item.duration)}</div>
        <div className="text-[9px] text-slate-400 font-black uppercase tracking-tighter">{item.date}</div>
      </div>
      <button 
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onDelete();
        }}
        className="p-3 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all active:scale-75 cursor-pointer z-10 outline-none focus:ring-2 focus:ring-red-500/20"
        aria-label="Delete Session"
      >
        <Trash2 size={20} className="pointer-events-none" />
      </button>
    </div>
  </div>
);

