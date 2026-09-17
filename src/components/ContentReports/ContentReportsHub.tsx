import React, { useState } from 'react';
import { InformesSubSection, HostedReport } from '../../types';
import { InteractiveReportModal } from './InteractiveReportModal';
import {
  ExternalLink,
  Upload,
  PlusCircle,
  FileCheck,
  Megaphone,
  Sparkles,
  Layers,
  Search,
  FileCode,
  ShieldCheck,
  CheckCircle2,
  FolderSync,
  ArrowLeft
} from 'lucide-react';

interface ContentReportsHubProps {
  searchQuery: string;
  onBack?: () => void;
  initialSubSection?: InformesSubSection;
}

// Official reports hosted on vivibox-analisis.firebaseapp.com
const OFFICIAL_PAID_REPORTS: HostedReport[] = [
  {
    id: 'meta-ads-report',
    platform: 'meta',
    platformLabel: 'Meta Ads',
    title: 'Desempeño creativo de videos en Meta Ads',
    description:
      'Evaluación del portafolio creativo, excluyendo la cuenta de reclutamiento, con score ajustado por evidencia.',
    date: '13 ago. 2026',
    format: 'Análisis interactivo',
    fileUrl: '/meta.html',
    category: 'publicitario',
    status: 'Disponible',
    accentColor: '#1877f2',
  },
  {
    id: 'tiktok-ads-report',
    platform: 'tiktok',
    platformLabel: 'TikTok Ads',
    title: 'Inteligencia creativa de videos en TikTok Ads',
    description:
      'Análisis completo del portafolio de videos TikTok con score ajustado por evidencia y contexto temporal.',
    date: '13 ago. 2026',
    format: 'Análisis interactivo',
    fileUrl: '/tiktok.html',
    category: 'publicitario',
    status: 'Disponible',
    accentColor: '#ff3b78',
  },
];

