import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  Save, 
  Plus, 
  Flame, 
  User, 
  AlertTriangle, 
  Layers, 
  FileText, 
  CheckCircle2, 
  Sparkles,
  Sliders,
  ShieldAlert,
  HelpCircle
} from 'lucide-react';
import { CRMTask, TaskCategory, TaskPriority, TaskStatus, FunctionalFocus, ConnectedSpreadsheet } from '../types';
import { FOCUS_DEFINITIONS } from '../data/crmTasksData';

interface TaskEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  taskToEdit?: CRMTask | null; // null if creating a new task
  onSave: (task: CRMTask) => void;
  nextId: number;
  connectedSheet?: ConnectedSpreadsheet | null;
}

const CATEGORIES: TaskCategory[] = [
  'Bug',
  'Cambio acordado',
  'En investigación',
  'Configuración',
  'Aclarado',
];

const PRIORITIES: TaskPriority[] = ['Alta', 'Media', 'Baja', '—'];

const STATUSES: TaskStatus[] = [
  'En corrección',
  'Por revisar',
  'Pendiente',
  'Pendiente respuesta',
  'En desarrollo',
  'En investigación',
  'Cerrado',
];

const COMMON_RESPONSIBLES = [
  'Alex (Software Factory)',
  'Freddy (Jefe Ventas)',
  'Antoinette (Procesos TI)',
  'Jose Carlos (Meta Ads)',
  'Rodrigo y Claudio (Piloto)',
  'TI & Infraestructura',
  'Equipo Producto CRM',
];

