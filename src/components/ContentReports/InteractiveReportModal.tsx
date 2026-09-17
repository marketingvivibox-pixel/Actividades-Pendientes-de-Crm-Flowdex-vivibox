import React, { useState } from 'react';
import { ExternalLink, X, Maximize2, Minimize2, Download, RefreshCw, BarChart2, ShieldCheck, ChevronRight } from 'lucide-react';

interface InteractiveReportModalProps {
  reportType: 'meta' | 'tiktok' | null;
  onClose: () => void;
}

export const InteractiveReportModal: React.FC<InteractiveReportModalProps> = ({
  reportType,
  onClose,
}) => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [iframeKey, setIframeKey] = useState(0);

  if (!reportType) return null;

  const isMeta = reportType === 'meta';
  const title = isMeta
    ? 'Desempeño creativo de videos en Meta Ads'
    : 'Inteligencia creativa de videos en TikTok Ads';
  const platformName = isMeta ? 'Meta Ads' : 'TikTok Ads';
  const platformColor = isMeta ? '#1877f2' : '#ff3b78';
  const fileUrl = isMeta ? '/meta.html' : '/tiktok.html';
  const externalFirebaseUrl = isMeta
    ? 'https://vivibox-analisis.firebaseapp.com/meta.html'
    : 'https://vivibox-analisis.firebaseapp.com/tiktok.html';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 bg-[#18181b]/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className={`bg-white rounded-2xl sm:rounded-3xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden transition-all duration-300 ${
          isFullscreen ? 'w-full h-full rounded-none' : 'w-full max-w-6xl h-[90vh]'
        }`}
      >
        {/* Modal Header */}
        <div className="px-5 py-4 border-b border-slate-200 bg-[#f7f7f8] flex items-center justify-between gap-4 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <span
              className="w-3.5 h-3.5 rounded-full shrink-0"
              style={{
                backgroundColor: platformColor,
                boxShadow: `0 0 0 5px ${platformColor}25`,
              }}
            />
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span
                  className="text-xs font-black uppercase tracking-wider px-2 py-0.5 rounded-md text-white"
                  style={{ backgroundColor: platformColor }}
                >
                  {platformName}
                </span>
                <span className="text-xs text-slate-500 font-semibold hidden sm:inline">
                  Informe Oficial Vivibox · 13 ago. 2026
                </span>
              </div>
              <h3 className="text-base sm:text-lg font-black text-[#18181b] tracking-tight truncate mt-0.5">
                {title}
              </h3>
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            <button
              onClick={() => setIframeKey((k) => k + 1)}
              title="Recargar informe"
              className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-200/70 rounded-xl transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
            </button>

            <a
              href={fileUrl}
              target="_blank"
              rel="noopener noreferrer"
              title="Abrir en pestaña completa"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 transition-colors shadow-2xs"
            >
              <span>Abrir pestaña</span>
              <ExternalLink className="w-3.5 h-3.5 text-slate-500" />
            </a>

            <button
              onClick={() => setIsFullscreen(!isFullscreen)}
              title={isFullscreen ? 'Restaurar tamaño' : 'Pantalla completa'}
              className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-200/70 rounded-xl transition-colors hidden sm:block"
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>

            <button
              onClick={onClose}
              title="Cerrar visor"
              className="p-2 text-slate-500 hover:text-white hover:bg-[#ed1c24] rounded-xl transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Embedded Iframe Body */}
        <div className="flex-1 w-full bg-[#fff9f8] relative">
          <iframe
            key={iframeKey}
            src={fileUrl}
            title={title}
            className="w-full h-full border-0"
            sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
          />
        </div>

        {/* Modal Footer */}
        <div className="px-5 py-2.5 bg-white border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-2 shrink-0">
          <div className="flex items-center gap-2">
            <span className="font-bold text-[#18181b]">Vivibox Inteligencia Creativa</span>
            <span>· Análisis interactivo completo con gráficos y filtros nativos</span>
          </div>
          <div className="flex items-center gap-3">
            <a
              href={externalFirebaseUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#1877f2] hover:underline flex items-center gap-1 font-semibold"
            >
              <span>Ver en vivibox-analisis.firebaseapp.com</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};
