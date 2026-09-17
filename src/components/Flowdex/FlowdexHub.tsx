import React, { useState } from 'react';
import { FlowdexSubSection } from '../../types';
import { FlowdexViewer } from './FlowdexViewer';
import { PendingExecutionBoard } from './PendingExecutionBoard';
import { ArrowLeft, ShieldCheck, ListTodo, FileText, BadgeCheck } from 'lucide-react';

interface FlowdexHubProps {
  searchQuery: string;
  onBack: () => void;
  initialSubSection?: FlowdexSubSection;
}

export const FlowdexHub: React.FC<FlowdexHubProps> = ({
  searchQuery,
  onBack,
  initialSubSection = 'slas',
}) => {
  const [activeSubSection, setActiveSubSection] = useState<FlowdexSubSection>(initialSubSection);

  return (
    <div className="w-full space-y-6 animate-in fade-in duration-300">
      {/* Top Fullscreen Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#dedfe3]">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white border border-[#dedfe3] text-[#18181b] hover:bg-[#f4f4f6] text-xs font-bold shadow-xs transition-all cursor-pointer hover:-translate-x-0.5"
            title="Regresar a la página principal"
          >
            <ArrowLeft className="w-4 h-4 text-[#ed1c24]" />
            <span>Centro de Análisis</span>
          </button>

          <div className="h-5 w-px bg-[#dedfe3] hidden sm:block" />

          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl font-black text-[#18181b] tracking-tight">
                Flowdex
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-[#ed1c24]/10 text-[#ed1c24] border border-[#ed1c24]/20">
                Operaciones 2026
              </span>
            </div>
            <p className="text-xs text-[#5f6470]">
              Gestión integral de Acuerdos de Nivel de Servicio (SLAs) y seguimiento de pendientes de ejecución.
            </p>
          </div>
        </div>

        {/* Sub-division Tabs: 'Políticas de SLAs' & 'Pendientes de Ejecución' */}
        <div className="flex items-center p-1 bg-[#f4f4f6] rounded-xl border border-[#dedfe3] self-start sm:self-auto">
          <button
            id="tab-flowdex-slas"
            onClick={() => setActiveSubSection('slas')}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-extrabold transition-all cursor-pointer ${
              activeSubSection === 'slas'
                ? 'bg-white text-[#18181b] shadow-xs'
                : 'text-[#5f6470] hover:text-[#18181b]'
            }`}
          >
            <ShieldCheck className={`w-4 h-4 ${activeSubSection === 'slas' ? 'text-[#ed1c24]' : 'text-[#5f6470]'}`} />
            <span>Políticas de SLAs</span>
          </button>

          <button
            id="tab-flowdex-pendientes"
            onClick={() => setActiveSubSection('pendientes')}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-extrabold transition-all cursor-pointer ${
              activeSubSection === 'pendientes'
                ? 'bg-white text-[#18181b] shadow-xs'
                : 'text-[#5f6470] hover:text-[#18181b]'
            }`}
          >
            <ListTodo className={`w-4 h-4 ${activeSubSection === 'pendientes' ? 'text-[#1877f2]' : 'text-[#5f6470]'}`} />
            <span>Pendientes de Ejecución</span>
          </button>
        </div>
      </div>

      {/* Content depending on sub-division */}
      {activeSubSection === 'slas' ? (
        <FlowdexViewer searchQuery={searchQuery} />
      ) : (
        <PendingExecutionBoard />
      )}
    </div>
  );
};
