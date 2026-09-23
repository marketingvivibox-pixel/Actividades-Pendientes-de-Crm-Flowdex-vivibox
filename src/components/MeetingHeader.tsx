import React, { useState } from 'react';
import { 
  Users, 
  Calendar, 
  FileText,
  Palette,
  ChevronsUpDown,
  Compass,
  Power,
  PowerOff,
  ChevronDown,
  Info,
  FileSpreadsheet,
  Plus,
  RotateCcw,
  RefreshCw,
  ExternalLink
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { MEETING_PARTICIPANTS } from '../data/crmTasksData';
import { ConnectedSpreadsheet } from '../types';
import { TeamMember } from './TeamAuthModal';

interface MeetingHeaderProps {
  onToggleAll: (activate: boolean) => void;
  onOpenLegend: () => void;
  onOpenSummary: () => void;
  onOpenSheets: () => void;
  onAddNewTask?: () => void;
  onResetTasks?: () => void;
  activeCount: number;
  totalCount: number;
  allExpanded: boolean;
  onToggleAllExpanded: () => void;
  connectedSheet?: ConnectedSpreadsheet | null;
  onTriggerSync?: () => void;
  onPullSync?: () => void;
  isSyncing?: boolean;
  teamUser?: TeamMember | null;
  onOpenAuth?: () => void;
}

export const MeetingHeader: React.FC<MeetingHeaderProps> = ({
  onToggleAll,
  onOpenLegend,
  onOpenSummary,
  onOpenSheets,
  onAddNewTask,
  onResetTasks,
  activeCount,
  totalCount,
  allExpanded,
  onToggleAllExpanded,
  connectedSheet,
  onTriggerSync,
  onPullSync,
  isSyncing = false,
  teamUser,
  onOpenAuth,
}) => {
  const [showDetails, setShowDetails] = useState(false);

  return (
    <motion.header
      initial={{ opacity: 0, y: -16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      className="relative w-full rounded-3xl border border-[#e4dccf] bg-white p-5 sm:p-6 shadow-[0_8px_30px_-6px_rgba(87,70,55,0.06)] mb-5 transition-all"
    >
      {/* Ambient warm glow */}
      <div className="absolute top-0 right-0 w-80 h-80 bg-[#fbf6ee] rounded-full blur-3xl pointer-events-none -z-0 opacity-60" />

      <div className="relative z-10">
        {/* Top Control Bar: Badges + Action Buttons */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#f5efe6] border border-[#e4dcce] text-[#574a3b]">
              <Compass className="w-3.5 h-3.5 text-[#a87943]" />
              CRM WhatsApp Call Center
            </span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-[#edf6f1] border border-[#cbe4d6] text-[#1c5d3d]">
              <span className="w-2 h-2 rounded-full bg-[#10b981]" />
              {activeCount} de {totalCount} Activos
            </span>
          </div>

          {/* Quick Action Toolbar */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Global Expand / Collapse Accordion Toggle */}
            <button
              type="button"
              onClick={onToggleAllExpanded}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer shadow-2xs ${
                allExpanded
                  ? 'bg-[#292524] text-white border-[#292524] hover:bg-[#44403c]'
                  : 'bg-[#faf7f2] hover:bg-[#ede5d8] text-[#574d3f] border-[#e2d8c9]'
              }`}
              title="Expandir u ocultar todos los menús desplegables de detalle de los módulos"
            >
              <ChevronsUpDown className="w-3.5 h-3.5 text-amber-500" />
              <span>{allExpanded ? 'Colapsar Módulos' : 'Expandir Módulos'}</span>
            </button>

            {/* Toggle Participants and Meeting Context */}
            <button
              type="button"
              onClick={() => setShowDetails(!showDetails)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer shadow-2xs ${
                showDetails
                  ? 'bg-[#ede5d8] text-[#292524] border-[#d5c7b3]'
                  : 'bg-[#faf7f2] hover:bg-[#f0e9dc] text-[#574c3e] border-[#e4dcce]'
              }`}
            >
              <Users className="w-3.5 h-3.5 text-[#a87943]" />
              <span>Minuta & Participantes</span>
              <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showDetails ? 'rotate-180 text-amber-700' : 'text-[#8c7860]'}`} />
            </button>

            {/* Theory of Color / Enfoques Modal */}
            <button
              id="btn-open-legend"
              type="button"
              onClick={onOpenLegend}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-[#faf7f2] hover:bg-[#f0e9dc] text-[#574c3e] border border-[#e4dcce] transition-all cursor-pointer shadow-2xs"
            >
              <Palette className="w-3.5 h-3.5 text-[#a87943]" />
              <span className="hidden sm:inline">Enfoques</span> Color
            </button>

            {/* Executive Report Modal */}
            <button
              id="btn-open-summary"
              type="button"
              onClick={onOpenSummary}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-[#faf7f2] hover:bg-[#f0e9dc] text-[#574c3e] border border-[#e4dcce] transition-all cursor-pointer shadow-2xs"
            >
              <FileText className="w-3.5 h-3.5 text-[#52796f]" />
              <span>Reporte</span>
            </button>

            {/* Google Sheets Workspace Integration & Bidirectional Sync */}
            {connectedSheet ? (
              <div className="inline-flex items-center gap-1 bg-emerald-50/90 border border-emerald-300 rounded-xl p-0.5 shadow-2xs">
                <button
                  id="btn-open-sheets"
                  type="button"
                  onClick={onOpenSheets}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold text-emerald-950 hover:text-emerald-800 transition-all cursor-pointer max-w-[140px] sm:max-w-[180px]"
                  title={`Hoja vinculada: ${connectedSheet.spreadsheetTitle} (${connectedSheet.sheetTabName}). Clic para ver opciones de sincronización.`}
                >
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                  <span className="truncate">{connectedSheet.spreadsheetTitle}</span>
                </button>

                {/* Bidirectional Sync: Pull from Google Sheets */}
                {onPullSync && (
                  <button
                    type="button"
                    onClick={onPullSync}
                    disabled={isSyncing}
                    className="p-1 rounded-lg text-emerald-800 hover:bg-emerald-200/70 transition-all cursor-pointer disabled:opacity-40"
                    title="Traer últimas modificaciones desde Google Sheets (Sincronización Bidireccional)"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin text-emerald-600' : ''}`} />
                  </button>
                )}

                {connectedSheet.spreadsheetUrl && (
                  <a
                    href={connectedSheet.spreadsheetUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="p-1 rounded-lg text-emerald-700 hover:text-emerald-950 hover:bg-emerald-200/70 transition-all cursor-pointer"
                    title="Abrir hoja de cálculo directamente en Google Drive"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                )}
              </div>
            ) : (
              <button
                id="btn-open-sheets"
                type="button"
                onClick={onOpenSheets}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-300 transition-all cursor-pointer shadow-2xs"
                title="Exportar y sincronizar con Google Sheets"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-700" />
                <span>Google Sheets</span>
              </button>
            )}

            {/* Team User Account / Identification for Collaborative Edits */}
            {onOpenAuth && (
              <button
                type="button"
                onClick={onOpenAuth}
                className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer shadow-2xs ${
                  teamUser
                    ? 'bg-white hover:bg-stone-50 text-[#1c1917] border-[#d5c7b3]'
                    : 'bg-amber-50 hover:bg-amber-100 text-amber-900 border-amber-300 animate-pulse'
                }`}
                title="Perfil de equipo para registrar modificaciones en el documento"
              >
                {teamUser ? (
                  <>
                    <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                    <span className="truncate max-w-[130px] sm:max-w-[160px] font-mono">{teamUser.email}</span>
                  </>
                ) : (
                  <>
                    <Users className="w-3.5 h-3.5 text-amber-700" />
                    <span>Ingresar Correo</span>
                  </>
                )}
              </button>
            )}

            {/* Add New Task for Meeting Adjustments */}
            {onAddNewTask && (
              <button
                id="btn-add-task-header"
                type="button"
                onClick={onAddNewTask}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold bg-[#292524] hover:bg-[#44403c] text-amber-300 border border-[#292524] transition-all cursor-pointer shadow-2xs"
                title="Agregar nuevo pendiente para ajuste en la reunión"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Pendiente</span>
              </button>
            )}

            {/* Reset to Original Meeting Tasks */}
            {onResetTasks && (
              <button
                id="btn-reset-tasks"
                type="button"
                onClick={onResetTasks}
                className="p-1.5 rounded-xl text-[#8c7860] hover:text-[#292524] hover:bg-[#ede5d8] transition-all cursor-pointer"
                title="Restablecer a los 18 pendientes originales de la reunión"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            )}

            {/* Turn Off / On All Selectors */}
            <div className="flex items-center gap-1 pl-1 border-l border-[#e8dfd3]">
              <button
                id="btn-turn-off-all"
                type="button"
                onClick={() => onToggleAll(false)}
                className="px-2.5 py-1.5 rounded-lg text-xs font-medium text-[#78716c] hover:bg-[#f4eee4] transition-all cursor-pointer"
                title="Apagar todos"
              >
                <PowerOff className="w-3.5 h-3.5" />
              </button>

              <button
                id="btn-turn-on-all"
                type="button"
                onClick={() => onToggleAll(true)}
                className="px-2.5 py-1.5 rounded-lg text-xs font-bold bg-[#292524] hover:bg-[#44403c] text-[#f6f3ed] transition-all cursor-pointer"
                title="Encender todos"
              >
                <Power className="w-3.5 h-3.5 text-amber-400" />
              </button>
            </div>
          </div>
        </div>

        {/* Title and Short Clean Editorial Headline */}
        <div>
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold tracking-tight text-[#1c1917] font-serif-warm flex flex-wrap items-center gap-2">
            <span>Matriz de Priorización Operativa</span>
            <span className="text-[#a87943] font-normal italic text-lg sm:text-xl">
              CRM WhatsApp
            </span>
          </h1>
          <p className="text-xs sm:text-sm text-[#6d6152] mt-1 max-w-3xl leading-relaxed">
            Puntos ordenados por <strong>impacto indispensable</strong> en el CRM. La información detallada 
            se encuentra oculta en cada tarjeta para mantener la interfaz despejada y puede desplegarse en cualquier momento.
          </p>
        </div>

        {/* Expandable Panel: Participants & Meeting Context */}
        <AnimatePresence>
          {showDetails && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
              className="overflow-hidden mt-4 pt-4 border-t border-[#f0eae0]"
            >
              <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-[#8c7860] mb-3 font-semibold">
                <Users className="w-3.5 h-3.5 text-[#a87943]" />
                <span>Participantes de la Mesa de Trabajo (Reunión 10/09/2026):</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5 mb-3">
                {MEETING_PARTICIPANTS.map((p, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-2.5 p-2.5 rounded-xl bg-[#faf7f2] border border-[#ebe3d5] hover:border-[#dfd4c3] transition-all"
                  >
                    <div
                      className={`w-7 h-7 rounded-lg bg-gradient-to-br ${p.avatarColor} flex items-center justify-center text-xs font-bold text-white shadow-2xs shrink-0`}
                    >
                      {p.nombre.slice(0, 2).toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="font-bold text-xs truncate text-[#292524]">
                        {p.nombre}
                      </div>
                      <div className="text-[10px] truncate text-[#786d5f]">
                        {p.rol}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="p-3 rounded-xl bg-[#faf7f0] border border-[#e8dfd2] text-xs text-[#574d3f] flex items-start gap-2">
                <Info className="w-4 h-4 text-[#a87943] shrink-0 mt-0.5" />
                <span>
                  <strong>Alcance de la sesión:</strong> Evaluación de 18 puntos críticos detectados durante la prueba piloto con 30+ asesores del call center. Alex (Software Factory) lidera la arquitectura técnica y Freddy (Ventas) supervisa la asignación comercial y de comisiones.
                </span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.header>
  );
};
