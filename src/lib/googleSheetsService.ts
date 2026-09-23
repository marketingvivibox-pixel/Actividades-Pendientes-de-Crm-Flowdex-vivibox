import { CRMTask, ConnectedSpreadsheet } from '../types';
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
export const CONNECTED_SHEET_STORAGE_KEY = 'crm_connected_spreadsheet_v1';

export function getStoredConnectedSheet(): ConnectedSpreadsheet | null {
  try {
    const raw = localStorage.getItem(CONNECTED_SHEET_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function setStoredConnectedSheet(sheet: ConnectedSpreadsheet | null): void {
  try {
    if (sheet) {
      localStorage.setItem(CONNECTED_SHEET_STORAGE_KEY, JSON.stringify(sheet));
    } else {
      localStorage.removeItem(CONNECTED_SHEET_STORAGE_KEY);
    }
  } catch {
    // ignore
  }
}

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
 * Extracts spreadsheet ID and optional gid from URL or raw ID string
 */
export function extractSpreadsheetInfo(input: string): { id: string; gid?: string } {
  const trimmed = input.trim();
  const idMatch = trimmed.match(/\/d\/([a-zA-Z0-9-_]+)/);
  const id = idMatch && idMatch[1] ? idMatch[1] : trimmed;
  
  const gidMatch = trimmed.match(/[#&?]gid=([0-9]+)/);
  const gid = gidMatch && gidMatch[1] ? gidMatch[1] : undefined;

  return { id, gid };
}

/**
 * Parses Google Visualization (GViz) API table JSON structure into a 2D string/number array
 */
function parseGVizTable(table: any): (string | number)[][] {
  if (!table) return [];
  const { cols, rows } = table;
  const headerRow: string[] = (cols || []).map((c: any) => String(c?.label || c?.id || '').trim());

  const dataRows: (string | number)[][] = (rows || []).map((r: any) => {
    if (!r || !r.c) return [];
    return r.c.map((cell: any) => {
      if (!cell) return '';
      if (cell.f !== undefined && cell.f !== null) return cell.f;
      if (cell.v !== undefined && cell.v !== null) return cell.v;
      return '';
    });
  });

  const hasHeaderLabels = headerRow.some((h) => h.length > 0 && isNaN(Number(h)));
  if (hasHeaderLabels) {
    return [headerRow, ...dataRows];
  }
  return dataRows;
}

/**
 * Loads a public Google Sheet using JSONP in the browser.
 * This completely avoids CORS restrictions and requires NO Google OAuth login or backend proxy,
 * working seamlessly on any domain (Firebase Hosting, Cloud Run, GitHub Pages, etc.).
 */
function fetchGVizJsonp(
  cleanId: string,
  sheetTab?: string,
  gid?: string
): Promise<(string | number)[][]> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined') {
      return reject(new Error('JSONP requires browser window environment.'));
    }

    const callbackName = 'gviz_jsonp_' + Math.random().toString(36).substring(2, 10);
    const script = document.createElement('script');
    let url = `https://docs.google.com/spreadsheets/d/${encodeURIComponent(cleanId)}/gviz/tq?tqx=responseHandler:${callbackName}`;
    if (sheetTab) url += `&sheet=${encodeURIComponent(sheetTab)}`;
    if (gid) url += `&gid=${encodeURIComponent(gid)}`;

    let timeoutId: any = null;

    const cleanup = () => {
      if (timeoutId) clearTimeout(timeoutId);
      try {
        delete (window as any)[callbackName];
      } catch {
        (window as any)[callbackName] = undefined;
      }
      if (document.body.contains(script)) {
        document.body.removeChild(script);
      }
    };

    (window as any)[callbackName] = (response: any) => {
      cleanup();
      if (response && response.status === 'ok' && response.table) {
        const rows = parseGVizTable(response.table);
        if (rows.length > 0) {
          resolve(rows);
          return;
        }
      }
      const errMsg = response?.errors?.[0]?.message || 'No se pudieron extraer datos de la hoja.';
      reject(new Error(errMsg));
    };

    script.onerror = () => {
      cleanup();
      reject(new Error('No se pudo conectar con Google Sheets mediante JSONP.'));
    };

    timeoutId = setTimeout(() => {
      cleanup();
      reject(new Error('Tiempo de espera agotado al consultar Google Sheets.'));
    }, 7000);

    script.src = url;
    document.body.appendChild(script);
  });
}

/**
 * Reads data from a public Google Sheet without needing OAuth login.
 * Multi-layer strategy:
 * 1. JSONP in browser (zero CORS, zero auth, works on any host)
 * 2. Local backend proxy (/api/sheets/public-read)
 * 3. Cloud Run production backend proxy
 */
export async function readPublicSpreadsheet(
  spreadsheetId: string,
  sheetTab?: string,
  gid?: string
): Promise<{ values: (string | number)[][]; sheetTab: string; rowCount: number }> {
  const { id: cleanId, gid: extractedGid } = extractSpreadsheetInfo(spreadsheetId);
  const targetGid = gid || extractedGid;

  // 1. Try JSONP directly in the browser (Zero CORS, works across domains, no login required)
  try {
    const jsonpRows = await fetchGVizJsonp(cleanId, sheetTab, targetGid);
    if (jsonpRows && jsonpRows.length > 0) {
      return {
        values: jsonpRows,
        sheetTab: sheetTab || 'Hoja Principal',
        rowCount: jsonpRows.length,
      };
    }
  } catch (jsonpErr) {
    console.warn('JSONP fetch attempt failed, trying server proxy...', jsonpErr);
  }

  // 2. Try local server-side proxy
  try {
    const res = await fetch('/api/sheets/public-read', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        spreadsheetId: cleanId,
        sheetTab,
        gid: targetGid,
      }),
    });

    if (res.ok) {
      const data = await res.json();
      if (data.success && data.values && data.values.length > 0) {
        return {
          values: data.values,
          sheetTab: data.sheetTab || sheetTab || 'Hoja Principal',
          rowCount: data.rowCount || data.values.length,
        };
      }
    }
  } catch (proxyErr) {
    console.warn('Local proxy fetch attempt failed:', proxyErr);
  }

  // 3. Fallback to Cloud Run production backend proxy (for external domains like vivibox-analisis.web.app)
  const cloudRunBase = 'https://ais-pre-uun37zvqyb4x7jpyyoalsx-234804285511.us-east1.run.app';
  try {
    const crRes = await fetch(`${cloudRunBase}/api/sheets/public-read`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        spreadsheetId: cleanId,
        sheetTab,
        gid: targetGid,
      }),
    });

    if (crRes.ok) {
      const crData = await crRes.json();
      if (crData.success && crData.values && crData.values.length > 0) {
        return {
          values: crData.values,
          sheetTab: crData.sheetTab || sheetTab || 'Hoja Principal',
          rowCount: crData.rowCount || crData.values.length,
        };
      }
    }
  } catch (crErr) {
    console.warn('Cloud Run proxy fetch attempt failed:', crErr);
  }

  throw new Error(
    'No se pudo acceder a la hoja de Google Sheets. Asegúrate de que el documento tenga permiso público ("Cualquiera con el enlace" en modo Lector) o verifica el enlace.'
  );
}

