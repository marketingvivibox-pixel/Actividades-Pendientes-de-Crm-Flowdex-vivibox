import React, { useState, useMemo, useEffect } from 'react';
import { motion, useScroll, useSpring, useTransform, AnimatePresence } from 'motion/react';
import { CRM_TASKS_DATA, FOCUS_DEFINITIONS } from './data/crmTasksData';
import { CRMTask, FunctionalFocus, ConnectedSpreadsheet } from './types';
import {
  getStoredConnectedSheet,
  setStoredConnectedSheet,
  pushTasksToSpreadsheet,
} from './lib/googleSheetsService';
import { MeetingHeader } from './components/MeetingHeader';
import { ExecutiveMetrics } from './components/ExecutiveMetrics';
import { SemanticFilterBar, FilterStatus, SortOption, ViewMode } from './components/SemanticFilterBar';
import { TaskCard } from './components/TaskCard';
import { MatrixTableView } from './components/MatrixTableView';
import { GravitySpheresCanvas } from './components/GravitySpheresCanvas';
import { GravitySpheres3D } from './components/GravitySpheres3D';
import { TaskEditModal } from './components/TaskEditModal';
import { TaskDetailModal } from './components/TaskDetailModal';
import { SemanticLegendModal } from './components/SemanticLegendModal';
import { ExecutiveReportModal } from './components/ExecutiveReportModal';
import { GoogleSheetsModal } from './components/GoogleSheetsModal';
import { AlertCircle, ArrowUp, ChevronsUpDown, CheckCircle2, ShieldCheck, Sparkles, Plus } from 'lucide-react';

const STORAGE_KEY = 'crm_whatsapp_matrix_states_v3';
const TASKS_STORAGE_KEY = 'crm_whatsapp_tasks_items_v2';

