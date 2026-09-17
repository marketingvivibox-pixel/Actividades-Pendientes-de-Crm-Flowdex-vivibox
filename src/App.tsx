import React, { useState } from 'react';
import { ActiveView } from './types';
import { ReceptionHub } from './components/Reception/ReceptionHub';
import { ContentReportsHub } from './components/ContentReports/ContentReportsHub';
import { FlowdexHub } from './components/Flowdex/FlowdexHub';
import { SuspensionDots3D } from './components/Three/SuspensionDots3D';
import { BadgeCheck, ShieldCheck, ExternalLink } from 'lucide-react';

export default function App() {
  // Default is 'centro-de-analisis'
  const [activeSection, setActiveSection] = useState<ActiveView>('centro-de-analisis');
  const [informesSubSection, setInformesSubSection] = useState<'publicitario' | 'organico'>('publicitario');
  const [flowdexSubSection, setFlowdexSubSection] = useState<'menu' | 'slas' | 'pendientes'>('menu');
  const [searchQuery] = useState<string>('');

  const handleNavigate = (view: ActiveView, subSection?: string) => {
    setActiveSection(view);
    if (view === 'informes') {
      if (subSection === 'organico') setInformesSubSection('organico');
      else setInformesSubSection('publicitario');
    }
    if (view === 'flowdex') {
      if (subSection === 'slas') setFlowdexSubSection('slas');
      else if (subSection === 'pendientes') setFlowdexSubSection('pendientes');
      else setFlowdexSubSection('menu');
    }
  };

  const isHome = activeSection === 'centro-de-analisis';

  return (
    <div className="min-h-[100dvh] text-[#18181b] flex flex-col selection:bg-[#ed1c24] selection:text-white bg-[#f7f7f8] relative">
      
      {/* 
        NO TOP MENU BAR:
        Per specification, the main portal and internal views do not have a top navigation bar.
        Logo is displayed discreetly in the top-left of the portal without a traditional solid strip.
      */}

      {/* Main Content Area */}
      <main className={`flex-1 w-full ${isHome ? '' : 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8'}`}>
        {/* 1. Centro de Análisis (Portada Principal Minimalista con Casa 3D y 4 Módulos) */}
        {activeSection === 'centro-de-analisis' && (
          <ReceptionHub onNavigate={handleNavigate} />
        )}

        {/* 2. Módulo A: Informes de Contenido Vivibox (Publicitario y Orgánico) */}
        {activeSection === 'informes' && (
          <ContentReportsHub
            searchQuery={searchQuery}
            initialSubSection={informesSubSection}
            onBack={() => setActiveSection('centro-de-analisis')}
          />
        )}

        {/* 3. Módulo B: Flowdex (Políticas de SLA y Pendientes de Ejecución CRM) */}
        {activeSection === 'flowdex' && (
          <FlowdexHub
            searchQuery={searchQuery}
            initialSubSection={flowdexSubSection}
            onBack={() => setActiveSection('centro-de-analisis')}
          />
        )}

        {/* 4. Módulo C: Políticas (Pantalla completa con 3 Puntos 3D y "En construcción") */}
        {activeSection === 'politicas' && (
          <SuspensionDots3D
            moduleTitle="Políticas"
            subtitle="Marco regulatorio, directrices operativas y acuerdos de cumplimiento de Vivibox."
            onBack={() => setActiveSection('centro-de-analisis')}
          />
        )}

        {/* 5. Módulo D: Misión, Visión y Marca (Pantalla completa con 3 Puntos 3D y "En construcción") */}
        {activeSection === 'mision-vision' && (
          <SuspensionDots3D
            moduleTitle="Misión, Visión y Marca"
            subtitle="Pilares estratégicos, valores corporativos y manual de identidad visual de Vivibox."
            onBack={() => setActiveSection('centro-de-analisis')}
          />
        )}
      </main>

      {/* Discreet Official Footer */}
      <footer className="mt-auto border-t border-[#dedfe3] bg-white/70 backdrop-blur-xs py-4 px-4 sm:px-8">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-[#5f6470]">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-black text-[#18181b] flex items-center gap-1.5">
              vivibox
              <span className="inline-flex items-center gap-0.5 text-[#1877f2] font-bold">
                <BadgeCheck className="w-3.5 h-3.5 fill-[#1877f2] stroke-white" />
                check azul
              </span>
            </span>
            <span>· Centro de Análisis</span>
          </div>

          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1 text-[#5f6470]">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> Vivibox 2026
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
