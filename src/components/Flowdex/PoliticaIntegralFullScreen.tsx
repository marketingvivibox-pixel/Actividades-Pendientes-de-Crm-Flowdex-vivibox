import React, { useState, useEffect, useRef } from 'react';
import { initialFlowdexHTML } from '../../data/flowdexDocs';
import {
  ArrowLeft,
  Maximize2,
  Minimize2,
  Printer,
  Copy,
  Edit3,
  Save,
  RotateCcw,
  Check,
  ShieldCheck,
  BadgeCheck,
  ExternalLink
} from 'lucide-react';

interface PoliticaIntegralFullScreenProps {
  onClose: () => void;
  initialEditable?: boolean;
}

export const PoliticaIntegralFullScreen: React.FC<PoliticaIntegralFullScreenProps> = ({
  onClose,
  initialEditable = false,
}) => {
  const [htmlContent, setHtmlContent] = useState<string>(() => {
    const saved = localStorage.getItem('vivibox_politica_integral_content_v2');
    if (saved) return saved;
    // fallback or check old key
    const oldSaved = localStorage.getItem('vivibox_flowdex_documents');
    if (oldSaved) {
      try {
        const parsed = JSON.parse(oldSaved);
        const doc = parsed.find((d: any) => d.id === 'politica-sla-asignacion');
        if (doc && !doc.htmlContent.includes('Resumen de Prioridades Rápidas')) {
          return doc.htmlContent;
        }
      } catch (e) {}
    }
    return initialFlowdexHTML;
  });

  const [isEditable, setIsEditable] = useState<boolean>(initialEditable);
  const [hasChanges, setHasChanges] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Keyboard shortcut: ESC to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isEditable) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose, isEditable]);

  // Handle content editing
  const handleContentInput = () => {
    if (!hasChanges) setHasChanges(true);
  };

  const handleSave = () => {
    if (contentRef.current) {
      const updated = contentRef.current.innerHTML;
      setHtmlContent(updated);
      localStorage.setItem('vivibox_politica_integral_content_v2', updated);
      setHasChanges(false);
      showToast('✅ Cambios guardados correctamente');
    }
  };

  const handleReset = () => {
    setHtmlContent(initialFlowdexHTML);
    localStorage.removeItem('vivibox_politica_integral_content_v2');
    setHasChanges(false);
    showToast('Documento restaurado a su versión oficial');
  };

  const handleCopyHTML = () => {
    if (contentRef.current) {
      navigator.clipboard.writeText(contentRef.current.innerHTML);
      showToast('HTML copiado al portapapeles');
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#f7f7f8] overflow-y-auto flex flex-col animate-in fade-in duration-200">
      {/* Toast */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 px-4 py-2.5 rounded-xl bg-[#18181b] text-white border border-white/20 shadow-2xl text-xs font-bold flex items-center gap-2 animate-in slide-in-from-top-3">
          <Check className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Floating Save Reminder */}
      {hasChanges && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 bg-[#18181b] text-white px-5 py-3 rounded-full shadow-2xl border border-white/20 animate-in slide-in-from-bottom-4">
          <span className="text-xs font-semibold">Hay cambios sin guardar</span>
          <button
            onClick={handleSave}
            className="flex items-center gap-1.5 px-3 py-1 bg-[#ed1c24] text-white rounded-full font-bold text-xs shadow-xs hover:bg-[#ed1c24]/90 cursor-pointer"
          >
            <Save className="w-3.5 h-3.5" /> Guardar
          </button>
        </div>
      )}

      {/* Fullscreen Sticky Control Toolbar */}
      <header className="sticky top-0 z-40 bg-[#18181b]/95 backdrop-blur-md text-white border-b border-white/10 px-4 sm:px-6 py-3 shadow-md flex items-center justify-between gap-4">
        {/* Left: Back / Exit Fullscreen Button & Title */}
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={onClose}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold border border-white/15 transition-all cursor-pointer shrink-0"
            title="Salir de pantalla completa (o pulsa ESC)"
          >
            <ArrowLeft className="w-4 h-4 text-[#ed1c24]" />
            <span className="hidden sm:inline">Salir de Pantalla Completa</span>
            <span className="sm:hidden">Salir</span>
          </button>

          <div className="h-4 w-px bg-white/20 hidden sm:block shrink-0" />

          <div className="flex items-center gap-2 min-w-0">
            <div className="p-1 rounded-lg bg-[#ed1c24]/20 text-[#ed1c24] border border-[#ed1c24]/30 hidden md:block shrink-0">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div className="truncate">
              <h1 className="text-sm sm:text-base font-black tracking-tight text-white truncate">
                Política Integral de Flowdex
              </h1>
              <p className="text-[11px] text-white/60 font-medium hidden md:block">
                Atención, Prioridades y Asignación de Conversaciones y Leads · Vivibox
              </p>
            </div>
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => setIsEditable(!isEditable)}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
              isEditable
                ? 'bg-amber-500 text-white border-amber-600 shadow-xs'
                : 'bg-white/10 hover:bg-white/20 text-white border-white/15'
            }`}
            title="Activar edición del documento"
          >
            <Edit3 className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden lg:inline">{isEditable ? 'Modo Edición' : 'Editar'}</span>
          </button>

          {isEditable && (
            <>
              <button
                onClick={handleSave}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-[#ed1c24] hover:bg-[#ed1c24]/90 text-white border border-transparent shadow-xs transition-all cursor-pointer"
              >
                <Save className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Guardar</span>
              </button>
              <button
                onClick={handleReset}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-bold bg-white/10 hover:bg-white/20 text-white/80 border border-white/15 transition-all cursor-pointer"
                title="Restaurar versión oficial original"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            </>
          )}

          <button
            onClick={handleCopyHTML}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-white/10 hover:bg-white/20 text-white border border-white/15 transition-all cursor-pointer hidden md:inline-flex"
            title="Copiar código HTML"
          >
            <Copy className="w-3.5 h-3.5 text-white/70" />
            <span>Copiar HTML</span>
          </button>

          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-white/10 hover:bg-white/20 text-white border border-white/15 transition-all cursor-pointer"
            title="Imprimir documento oficial / Guardar en PDF"
          >
            <Printer className="w-3.5 h-3.5 text-white/70" />
            <span className="hidden sm:inline">Imprimir / PDF</span>
          </button>

          <a
            href="/flowdex.html"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-white text-[#18181b] hover:bg-white/90 shadow-xs transition-all"
            title="Abrir en pestaña independiente"
          >
            <ExternalLink className="w-3.5 h-3.5 text-[#ed1c24]" />
            <span className="hidden sm:inline">Nueva Pestaña</span>
          </a>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-white/10 hover:bg-rose-600 text-white transition-all cursor-pointer ml-1"
            title="Cerrar (ESC)"
          >
            <Minimize2 className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Notice if in editing mode */}
      {isEditable && (
        <div className="bg-amber-500/10 border-b border-amber-500/20 px-6 py-2 text-center text-xs font-bold text-amber-800 flex items-center justify-center gap-2">
          <span>✏️ Estás en modo edición: Haz clic en cualquier párrafo, título o tabla para modificar el texto.</span>
        </div>
      )}

      {/* Main Full-Screen Document Canvas */}
      <main className="flex-1 w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <div className="bg-white rounded-3xl border border-[#dedfe3] shadow-[0_20px_60px_rgba(24,24,27,0.06)] overflow-hidden">
          <div
            ref={contentRef}
            contentEditable={isEditable}
            onInput={handleContentInput}
            suppressContentEditableWarning={true}
            dangerouslySetInnerHTML={{ __html: htmlContent }}
            className={`focus:outline-none transition-all ${
              isEditable ? 'p-4 sm:p-8 ring-2 ring-amber-400 rounded-2xl bg-amber-50/10' : ''
            }`}
          />
        </div>
      </main>

      {/* Bottom Footer inside Fullscreen Reader */}
      <footer className="border-t border-[#dedfe3] bg-white py-6 mt-12">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#5f6470]">
          <div className="flex items-center gap-2">
            <span className="font-extrabold text-[#18181b]">vivibox</span>
            <span className="inline-flex items-center gap-0.5 text-[#1877f2] font-bold">
              <BadgeCheck className="w-3.5 h-3.5 fill-[#1877f2] text-white" />
              check azul
            </span>
            <span>· Documento Oficial Vivibox Flowdex 2026</span>
          </div>
          <button
            onClick={onClose}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#18181b] text-white hover:bg-[#ed1c24] text-xs font-bold transition-all cursor-pointer shadow-xs"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Regresar al Centro de Análisis</span>
          </button>
        </div>
      </footer>
    </div>
  );
};
