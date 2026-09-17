import React, { useState } from 'react';
import { 
  Activity, 
  AlertOctagon, 
  CheckCircle2, 
  Flame, 
  ChevronDown,
  Sparkles
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { CRMTask } from '../types';

interface ExecutiveMetricsProps {
  tasks: CRMTask[];
  taskStates: Record<number, boolean>;
}

export const ExecutiveMetrics: React.FC<ExecutiveMetricsProps> = ({
  tasks,
  taskStates,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const activeTasks = tasks.filter((t) => taskStates[t.id] !== false);
  const dimmedTasks = tasks.filter((t) => taskStates[t.id] === false);

  // Critical blocker tasks (Score >= 80)
  const criticalBlockers = tasks.filter((t) => t.criticalityScore >= 80);
  const activeCriticalBlockers = criticalBlockers.filter((t) => taskStates[t.id] !== false);

  // Tasks directly affecting sales closures
  const salesImpactingTasks = tasks.filter((t) => t.afectaVentasDirectas);
  const activeSalesImpacting = salesImpactingTasks.filter((t) => taskStates[t.id] !== false);

  // Calculate Operational Health Index:
  const maxPossiblePenalty = tasks.reduce((sum, t) => sum + t.criticalityScore, 0);
  const currentActivePenalty = activeTasks.reduce((sum, t) => sum + t.criticalityScore, 0);
  const healthScore = Math.max(0, Math.round(100 - (currentActivePenalty / (maxPossiblePenalty || 1)) * 100));

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.05 }}
      className="rounded-2xl border border-[#e5ded3] bg-white p-3.5 sm:p-4 shadow-[0_4px_18px_-2px_rgba(87,70,55,0.05)] mb-5 transition-all"
    >
      {/* Compact Clean Summary Bar (Always Visible) */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3 sm:gap-5 text-xs">
          {/* Health index pill */}
          <div className="flex items-center gap-2">
            <span
              className={`w-2.5 h-2.5 rounded-full ${
                healthScore >= 75
                  ? 'bg-emerald-500 ring-4 ring-emerald-100'
                  : healthScore >= 45
                  ? 'bg-amber-500 ring-4 ring-amber-100'
                  : 'bg-rose-500 ring-4 ring-rose-100'
              }`}
            />
            <span className="text-[#786d5f] font-medium">Salud Operativa:</span>
            <span className="font-bold text-sm font-serif-warm text-[#1c1917]">{healthScore}%</span>
          </div>

          <div className="h-3.5 w-px bg-[#e6dfd2] hidden sm:block" />

          {/* Critical Blockers */}
          <div className="flex items-center gap-1.5">
            <AlertOctagon className="w-3.5 h-3.5 text-rose-600" />
            <span className="text-[#786d5f] font-medium">Bloqueos Críticos:</span>
            <span className="font-bold text-rose-700">{activeCriticalBlockers.length}</span>
          </div>

          <div className="h-3.5 w-px bg-[#e6dfd2] hidden sm:block" />

          {/* Sales Impact */}
          <div className="flex items-center gap-1.5">
            <Flame className="w-3.5 h-3.5 text-amber-600" />
            <span className="text-[#786d5f] font-medium">Afectan Ventas:</span>
            <span className="font-bold text-amber-800">{activeSalesImpacting.length}</span>
          </div>

          <div className="h-3.5 w-px bg-[#e6dfd2] hidden sm:block" />

          {/* Progress resolved */}
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span className="text-[#786d5f] font-medium">Atendidos/Opacados:</span>
            <span className="font-bold text-emerald-700">{dimmedTasks.length} / {tasks.length}</span>
          </div>
        </div>

        {/* Toggle to expand full metrics cards */}
        <button
          type="button"
          onClick={() => setIsExpanded(!isExpanded)}
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer shadow-2xs ${
            isExpanded
              ? 'bg-[#ede5d8] text-[#292524] border-[#d5c7b3]'
              : 'bg-[#faf7f2] hover:bg-[#f0e9dc] text-[#574c3e] border-[#e4dcce]'
          }`}
        >
          <span>{isExpanded ? 'Ocultar Métricas' : 'Ver Métricas Detalladas'}</span>
          <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isExpanded ? 'rotate-180 text-amber-700' : 'text-[#8c7860]'}`} />
        </button>
      </div>

      {/* Deep Expandable Metric Grid */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden mt-4 pt-4 border-t border-[#f0eae0] grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5"
          >
            {/* Metric 1: CRM Operational Health */}
            <div className="rounded-xl border border-[#e5ded3] bg-[#faf7f2] p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-mono uppercase tracking-wider font-semibold text-[#786d5f]">
                  Salud Operativa CRM
                </span>
                <span className="p-1.5 rounded-lg bg-white border border-[#e5ded3] text-emerald-700">
                  <Activity className="w-3.5 h-3.5" />
                </span>
              </div>
              <div className="flex items-baseline gap-2 mb-2">
                <span className="text-2xl font-bold font-serif-warm text-[#1c1917]">
                  {healthScore}%
                </span>
                <span className="text-[11px] text-[#786d5f]">
                  {activeTasks.length} pendientes activos
                </span>
              </div>
              <div className="w-full h-1.5 rounded-full bg-[#ede6da] overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-700 ${
                    healthScore >= 75
                      ? 'bg-emerald-600'
                      : healthScore >= 45
                      ? 'bg-amber-600'
                      : 'bg-rose-600'
                  }`}
                  style={{ width: `${healthScore}%` }}
                />
              </div>
            </div>

            {/* Metric 2: Critical Blockers */}
            <div className="rounded-xl border border-[#f5ded7] bg-[#fff8f6] p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-mono uppercase tracking-wider font-semibold text-rose-800">
                  Bloqueos Críticos (Nivel 1 & 2)
                </span>
                <span className="p-1.5 rounded-lg bg-white border border-rose-200 text-rose-700">
                  <AlertOctagon className="w-3.5 h-3.5" />
                </span>
              </div>
              <div className="flex items-baseline gap-2 mb-1">
                <span className="text-2xl font-bold font-serif-warm text-rose-700">
                  {activeCriticalBlockers.length}
                </span>
                <span className="text-[11px] text-rose-800/80">
                  de {criticalBlockers.length} totales
                </span>
              </div>
              <p className="text-[11px] text-rose-900/70 leading-tight">
                Puntos que congelan WhatsApp o causan caída de servicio.
              </p>
            </div>

            {/* Metric 3: Sales Closures at Risk */}
            <div className="rounded-xl border border-[#fae5cb] bg-[#fffaf2] p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-mono uppercase tracking-wider font-semibold text-amber-800">
                  Impacto en Ventas & Asesores
                </span>
                <span className="p-1.5 rounded-lg bg-white border border-amber-200 text-amber-600">
                  <Flame className="w-3.5 h-3.5" />
                </span>
              </div>
              <div className="flex items-baseline gap-2 mb-1">
                <span className="text-2xl font-bold font-serif-warm text-amber-700">
                  {activeSalesImpacting.length}
                </span>
                <span className="text-[11px] text-amber-800/80">
                  puntos comerciales
                </span>
              </div>
              <p className="text-[11px] text-amber-900/70 leading-tight">
                Afectan asignación de leads, comisiones y descanso de asesores.
              </p>
            </div>

            {/* Metric 4: Attended / Clarified */}
            <div className="rounded-xl border border-[#d2e7de] bg-[#f2f8f5] p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-mono uppercase tracking-wider font-semibold text-teal-800">
                  Atendidos / Aclarados
                </span>
                <span className="p-1.5 rounded-lg bg-white border border-teal-200 text-teal-700">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                </span>
              </div>
              <div className="flex items-baseline gap-2 mb-1">
                <span className="text-2xl font-bold font-serif-warm text-teal-700">
                  {dimmedTasks.length}
                </span>
                <span className="text-[11px] text-teal-800/80">
                  estabilizados ({Math.round((dimmedTasks.length / tasks.length) * 100)}%)
                </span>
              </div>
              <p className="text-[11px] text-teal-900/70 leading-tight">
                Puntos aclarados o con solución cerrada en reunión.
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
