import { CRMTask } from '../types';
import { FOCUS_DEFINITIONS } from '../data/crmTasksData';
import { getAccessToken } from './googleAuth';

export interface DriveSheetFile {
  id: string;
  name: string;
  modifiedTime: string;
  webViewLink?: string;
}

export interface SheetMetadata {
  id: string;
  title: string;
  sheets: { sheetId: number; title: string; index: number }[];
}

export const SHEETS_API_BASE = 'https://sheets.googleapis.com/v4/spreadsheets';
export const DRIVE_API_BASE = 'https://www.googleapis.com/drive/v3';

/**
 * Lists the user's existing Google Sheets from Drive for easy selection
 */
export async function listUserGoogleSheets(): Promise<DriveSheetFile[]> {
  const token = await getAccessToken();
  if (!token) throw new Error('No hay sesión activa con Google. Inicie sesión primero.');

  const query = encodeURIComponent("mimeType='application/vnd.google-apps.spreadsheet' and trashed=false");
  const url = `${DRIVE_API_BASE}/files?q=${query}&orderBy=modifiedTime desc&pageSize=20&fields=files(id,name,modifiedTime,webViewLink)`;

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error?.message || `Error al listar hojas de Drive (${res.status})`);
  }

  const data = await res.json();
  return data.files || [];
}

/**
 * Fetches metadata and sheet tabs for a specific spreadsheet
 */
export async function getSpreadsheetDetails(spreadsheetId: string): Promise<SheetMetadata> {
  const token = await getAccessToken();
  if (!token) throw new Error('No hay sesión activa con Google.');

  const res = await fetch(`${SHEETS_API_BASE}/${spreadsheetId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error?.message || `Error al obtener metadatos de la hoja (${res.status})`);
  }

  const data = await res.json();
  return {
    id: data.spreadsheetId,
    title: data.properties?.title || 'Sin Título',
    sheets: (data.sheets || []).map((s: any) => ({
      sheetId: s.properties?.sheetId || 0,
      title: s.properties?.title || 'Sheet1',
      index: s.properties?.index || 0,
    })),
  };
}

/**
 * Creates a formatted 2D matrix of row values for the CRM tasks
 */
export function formatTasksForSheets(tasks: CRMTask[], taskStates: Record<number, boolean>): (string | number)[][] {
  const headers = [
    'ID',
    'N° Original',
    'Estado Ticket',
    'Activo en Físicas',
    'Criticidad %',
    'Nivel Criticidad',
    'Prioridad',
    'Foco Funcional',
    'Categoría',
    'Responsable Asignado',
    'Pendiente / Título',
    'Detalle Evidencia (Cita Reunión)',
    'Acción Acordada (Protocolo Técnico)',
    'Riesgo de Negocio',
    'Impacto Indispensable CRM',
  ];

  const rows = tasks.map((task) => {
    const isActive = taskStates[task.id] !== false;
    const focusName = FOCUS_DEFINITIONS[task.functionalFocus]?.name || task.functionalFocus;
    return [
      task.id,
      `#${task.originalNumber}`,
      task.estado,
      isActive ? 'SÍ (En Órbita)' : 'NO (Sedimentado/Abajo)',
      `${task.criticalityScore}%`,
      task.criticalityTier,
      task.prioridad,
      focusName,
      task.categoria,
      task.responsable,
      task.pendiente,
      task.detalleEvidencia,
      task.accionAcordada,
      task.riesgoNegocio,
      task.impactoIndispensableCRM,
    ];
  });

  return [headers, ...rows];
}

/**
 * Creates a brand new Google Spreadsheet in the user's Google Drive with formatted columns
 */