export const ContentReportsHub: React.FC<ContentReportsHubProps> = ({
  searchQuery,
  onBack,
  initialSubSection = 'publicitario',
}) => {
  const [activeSubSection, setActiveSubSection] = useState<InformesSubSection>(initialSubSection);
  const [selectedInteractiveReport, setSelectedInteractiveReport] = useState<'meta' | 'tiktok' | null>(null);
  const [organicReports, setOrganicReports] = useState<HostedReport[]>([]);
  const [showAddOrganicModal, setShowAddOrganicModal] = useState(false);
  const [newReportTitle, setNewReportTitle] = useState('');
  const [newReportPlatform, setNewReportPlatform] = useState<'meta' | 'tiktok'>('meta');
  const [newReportDescription, setNewReportDescription] = useState('');
  const [uploadedHtmlFile, setUploadedHtmlFile] = useState<File | null>(null);

  // Filter paid reports based on search
  const filteredPaidReports = OFFICIAL_PAID_REPORTS.filter((report) => {
    const q = searchQuery.toLowerCase();
    return (
      report.title.toLowerCase().includes(q) ||
      report.description.toLowerCase().includes(q) ||
      report.platformLabel.toLowerCase().includes(q)
    );
  });

  // Filter organic reports based on search
  const filteredOrganicReports = organicReports.filter((report) => {
    const q = searchQuery.toLowerCase();
    return (
      report.title.toLowerCase().includes(q) ||
      report.description.toLowerCase().includes(q) ||
      report.platformLabel.toLowerCase().includes(q)
    );
  });

  const handleAddOrganicReport = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newReportTitle.trim()) return;

    let fileUrl = '#';
    if (uploadedHtmlFile) {
      fileUrl = URL.createObjectURL(uploadedHtmlFile);
    }

    const newReport: HostedReport = {
      id: `organic-${Date.now()}`,
      platform: newReportPlatform,
      platformLabel: newReportPlatform === 'meta' ? 'Meta (Reels / Instagram)' : 'TikTok Orgánico',
      title: newReportTitle,
      description: newReportDescription || 'Informe de desempeño de contenido orgánico sin inversión publicitaria.',
      date: new Date().toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' }),
      format: 'Documento interactivo',
      fileUrl: fileUrl,
      category: 'organico',
      status: 'Disponible',
      accentColor: newReportPlatform === 'meta' ? '#1877f2' : '#ff3b78',
    };

    setOrganicReports([newReport, ...organicReports]);
    setNewReportTitle('');
    setNewReportDescription('');
    setUploadedHtmlFile(null);
    setShowAddOrganicModal(false);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Full-screen reader modal for the official hosted HTML reports */}
      <InteractiveReportModal
        reportType={selectedInteractiveReport}
        onClose={() => setSelectedInteractiveReport(null)}
      />

      {/* Hero Section matching vivibox-analisis.firebaseapp.com */}
      <section className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_auto] items-end gap-6 sm:gap-8 pb-8 border-b border-[#dedfe3]">
        <div>
          {onBack && (
            <div className="mb-4">
              <button
                onClick={onBack}
                className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white border border-[#dedfe3] text-[#18181b] hover:bg-[#f4f4f6] text-xs font-bold shadow-xs transition-all cursor-pointer hover:-translate-x-0.5"
              >
                <ArrowLeft className="w-4 h-4 text-[#ed1c24]" />
                <span>Volver al Centro de Análisis</span>
              </button>
            </div>
          )}
          <p className="eyebrow-accent mb-3.5">
            Centro de análisis
          </p>
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-[-0.055em] text-[#18181b] leading-[1.02] text-balance">
            Informes de Contenido Vivibox
          </h1>
          <p className="mt-4 text-base sm:text-lg text-[#5f6470] max-w-2xl leading-relaxed">
            Consulta los análisis interactivos alojados en el hosting. División interna para informes de contenido publicitario y orgánico con sus documentos y gráficos originales.
          </p>
        </div>

        {/* Hero summary widget */}
        <aside
          className="min-w-[220px] p-5 bg-white border border-[#dedfe3] rounded-2xl shadow-[0_8px_28px_rgba(24,24,27,0.05)] shrink-0"
          aria-label="Resumen de informes disponibles"
        >
          <strong className="block text-3xl sm:text-4xl font-black text-[#18181b] tracking-tight">
            {OFFICIAL_PAID_REPORTS.length + organicReports.length}
          </strong>
          <span className="block mt-1.5 text-xs sm:text-sm font-semibold text-[#5f6470]">
            informes disponibles en el hosting
          </span>
          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Última versión</span>
            <time className="font-bold text-[#18181b]" dateTime="2026-08-13">13 ago. 2026</time>
          </div>
        </aside>
      </section>

      {/* Submenu Division: Publicitario vs Orgánico */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 border-b border-[#dedfe3] pb-4">
        <div className="flex items-center gap-2 p-1 bg-white rounded-xl border border-[#dedfe3] shadow-2xs">
          <button
            id="tab-publicitario-btn"
            onClick={() => setActiveSubSection('publicitario')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs sm:text-sm font-extrabold transition-all cursor-pointer ${
              activeSubSection === 'publicitario'
                ? 'bg-[#18181b] text-white shadow-xs'
                : 'text-[#5f6470] hover:text-[#18181b] hover:bg-slate-100'
            }`}
          >
            <Megaphone className={`w-4 h-4 ${activeSubSection === 'publicitario' ? 'text-[#ed1c24]' : 'text-slate-400'}`} />
            <span>Contenido Publicitario</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-[#ed1c24] text-white">
              {OFFICIAL_PAID_REPORTS.length}
            </span>
          </button>

          <button
            id="tab-organico-btn"
            onClick={() => setActiveSubSection('organico')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs sm:text-sm font-extrabold transition-all cursor-pointer ${
              activeSubSection === 'organico'
                ? 'bg-[#18181b] text-white shadow-xs'
                : 'text-[#5f6470] hover:text-[#18181b] hover:bg-slate-100'
            }`}
          >
            <Sparkles className={`w-4 h-4 ${activeSubSection === 'organico' ? 'text-emerald-500' : 'text-slate-400'}`} />
            <span>Contenido Orgánico</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-slate-200 text-slate-700">
              {organicReports.length}
            </span>
          </button>
        </div>

        {/* Section Actions */}
        <div className="flex items-center gap-2">
          {activeSubSection === 'organico' && (
            <button
              onClick={() => setShowAddOrganicModal(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-[#18181b] text-white hover:bg-[#ed1c24] transition-colors shadow-2xs cursor-pointer"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>Agregar Informe Orgánico</span>
            </button>
          )}

          <a
            href="https://vivibox-analisis.firebaseapp.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-white text-[#18181b] border border-[#dedfe3] hover:bg-slate-50 transition-all shadow-2xs"
          >
            <FolderSync className="w-3.5 h-3.5 text-[#5f6470]" />
            <span>Ver en Firebase Hosting</span>
            <ExternalLink className="w-3 h-3 text-[#5f6470]" />
          </a>
        </div>
      </div>

      {/* SUB-SECTION 1: Informes de Contenido Publicitario */}
      {activeSubSection === 'publicitario' && (
        <section id="informes-publicitarios" aria-labelledby="publicitario-heading" className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2">
            <div>
              <h2 id="publicitario-heading" className="text-xl sm:text-2xl font-black text-[#18181b] tracking-[-0.025em]">
                Informes de Contenido Publicitario
              </h2>
              <p className="text-xs sm:text-sm text-[#5f6470] mt-1">
                Informes de análisis de anuncios alojados directamente en el hosting con métricas y gráficos oficiales.
              </p>
            </div>
            <p className="text-xs sm:text-sm text-[#5f6470] font-medium shrink-0">
              Última actualización: <time dateTime="2026-08-13" className="font-bold text-[#18181b]">13 de agosto de 2026</time>
            </p>
          </div>

          {/* Grid of real hosted reports */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredPaidReports.map((report) => {
              const isMeta = report.platform === 'meta';
              return (
                <article
                  key={report.id}
                  className={`relative flex flex-col min-h-[360px] p-7 bg-white border border-[#dedfe3] rounded-3xl shadow-[0_16px_48px_rgba(24,24,27,0.08)] hover:-translate-y-1 transition-all duration-200 overflow-hidden group ${
                    isMeta
                      ? 'hover:border-[#1877f2]/50 hover:shadow-[0_22px_56px_rgba(24,119,242,0.12)]'
                      : 'hover:border-[#ff3b78]/50 hover:shadow-[0_22px_56px_rgba(255,59,120,0.12)]'
                  }`}
                >
                  {/* Top Accent line matching platform color */}
                  <div
                    className="absolute inset-x-0 top-0 h-1.5"
                    style={{ backgroundColor: report.accentColor }}
                  />

                  <div className="flex items-center justify-between gap-4">
                    <p className="inline-flex items-center gap-2.5 m-0 font-extrabold text-[#18181b] text-sm">
                      <span
                        className={isMeta ? 'platform-mark-meta' : 'platform-mark-tiktok'}
                        aria-hidden="true"
                      />
                      {report.platformLabel}
                    </p>
                    <span className="status-badge">
                      {report.status}
                    </span>
                  </div>

                  <h3
                    className={`mt-7 mb-3 text-2xl font-black tracking-[-0.035em] text-[#18181b] leading-[1.18] transition-colors ${
                      isMeta ? 'group-hover:text-[#1877f2]' : 'group-hover:text-[#ff3b78]'
                    }`}
                  >
                    {report.title}
                  </h3>

                  <p className="text-sm text-[#5f6470] leading-relaxed">
                    {report.description}
                  </p>

                  <div className="grid grid-cols-2 gap-4 my-6 pt-5 border-t border-[#dedfe3] text-xs">
                    <div>
                      <span className="block mb-1 text-[11px] font-bold uppercase tracking-wider text-[#5f6470]">
                        Fecha del informe
                      </span>
                      <time className="font-bold text-[#18181b] text-sm" dateTime="2026-08-13">
                        {report.date}
                      </time>
                    </div>
                    <div>
                      <span className="block mb-1 text-[11px] font-bold uppercase tracking-wider text-[#5f6470]">
                        Formato
                      </span>
                      <span className="font-bold text-[#18181b] text-sm">
                        {report.format}
                      </span>
                    </div>
                  </div>

                  <div className="mt-auto space-y-2">
                    <button
                      onClick={() => setSelectedInteractiveReport(report.platform)}
                      className="btn-open-report"
                    >
                      <span>Abrir informe de {report.platform === 'meta' ? 'Meta' : 'TikTok'}</span>
                      <svg
                        className="w-5 h-5 flex-none stroke-current"
                        viewBox="0 0 24 24"
                        fill="none"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        aria-hidden="true"
                      >
                        <path d="M5 12h14M13 6l6 6-6 6" />
                      </svg>
                    </button>

                    <div className="flex items-center justify-between pt-1 px-1 text-[11px] text-[#5f6470]">
                      <span>Documento del hosting: <code className="font-mono">{report.fileUrl}</code></span>
                      <a
                        href={report.fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:text-[#18181b] flex items-center gap-1 font-semibold underline"
                      >
                        <span>Pestaña directa</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      )}

      {/* SUB-SECTION 2: Informes de Contenido Orgánico */}
      {activeSubSection === 'organico' && (
        <section id="informes-organicos" aria-labelledby="organico-heading" className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2">
            <div>
              <h2 id="organico-heading" className="text-xl sm:text-2xl font-black text-[#18181b] tracking-[-0.025em]">
                Informes de Contenido Orgánico
              </h2>
              <p className="text-xs sm:text-sm text-[#5f6470] mt-1">
                Espacio dedicado a informes y auditorías de contenido orgánico (Reels, TikToks y publicaciones no pagadas).
              </p>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
              {organicReports.length} {organicReports.length === 1 ? 'informe cargado' : 'informes cargados'}
            </span>
          </div>

          {/* List of organic reports if any have been uploaded */}
          {filteredOrganicReports.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {filteredOrganicReports.map((report) => (
                <article
                  key={report.id}
                  className="relative flex flex-col min-h-[320px] p-7 bg-white border border-[#dedfe3] rounded-3xl shadow-[0_16px_48px_rgba(24,24,27,0.08)] hover:-translate-y-1 transition-all overflow-hidden group"
                >
                  <div
                    className="absolute inset-x-0 top-0 h-1.5"
                    style={{ backgroundColor: report.accentColor }}
                  />

                  <div className="flex items-center justify-between gap-4">
                    <p className="inline-flex items-center gap-2.5 font-extrabold text-[#18181b] text-sm">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                      {report.platformLabel}
                    </p>
                    <span className="status-badge">Orgánico</span>
                  </div>

                  <h3 className="mt-5 mb-2 text-2xl font-black text-[#18181b] tracking-tight">
                    {report.title}
                  </h3>

                  <p className="text-sm text-[#5f6470] leading-relaxed mb-4">
                    {report.description}
                  </p>

                  <div className="grid grid-cols-2 gap-4 my-4 pt-4 border-t border-[#dedfe3] text-xs">
                    <div>
                      <span className="block mb-1 text-[11px] font-bold uppercase text-[#5f6470]">Fecha</span>
                      <span className="font-bold text-[#18181b]">{report.date}</span>
                    </div>
                    <div>
                      <span className="block mb-1 text-[11px] font-bold uppercase text-[#5f6470]">Formato</span>
                      <span className="font-bold text-[#18181b]">{report.format}</span>
                    </div>
                  </div>

                  <div className="mt-auto pt-2">
                    <a
                      href={report.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn-open-report text-center"
                    >
                      <span>Abrir informe orgánico</span>
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            /* Clean authentic empty state when no organic report is loaded yet */
            <div className="bg-white border border-[#dedfe3] rounded-3xl p-8 sm:p-12 text-center shadow-[0_8px_28px_rgba(24,24,27,0.04)]">
              <div className="w-14 h-14 mx-auto rounded-2xl bg-[#ed1c24]/10 flex items-center justify-center text-[#ed1c24] mb-4">
                <FileCode className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-black text-[#18181b] tracking-tight">
                No hay informes orgánicos agregados aún
              </h3>
              <p className="text-sm text-[#5f6470] max-w-md mx-auto mt-2 leading-relaxed">
                Este módulo está listo para alojar los informes de análisis orgánico de Vivibox (Instagram Reels, TikTok orgánico y contenido editorial) sin datos inventados.
              </p>
              <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
                <button
                  onClick={() => setShowAddOrganicModal(true)}
                  className="px-5 py-2.5 rounded-xl bg-[#18181b] hover:bg-[#ed1c24] text-white text-xs font-bold transition-colors shadow-xs cursor-pointer flex items-center gap-2"
                >
                  <Upload className="w-4 h-4" />
                  <span>Subir o Vincular Informe Orgánico</span>
                </button>
              </div>
            </div>
          )}
        </section>
      )}

      {/* Modal for adding/uploading an organic HTML report */}
      {showAddOrganicModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#18181b]/70 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl border border-[#dedfe3] shadow-2xl p-6 sm:p-8 max-w-lg w-full">
            <h3 className="text-xl font-black text-[#18181b] tracking-tight mb-1">
              Agregar Informe de Contenido Orgánico
            </h3>
            <p className="text-xs text-[#5f6470] mb-6">
              Registra un nuevo informe para incluirlo en el hosting de Vivibox.
            </p>

            <form onSubmit={handleAddOrganicReport} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#18181b] mb-1">
                  Título del Informe
                </label>
                <input
                  type="text"
                  required
                  placeholder="ej. Auditoría de Desempeño Reels e Instagram Orgánico"
                  value={newReportTitle}
                  onChange={(e) => setNewReportTitle(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-[#dedfe3] focus:outline-none focus:border-[#ed1c24]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#18181b] mb-1">
                  Plataforma
                </label>
                <select
                  value={newReportPlatform}
                  onChange={(e) => setNewReportPlatform(e.target.value as 'meta' | 'tiktok')}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-[#dedfe3] focus:outline-none focus:border-[#ed1c24] bg-white"
                >
                  <option value="meta">Meta (Instagram / Reels / Facebook)</option>
                  <option value="tiktok">TikTok Orgánico</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#18181b] mb-1">
                  Descripción o Alcance
                </label>
                <textarea
                  rows={3}
                  placeholder="Resumen del análisis, período auditado o hallazgos clave..."
                  value={newReportDescription}
                  onChange={(e) => setNewReportDescription(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-[#dedfe3] focus:outline-none focus:border-[#ed1c24]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#18181b] mb-1">
                  Archivo HTML del Informe (Opcional)
                </label>
                <input
                  type="file"
                  accept=".html,.htm"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      setUploadedHtmlFile(e.target.files[0]);
                    }
                  }}
                  className="w-full text-xs text-[#5f6470] file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-slate-100 file:text-slate-800 hover:file:bg-slate-200"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#dedfe3]">
                <button
                  type="button"
                  onClick={() => setShowAddOrganicModal(false)}
                  className="px-4 py-2 text-xs font-bold text-[#5f6470] hover:text-[#18181b]"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold bg-[#18181b] text-white hover:bg-[#ed1c24] rounded-xl transition-colors"
                >
                  Guardar Informe
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
