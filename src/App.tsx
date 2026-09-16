import React, { useState } from 'react';
import { ActiveView } from './types';
import { Header } from './components/Header';
import { ReceptionHub } from './components/Reception/ReceptionHub';
import { ContentReportsHub } from './components/ContentReports/ContentReportsHub';
import { FlowdexHub } from './components/Flowdex/FlowdexHub';
import { SuspensionDots3D } from './components/Three/SuspensionDots3D';
import { BadgeCheck, ShieldCheck, ExternalLink } from 'lucide-react';

export default function App() {
  // Default is 'centro-de-analisis' (the new reception panel with 3D house and 3D modules)
  const [activeSection, setActiveSection] = useState<ActiveView>('centro-de-analisis');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen text-[#18181b] flex flex-col selection:bg-[#ed1c24] selection:text-white bg-[#f7f7f8]">
      {/* Navigation Topbar with authentic Vivibox red and logo */}
      <Header
        activeSection={activeSection}
        setActiveSection={setActiveSection}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        onPrint={handlePrint}
      />

      {/* Main Full-Screen Layout Shell */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {activeSection === 'centro-de-analisis' && (
          <ReceptionHub onNavigate={(view) => setActiveSection(view)} />
        )}

        {activeSection === 'informes' && (
          <ContentReportsHub
            searchQuery={searchQuery}
            onBack={() => setActiveSection('centro-de-analisis')}
          />
        )}

        {activeSection === 'flowdex' && (
          <FlowdexHub
            searchQuery={searchQuery}
            onBack={() => setActiveSection('centro-de-analisis')}
          />
        )}

        {activeSection === 'politicas' && (
          <SuspensionDots3D
            moduleTitle="Políticas Corporativas"
            subtitle="Marco regulatorio, código de conducta y normativas de gobernanza institucional de Vivibox."
            onBack={() => setActiveSection('centro-de-analisis')}
          />
        )}

        {activeSection === 'mision-vision' && (
          <SuspensionDots3D
            moduleTitle="Misión, Visión y Marca"
            subtitle="Pilares estratégicos, valores corporativos y manual de identidad visual de Vivibox."
            onBack={() => setActiveSection('centro-de-analisis')}
          />
        )}
      </main>

      {/* Official Footer matching vivibox-analisis.firebaseapp.com */}
      <footer className="mt-auto border-t border-[#dedfe3] bg-white/80 backdrop-blur-xs py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#5f6470]">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-black text-[#18181b] flex items-center gap-1.5">
              vivibox
              <span className="inline-flex items-center gap-0.5 text-[#1877f2] font-bold">
                <BadgeCheck className="w-3.5 h-3.5 fill-[#1877f2] stroke-white" />
                check azul
              </span>
            </span>
            <span>· Centro de Análisis, Informes & Gobernanza Operativa</span>
          </div>

          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1 text-[#5f6470]">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> SLA Oficial Flowdex 2026
            </span>
            <span className="text-[#dedfe3]">|</span>
            <a
              href="https://vivibox-analisis.firebaseapp.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#1877f2] hover:underline flex items-center gap-1 font-semibold"
            >
              <span>vivibox-analisis.firebaseapp.com</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
