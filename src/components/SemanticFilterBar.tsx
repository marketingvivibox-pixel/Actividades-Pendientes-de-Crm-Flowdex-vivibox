import React, { useState } from 'react';
import { 
  Search, 
  BarChart3, 
  Table, 
  LayoutGrid, 
  X,
  Filter,
  UserCheck,
  ChevronDown,
  Orbit,
  Rotate3d,
  Plus
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { FunctionalFocus } from '../types';
import { FOCUS_DEFINITIONS, MEETING_PARTICIPANTS } from '../data/crmTasksData';

export type FilterStatus = 'all' | 'active_only' | 'dimmed_only';
export type SortOption = 'manual' | 'criticality_desc' | 'criticality_asc' | 'priority' | 'number';
export type ViewMode = '3d' | 'spheres' | 'proportional' | 'table' | 'standard';

interface SemanticFilterBarProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  statusFilter: FilterStatus;
  onStatusFilterChange: (status: FilterStatus) => void;
  sortOption: SortOption;
  onSortOptionChange: (sort: SortOption) => void;
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  selectedFocus: FunctionalFocus | 'all';
  onSelectFocus: (focus: FunctionalFocus | 'all') => void;
  selectedResponsible: string;
  onSelectResponsible: (resp: string) => void;
  activeCount: number;
  dimmedCount: number;
  totalCount: number;
  focusCounts: Record<FunctionalFocus, number>;
  onAddNewTask?: () => void;
}

