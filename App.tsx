
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Play, 
  Square, 
  History as HistoryIcon, 
  Download, 
  Plus, 
  Smartphone,
  Calendar,
  X,
  Trash2,
  TrendingUp,
  Activity,
  ChevronDown,
  Layout,
  Briefcase
} from 'lucide-react';
import { TaskRecord } from './types';
import { 
  getStoredWorkspaces,
  saveWorkspaceList,
  saveWorkspaceData,
  loadWorkspaceData,
  deleteWorkspaceData,
  convertToCSV, 
  downloadCSV, 
  getMonthKey 
} from './services/storageService';

const App: React.FC = () => {
  const [activeTask, setActiveTask] = useState<TaskRecord | null>(null);
  const [history, setHistory] = useState<TaskRecord[]>([]);
  
  // Workspace State
  const [workspace, setWorkspace] = useState<string | null>(null);
  const [workspaces, setWorkspaces] = useState<string[]>([]);
  
  const [lastExportedMonth, setLastExportedMonth] = useState<string | null>(null);
  const [taskInput, setTaskInput] = useState('');
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [view, setView] = useState<'timer' | 'history' | 'guide'>('timer');
  const [elapsed, setElapsed] = useState(0);

  // Modals
  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; taskId: string | null; taskName: string | null }>({
    isOpen: false,
    taskId: null,
    taskName: null
  });
  
  const [workspaceDeleteModal, setWorkspaceDeleteModal] = useState<{ isOpen: boolean; name: string | null }>({
    isOpen: false,
    name: null
  });

  const [manageModalOpen, setManageModalOpen] = useState(false);
  const [newWorkspaceInput, setNewWorkspaceInput] = useState('');

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Initialize: Load list of workspaces
  useEffect(() => {
    const storedWorkspaces = getStoredWorkspaces();
    setWorkspaces(storedWorkspaces);
  }, []);

  // Load Workspace Data when workspace changes
  useEffect(() => {
    if (workspace) {
      const saved = loadWorkspaceData(workspace);
      if (saved) {
        setHistory(saved.history || []);
        setLastExportedMonth(saved.lastExportedMonth || null);
        if (saved.activeTask) {
          setActiveTask(saved.activeTask);
          const diff = Math.floor((Date.now() - saved.activeTask.startTime) / 1000);
          setElapsed(diff);
        } else {
          setActiveTask(null);
          setElapsed(0);
        }
      } else {
        // New workspace defaults
        setHistory([]);
        setActiveTask(null);
        setElapsed(0);
        setLastExportedMonth(null);
      }
    }
  }, [workspace]);

  // Persist current workspace data
  useEffect(() => {
    if (workspace) {
      saveWorkspaceData(workspace, {
        activeTask,
        history,
        lastExportedMonth
      });
    }
  }, [activeTask, history, workspace, lastExportedMonth]);

  // Handle monthly CSV export prompts
  useEffect(() => {
    if (!workspace) return;
    const currentMonth = getMonthKey();
    if (history.length > 0 && lastExportedMonth && lastExportedMonth !== currentMonth) {
      const prevMonthRecords = history.filter(r => r.date.startsWith(lastExportedMonth));
      if (prevMonthRecords.length > 0) {
        // We use a small timeout to ensure UI is ready if switching workspaces
        setTimeout(() => {
          const confirmExport = window.confirm(`New month detected in "${workspace}" (${currentMonth})! Export records for ${lastExportedMonth} now?`);
          if (confirmExport) {
            const csvContent = convertToCSV(prevMonthRecords);
            downloadCSV(csvContent, `tasks_${workspace}_${lastExportedMonth}.csv`);
            setLastExportedMonth(currentMonth);
          }
        }, 500);
      } else {
        setLastExportedMonth(currentMonth);
      }
    } else if (!lastExportedMonth && history.length > 0) {
      setLastExportedMonth(currentMonth);
    }
  }, [history, lastExportedMonth, workspace]);

  // Timer logic for active session
  useEffect(() => {
    if (activeTask) {
      timerRef.current = setInterval(() => {
        setElapsed(prev => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
      setElapsed(0);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [activeTask]);

  // Calculate chart data for history view (Trailing 7 Days)
  const chartData = useMemo(() => {
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      return d.toISOString().split('T')[0];
    });

    const dailyStats = last7Days.map(date => {
      const dayTotal = history
        .filter(r => r.date === date)
        .reduce((sum, r) => sum + r.duration, 0);
      
      const dayName = new Date(date).toLocaleDateString('en-US', { weekday: 'short' });
      return { date, dayName, duration: dayTotal };
    });

    const maxDuration = Math.max(...dailyStats.map(d => d.duration), 1);
    return { dailyStats, maxDuration };
  }, [history]);

  const createWorkspace = (name: string) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    if (workspaces.includes(trimmed)) {
      alert('Workspace already exists');
      return;
    }
    const newList = [...workspaces, trimmed];
    setWorkspaces(newList);
    saveWorkspaceList(newList);
    setWorkspace(trimmed); // Auto switch
    setManageModalOpen(false);
    setNewWorkspaceInput('');
  };

  const initiateWorkspaceDelete = (name: string) => {
    setWorkspaceDeleteModal({ isOpen: true, name });
  };

  const confirmWorkspaceDelete = () => {
    const name = workspaceDeleteModal.name;
    if (!name) return;

    // Use functional update to ensure we have the latest list
    setWorkspaces(prev => {
      const newList = prev.filter(w => w !== name);
      saveWorkspaceList(newList);
      return newList;
    });
    
    deleteWorkspaceData(name);

    if (workspace === name) {
      setWorkspace(null); // Go back to landing
      setManageModalOpen(false);
    }
    setWorkspaceDeleteModal({ isOpen: false, name: null });
  };

  const switchWorkspace = (name: string) => {
    setWorkspace(name);
    setManageModalOpen(false);
  };

  const startTask = () => {
    if (!taskInput.trim()) return;
    const now = Date.now();
    const uniqueId = typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
      ? crypto.randomUUID() 
      : `task-${now}-${Math.random().toString(36).substring(2, 9)}`;

    const newTask: TaskRecord = {
      id: uniqueId,
      taskName: taskInput,
      startTime: now,
      endTime: null,
      duration: 0,
      tags: [...tags],
      date: new Date().toISOString().split('T')[0]
    };
    setActiveTask(newTask);
    setTaskInput('');
    setTags([]);
  };

  const stopTask = () => {
    if (!activeTask) return;
    const now = Date.now();
    const completedTask: TaskRecord = {
      ...activeTask,
      endTime: now,
      duration: elapsed
    };
    setHistory(prev => [completedTask, ...prev]);
    setActiveTask(null);
    setElapsed(0);
  };

  const initiateDelete = (id: string, taskName: string) => {
    setDeleteModal({ isOpen: true, taskId: id, taskName });
  };

  const confirmDelete = () => {
    if (deleteModal.taskId) {
      setHistory(prev => prev.filter(item => item.id !== deleteModal.taskId));
      setDeleteModal({ isOpen: false, taskId: null, taskName: null });
    }
  };

  const addTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()]);
      setTagInput('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter(t => t !== tagToRemove));
  };

  const exportCurrentMonth = () => {
    const monthKey = getMonthKey();
    const currentMonthRecords = history.filter(r => r.date.startsWith(monthKey));
    if (currentMonthRecords.length === 0) {
      alert("No records found for this month yet.");
      return;
    }
    const csvContent = convertToCSV(currentMonthRecords);
    downloadCSV(csvContent, `tasks_${workspace}_${monthKey}.csv`);
    setLastExportedMonth(monthKey);
  };

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return [h, m, s].map(v => v.toString().padStart(2, '0')).join(':');
  };

  // INITIALIZATION / LANDING PAGE
  if (!workspace) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-slate-950 text-slate-100 font-mono overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(79,70,229,0.1),transparent)] pointer-events-none" />
        <div className="w-full max-w-md space-y-10 animate-in fade-in zoom-in-95 duration-700 relative z-10">
          <div className="text-center space-y-4">
            <h1 className="text-6xl font-black tracking-tighter text-indigo-500 drop-shadow-[0_0_15px_rgba(99,102,241,0.3)]">CHRONOS</h1>
            <div className="space-y-1">
              <p className="text-xl font-bold text-slate-100 tracking-tight">Task Tracker</p>
              <p className="text-slate-500 text-[10px] uppercase tracking-[0.3em] font-black">Multi-Workspace Architecture</p>
            </div>
          </div>
          
          <div className="space-y-6">
            {workspaces.length > 0 && (
              <div className="space-y-3 max-h-64 overflow-y-auto pr-2 custom-scrollbar">
                <label className="text-[10px] uppercase tracking-[0.2em] text-slate-500 font-black ml-1">Resume Workspace</label>
                {workspaces.map(ws => (
                  <button 
                    key={ws}
                    onClick={() => setWorkspace(ws)}
                    className="w-full p-5 bg-slate-900 border border-slate-800 hover:border-indigo-500/50 hover:bg-slate-800 text-left rounded-2xl transition-all group flex items-center justify-between"
                  >
                    <span className="font-bold text-lg">{ws}</span>
                    <Play size={16} className="text-indigo-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </button>
                ))}
              </div>
            )}

            <div className="bg-slate-900 p-6 rounded-[2.5rem] border border-slate-800 shadow-2xl space-y-4">
              <label className="text-[10px] uppercase tracking-[0.2em] text-indigo-400 font-black ml-1 flex items-center gap-2">
                <Plus size={12} /> New Workspace
              </label>
              <div className="flex gap-2">
                <input 
                  type="text" 
                  value={newWorkspaceInput}
                  onChange={(e) => setNewWorkspaceInput(e.target.value)}
                  placeholder="Name..."
                  className="w-full bg-slate-800 text-white border border-slate-700 rounded-xl p-4 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all placeholder-slate-600 font-bold"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') createWorkspace(newWorkspaceInput);
                  }}
                />
                <button 
                  onClick={() => createWorkspace(newWorkspaceInput)}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white p-4 rounded-xl transition-all active:scale-95"
                >
                  <Plus size={24} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // MAIN APP INTERFACE
  return (
    <div className="min-h-screen pb-24 max-w-lg mx-auto bg-slate-50 shadow-2xl relative font-mono text-slate-900 overflow-x-hidden">
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-xl border-b border-slate-200 p-5 flex justify-between items-center">
        <div 
          onClick={() => setManageModalOpen(true)}
          className="cursor-pointer group select-none"
        >
          <h2 className="text-xl font-black text-indigo-600 leading-none flex items-center gap-2">
            CHRONOS 
            <ChevronDown size={16} className="text-slate-300 group-hover:text-indigo-600 transition-colors" />
          </h2>
          <span className="text-[10px] text-slate-400 uppercase tracking-widest font-black mt-1 block group-hover:text-slate-600 transition-colors">
            {workspace}
          </span>
        </div>
        <button 
          onClick={exportCurrentMonth}
          className="p-3 bg-slate-100 rounded-2xl hover:bg-slate-200 transition-colors text-slate-600 active:scale-95"
          title="Export Month"
        >
          <Download size={20} />
        </button>
      </header>

      <main className="p-4 space-y-6">
        {view === 'timer' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-top-4 duration-300">
            {activeTask ? (
              <div className="bg-indigo-600 p-8 rounded-[2.5rem] shadow-2xl text-white space-y-6 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full -mr-24 -mt-24 blur-3xl animate-pulse" />
                <div className="relative">
                  <span className="text-[10px] uppercase tracking-[0.2em] font-black opacity-60">Active Session</span>
                  <h3 className="text-2xl font-black truncate mt-1">{activeTask.taskName}</h3>
                  <div className="flex flex-wrap gap-2 mt-3">
                    {activeTask.tags.map(tag => (
                      <span key={tag} className="text-[9px] px-2 py-1 bg-white/20 rounded-lg font-bold">#{tag}</span>
                    ))}
                  </div>
                </div>
                <div className="text-7xl font-black tracking-tighter tabular-nums py-6 text-center">
                  {formatTime(elapsed)}
                </div>
                <button 
                  onClick={stopTask}
                  className="w-full py-5 bg-white text-indigo-600 font-black rounded-2xl flex items-center justify-center gap-2 hover:bg-slate-50 shadow-xl active:scale-95 transition-all"
                >
                  <Square fill="currentColor" size={20} /> STOP TRACKING
                </button>
              </div>
            ) : (
              <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm space-y-5">
                <div className="space-y-2">
                  <label className="text-[10px] uppercase tracking-widest text-slate-400 font-black ml-1">Current Objective</label>
                  <input 
                    type="text" 
                    value={taskInput}
                    onChange={(e) => setTaskInput(e.target.value)}
                    placeholder="What are you doing?"
                    className="w-full text-lg font-bold p-4 bg-slate-50 border border-slate-100 rounded-2xl text-slate-900 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all placeholder-slate-300"
                  />
                </div>
                
                <div className="space-y-2">
                  <label className="text-[10px] uppercase tracking-widest text-slate-400 font-black ml-1">Categories / Tags</label>
                  <div className="flex flex-wrap gap-2 min-h-[52px] p-3 bg-slate-50 border border-slate-100 rounded-2xl">
                    {tags.map(tag => (
                      <span key={tag} onClick={() => removeTag(tag)} className="group cursor-pointer inline-flex items-center gap-1.5 text-[11px] px-3 py-1.5 bg-white border border-slate-200 text-slate-600 rounded-xl hover:bg-red-50 hover:text-red-500 hover:border-red-100 transition-all font-bold">
                        #{tag} <X size={12} className="text-slate-300 group-hover:text-red-500" />
                      </span>
                    ))}
                    <div className="flex items-center gap-2 px-1">
                      <input 
                        type="text"
                        value={tagInput}
                        onChange={(e) => setTagInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && addTag()}
                        placeholder="Tag..."
                        className="text-[11px] bg-transparent outline-none w-20 text-slate-900 font-bold"
                      />
                      <button onClick={addTag} className="text-indigo-600 p-1.5 hover:bg-white rounded-lg transition-colors"><Plus size={16}/></button>
                    </div>
                  </div>
                </div>

                <button 
                  onClick={startTask}
                  disabled={!taskInput.trim()}
                  className="w-full py-5 bg-slate-900 text-white font-black rounded-2xl flex items-center justify-center gap-2 hover:bg-slate-800 disabled:opacity-20 shadow-xl active:scale-95 transition-all mt-4"
                >
                  <Play fill="currentColor" size={20} /> START TRACKING
                </button>
              </div>
            )}

            <div className="space-y-4">
              <h4 className="text-[10px] uppercase tracking-widest text-slate-400 font-black px-2">Recent Activities</h4>
              {history.length === 0 ? (
                <div className="p-12 text-center text-slate-300 border-2 border-dashed border-slate-200 rounded-[2rem]">
                  No sessions recorded
                </div>
              ) : (
                <div className="space-y-4">
                  {history.slice(0, 5).map(item => (
                    <HistoryItem 
                      key={item.id} 
                      item={item} 
                      formatTime={formatTime} 
                      onDelete={() => initiateDelete(item.id, item.taskName)}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {view === 'history' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
            <div className="flex justify-between items-center px-1">
              <h3 className="text-xl font-black">Full Archive</h3>
              <button 
                onClick={exportCurrentMonth}
                className="text-indigo-600 text-[10px] font-black uppercase flex items-center gap-2 bg-indigo-50 px-3 py-2 rounded-xl active:scale-95"
              >
                <Download size={14} /> EXPORT CSV
              </button>
            </div>

            {/* Trailing 7 Days Visualization */}
            <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-indigo-600">
                  <TrendingUp size={16} />
                  <span className="text-[10px] font-black uppercase tracking-widest">7-Day Focus</span>
                </div>
                <span className="text-[10px] text-slate-400 font-bold tabular-nums">
                  {Math.round(chartData.dailyStats.reduce((a, b) => a + b.duration, 0) / 3600)}h total
                </span>
              </div>
              
              <div className="flex items-end justify-between h-32 gap-2 px-2 pt-4">
                {chartData.dailyStats.map((day) => (
                  <div key={day.date} className="flex flex-col items-center flex-1 group relative">
                    <div 
                      className="w-full bg-slate-50 group-hover:bg-slate-100 rounded-t-lg transition-all relative"
                      style={{ height: '100%' }}
                    >
                      <div 
                        className="absolute bottom-0 w-full bg-indigo-600 rounded-t-lg transition-all duration-700 ease-out shadow-[0_0_10px_rgba(79,70,229,0.3)]"
                        style={{ height: `${(day.duration / chartData.maxDuration) * 100}%` }}
                      >
                        {day.duration > 0 && (
                          <div className="opacity-0 group-hover:opacity-100 absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[8px] font-black px-1.5 py-1 rounded whitespace-nowrap z-20 transition-opacity">
                            {Math.round(day.duration / 60)}m
                          </div>
                        )}
                      </div>
                    </div>
                    <span className="text-[9px] font-black text-slate-400 mt-3 uppercase">{day.dayName}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              {history.map(item => (
                <HistoryItem 
                  key={item.id} 
                  item={item} 
                  formatTime={formatTime} 
                  onDelete={() => initiateDelete(item.id, item.taskName)}
                />
              ))}
              {history.length === 0 && (
                <div className="text-center py-24 text-slate-300">
                  <HistoryIcon size={64} className="mx-auto mb-6 opacity-10" />
                  <p className="font-bold">No history available</p>
                </div>
              )}
            </div>
          </div>
        )}

        {view === 'guide' && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <h3 className="text-xl font-black">App Guide</h3>
            <div className="bg-white p-8 rounded-[2rem] border border-slate-200 shadow-sm space-y-6 text-slate-900">
              <div className="flex gap-5 items-start">
                <div className="p-4 bg-indigo-50 rounded-2xl text-indigo-600">
                  <Smartphone size={28} />
                </div>
                <div className="space-y-2">
                  <h4 className="font-black">Android PWA Installation</h4>
                  <p className="text-xs text-slate-500 leading-relaxed font-bold">
                    Launch Chrome and tap <span className="text-slate-900">Add to Home Screen</span>. Chronos will run as a standalone app with persistent storage and native behavior.
                  </p>
                </div>
              </div>
              
              <div className="flex gap-5 items-start pt-6 border-t border-slate-100">
                <div className="p-4 bg-slate-50 rounded-2xl text-slate-600">
                  <Briefcase size={28} />
                </div>
                <div className="space-y-2">
                  <h4 className="font-black">Workspaces</h4>
                  <p className="text-xs text-slate-500 leading-relaxed font-bold">
                    Click the workspace name in the header to switch contexts or create new workspaces. Each workspace maintains its own history and export data.
                  </p>
                </div>
              </div>

              <div className="flex gap-5 items-start pt-6 border-t border-slate-100">
                <div className="p-4 bg-slate-50 rounded-2xl text-slate-600">
                  <Calendar size={28} />
                </div>
                <div className="space-y-2">
                  <h4 className="font-black">Monthly Maintenance</h4>
                  <p className="text-xs text-slate-500 leading-relaxed font-bold">
                    Chronos will detect month changes and prompt you to export your data. We recommend exporting to your device storage to keep long-term productivity records.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Delete Confirmation Modal (Tasks) */}
      {deleteModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity" 
            onClick={() => setDeleteModal({ ...deleteModal, isOpen: false })}
          />
          <div className="relative bg-white rounded-[2rem] p-6 w-full max-w-sm shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 duration-200 space-y-4">
            <div className="w-12 h-12 bg-red-50 text-red-500 rounded-2xl flex items-center justify-center mx-auto mb-2">
              <Trash2 size={24} />
            </div>
            <div className="text-center space-y-2">
              <h3 className="text-lg font-black text-slate-900">Delete Activity?</h3>
              <p className="text-xs text-slate-500 font-bold leading-relaxed px-4">
                Are you sure you want to delete <span className="text-slate-800">"{deleteModal.taskName}"</span>? 
                This action cannot be undone.
              </p>
            </div>
            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setDeleteModal({ ...deleteModal, isOpen: false })}
                className="flex-1 py-3 bg-slate-100 text-slate-600 font-black rounded-xl hover:bg-slate-200 transition-colors"
              >
                CANCEL
              </button>
              <button
                onClick={confirmDelete}
                className="flex-1 py-3 bg-red-500 text-white font-black rounded-xl hover:bg-red-600 transition-colors shadow-lg shadow-red-500/20"
              >
                DELETE
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Workspace Modal (New) */}
      {workspaceDeleteModal.isOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity" 
            onClick={() => setWorkspaceDeleteModal({ ...workspaceDeleteModal, isOpen: false })}
          />
          <div className="relative bg-white rounded-[2rem] p-6 w-full max-w-sm shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 duration-200 space-y-4">
            <div className="w-12 h-12 bg-red-50 text-red-500 rounded-2xl flex items-center justify-center mx-auto mb-2">
              <Briefcase size={24} />
            </div>
            <div className="text-center space-y-2">
              <h3 className="text-lg font-black text-slate-900">Delete Workspace?</h3>
              <p className="text-xs text-slate-500 font-bold leading-relaxed px-4">
                Permanently delete <span className="text-slate-800">"{workspaceDeleteModal.name}"</span> and ALL history?
              </p>
            </div>
            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setWorkspaceDeleteModal({ ...workspaceDeleteModal, isOpen: false })}
                className="flex-1 py-3 bg-slate-100 text-slate-600 font-black rounded-xl hover:bg-slate-200 transition-colors"
              >
                CANCEL
              </button>
              <button
                onClick={confirmWorkspaceDelete}
                className="flex-1 py-3 bg-red-500 text-white font-black rounded-xl hover:bg-red-600 transition-colors shadow-lg shadow-red-500/20"
              >
                DELETE
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Workspace Manager Modal */}
      {manageModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity" 
            onClick={() => setManageModalOpen(false)}
          />
          <div className="relative bg-white rounded-[2rem] p-6 w-full max-w-sm shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 duration-200 space-y-6 flex flex-col max-h-[80vh]">
            <div className="flex justify-between items-center pb-2 border-b border-slate-100">
              <h3 className="text-lg font-black text-slate-900">Workspaces</h3>
              <button onClick={() => setManageModalOpen(false)} className="p-2 text-slate-400 hover:text-slate-600 bg-slate-50 rounded-xl">
                <X size={16} />
              </button>
            </div>

            <div className="space-y-3 overflow-y-auto flex-1 custom-scrollbar">
              {workspaces.map(ws => (
                <div key={ws} className={`flex items-center gap-2 p-1 rounded-xl transition-all ${workspace === ws ? 'bg-indigo-50 border border-indigo-100' : 'hover:bg-slate-50 border border-transparent'}`}>
                  <button 
                    onClick={() => switchWorkspace(ws)}
                    className="flex-grow text-left p-3 font-bold text-slate-800 flex items-center gap-2"
                  >
                    <Briefcase size={16} className={workspace === ws ? 'text-indigo-600' : 'text-slate-400'} />
                    {ws}
                  </button>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      initiateWorkspaceDelete(ws);
                    }}
                    className="p-3 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>

            <div className="pt-4 border-t border-slate-100 space-y-3">
               <label className="text-[10px] uppercase tracking-[0.2em] text-slate-400 font-black ml-1">Create New</label>
               <div className="flex gap-2">
                 <input 
                   type="text" 
                   value={newWorkspaceInput}
                   onChange={(e) => setNewWorkspaceInput(e.target.value)}
                   placeholder="Workspace name..."
                   className="w-full bg-slate-50 text-slate-900 border border-slate-200 rounded-xl p-3 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all placeholder-slate-400 text-sm font-bold"
                   onKeyDown={(e) => {
                     if (e.key === 'Enter') createWorkspace(newWorkspaceInput);
                   }}
                 />
                 <button 
                   onClick={() => createWorkspace(newWorkspaceInput)}
                   className="bg-slate-900 hover:bg-indigo-600 text-white p-3 rounded-xl transition-all active:scale-95"
                 >
                   <Plus size={20} />
                 </button>
               </div>
            </div>
          </div>
        </div>
      )}

      <nav className="fixed bottom-0 left-0 right-0 max-w-lg mx-auto bg-white/95 backdrop-blur-2xl border-t border-slate-200 h-20 flex items-center justify-around px-6 z-40 shadow-[0_-10px_30px_-15px_rgba(0,0,0,0.1)]">
        <NavButton active={view === 'timer'} onClick={() => setView('timer')} icon={<Play size={22} />} label="Track" />
        <NavButton active={view === 'history'} onClick={() => setView('history')} icon={<HistoryIcon size={22} />} label="Logs" />
        <NavButton active={view === 'guide'} onClick={() => setView('guide')} icon={<Smartphone size={22} />} label="App" />
      </nav>
    </div>
  );
};

// Robust HistoryItem with guaranteed click handling
const HistoryItem: React.FC<{ item: TaskRecord, formatTime: (s: number) => string, onDelete: () => void }> = ({ item, formatTime, onDelete }) => (
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

const NavButton: React.FC<{ active: boolean, onClick: () => void, icon: React.ReactNode, label: string }> = ({ active, onClick, icon, label }) => (
  <button 
    onClick={onClick}
    className={`flex flex-col items-center justify-center gap-1.5 transition-all flex-1 ${active ? 'text-indigo-600' : 'text-slate-400 hover:text-slate-600'}`}
  >
    <div className={`p-2 rounded-xl transition-colors ${active ? 'bg-indigo-50' : 'bg-transparent'}`}>
      {icon}
    </div>
    <span className="text-[9px] font-black uppercase tracking-[0.2em]">{label}</span>
  </button>
);

export default App;