export default function App() {
  // Scroll animations & progress
  const { scrollYProgress, scrollY } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001,
  });

  // Parallax subtle shifts for organic sand background blobs
  const bgY1 = useTransform(scrollYProgress, [0, 1], [0, -140]);
  const bgY2 = useTransform(scrollYProgress, [0, 1], [0, 120]);

  const [showScrollNav, setShowScrollNav] = useState(false);
  const [scrollPercent, setScrollPercent] = useState(0);

  useEffect(() => {
    const unsubY = scrollY.on('change', (latest) => {
      setShowScrollNav(latest > 280);
    });
    const unsubProg = scrollYProgress.on('change', (latest) => {
      setScrollPercent(Math.round(latest * 100));
    });
    return () => {
      unsubY();
      unsubProg();
    };
  }, [scrollY, scrollYProgress]);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // State to expand or collapse all cards simultaneously
  const [allExpanded, setAllExpanded] = useState<boolean>(false);

  const handleToggleAllExpanded = () => {
    setAllExpanded((prev) => !prev);
  };

  // Dynamic Tasks State (permits modifying parameters, observations, priority, adding new tasks for the meeting)
  const [tasks, setTasks] = useState<CRMTask[]>(() => {
    try {
      const saved = localStorage.getItem(TASKS_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch {
      // ignore
    }
    return CRM_TASKS_DATA;
  });

  const [isSaving, setIsSaving] = useState(false);

  // Initialize toggle states: tickets #16, #17, #18 are 'Cerrado' by default, 1-15 are active
  const [taskStates, setTaskStates] = useState<Record<number, boolean>>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch {
      // ignore
    }
    const initial: Record<number, boolean> = {};
    CRM_TASKS_DATA.forEach((task) => {
      initial[task.id] = task.estado !== 'Cerrado';
    });
    return initial;
  });

  // Persistent Server Synchronization (works across multiple accounts, devices and browsers)
  const saveTasksToServer = async (targetTasks: CRMTask[], targetStates: Record<number, boolean>) => {
    setIsSaving(true);
    try {
      localStorage.setItem(TASKS_STORAGE_KEY, JSON.stringify(targetTasks));
      localStorage.setItem(STORAGE_KEY, JSON.stringify(targetStates));
      await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tasks: targetTasks,
          taskStates: targetStates,
        }),
      });
    } catch (err) {
      console.warn('Backend tasks persistence warning:', err);
    } finally {
      setIsSaving(false);
    }
  };

  // Initial load from persistent server storage + real-time interval polling
  useEffect(() => {
    let isMounted = true;
    const fetchServerTasks = async () => {
      try {
        const res = await fetch('/api/tasks');
        if (res.ok) {
          const data = await res.json();
          if (data.success && Array.isArray(data.tasks) && data.tasks.length > 0 && isMounted) {
            setTasks(data.tasks);
            if (data.taskStates && Object.keys(data.taskStates).length > 0) {
              setTaskStates(data.taskStates);
            }
            try {
              localStorage.setItem(TASKS_STORAGE_KEY, JSON.stringify(data.tasks));
              if (data.taskStates) {
                localStorage.setItem(STORAGE_KEY, JSON.stringify(data.taskStates));
              }
            } catch {}
          }
        }
      } catch (err) {
        console.warn('Could not fetch server tasks on load:', err);
      }
    };

    fetchServerTasks();
    const interval = setInterval(fetchServerTasks, 10000);
    window.addEventListener('focus', fetchServerTasks);

    return () => {
      isMounted = false;
      clearInterval(interval);
      window.removeEventListener('focus', fetchServerTasks);
    };
  }, []);

  // Save tasks to localStorage when modified
  useEffect(() => {
    try {
      localStorage.setItem(TASKS_STORAGE_KEY, JSON.stringify(tasks));
    } catch {
      // ignore
    }
  }, [tasks]);

  // Save to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(taskStates));
    } catch {
      // ignore
    }
  }, [taskStates]);

  // Filtering & Sorting State
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<FilterStatus>('all');
  const [sortOption, setSortOption] = useState<SortOption>('manual');
  const [viewMode, setViewMode] = useState<ViewMode>('3d');
  const [selectedFocus, setSelectedFocus] = useState<FunctionalFocus | 'all'>('all');
  const [selectedResponsible, setSelectedResponsible] = useState('all');

  // Modals & Detail/Edit Drawer State
  const [isLegendOpen, setIsLegendOpen] = useState(false);
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [isSheetsOpen, setIsSheetsOpen] = useState(false);
  const [selectedDetailTask, setSelectedDetailTask] = useState<CRMTask | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState<boolean>(false);
  const [taskToEdit, setTaskToEdit] = useState<CRMTask | null>(null);

  // Connected Spreadsheet for Real-Time Synchronization
  const [connectedSheet, setConnectedSheet] = useState<ConnectedSpreadsheet | null>(() => {
    return getStoredConnectedSheet();
  });
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncToast, setSyncToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  const showSyncToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setSyncToast({ message, type });
    setTimeout(() => {
      setSyncToast((cur) => (cur?.message === message ? null : cur));
    }, 4000);
  };

  const handleConnectedSheetChange = (sheet: ConnectedSpreadsheet | null) => {
    setConnectedSheet(sheet);
    setStoredConnectedSheet(sheet);
    if (sheet) {
      showSyncToast(`Hoja "${sheet.spreadsheetTitle}" vinculada para sincronización continua.`, 'success');
    } else {
      showSyncToast('Hoja de cálculo desvinculada de la sincronización.', 'info');
    }
  };

  // Push latest CRM state to connected spreadsheet
  const triggerSyncToGoogleSheets = async (targetTasks = tasks, targetStates = taskStates): Promise<void> => {
    if (!connectedSheet) return;
    setIsSyncing(true);
    try {
      const result = await pushTasksToSpreadsheet(
        connectedSheet.spreadsheetId,
        connectedSheet.sheetTabName,
        targetTasks,
        targetStates
      );
      const updated: ConnectedSpreadsheet = {
        ...connectedSheet,
        lastSyncedAt: result.timestamp,
      };
      setConnectedSheet(updated);
      setStoredConnectedSheet(updated);
      showSyncToast(`Sincronizado con Google Sheets (${targetTasks.length} pendientes actualizados).`, 'success');
    } catch (err: any) {
      console.error('Error auto-syncing to Google Sheets:', err);
      showSyncToast(err?.message || 'No se pudo sincronizar automáticamente con Google Sheets.', 'error');
    } finally {
      setIsSyncing(false);
    }
  };

  // Toggle single task
  const handleToggleTask = (id: number) => {
    const nextActive = taskStates[id] === false ? true : false;
    const nextStates = {
      ...taskStates,
      [id]: nextActive,
    };
    setTaskStates(nextStates);
    saveTasksToServer(tasks, nextStates);
    if (connectedSheet && connectedSheet.autoSync) {
      triggerSyncToGoogleSheets(tasks, nextStates);
    }
  };

  // Toggle all tasks on / off
  const handleToggleAll = (activate: boolean) => {
    const updated: Record<number, boolean> = {};
    tasks.forEach((task) => {
      updated[task.id] = activate;
    });
    setTaskStates(updated);
    saveTasksToServer(tasks, updated);
    if (connectedSheet && connectedSheet.autoSync) {
      triggerSyncToGoogleSheets(tasks, updated);
    }
  };

  // Task Creation & Editing handlers
  const handleAddNewTask = () => {
    setTaskToEdit(null);
    setIsEditModalOpen(true);
  };

  const handleEditTask = (task: CRMTask) => {
    setTaskToEdit(task);
    setIsEditModalOpen(true);
  };

  const handleSaveTask = (savedTask: CRMTask) => {
    let nextTasks: CRMTask[] = [];
    setTasks((prev) => {
      const idx = prev.findIndex((t) => t.id === savedTask.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = savedTask;
        nextTasks = next;
        return next;
      } else {
        nextTasks = [...prev, savedTask];
        return nextTasks;
      }
    });

    const nextStates = {
      ...taskStates,
      [savedTask.id]: savedTask.estado !== 'Cerrado',
    };
    setTaskStates(nextStates);

    if (selectedDetailTask && selectedDetailTask.id === savedTask.id) {
      setSelectedDetailTask(savedTask);
    }

    // Persist to server & localStorage
    saveTasksToServer(nextTasks, nextStates);

    // Auto-sync with connected Google Sheets if active
    if (connectedSheet && connectedSheet.autoSync) {
      triggerSyncToGoogleSheets(nextTasks, nextStates);
    }
  };

  const handleDeleteTask = (id: number) => {
    const nextTasks = tasks.filter((t) => t.id !== id);
    setTasks(nextTasks);
    const nextStates = { ...taskStates };
    delete nextStates[id];
    setTaskStates(nextStates);
    if (selectedDetailTask && selectedDetailTask.id === id) {
      setSelectedDetailTask(null);
    }
    saveTasksToServer(nextTasks, nextStates);
    if (connectedSheet && connectedSheet.autoSync) {
      triggerSyncToGoogleSheets(nextTasks, nextStates);
    }
  };

  const handleMoveTask = (id: number, direction: 'up' | 'down') => {
    let nextTasks: CRMTask[] = [];
    setTasks((prev) => {
      const idx = prev.findIndex((t) => t.id === id);
      if (idx === -1) return prev;
      const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
      if (targetIdx < 0 || targetIdx >= prev.length) return prev;
      const next = [...prev];
      const temp = next[idx];
      next[idx] = next[targetIdx];
      next[targetIdx] = temp;
      nextTasks = next;
      return next;
    });
    // Switch to manual sort so the adjusted meeting order is visible immediately
    setSortOption('manual');
    saveTasksToServer(nextTasks, taskStates);
    if (connectedSheet && connectedSheet.autoSync && nextTasks.length > 0) {
      triggerSyncToGoogleSheets(nextTasks, taskStates);
    }
  };

  const handleReorderTasks = (sourceId: number, targetId: number, position: 'before' | 'after' = 'before') => {
    let nextTasks: CRMTask[] = [];
    setTasks((prev) => {
      const sourceIdx = prev.findIndex((t) => t.id === sourceId);
      const targetIdx = prev.findIndex((t) => t.id === targetId);
      if (sourceIdx === -1 || targetIdx === -1 || sourceIdx === targetIdx) return prev;

      const copy = [...prev];
      const [moved] = copy.splice(sourceIdx, 1);
      const newTargetIdx = copy.findIndex((t) => t.id === targetId);
      const insertAt = position === 'before' ? newTargetIdx : newTargetIdx + 1;
      copy.splice(insertAt, 0, moved);
      nextTasks = copy;
      return copy;
    });
    setSortOption('manual');
    saveTasksToServer(nextTasks, taskStates);
    if (connectedSheet && connectedSheet.autoSync && nextTasks.length > 0) {
      triggerSyncToGoogleSheets(nextTasks, taskStates);
    }
  };

  const handleResetTasks = async () => {
    if (confirm('¿Deseas restablecer todos los pendientes, parámetros y observaciones a los valores originales de la reunión del 10/09/2026?')) {
      setTasks(CRM_TASKS_DATA);
      const initial: Record<number, boolean> = {};
      CRM_TASKS_DATA.forEach((task) => {
        initial[task.id] = task.estado !== 'Cerrado';
      });
      setTaskStates(initial);
      localStorage.removeItem(TASKS_STORAGE_KEY);
      try {
        await fetch('/api/tasks/reset', { method: 'POST' });
      } catch {}
      if (connectedSheet && connectedSheet.autoSync) {
        triggerSyncToGoogleSheets(CRM_TASKS_DATA, initial);
      }
    }
  };

  // Counts by Functional Focus for filtering badges
  const focusCounts = useMemo(() => {
    const counts: Record<FunctionalFocus, number> = {
      infraestructura: 0,
      ventas_supervision: 0,
      multimedia_voz: 0,
      ux_taxonomia: 0,
      ia_analitica: 0,
      protocolo_resuelto: 0,
    };
    tasks.forEach((task) => {
      if (counts[task.functionalFocus] !== undefined) {
        counts[task.functionalFocus]++;
      }
    });
    return counts;
  }, [tasks]);

  // Filtered & Sorted Tasks
  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      // Search term match
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase();
        const matches =
          task.pendiente.toLowerCase().includes(query) ||
          task.detalleEvidencia.toLowerCase().includes(query) ||
          task.accionAcordada.toLowerCase().includes(query) ||
          task.responsable.toLowerCase().includes(query) ||
          task.semanticDomainName.toLowerCase().includes(query) ||
          task.categoria.toLowerCase().includes(query) ||
          task.impactoIndispensableCRM.toLowerCase().includes(query) ||
          task.originalNumber.toString().includes(query);

        if (!matches) return false;
      }

      // Functional Focus filter (Teoría del Color)
      if (selectedFocus !== 'all' && task.functionalFocus !== selectedFocus) {
        return false;
      }

      // Status selector filter
      const isActive = taskStates[task.id] !== false;
      if (statusFilter === 'active_only' && !isActive) return false;
      if (statusFilter === 'dimmed_only' && isActive) return false;

      // Responsible filter
      if (selectedResponsible !== 'all' && task.responsable !== selectedResponsible) {
        return false;
      }

      return true;
    }).sort((a, b) => {
      if (sortOption === 'manual') {
        return 0; // Natural sequence in the tasks array
      }
      if (sortOption === 'criticality_desc') {
        return b.criticalityScore - a.criticalityScore;
      }
      if (sortOption === 'criticality_asc') {
        return a.criticalityScore - b.criticalityScore;
      }
      if (sortOption === 'priority') {
        const priorityOrder: Record<string, number> = { Alta: 3, Media: 2, Baja: 1, '—': 0 };
        return (priorityOrder[b.prioridad] || 0) - (priorityOrder[a.prioridad] || 0);
      }
      if (sortOption === 'number') {
        return a.originalNumber - b.originalNumber;
      }
      return 0;
    });
  }, [tasks, searchTerm, selectedFocus, statusFilter, sortOption, selectedResponsible, taskStates]);

  // Counts
  const activeCount = useMemo(() => {
    return tasks.filter((t) => taskStates[t.id] !== false).length;
  }, [tasks, taskStates]);

  const dimmedCount = tasks.length - activeCount;

  return (
    <div className="min-h-screen canvas-sandy text-[#292524] antialiased relative selection:bg-amber-800/15 selection:text-amber-950 pb-16">
      {/* Top Scroll Reading Thread */}
      <motion.div
        className="fixed top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-600 via-[#a87943] to-amber-700 origin-left z-50 shadow-xs"
        style={{ scaleX }}
      />

      {/* Parallax ambient warm sand glows */}
      <motion.div 
        style={{ y: bgY1 }}
        className="fixed top-0 left-1/3 w-[600px] h-[500px] rounded-full blur-[150px] pointer-events-none -z-10 bg-[#f7eedf]/60" 
      />
      <motion.div 
        style={{ y: bgY2 }}
        className="fixed bottom-0 right-1/4 w-[600px] h-[500px] rounded-full blur-[150px] pointer-events-none -z-10 bg-[#ede4d4]/50" 
      />

      {/* Floating Sticky HUD that appears during Scroll */}
      <AnimatePresence>
        {showScrollNav && (
          <motion.div
            initial={{ opacity: 0, y: -24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -24 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            className="fixed top-3 left-1/2 -translate-x-1/2 z-40 flex items-center gap-2 p-1.5 px-3.5 rounded-full bg-white/95 backdrop-blur-md border border-[#e5dfd3] shadow-[0_8px_24px_-4px_rgba(87,70,55,0.15)] text-xs text-[#443e35]"
          >
            {/* Scroll Percentage Indicator */}
            <div className="flex items-center gap-1.5 font-mono font-bold text-amber-900 pr-2 border-r border-[#e8dfd3]">
              <span className="w-2 h-2 rounded-full bg-amber-600" />
              <span>{scrollPercent}%</span>
            </div>

            {/* Active tickets counter */}
            <span className="text-[#6d6152] font-medium hidden sm:inline">
              <strong>{activeCount}</strong> activos de {tasks.length}
            </span>

            {/* Quick Add Task */}
            <button
              type="button"
              onClick={handleAddNewTask}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#292524] hover:bg-[#44403c] text-amber-300 font-semibold cursor-pointer transition-colors"
              title="Agregar nuevo pendiente para ajuste en reunión"
            >
              <Plus className="w-3 h-3" />
              <span>Pendiente</span>
            </button>

            {/* Quick Expand All Toggle */}
            <button
              type="button"
              onClick={handleToggleAllExpanded}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#faf7f2] hover:bg-[#ede5d8] border border-[#e4dccf] text-[#574d3f] font-semibold cursor-pointer transition-colors"
            >
              <ChevronsUpDown className="w-3 h-3 text-amber-600" />
              <span>{allExpanded ? 'Colapsar' : 'Expandir'}</span>
            </button>

            {/* Scroll to Top */}
            <button
              type="button"
              onClick={scrollToTop}
              className="inline-flex items-center gap-1 p-1 px-2 rounded-full bg-[#292524] hover:bg-[#44403c] text-white font-semibold cursor-pointer transition-colors"
              title="Volver al inicio"
            >
              <ArrowUp className="w-3 h-3" />
              <span className="hidden md:inline">Arriba</span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <main className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 sm:py-7">
        {/* Top Header with Meeting Meta & Human Controls */}
        <MeetingHeader
          onToggleAll={handleToggleAll}
          onOpenLegend={() => setIsLegendOpen(true)}
          onOpenSummary={() => setIsReportOpen(true)}
          onOpenSheets={() => setIsSheetsOpen(true)}
          onAddNewTask={handleAddNewTask}
          onResetTasks={handleResetTasks}
          activeCount={activeCount}
          totalCount={tasks.length}
          allExpanded={allExpanded}
          onToggleAllExpanded={handleToggleAllExpanded}
          connectedSheet={connectedSheet}
          onTriggerSync={() => triggerSyncToGoogleSheets(tasks, taskStates)}
          isSyncing={isSyncing}
        />

        {/* Executive Metrics & Telemetry HUD */}
        <ExecutiveMetrics
          tasks={tasks}
          taskStates={taskStates}
        />

        {/* Semantic Filter & Color Focus Bar */}
        <SemanticFilterBar
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          statusFilter={statusFilter}
          onStatusFilterChange={setStatusFilter}
          sortOption={sortOption}
          onSortOptionChange={setSortOption}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          selectedFocus={selectedFocus}
          onSelectFocus={setSelectedFocus}
          selectedResponsible={selectedResponsible}
          onSelectResponsible={setSelectedResponsible}
          activeCount={activeCount}
          dimmedCount={dimmedCount}
          totalCount={tasks.length}
          focusCounts={focusCounts}
          onAddNewTask={handleAddNewTask}
        />

        {/* Visual Indicator of the Current View Mode */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4 px-1 text-xs text-[#786d5f]">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-semibold text-[#574c3e]">
              Mostrando {filteredTasks.length} de {tasks.length} pendientes
            </span>
            {selectedFocus !== 'all' && (
              <span 
                className="px-2 py-0.5 rounded-lg text-[11px] font-bold border bg-white shadow-2xs"
                style={{
                  borderColor: FOCUS_DEFINITIONS[selectedFocus].accentHex,
                  color: FOCUS_DEFINITIONS[selectedFocus].accentHex,
                }}
              >
                {FOCUS_DEFINITIONS[selectedFocus].name}
              </span>
            )}
            {viewMode === '3d' && (
              <span className="px-2.5 py-0.5 rounded-md text-[11px] font-semibold bg-amber-100 border border-amber-300 text-amber-900 shadow-2xs">
                🌐 Espacio 3D Físico • Arrastre en 3 Dimensiones (Mantén [Shift] para Profundidad Z) • Magnetismo Funcional
              </span>
            )}
            {viewMode === 'spheres' && (
              <span className="px-2.5 py-0.5 rounded-md text-[11px] font-medium bg-amber-100/70 border border-amber-300/80 text-amber-900">
                🪐 Círculos con Físicas de Gravedad 2D • Colisión & Rebote
              </span>
            )}
            {viewMode === 'proportional' && (
              <span className="px-2 py-0.5 rounded-md text-[11px] font-medium bg-[#f5ede0] border border-[#e4d6c3] text-[#6d5b45]">
                Tamaño proporcional a severidad
              </span>
            )}
          </div>
          <div className="text-[11px] font-mono text-[#8c7e6c]">
            Orden: {
              sortOption === 'manual' ? 'Manual de Reunión' :
              sortOption === 'criticality_desc' ? 'Mayor Impacto CRM' :
              sortOption === 'criticality_asc' ? 'Menor Impacto CRM' :
              sortOption === 'priority' ? 'Prioridad' : 'Ticket'
            }
          </div>
        </div>

        {/* Content Display: 3D Universe / Spheres 2D / Table / Proportional / Standard Grid */}
        {filteredTasks.length === 0 ? (
          <div className="rounded-2xl border border-[#e5ded3] bg-white p-10 text-center my-6 shadow-[0_6px_24px_-4px_rgba(87,70,55,0.06)]">
            <AlertCircle className="w-8 h-8 text-[#a89985] mx-auto mb-2" />
            <h4 className="text-base font-bold mb-1 text-[#1c1917] font-serif-warm">
              No se encontraron pendientes con los filtros actuales
            </h4>
            <p className="text-xs text-[#786d5f] mb-4 max-w-md mx-auto leading-relaxed">
              Intenta cambiar el término de búsqueda o restablecer los filtros de selección.
            </p>
            <button
              onClick={() => {
                setSearchTerm('');
                setSelectedFocus('all');
                setStatusFilter('all');
                setSelectedResponsible('all');
              }}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-[#292524] text-[#f6f3ed] hover:bg-[#44403c] transition-all cursor-pointer shadow-2xs"
            >
              Restablecer Filtros
            </button>
          </div>
        ) : viewMode === '3d' ? (
          /* Real-time 3D Space with 3-dimensional physics, dragging (X, Y, Z), and magnetism */
          <GravitySpheres3D
            tasks={filteredTasks}
            taskStates={taskStates}
            onToggleTask={handleToggleTask}
            onToggleAll={handleToggleAll}
            onSelectTask={(task) => setSelectedDetailTask(task)}
            onEditTask={handleEditTask}
            selectedFocus={selectedFocus}
          />
        ) : viewMode === 'spheres' ? (
          /* Real-time 2D Physics Gravity & Collision Universe */
          <GravitySpheresCanvas
            tasks={filteredTasks}
            taskStates={taskStates}
            onToggleTask={handleToggleTask}
            onToggleAll={handleToggleAll}
          />
        ) : viewMode === 'table' ? (
          /* Table View with in-line editing, drag-and-drop reordering, and instant persistence */
          <MatrixTableView
            tasks={filteredTasks}
            taskStates={taskStates}
            onToggle={handleToggleTask}
            onEdit={handleEditTask}
            onMove={handleMoveTask}
            onReorder={handleReorderTasks}
            onAddNewTask={handleAddNewTask}
            isSaving={isSaving}
          />
        ) : (
          /* Cards Grid (Proportional or Standard) with Progressive Disclosure Menus */
          <motion.div
            layout="position"
            className={`grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3.5 lg:gap-4 ${
              viewMode === 'proportional' ? 'auto-rows-min' : ''
            }`}
          >
            {filteredTasks.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                isActive={taskStates[task.id] !== false}
                onToggle={handleToggleTask}
                layoutMode={viewMode === 'proportional' ? 'proportional' : 'standard'}
                isForceExpanded={allExpanded ? true : undefined}
                onEdit={handleEditTask}
                onMove={handleMoveTask}
              />
            ))}
          </motion.div>
        )}

        {/* Footer */}
        <footer className="mt-12 pt-6 border-t border-[#e5ded3] flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#786d5f]">
          <div>
            CRM WhatsApp • Mesa de Seguimiento Técnico y Comercial (Reunión 10/09/2026)
          </div>
          <div className="flex flex-wrap items-center gap-3 text-[11px] text-[#8c7f6f]">
            <span>Alex (Software Factory)</span>
            <span>•</span>
            <span>Freddy (Jefe Ventas)</span>
            <span>•</span>
            <span>Antoinette (Procesos TI)</span>
            <span>•</span>
            <span>Jose Carlos (Meta Ads)</span>
          </div>
        </footer>
      </main>

      {/* Floating Scroll-to-Top Button with Smooth Motion */}
      <AnimatePresence>
        {showScrollNav && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 10 }}
            transition={{ duration: 0.2 }}
            type="button"
            onClick={scrollToTop}
            className="fixed bottom-6 right-6 p-3 rounded-full bg-[#292524] text-[#f6f3ed] hover:bg-[#44403c] border border-[#292524] shadow-lg transition-all cursor-pointer z-40 flex items-center gap-1.5 text-xs font-semibold"
            title="Volver al inicio"
          >
            <ArrowUp className="w-4 h-4" />
            <span className="hidden sm:inline pr-0.5">Arriba</span>
          </motion.button>
        )}
      </AnimatePresence>

      {/* Task Detail Modal */}
      <TaskDetailModal
        task={selectedDetailTask}
        isOpen={!!selectedDetailTask}
        onClose={() => setSelectedDetailTask(null)}
        isActive={selectedDetailTask ? taskStates[selectedDetailTask.id] !== false : true}
        onToggle={handleToggleTask}
        onEdit={(task) => {
          setSelectedDetailTask(null);
          handleEditTask(task);
        }}
        onDelete={(id) => {
          setSelectedDetailTask(null);
          handleDeleteTask(id);
        }}
      />

      {/* Task Edit & Create Modal for Meeting Adjustments */}
      <TaskEditModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setTaskToEdit(null);
        }}
        taskToEdit={taskToEdit}
        onSave={handleSaveTask}
        nextId={tasks.length > 0 ? Math.max(...tasks.map((t) => t.id)) + 1 : 1}
        connectedSheet={connectedSheet}
      />

      {/* Color Theory & Semantic Legend Modal */}
      <SemanticLegendModal
        isOpen={isLegendOpen}
        onClose={() => setIsLegendOpen(false)}
      />

      {/* Executive Report Modal */}
      <ExecutiveReportModal
        isOpen={isReportOpen}
        onClose={() => setIsReportOpen(false)}
        tasks={tasks}
        taskStates={taskStates}
        onOpenSheets={() => setIsSheetsOpen(true)}
      />

      {/* Google Sheets Workspace Modal */}
      <GoogleSheetsModal
        isOpen={isSheetsOpen}
        onClose={() => setIsSheetsOpen(false)}
        tasks={tasks}
        taskStates={taskStates}
        connectedSheet={connectedSheet}
        onConnectedSheetChange={handleConnectedSheetChange}
        onUpdateTaskStates={(newStates) => setTaskStates(newStates)}
        onUpdateAllTasks={(newTasks, newStates) => {
          setTasks(newTasks);
          if (newStates) {
            setTaskStates((prev) => ({ ...prev, ...newStates }));
          }
        }}
        onTriggerSync={() => triggerSyncToGoogleSheets(tasks, taskStates)}
        isSyncing={isSyncing}
      />

      {/* Real-Time Google Sheets Synchronization Toast */}
      <AnimatePresence>
        {syncToast && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className={`fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3 rounded-2xl shadow-xl border text-xs font-semibold backdrop-blur-md ${
              syncToast.type === 'error'
                ? 'bg-rose-900/90 text-white border-rose-700'
                : syncToast.type === 'success'
                ? 'bg-emerald-900/90 text-white border-emerald-700'
                : 'bg-stone-900/90 text-white border-stone-700'
            }`}
          >
            <span className={`w-2 h-2 rounded-full shrink-0 ${syncToast.type === 'error' ? 'bg-rose-400' : 'bg-emerald-400 animate-pulse'}`} />
            <span>{syncToast.message}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
