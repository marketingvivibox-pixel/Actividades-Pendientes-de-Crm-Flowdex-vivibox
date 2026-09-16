import React from 'react';
import { BadgeCheck, FileText, BarChart3, Search, ExternalLink, Printer, LayoutDashboard, ShieldCheck, Sparkles } from 'lucide-react';
import { ActiveView } from '../types';

interface HeaderProps {
  activeSection: ActiveView;
  setActiveSection: (sec: ActiveView) => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  onPrint?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeSection,
  setActiveSection,
  searchQuery,
  setSearchQuery,
  onPrint,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-[#ed1c24] border-b border-black/15 shadow-sm text-white transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between min-h-[76px] sm:min-h-[84px] py-2 gap-4">
          
          {/* Brand Logo & Check Azul Identity */}
          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={() => setActiveSection('centro-de-analisis')}
              className="flex items-center gap-3 no-underline group focus:outline-none text-left cursor-pointer"
              aria-label="Vivibox - Centro de Análisis"
            >
              <div className="relative overflow-hidden rounded-xl shadow-xs bg-white/10 p-0.5 border border-white/20 transition-transform group-hover:scale-[1.02]">
                <img
                  src="/vivibox-logo.jpg"
                  alt="Vivibox"
                  className="h-10 sm:h-12 w-auto object-contain rounded-lg"
                  onError={(e) => {
                    (e.target as HTMLElement).style.display = 'none';
                  }}
                />
              </div>

              <div className="flex flex-col">
                <div className="flex items-center gap-1.5">
                  <span className="font-black text-xl tracking-tight text-white drop-shadow-xs">vivibox</span>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold bg-white text-[#1877f2] shadow-xs">
                    <BadgeCheck className="w-3.5 h-3.5 fill-[#1877f2] text-white" />
                    check azul
                  </span>
                </div>
                <p className="text-[11px] text-white/80 font-bold tracking-wider uppercase hidden sm:block">
                  Centro de Análisis & Operaciones
                </p>
              </div>
            </button>
          </div>

          {/* Center Navigation Tabs */}
          <nav className="flex items-center p-1 bg-black/20 backdrop-blur-xs rounded-xl border border-white/15 overflow-x-auto max-w-full">
            {/* 1. Centro de Análisis (Inicio) */}
            <button
              id="nav-centro-analisis-btn"
              onClick={() => setActiveSection('centro-de-analisis')}
              className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-3.5 py-2 rounded-lg text-xs sm:text-sm font-extrabold transition-all cursor-pointer whitespace-nowrap ${
                activeSection === 'centro-de-analisis'
                  ? 'bg-white text-[#18181b] shadow-md'
                  : 'text-white/90 hover:text-white hover:bg-white/10'
              }`}
            >
              <LayoutDashboard className={`w-4 h-4 ${activeSection === 'centro-de-analisis' ? 'text-[#ed1c24]' : 'text-white'}`} />
              <span>Centro de Análisis</span>
            </button>

            {/* 2. Informes de Contenido */}
            <button
              id="nav-informes-btn"
              onClick={() => setActiveSection('informes')}
              className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-3.5 py-2 rounded-lg text-xs sm:text-sm font-extrabold transition-all cursor-pointer whitespace-nowrap ${
                activeSection === 'informes'
                  ? 'bg-white text-[#18181b] shadow-md'
                  : 'text-white/90 hover:text-white hover:bg-white/10'
              }`}
            >
              <BarChart3 className={`w-4 h-4 ${activeSection === 'informes' ? 'text-[#ed1c24]' : 'text-white'}`} />
              <span>Informes</span>
            </button>

            {/* 3. Flowdex */}
            <button
              id="nav-flowdex-btn"
              onClick={() => setActiveSection('flowdex')}
              className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-3.5 py-2 rounded-lg text-xs sm:text-sm font-extrabold transition-all cursor-pointer whitespace-nowrap ${
                activeSection === 'flowdex'
                  ? 'bg-white text-[#18181b] shadow-md'
                  : 'text-white/90 hover:text-white hover:bg-white/10'
              }`}
            >
              <FileText className={`w-4 h-4 ${activeSection === 'flowdex' ? 'text-[#ed1c24]' : 'text-white'}`} />
              <span>Flowdex</span>
            </button>
          </nav>

          {/* Right Action Tools */}
          <div className="flex items-center gap-2">
            {/* Search Input */}
            <div className="relative hidden xl:block w-48">
              <Search className="w-4 h-4 text-white/60 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                id="global-search-input"
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar en la plataforma..."
                className="w-full pl-9 pr-7 py-1.5 text-xs rounded-lg border border-white/25 bg-black/20 text-white placeholder-white/60 focus:bg-white focus:text-[#18181b] focus:placeholder-slate-400 focus:outline-none transition-colors font-medium"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-white/60 hover:text-white text-xs cursor-pointer"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Print Button */}
            {onPrint && (
              <button
                onClick={onPrint}
                className="p-2 sm:px-3 sm:py-2 rounded-lg bg-black/20 hover:bg-white/20 border border-white/20 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                title="Imprimir / Guardar PDF"
              >
                <Printer className="w-4 h-4" />
                <span className="hidden md:inline">Imprimir</span>
              </button>
            )}

            {/* Link to Firebase Hosting */}
            <a
              href="https://vivibox-analisis.firebaseapp.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 sm:px-3 sm:py-2 rounded-lg bg-white text-[#1877f2] hover:bg-white/90 text-xs font-black shadow-xs transition-all flex items-center gap-1.5"
              title="Abrir hosting oficial en vivibox-analisis.firebaseapp.com"
            >
              <ExternalLink className="w-4 h-4" />
              <span className="hidden sm:inline">Hosting</span>
            </a>
          </div>
        </div>
      </div>
    </header>
  );
};
