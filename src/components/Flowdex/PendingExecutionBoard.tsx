import React, { useState, useEffect } from 'react';
import { PendingTask } from '../../types';
import {
  Clock,
  CheckCircle2,
  AlertCircle,
  PlusCircle,
  Search,
  Filter,
  Layers,
  Calendar,
  User,
  Tag,
  ArrowUpDown,
  Sparkles
} from 'lucide-react';

const INITIAL_PENDING_TASKS: PendingTask[] = [
  {
    id: 'task-1',
    code: 'FDX-SLA-001',
    title: 'Auditoría mensual de tiempos de respuesta en asignación Flowdex',
    description: 'Verificación del cumplimiento de la meta de 30 minutos en tickets de asignación de prospectos.',
    category: 'Operativa',
    priority: 'Alta',
    status: 'En progreso',
    slaHours: 4,
    assignedTo: 'Operaciones Vivibox',
    dueDate: '18 sep. 2026',
  },
  {
    id: 'task-2',
    code: 'FDX-TI-004',
    title: 'Actualización de endpoints de webhook para scoring de leads',
    description: 'Migración del listener de eventos para registro automático de métricas en panel central.',
    category: 'Técnica',
    priority: 'Media',
    status: 'Pendiente',
    slaHours: 24,
    assignedTo: 'Equipo de Datos',
    dueDate: '20 sep. 2026',
  },
  {
    id: 'task-3',
    code: 'FDX-SLA-008',
    title: 'Revisión de escalamiento nivel 3 por casos de fuerza mayor',
    description: 'Protocolo de validación documental y aprobación de excepciones por comité de soporte.',
    category: 'Legal',
    priority: 'Alta',
    status: 'Pendiente',
    slaHours: 12,
    assignedTo: 'Gobernanza & Legal',
    dueDate: '19 sep. 2026',
  },
  {
    id: 'task-4',
    code: 'FDX-COM-012',
    title: 'Alineación de cuotas trimestrales con reportes de Meta Ads',
    description: 'Consolidación de conversiones atribuidas y validación con los informes de contenido.',
    category: 'Comercial',
    priority: 'Media',
    status: 'Completado',
    slaHours: 0,
    assignedTo: 'Marketing & Performance',
    dueDate: '15 sep. 2026',
  },
];