/**
 * Fetches metadata and sheet tabs for a specific spreadsheet.
 * Supports both authenticated Google Drive session and public sheets fallback.
 */
export async function getSpreadsheetDetails(spreadsheetId: string): Promise<SheetMetadata> {
  const { id: cleanId, gid } = extractSpreadsheetInfo(spreadsheetId);
  const token = await getAccessToken();

  if (token) {
    try {
      const res = await fetch(`${SHEETS_API_BASE}/${cleanId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        const data = await res.json();
        return {
          id: data.spreadsheetId,
          title: data.properties?.title || 'Hoja de Cálculo',
          sheets: (data.sheets || []).map((s: any) => ({
            sheetId: s.properties?.sheetId || 0,
            title: s.properties?.title || 'Sheet1',
            index: s.properties?.index || 0,
          })),
        };
      }
    } catch (err) {
      console.warn('Authenticated metadata fetch failed, attempting public read:', err);
    }
  }

  // Fallback: Test public access to sheet
  try {
    const publicData = await readPublicSpreadsheet(cleanId, undefined, gid);
    return {
      id: cleanId,
      title: 'Hoja Pública de Google Sheets',
      sheets: [
        { sheetId: 0, title: publicData.sheetTab || 'Hoja Principal', index: 0 },
        { sheetId: 1, title: 'Matriz Criticidad CRM', index: 1 },
        { sheetId: 2, title: 'Sheet1', index: 2 },
        { sheetId: 3, title: 'Hoja 1', index: 3 },
      ],
    };
  } catch (publicErr: any) {
    throw new Error(
      publicErr?.message ||
        'No se pudo acceder al documento. Si es privado, requiere inicio de sesión; si es público, asegúrate de que en Compartir esté en "Cualquiera con el enlace".'
    );
  }
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
  if (!token) {
    throw new Error(
      'Para escribir y actualizar filas directamente en Google Sheets se requiere iniciar sesión con una cuenta de Google que tenga permisos de edición en el archivo. Para sincronizar hacia la aplicación web desde un documento público, usa el botón "Sincronizar Pública" o la pestaña "Pegar / Subir CSV".'
    );
  }

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
  * Pushes and updates all tasks and states into the connected spreadsheet tab
  */
export async function pushTasksToSpreadsheet(
  spreadsheetId: string,
  sheetName: string,
  tasks: CRMTask[],
  taskStates: Record<number, boolean>
): Promise<{ success: boolean; rowCount: number; timestamp: string }> {
  const token = await getAccessToken();
  if (!token) throw new Error('No hay sesión activa con Google.');

  const values = formatTasksForSheets(tasks, taskStates);
  const cleanSheetName = sheetName.replace(/['!]/g, '');

  // Clear existing content in the tab first to avoid dangling rows
  try {
    const clearUrl = `${SHEETS_API_BASE}/${spreadsheetId}/values/${encodeURIComponent(cleanSheetName + '!A1:Z500')}:clear`;
    await fetch(clearUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
  } catch (err) {
    console.warn('Could not clear range, proceeding with direct overwrite:', err);
  }

  // Write new values
  await updateSpreadsheetValues(spreadsheetId, cleanSheetName, values);

  const timestamp = new Date().toISOString();
  return {
    success: true,
    rowCount: values.length - 1, // minus header
    timestamp,
  };
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
 * Parses raw 2D array rows from Google Sheets into complete CRMTask objects
 */
export function parseSpreadsheetRowsToTasks(
  rows: (string | number)[][],
  existingTasks: CRMTask[]
): { tasks: CRMTask[]; newCount: number; updatedCount: number; newStates: Record<number, boolean> } {
  if (!rows || rows.length < 2) {
    return { tasks: existingTasks, newCount: 0, updatedCount: 0, newStates: {} };
  }

  const headerRow = rows[0].map((h) => String(h).trim().toLowerCase());
  
  // Find column indices with robust fallback aliases
  const findCol = (terms: string[]) => {
    return headerRow.findIndex((col) => terms.some((t) => col.includes(t.toLowerCase())));
  };

  const idIdx = findCol(['id']);
  const numIdx = findCol(['n° original', 'numero', 'ticket', 'n°']);
  const estadoIdx = findCol(['estado ticket', 'estado', 'status']);
  const activoIdx = findCol(['activo en físicas', 'activo', 'active']);
  const critIdx = findCol(['criticidad %', 'criticidad', 'score', 'puntos']);
  const tierIdx = findCol(['nivel criticidad', 'nivel', 'tier']);
  const prioridadIdx = findCol(['prioridad', 'priority']);
  const focoIdx = findCol(['foco funcional', 'foco', 'enfoque']);
  const catIdx = findCol(['categoría', 'categoria', 'category']);
  const respIdx = findCol(['responsable asignado', 'responsable', 'asignado']);
  const pendIdx = findCol(['pendiente / título', 'pendiente', 'titulo', 'título', 'nombre']);
  const evidIdx = findCol(['detalle evidencia', 'evidencia', 'detalle']);
  const accionIdx = findCol(['acción acordada', 'accion acordada', 'accion', 'protocolo']);
  const riesgoIdx = findCol(['riesgo de negocio', 'riesgo']);
  const impactoIdx = findCol(['impacto indispensable', 'impacto']);

  const updatedTasksMap = new Map<number, CRMTask>();
  existingTasks.forEach((t) => updatedTasksMap.set(t.id, { ...t }));

  let highestId = existingTasks.reduce((max, t) => Math.max(max, t.id), 0);
  let highestNum = existingTasks.reduce((max, t) => Math.max(max, t.originalNumber), 0);

  let newCount = 0;
  let updatedCount = 0;
  const newStates: Record<number, boolean> = {};

  for (let r = 1; r < rows.length; r++) {
    const row = rows[r];
    if (!row || row.length === 0) continue;

    // Check if row has any meaningful content
    const hasContent = row.some((cell) => cell !== undefined && cell !== null && String(cell).trim() !== '');
    if (!hasContent) continue;

    // Determine ID
    let id: number | null = null;
    if (idIdx !== -1 && row[idIdx] !== undefined) {
      const parsed = parseInt(String(row[idIdx]).trim(), 10);
      if (!isNaN(parsed) && parsed > 0) {
        id = parsed;
      }
    }

    const isNew = id === null || !updatedTasksMap.has(id);
    if (isNew) {
      highestId += 1;
      id = highestId;
      newCount++;
    } else {
      updatedCount++;
    }

    // Number
    let originalNumber = id;
    if (numIdx !== -1 && row[numIdx] !== undefined) {
      const numClean = String(row[numIdx]).replace(/[^0-9]/g, '');
      const parsedNum = parseInt(numClean, 10);
      if (!isNaN(parsedNum)) {
        originalNumber = parsedNum;
      }
    } else if (isNew) {
      highestNum += 1;
      originalNumber = highestNum;
    }

    // Pendiente / Title
    const pendiente = pendIdx !== -1 && row[pendIdx] ? String(row[pendIdx]).trim() : `Nuevo Pendiente #${originalNumber}`;
    if (!pendiente && isNew) continue; // Skip empty rows without title

    // Estado
    const rawEstado = estadoIdx !== -1 && row[estadoIdx] ? String(row[estadoIdx]).trim() : 'Pendiente';
    let estado: CRMTask['estado'] = 'Pendiente';
    if (rawEstado.includes('Cerrado') || rawEstado.includes('cerrado')) estado = 'Cerrado';
    else if (rawEstado.includes('corrección') || rawEstado.includes('correccion')) estado = 'En corrección';
    else if (rawEstado.includes('revisar')) estado = 'Por revisar';
    else if (rawEstado.includes('respuesta')) estado = 'Pendiente respuesta';
    else if (rawEstado.includes('desarrollo')) estado = 'En desarrollo';
    else if (rawEstado.includes('investigación') || rawEstado.includes('investigacion')) estado = 'En investigación';

    // Activo state
    let isActive = estado !== 'Cerrado';
    if (activoIdx !== -1 && row[activoIdx] !== undefined) {
      const rawActivo = String(row[activoIdx]).toUpperCase();
      isActive = rawActivo.includes('SÍ') || rawActivo.includes('SI') || rawActivo.includes('TRUE') || rawActivo.includes('1') || rawActivo.includes('ÓRBITA') || rawActivo.includes('ORBITA');
    }
    newStates[id] = isActive;

    // Prioridad
    const rawPrio = prioridadIdx !== -1 && row[prioridadIdx] ? String(row[prioridadIdx]).trim() : 'Media';
    let prioridad: CRMTask['prioridad'] = 'Media';
    if (rawPrio.includes('Alta') || rawPrio.includes('ALTA')) prioridad = 'Alta';
    else if (rawPrio.includes('Baja') || rawPrio.includes('BAJA')) prioridad = 'Baja';
    else if (rawPrio === '—' || rawPrio === '-') prioridad = '—';

    // Criticidad score
    let score = 50;
    if (critIdx !== -1 && row[critIdx] !== undefined) {
      const cleanScore = String(row[critIdx]).replace(/[^0-9]/g, '');
      const parsedScore = parseInt(cleanScore, 10);
      if (!isNaN(parsedScore)) {
        score = Math.max(0, Math.min(100, parsedScore));
      }
    } else {
      score = prioridad === 'Alta' ? 85 : prioridad === 'Media' ? 55 : 30;
    }

    // Criticality Tier
    let tier: CRMTask['criticalityTier'] = 'IMPACTO MEDIO / FLUJO';
    if (tierIdx !== -1 && row[tierIdx]) {
      const rawTier = String(row[tierIdx]).toUpperCase();
      if (rawTier.includes('BLOQUEANTE')) tier = 'CRÍTICO BLOQUEANTE';
      else if (rawTier.includes('ALTO RIESGO')) tier = 'ALTO RIESGO OPERATIVO';
      else if (rawTier.includes('INVESTIGACIÓN') || rawTier.includes('I+D')) tier = 'INVESTIGACIÓN & I+D';
      else if (rawTier.includes('RESUELTO') || rawTier.includes('OPERATIVO')) tier = 'RESUELTO / OPERATIVO';
      else if (rawTier.includes('BAJO')) tier = 'BAJO / SIN IMPACTO';
    } else {
      if (score >= 80) tier = 'CRÍTICO BLOQUEANTE';
      else if (score >= 65) tier = 'ALTO RIESGO OPERATIVO';
      else if (score >= 45) tier = 'IMPACTO MEDIO / FLUJO';
      else if (score >= 25) tier = 'INVESTIGACIÓN & I+D';
      else tier = 'BAJO / SIN IMPACTO';
    }

    // Foco funcional
    let focus: CRMTask['functionalFocus'] = 'ux_taxonomia';
    if (focoIdx !== -1 && row[focoIdx]) {
      const rawFoco = String(row[focoIdx]).toLowerCase();
      if (rawFoco.includes('infraestructura') || rawFoco.includes('servidor')) focus = 'infraestructura';
      else if (rawFoco.includes('venta') || rawFoco.includes('supervis') || rawFoco.includes('call')) focus = 'ventas_supervision';
      else if (rawFoco.includes('multimedia') || rawFoco.includes('voz') || rawFoco.includes('audio')) focus = 'multimedia_voz';
      else if (rawFoco.includes('ia') || rawFoco.includes('analítica') || rawFoco.includes('ads')) focus = 'ia_analitica';
      else if (rawFoco.includes('protocolo') || rawFoco.includes('resuelto')) focus = 'protocolo_resuelto';
    }

    // Categoría
    let categoria: CRMTask['categoria'] = 'Cambio acordado';
    if (catIdx !== -1 && row[catIdx]) {
      const rawCat = String(row[catIdx]).toLowerCase();
      if (rawCat.includes('bug') || rawCat.includes('error') || rawCat.includes('fallo')) categoria = 'Bug';
      else if (rawCat.includes('investigación') || rawCat.includes('investigacion')) categoria = 'En investigación';
      else if (rawCat.includes('configuración') || rawCat.includes('configuracion')) categoria = 'Configuración';
      else if (rawCat.includes('aclarado')) categoria = 'Aclarado';
    }

    // Responsable
    const responsable = respIdx !== -1 && row[respIdx] ? String(row[respIdx]).trim() : 'Por Asignar';

    // Detalle evidencia
    const detalleEvidencia = evidIdx !== -1 && row[evidIdx] ? String(row[evidIdx]).trim() : 'Registrado desde Google Sheets.';

    // Acción acordada
    const accionAcordada = accionIdx !== -1 && row[accionIdx] ? String(row[accionIdx]).trim() : 'Definir protocolo en la próxima sesión técnica.';

    // Riesgo negocio
    const riesgoNegocio = riesgoIdx !== -1 && row[riesgoIdx] ? String(row[riesgoIdx]).trim() : 'Pendiente de estimar riesgo comercial.';

    // Impacto indispensable
    const impactoIndispensableCRM = impactoIdx !== -1 && row[impactoIdx] ? String(row[impactoIdx]).trim() : 'Impacto operativo regular en CRM.';

    const existing = updatedTasksMap.get(id);

    const taskObj: CRMTask = {
      id,
      originalNumber,
      categoria,
      pendiente,
      detalleEvidencia,
      accionAcordada,
      responsable,
      prioridad,
      estado,
      criticalityScore: score,
      criticalityTier: tier,
      proportionalUnits: score >= 80 ? 4 : score >= 60 ? 3 : score >= 40 ? 2 : 1,
      functionalFocus: focus,
      semanticDomain: existing?.semanticDomain || 'ui_discoverability',
      semanticDomainName: existing?.semanticDomainName || 'Gestión Operativa',
      impactoIndispensableCRM,
      riesgoNegocio,
      afectaVentasDirectas: existing?.afectaVentasDirectas ?? (prioridad === 'Alta'),
      afectaEstabilidadTecnica: existing?.afectaEstabilidadTecnica ?? (focus === 'infraestructura'),
    };

    updatedTasksMap.set(id, taskObj);
  }

  return {
    tasks: Array.from(updatedTasksMap.values()),
    newCount,
    updatedCount,
    newStates,
  };
}

/**
 * Reads values from a spreadsheet range.
 * Supports authenticated Google Sheets API and falls back to public proxy reading.
 */
export async function readSpreadsheetValues(
  spreadsheetId: string,
  range: string
): Promise<(string | number)[][]> {
  const { id: cleanId, gid } = extractSpreadsheetInfo(spreadsheetId);
  const token = await getAccessToken();

  if (token) {
    try {
      const url = `${SHEETS_API_BASE}/${cleanId}/values/${encodeURIComponent(range)}`;
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        const data = await res.json();
        if (data.values && data.values.length > 0) {
          return data.values;
        }
      }
    } catch (err) {
      console.warn('Authenticated readSpreadsheetValues failed, attempting public read:', err);
    }
  }

  // Fallback to public reader
  const sheetTabName = range ? range.split('!')[0].replace(/[']/g, '') : undefined;
  const publicResult = await readPublicSpreadsheet(cleanId, sheetTabName, gid);
  return publicResult.values;
}

/**
 * Parses raw CSV or TSV text (e.g. from clipboard or file upload) into rows
 */
export function parseCsvTextToRows(text: string): (string | number)[][] {
  if (!text || !text.trim()) return [];
  const delimiter = text.includes('\t') ? '\t' : ',';
  const lines = text.split(/\r?\n/).filter((l) => l.trim() !== '');
  
  if (delimiter === '\t') {
    return lines.map((line) => line.split('\t').map((c) => c.trim()));
  }

  // CSV parsing with quote handling
  const rows: (string | number)[][] = [];
  let currentRow: string[] = [];
  let currentCell = '';
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const nextChar = text[i + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        currentCell += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      currentRow.push(currentCell.trim());
      currentCell = '';
    } else if ((char === '\r' || char === '\n') && !inQuotes) {
      if (char === '\r' && nextChar === '\n') i++;
      currentRow.push(currentCell.trim());
      if (currentRow.some((c) => c !== '')) {
        rows.push(currentRow);
      }
      currentRow = [];
      currentCell = '';
    } else {
      currentCell += char;
    }
  }

  if (currentCell || currentRow.length > 0) {
    currentRow.push(currentCell.trim());
    if (currentRow.some((c) => c !== '')) {
      rows.push(currentRow);
    }
  }

  return rows;
}