export const TaskEditModal: React.FC<TaskEditModalProps> = ({
  isOpen,
  onClose,
  taskToEdit,
  onSave,
  nextId,
  connectedSheet,
}) => {
  const isEditing = !!taskToEdit;

  // Form states
  const [originalNumber, setOriginalNumber] = useState<number>(nextId);
  const [pendiente, setPendiente] = useState('');
  const [categoria, setCategoria] = useState<TaskCategory>('Bug');
  const [prioridad, setPrioridad] = useState<TaskPriority>('Alta');
  const [estado, setEstado] = useState<TaskStatus>('Pendiente');
  const [responsable, setResponsable] = useState('Alex (Software Factory)');
  const [customResponsable, setCustomResponsable] = useState('');
  const [functionalFocus, setFunctionalFocus] = useState<FunctionalFocus>('infraestructura');
  const [criticalityScore, setCriticalityScore] = useState<number>(85);
  const [detalleEvidencia, setDetalleEvidencia] = useState('');
  const [accionAcordada, setAccionAcordada] = useState('');
  const [riesgoNegocio, setRiesgoNegocio] = useState('');
  const [impactoIndispensableCRM, setImpactoIndispensableCRM] = useState('');
  const [afectaVentasDirectas, setAfectaVentasDirectas] = useState(true);
  const [afectaEstabilidadTecnica, setAfectaEstabilidadTecnica] = useState(true);

  // Populate fields when taskToEdit changes
  useEffect(() => {
    if (taskToEdit) {
      setOriginalNumber(taskToEdit.originalNumber);
      setPendiente(taskToEdit.pendiente);
      setCategoria(taskToEdit.categoria);
      setPrioridad(taskToEdit.prioridad);
      setEstado(taskToEdit.estado);
      if (COMMON_RESPONSIBLES.includes(taskToEdit.responsable)) {
        setResponsable(taskToEdit.responsable);
        setCustomResponsable('');
      } else {
        setResponsable('Otro');
        setCustomResponsable(taskToEdit.responsable);
      }
      setFunctionalFocus(taskToEdit.functionalFocus);
      setCriticalityScore(taskToEdit.criticalityScore);
      setDetalleEvidencia(taskToEdit.detalleEvidencia);
      setAccionAcordada(taskToEdit.accionAcordada);
      setRiesgoNegocio(taskToEdit.riesgoNegocio);
      setImpactoIndispensableCRM(taskToEdit.impactoIndispensableCRM);
      setAfectaVentasDirectas(taskToEdit.afectaVentasDirectas);
      setAfectaEstabilidadTecnica(taskToEdit.afectaEstabilidadTecnica);
    } else {
      // Defaults for new task
      setOriginalNumber(nextId);
      setPendiente('');
      setCategoria('Bug');
      setPrioridad('Alta');
      setEstado('Pendiente');
      setResponsable('Alex (Software Factory)');
      setCustomResponsable('');
      setFunctionalFocus('infraestructura');
      setCriticalityScore(80);
      setDetalleEvidencia('');
      setAccionAcordada('');
      setRiesgoNegocio('');
      setImpactoIndispensableCRM('');
      setAfectaVentasDirectas(true);
      setAfectaEstabilidadTecnica(true);
    }
  }, [taskToEdit, nextId, isOpen]);

  // Derive criticality tier
  const getCriticalityTier = (score: number) => {
    if (score >= 90) return 'CRÍTICO BLOQUEANTE';
    if (score >= 75) return 'ALTO RIESGO OPERATIVO';
    if (score >= 60) return 'IMPACTO MEDIO / FLUJO';
    if (score >= 45) return 'INVESTIGACIÓN & I+D';
    if (score >= 25) return 'BAJO / SIN IMPACTO';
    return 'RESUELTO / OPERATIVO';
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pendiente.trim()) return;

    const finalResponsable = responsable === 'Otro' ? (customResponsable.trim() || 'No asignado') : responsable;
    const finalTier = getCriticalityTier(criticalityScore);
    const proportionalUnits = criticalityScore >= 90 ? 4 : criticalityScore >= 75 ? 3 : criticalityScore >= 60 ? 2 : 1;

    const taskData: CRMTask = {
      id: taskToEdit ? taskToEdit.id : nextId,
      originalNumber,
      categoria,
      pendiente: pendiente.trim(),
      detalleEvidencia: detalleEvidencia.trim() || 'Ajuste acordado durante la sesión de trabajo.',
      accionAcordada: accionAcordada.trim() || 'Por definir protocolo de solución con el equipo.',
      responsable: finalResponsable,
      prioridad,
      estado,
      criticalityScore,
      criticalityTier: finalTier,
      proportionalUnits,
      functionalFocus,
      semanticDomain: taskToEdit ? taskToEdit.semanticDomain : 'queue_infrastructure',
      semanticDomainName: FOCUS_DEFINITIONS[functionalFocus]?.name || 'Operación CRM',
      impactoIndispensableCRM: impactoIndispensableCRM.trim() || 'Afecta la continuidad del flujo operativo.',
      riesgoNegocio: riesgoNegocio.trim() || 'Riesgo operativo reportado en mesa de trabajo.',
      afectaVentasDirectas,
      afectaEstabilidadTecnica,
    };

    onSave(taskData);
    onClose();
  };

  if (!isOpen) return null;

  const currentFocus = FOCUS_DEFINITIONS[functionalFocus];

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 overflow-y-auto bg-black/60 backdrop-blur-xs">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 12 }}
          transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
          className="relative w-full max-w-3xl bg-white rounded-3xl border border-[#e4dccf] shadow-2xl overflow-hidden flex flex-col max-h-[92vh]"
          style={{
            borderTopWidth: '6px',
            borderTopColor: currentFocus?.accentHex || '#a87943',
          }}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 sm:p-5 border-b border-[#ece4d6] bg-gradient-to-r from-[#faf7f2] to-white">
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-2xl flex items-center justify-center text-white shadow-md"
                style={{ backgroundColor: currentFocus?.accentHex || '#a87943' }}
              >
                {isEditing ? <Sliders className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-serif-warm font-bold text-lg text-[#1c1917]">
                    {isEditing ? `Editar Pendiente #${originalNumber}` : 'Agregar Nuevo Pendiente para la Reunión'}
                  </h3>
                  <span
                    className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold"
                    style={{
                      backgroundColor: currentFocus?.badgeBgLight,
                      color: currentFocus?.badgeTextLight,
                      border: `1px solid ${currentFocus?.borderAccentLight}`,
                    }}
                  >
                    {currentFocus?.name}
                  </span>
                </div>
                <p className="text-xs text-[#786d5f]">
                  Ajusta parámetros, acuerdos técnicos, responsable, observaciones y prioridad en vivo.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl text-[#78716c] hover:bg-[#f2ece2] hover:text-[#1c1917] transition-all cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-5 sm:p-6 overflow-y-auto flex-1 space-y-4 text-xs text-[#292524]">
            {/* Auto-Sync Banner with Connected Sheet */}
            {connectedSheet && (
              <div className="p-3 rounded-2xl bg-emerald-50/90 border border-emerald-200 text-emerald-950 text-xs flex items-center justify-between gap-3 shadow-2xs">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                  <span className="truncate">
                    <strong>Sincronización activa con Google Sheets:</strong> Al guardar este pendiente, se actualizará automáticamente en <em>"{connectedSheet.spreadsheetTitle}"</em> ({connectedSheet.sheetTabName}).
                  </span>
                </div>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-200/80 text-emerald-900 border border-emerald-300 shrink-0">
                  {connectedSheet.autoSync ? 'Auto-Sync Activo' : 'Vinculado'}
                </span>
              </div>
            )}

            {/* Row 1: Title & Ticket Number */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <div className="sm:col-span-1">
                <label className="block text-[11px] font-bold uppercase tracking-wider text-[#786d5f] mb-1">
                  N° Ticket / Orden
                </label>
                <input
                  type="number"
                  min="1"
                  max="999"
                  value={originalNumber}
                  onChange={(e) => setOriginalNumber(parseInt(e.target.value) || 1)}
                  className="w-full px-3 py-2 rounded-xl border border-[#d6cbba] bg-[#faf8f4] font-mono font-bold text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-600/30"
                />
              </div>

              <div className="sm:col-span-3">
                <label className="block text-[11px] font-bold uppercase tracking-wider text-[#786d5f] mb-1">
                  Pendiente / Título del Asunto *
                </label>
                <input
                  type="text"
                  required
                  value={pendiente}
                  onChange={(e) => setPendiente(e.target.value)}
                  placeholder="Ej: Falla en audio de WhatsApp en navegadores móviles..."
                  className="w-full px-3.5 py-2 rounded-xl border border-[#d6cbba] bg-[#faf8f4] text-xs font-semibold focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-600/30"
                />
              </div>
            </div>

            {/* Row 2: Priority, Status, Category, Focus */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-[#786d5f] mb-1">
                  Prioridad
                </label>
                <select
                  value={prioridad}
                  onChange={(e) => setPrioridad(e.target.value as TaskPriority)}
                  className="w-full px-3 py-2 rounded-xl border border-[#d6cbba] bg-white text-xs font-bold"
                >
                  {PRIORITIES.map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#786d5f] mb-1">
                  Estado
                </label>
                <select
                  value={estado}
                  onChange={(e) => setEstado(e.target.value as TaskStatus)}
                  className="w-full px-3 py-2 rounded-xl border border-[#d6cbba] bg-white text-xs font-bold"
                >
                  {STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#786d5f] mb-1">
                  Categoría
                </label>
                <select
                  value={categoria}
                  onChange={(e) => setCategoria(e.target.value as TaskCategory)}
                  className="w-full px-3 py-2 rounded-xl border border-[#d6cbba] bg-white text-xs font-semibold"
                >
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#786d5f] mb-1">
                  Foco Funcional
                </label>
                <select
                  value={functionalFocus}
                  onChange={(e) => setFunctionalFocus(e.target.value as FunctionalFocus)}
                  className="w-full px-3 py-2 rounded-xl border border-[#d6cbba] bg-white text-xs font-semibold"
                >
                  {Object.entries(FOCUS_DEFINITIONS).map(([key, def]) => (
                    <option key={key} value={key}>
                      {def.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Row 3: Criticality Score (0 - 100) */}
            <div className="p-3.5 rounded-2xl bg-[#faf7f2] border border-[#e8dfd2] space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs flex items-center gap-1.5 text-[#3c342a]">
                  <Flame className="w-4 h-4 text-rose-600" />
                  Nivel de Criticidad CRM: {criticalityScore}/100 pts
                </span>
                <span className="font-bold text-xs px-2.5 py-0.5 rounded-md bg-white border border-[#e0d6c7] text-rose-800">
                  {getCriticalityTier(criticalityScore)}
                </span>
              </div>
              <input
                type="range"
                min="10"
                max="100"
                step="1"
                value={criticalityScore}
                onChange={(e) => setCriticalityScore(parseInt(e.target.value) || 50)}
                className="w-full accent-rose-600 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-[#8c7f6f] font-mono">
                <span>0 (Resuelto)</span>
                <span>50 (Impacto Medio)</span>
                <span>80 (Alto Riesgo)</span>
                <span>100 (Bloqueante)</span>
              </div>
            </div>

            {/* Row 4: Responsible */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-[#786d5f] mb-1">
                  Responsable Asignado
                </label>
                <select
                  value={responsable}
                  onChange={(e) => setResponsable(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-[#d6cbba] bg-white text-xs font-semibold"
                >
                  {COMMON_RESPONSIBLES.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                  <option value="Otro">Otro responsable...</option>
                </select>
              </div>

              {responsable === 'Otro' && (
                <div>
                  <label className="block text-[11px] font-bold text-[#786d5f] mb-1">
                    Nombre del Responsable
                  </label>
                  <input
                    type="text"
                    value={customResponsable}
                    onChange={(e) => setCustomResponsable(e.target.value)}
                    placeholder="Ej. Carolina (Atención al Cliente)"
                    className="w-full px-3 py-2 rounded-xl border border-[#d6cbba] bg-white text-xs font-semibold"
                  />
                </div>
              )}
            </div>

            {/* Row 5: Observaciones / Detalle Evidencia (Reunión) */}
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-[#786d5f] mb-1">
                Observaciones y Evidencia de la Reunión
              </label>
              <textarea
                rows={2}
                value={detalleEvidencia}
                onChange={(e) => setDetalleEvidencia(e.target.value)}
                placeholder="Cita textual de los participantes o detalle de la prueba piloto..."
                className="w-full px-3.5 py-2 rounded-xl border border-[#d6cbba] bg-[#faf8f4] text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-600/30 leading-relaxed"
              />
            </div>

            {/* Row 6: Acción Acordada (Protocolo Técnico / Solución) */}
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-[#786d5f] mb-1">
                Acción Acordada / Protocolo de Solución
              </label>
              <textarea
                rows={2}
                value={accionAcordada}
                onChange={(e) => setAccionAcordada(e.target.value)}
                placeholder="Qué se acordó hacer, quién lo ejecuta y cómo se valida..."
                className="w-full px-3.5 py-2 rounded-xl border border-[#d6cbba] bg-[#faf8f4] text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-600/30 leading-relaxed font-medium"
              />
            </div>

            {/* Row 7: Riesgo e Impacto */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-[#786d5f] mb-1">
                  Riesgo de Negocio
                </label>
                <input
                  type="text"
                  value={riesgoNegocio}
                  onChange={(e) => setRiesgoNegocio(e.target.value)}
                  placeholder="Ej. Fuga de leads por retraso en cola..."
                  className="w-full px-3 py-2 rounded-xl border border-[#d6cbba] bg-[#faf8f4] text-xs"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#786d5f] mb-1">
                  Impacto en CRM
                </label>
                <input
                  type="text"
                  value={impactoIndispensableCRM}
                  onChange={(e) => setImpactoIndispensableCRM(e.target.value)}
                  placeholder="Ej. Parálisis en el flujo de asignación..."
                  className="w-full px-3 py-2 rounded-xl border border-[#d6cbba] bg-[#faf8f4] text-xs"
                />
              </div>
            </div>

            {/* Checkboxes: Flags */}
            <div className="flex flex-wrap items-center gap-4 pt-1">
              <label className="inline-flex items-center gap-2 cursor-pointer text-xs font-medium text-[#443e35]">
                <input
                  type="checkbox"
                  checked={afectaVentasDirectas}
                  onChange={(e) => setAfectaVentasDirectas(e.target.checked)}
                  className="rounded border-[#d6cbba] text-rose-600 focus:ring-rose-500 w-4 h-4"
                />
                <span>Afecta Ventas Directas / Asesores</span>
              </label>

              <label className="inline-flex items-center gap-2 cursor-pointer text-xs font-medium text-[#443e35]">
                <input
                  type="checkbox"
                  checked={afectaEstabilidadTecnica}
                  onChange={(e) => setAfectaEstabilidadTecnica(e.target.checked)}
                  className="rounded border-[#d6cbba] text-amber-600 focus:ring-amber-500 w-4 h-4"
                />
                <span>Afecta Estabilidad Técnica / Servidor</span>
              </label>
            </div>

            {/* Footer Buttons */}
            <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-[#ece4d6]">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-[#faf7f2] hover:bg-[#ede5d8] border border-[#e4dccf] text-[#574d3f] transition-all cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl text-xs font-bold bg-[#292524] hover:bg-[#44403c] text-white shadow-md transition-all cursor-pointer"
              >
                <Save className="w-3.5 h-3.5 text-amber-400" />
                <span>{isEditing ? 'Guardar Cambios' : 'Agregar a la Mesa de Trabajo'}</span>
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
