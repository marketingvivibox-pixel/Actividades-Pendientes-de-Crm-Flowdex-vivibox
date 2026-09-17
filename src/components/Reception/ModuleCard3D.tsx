import React, { useState, useRef } from 'react';
import { ArrowUpRight } from 'lucide-react';

interface ModuleCard3DProps {
  index: number;
  badge: string;
  title: string;
  subtitle: string;
  subdivisions?: string[];
  icon: React.ReactNode;
  accentColor: string;
  onOpen: () => void;
  onSubdivisionClick?: (subdivision: string) => void;
}

export const ModuleCard3D: React.FC<ModuleCard3DProps> = ({
  index,
  badge,
  title,
  subtitle,
  subdivisions = [],
  icon,
  accentColor,
  onOpen,
  onSubdivisionClick,
}) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [rotateX, setRotateX] = useState<number>(0);
  const [isHovered, setIsHovered] = useState<boolean>(false);
  const [isFocused, setIsFocused] = useState<boolean>(false);

  // Controlled subtle tilt on X-axis strictly within [-4deg, 4deg]
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const y = e.clientY - rect.top;
    const centerY = rect.height / 2;

    const rawRotX = -((y - centerY) / centerY) * 3.5;
    const clampedRotX = Math.max(-3.5, Math.min(3.5, rawRotX));
    setRotateX(clampedRotX);
  };

  const handleMouseEnter = () => {
    setIsHovered(true);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    setRotateX(0);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onOpen();
    }
  };

  const floatDelay = `${index * 0.75}s`;
  const activeFocus = isHovered || isFocused;

  return (
    <div
      className="perspective-container relative w-full h-full min-h-[340px] sm:min-h-[360px]"
      style={{ perspective: '1100px' }}
    >
      <div
        ref={cardRef}
        tabIndex={0}
        role="button"
        aria-label={`Módulo ${title}. Presiona Enter o el botón Abrir para acceder`}
        onMouseMove={handleMouseMove}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onFocus={() => setIsFocused(true)}
        onBlur={() => {
          setIsFocused(false);
          setRotateX(0);
        }}
        onKeyDown={handleKeyDown}
        onClick={onOpen}
        className="w-full h-full relative rounded-3xl bg-white border border-[#dedfe3] p-6 sm:p-7 flex flex-col justify-between shadow-xs transition-all duration-300 ease-out cursor-pointer group focus:outline-none focus-visible:ring-3 focus-visible:ring-[#ed1c24] focus-visible:ring-offset-2"
        style={{
          transformStyle: 'preserve-3d',
          transform: activeFocus
            ? `rotateX(${rotateX * 0.5}deg) translateZ(18px) translateY(-4px)`
            : `rotateX(0deg) translateZ(0px)`,
          animation: activeFocus ? 'none' : 'cardFloat3D 6s ease-in-out infinite',
          animationDelay: floatDelay,
          boxShadow: activeFocus
            ? `0 24px 38px -10px rgba(0, 0, 0, 0.08), 0 0 0 1px ${accentColor}33`
            : `0 8px 20px -6px rgba(0, 0, 0, 0.03)`,
        }}
      >
        {/* Dynamic Sheen overlay on hover */}
        <div
          className="absolute inset-0 rounded-3xl pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300"
          style={{
            background: `radial-gradient(circle at 50% 15%, ${accentColor}10 0%, transparent 70%)`,
          }}
        />

        {/* 1. TOP ZONE: Badge and Icon with aligned baseline */}
        <div className="flex items-start justify-between z-10">
          <span
            className="text-[11px] font-black uppercase tracking-wider px-3 py-1 rounded-full border shadow-2xs"
            style={{
              backgroundColor: `${accentColor}10`,
              borderColor: `${accentColor}30`,
              color: accentColor,
            }}
          >
            {badge}
          </span>

          <div
            className="w-12 h-12 rounded-2xl flex items-center justify-center border border-black/5 shadow-xs transition-transform duration-300 group-hover:scale-110 shrink-0"
            style={{
              backgroundColor: `${accentColor}12`,
              color: accentColor,
              transform: activeFocus ? 'translateZ(18px)' : 'none',
            }}
          >
            {icon}
          </div>
        </div>

        {/* 2. CENTER ZONE: Structured with fixed vertical rhythm so all cards align harmoniously */}
        <div
          className="flex-1 flex flex-col justify-center py-4 z-10 transition-transform duration-300"
          style={{ transform: activeFocus ? 'translateZ(22px)' : 'none' }}
        >
          {/* Title with fixed minimum height for horizontal alignment across the grid */}
          <div className="min-h-[3.25rem] flex items-center mb-1.5">
            <h3 className="text-xl sm:text-2xl font-black text-[#18181b] tracking-tight leading-tight group-hover:text-[#ed1c24] transition-colors line-clamp-2">
              {title}
            </h3>
          </div>

          {/* Subtitle with fixed minimum height */}
          <div className="min-h-[2.5rem] mb-3">
            <p className="text-xs sm:text-sm text-[#5f6470] line-clamp-2 leading-relaxed">
              {subtitle}
            </p>
          </div>

          {/* Subdivisions pills with uniform height and interactive clickability */}
          <div className="min-h-[2.25rem] flex items-center">
            {subdivisions.length > 0 ? (
              <div className="flex flex-wrap gap-1.5">
                {subdivisions.map((sub, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={(e) => {
                      if (onSubdivisionClick) {
                        e.stopPropagation();
                        onSubdivisionClick(sub);
                      }
                    }}
                    className="inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-lg bg-[#f4f4f6] hover:bg-white text-[#44403c] border border-[#dedfe3] hover:border-black/20 transition-all cursor-pointer shadow-2xs hover:shadow-xs"
                    title={`Ir directamente a ${sub}`}
                  >
                    <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: accentColor }} />
                    <span className="truncate max-w-[150px]">{sub}</span>
                  </button>
                ))}
              </div>
            ) : (
              <div className="h-6" />
            )}
          </div>
        </div>

        {/* 3. BOTTOM ZONE: 'Pantalla completa' & Prominent 'Abrir' button at exact same baseline */}
        <div
          className="pt-4 border-t border-[#dedfe3]/70 z-10 flex items-center justify-between transition-transform duration-300 mt-auto"
          style={{ transform: activeFocus ? 'translateZ(26px)' : 'none' }}
        >
          <span className="text-xs font-semibold text-[#5f6470]">
            Pantalla completa
          </span>

          <button
            id={`btn-abrir-modulo-${index}`}
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onOpen();
            }}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-extrabold text-sm text-white shadow-xs transition-all cursor-pointer group-hover:shadow-md hover:scale-105 active:scale-95"
            style={{ backgroundColor: accentColor }}
            aria-label={`Abrir módulo ${title}`}
          >
            <span>Abrir</span>
            <ArrowUpRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
