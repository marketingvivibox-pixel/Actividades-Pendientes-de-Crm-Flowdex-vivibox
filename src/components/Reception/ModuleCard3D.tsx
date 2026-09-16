import React, { useState, useRef } from 'react';
import { ArrowUpRight, Sparkles } from 'lucide-react';

interface ModuleCard3DProps {
  index: number;
  badge: string;
  title: string;
  subtitle: string;
  subdivisions: string[];
  icon: React.ReactNode;
  accentColor: string;
  onOpen: () => void;
}

export const ModuleCard3D: React.FC<ModuleCard3DProps> = ({
  index,
  badge,
  title,
  subtitle,
  subdivisions,
  icon,
  accentColor,
  onOpen,
}) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [rotateX, setRotateX] = useState<number>(0);
  const [rotateY, setRotateY] = useState<number>(0);
  const [isHovered, setIsHovered] = useState<boolean>(false);

  // Mouse move handler for interactive 3D rotation on the X-axis
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    // Calculate rotation on X-axis (tilt up/down) and subtle Y-axis (tilt left/right)
    const rotX = -((y - centerY) / centerY) * 14; // Degrees on X axis
    const rotY = ((x - centerX) / centerX) * 8; // Degrees on Y axis

    setRotateX(rotX);
    setRotateY(rotY);
  };

  const handleMouseEnter = () => {
    setIsHovered(true);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    setRotateX(0);
    setRotateY(0);
  };

  // Staggered floating delay for natural 3D wave motion
  const floatDelay = `${index * 0.7}s`;

  return (
    <div
      className="perspective-container relative w-full aspect-square min-h-[300px] sm:min-h-[340px]"
      style={{ perspective: '1100px' }}
    >
      <div
        ref={cardRef}
        onMouseMove={handleMouseMove}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        className="w-full h-full relative rounded-3xl bg-white border border-[#dedfe3] p-6 sm:p-7 flex flex-col justify-between shadow-sm transition-all duration-300 ease-out cursor-pointer group"
        style={{
          transformStyle: 'preserve-3d',
          transform: isHovered
            ? `rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateZ(24px)`
            : `rotateX(0deg) rotateY(0deg) translateZ(0px)`,
          animation: isHovered ? 'none' : `cardFloat3D 6s ease-in-out infinite`,
          animationDelay: floatDelay,
          boxShadow: isHovered
            ? `0 24px 38px -10px rgba(0, 0, 0, 0.08), 0 0 0 1px ${accentColor}33`
            : `0 8px 20px -6px rgba(0, 0, 0, 0.04)`,
        }}
      >
        {/* Dynamic Light Sheen overlay */}
        <div
          className="absolute inset-0 rounded-3xl pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300"
          style={{
            background: `radial-gradient(circle at 50% 20%, ${accentColor}12 0%, transparent 70%)`,
          }}
        />

        {/* Top Header Section inside card */}
        <div className="flex items-start justify-between z-10">
          <div className="flex flex-col gap-1.5">
            <span
              className="text-[11px] font-black uppercase tracking-wider px-3 py-1 rounded-full border"
              style={{
                backgroundColor: `${accentColor}10`,
                borderColor: `${accentColor}30`,
                color: accentColor,
              }}
            >
              {badge}
            </span>
          </div>

          <div
            className="w-12 h-12 rounded-2xl flex items-center justify-center border border-black/5 shadow-xs transition-transform duration-300 group-hover:scale-110"
            style={{
              backgroundColor: `${accentColor}12`,
              color: accentColor,
              transform: isHovered ? 'translateZ(20px)' : 'none',
            }}
          >
            {icon}
          </div>
        </div>

        {/* Center Content Section */}
        <div
          className="my-auto py-2 z-10 transition-transform duration-300"
          style={{ transform: isHovered ? 'translateZ(25px)' : 'none' }}
        >
          <h3 className="text-xl sm:text-2xl font-black text-[#18181b] tracking-tight mb-2 leading-tight group-hover:text-[#ed1c24] transition-colors">
            {title}
          </h3>

          <p className="text-xs sm:text-sm text-[#5f6470] line-clamp-2 leading-relaxed mb-4">
            {subtitle}
          </p>

          {/* Subdivisions pills requested by user */}
          <div className="flex flex-wrap gap-1.5">
            {subdivisions.map((sub, i) => (
              <span
                key={i}
                className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-lg bg-[#f4f4f6] text-[#5f6470] border border-[#dedfe3]"
              >
                <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: accentColor }} />
                {sub}
              </span>
            ))}
          </div>
        </div>

        {/* Bottom Section: Mandatory 'Abrir' button */}
        <div
          className="pt-4 border-t border-[#dedfe3]/70 z-10 flex items-center justify-between transition-transform duration-300"
          style={{ transform: isHovered ? 'translateZ(30px)' : 'none' }}
        >
          <span className="text-xs font-semibold text-[#5f6470]">
            Pantalla completa
          </span>

          <button
            id={`btn-abrir-modulo-${index}`}
            onClick={(e) => {
              e.stopPropagation();
              onOpen();
            }}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-extrabold text-sm text-white shadow-sm transition-all cursor-pointer group-hover:shadow-md hover:scale-105 active:scale-95"
            style={{ backgroundColor: accentColor }}
          >
            <span>Abrir</span>
            <ArrowUpRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
