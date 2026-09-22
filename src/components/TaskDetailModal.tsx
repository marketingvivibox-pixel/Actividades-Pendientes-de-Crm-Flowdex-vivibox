import React from 'react';
import { 
  X, 
  Power, 
  Flame, 
  FileSearch, 
  BadgeAlert, 
  ArrowRight, 
  User, 
  CheckCircle2,
  Calendar,
  Layers,
  Sparkles,
  ArrowDown,
  Edit3,
  Trash2
} from 'lucide-react';
import { CRMTask } from '../types';
import { FOCUS_DEFINITIONS } from '../data/crmTasksData';

interface TaskDetailModalProps {
  task: CRMTask | null;
  isOpen: boolean;
  onClose: () => void;
  isActive: boolean;
  onToggle: (id: number) => void;
  onEdit?: (task: CRMTask) => void;
  onDelete?: (id: number) => void;
}

export const TaskDetailModal: React.FC<TaskDetailModalProps> = ({
  task,
  isOpen,
  onClose,
  isActive,
  onToggle,
  onEdit,
  onDelete,
}) => {
  if (!isOpen || !task) return null;

  const focus = FOCUS_DEFINITIONS[task.functionalFocus] || FOCUS_DEFINITIONS.protocolo_resuelto;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-stone-900/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-2xl max-h-[92vh] overflow-y-auto rounded-3xl border border-[#e5ded3] bg-white text-[#292524] p-5 sm:p-7 shadow-2xl transition-all"
        style={{
          borderTopWidth: '6px',
          borderTopColor: focus.accentHex,
        }}
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl text-[#786d5f] hover:text-[#292524] hover:bg-[#faf6ee] transition-all cursor-pointer z-10"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Top Header: Badge, Focus, and Power Toggle */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4 pr-10">
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-2.5 py-1 rounded-lg bg-[#f4efe6] text-[#574c3e] border border-[#e5ded2] font-mono text-xs font-bold">
              Ticket #{task.originalNumber < 10 ? `0${task.originalNumber}` : task.originalNumber}
            </span>

            <span
              className="px-2.5 py-1 rounded-lg text-xs font-bold border shadow-2xs"
              style={{
                backgroundColor: '#faf7f2',
                borderColor: `${focus.accentHex}40`,
                color: focus.accentHex,
              }}
            >
              {focus.name}
            </span>

            <span className="px-2.5 py-1 rounded-lg text-xs font-bold uppercase tracking-wider bg-stone-100 text-stone-800 border border-stone-300">
              {task.criticalityScore} pts • {task.criticalityTier}
            </span>
          </div>

          {/* Toggle Button */}
          <button
            type="button"
            onClick={() => onToggle(task.id)}
            className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer border shadow-2xs ${
              isActive
                ? 'bg-[#292524] text-[#f6f3ed] border-[#292524] hover:bg-[#44403c]'
                : 'bg-[#ede5d8] text-[#78716c] border-[#d7cbba] hover:bg-[#e2d8c6]'
            }`}
          >
            <Power className={`w-3.5 h-3.5 ${isActive ? 'text-amber-300' : 'text-stone-400'}`} />
            <span>{isActive ? 'Activo (Flota al Centro)' : 'Opacado (Cae por Gravedad)'}</span>
          </button>
        </div>

        {/* Dynamic Gravity State Hint */}
        <div className={`p-2.5 rounded-xl mb-4 text-xs flex items-center gap-2 border ${
          isActive 
            ? 'bg-[#f0f9f4] border-[#d2edd9] text-[#1c5d3d]' 
            : 'bg-[#fff5f2] border-[#ffdacf] text-[#9c2b18]'
        }`}>
          {isActive ? (
            <>
              <Sparkles className="w-4 h-4 text-[#10b981] shrink-0" />
              <span><strong>En Órbita Central:</strong> Esta esfera permanece activa flotando en el centro visible de la pantalla. Al desactivarla caerá por gravedad.</span>
            </>
          ) : (
            <>
              <ArrowDown className="w-4 h-4 text-[#c2410c] shrink-0 animate-bounce" />
              <span><strong>Caída por Gravedad:</strong> Este pendiente está desactivado y reposa en el fondo del espacio de scroll (+50% inferior).</span>
            </>
          )}
        </div>

        {/* Title */}
        <h2 className="text-xl sm:text-2xl font-bold font-serif-warm text-[#1c1917] leading-snug mb-4">
          {task.pendiente}
        </h2>

        {/* Severity Bar */}
        <div className="p-3.5 rounded-2xl bg-[#faf7f0] border border-[#ebe2d4] mb-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3 flex-1">
            <span className="text-xs font-semibold text-[#574d3f] shrink-0">
              Severidad Operativa CRM:
            </span>
            <div className="flex-1 max-w-xs h-2 rounded-full bg-[#e8e0d2] overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-amber-500 via-orange-500 to-rose-600"
                style={{ width: `${Math.max(10, task.criticalityScore)}%` }}
              />
            </div>
            <span className="font-mono font-bold text-xs text-[#292524] shrink-0">
              {task.criticalityScore}/100
            </span>
          </div>

          {task.afectaVentasDirectas && (
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-100 border border-amber-300 text-amber-900 text-xs font-bold shrink-0">
              <Flame className="w-3.5 h-3.5 text-amber-600" />
              <span>Afecta Ventas Directas</span>
            </div>
          )}
        </div>

        {/* Deep Hierarchical Sections */}
        <div className="space-y-3.5 mb-5">
          {/* SECCIÓN 1: HECHO O EVIDENCIA EN REUNIÓN */}
          <div className="rounded-2xl p-4 bg-[#fbf9f4] border border-[#e8e0d2] text-[#3d3429]">
            <div className="flex items-center gap-2 text-xs font-bold text-[#785934] mb-1.5 font-mono uppercase tracking-wider">
              <div className="p-1 rounded-md bg-[#f0e6d5] text-[#8c5825]">
                <FileSearch className="w-4 h-4" />
              </div>
              <span>1. Antecedente y Evidencia en Reunión (10/09/2026):</span>
            </div>
            <p className="text-xs sm:text-sm leading-relaxed italic text-[#4a3f33] pl-2 border-l-2 border-[#d5c6b4] ml-1">
              "{task.detalleEvidencia}"
            </p>
          </div>

          {/* SECCIÓN 2: CAUSA RAÍZ E IMPACTO CRÍTICO EN CRM */}
          <div className="rounded-2xl p-4 bg-[#fff8f6] border border-[#f5ded7] border-l-4 border-l-[#c2410c] text-[#3c211a]">
            <div className="flex items-center gap-2 text-xs font-bold text-[#b91c1c] mb-1.5 font-mono uppercase tracking-wider">
              <div className="p-1 rounded-md bg-[#fde2db] text-[#b91c1c]">
                <BadgeAlert className="w-4 h-4" />
              </div>
              <span>2. Diagnóstico: Causa Raíz e Impacto Indispensable en CRM:</span>
            </div>
            <p className="text-xs sm:text-sm leading-relaxed text-[#45271f] font-medium">
              {task.impactoIndispensableCRM}
            </p>
          </div>

          {/* SECCIÓN 3: ACCIÓN ACORDADA EN MESA TÉCNICA */}
          <div className="rounded-2xl p-4 bg-[#f2f8f5] border border-[#d2e7de] border-l-4 border-l-[#0f766e] text-[#143d35]">
            <div className="flex items-center gap-2 text-xs font-bold text-[#0f766e] mb-1.5 font-mono uppercase tracking-wider">
              <div className="p-1 rounded-md bg-[#dcf0e8] text-[#0f766e]">
                <ArrowRight className="w-4 h-4" />
              </div>
              <span>3. Solución y Protocolo Técnico Acordado:</span>
            </div>
            <p className="text-xs sm:text-sm leading-relaxed text-[#1a443c] font-semibold">
              {task.accionAcordada}
            </p>
          </div>
        </div>

        {/* Technical Metadata Matrix */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 p-3.5 rounded-2xl bg-[#f8f5ee] border border-[#ebe3d5] text-xs mb-5">
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

        {/* Footer Actions */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-[#f0eae0]">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onToggle(task.id)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-2xs ${
                isActive 
                  ? 'bg-rose-50 text-rose-900 hover:bg-rose-100 border border-rose-200'
                  : 'bg-emerald-50 text-emerald-900 hover:bg-emerald-100 border border-emerald-200'
              }`}
            >
              <Power className="w-3.5 h-3.5" />
              <span>{isActive ? 'Opacar' : 'Activar'}</span>
            </button>

            {onDelete && (
              <button
                type="button"
                onClick={() => {
                  if (confirm(`¿Descartar el pendiente #${task.originalNumber} de la reunión?`)) {
                    onDelete(task.id);
                    onClose();
                  }
                }}
                className="p-2 rounded-xl text-[#a89c8b] hover:text-rose-700 hover:bg-rose-50 border border-transparent hover:border-rose-200 transition-all cursor-pointer"
                title="Descartar este pendiente"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            {onEdit && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onEdit(task);
                }}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-[#292524] text-amber-300 hover:bg-[#44403c] transition-all cursor-pointer shadow-2xs"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Editar Parámetros & Notas</span>
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-[#faf7f2] text-[#443e35] border border-[#e4dccf] hover:bg-[#f0e9dc] transition-colors cursor-pointer"
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
