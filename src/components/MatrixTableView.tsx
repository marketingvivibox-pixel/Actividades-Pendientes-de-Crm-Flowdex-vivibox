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
  ChevronDown,
  FileText,
  Power,
  FileSearch,
  BadgeAlert,
  ArrowRight,
  Edit3,
  ArrowUp,
  ArrowDown
} from 'lucide-react';
import { CRMTask } from '../types';
import { FOCUS_DEFINITIONS, SEMANTIC_STYLES } from '../data/crmTasksData';

interface MatrixTableViewProps {
  tasks: CRMTask[];
  taskStates: Record<number, boolean>;
  onToggle: (id: number) => void;
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

export const MatrixTableView: React.FC<MatrixTableViewProps> = ({
  tasks,
  taskStates,
  onToggle,
  onEdit,
  onMove,
}) => {
  const [expandedRows, setExpandedRows] = useState<Record<number, boolean>>({});

  const toggleRow = (id: number) => {
    setExpandedRows((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  return (
    <div className="w-full overflow-hidden rounded-2xl border border-[#e5dfd3] bg-white shadow-[0_6px_24px_-4px_rgba(87,70,55,0.06)] transition-all">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-[#e4dccf] bg-[#faf6ee] text-[#6d6152] font-semibold text-[11px] uppercase tracking-wider">
              <th className="py-3.5 px-3 w-16 text-center">Selector</th>
              <th className="py-3.5 px-3 w-14 text-center">#</th>
              <th className="py-3.5 px-3 w-32">Impacto CRM</th>
              <th className="py-3.5 px-3 w-40">Enfoque Funcional</th>
              <th className="py-3.5 px-4 min-w-[280px]">Pendiente Crítico</th>
              <th className="py-3.5 px-3 w-28">Responsable</th>
              <th className="py-3.5 px-3 w-20 text-center">Prioridad</th>
              <th className="py-3.5 px-3 w-24 text-center">Detalles</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#f2ede4]">
            {tasks.map((task) => {
              const isActive = taskStates[task.id] !== false;
              const focus = FOCUS_DEFINITIONS[task.functionalFocus] || FOCUS_DEFINITIONS.protocolo_resuelto;
              const semantic = SEMANTIC_STYLES[task.semanticDomain] || SEMANTIC_STYLES.clarified_closed;
              const IconComp = ICON_MAP[semantic.iconName] || AlertTriangle;
              const isExpanded = !!expandedRows[task.id];

              return (
                <React.Fragment key={task.id}>
                  <tr
                    id={`table-row-task-${task.id}`}
                    className={`transition-all duration-200 ${
                      isActive
                        ? 'bg-white hover:bg-[#faf7f2] text-[#292524]'
                        : 'bg-[#f5efe6]/70 text-[#8c8273] opacity-50 filter grayscale-[70%]'
                    }`}
                    style={{
                      borderLeft: `5px solid ${isActive ? focus.accentHex : '#a8a29e'}`,
                    }}
                  >
                    {/* Selector Switch */}
                    <td className="py-3 px-3 text-center align-middle">
                      <button
                        type="button"
                        onClick={() => onToggle(task.id)}
                        className={`p-1.5 rounded-lg border transition-all cursor-pointer shadow-2xs ${
                          isActive
                            ? 'bg-[#292524] text-amber-300 border-[#292524]'
                            : 'bg-[#ede5d8] text-stone-400 border-[#d7cbba]'
                        }`}
                        title={isActive ? 'Apagar para opacar' : 'Encender'}
                      >
                        <Power className="w-3.5 h-3.5" />
                      </button>
                    </td>

                    {/* # Ticket & Reorder */}
                    <td className="py-3 px-3 text-center align-middle font-mono font-bold">
                      <div className="inline-flex items-center gap-1">
                        {onMove && (
                          <div className="flex flex-col">
                            <button
                              type="button"
                              onClick={() => onMove(task.id, 'up')}
                              className="p-0.5 text-[#8c7860] hover:text-[#292524] hover:bg-[#ede5d8] rounded transition-colors"
                              title="Subir posición"
                            >
                              <ArrowUp className="w-3 h-3" />
                            </button>
                            <button
                              type="button"
                              onClick={() => onMove(task.id, 'down')}
                              className="p-0.5 text-[#8c7860] hover:text-[#292524] hover:bg-[#ede5d8] rounded transition-colors"
                              title="Bajar posición"
                            >
                              <ArrowDown className="w-3 h-3" />
                            </button>
                          </div>
                        )}
                        <span className="px-2 py-0.5 rounded-md text-xs bg-[#f4efe6] text-[#574c3e] border border-[#e5ded2]">
                          #{task.originalNumber < 10 ? `0${task.originalNumber}` : task.originalNumber}
                        </span>
                      </div>
                    </td>

                    {/* Impacto CRM & Score */}
                    <td className="py-3 px-3 align-middle">
                      <div className="flex items-center gap-2">
                        <div className="w-12 h-1.5 rounded-full bg-[#ede6da] overflow-hidden">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-amber-600 to-rose-600"
                            style={{ width: `${Math.max(10, task.criticalityScore)}%` }}
                          />
                        </div>
                        <span className="font-mono font-bold text-xs text-[#292524]">
                          {task.criticalityScore}
                        </span>
                      </div>
                      <span className="text-[10px] text-[#786d5f]">
                        {task.proportionalUnits}x unidades
                      </span>
                    </td>

                    {/* Enfoque Funcional */}
                    <td className="py-3 px-3 align-middle">
                      <span
                        className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg text-xs font-semibold border"
                        style={{
                          backgroundColor: '#faf7f2',
                          borderColor: `${focus.accentHex}40`,
                          color: focus.accentHex,
                        }}
                      >
                        <IconComp className="w-3.5 h-3.5 shrink-0" />
                        <span className="truncate max-w-[120px]">{focus.name}</span>
                      </span>
                    </td>

                    {/* Pendiente Crítico */}
                    <td className="py-3 px-4 align-middle">
                      <div 
                        onClick={() => toggleRow(task.id)}
                        className={`font-semibold text-xs leading-snug cursor-pointer hover:text-amber-800 ${
                          isActive ? 'text-[#1c1917]' : 'line-through text-[#8c8273]'
                        }`}
                      >
                        {task.pendiente}
                      </div>
                    </td>

                    {/* Responsable */}
                    <td className="py-3 px-3 align-middle font-medium text-xs text-[#3d3429]">
                      {task.responsable}
                    </td>

                    {/* Prioridad */}
                    <td className="py-3 px-3 text-center align-middle font-mono font-bold text-xs">
                      <span className={`px-2 py-0.5 rounded ${
                        task.prioridad === 'Alta'
                          ? 'bg-rose-100 text-rose-800'
                          : task.prioridad === 'Media'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-stone-100 text-stone-700'
                      }`}>
                        {task.prioridad}
                      </span>
                    </td>

                    {/* Acciones: Editar y Menú Desplegable */}
                    <td className="py-3 px-3 text-center align-middle">
                      <div className="inline-flex items-center gap-1.5">
                        {onEdit && (
                          <button
                            type="button"
                            onClick={() => onEdit(task)}
                            className="p-1.5 rounded-lg text-[#8c7860] hover:text-[#292524] hover:bg-[#ede5d8] border border-[#e4dccf] transition-all cursor-pointer shadow-2xs"
                            title="Editar parámetros, observaciones y prioridad"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => toggleRow(task.id)}
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                            isExpanded
                              ? 'bg-[#292524] text-white border-[#292524]'
                              : 'bg-[#faf7f2] text-[#6d6152] border-[#e4dccf] hover:bg-[#f0e9dc]'
                          }`}
                        >
                          <span>{isExpanded ? 'Cerrar' : 'Detalle'}</span>
                          <ChevronDown className={`w-3 h-3 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                        </button>
                      </div>
                    </td>
                  </tr>

                  {/* Fila Desplegada con Jerarquía Limpia y Profunda */}
                  {isExpanded && (
                    <tr className="bg-[#fcfaf7]">
                      <td colSpan={8} className="p-4 border-l-4 border-l-[#a87943]">
                        <div className="space-y-2.5">
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                            {/* Bloque 1 */}
                            <div className="p-3 rounded-xl bg-white border border-[#e8ded0]">
                              <div className="flex items-center gap-1.5 font-bold text-[#b45309] mb-1 text-[11px] uppercase tracking-wider font-mono">
                                <FileSearch className="w-3.5 h-3.5" />
                                <span>1. Evidencia en Reunión (10/09/2026):</span>
                              </div>
                              <p className="text-[#4a3f33] italic leading-relaxed text-xs">
                                "{task.detalleEvidencia}"
                              </p>
                            </div>

                            {/* Bloque 2 */}
                            <div className="p-3 rounded-xl bg-[#fff7f5] border border-[#f5ded7] border-l-2 border-l-rose-500">
                              <div className="flex items-center gap-1.5 font-bold text-[#b91c1c] mb-1 text-[11px] uppercase tracking-wider font-mono">
                                <BadgeAlert className="w-3.5 h-3.5" />
                                <span>2. Impacto Crítico en CRM:</span>
                              </div>
                              <p className="text-[#45271f] leading-relaxed text-xs">
                                {task.impactoIndispensableCRM}
                              </p>
                            </div>

                            {/* Bloque 3 */}
                            <div className="p-3 rounded-xl bg-[#f2f8f5] border border-[#d5e6df] border-l-2 border-l-teal-600">
                              <div className="flex items-center gap-1.5 font-bold text-[#0f766e] mb-1 text-[11px] uppercase tracking-wider font-mono">
                                <ArrowRight className="w-3.5 h-3.5" />
                                <span>3. Acción y Protocolo Acordado:</span>
                              </div>
                              <p className="text-[#1a443c] font-semibold leading-relaxed text-xs">
                                {task.accionAcordada}
                              </p>
                            </div>
                          </div>

                          {/* Metadatos adicionales */}
                          <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 rounded-lg bg-[#f7f3eb] text-[11px] text-[#574d3f]">
                            <div>
                              <span className="text-[#8c7f6f]">Categoría CRM:</span>{' '}
                              <strong className="text-[#292524]">{task.categoria}</strong>
                            </div>
                            <div>
                              <span className="text-[#8c7f6f]">Estado de Solución:</span>{' '}
                              <strong className="text-[#292524]">{task.estado}</strong>
                            </div>
                            <div>
                              <span className="text-[#8c7f6f]">Afectación Comercial:</span>{' '}
                              <strong>{task.afectaVentasDirectas ? 'Impacta Ventas Directas' : 'Estabilidad Interna'}</strong>
                            </div>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
