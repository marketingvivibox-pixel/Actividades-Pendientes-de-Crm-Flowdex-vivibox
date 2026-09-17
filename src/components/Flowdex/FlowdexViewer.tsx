import React, { useState, useEffect, useRef } from 'react';
import { FlowdexDocument, FlowdexDocId } from '../../types';
import { flowdexDocumentsList } from '../../data/flowdexDocs';
import {
  FileText,
  Clock,
  Layers,
  Save,
  Check,
  AlertTriangle,
  Upload,
  Copy,
  Printer,
  Edit3,
  Search,
  BookOpen,
  Info,
  ShieldCheck,
  ExternalLink,
  Maximize2
} from 'lucide-react';
import { PoliticaIntegralFullScreen } from './PoliticaIntegralFullScreen';

interface FlowdexViewerProps {
  searchQuery: string;
}

export const FlowdexViewer: React.FC<FlowdexViewerProps> = ({ searchQuery }) => {
  const [documents, setDocuments] = useState<FlowdexDocument[]>(() => {
    const saved = localStorage.getItem('vivibox_flowdex_documents_v2');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return flowdexDocumentsList;
      }
    }
    return flowdexDocumentsList;
  });

  const [activeDocId, setActiveDocId] = useState<FlowdexDocId>('politica-sla-asignacion');
  const [isEditable, setIsEditable] = useState<boolean>(false);
  const [hasChanges, setHasChanges] = useState<boolean>(false);
  const [isFullScreenModalOpen, setIsFullScreenModalOpen] = useState<boolean>(false);
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'info' | 'error' } | null>(null);
  const [activeTab, setActiveTab] = useState<'documento' | 'calculadora_sla'>('documento');

  // New document import modal
  const [showImportModal, setShowImportModal] = useState<boolean>(false);
  const [newDocTitle, setNewDocTitle] = useState<string>('');
  const [newDocSubtitle, setNewDocSubtitle] = useState<string>('');
  const [newDocCategory, setNewDocCategory] = useState<'Politicas' | 'Manuales' | 'Operaciones'>('Operaciones');
  const [newDocHTML, setNewDocHTML] = useState<string>('');

  // SLA interactive simulator
  const [simPriority, setSimPriority] = useState<'P1' | 'P2' | 'P3' | 'P4'>('P1');
  const [simTime, setSimTime] = useState<string>('10:30');

  const contentRef = useRef<HTMLDivElement>(null);

  const currentDoc = documents.find((d) => d.id === activeDocId) || documents[0];

  // Save to local storage whenever documents change
  useEffect(() => {
    localStorage.setItem('vivibox_flowdex_documents', JSON.stringify(documents));
  }, [documents]);

  const showToast = (message: string, type: 'success' | 'info' | 'error' = 'success') => {
    setNotification({ message, type });
    setTimeout(() => {
      setNotification(null);
    }, 3500);
  };

  const handleContentInput = () => {
    if (!hasChanges) {
      setHasChanges(true);
    }
  };

  const handleSaveChanges = () => {
    if (contentRef.current) {
      const updatedHTML = contentRef.current.innerHTML;
      setDocuments((prev) =>
        prev.map((d) => (d.id === activeDocId ? { ...d, htmlContent: updatedHTML, updatedAt: new Date().toISOString().split('T')[0] } : d))
      );
      setHasChanges(false);
      showToast('✅ Cambios guardados correctamente en la política Flowdex', 'success');
    }
  };

  const handleResetCurrentDoc = () => {
    const original = flowdexDocumentsList.find((d) => d.id === activeDocId);
    if (original) {
      setDocuments((prev) => prev.map((d) => (d.id === activeDocId ? original : d)));
      setHasChanges(false);
      showToast('Documento restaurado a su versión oficial original.', 'info');
    }
  };

  const handleCopyHTML = () => {
    if (contentRef.current) {
      navigator.clipboard.writeText(contentRef.current.innerHTML);
      showToast('HTML copiado al portapapeles con éxito.', 'success');
    }
  };

  const handleImportSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDocTitle.trim() || !newDocHTML.trim()) {
      showToast('Por favor completa el título y el código HTML.', 'error');
      return;
    }

    const newId = `doc-${Date.now()}` as FlowdexDocId;
    const newDoc: FlowdexDocument = {
      id: newId,
      title: newDocTitle.trim(),
      subtitle: newDocSubtitle.trim() || 'Documento complementario de Flowdex',
      version: '1.0',
      year: '2026',
      category: newDocCategory,
      updatedAt: new Date().toISOString().split('T')[0],
      htmlContent: newDocHTML,
    };

    setDocuments((prev) => [...prev, newDoc]);
    setActiveDocId(newId);
    setShowImportModal(false);
    setNewDocTitle('');
    setNewDocSubtitle('');
    setNewDocHTML('');
    showToast(`Nuevo documento "${newDoc.title}" agregado a Flowdex.`, 'success');
  };

  // SLA simulator calculations
  const getSLAMinutes = (p: string) => {
    switch (p) {
      case 'P1':
        return 5;
      case 'P2':
        return 5;
      case 'P3':
        return 15;
      case 'P4':
        return 30;
      default:
        return 5;
    }
  };

  const slaMinutes = getSLAMinutes(simPriority);

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {notification && (
        <div
          className={`fixed top-20 right-6 z-50 px-4 py-3 rounded-xl shadow-lg border text-sm font-semibold flex items-center gap-2 animate-in slide-in-from-top-4 duration-200 ${
            notification.type === 'success'
              ? 'bg-emerald-600 text-white border-emerald-700'
              : notification.type === 'error'
              ? 'bg-rose-600 text-white border-rose-700'
              : 'bg-indigo-600 text-white border-indigo-700'
          }`}
        >
          {notification.message}
        </div>
      )}

      {/* Floating Save Bar */}
      {hasChanges && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 bg-[#18181b] text-white px-5 py-3 rounded-full shadow-2xl hover:bg-[#ed1c24] transition-all cursor-pointer border border-white/20 animate-in slide-in-from-bottom-4">
          <span className="text-xs font-semibold">Hay modificaciones sin guardar en Flowdex</span>
          <button
            onClick={handleSaveChanges}
            className="flex items-center gap-1.5 px-3 py-1 bg-white text-[#18181b] rounded-full font-bold text-xs shadow-xs hover:bg-slate-100"
          >
            <Save className="w-3.5 h-3.5 text-[#ed1c24]" /> Guardar Cambios
          </button>
        </div>
      )}

      {/* Header Bar for Flowdex */}
      <section className="bg-white rounded-3xl border border-[#dedfe3] p-6 sm:p-8 shadow-[0_16px_48px_rgba(24,24,27,0.08)] space-y-6">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-[#dedfe3]">
          <div>
            <p className="eyebrow-accent mb-3">
              Centro de operaciones Flowdex
            </p>
            <h2 className="text-2xl sm:text-4xl font-black text-[#18181b] tracking-[-0.04em] leading-tight">
              Políticas Operativas & SLAs 2026
            </h2>
            <p className="text-xs sm:text-sm text-[#5f6470] mt-2 max-w-xl">
              Manual integral de atención, límites de colas de WhatsApp (200 conversaciones por asesor) y asignación ponderada (60% Round Robin / 40% Desempeño).
            </p>
          </div>

          {/* Action buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setIsFullScreenModalOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-[#ed1c24] hover:bg-[#ed1c24]/90 text-white shadow-xs transition-all cursor-pointer"
              title="Abrir política integral en pantalla completa"
            >
              <Maximize2 className="w-3.5 h-3.5" />
              <span>Pantalla Completa</span>
            </button>

            <button
              onClick={() => setActiveTab(activeTab === 'documento' ? 'calculadora_sla' : 'documento')}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                activeTab === 'calculadora_sla'
                  ? 'bg-[#18181b] text-white border-[#18181b] shadow-xs'
                  : 'bg-white hover:bg-slate-50 text-[#18181b] border-[#dedfe3]'
              }`}
            >
              <Clock className="w-3.5 h-3.5 text-[#ed1c24]" />
              <span>{activeTab === 'calculadora_sla' ? 'Ver Documento' : 'Simulador SLA'}</span>
            </button>

            <button
              onClick={() => setIsEditable(!isEditable)}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                isEditable
                  ? 'bg-amber-500 text-white border-amber-600 shadow-xs'
                  : 'bg-white hover:bg-slate-50 text-[#18181b] border-[#dedfe3]'
              }`}
              title="Activar edición de texto en línea"
            >
              <Edit3 className="w-3.5 h-3.5 text-amber-500" />
              <span>{isEditable ? 'Modo Edición Activo' : 'Editar Política'}</span>
            </button>

            <button
              onClick={handleCopyHTML}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-white hover:bg-slate-50 text-[#18181b] border border-[#dedfe3] transition-colors cursor-pointer"
              title="Copiar HTML íntegro"
            >
              <Copy className="w-3.5 h-3.5 text-[#5f6470]" />
              <span>Copiar HTML</span>
            </button>

            <a
              href="/flowdex.html"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-white hover:bg-slate-50 text-[#18181b] border border-[#dedfe3] transition-colors cursor-pointer shadow-2xs"
              title="Abrir documento en pestaña independiente"
            >
              <ExternalLink className="w-3.5 h-3.5 text-[#ed1c24]" />
              <span>Abrir /flowdex.html</span>
            </a>

            <button
              onClick={() => setShowImportModal(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-[#18181b] hover:bg-[#ed1c24] text-white transition-colors cursor-pointer shadow-xs"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Importar Otro HTML</span>
            </button>
          </div>
        </div>

        {/* Document Selector Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pt-1">
          <span className="text-xs font-bold text-[#5f6470] px-1 shrink-0 flex items-center gap-1">
            <BookOpen className="w-3.5 h-3.5 text-[#ed1c24]" /> Documentos Flowdex:
          </span>
          {documents.map((doc) => (
            <button
              key={doc.id}
              onClick={() => {
                setActiveDocId(doc.id);
                setHasChanges(false);
              }}
              className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-2 cursor-pointer ${
                activeDocId === doc.id
                  ? 'bg-[#18181b] text-white shadow-xs'
                  : 'bg-slate-100 text-[#5f6470] hover:text-[#18181b] hover:bg-slate-200'
              }`}
            >
              <FileText className="w-3.5 h-3.5 text-[#ed1c24]" />
              <span>{doc.title}</span>
              <span className="text-[10px] opacity-75 font-normal">v{doc.version}</span>
            </button>
          ))}
        </div>
      </section>

      {/* Simulator view */}
      {activeTab === 'calculadora_sla' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Clock className="w-5 h-5 text-indigo-600" />
                Simulador Interactivo de SLA Flowdex
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Valida el tiempo máximo de respuesta humana y alertas de 80% y 100% de acuerdo a la Política Oficial.
              </p>
            </div>
            <span className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-200">
              Horario activo: 09:00 - 18:00 (UTC-5)
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Nivel de Prioridad:</label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { p: 'P1', name: 'P1 Crítica (≤5m)', color: 'border-rose-300 text-rose-800 bg-rose-50' },
                  { p: 'P2', name: 'P2 Alta (≤5m)', color: 'border-amber-300 text-amber-800 bg-amber-50' },
                  { p: 'P3', name: 'P3 Normal (≤15m)', color: 'border-emerald-300 text-emerald-800 bg-emerald-50' },
                  { p: 'P4', name: 'P4 Baja (≤30m)', color: 'border-blue-300 text-blue-800 bg-blue-50' },
                ].map((item) => (
                  <button
                    key={item.p}
                    onClick={() => setSimPriority(item.p as any)}
                    className={`p-2 rounded-lg text-xs font-bold border text-left transition-all ${
                      simPriority === item.p ? `${item.color} ring-2 ring-indigo-500` : 'border-slate-200 bg-slate-50 text-slate-600'
                    }`}
                  >
                    {item.name}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Hora de Entrada del Mensaje:</label>
              <input
                type="time"
                value={simTime}
                onChange={(e) => setSimTime(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-slate-50 text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <p className="text-[11px] text-slate-400 mt-1">Simula la hora de ingreso en horario laboral.</p>
            </div>

            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Tiempo Límite SLA:</span>
                <span className="font-extrabold text-slate-900 text-sm">{slaMinutes} minutos</span>
              </div>
              <div className="flex justify-between items-center text-amber-700">
                <span>Alerta en Riesgo (80%):</span>
                <span className="font-bold">A los {(slaMinutes * 0.8).toFixed(1)} min</span>
              </div>
              <div className="flex justify-between items-center text-rose-700">
                <span>Alerta Vencida (100%):</span>
                <span className="font-bold">A los {slaMinutes} min</span>
              </div>
              <div className="pt-2 border-t border-slate-200 text-[11px] text-slate-600">
                {simPriority === 'P1' && (
                  <span className="text-rose-600 font-bold block">
                    ⚠️ P1 no admite tolerancia: a los 5m sin respuesta humana se alerta inmediatamente al administrador de turno.
                  </span>
                )}
                {simPriority === 'P2' && (
                  <span className="text-amber-700 font-medium block">
                    Lead o comprador activo de hoy. Asignación inmediata al asesor disponible con menor carga.
                  </span>
                )}
                {(simPriority === 'P3' || simPriority === 'P4') && (
                  <span className="text-slate-500 block">
                    Atención secuencial por orden de llegada tras resolver P1 y P2.
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Módulo Oficial: Política Integral de Flowdex */}
      <section className="bg-white rounded-3xl border border-[#dedfe3] p-6 sm:p-8 shadow-[0_12px_36px_rgba(24,24,27,0.06)] relative overflow-hidden">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-3 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>Módulo Oficial · Gobernanza & Operaciones Flowdex</span>
            </div>
            <h3 className="text-xl sm:text-3xl font-black text-[#18181b] tracking-tight">
              {currentDoc.title}
            </h3>
            <p className="text-xs sm:text-sm text-[#5f6470] leading-relaxed">
              {currentDoc.subtitle} · 10 secciones normativas oficiales, tiempos máximos de respuesta humana y distribución equitativa de carga de trabajo.
            </p>
            <div className="flex flex-wrap items-center gap-2 pt-1 text-[11px] font-bold text-[#18181b]">
              <span className="px-2.5 py-1 rounded-lg bg-slate-100 border border-slate-200">10 Secciones Normativas</span>
              <span className="px-2.5 py-1 rounded-lg bg-slate-100 border border-slate-200">Versión {currentDoc.version} Oficial</span>
              <span className="px-2.5 py-1 rounded-lg bg-slate-100 border border-slate-200">Septiembre 2026</span>
              <span className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200">Aplicación Inmediata</span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0">
            <button
              id="btn-open-politica-fullscreen-card"
              onClick={() => setIsFullScreenModalOpen(true)}
              className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl bg-[#ed1c24] hover:bg-[#ed1c24]/90 text-white font-extrabold text-sm shadow-md hover:shadow-lg transition-all cursor-pointer group"
            >
              <Maximize2 className="w-4 h-4 transition-transform group-hover:scale-110" />
              <span>Abrir en Pantalla Completa</span>
            </button>
          </div>
        </div>
      </section>

      {/* Main Document Content Container */}
      <div className="relative bg-slate-100 p-2 sm:p-6 rounded-2xl border border-slate-200">
        {isEditable && (
          <div className="mb-3 px-4 py-2 bg-amber-50 border border-amber-300 rounded-xl text-xs font-semibold text-amber-900 flex items-center justify-between">
            <span>✏️ Modo edición activo. Puedes hacer clic en cualquier texto para modificarlo directamente.</span>
            <div className="flex gap-2">
              <button
                onClick={handleSaveChanges}
                className="px-2.5 py-1 bg-amber-600 text-white rounded-md hover:bg-amber-700 text-xs font-bold"
              >
                Guardar
              </button>
              <button
                onClick={handleResetCurrentDoc}
                className="px-2.5 py-1 bg-slate-200 text-slate-700 rounded-md hover:bg-slate-300 text-xs font-bold"
              >
                Restaurar Original
              </button>
            </div>
          </div>
        )}

        <div
          ref={contentRef}
          contentEditable={isEditable}
          onInput={handleContentInput}
          suppressContentEditableWarning={true}
          dangerouslySetInnerHTML={{ __html: currentDoc.htmlContent }}
          className={`focus:outline-none transition-all ${isEditable ? 'ring-2 ring-amber-400 rounded-xl bg-white p-2' : ''}`}
        />
      </div>

      {/* Import New Document Modal */}
      {showImportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Upload className="w-5 h-5 text-indigo-600" />
                Albergar Nuevo Documento / HTML en Flowdex
              </h3>
              <button
                onClick={() => setShowImportModal(false)}
                className="w-8 h-8 rounded-full flex items-center justify-center bg-slate-100 hover:bg-slate-200 text-slate-500 font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleImportSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Título del Documento:</label>
                <input
                  type="text"
                  required
                  placeholder="ej. Manual de Objeciones WhatsApp Flowdex"
                  value={newDocTitle}
                  onChange={(e) => setNewDocTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-slate-50 focus:bg-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Subtítulo o Descripción corta:</label>
                  <input
                    type="text"
                    placeholder="ej. Guía paso a paso para cierre rápido"
                    value={newDocSubtitle}
                    onChange={(e) => setNewDocSubtitle(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-slate-50 focus:bg-white text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Categoría:</label>
                  <select
                    value={newDocCategory}
                    onChange={(e) => setNewDocCategory(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-slate-50 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="Politicas">Políticas</option>
                    <option value="Manuales">Manuales</option>
                    <option value="Operaciones">Operaciones</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Código HTML del Documento:</label>
                <textarea
                  required
                  rows={8}
                  placeholder="Pega aquí el código HTML completo o fragmento que deseas albergar en Flowdex..."
                  value={newDocHTML}
                  onChange={(e) => setNewDocHTML(e.target.value)}
                  className="w-full p-3 font-mono text-xs rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowImportModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs"
                >
                  Albergar en Flowdex
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Fullscreen Reader Modal */}
      {isFullScreenModalOpen && (
        <PoliticaIntegralFullScreen
          onClose={() => setIsFullScreenModalOpen(false)}
          initialEditable={isEditable}
        />
      )}
    </div>
  );
};
