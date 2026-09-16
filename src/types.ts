export type ActiveView = 'centro-de-analisis' | 'informes' | 'flowdex' | 'politicas' | 'mision-vision';

export type MainSection = ActiveView;

export type InformesSubSection = 'publicitario' | 'organico';

export type FlowdexSubSection = 'slas' | 'pendientes';

export type FlowdexDocId = string;

export interface HostedReport {
  id: string;
  platform: 'meta' | 'tiktok';
  platformLabel: string;
  title: string;
  description: string;
  date: string;
  format: string;
  fileUrl: string;
  category: 'publicitario' | 'organico';
  status: 'Disponible' | 'Actualizado' | 'En proceso';
  accentColor: string;
}

export interface FlowdexDocument {
  id: FlowdexDocId;
  title: string;
  subtitle: string;
  version: string;
  year: string;
  category: string;
  updatedAt: string;
  fileUrl?: string;
  htmlContent: string;
}

export interface PendingTask {
  id: string;
  code: string;
  title: string;
  description: string;
  category: 'Operativa' | 'Técnica' | 'Legal' | 'Comercial';
  priority: 'Alta' | 'Media' | 'Baja';
  status: 'Pendiente' | 'En progreso' | 'Completado';
  slaHours: number;
  assignedTo: string;
  dueDate: string;
}