export const PendingExecutionBoard: React.FC = () => {
  const [tasks, setTasks] = useState<PendingTask[]>(() => {
    const saved = localStorage.getItem('vivibox_flowdex_pending_tasks');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return INITIAL_PENDING_TASKS;
      }
    }
    return INITIAL_PENDING_TASKS;
  });

  const [filterCategory, setFilterCategory] = useState<string>('Todas');
  const [filterStatus, setFilterStatus] = useState<string>('Todos');
  const [search, setSearch] = useState<string>('');
  const [showModal, setShowModal] = useState<boolean>(false);

  // Form states for new task
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newCategory, setNewCategory] = useState<'Operativa' | 'Técnica' | 'Legal' | 'Comercial'>('Operativa');
  const [newPriority, setNewPriority] = useState<'Alta' | 'Media' | 'Baja'>('Media');
  const [newAssignee, setNewAssignee] = useState('');
  const [newSlaHours, setNewSlaHours] = useState('8');

  useEffect(() => {
    localStorage.setItem('vivibox_flowdex_pending_tasks', JSON.stringify(tasks));
  }, [tasks]);

  const handleStatusChange = (id: string, newStatus: 'Pendiente' | 'En progreso' | 'Completado') => {
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, status: newStatus } : t))
    );
  };

  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const newTask: PendingTask = {
      id: `task-${Date.now()}`,
      code: `FDX-OP-${Math.floor(100 + Math.random() * 900)}`,
      title: newTitle,
      description: newDesc || 'Sin descripción adicional.',
      category: newCategory,
      priority: newPriority,
      status: 'Pendiente',
      slaHours: parseInt(newSlaHours, 10) || 8,
      assignedTo: newAssignee || 'Equipo Flowdex',
      dueDate: new Date(Date.now() + 86400000 * 2).toLocaleDateString('es-ES', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      }),
    };

    setTasks([newTask, ...tasks]);
    setNewTitle('');
    setNewDesc('');
    setNewAssignee('');
    setShowModal(false);
  };

  const filteredTasks = tasks.filter((t) => {
    const matchesCategory = filterCategory === 'Todas' || t.category === filterCategory;
    const matchesStatus = filterStatus === 'Todos' || t.status === filterStatus;
    const matchesSearch =
      t.title.toLowerCase().includes(search.toLowerCase()) ||
      t.code.toLowerCase().includes(search.toLowerCase()) ||
      t.assignedTo.toLowerCase().includes(search.toLowerCase());
    return matchesCategory && matchesStatus && matchesSearch;
  });

  const totalTasks = tasks.length;
  const pendingCount = tasks.filter((t) => t.status === 'Pendiente').length;
  const inProgressCount = tasks.filter((t) => t.status === 'En progreso').length;
  const completedCount = tasks.filter((t) => t.status === 'Completado').length;

  return (
    <div className="space-y-6">
      {/* Top Metrics Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-white border border-[#dedfe3] shadow-xs flex flex-col justify-between">
          <span className="text-xs font-bold text-[#5f6470] uppercase tracking-wider">Total Registrados</span>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-3xl font-black text-[#18181b]">{totalTasks}</span>
            <Layers className="w-5 h-5 text-[#ed1c24]" />
          </div>
          <span className="text-[11px] text-[#5f6470] mt-1">Pendientes de backlog Flowdex</span>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-[#dedfe3] shadow-xs flex flex-col justify-between">
          <span className="text-xs font-bold text-[#5f6470] uppercase tracking-wider">Por Iniciar</span>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-3xl font-black text-amber-600">{pendingCount}</span>
            <Clock className="w-5 h-5 text-amber-500" />
          </div>
          <span className="text-[11px] text-[#5f6470] mt-1">A la espera de asignación</span>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-[#dedfe3] shadow-xs flex flex-col justify-between">
          <span className="text-xs font-bold text-[#5f6470] uppercase tracking-wider">En Ejecución</span>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-3xl font-black text-[#1877f2]">{inProgressCount}</span>
            <AlertCircle className="w-5 h-5 text-[#1877f2]" />
          </div>
          <span className="text-[11px] text-[#5f6470] mt-1">Con SLA activo en tiempo</span>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-[#dedfe3] shadow-xs flex flex-col justify-between">
          <span className="text-xs font-bold text-[#5f6470] uppercase tracking-wider">Completados</span>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-3xl font-black text-emerald-600">{completedCount}</span>
            <CheckCircle2 className="w-5 h-5 text-emerald-500" />
          </div>
          <span className="text-[11px] text-[#5f6470] mt-1">Cierre validado y registrado</span>
        </div>
      </div>

      {/* Control Bar: Search, Filters & Add Task */}
      <div className="p-4 rounded-2xl bg-white border border-[#dedfe3] shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
          {/* Search */}
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-[#5f6470] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por código, título o responsable..."
              className="w-full pl-9 pr-3 py-2 text-xs bg-[#f4f4f6] rounded-xl border border-transparent focus:border-[#ed1c24] focus:bg-white focus:outline-none transition-all"
            />
          </div>

          {/* Filter Category */}
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="px-3 py-2 text-xs font-semibold rounded-xl bg-[#f4f4f6] border border-transparent focus:border-[#ed1c24] focus:outline-none cursor-pointer"
          >
            <option value="Todas">Categoría: Todas</option>
            <option value="Operativa">Operativa</option>
            <option value="Técnica">Técnica</option>
            <option value="Legal">Legal</option>
            <option value="Comercial">Comercial</option>
          </select>

          {/* Filter Status */}
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-2 text-xs font-semibold rounded-xl bg-[#f4f4f6] border border-transparent focus:border-[#ed1c24] focus:outline-none cursor-pointer"
          >
            <option value="Todos">Estado: Todos</option>
            <option value="Pendiente">Pendiente</option>
            <option value="En progreso">En progreso</option>
            <option value="Completado">Completado</option>
          </select>
        </div>

        {/* Add Task Button */}
        <button
          onClick={() => setShowModal(true)}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#ed1c24] hover:bg-[#d6151c] text-white text-xs font-extrabold shadow-sm transition-all cursor-pointer hover:shadow-md"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Nuevo Pendiente Flowdex</span>
        </button>
      </div>

      {/* Task List Table */}
      <div className="bg-white rounded-2xl border border-[#dedfe3] shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-[#dedfe3] bg-[#f7f7f8] text-[#5f6470] font-black uppercase tracking-wider">
                <th className="py-3 px-4">Código</th>
                <th className="py-3 px-4">Título del Pendiente</th>
                <th className="py-3 px-4">Categoría</th>
                <th className="py-3 px-4">Prioridad</th>
                <th className="py-3 px-4">Responsable</th>
                <th className="py-3 px-4">Tiempo SLA</th>
                <th className="py-3 px-4 text-right">Estado Operativo</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#dedfe3]/70">
              {filteredTasks.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-10 text-center text-[#5f6470]">
                    No se encontraron pendientes con los filtros aplicados.
                  </td>
                </tr>
              ) : (
                filteredTasks.map((t) => (
                  <tr key={t.id} className="hover:bg-[#f9fafb] transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-[#18181b]">
                      {t.code}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-[#18181b]">{t.title}</div>
                      <div className="text-[11px] text-[#5f6470] mt-0.5 max-w-md">{t.description}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="px-2.5 py-1 rounded-lg bg-[#f4f4f6] text-[#18181b] font-bold border border-[#dedfe3]">
                        {t.category}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`px-2 py-0.5 rounded-full font-extrabold text-[10px] uppercase tracking-wider ${
                          t.priority === 'Alta'
                            ? 'bg-rose-100 text-rose-700'
                            : t.priority === 'Media'
                            ? 'bg-amber-100 text-amber-700'
                            : 'bg-emerald-100 text-emerald-700'
                        }`}
                      >
                        {t.priority}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-[#18181b]">
                      {t.assignedTo}
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-[#5f6470]">
                      {t.status === 'Completado' ? (
                        <span className="text-emerald-600 font-bold">Cumplido</span>
                      ) : (
                        <span>{t.slaHours}h límite</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <select
                        value={t.status}
                        onChange={(e) =>
                          handleStatusChange(
                            t.id,
                            e.target.value as 'Pendiente' | 'En progreso' | 'Completado'
                          )
                        }
                        className={`text-xs font-black px-2.5 py-1.5 rounded-xl border cursor-pointer focus:outline-none ${
                          t.status === 'Completado'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                            : t.status === 'En progreso'
                            ? 'bg-blue-50 text-[#1877f2] border-blue-300'
                            : 'bg-amber-50 text-amber-700 border-amber-300'
                        }`}
                      >
                        <option value="Pendiente">Pendiente</option>
                        <option value="En progreso">En progreso</option>
                        <option value="Completado">Completado</option>
                      </select>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Task Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-[#dedfe3]">
            <h3 className="text-xl font-black text-[#18181b] mb-1">Nuevo Pendiente de Ejecución Flowdex</h3>
            <p className="text-xs text-[#5f6470] mb-6">
              Registra una tarea operativa para control de cumplimiento bajo el SLA 2026.
            </p>

            <form onSubmit={handleAddTask} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-[#18181b] mb-1">Título de la Tarea / Asignación</label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="Ej: Calibración de tiempos de entrega en lead scoring"
                  className="w-full px-3 py-2 rounded-xl bg-[#f4f4f6] border border-[#dedfe3] focus:border-[#ed1c24] focus:bg-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-[#18181b] mb-1">Detalle u Observaciones</label>
                <textarea
                  rows={2}
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  placeholder="Descripción de la tarea y acciones esperadas..."
                  className="w-full px-3 py-2 rounded-xl bg-[#f4f4f6] border border-[#dedfe3] focus:border-[#ed1c24] focus:bg-white focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-[#18181b] mb-1">Categoría</label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl bg-[#f4f4f6] border border-[#dedfe3] focus:border-[#ed1c24] focus:outline-none"
                  >
                    <option value="Operativa">Operativa</option>
                    <option value="Técnica">Técnica</option>
                    <option value="Legal">Legal</option>
                    <option value="Comercial">Comercial</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-[#18181b] mb-1">Prioridad SLA</label>
                  <select
                    value={newPriority}
                    onChange={(e) => setNewPriority(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl bg-[#f4f4f6] border border-[#dedfe3] focus:border-[#ed1c24] focus:outline-none"
                  >
                    <option value="Alta">Alta (Crítico)</option>
                    <option value="Media">Media (Estándar)</option>
                    <option value="Baja">Baja</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-[#18181b] mb-1">Responsable / Área</label>
                  <input
                    type="text"
                    value={newAssignee}
                    onChange={(e) => setNewAssignee(e.target.value)}
                    placeholder="Ej: Operaciones Vivibox"
                    className="w-full px-3 py-2 rounded-xl bg-[#f4f4f6] border border-[#dedfe3] focus:border-[#ed1c24] focus:bg-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-[#18181b] mb-1">Límite SLA (Horas)</label>
                  <input
                    type="number"
                    value={newSlaHours}
                    onChange={(e) => setNewSlaHours(e.target.value)}
                    min="1"
                    max="72"
                    className="w-full px-3 py-2 rounded-xl bg-[#f4f4f6] border border-[#dedfe3] focus:border-[#ed1c24] focus:bg-white focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#dedfe3]">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-xl text-[#5f6470] font-bold hover:bg-[#f4f4f6] cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-[#ed1c24] hover:bg-[#d6151c] text-white font-extrabold shadow-sm cursor-pointer"
                >
                  Guardar Pendiente
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
