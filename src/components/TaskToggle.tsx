import React from 'react';
import { Power } from 'lucide-react';

interface TaskToggleProps {
  id: number;
  isActive: boolean;
  onToggle: (id: number) => void;
  accentColor?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const TaskToggle: React.FC<TaskToggleProps> = ({
  id,
  isActive,
  onToggle,
  accentColor = '#06b6d4',
  size = 'md',
}) => {
  const isSmall = size === 'sm';

  return (
    <button
      id={`toggle-task-${id}`}
      type="button"
      role="switch"
      aria-checked={isActive}
      onClick={(e) => {
        e.stopPropagation();
        onToggle(id);
      }}
      title={isActive ? 'Haga clic para APAGAR y opacar esta tarea (Marcar resuelta)' : 'Haga clic para ENCENDER esta tarea activa'}
      className={`relative inline-flex items-center rounded-full transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-950 cursor-pointer ${
        isSmall ? 'w-10 h-6' : 'w-14 h-7'
      } ${
        isActive
          ? 'bg-gradient-to-r from-cyan-600 via-indigo-600 to-emerald-500 shadow-[0_0_14px_rgba(6,182,212,0.45)] focus:ring-cyan-400'
          : 'bg-slate-800 border border-slate-700/80 shadow-inner focus:ring-slate-500'
      }`}
    >
      <span className="sr-only">Alternar estado de tarea</span>
      <span
        className={`pointer-events-none flex items-center justify-center rounded-full bg-slate-950 transition-all duration-300 transform shadow-md ${
          isSmall ? 'w-4 h-4 text-[9px]' : 'w-5 h-5 text-[10px]'
        } ${
          isActive
            ? isSmall
              ? 'translate-x-5 text-cyan-300'
              : 'translate-x-8 text-cyan-300'
            : isSmall
            ? 'translate-x-1 text-slate-500'
            : 'translate-x-1 text-slate-500'
        }`}
      >
        <Power className={isSmall ? 'w-2.5 h-2.5' : 'w-3 h-3'} />
      </span>
      {/* Visual glowing indicator */}
      {isActive && (
        <span
          className="absolute -top-1 -right-1 flex h-2.5 w-2.5"
          style={{ pointerEvents: 'none' }}
        >
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-cyan-500"></span>
        </span>
      )}
    </button>
  );
};
