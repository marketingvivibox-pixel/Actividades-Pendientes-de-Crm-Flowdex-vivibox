import React from 'react';
import { ActiveView } from '../../types';
import { DecokasaHouse3D } from '../Three/DecokasaHouse3D';
import { ModuleCard3D } from './ModuleCard3D';
import {
  BarChart3,
  FileText,
  ShieldCheck,
  Sparkles,
  BadgeCheck,
  RotateCw,
  Flame,
  CheckCircle2,
  TrendingUp,
  Layers,
  ArrowRight
} from 'lucide-react';

interface ReceptionHubProps {
  onNavigate: (view: ActiveView, subSection?: string) => void;
}

export const ReceptionHub: React.FC<ReceptionHubProps> = ({ onNavigate }) => {
  return (
    <div className="relative min-h-[100dvh] flex flex-col justify-between overflow-x-hidden selection:bg-[#ed1c24] selection:text-white pb-6">
      
      {/* 1. TOP BRAND IDENTIFIER (No navbar, no solid strip) */}
      <div className="pt-5 sm:pt-7 px-4 sm:px-8 lg:px-12 z-20 flex items-center justify-between pointer-events-auto">
        <div className="inline-flex items-center gap-2.5">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl overflow-hidden bg-white border border-[#dedfe3] shadow-2xs p-1 flex items-center justify-center">
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
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-white text-[#1877f2] border border-[#dedfe3] shadow-2xs">
              <BadgeCheck className="w-3.5 h-3.5 fill-[#1877f2] stroke-white" />
              <span>check azul</span>
            </span>
          </div>
        </div>

        {/* Minimalist discreet status pill */}
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/90 border border-[#dedfe3] text-xs font-semibold text-[#5f6470] shadow-2xs backdrop-blur-xs">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="hidden sm:inline">Plataforma Operativa 2026</span>
          <span className="sm:hidden">En línea</span>
        </div>
      </div>

      {/* 2. DESKTOP/TABLET BACKGROUND 3D DECOKASA HOUSE (Clean ambient showcase) */}
      <div
        className="hidden md:block absolute top-0 right-0 w-[45vw] max-w-[620px] h-[58vh] min-h-[440px] pointer-events-auto z-0 overflow-hidden"
        style={{
          transform: 'translateX(6%) translateY(4%) scale(1.15)',
          maskImage: 'linear-gradient(to left, rgba(0,0,0,1) 60%, rgba(0,0,0,0.6) 85%, transparent 100%)',
          WebkitMaskImage: 'linear-gradient(to left, rgba(0,0,0,1) 60%, rgba(0,0,0,0.6) 85%, transparent 100%)',
        }}
        aria-label="Logo 3D Decokasa"
      >
        <DecokasaHouse3D interactive={true} />
      </div>

      {/* 3. MAIN HERO ZONE */}
      <div className="relative z-10 px-4 sm:px-8 lg:px-12 pt-6 sm:pt-10 pb-4 max-w-4xl">
        <div className="space-y-4">
          
          {/* Eyebrow badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white border border-[#dedfe3] text-xs font-black uppercase tracking-wider text-[#ed1c24] shadow-2xs">
            <span className="w-2 h-2 rounded-full bg-[#ed1c24]" />
            <span>Centro de Análisis</span>
          </div>

          {/* Dominant Headline */}
          <h1
            className="font-black text-[#18181b] tracking-[-0.04em] leading-[0.98] text-balance"
            style={{
              fontSize: 'clamp(2.4rem, 5.5vw, 4.5rem)',
            }}
          >
            Centro de Análisis
          </h1>

          {/* Subtitle */}
          <p className="text-sm sm:text-base lg:text-lg text-[#5f6470] max-w-2xl leading-relaxed">
            Plataforma centralizada de inteligencia y operaciones. Consulta el rendimiento publicitario, el marco normativo de SLAs y la mesa técnica de seguimiento CRM.
          </p>

          {/* MOBILE DEDICATED 3D DECOKASA SHOWCASE (Replaces previous simple/blank appearance) */}
          <div className="md:hidden pt-2">
            <div className="relative w-full h-56 rounded-3xl bg-gradient-to-br from-amber-500/10 via-amber-400/5 to-white border border-amber-300/40 p-3 shadow-xs overflow-hidden">
              {/* Background ambient glow */}
              <div className="absolute -top-10 -right-10 w-44 h-44 bg-amber-400/20 rounded-full blur-2xl pointer-events-none" />
              
              {/* Top badge */}
              <div className="absolute top-3 left-3 z-10 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/90 backdrop-blur-md border border-amber-200 text-[11px] font-black text-amber-800 shadow-2xs">
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                <span>Logo 3D Decokasa</span>
              </div>

              {/* Interaction prompt */}
              <div className="absolute top-3 right-3 z-10 flex items-center gap-1 px-2 py-0.5 rounded-full bg-black/40 backdrop-blur-md text-[10px] font-bold text-amber-200">
                <RotateCw className="w-3 h-3 animate-spin" style={{ animationDuration: '6s' }} />
                <span>Girar 3D</span>
              </div>

              {/* 3D Decokasa House Scene */}
              <div className="w-full h-full">
                <DecokasaHouse3D interactive={true} />
              </div>
            </div>
          </div>

          {/* MOBILE QUICK STATS BAR (Enriched, high-value functional summary) */}
          <div className="md:hidden grid grid-cols-2 gap-2 pt-1">
            <div className="p-3 bg-white rounded-2xl border border-[#dedfe3] shadow-2xs flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-red-50 text-[#ed1c24] flex items-center justify-center shrink-0">
                <TrendingUp className="w-4 h-4" />
              </div>
              <div className="truncate">
                <div className="text-xs font-black text-[#18181b]">Informes</div>
                <div className="text-[10px] text-[#5f6470] font-medium">Meta & TikTok Ads</div>
              </div>
            </div>

            <div className="p-3 bg-white rounded-2xl border border-[#dedfe3] shadow-2xs flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-blue-50 text-[#1877f2] flex items-center justify-center shrink-0">
                <Flame className="w-4 h-4 text-amber-500" />
              </div>
              <div className="truncate">
                <div className="text-xs font-black text-[#18181b]">Flowdex</div>
                <div className="text-[10px] text-[#5f6470] font-medium">SLAs + 18 CRM</div>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* 4. LOWER ZONE: EXACTLY FOUR HARMONIOUS 3D MODULES */}
      <div className="relative z-10 px-4 sm:px-8 lg:px-12 pb-8 sm:pb-12 pt-4">
        
        {/* Section header */}
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

        {/* 4-column responsive grid with perfectly equalized height and baseline alignment */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 lg:gap-6 items-stretch">
          
          {/* MÓDULO A: Informes de Contenido */}
          <ModuleCard3D
            index={0}
            badge="01 · Inteligencia"
            title="Informes de Contenido"
            subtitle="Rendimiento de campañas de video (Meta & TikTok Ads) y repositorio de contenido orgánico."
            subdivisions={['Contenido Publicitario', 'Contenido Orgánico']}
            icon={<BarChart3 className="w-6 h-6" />}
            accentColor="#ed1c24"
            onOpen={() => onNavigate('informes')}
            onSubdivisionClick={(sub) => {
              if (sub.toLowerCase().includes('orgánico') || sub.toLowerCase().includes('organico')) {
                onNavigate('informes', 'organico');
              } else {
                onNavigate('informes', 'publicitario');
              }
            }}
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
            onSubdivisionClick={(sub) => {
              if (sub.toLowerCase().includes('sla')) {
                onNavigate('flowdex', 'slas');
              } else {
                onNavigate('flowdex', 'pendientes');
              }
            }}
          />

          {/* MÓDULO C: Políticas */}
          <ModuleCard3D
            index={2}
            badge="03 · Normativa"
            title="Políticas"
            subtitle="Directrices y acuerdos institucionales de Vivibox. Sección oficial en preparación."
            subdivisions={['En preparación', '3 Puntos 3D']}
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
            subdivisions={['En preparación', '3 Puntos 3D']}
            icon={<Sparkles className="w-6 h-6" />}
            accentColor="#8b5cf6"
            onOpen={() => onNavigate('mision-vision')}
          />
        </div>
      </div>
    </div>
  );
};
