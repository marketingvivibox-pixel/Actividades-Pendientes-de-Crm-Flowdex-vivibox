import React from 'react';
import { ActiveView } from '../../types';
import { ModernArchitecturalHouse3D } from '../Three/ModernArchitecturalHouse3D';
import { ModuleCard3D } from './ModuleCard3D';
import {
  BarChart3,
  FileText,
  ShieldCheck,
  Sparkles,
  BadgeCheck,
} from 'lucide-react';

interface ReceptionHubProps {
  onNavigate: (view: ActiveView) => void;
}

export const ReceptionHub: React.FC<ReceptionHubProps> = ({ onNavigate }) => {
  return (
    <div className="relative min-h-[100dvh] flex flex-col justify-between overflow-x-hidden selection:bg-[#ed1c24] selection:text-white">
      
      {/* 1. DISCRETE BRAND IDENTIFIER (Top Left Corner - No navbar, no solid strip) */}
      <div className="pt-6 sm:pt-8 px-4 sm:px-8 lg:px-12 z-20 flex items-center justify-between pointer-events-auto">
        <div className="inline-flex items-center gap-2.5">
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl overflow-hidden bg-white border border-[#dedfe3] shadow-2xs p-0.5 flex items-center justify-center">
            <img
              src="/vivibox-logo.jpg"
              alt="Vivibox"
              className="w-full h-full object-contain rounded-lg"
              onError={(e) => {
                (e.target as HTMLElement).style.display = 'none';
              }}
            />
          </div>
          <div className="flex items-center gap-1.5">
            <span className="font-black text-lg sm:text-xl tracking-tight text-[#18181b]">vivibox</span>
            <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[11px] font-bold bg-white text-[#1877f2] border border-[#dedfe3] shadow-2xs">
              <BadgeCheck className="w-3.5 h-3.5 fill-[#1877f2] stroke-white" />
              <span>check azul</span>
            </span>
          </div>
        </div>

        {/* Minimalist discreet status pill */}
        <div className="hidden sm:inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/80 border border-[#dedfe3] text-[11px] font-semibold text-[#5f6470] shadow-2xs backdrop-blur-xs">
          <span className="w-1.5 h-1.5 rounded-full bg-[#10b981] animate-pulse" />
          <span>Plataforma Operativa 2026</span>
        </div>
      </div>

      {/* 2. BACKGROUND 3D ARCHITECTURAL HOUSE (Ambient, Enlarged, Partially Cropped on the Right) */}
      <div
        className="absolute top-0 right-0 w-[55vw] max-w-[850px] min-w-[340px] h-[65vh] min-h-[460px] pointer-events-none z-0 overflow-hidden"
        style={{
          // Shifted rightwards so it is partially cropped by screen edge
          transform: 'translateX(18%) translateY(2%) scale(1.35)',
          // Transparency and soft blur as specified
          opacity: 0.35,
          filter: 'blur(3px)',
          // Smooth progressive transparency mask fading into the background
          maskImage: 'linear-gradient(to left, rgba(0,0,0,1) 30%, rgba(0,0,0,0.5) 70%, transparent 100%)',
          WebkitMaskImage: 'linear-gradient(to left, rgba(0,0,0,1) 30%, rgba(0,0,0,0.5) 70%, transparent 100%)',
        }}
        aria-hidden="true"
      >
        <ModernArchitecturalHouse3D />
      </div>

      {/* 3. MAIN TOP ZONE: Dominant Title "Centro de Análisis" & Spatial Depth */}
      <div className="relative z-10 px-4 sm:px-8 lg:px-12 pt-8 sm:pt-14 pb-8 max-w-4xl">
        <div className="space-y-4">
          
          {/* Eyebrow accent label */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white border border-[#dedfe3] text-xs font-black uppercase tracking-wider text-[#ed1c24] shadow-2xs">
            <span className="w-2 h-2 rounded-full bg-[#ed1c24]" />
            <span>Recepción Ejecutiva</span>
          </div>

          {/* Dominant Title with fluid clamp() typography */}
          <h1
            className="font-black text-[#18181b] tracking-[-0.04em] leading-[0.98] text-balance"
            style={{
              fontSize: 'clamp(2.5rem, 5.8vw, 4.75rem)',
            }}
          >
            Centro de Análisis
          </h1>

          {/* Subtitle & Clear hierarchy */}
          <p className="text-base sm:text-lg text-[#5f6470] max-w-2xl leading-relaxed">
            Plataforma centralizada de inteligencia y operaciones. Selecciona un módulo de acceso inferior para visualizar informes detallados, gobernanza de acuerdos y políticas en pantalla completa.
          </p>
        </div>
      </div>

      {/* 4. LOWER ZONE: EXACTLY FOUR LARGE SQUARE 3D MODULES */}
      <div className="relative z-10 px-4 sm:px-8 lg:px-12 pb-10 sm:pb-14 pt-4">
        
        {/* Subtle section label */}
        <div className="flex items-center justify-between mb-4 border-b border-[#dedfe3]/80 pb-2.5">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#18181b]" />
            <h2 className="text-xs sm:text-sm font-black uppercase tracking-wider text-[#18181b]">
              Módulos de Acceso
            </h2>
          </div>
          <span className="text-[11px] font-bold text-[#5f6470]">
            4 Módulos · Pantalla Completa
          </span>
        </div>

        {/* 4-column responsive grid: 4 cols on desktop, 2 cols on medium, 1 col on mobile */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-7">
          
          {/* MÓDULO A: Informes de Contenido Vivibox */}
          <ModuleCard3D
            index={0}
            badge="01 · Inteligencia"
            title="Informes de Contenido Vivibox"
            subtitle="Análisis de rendimiento dividido en contenido publicitario (Meta & TikTok Ads) y orgánico."
            subdivisions={['Contenido Publicitario', 'Contenido Orgánico']}
            icon={<BarChart3 className="w-6 h-6" />}
            accentColor="#ed1c24"
            onOpen={() => onNavigate('informes')}
          />

          {/* MÓDULO B: Flowdex */}
          <ModuleCard3D
            index={1}
            badge="02 · Operaciones"
            title="Flowdex"
            subtitle="Gobernanza operativa 2026: Políticas de Acuerdos de Servicio (SLA) y tablero de pendientes CRM."
            subdivisions={['Políticas de SLA', 'Pendientes de Ejecución']}
            icon={<FileText className="w-6 h-6" />}
            accentColor="#1877f2"
            onOpen={() => onNavigate('flowdex')}
          />

          {/* MÓDULO C: Políticas */}
          <ModuleCard3D
            index={2}
            badge="03 · Normativa"
            title="Políticas"
            subtitle="Directrices y acuerdos institucionales de Vivibox. Sección oficial en preparación."
            subdivisions={['En construcción', '3 Puntos 3D']}
            icon={<ShieldCheck className="w-6 h-6" />}
            accentColor="#10b981"
            onOpen={() => onNavigate('politicas')}
          />

          {/* MÓDULO D: Misión, Visión y Marca */}
          <ModuleCard3D
            index={3}
            badge="04 · Identidad"
            title="Misión, Visión y Marca"
            subtitle="Pilares estratégicos, valores corporativos y manual de identidad visual de la marca."
            subdivisions={['En construcción', '3 Puntos 3D']}
            icon={<Sparkles className="w-6 h-6" />}
            accentColor="#8b5cf6"
            onOpen={() => onNavigate('mision-vision')}
          />
        </div>
      </div>
    </div>
  );
};
