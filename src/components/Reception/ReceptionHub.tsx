import React from 'react';
import { motion, useScroll, useSpring } from 'motion/react';
import { ActiveView } from '../../types';
import { DecokasaHouse3D } from '../Three/DecokasaHouse3D';
import { ModuleCard3D } from './ModuleCard3D';
import {
  BarChart3,
  FileText,
  ShieldCheck,
  Sparkles,
  BadgeCheck,
  Flame,
  TrendingUp,
  ChevronDown,
  Layers,
  ArrowRight,
} from 'lucide-react';

interface ReceptionHubProps {
  onNavigate: (view: ActiveView, subSection?: string) => void;
}

export const ReceptionHub: React.FC<ReceptionHubProps> = ({ onNavigate }) => {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001,
  });

  return (
    <div className="relative min-h-[100dvh] flex flex-col justify-between overflow-x-hidden selection:bg-[#ed1c24] selection:text-white pb-6">
      {/* Dynamic mobile scroll progress bar (discreet indicator of scroll progress) */}
      <motion.div
        className="md:hidden fixed top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#ed1c24] via-[#1877f2] to-amber-500 origin-left z-50 pointer-events-none"
        style={{ scaleX }}
      />
      
      {/* 1. TOP BRAND IDENTIFIER (No navbar, no solid strip) */}
      <motion.div
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="pt-5 sm:pt-7 px-4 sm:px-8 lg:px-12 z-20 flex items-center justify-between pointer-events-auto"
      >
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
      </motion.div>

      {/* 2. DESKTOP/TABLET EXCLUSIVE 3D DECOKASA HOUSE (Clean ambient showcase, strictly excluded from mobile) */}
      <div
        className="hidden md:block absolute top-0 right-0 w-[62vw] max-w-[880px] h-[72vh] min-h-[560px] pointer-events-auto z-0 overflow-hidden"
        style={{
          transform: 'translateX(4%) translateY(7%)',
          /* Desvanecimiento progresivo en transparencia pura hacia todos los extremos */
          maskImage:
            'radial-gradient(ellipse 70% 65% at 58% 50%, rgba(0,0,0,1) 20%, rgba(0,0,0,0.85) 45%, rgba(0,0,0,0.4) 65%, rgba(0,0,0,0.1) 82%, transparent 100%)',
          WebkitMaskImage:
            'radial-gradient(ellipse 70% 65% at 58% 50%, rgba(0,0,0,1) 20%, rgba(0,0,0,0.85) 45%, rgba(0,0,0,0.4) 65%, rgba(0,0,0,0.1) 82%, transparent 100%)',
        }}
        aria-label="Logo 3D Decokasa"
      >
        <DecokasaHouse3D interactive={true} />
      </div>

      {/* 3. MAIN HERO ZONE WITH MOBILE ENTRANCE AND SCROLL ANIMATIONS */}
      <div className="relative z-10 px-4 sm:px-8 lg:px-12 pt-6 sm:pt-10 pb-4 max-w-4xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="space-y-4"
        >
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

          {/* MOBILE QUICK STATS BAR (With scroll & entrance animation, clean and lightweight without 3D canvas) */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="md:hidden grid grid-cols-2 gap-2 pt-2"
          >
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
          </motion.div>

          {/* MOBILE INTERACTIVE SCROLL HINT (Floating gentle pulse to guide user down to the modules) */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: [0, 5, 0] }}
            transition={{
              opacity: { duration: 0.5, delay: 0.25 },
              y: { repeat: Infinity, duration: 2.2, ease: 'easeInOut' },
            }}
            className="md:hidden flex items-center gap-1.5 text-xs font-bold text-[#5f6470] pt-1"
          >
            <span>Desliza para explorar los módulos</span>
            <ChevronDown className="w-4 h-4 text-[#ed1c24]" />
          </motion.div>
        </motion.div>
      </div>

      {/* 4. LOWER ZONE: EXACTLY FOUR HARMONIOUS 3D MODULES WITH VIEWPORT SCROLL ANIMATIONS */}
      <div className="relative z-10 px-4 sm:px-8 lg:px-12 pb-8 sm:pb-12 pt-4">
        
        {/* Section header with scroll trigger */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-40px' }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className="flex items-center justify-between mb-4 border-b border-[#dedfe3]/80 pb-2.5"
        >
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#18181b]" />
            <h2 className="text-xs sm:text-sm font-black uppercase tracking-wider text-[#18181b]">
              Módulos de Acceso
            </h2>
          </div>
          <span className="text-[11px] font-bold text-[#5f6470]">
            4 Módulos · Pantalla Completa
          </span>
        </motion.div>

        {/* 4-column responsive grid with staggered scroll animations in mobile/desktop */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 lg:gap-6 items-stretch">
          
          {/* MÓDULO A: Informes de Contenido */}
          <motion.div
            initial={{ opacity: 0, y: 32 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.15, margin: '-20px' }}
            transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1], delay: 0.05 }}
            className="h-full flex flex-col"
          >
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
          </motion.div>

          {/* MÓDULO B: Flowdex */}
          <motion.div
            initial={{ opacity: 0, y: 32 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.15, margin: '-20px' }}
            transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1], delay: 0.15 }}
            className="h-full flex flex-col"
          >
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
          </motion.div>

          {/* MÓDULO C: Políticas */}
          <motion.div
            initial={{ opacity: 0, y: 32 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.15, margin: '-20px' }}
            transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1], delay: 0.25 }}
            className="h-full flex flex-col"
          >
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
          </motion.div>

          {/* MÓDULO D: Misión, Visión y Marca */}
          <motion.div
            initial={{ opacity: 0, y: 32 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.15, margin: '-20px' }}
            transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1], delay: 0.35 }}
            className="h-full flex flex-col"
          >
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
          </motion.div>
        </div>
      </div>
    </div>
  );
};

