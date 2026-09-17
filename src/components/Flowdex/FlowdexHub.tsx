import React, { useState } from 'react';
import { FlowdexSubSection } from '../../types';
import { PoliticaIntegralFullScreen } from './PoliticaIntegralFullScreen';
import { CrmPendientesView } from '../CrmTasks/CrmPendientesView';
import { 
  ArrowLeft, 
  ShieldCheck, 
  ListTodo, 
  FileText, 
  Flame, 
  Sparkles, 
  Layers, 
  Calculator, 
  Clock, 
  ExternalLink,
  CheckCircle2,
  Users,
  Grid,
  ChevronRight,
  Database
} from 'lucide-react';

interface FlowdexHubProps {
  searchQuery: string;
  onBack: () => void;
  initialSubSection?: FlowdexSubSection;
}

export const FlowdexHub: React.FC<FlowdexHubProps> = ({
  searchQuery,
  onBack,
  initialSubSection = 'menu',
}) => {
  const [activeSubSection, setActiveSubSection] = useState<FlowdexSubSection>(initialSubSection);

  React.useEffect(() => {
    if (initialSubSection) {
      setActiveSubSection(initialSubSection);
    }
  }, [initialSubSection]);

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
              Gestión operativa integral: consulta de Políticas de SLAs y aplicación de Pendientes de CRM.
            </p>
          </div>
        </div>

        {/* Sub-division Menu Switcher Tabs */}
        <div className="flex items-center p-1 bg-[#f4f4f6] rounded-xl border border-[#dedfe3] self-start sm:self-auto shadow-2xs">
          <button
            id="tab-flowdex-menu"
            onClick={() => setActiveSubSection('menu')}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeSubSection === 'menu'
                ? 'bg-white text-[#18181b] shadow-xs'
                : 'text-[#5f6470] hover:text-[#18181b]'
            }`}
            title="Menú principal de Flowdex"
          >
            <Grid className={`w-3.5 h-3.5 ${activeSubSection === 'menu' ? 'text-[#ed1c24]' : 'text-[#5f6470]'}`} />
            <span>Menú Flowdex</span>
          </button>

          <button
            id="tab-flowdex-slas"
            onClick={() => setActiveSubSection('slas')}
            className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeSubSection === 'slas'
                ? 'bg-white text-[#18181b] shadow-xs'
                : 'text-[#5f6470] hover:text-[#18181b]'
            }`}
          >
            <ShieldCheck className={`w-3.5 h-3.5 ${activeSubSection === 'slas' ? 'text-[#ed1c24]' : 'text-[#5f6470]'}`} />
            <span>Políticas del SLA</span>
          </button>

          <button
            id="tab-flowdex-pendientes"
            onClick={() => setActiveSubSection('pendientes')}
            className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeSubSection === 'pendientes'
                ? 'bg-[#18181b] text-white shadow-xs'
                : 'text-[#5f6470] hover:text-[#18181b]'
            }`}
          >
            <Flame className={`w-3.5 h-3.5 ${activeSubSection === 'pendientes' ? 'text-amber-400' : 'text-[#5f6470]'}`} />
            <span>Pendientes de Ejecución (CRM)</span>
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      {activeSubSection === 'menu' && (
        <div className="space-y-8 animate-in fade-in duration-300 py-2">
          {/* Header Banner */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#dedfe3] shadow-xs relative overflow-hidden">
            <div className="max-w-2xl space-y-3 relative z-10">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#f4f4f6] border border-[#dedfe3] text-xs font-bold text-[#18181b]">
                <Layers className="w-3.5 h-3.5 text-[#ed1c24]" />
                <span>Panel de Navegación Flowdex</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-[#18181b] tracking-tight">
                Elige el área de trabajo operativa
              </h2>
              <p className="text-sm text-[#5f6470] leading-relaxed">
                Accede al manual normativo y calculadora de cumplimiento en <strong>Políticas del SLA</strong> o interactúa con el proyecto en vivo de <strong>Pendientes de CRM FLOWDEX</strong> en Firebase.
              </p>
            </div>

            <div className="absolute -bottom-10 -right-10 w-64 h-64 bg-[#ed1c24]/5 rounded-full blur-3xl pointer-events-none" />
          </div>

          {/* Two Main Option Cards */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* OPTION 1: POLÍTICAS DEL SLA */}
            <div 
              onClick={() => setActiveSubSection('slas')}
              className="group bg-white rounded-3xl p-7 sm:p-8 border border-[#dedfe3] hover:border-[#ed1c24]/40 hover:shadow-lg transition-all duration-300 cursor-pointer flex flex-col justify-between relative overflow-hidden"
            >
              <div className="space-y-5">
                {/* Header & Badges */}
                <div className="flex items-start justify-between gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-[#ed1c24]/10 border border-[#ed1c24]/20 flex items-center justify-center text-[#ed1c24] group-hover:scale-105 transition-transform">
                    <ShieldCheck className="w-7 h-7" />
                  </div>
                  <span className="px-3 py-1 rounded-full text-xs font-extrabold bg-[#ed1c24]/10 text-[#ed1c24] border border-[#ed1c24]/20">
                    Gobernanza Vivibox
                  </span>
                </div>

                <div>
                  <h3 className="text-xl sm:text-2xl font-black text-[#18181b] group-hover:text-[#ed1c24] transition-colors">
                    Políticas del SLA
                  </h3>
                  <p className="text-xs sm:text-sm text-[#5f6470] mt-1.5 leading-relaxed">
                    Marco normativo oficial de Acuerdos de Nivel de Servicio para desarrollo, infraestructura y soporte de Vivibox.
                  </p>
                </div>

                {/* Key Points */}
                <div className="space-y-2.5 pt-2 border-t border-[#dedfe3]/70 text-xs text-[#44403c]">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-[#ed1c24] shrink-0" />
                    <span>Clasificación estricta de incidentes (P1 Crítico a P4 Menor)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-[#ed1c24] shrink-0" />
                    <span>Tiempos máximos garantizados de respuesta y resolución</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calculator className="w-4 h-4 text-[#ed1c24] shrink-0" />
                    <span>Calculadora interactiva en vivo y simulador de penalizaciones</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-[#ed1c24] shrink-0" />
                    <span>Manual completo estructurado en 10 secciones oficiales</span>
                  </div>
                </div>
              </div>

              {/* Action Button */}
              <div className="mt-8 pt-4 border-t border-[#dedfe3]">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveSubSection('slas');
                  }}
                  className="w-full py-3 px-4 rounded-xl bg-[#f4f4f6] group-hover:bg-[#ed1c24] text-[#18181b] group-hover:text-white font-bold text-xs flex items-center justify-between transition-colors shadow-2xs cursor-pointer"
                >
                  <span>Explorar Políticas del SLA</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* OPTION 2: PENDIENTES DE EJECUCIÓN (CRM FLOWDEX) */}
            <div 
              onClick={() => setActiveSubSection('pendientes')}
              className="group bg-[#18181b] text-white rounded-3xl p-7 sm:p-8 border border-zinc-800 hover:border-amber-400/50 hover:shadow-xl transition-all duration-300 cursor-pointer flex flex-col justify-between relative overflow-hidden"
            >
              {/* Subtle ambient amber glow */}
              <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

              <div className="space-y-5 relative z-10">
                {/* Header & Badges */}
                <div className="flex items-start justify-between gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-zinc-800 border border-zinc-700 flex items-center justify-center text-amber-400 group-hover:scale-105 transition-transform">
                    <Flame className="w-7 h-7" />
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-400/15 text-amber-300 border border-amber-400/30 flex items-center gap-1.5">
                      <Sparkles className="w-3 h-3" /> Proyecto Firebase
                    </span>
                    <span className="text-[10px] font-mono text-zinc-400">
                      gen-lang-client-0730224395
                    </span>
                  </div>
                </div>

                <div>
                  <h3 className="text-xl sm:text-2xl font-black text-white group-hover:text-amber-300 transition-colors">
                    Pendientes de Ejecución
                  </h3>
                  <p className="text-xs sm:text-sm text-zinc-400 mt-1.5 leading-relaxed">
                    Aplicación en Firebase de <strong>Pendientes de CRM FLOWDEX</strong>: seguimiento técnico y comercial de acuerdos con físicas 3D y matriz de criticidad.
                  </p>
                </div>

                {/* Key Points */}
                <div className="space-y-2.5 pt-2 border-t border-zinc-800 text-xs text-zinc-300">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>18 pendientes de criticidad CRM WhatsApp y estabilidad</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-sky-400 shrink-0" />
                    <span>Mesa técnica: Alex, Freddy, Antoinette, Jose Carlos, Rodrigo & Claudio</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Layers className="w-4 h-4 text-amber-400 shrink-0" />
                    <span>Espacio con físicas 3D interactivas, gravedad 2D y tabla matricial</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Database className="w-4 h-4 text-purple-400 shrink-0" />
                    <span>Sincronización con Google Sheets y reportería ejecutiva</span>
                  </div>
                </div>
              </div>

              {/* Action Button */}
              <div className="mt-8 pt-4 border-t border-zinc-800 relative z-10">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveSubSection('pendientes');
                  }}
                  className="w-full py-3 px-4 rounded-xl bg-zinc-800 group-hover:bg-amber-400 text-zinc-200 group-hover:text-zinc-950 font-black text-xs flex items-center justify-between transition-colors shadow-2xs cursor-pointer"
                >
                  <span>Abrir Pendientes de CRM FLOWDEX</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* Sub-section: Políticas del SLA (Direct Fullscreen View) */}
      {activeSubSection === 'slas' && (
        <PoliticaIntegralFullScreen
          onClose={() => setActiveSubSection('menu')}
          onSwitchToCrm={() => setActiveSubSection('pendientes')}
        />
      )}

      {/* Sub-section: Pendientes de Ejecución (Real CRM App from gen-lang-client-0730224395) */}
      {activeSubSection === 'pendientes' && (
        <CrmPendientesView
          onBack={() => setActiveSubSection('menu')}
          onSwitchToSla={() => setActiveSubSection('slas')}
        />
      )}
    </div>
  );
};
