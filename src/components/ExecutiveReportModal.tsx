import React, { useState } from 'react';
import { X, Copy, Check, FileText, FileSpreadsheet } from 'lucide-react';
import { CRMTask } from '../types';

interface ExecutiveReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  tasks: CRMTask[];
  taskStates: Record<number, boolean>;
  onOpenSheets?: () => void;
}

export const ExecutiveReportModal: React.FC<ExecutiveReportModalProps> = ({
  isOpen,
  onClose,
  tasks,
  taskStates,
  onOpenSheets,
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const activeTasks = tasks.filter((t) => taskStates[t.id] !== false);
  const dimmedTasks = tasks.filter((t) => taskStates[t.id] === false);

  const generateMarkdownReport = () => {
    let md = `# INFORME EJECUTIVO: PENDIENTES CRM WHATSAPP (REUNIÓN 10/09/2026)\n`;
    md += `Participantes: Alex (Software Factory), Freddy (Jefe Ventas), Antoinette (Procesos), Jose Carlos (Marketing), Rodrigo y Claudio (Piloto)\n\n`;
    md += `## RESUMEN DE ESTADO OPERATIVO\n`;
    md += `- Total de puntos evaluados: ${tasks.length}\n`;
    md += `- Puntos Activos / Pendientes: ${activeTasks.length}\n`;
    md += `- Puntos Opacados / Atendidos: ${dimmedTasks.length}\n\n`;

    md += `## PUNTOS CRÍTICOS (ORDENADOS POR IMPACTO INDISPENSABLE EN CRM)\n\n`;
    tasks.forEach((t, i) => {
      const isAct = taskStates[t.id] !== false;
      md += `### ${i + 1}. [Ticket #${t.originalNumber}] ${t.pendiente} (${t.criticalityTier} - ${t.criticalityScore}/100 pts)\n`;
      md += `- **Estado Selector:** ${isAct ? 'ACTIVO / PENDIENTE' : 'OPACADO / ATENDIDO'}\n`;
      md += `- **Enfoque Funcional:** ${t.functionalFocus}\n`;
      md += `- **Responsable:** ${t.responsable} | **Prioridad:** ${t.prioridad} | **Estado:** ${t.estado}\n`;
      md += `- **Detalle / Evidencia:** "${t.detalleEvidencia}"\n`;
      md += `- **Impacto en Operación CRM:** ${t.impactoIndispensableCRM}\n`;
      md += `- **Acción Acordada:** ${t.accionAcordada}\n\n`;
    });

    return md;
  };

  const handleCopy = () => {
    const text = generateMarkdownReport();
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-3xl border border-[#e5dfd3] bg-white text-[#292524] p-6 sm:p-8 shadow-2xl">
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl text-[#786d5f] hover:text-[#292524] hover:bg-[#faf6ee] transition-all cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-5">
          <div className="p-3 rounded-2xl border border-[#e4dccf] bg-[#faf7f2] text-[#52796f]">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-bold font-serif-warm text-[#1c1917]">
              Reporte Ejecutivo de Puntos Críticos
            </h2>
            <p className="text-xs text-[#786d5f]">
              Minuta técnica estructurada para la mesa directiva (Alex y Freddy)
            </p>
          </div>
        </div>

        {/* Status Snapshot */}
        <div className="grid grid-cols-3 gap-3 p-4 rounded-2xl bg-[#faf7f0] border border-[#ebe3d5] mb-5 text-center">
          <div>
            <div className="text-xs text-[#786d5f] font-medium">Total Evaluados</div>
            <div className="text-2xl font-bold font-serif-warm text-[#1c1917]">{tasks.length}</div>
          </div>
          <div>
            <div className="text-xs text-[#786d5f] font-medium">Pendientes Activos</div>
            <div className="text-2xl font-bold font-serif-warm text-rose-700">{activeTasks.length}</div>
          </div>
          <div>
            <div className="text-xs text-[#786d5f] font-medium">Opacados / Atendidos</div>
            <div className="text-2xl font-bold font-serif-warm text-emerald-700">{dimmedTasks.length}</div>
          </div>
        </div>

        {/* Formatted Markdown Preview */}
        <div className="relative mb-6">
          <div className="text-xs font-semibold text-[#786d5f] uppercase tracking-wider mb-2 flex items-center justify-between">
            <span>Texto Plano Formateado (Listo para Slack / WhatsApp):</span>
            <button
              type="button"
              onClick={handleCopy}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-[#292524] text-[#f6f3ed] hover:bg-[#44403c] transition-colors cursor-pointer shadow-2xs"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span>¡Copiado!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copiar al Portapapeles</span>
                </>
              )}
            </button>
          </div>
          <pre className="p-4 rounded-2xl bg-[#faf7f2] border border-[#e5dfd3] font-mono text-xs text-[#443e35] max-h-72 overflow-y-auto whitespace-pre-wrap leading-relaxed">
            {generateMarkdownReport()}
          </pre>
        </div>

        {/* Footer */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
          {onOpenSheets ? (
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenSheets();
              }}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-300 transition-all cursor-pointer shadow-2xs"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-700" />
              <span>Exportar y Sincronizar en Google Sheets</span>
            </button>
          ) : <div />}

          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl text-xs font-bold bg-[#faf7f2] text-[#443e35] border border-[#e4dccf] hover:bg-[#f0e9dc] transition-colors cursor-pointer"
          >
            Cerrar Reporte
          </button>
        </div>
      </div>
    </div>
  );
};
