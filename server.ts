import express from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  const DATA_DIR = path.join(process.cwd(), 'data');
  const TASKS_FILE = path.join(DATA_DIR, 'tasks.json');
  const DEFAULT_TASKS_FILE = path.join(DATA_DIR, 'defaultTasks.json');

  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }

  // Helper to read tasks
  function getStoredTasks() {
    try {
      if (fs.existsSync(TASKS_FILE)) {
        const raw = fs.readFileSync(TASKS_FILE, 'utf8');
        return JSON.parse(raw);
      }
      if (fs.existsSync(DEFAULT_TASKS_FILE)) {
        const raw = fs.readFileSync(DEFAULT_TASKS_FILE, 'utf8');
        const defaultTasks = JSON.parse(raw);
        const states: Record<number, boolean> = {};
        defaultTasks.forEach((t: any) => {
          states[t.id] = t.estado !== 'Cerrado';
        });
        const initial = {
          tasks: defaultTasks,
          taskStates: states,
          updatedAt: new Date().toISOString(),
        };
        fs.writeFileSync(TASKS_FILE, JSON.stringify(initial, null, 2), 'utf8');
        return initial;
      }
    } catch (e) {
      console.error('Error reading stored tasks:', e);
    }
    return { tasks: [], taskStates: {}, updatedAt: new Date().toISOString() };
  }

  function saveStoredTasks(tasks: any[], taskStates?: Record<number, boolean>) {
    try {
      const current = getStoredTasks();
      const updated = {
        tasks,
        taskStates: taskStates || current.taskStates || {},
        updatedAt: new Date().toISOString(),
      };
      fs.writeFileSync(TASKS_FILE, JSON.stringify(updated, null, 2), 'utf8');
      return updated;
    } catch (e) {
      console.error('Error saving tasks to disk:', e);
      throw e;
    }
  }

  // Health check endpoint
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // Persistent Tasks endpoints (accessible across all accounts and devices)
  app.get('/api/tasks', (req, res) => {
    try {
      const data = getStoredTasks();
      res.json({
        success: true,
        tasks: data.tasks || [],
        taskStates: data.taskStates || {},
        updatedAt: data.updatedAt,
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err?.message });
    }
  });

  app.post('/api/tasks', (req, res) => {
    try {
      const { tasks, taskStates } = req.body;
      if (!Array.isArray(tasks)) {
        return res.status(400).json({ success: false, error: 'tasks must be an array' });
      }
      const updated = saveStoredTasks(tasks, taskStates);
      res.json({
        success: true,
        count: updated.tasks.length,
        updatedAt: updated.updatedAt,
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err?.message });
    }
  });

  app.post('/api/tasks/reset', (req, res) => {
    try {
      if (fs.existsSync(DEFAULT_TASKS_FILE)) {
        const raw = fs.readFileSync(DEFAULT_TASKS_FILE, 'utf8');
        const defaultTasks = JSON.parse(raw);
        const states: Record<number, boolean> = {};
        defaultTasks.forEach((t: any) => {
          states[t.id] = t.estado !== 'Cerrado';
        });
        const initial = {
          tasks: defaultTasks,
          taskStates: states,
          updatedAt: new Date().toISOString(),
        };
        fs.writeFileSync(TASKS_FILE, JSON.stringify(initial, null, 2), 'utf8');
        return res.json({ success: true, tasks: defaultTasks, taskStates: states });
      }
      return res.status(404).json({ success: false, error: 'default tasks not found' });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err?.message });
    }
  });

  /**
   * Helper to parse Google Visualization API response into clean 2D array of rows
   */
  function parseGVizResponse(text: string): { title?: string; values: (string | number)[][] } | null {
    const match = text.match(/google\.visualization\.Query\.setResponse\(([\s\S]*)\);/);
    if (!match || !match[1]) return null;
    try {
      const data = JSON.parse(match[1]);
      if (!data || !data.table) return null;
      const { cols, rows } = data.table;

      // Extract column labels (or ids)
      const headerRow: string[] = (cols || []).map((c: any) => String(c?.label || c?.id || '').trim());

      // Extract rows
      const dataRows: (string | number)[][] = (rows || []).map((r: any) => {
        if (!r || !r.c) return [];
        return r.c.map((cell: any) => {
          if (!cell) return '';
          if (cell.f !== undefined && cell.f !== null) return cell.f;
          if (cell.v !== undefined && cell.v !== null) return cell.v;
          return '';
        });
      });

      // If headers are mostly blank and first data row looks like headers, use row 0
      const hasHeaderLabels = headerRow.some((h) => h.length > 0);
      let finalValues: (string | number)[][] = [];

      if (hasHeaderLabels) {
        finalValues = [headerRow, ...dataRows];
      } else if (dataRows.length > 0) {
        finalValues = dataRows;
      }

      return {
        values: finalValues,
      };
    } catch (e) {
      console.error('Failed to parse GViz JSON:', e);
      return null;
    }
  }

  /**
   * Simple CSV parser for Google Sheets CSV exports
   */
  function parseCsvText(csvText: string): (string | number)[][] {
    const rows: string[][] = [];
    let currentRow: string[] = [];
    let currentCell = '';
    let inQuotes = false;

    for (let i = 0; i < csvText.length; i++) {
      const char = csvText[i];
      const nextChar = csvText[i + 1];

      if (char === '"') {
        if (inQuotes && nextChar === '"') {
          currentCell += '"';
          i++; // Skip escaped quote
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

  /**
   * Public Google Sheets Reader Proxy
   * Allows reading public Google Sheets without requiring Google Login or OAuth.
   * Solves CORS and auth restrictions for sheets shared as "Cualquiera con el enlace".
   */
  app.post('/api/sheets/public-read', async (req, res) => {
    try {
      const { spreadsheetId, sheetTab, gid } = req.body;

      if (!spreadsheetId) {
        return res.status(400).json({
          success: false,
          error: 'MISSING_ID',
          message: 'Se requiere el ID de la hoja de cálculo o la URL completa.',
        });
      }

      const cleanId = String(spreadsheetId).trim();

      // 1. Try Google Visualization API (GViz)
      let gvizUrl = `https://docs.google.com/spreadsheets/d/${encodeURIComponent(cleanId)}/gviz/tq?tqx=out:json`;
      if (sheetTab) {
        gvizUrl += `&sheet=${encodeURIComponent(sheetTab)}`;
      }
      if (gid) {
        gvizUrl += `&gid=${encodeURIComponent(gid)}`;
      }

      console.log(`[Public Sheets Proxy] Fetching GViz: ${gvizUrl}`);
      const gvizRes = await fetch(gvizUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          Accept: '*/*',
        },
      });

      if (gvizRes.ok) {
        const text = await gvizRes.text();
        const parsed = parseGVizResponse(text);

        if (parsed && parsed.values && parsed.values.length > 0) {
          return res.json({
            success: true,
            method: 'gviz',
            spreadsheetId: cleanId,
            sheetTab: sheetTab || 'Hoja Principal',
            values: parsed.values,
            rowCount: parsed.values.length,
          });
        }
      }

      // 2. Fallback to CSV Export
      let csvUrl = `https://docs.google.com/spreadsheets/d/${encodeURIComponent(cleanId)}/export?format=csv`;
      if (gid) {
        csvUrl += `&gid=${encodeURIComponent(gid)}`;
      }
      if (sheetTab) {
        csvUrl += `&sheet=${encodeURIComponent(sheetTab)}`;
      }

      console.log(`[Public Sheets Proxy] Fallback fetching CSV: ${csvUrl}`);
      const csvRes = await fetch(csvUrl, {
        redirect: 'follow',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          Accept: 'text/csv, text/plain, */*',
        },
      });

      if (csvRes.ok) {
        const contentType = csvRes.headers.get('content-type') || '';
        // If it returned HTML, it means Google redirected to sign-in page because document is restricted
        if (!contentType.includes('text/html')) {
          const csvText = await csvRes.text();
          const rows = parseCsvText(csvText);
          if (rows.length > 0) {
            return res.json({
              success: true,
              method: 'csv',
              spreadsheetId: cleanId,
              sheetTab: sheetTab || 'Hoja Principal',
              values: rows,
              rowCount: rows.length,
            });
          }
        }
      }

      // If both failed or returned 404 / redirect
      return res.status(403).json({
        success: false,
        error: 'RESTRICTED_OR_NOT_FOUND',
        message:
          'Google indica que el documento no es accesible públicamente o no existe. Verifica en Google Sheets: Botón Compartir > Acceso general > Cambiar a "Cualquiera con el enlace" (Lector o Editor).',
        statusCode: gvizRes.status,
      });
    } catch (err: any) {
      console.error('[Public Sheets Proxy Error]:', err);
      return res.status(500).json({
        success: false,
        error: 'SERVER_ERROR',
        message: err?.message || 'Error al consultar la hoja pública de Google Sheets.',
      });
    }
  });

  // Vite middleware in dev or static files in production
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
