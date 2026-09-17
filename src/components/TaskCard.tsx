import React, { useState } from 'react';
import { 
  ServerCrash, 
  ClockAlert, 
  ShieldAlert, 
  UserX, 
  Hourglass, 
  Mic, 
  Tag, 
  LayoutGrid, 
  CheckCheck, 
  Sparkles, 
  PhoneCall, 
  Share2, 
  Zap, 
  SlidersHorizontal, 
  CircleCheck,
  AlertTriangle,
  ArrowRight,
  User,
  FileSearch,
  ChevronDown,
  FileText,
  Power,
  Flame,
  CheckCircle2,
  Cpu,
  BadgeAlert,
  Edit3,
  ArrowUp,
  ArrowDown
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { CRMTask } from '../types';
import { FOCUS_DEFINITIONS, SEMANTIC_STYLES } from '../data/crmTasksData';

interface TaskCardProps {
  task: CRMTask;
  isActive: boolean;
  onToggle: (id: number) => void;
  layoutMode: 'proportional' | 'standard';
  isForceExpanded?: boolean;
  onEdit?: (task: CRMTask) => void;
  onMove?: (id: number, direction: 'up' | 'down') => void;
}

const ICON_MAP: Record<string, React.ElementType> = {
  ServerCrash,
  ClockAlert,
  ShieldAlert,
  UserX,
  Hourglass,
  Mic,
  Tag,
  LayoutGrid,
  CheckCheck,
  Sparkles,
  PhoneCall,
  Share2,
  Zap,
  SlidersHorizontal,
  CircleCheck,
};

export const TaskCard: React.FC<TaskCardProps> = ({
  task,
  isActive,
  onToggle,
  layoutMode,
  isForceExpanded,
  onEdit,
  onMove,
}) => {
  const [isExpandedLocal, setIsExpandedLocal] = useState<boolean>(false);
  const isExpanded = isForceExpanded !== undefined ? isForceExpanded : isExpandedLocal;

  const focus = FOCUS_DEFINITIONS[task.functionalFocus] || FOCUS_DEFINITIONS.protocolo_resuelto;
  const semantic = SEMANTIC_STYLES[task.semanticDomain] || SEMANTIC_STYLES.clarified_closed;
  const IconComponent = ICON_MAP[semantic.iconName] || AlertTriangle;

  // Proportional sizing logic
  const isHero = layoutMode === 'proportional' && task.proportionalUnits >= 4;
  const isHigh = layoutMode === 'proportional' && task.proportionalUnits === 3;
  const isMedium = layoutMode === 'proportional' && task.proportionalUnits === 2;

  // Dynamic grid spanning
  const colSpanClass = layoutMode === 'proportional'
    ? isHero 
      ? 'col-span-1 md:col-span-2 xl:col-span-3' 
      : isHigh 
      ? 'col-span-1 md:col-span-2 xl:col-span-2'
      : isMedium
      ? 'col-span-1 md:col-span-1 xl:col-span-1'
      : 'col-span-1'
    : 'col-span-1';

  // Criticality badge colors (warm human palette)
  const getScoreBadge = () => {
    if (task.criticalityScore >= 90) {
      return {
        bg: 'bg-rose-100 text-rose-900 border-rose-300',
        label: 'CRÍTICO BLOQUEANTE',
        barGradient: 'from-rose-500 to-amber-600',
      };
    }
    if (task.criticalityScore >= 75) {
      return {
        bg: 'bg-amber-100 text-amber-900 border-amber-300',
        label: 'ALTO RIESGO OPERATIVO',
        barGradient: 'from-amber-500 to-orange-500',
      };
    }
    if (task.criticalityScore >= 50) {
      return {
        bg: 'bg-stone-200 text-stone-850 border-stone-300',
        label: 'IMPACTO MEDIO / FLUJO',
        barGradient: 'from-stone-500 to-amber-600',
      };
    }
    if (task.criticalityTier === 'RESUELTO / OPERATIVO') {
      return {
        bg: 'bg-emerald-100 text-emerald-900 border-emerald-300',
        label: 'RESUELTO / OPERATIVO',
        barGradient: 'from-emerald-500 to-teal-600',
      };
    }
    return {
      bg: 'bg-sky-100 text-sky-900 border-sky-300',
      label: task.criticalityTier,
      barGradient: 'from-sky-500 to-indigo-500',
    };
  };

  const scoreBadge = getScoreBadge();

  return (
    <motion.article
      layout="position"
      id={`card-crm-task-${task.id}`}
      initial={{ opacity: 0, y: 28, scale: 0.98 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.38, ease: [0.22, 1, 0.36, 1] }}
      className={`relative rounded-2xl transition-all duration-300 flex flex-col justify-between overflow-hidden paper-card ${colSpanClass} ${
        isActive
          ? 'bg-white border-[#e5ded3] text-[#292524] shadow-[0_4px_20px_-2px_rgba(87,70,55,0.06),0_1px_3px_rgba(87,70,55,0.03)] hover:shadow-[0_12px_28px_-4px_rgba(87,70,55,0.1)] hover:border-[#d5cbbe]'
          : 'bg-[#f4efe6]/80 border-[#ddd4c4] opacity-60 filter grayscale-[55%] hover:opacity-85 shadow-none'
      } ${
        isExpanded
          ? 'p-5 sm:p-6'
          : isHero 
          ? 'p-4 sm:p-5' 
          : 'p-4'
      }`}
      style={{
        borderLeftWidth: '5px',
        borderLeftColor: isActive ? focus.accentHex : '#a8a29e',
      }}
    >
      {/* 
        ESTADO LIMPIO (Siempre visible por defecto de forma ultra despejada) 
      */}
      <div>
        {/* Fila 1: Ticket + Enfoque + Selector Encender/Apagar */}
        <div className="flex items-center justify-between gap-2.5 mb-2.5">
          <div className="flex items-center gap-2 flex-wrap">
            {/* Número de Ticket */}
            <span className="px-2.5 py-0.5 rounded-lg bg-[#f4efe6] text-[#574c3e] border border-[#e5ded2] font-mono text-xs font-bold">
              #{task.originalNumber < 10 ? `0${task.originalNumber}` : task.originalNumber}
            </span>

            {/* Etiqueta de Enfoque Funcional */}
            <span 
              className="px-2 py-0.5 rounded-lg text-xs font-bold border flex items-center gap-1.5 shadow-2xs"
              style={{
                backgroundColor: '#faf7f2',
                borderColor: `${focus.accentHex}40`,
                color: focus.accentHex,
              }}
            >
              <IconComponent className="w-3.5 h-3.5 shrink-0" />
              <span>{focus.name}</span>
            </span>

            {/* Badge de Impacto */}
            <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider border ${scoreBadge.bg}`}>
              {task.criticalityScore} pts • {scoreBadge.label}
            </span>
          </div>

          {/* Action Group: Reorder + Edit + Active/Opacado */}
          <div className="flex items-center gap-1 shrink-0">
            {onMove && (
              <div className="flex items-center">
                <button
                  type="button"
                  onClick={() => onMove(task.id, 'up')}
                  className="p-1 text-[#8c7860] hover:text-[#292524] hover:bg-[#ede5d8] rounded transition-colors cursor-pointer"
                  title="Subir orden en la reunión"
                >
                  <ArrowUp className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => onMove(task.id, 'down')}
                  className="p-1 text-[#8c7860] hover:text-[#292524] hover:bg-[#ede5d8] rounded transition-colors cursor-pointer"
                  title="Bajar orden en la reunión"
                >
                  <ArrowDown className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {onEdit && (
              <button
                type="button"
                onClick={() => onEdit(task)}
                className="p-1.5 text-[#8c7860] hover:text-[#292524] hover:bg-[#ede5d8] rounded-lg transition-colors cursor-pointer border border-[#e4dccf]"
                title="Editar parámetros, observaciones y prioridad"
              >
                <Edit3 className="w-3.5 h-3.5" />
              </button>
            )}

            {/* Selector Táctil Activo / Opacado */}
            <button
              type="button"
              onClick={() => onToggle(task.id)}
              className={`px-2.5 py-1 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer border shadow-2xs ${
                isActive
                  ? 'bg-[#292524] text-[#f6f3ed] border-[#292524] hover:bg-[#44403c]'
                  : 'bg-[#ede5d8] text-[#78716c] border-[#d7cbba] hover:bg-[#e2d8c6]'
              }`}
              title={isActive ? 'Hacer clic para apagar y opacar esta tarea' : 'Hacer clic para activar tarea'}
            >
              <Power className={`w-3.5 h-3.5 ${isActive ? 'text-amber-300' : 'text-stone-400'}`} />
              <span className="hidden sm:inline">{isActive ? 'Activo' : 'Opacado'}</span>
            </button>
          </div>
        </div>

        {/* Título Limpio y Destacado */}
        <h3
          onClick={() => setIsExpandedLocal(!isExpanded)}
          className={`text-base sm:text-lg font-bold leading-snug cursor-pointer transition-colors font-serif-warm hover:text-[#a87943] ${
            isActive ? 'text-[#1c1917]' : 'line-through text-[#78716c]'
          } ${isExpanded ? 'mb-3' : 'mb-2'}`}
        >
          {task.pendiente}
        </h3>

        {/* Línea limpia cuando está colapsado: Responsable + Botón desplegable */}
        {!isExpanded && (
          <div className="flex items-center justify-between text-xs text-[#78716c] pt-1 border-t border-[#f2ece2]">
            <div className="flex items-center gap-1.5 text-xs text-[#574d3f]">
              <User className="w-3.5 h-3.5 text-[#a87943]" />
              <span className="font-medium">Responsable:</span>
              <span className="font-bold text-[#292524]">{task.responsable}</span>
            </div>

            <button
              type="button"
              onClick={() => setIsExpandedLocal(true)}
              className="inline-flex items-center gap-1.5 py-1 px-2.5 rounded-lg bg-[#faf7f2] hover:bg-[#ede5d8] text-[#574c3e] border border-[#e4dccf] text-xs font-semibold transition-all cursor-pointer shadow-2xs"
            >
              <span>Ver Detalle y Solución</span>
              <ChevronDown className="w-3.5 h-3.5 text-amber-600" />
            </button>
          </div>
        )}
      </div>

      {/* 
        MENÚ DESPLEGABLE CON JERARQUÍA PROFUNDA Y COMPLETA 
      */}
      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden mt-3 pt-3 border-t border-[#e8dfd3] space-y-3"
          >
            {/* Medidor de Severidad y Alerta de Impacto en Ventas */}
            <div className="p-3 rounded-xl bg-[#faf7f0] border border-[#ebe2d4] flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
              <div className="flex items-center gap-3 flex-1">
                <span className="text-xs font-semibold text-[#574d3f] shrink-0">
                  Severidad Operativa CRM:
                </span>
                <div className="flex-1 max-w-xs h-2 rounded-full bg-[#e8e0d2] overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 bg-gradient-to-r ${scoreBadge.barGradient}`}
                    style={{ width: `${Math.max(8, task.criticalityScore)}%` }}
                  />
                </div>
                <span className="font-mono font-bold text-xs text-[#292524] shrink-0">
                  {task.criticalityScore}<span className="text-[#a8a29e] font-normal">/100</span>
                </span>
              </div>

              {task.afectaVentasDirectas && (
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-100 border border-amber-300 text-amber-900 text-[11px] font-bold shrink-0">
                  <Flame className="w-3.5 h-3.5 text-amber-600" />
                  <span>Afecta Ventas Directas</span>
                </div>
              )}
            </div>

            {/* SECCIÓN 1: HECHO O EVIDENCIA EN REUNIÓN */}
            <div className="rounded-xl p-3.5 bg-[#fbf9f4] border border-[#e8e0d2] text-[#3d3429]">
              <div className="flex items-center gap-2 text-xs font-bold text-[#785934] mb-1.5">
                <div className="p-1 rounded-md bg-[#f0e6d5] text-[#8c5825]">
                  <FileSearch className="w-3.5 h-3.5" />
                </div>
                <span className="uppercase tracking-wider text-[11px] font-mono font-semibold">
                  1. Antecedente y Evidencia en Reunión (10/09/2026):
                </span>
              </div>
              <p className="text-xs sm:text-[13px] leading-relaxed italic text-[#4a3f33] pl-1 border-l-2 border-[#d5c6b4] ml-1">
                "{task.detalleEvidencia}"
              </p>
            </div>

            {/* SECCIÓN 2: POR QUÉ AFECTA EL FUNCIONAMIENTO INDISPENSABLE */}
            <div className="rounded-xl p-3.5 bg-[#fff8f6] border border-[#f5ded7] border-l-4 border-l-[#c2410c] text-[#3c211a]">
              <div className="flex items-center gap-2 text-xs font-bold text-[#b91c1c] mb-1.5">
                <div className="p-1 rounded-md bg-[#fde2db] text-[#b91c1c]">
                  <BadgeAlert className="w-3.5 h-3.5" />
                </div>
                <span className="uppercase tracking-wider text-[11px] font-mono font-semibold">
                  2. Diagnóstico: Causa Raíz e Impacto Crítico en CRM:
                </span>
              </div>
              <p className="text-xs sm:text-[13px] leading-relaxed text-[#45271f] font-medium">
                {task.impactoIndispensableCRM}
              </p>
            </div>

            {/* SECCIÓN 3: ACCIÓN ACORDADA EN LA MESA TÉCNICA */}
            <div className="rounded-xl p-3.5 bg-[#f2f8f5] border border-[#d2e7de] border-l-4 border-l-[#0f766e] text-[#143d35]">
              <div className="flex items-center gap-2 text-xs font-bold text-[#0f766e] mb-1.5">
                <div className="p-1 rounded-md bg-[#dcf0e8] text-[#0f766e]">
                  <ArrowRight className="w-3.5 h-3.5" />
                </div>
                <span className="uppercase tracking-wider text-[11px] font-mono font-semibold">
                  3. Solución y Protocolo Técnico Acordado:
                </span>
              </div>
              <p className="text-xs sm:text-[13px] leading-relaxed text-[#1a443c] font-semibold">
                {task.accionAcordada}
              </p>
            </div>

            {/* SECCIÓN 4: FICHA TÉCNICA Y METADATOS */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 p-3 rounded-xl bg-[#f8f5ee] border border-[#ebe3d5] text-xs">
              <div>
                <div className="text-[10px] uppercase font-mono text-[#8c7f6f]">Responsable:</div>
                <div className="font-bold text-[#292524]">{task.responsable}</div>
              </div>
              <div>
                <div className="text-[10px] uppercase font-mono text-[#8c7f6f]">Prioridad:</div>
                <div className="font-bold text-[#44403c]">{task.prioridad}</div>
              </div>
              <div>
                <div className="text-[10px] uppercase font-mono text-[#8c7f6f]">Estado Actual:</div>
                <div className="font-bold text-[#292524]">{task.estado}</div>
              </div>
              <div>
                <div className="text-[10px] uppercase font-mono text-[#8c7f6f]">Categoría CRM:</div>
                <div className="font-semibold text-[#574d3f] truncate">{task.categoria}</div>
              </div>
            </div>

            {/* Botón para colapsar */}
            <div className="flex justify-end pt-1">
              <button
                type="button"
                onClick={() => setIsExpandedLocal(false)}
                className="inline-flex items-center gap-1.5 py-1.5 px-3 rounded-xl bg-[#faf7f2] hover:bg-[#ede5d8] text-[#574c3e] border border-[#e2d8c9] text-xs font-semibold transition-all cursor-pointer"
              >
                <span>Ocultar Información Detallada</span>
                <ChevronDown className="w-3.5 h-3.5 rotate-180 text-[#8c7860]" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.article>
  );
};
