import React from 'react';
import { X, Palette, CheckCircle2 } from 'lucide-react';
import { FOCUS_DEFINITIONS } from '../data/crmTasksData';
import { FunctionalFocus } from '../types';

interface SemanticLegendModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SemanticLegendModal: React.FC<SemanticLegendModalProps> = ({
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-3xl border border-[#e5ded2] bg-white text-[#292524] p-6 sm:p-8 shadow-2xl">
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl text-[#786d5f] hover:text-[#292524] hover:bg-[#faf6ee] transition-all cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-5">
          <div className="p-3 rounded-2xl border border-[#e4dccf] bg-[#faf7f2] text-[#a87943]">
            <Palette className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-bold font-serif-warm text-[#1c1917]">
              Teoría del Color y Enfoques Operativos
            </h2>
            <p className="text-xs text-[#786d5f]">
              Diferenciación visual humana basada en la naturaleza del impacto para el CRM
            </p>
          </div>
        </div>

        {/* Explanation paragraph */}
        <div className="p-4 rounded-2xl bg-[#faf7f0] border border-[#ebe3d5] mb-6 text-xs sm:text-sm text-[#574d3f] leading-relaxed">
          Cada tarea crítica se clasifica según su <strong>enfoque funcional</strong> dentro de la operación 
          del CRM de WhatsApp. Esto permite al equipo (Alex en desarrollo y Freddy en ventas) entender 
          inmediatamente a qué área afecta cada punto sin necesidad de releer toda la discusión técnica.
        </div>

        {/* Grid of Focus Definitions */}
        <div className="space-y-3.5">
          {(Object.keys(FOCUS_DEFINITIONS) as FunctionalFocus[]).map((key) => {
            const def = FOCUS_DEFINITIONS[key];
            return (
              <div
                key={key}
                className="p-4 rounded-2xl border transition-all bg-[#ffffff] hover:bg-[#fcfaf7]"
                style={{
                  borderColor: '#e8e0d4',
                  borderLeftWidth: '5px',
                  borderLeftColor: def.accentHex,
                }}
              >
                <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5">
                  <div className="flex items-center gap-2">
                    <span
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: def.accentHex }}
                    />
                    <h3 className="font-bold text-sm text-[#1c1917]">
                      {def.name}
                    </h3>
                  </div>
                  <span
                    className="text-[11px] font-mono font-bold px-2 py-0.5 rounded-md border"
                    style={{
                      backgroundColor: '#faf7f2',
                      borderColor: `${def.accentHex}40`,
                      color: def.accentHex,
                    }}
                  >
                    {def.colorName}
                  </span>
                </div>
                <p className="text-xs text-[#635747] leading-relaxed">
                  {def.description}
                </p>
              </div>
            );
          })}
        </div>

        {/* Footer info */}
        <div className="mt-6 pt-4 border-t border-[#f0eae0] flex items-center justify-between text-xs text-[#786d5f]">
          <span className="flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-[#10b981]" />
            Diseño ergonómico, claro y arenoso
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-bold bg-[#292524] text-[#f6f3ed] hover:bg-[#44403c] transition-colors cursor-pointer"
          >
            Entendido
          </button>
        </div>
      </div>
    </div>
  );
};
