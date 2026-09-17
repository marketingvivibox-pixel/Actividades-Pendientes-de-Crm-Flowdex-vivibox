export type ActiveView = 'centro-de-analisis' | 'informes' | 'flowdex' | 'politicas' | 'mision-vision';

export type MainSection = ActiveView;

export type InformesSubSection = 'publicitario' | 'organico';

export type FlowdexSubSection = 'menu' | 'slas' | 'pendientes';

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

// CRM WhatsApp Flowdex Types (Project gen-lang-client-0730224395)
export type TaskCategory = 
  | 'Bug' 
  | 'Cambio acordado' 
  | 'En investigación' 
  | 'Configuración' 
  | 'Aclarado';

export type TaskPriority = 'Alta' | 'Media' | 'Baja' | '—';

export type TaskStatus = 
  | 'En corrección' 
  | 'Por revisar' 
  | 'Pendiente' 
  | 'Pendiente respuesta' 
  | 'En desarrollo' 
  | 'En investigación' 
  | 'Cerrado';

export type CriticalityLevel = 
  | 'CRÍTICO BLOQUEANTE'     // Nivel 1: Caída de canal, mensajes varados, parálisis de ventas
  | 'ALTO RIESGO OPERATIVO'  // Nivel 2: Fuga de leads, asesores inactivos reciben ventas, audios con error
  | 'IMPACTO MEDIO / FLUJO'  // Nivel 3: Taxonomía, cierres automáticos, analítica IA
  | 'INVESTIGACIÓN & I+D'    // Nivel 4: Telefonía IP alternativa, API Meta, discursos
  | 'BAJO / SIN IMPACTO'     // Nivel 5: Metadatos cosméticos
  | 'RESUELTO / OPERATIVO';  // Nivel 6: Cerrado / Aclarado

export type FunctionalFocus =
  | 'infraestructura'     // Enfoque 1: Infraestructura & Servidores Críticos (Cola de salida, mensajes programados)
  | 'ventas_supervision'  // Enfoque 2: Operaciones Comerciales, Asignación & Supervisión (Leads, comisiones, descansos médicos)
  | 'multimedia_voz'      // Enfoque 3: Canales de Comunicación Multimedia & Telefonía (Audios WhatsApp, llamadas IP)
  | 'ux_taxonomia'        // Enfoque 4: Experiencia de Usuario, Interfaz & Taxonomía (Etiquetas, visibilidad, metadatos)
  | 'ia_analitica'        // Enfoque 5: Analítica de Datos, IA & Atribución Publicitaria (Meta Ads, IA, speeches)
  | 'protocolo_resuelto'; // Enfoque 6: Protocolos Resueltos & Procedimentales (Round-robin, límites ampliados)

export type BackgroundTheme = 
  | 'midnight_navy'     // Contraste Azul Medianoche & Cobalto (Oscuro Profundo)
  | 'obsidian_black'    // Contraste Obsidiana & Cyber Neón (Negro Absoluto)
  | 'cyber_indigo'      // Contraste Violeta Índigo Tecnológico
  | 'titanium_light';   // Contraste Titanio Claro (Gris Acero / Blanco Óptico)

export interface FocusTheme {
  key: FunctionalFocus;
  name: string;
  description: string;
  colorName: string;
  badgeBgDark: string;
  badgeTextDark: string;
  badgeBgLight: string;
  badgeTextLight: string;
  borderAccentDark: string;
  borderAccentLight: string;
  cardHeaderDark: string;
  cardHeaderLight: string;
  dotColor: string;
  accentHex: string;
}

export interface SemanticStyle {
  label: string;
  badgeBg: string;
  badgeText: string;
  borderColor: string;
  glowColor: string;
  gradientBg: string;
  iconName: string;
  accentHex: string;
}

export interface CRMTask {
  id: number;
  originalNumber: number;
  categoria: TaskCategory;
  pendiente: string;
  detalleEvidencia: string;
  accionAcordada: string;
  responsable: string;
  prioridad: TaskPriority;
  estado: TaskStatus;
  // Semantic & Proportional CRM Impact Analysis
  criticalityScore: number; // 0 - 100
  criticalityTier: CriticalityLevel;
  proportionalUnits: number; // 1 (compact) to 4 (hero / maximum space)
  functionalFocus: FunctionalFocus;
  semanticDomain: 
    | 'queue_infrastructure' 
    | 'scheduled_dispatch' 
    | 'governance_reassignment' 
    | 'routing_integrity' 
    | 'conversation_window' 
    | 'audio_voice' 
    | 'tag_persistence' 
    | 'ui_discoverability' 
    | 'pipeline_hygiene' 
    | 'ai_analytics' 
    | 'telephony_integration' 
    | 'meta_attribution' 
    | 'quick_replies' 
    | 'metadata_layout' 
    | 'clarified_closed';
  semanticDomainName: string;
  impactoIndispensableCRM: string;
  riesgoNegocio: string;
  afectaVentasDirectas: boolean;
  afectaEstabilidadTecnica: boolean;
}

export interface MeetingParticipant {
  nombre: string;
  rol: string;
  empresa_area: string;
  avatarColor: string;
}