export async function createNewCRMSpreadsheet(
  title: string,
  tasks: CRMTask[],
  taskStates: Record<number, boolean>
): Promise<{ spreadsheetId: string; spreadsheetUrl: string }> {
  const token = await getAccessToken();
  if (!token) throw new Error('No hay sesión activa con Google.');

  const values = formatTasksForSheets(tasks, taskStates);
  const sheetTitle = 'Matriz Criticidad CRM';

  // 1. Create Spreadsheet with basic structure
  const createPayload = {
    properties: {
      title: title || `Matriz CRM WhatsApp - ${new Date().toLocaleDateString()}`,
    },
    sheets: [
      {
        properties: {
          title: sheetTitle,
          gridProperties: {
            frozenRowCount: 1,
          },
        },
      },
    ],
  };

  const createRes = await fetch(SHEETS_API_BASE, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(createPayload),
  });

  if (!createRes.ok) {
    const err = await createRes.json().catch(() => ({}));
    throw new Error(err?.error?.message || `Error al crear hoja (${createRes.status})`);
  }

  const createdData = await createRes.json();
  const spreadsheetId = createdData.spreadsheetId;
  const spreadsheetUrl = createdData.spreadsheetUrl || `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`;

  // 2. Append formatted task values
  await updateSpreadsheetValues(spreadsheetId, sheetTitle, values);

  // 3. Format header styling (Dark elegant styling)
  try {
    const sheetId = createdData.sheets?.[0]?.properties?.sheetId || 0;
    await applyHeaderFormatting(spreadsheetId, sheetId);
  } catch (err) {
    console.warn('Could not apply advanced formatting, but data was saved:', err);
  }

  return { spreadsheetId, spreadsheetUrl };
}

/**
 * Updates/overwrites the data inside an existing Google Sheet tab
 */
export async function updateSpreadsheetValues(
  spreadsheetId: string,
  sheetName: string,
  values: (string | number)[][]
): Promise<void> {
  const token = await getAccessToken();
  if (!token) throw new Error('No hay sesión activa con Google.');

  const cleanSheetName = sheetName.replace(/['!]/g, '');
  const range = `${cleanSheetName}!A1`;

  const url = `${SHEETS_API_BASE}/${spreadsheetId}/values/${encodeURIComponent(range)}?valueInputOption=USER_ENTERED`;

  const res = await fetch(url, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      range,
      majorDimension: 'ROWS',
      values,
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error?.message || `Error al actualizar celdas (${res.status})`);
  }
}

/**
 * Formats header row with high-contrast elegant dark theme
 */
async function applyHeaderFormatting(spreadsheetId: string, sheetId: number): Promise<void> {
  const token = await getAccessToken();
  if (!token) return;

  const requests = [
    // Format Header Row
    {
      repeatCell: {
        range: {
          sheetId,
          startRowIndex: 0,
          endRowIndex: 1,
        },
        cell: {
          userEnteredFormat: {
            backgroundColor: { red: 0.16, green: 0.14, blue: 0.13 }, // #292524
            textFormat: {
              bold: true,
              foregroundColor: { red: 0.98, green: 0.96, blue: 0.93 }, // #faf5ee
              fontSize: 10,
            },
            horizontalAlignment: 'CENTER',
            verticalAlignment: 'MIDDLE',
            wrapStrategy: 'WRAP',
          },
        },
        fields: 'userEnteredFormat(backgroundColor,textFormat,horizontalAlignment,verticalAlignment,wrapStrategy)',
      },
    },
    // Auto-resize columns
    {
      autoResizeDimensions: {
        dimensions: {
          sheetId,
          dimension: 'COLUMNS',
          startIndex: 0,
          endIndex: 15,
        },
      },
    },
  ];

  await fetch(`${SHEETS_API_BASE}/${spreadsheetId}:batchUpdate`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ requests }),
  });
}

/**
 * Reads values from a spreadsheet range
 */
export async function readSpreadsheetValues(
  spreadsheetId: string,
  range: string
): Promise<(string | number)[][]> {
  const token = await getAccessToken();
  if (!token) throw new Error('No hay sesión activa con Google.');

  const url = `${SHEETS_API_BASE}/${spreadsheetId}/values/${encodeURIComponent(range)}`;
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error?.message || `Error al leer la hoja (${res.status})`);
  }

  const data = await res.json();
  return data.values || [];
}
