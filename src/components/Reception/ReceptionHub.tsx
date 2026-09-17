import React from 'react';
import { ActiveView } from '../../types';
import { House3D } from '../Three/House3D';
import { ModuleCard3D } from './ModuleCard3D';
import {
  BarChart3,
  FileText,
  ShieldCheck,
  Sparkles,
  BadgeCheck,
  Compass,
  ArrowRight
} from 'lucide-react';

interface ReceptionHubProps {
  onNavigate: (view: ActiveView) => void;
}

export const ReceptionHub: React.FC<ReceptionHubProps> = ({ onNavigate }) => {
  return (
    <div className="w-full py-4 sm:py-8 space-y-12 sm:space-y-16 animate-in fade-in duration-300">
      
      {/* Central Reception Panel: Clean, Spacious, with 3D House */}
      <section className="relative w-full rounded-3xl bg-white/70 border border-[#dedfe3] p-6 sm:p-10 lg:p-12 shadow-xs backdrop-blur-xs overflow-hidden">
        {/* Subtle Ambient Radial Glows */}
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-[#ed1c24]/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-[#1877f2]/5 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          
          {/* Main Title and Clean Hierarchy (7 Cols on desktop) */}
          <div className="lg:col-span-7 flex flex-col items-start text-left space-y-4">
            
            {/* Tagline Badge */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#f4f4f6] border border-[#dedfe3] text-[#18181b] text-xs font-bold shadow-2xs">
              <span className="w-2 h-2 rounded-full bg-[#ed1c24]" />
              <span className="font-extrabold text-[#18181b]">vivibox</span>
              <span className="inline-flex items-center gap-0.5 text-[#1877f2]">
                <BadgeCheck className="w-3.5 h-3.5 fill-[#1877f2] text-white" />
                check azul
              </span>
              <span className="text-[#5f6470] hidden sm:inline">· Plataforma Oficial</span>
            </div>

            {/* Main Title requested: 'centro de analisis' */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-[-0.04em] text-[#18181b] leading-[1.05] text-balance">
              Centro de Análisis
            </h1>

            {/* Clean Subtitle */}
            <p className="text-base sm:text-lg text-[#5f6470] max-w-xl leading-relaxed">
              Panel central de recepción ejecutiva. Accede a los módulos de inteligencia de contenido, gobernanza operativa de Flowdex y lineamientos institucionales.
            </p>

            {/* Quick Helper Note */}
            <div className="pt-2 flex items-center gap-2 text-xs font-semibold text-[#5f6470]">
              <Compass className="w-4 h-4 text-[#1877f2]" />
              <span>Explora los 4 módulos inferiores en 3D para abrir en pantalla completa</span>
            </div>
          </div>

          {/* 3D House Component requested by user (5 Cols on desktop) */}
          <div className="lg:col-span-5 flex flex-col items-center justify-center relative">
            <div className="relative flex items-center justify-center p-2 rounded-3xl bg-gradient-to-b from-white to-[#f7f7f8] border border-[#dedfe3]/80 shadow-xs">
              <House3D />
              
              {/* Bottom tag for 3D model */}
              <div className="absolute -bottom-3 px-3.5 py-1 rounded-full bg-white border border-[#dedfe3] shadow-xs text-[11px] font-extrabold text-[#18181b] flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#ed1c24] animate-pulse" />
                <span>Casa 3D Vivibox</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Lower Section: 4 Large 3D Floating Square Modules */}
      <section className="space-y-6">
        <div className="flex items-center justify-between border-b border-[#dedfe3] pb-3">
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-[#18181b] tracking-tight">
              Módulos de Operación & Análisis
            </h2>
            <p className="text-xs text-[#5f6470]">
              Espacio 3D interactivo. Pulsa "Abrir" en cualquier módulo para acceder a su menú en pantalla completa.
            </p>
          </div>

          <span className="text-xs font-bold text-[#5f6470] hidden sm:block">
            4 Módulos Activos
          </span>
        </div>

        {/* 4 Square Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
          
          {/* Módulo a: Informes de Contenido Vivibox */}
          <ModuleCard3D
            index={0}
            badge="01 · Inteligencia"
            title="Informes de Contenido Vivibox"
            subtitle="Desempeño publicitario y orgánico con análisis detallado de portafolio y creatividades."
            subdivisions={['Contenido Orgánico', 'Contenido Publicitario']}
            icon={<BarChart3 className="w-6 h-6" />}
            accentColor="#ed1c24"
            onOpen={() => onNavigate('informes')}
          />

          {/* Módulo b: Flowdex */}
          <ModuleCard3D
            index={1}
            badge="02 · Operaciones"
            title="Flowdex"
            subtitle="Políticas de Acuerdos de Nivel de Servicio (SLAs) 2026 y tablero de pendientes de ejecución."
            subdivisions={['Políticas de SLAs', 'Pendientes de Ejecución']}
            icon={<FileText className="w-6 h-6" />}
            accentColor="#1877f2"
            onOpen={() => onNavigate('flowdex')}
          />

          {/* Módulo c: Política Integral */}
          <ModuleCard3D
            index={2}
            badge="03 · Normativa Oficial"
            title="Política Integral"
            subtitle="Atención, Prioridades y Asignación de Conversaciones y Leads 2026. Haz clic para abrir en pantalla completa."
            subdivisions={['Abrir Pantalla Completa', 'Versión 1.0 Oficial']}
            icon={<ShieldCheck className="w-6 h-6" />}
            accentColor="#10b981"
            onOpen={() => onNavigate('politicas')}
          />

          {/* Módulo d: Misión, Visión y Marca */}
          <ModuleCard3D
            index={3}
            badge="04 · Identidad"
            title="Misión, Visión y Marca"
            subtitle="Pilares estratégicos, valores corporativos y lineamientos de identidad visual Vivibox."
            subdivisions={['Puntos 3D', 'En construcción']}
            icon={<Sparkles className="w-6 h-6" />}
            accentColor="#8b5cf6"
            onOpen={() => onNavigate('mision-vision')}
          />
        </div>
      </section>
    </div>
  );
};