export const SemanticFilterBar: React.FC<SemanticFilterBarProps> = ({
  searchTerm,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  sortOption,
  onSortOptionChange,
  viewMode,
  onViewModeChange,
  selectedFocus,
  onSelectFocus,
  selectedResponsible,
  onSelectResponsible,
  activeCount,
  dimmedCount,
  totalCount,
  focusCounts,
  onAddNewTask,
}) => {
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);

  // Count how many filters are currently active
  const activeFiltersCount = 
    (selectedFocus !== 'all' ? 1 : 0) + 
    (statusFilter !== 'all' ? 1 : 0) + 
    (selectedResponsible !== 'all' ? 1 : 0);

  const handleResetFilters = () => {
    onSelectFocus('all');
    onStatusFilterChange('all');
    onSelectResponsible('all');
    onSearchChange('');
  };

  return (
    <div className="w-full rounded-2xl border border-[#e5dfd3] bg-white p-3.5 sm:p-4 shadow-[0_4px_18px_-2px_rgba(87,70,55,0.05)] mb-5 transition-all">
      {/* Main Single Row: Search + View Modes + Sort + Filter Drawer Toggle */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
        {/* Search Bar */}
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 text-[#a89c8b] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            id="search-tasks-input"
            type="text"
            placeholder="Buscar por pendiente, evidencia o responsable..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-10 pr-9 py-2 rounded-xl border border-[#e2d8c9] bg-[#faf7f2] text-xs sm:text-sm text-[#292524] placeholder-[#9e9282] focus:bg-white focus:border-[#a87943] focus:ring-2 focus:ring-[#a87943]/15 transition-all outline-none"
          />
          {searchTerm && (
            <button
              onClick={() => onSearchChange('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#a89c8b] hover:text-[#574d3f] cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2 self-start lg:self-auto">
          {/* Add New Task Button for meeting adjustments */}
          {onAddNewTask && (
            <button
              id="add-new-task-btn"
              type="button"
              onClick={onAddNewTask}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-[#292524] hover:bg-[#44403c] text-amber-300 border border-[#292524] shadow-2xs transition-all cursor-pointer"
              title="Agregar un nuevo pendiente acordado en la reunión"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ Pendiente</span>
            </button>
          )}

          {/* View Mode Switch (Tabla is default and first) */}
          <div className="flex items-center gap-1 p-1 rounded-xl border border-[#e4dccf] bg-[#f7f3eb]">
            <button
              id="view-table-btn"
              type="button"
              onClick={() => onViewModeChange('table')}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                viewMode === 'table'
                  ? 'bg-[#292524] text-[#f6f3ed] shadow-2xs'
                  : 'text-[#6d6152] hover:text-[#292524] hover:bg-[#ede5d8]'
              }`}
              title="Vista de Tabla Interactiva con reordenamiento y edición"
            >
              <Table className={`w-3.5 h-3.5 ${viewMode === 'table' ? 'text-amber-400' : 'text-[#8c7860]'}`} />
              <span>Tabla</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            </button>

            <button
              id="view-3d-btn"
              type="button"
              onClick={() => onViewModeChange('3d')}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                viewMode === '3d'
                  ? 'bg-[#292524] text-[#f6f3ed] shadow-2xs'
                  : 'text-[#6d6152] hover:text-[#292524] hover:bg-[#ede5d8]'
              }`}
              title="Sistema Planetario 3D con rotación axial, texturas cósmicas y anillos"
            >
              <Rotate3d className={`w-3.5 h-3.5 ${viewMode === '3d' ? 'text-amber-400 animate-spin-slow' : 'text-amber-600'}`} />
              <span>3D Planetas</span>
            </button>

            <button
              id="view-spheres-btn"
              type="button"
              onClick={() => onViewModeChange('spheres')}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                viewMode === 'spheres'
                  ? 'bg-[#292524] text-[#f6f3ed] shadow-2xs'
                  : 'text-[#6d6152] hover:text-[#292524] hover:bg-[#ede5d8]'
              }`}
              title="Círculos con físicas de gravedad y colisiones 2D"
            >
              <Orbit className={`w-3.5 h-3.5 ${viewMode === 'spheres' ? 'text-amber-400 animate-spin-slow' : 'text-amber-600'}`} />
              <span>Círculos 2D</span>
            </button>

            <button
              id="view-proportional-btn"
              type="button"
              onClick={() => onViewModeChange('proportional')}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                viewMode === 'proportional'
                  ? 'bg-[#292524] text-[#f6f3ed] shadow-2xs'
                  : 'text-[#6d6152] hover:text-[#292524] hover:bg-[#ede5d8]'
              }`}
              title="Espacios proporcionales al impacto"
            >
              <BarChart3 className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden sm:inline">Proporcional</span>
            </button>

            <button
              id="view-standard-btn"
              type="button"
              onClick={() => onViewModeChange('standard')}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                viewMode === 'standard'
                  ? 'bg-[#292524] text-[#f6f3ed] shadow-2xs'
                  : 'text-[#6d6152] hover:text-[#292524] hover:bg-[#ede5d8]'
              }`}
              title="Cuadrícula uniforme limpia"
            >
              <LayoutGrid className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden md:inline">Tarjetas</span>
            </button>
          </div>

          {/* Sort Dropdown */}
          <select
            id="sort-select"
            value={sortOption}
            onChange={(e) => onSortOptionChange(e.target.value as SortOption)}
            className="px-2.5 py-1.5 rounded-xl border border-[#e2d8c9] bg-[#faf7f2] text-xs font-semibold text-[#292524] focus:border-[#a87943] transition-colors cursor-pointer outline-none"
          >
            <option value="manual">Orden Manual de Reunión</option>
            <option value="criticality_desc">Impacto CRM (Mayor a Menor)</option>
            <option value="criticality_asc">Impacto CRM (Menor a Mayor)</option>
            <option value="priority">Prioridad (Alta a Baja)</option>
            <option value="number">Número de Ticket (#1, #2...)</option>
          </select>

          {/* Expand Filters Button */}
          <button
            type="button"
            onClick={() => setIsFiltersOpen(!isFiltersOpen)}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer shadow-2xs ${
              isFiltersOpen || activeFiltersCount > 0
                ? 'bg-[#292524] text-[#f6f3ed] border-[#292524]'
                : 'bg-[#faf7f2] hover:bg-[#f0e9dc] text-[#574c3e] border-[#e4dcce]'
            }`}
          >
            <Filter className="w-3.5 h-3.5 text-amber-400" />
            <span>Filtros</span>
            {activeFiltersCount > 0 && (
              <span className="w-4 h-4 rounded-full bg-amber-500 text-stone-900 font-bold text-[10px] flex items-center justify-center">
                {activeFiltersCount}
              </span>
            )}
            <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isFiltersOpen ? 'rotate-180' : ''}`} />
          </button>
        </div>
      </div>

      {/* Expandable Filters Drawer */}
      <AnimatePresence>
        {isFiltersOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden mt-3 pt-3 border-t border-[#f0eae0] space-y-3"
          >
            {/* Functional Focuses (Teoría del Color) */}
            <div>
              <div className="flex items-center justify-between gap-2 mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-[#8c7860]">
                  Filtrar por Enfoque Funcional:
                </span>
                {activeFiltersCount > 0 && (
                  <button
                    type="button"
                    onClick={handleResetFilters}
                    className="text-xs text-amber-800 hover:underline font-semibold cursor-pointer"
                  >
                    Restablecer Filtros
                  </button>
                )}
              </div>

              <div className="flex flex-wrap gap-1.5">
                <button
                  type="button"
                  onClick={() => onSelectFocus('all')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
                    selectedFocus === 'all'
                      ? 'bg-[#292524] text-[#f6f3ed] border-[#292524] shadow-2xs'
                      : 'bg-[#faf7f2] text-[#6d6152] border-[#e4dccf] hover:bg-[#f0e9dc]'
                  }`}
                >
                  Todos ({totalCount})
                </button>

                {(Object.keys(FOCUS_DEFINITIONS) as FunctionalFocus[]).map((focusKey) => {
                  const def = FOCUS_DEFINITIONS[focusKey];
                  const isSelected = selectedFocus === focusKey;
                  const count = focusCounts[focusKey] || 0;

                  return (
                    <button
                      key={focusKey}
                      type="button"
                      onClick={() => onSelectFocus(isSelected ? 'all' : focusKey)}
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
                        isSelected
                          ? 'border-2 shadow-2xs ring-2 ring-[#a87943]/20 bg-white'
                          : 'bg-[#faf7f2] border-[#e4dccf] text-[#6d6152] hover:bg-[#f0e9dc]'
                      }`}
                      style={isSelected ? {
                        borderColor: def.accentHex,
                        color: def.accentHex,
                      } : undefined}
                    >
                      <span 
                        className="w-2 h-2 rounded-full" 
                        style={{ backgroundColor: def.accentHex }} 
                      />
                      <span>{def.name}</span>
                      <span className="text-[10px] opacity-75 font-mono">({count})</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Status and Responsible Person Filters */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-[#f0eae0] text-xs">
              {/* Status Filter */}
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[#8c7860] font-medium mr-1">Estado de Tarea:</span>
                <button
                  type="button"
                  onClick={() => onStatusFilterChange('all')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                    statusFilter === 'all'
                      ? 'bg-[#574d3f] text-white border-[#574d3f]'
                      : 'bg-[#faf7f2] text-[#6d6152] border-[#e4dccf] hover:bg-[#f0e9dc]'
                  }`}
                >
                  Todas ({totalCount})
                </button>

                <button
                  type="button"
                  onClick={() => onStatusFilterChange('active_only')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                    statusFilter === 'active_only'
                      ? 'bg-emerald-700 text-white border-emerald-700'
                      : 'bg-[#faf7f2] text-[#6d6152] border-[#e4dccf] hover:bg-[#f0e9dc]'
                  }`}
                >
                  Solo Activos ({activeCount})
                </button>

                <button
                  type="button"
                  onClick={() => onStatusFilterChange('dimmed_only')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                    statusFilter === 'dimmed_only'
                      ? 'bg-stone-700 text-white border-stone-700'
                      : 'bg-[#faf7f2] text-[#6d6152] border-[#e4dccf] hover:bg-[#f0e9dc]'
                  }`}
                >
                  Solo Opacados ({dimmedCount})
                </button>
              </div>

              {/* Responsible Person Select */}
              <div className="flex items-center gap-2">
                <UserCheck className="w-3.5 h-3.5 text-[#a87943]" />
                <span className="text-[#8c7860] font-medium">Responsable:</span>
                <select
                  value={selectedResponsible}
                  onChange={(e) => onSelectResponsible(e.target.value)}
                  className="px-2.5 py-1 rounded-lg border border-[#e2d8c9] bg-[#faf7f2] text-xs font-semibold text-[#292524] cursor-pointer outline-none"
                >
                  <option value="all">Todos ({totalCount})</option>
                  {MEETING_PARTICIPANTS.map((p) => (
                    <option key={p.nombre} value={p.nombre}>
                      {p.nombre} ({p.rol})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
