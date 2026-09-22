import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  FileSpreadsheet,
  Plus,
  ExternalLink,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  FileText,
  LogOut,
  FolderOpen,
  Search,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Copy,
  Check,
  Database,
  Upload,
  Clipboard,
  Info
} from 'lucide-react';
import { User } from 'firebase/auth';
import { CRMTask, ConnectedSpreadsheet } from '../types';
import {
  googleSignIn,
  logoutGoogle,
  initAuth,
  getAccessToken
} from '../lib/googleAuth';
import {
  listUserGoogleSheets,
  getSpreadsheetDetails,
  createNewCRMSpreadsheet,
  updateSpreadsheetValues,
  readSpreadsheetValues,
  readPublicSpreadsheet,
  extractSpreadsheetInfo,
  parseCsvTextToRows,
  formatTasksForSheets,
  parseSpreadsheetRowsToTasks,
  setStoredConnectedSheet,
  DriveSheetFile,
  SheetMetadata
} from '../lib/googleSheetsService';

interface GoogleSheetsModalProps {
  isOpen: boolean;
  onClose: () => void;
  tasks: CRMTask[];
  taskStates: Record<number, boolean>;
  connectedSheet: ConnectedSpreadsheet | null;
  onConnectedSheetChange: (sheet: ConnectedSpreadsheet | null) => void;
  onUpdateTaskStates?: (newStates: Record<number, boolean>) => void;
  onUpdateAllTasks?: (newTasks: CRMTask[], newStates?: Record<number, boolean>) => void;
  onTriggerSync?: () => Promise<void>;
  isSyncing?: boolean;
}

type ModalTab = 'create' | 'sync' | 'import' | 'csv';

export const GoogleSheetsModal: React.FC<GoogleSheetsModalProps> = ({
  isOpen,
  onClose,
  tasks,
  taskStates,
  connectedSheet,
  onConnectedSheetChange,
  onUpdateTaskStates,
  onUpdateAllTasks,
  onTriggerSync,
  isSyncing = false,
}) => {
  // Auth state
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  // Active tab
  const [activeTab, setActiveTab] = useState<ModalTab>('create');

  // New spreadsheet state
  const [newSheetTitle, setNewSheetTitle] = useState(
    `Matriz de Criticidad CRM WhatsApp - ${new Date().toLocaleDateString('es-ES')}`
  );
  const [isCreating, setIsCreating] = useState(false);
  const [createdResult, setCreatedResult] = useState<{ id: string; url: string } | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);

  // Existing sheets state
  const [driveFiles, setDriveFiles] = useState<DriveSheetFile[]>([]);
  const [isLoadingFiles, setIsLoadingFiles] = useState(false);
  const [selectedFileId, setSelectedFileId] = useState<string>('');
  const [manualSheetInput, setManualSheetInput] = useState<string>('');
  const [fileDetails, setFileDetails] = useState<SheetMetadata | null>(null);
  const [selectedSheetTab, setSelectedSheetTab] = useState<string>('');
  const [searchDriveQuery, setSearchDriveQuery] = useState('');
  const [isLoadingDetails, setIsLoadingDetails] = useState<boolean>(false);
  const [csvInputText, setCsvInputText] = useState<string>('');

  // Confirmation dialog state (Mandatory for destructive/overwriting operations)
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    sheetName: string;
    spreadsheetId: string;
  }>({
    isOpen: false,
    title: '',
    sheetName: '',
    spreadsheetId: '',
  });
  const [isUpdatingExisting, setIsUpdatingExisting] = useState(false);
  const [updateSuccessMessage, setUpdateSuccessMessage] = useState<string | null>(null);

  // Import state
  const [isImporting, setIsImporting] = useState(false);
  const [importPreview, setImportPreview] = useState<(string | number)[][] | null>(null);
  const [importSuccess, setImportSuccess] = useState<string | null>(null);

  // General error state
  const [operationError, setOperationError] = useState<string | null>(null);

  // Initialize Auth listener
  useEffect(() => {
    const unsub = initAuth(
      (user) => {
        setCurrentUser(user);
        setIsAuthLoading(false);
      },
      () => {
        setCurrentUser(null);
        setIsAuthLoading(false);
      }
    );
    return () => unsub();
  }, []);

  // When user signs in and is in 'sync' tab, fetch recent sheets
  useEffect(() => {
    if (currentUser && isOpen && (activeTab === 'sync' || activeTab === 'import')) {
      loadUserSpreadsheets();
    }
  }, [currentUser, isOpen, activeTab]);

  const loadUserSpreadsheets = async () => {
    setIsLoadingFiles(true);
    setOperationError(null);
    try {
      const files = await listUserGoogleSheets();
      setDriveFiles(files);
    } catch (err: any) {
      console.error('Error fetching drive files:', err);
      setOperationError(err?.message || 'Error al listar las hojas de cálculo de Drive.');
    } finally {
      setIsLoadingFiles(false);
    }
  };

  const handleSignIn = async () => {
    setIsAuthLoading(true);
    setAuthError(null);
    try {
      const res = await googleSignIn();
      if (res?.user) {
        setCurrentUser(res.user);
      }
    } catch (err: any) {
      console.error('Sign in failed:', err);
      setAuthError(err?.message || 'No se pudo completar el inicio de sesión.');
    } finally {
      setIsAuthLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await logoutGoogle();
      setCurrentUser(null);
      setDriveFiles([]);
      setFileDetails(null);
      setCreatedResult(null);
    } catch (err: any) {
      console.error('Sign out error:', err);
    }
  };

  // Create new CRM Spreadsheet
  const handleCreateNewSheet = async () => {
    if (!currentUser) {
      await handleSignIn();
      return;
    }

    setIsCreating(true);
    setOperationError(null);
    setCreatedResult(null);
    try {
      const result = await createNewCRMSpreadsheet(newSheetTitle, tasks, taskStates);
      setCreatedResult({
        id: result.spreadsheetId,
        url: result.spreadsheetUrl,
      });
      const newConnected: ConnectedSpreadsheet = {
        spreadsheetId: result.spreadsheetId,
        spreadsheetTitle: newSheetTitle,
        sheetTabName: 'Matriz Criticidad CRM',
        spreadsheetUrl: result.spreadsheetUrl,
        lastSyncedAt: new Date().toISOString(),
        autoSync: true,
      };
      setStoredConnectedSheet(newConnected);
      onConnectedSheetChange?.(newConnected);
    } catch (err: any) {
      console.error('Error creating spreadsheet:', err);
      setOperationError(err?.message || 'Error al generar la hoja de cálculo en Google Sheets.');
    } finally {
      setIsCreating(false);
    }
  };

  // Copy created link
  const handleCopyLink = () => {
    if (createdResult?.url) {
      navigator.clipboard.writeText(createdResult.url);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    }
  };

  // Handle spreadsheet selection (from list or manual input)
  const handleSelectSpreadsheet = async (sheetId: string, customGid?: string) => {
    const { id: cleanId, gid: extractedGid } = extractSpreadsheetInfo(sheetId);
    const targetGid = customGid || extractedGid;

    setSelectedFileId(cleanId);
    setIsLoadingDetails(true);
    setOperationError(null);
    setUpdateSuccessMessage(null);
    try {
      const details = await getSpreadsheetDetails(cleanId);
      setFileDetails(details);
      if (details.sheets.length > 0) {
        setSelectedSheetTab(details.sheets[0].title);
      }
    } catch (err: any) {
      console.error('Error fetching sheet details:', err);
      setOperationError(
        err?.message ||
        'No se pudo acceder a la hoja. Si es pública, asegúrate de que esté configurada en "Cualquiera con el enlace" en Google Sheets.'
      );
    } finally {
      setIsLoadingDetails(false);
    }
  };

  // Extract ID and optional gid from full URL if user pastes a Google Sheets link
  const handleManualInputSubmit = () => {
    const { id: cleanId, gid } = extractSpreadsheetInfo(manualSheetInput);
    if (cleanId) {
      handleSelectSpreadsheet(cleanId, gid);
    } else {
      setOperationError('Por favor ingresa un enlace o ID válido de Google Sheets.');
    }
  };

  // Load and read directly from a public sheet without requiring sign-in
  const handleLoadAndReadPublicSheet = async () => {
    const targetInput = manualSheetInput.trim() || selectedFileId;
    const { id: cleanId, gid } = extractSpreadsheetInfo(targetInput);
    if (!cleanId) {
      setOperationError('Por favor ingresa la URL o ID de la hoja de cálculo en el campo superior.');
      return;
    }

    setIsImporting(true);
    setOperationError(null);
    setImportSuccess(null);
    try {
      const publicResult = await readPublicSpreadsheet(cleanId, selectedSheetTab || undefined, gid);
      setImportPreview(publicResult.values);
      setSelectedFileId(cleanId);
      if (!fileDetails) {
        setFileDetails({
          id: cleanId,
          title: 'Hoja Pública de Google Sheets',
          sheets: [{ sheetId: 0, title: publicResult.sheetTab, index: 0 }],
        });
      }
      setSelectedSheetTab(publicResult.sheetTab);

      if (publicResult.values.length > 1) {
        const parsed = parseSpreadsheetRowsToTasks(publicResult.values, tasks);
        setImportSuccess(
          `¡Hoja pública leída con éxito! Se obtuvieron ${publicResult.values.length - 1} filas. Detección: ${parsed.newCount} nuevas tareas para agregar, ${parsed.updatedCount} tareas existentes actualizadas.`
        );
      } else {
        setImportSuccess('La hoja pública se conectó pero no contiene filas de datos.');
      }
    } catch (err: any) {
      console.error('Error reading public sheet:', err);
      setOperationError(err?.message || 'Error al consultar la hoja pública.');
    } finally {
      setIsImporting(false);
    }
  };

  // Parse raw CSV or TSV text and prepare preview
  const handleParseAndPreviewCsv = (textToParse?: string) => {
    const raw = textToParse !== undefined ? textToParse : csvInputText;
    if (!raw.trim()) {
      setOperationError('Por favor pega texto delimitado por comas (CSV) o tabulaciones.');
      return;
    }
    try {
      const rows = parseCsvTextToRows(raw);
      if (rows.length < 2) {
        setOperationError('El contenido pegado no contiene suficientes filas (se requiere encabezado y al menos 1 fila de datos).');
        return;
      }
      setImportPreview(rows);
      const parsed = parseSpreadsheetRowsToTasks(rows, tasks);
      setImportSuccess(
        `Se procesaron ${rows.length - 1} filas de datos. Detección: ${parsed.newCount} nuevas tareas para agregar, ${parsed.updatedCount} tareas existentes actualizadas.`
      );
      setOperationError(null);
    } catch (err: any) {
      setOperationError('Error al procesar el formato CSV: ' + (err?.message || 'Formato no válido'));
    }
  };

  // Handle local CSV file selection
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        setCsvInputText(content);
        handleParseAndPreviewCsv(content);
      }
    };
    reader.readAsText(file);
  };

  // Open confirmation modal for updating existing sheet (Destructive operation)
  const handleRequestUpdateExisting = () => {
    if (!selectedFileId || !selectedSheetTab) {
      setOperationError('Por favor selecciona una hoja de cálculo y la pestaña a actualizar.');
      return;
    }

    const title = fileDetails?.title || 'Hoja de Cálculo';
    setConfirmDialog({
      isOpen: true,
      title,
      sheetName: selectedSheetTab,
      spreadsheetId: selectedFileId,
    });
  };

  // Execute update on existing spreadsheet after user confirmation
  const handleConfirmUpdate = async () => {
    setIsUpdatingExisting(true);
    setOperationError(null);
    setUpdateSuccessMessage(null);

    try {
      const values = formatTasksForSheets(tasks, taskStates);
      await updateSpreadsheetValues(confirmDialog.spreadsheetId, confirmDialog.sheetName, values);
      const newConnected: ConnectedSpreadsheet = {
        spreadsheetId: confirmDialog.spreadsheetId,
        spreadsheetTitle: confirmDialog.title,
        sheetTabName: confirmDialog.sheetName,
        spreadsheetUrl: `https://docs.google.com/spreadsheets/d/${confirmDialog.spreadsheetId}/edit`,
        lastSyncedAt: new Date().toISOString(),
        autoSync: true,
      };
      setStoredConnectedSheet(newConnected);
      onConnectedSheetChange?.(newConnected);
      setUpdateSuccessMessage(
        `¡Datos actualizados con éxito! Se sincronizaron los ${tasks.length} registros del CRM en la pestaña "${confirmDialog.sheetName}". Esta hoja ha quedado vinculada para sincronización continua.`
      );
      setConfirmDialog({ ...confirmDialog, isOpen: false });
    } catch (err: any) {
      console.error('Error updating spreadsheet values:', err);
      setOperationError(err?.message || 'Error al sobrescribir los datos de la hoja.');
      setConfirmDialog({ ...confirmDialog, isOpen: false });
    } finally {
      setIsUpdatingExisting(false);
    }
  };

  // Read data from spreadsheet (Import)
  const handleReadSheet = async () => {
    if (!selectedFileId || !selectedSheetTab) {
      setOperationError('Selecciona una hoja y pestaña para leer.');
      return;
    }

    setIsImporting(true);
    setOperationError(null);
    setImportSuccess(null);
    try {
      // Read all rows up to 100 to capture newly added tasks
      const range = `${selectedSheetTab}!A1:O100`;
      const rows = await readSpreadsheetValues(selectedFileId, range);
      setImportPreview(rows);

      if (rows && rows.length > 1) {
        // Calculate preview of new and updated tasks
        const parsed = parseSpreadsheetRowsToTasks(rows, tasks);
        setImportSuccess(
          `Se leyeron ${rows.length - 1} filas de datos. Detección: ${parsed.newCount} nuevas tareas para agregar, ${parsed.updatedCount} tareas existentes actualizadas.`
        );
      } else {
        setImportSuccess('La pestaña seleccionada está vacía o solo contiene encabezados.');
      }
    } catch (err: any) {
      console.error('Error reading sheet:', err);
      setOperationError(err?.message || 'Error al leer los datos de la hoja.');
    } finally {
      setIsImporting(false);
    }
  };

  // Full synchronization: Add new tasks from Sheet and update existing ones
  const handleSyncAllFromSheet = () => {
    if (!importPreview || importPreview.length < 2 || !onUpdateAllTasks) return;

    try {
      const parsed = parseSpreadsheetRowsToTasks(importPreview, tasks);
      onUpdateAllTasks(parsed.tasks, parsed.newStates);
      const targetTitle = fileDetails?.title || 'Hoja de Cálculo';
      const newConnected: ConnectedSpreadsheet = {
        spreadsheetId: selectedFileId,
        spreadsheetTitle: targetTitle,
        sheetTabName: selectedSheetTab,
        spreadsheetUrl: `https://docs.google.com/spreadsheets/d/${selectedFileId}/edit`,
        lastSyncedAt: new Date().toISOString(),
        autoSync: true,
      };
      setStoredConnectedSheet(newConnected);
      onConnectedSheetChange?.(newConnected);
      setImportSuccess(
        `¡Sincronización completa con éxito! Se integraron ${parsed.newCount} nuevas tareas al CRM y se actualizaron ${parsed.updatedCount} registros existentes. La hoja quedó vinculada para sincronización continua.`
      );
    } catch (err: any) {
      console.error('Error syncing tasks from sheet:', err);
      setOperationError(err?.message || 'Error al procesar las filas de Google Sheets.');
    }
  };

  // Apply imported active/dimmed status if user wants to sync only states
  const handleApplyImportedStates = () => {
    if (!importPreview || importPreview.length < 2 || !onUpdateTaskStates) return;

    // Row 0 is headers. Look for ID column and 'Activo' column
    const headerRow = importPreview[0].map((h) => String(h).toLowerCase());
    const idIdx = headerRow.findIndex((h) => h.includes('id'));
    const activoIdx = headerRow.findIndex((h) => h.includes('activo'));

    if (idIdx === -1 || activoIdx === -1) {
      setOperationError('No se encontraron las columnas requeridas (ID y Activo) en la hoja importada.');
      return;
    }

    const newStates = { ...taskStates };
    for (let r = 1; r < importPreview.length; r++) {
      const row = importPreview[r];
      const idVal = parseInt(String(row[idIdx]));
      const activeVal = String(row[activoIdx]).toUpperCase();
      if (!isNaN(idVal)) {
        const isActive = activeVal.includes('SÍ') || activeVal.includes('SI') || activeVal.includes('TRUE') || activeVal.includes('1');
        newStates[idVal] = isActive;
      }
    }

    onUpdateTaskStates(newStates);
    setImportSuccess('¡Estados de tareas actualizados en la aplicación a partir de la hoja de cálculo!');
  };

  const handleToggleAutoSync = () => {
    if (!connectedSheet) return;
    const updated: ConnectedSpreadsheet = {
      ...connectedSheet,
      autoSync: !connectedSheet.autoSync,
    };
    setStoredConnectedSheet(updated);
    onConnectedSheetChange?.(updated);
  };

  const handleDisconnectSheet = () => {
    setStoredConnectedSheet(null);
    onConnectedSheetChange?.(null);
  };

  const filteredDriveFiles = driveFiles.filter((f) =>
    f.name.toLowerCase().includes(searchDriveQuery.toLowerCase())
  );

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 overflow-y-auto bg-black/60 backdrop-blur-xs">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 12 }}
          transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
          className="relative w-full max-w-3xl bg-white rounded-3xl border border-[#e4dccf] shadow-2xl overflow-hidden flex flex-col max-h-[92vh]"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 sm:p-5 border-b border-[#ece4d6] bg-gradient-to-r from-[#faf7f2] to-white">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-emerald-700 text-white flex items-center justify-center shadow-md shadow-emerald-900/15">
                <FileSpreadsheet className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-serif-warm font-bold text-lg text-[#1c1917]">
                    Google Sheets Workspace
                  </h3>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-100 text-emerald-900 border border-emerald-300">
                    API v4
                  </span>
                </div>
                <p className="text-xs text-[#786d5f]">
                  Exporta, sincroniza y gestiona la Matriz CRM WhatsApp en tiempo real.
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-xl text-[#78716c] hover:bg-[#f2ece2] hover:text-[#1c1917] transition-all cursor-pointer"
              title="Cerrar modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* User Auth Banner */}
          <div className="px-5 py-3 bg-[#faf6ee] border-b border-[#ece4d6] flex flex-wrap items-center justify-between gap-3 text-xs">
            {currentUser ? (
              <div className="flex items-center gap-3">
                {currentUser.photoURL ? (
                  <img
                    src={currentUser.photoURL}
                    alt={currentUser.displayName || 'Usuario'}
                    referrerPolicy="no-referrer"
                    className="w-7 h-7 rounded-full border border-[#d6cbba]"
                  />
                ) : (
                  <div className="w-7 h-7 rounded-full bg-emerald-600 text-white flex items-center justify-center text-xs font-bold">
                    {(currentUser.displayName || currentUser.email || 'U')[0].toUpperCase()}
                  </div>
                )}
                <div>
                  <div className="font-bold text-[#1c1917] flex items-center gap-1.5">
                    <span>{currentUser.displayName || 'Usuario Google'}</span>
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  </div>
                  <div className="text-[11px] text-[#786d5f]">{currentUser.email}</div>
                </div>
              </div>
            ) : (
              <div className="text-[#685c4e] flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                <span>No has conectado tu cuenta de Google Sheets.</span>
              </div>
            )}

            <div className="flex items-center gap-2">
              {currentUser ? (
                <button
                  type="button"
                  onClick={handleSignOut}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium text-[#78716c] hover:bg-[#ede5d8] transition-all cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Cerrar sesión</span>
                </button>
              ) : (
                /* Official Styled Sign in with Google Button */
                <button
                  type="button"
                  onClick={handleSignIn}
                  disabled={isAuthLoading}
                  className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold bg-white text-[#3c4043] border border-[#dadce0] hover:bg-[#f8f9fa] shadow-2xs transition-all cursor-pointer disabled:opacity-50"
                >
                  <svg className="w-4 h-4" viewBox="0 0 48 48">
                    <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
                    <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
                    <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
                    <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
                  </svg>
                  <span>{isAuthLoading ? 'Conectando...' : 'Iniciar Sesión con Google'}</span>
                </button>
              )}
            </div>
          </div>

          {/* Active Connected Spreadsheet Status Banner */}
          {connectedSheet && (
            <div className="px-5 py-3 bg-emerald-50/80 border-b border-emerald-200/90 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2.5 min-w-0">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-emerald-950 truncate">{connectedSheet.spreadsheetTitle}</span>
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                      {connectedSheet.sheetTabName}
                    </span>
                  </div>
                  <div className="text-[11px] text-emerald-700">
                    Sincronización activa • {connectedSheet.autoSync ? 'Auto-sincronizar al agregar o editar' : 'Sincronización manual'}
                    {connectedSheet.lastSyncedAt && (
                      <span className="ml-1 opacity-75">
                        (Última: {new Date(connectedSheet.lastSyncedAt).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })})
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={handleToggleAutoSync}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                    connectedSheet.autoSync
                      ? 'bg-emerald-700 text-white border-emerald-700 hover:bg-emerald-800'
                      : 'bg-white text-emerald-800 border-emerald-300 hover:bg-emerald-100'
                  }`}
                  title="Activa o desactiva la sincronización automática al crear o modificar pendientes en la aplicación"
                >
                  {connectedSheet.autoSync ? 'Auto-Sync: ON' : 'Auto-Sync: OFF'}
                </button>

                {onTriggerSync && (
                  <button
                    type="button"
                    onClick={onTriggerSync}
                    disabled={isSyncing}
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold bg-white text-emerald-900 border border-emerald-300 hover:bg-emerald-100 transition-all cursor-pointer shadow-2xs disabled:opacity-50"
                    title="Enviar tareas pendientes actuales a la hoja de Google Sheets"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin text-emerald-600' : ''}`} />
                    <span>{isSyncing ? 'Sincronizando...' : 'Sincronizar Todo'}</span>
                  </button>
                )}

                {connectedSheet.spreadsheetUrl && (
                  <a
                    href={connectedSheet.spreadsheetUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="p-1.5 rounded-lg text-emerald-700 hover:text-emerald-950 hover:bg-emerald-200 transition-all"
                    title="Abrir hoja de cálculo directamente en Google Drive"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                )}

                <button
                  type="button"
                  onClick={handleDisconnectSheet}
                  className="px-2 py-1 rounded-lg text-xs font-medium text-stone-500 hover:text-rose-700 hover:bg-rose-50 transition-all cursor-pointer"
                  title="Desvincular esta hoja de la sincronización automática"
                >
                  Desvincular
                </button>
              </div>
            </div>
          )}

          {/* Navigation Tabs */}
          <div className="flex border-b border-[#ece4d6] bg-[#fbf9f5] px-5 gap-2 pt-2">
            <button
              type="button"
              onClick={() => {
                setActiveTab('create');
                setOperationError(null);
              }}
              className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition-all cursor-pointer ${
                activeTab === 'create'
                  ? 'border-emerald-600 text-emerald-900 bg-white rounded-t-xl shadow-2xs'
                  : 'border-transparent text-[#786d5f] hover:text-[#292524]'
              }`}
            >
              <Plus className="w-3.5 h-3.5 text-emerald-600" />
              <span>Crear Nueva Hoja</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveTab('sync');
                setOperationError(null);
              }}
              className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition-all cursor-pointer ${
                activeTab === 'sync'
                  ? 'border-emerald-600 text-emerald-900 bg-white rounded-t-xl shadow-2xs'
                  : 'border-transparent text-[#786d5f] hover:text-[#292524]'
              }`}
            >
              <RefreshCw className="w-3.5 h-3.5 text-emerald-600" />
              <span>Sincronizar Hoja Existente</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveTab('import');
                setOperationError(null);
              }}
              className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition-all cursor-pointer ${
                activeTab === 'import'
                  ? 'border-emerald-600 text-emerald-900 bg-white rounded-t-xl shadow-2xs'
                  : 'border-transparent text-[#786d5f] hover:text-[#292524]'
              }`}
            >
              <Database className="w-3.5 h-3.5 text-emerald-600" />
              <span>Importar / Leer Datos</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveTab('csv');
                setOperationError(null);
              }}
              className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition-all cursor-pointer ${
                activeTab === 'csv'
                  ? 'border-emerald-600 text-emerald-900 bg-white rounded-t-xl shadow-2xs'
                  : 'border-transparent text-[#786d5f] hover:text-[#292524]'
              }`}
            >
              <Clipboard className="w-3.5 h-3.5 text-emerald-600" />
              <span>Pegar / Subir CSV</span>
            </button>
          </div>

          {/* Modal Body */}
          <div className="p-5 sm:p-6 overflow-y-auto flex-1 space-y-5">
            {/* Error notifications */}
            {authError && (
              <div className="p-4 rounded-2xl bg-amber-50/90 border border-amber-300 text-amber-950 text-xs space-y-2">
                <div className="flex items-start gap-2.5">
                  <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                  <div>
                    <strong>Aviso de Autenticación:</strong> {authError}
                  </div>
                </div>

                {authError.includes('unauthorized-domain') && (
                  <div className="p-3 bg-white/90 rounded-xl border border-amber-200 text-amber-900 text-[11px] leading-relaxed space-y-1.5">
                    <p className="font-bold flex items-center gap-1.5 text-amber-950">
                      <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                      ¿Tu documento es público ("Cualquiera con el enlace")?
                    </p>
                    <p>
                      ¡No necesitas iniciar sesión para sincronizarlo o leerlo! Puedes pegar la URL de la hoja en la pestaña <strong>"Sincronizar Hoja Existente"</strong> y pulsar <strong>"Sincronizar Pública"</strong>.
                    </p>
                    <p className="text-[10px] text-stone-600">
                      (Para habilitar el login de Google con popup en este despliegue, agrega <code>{typeof window !== 'undefined' ? window.location.hostname : 'este dominio'}</code> a los Dominios Autorizados de Firebase).
                    </p>
                  </div>
                )}
              </div>
            )}

            {operationError && (
              <div className="p-4 rounded-2xl bg-amber-50 border border-amber-300 text-amber-950 text-xs space-y-2.5">
                <div className="flex items-start gap-2.5">
                  <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                  <div>
                    <strong>Aviso de Operación:</strong> {operationError}
                  </div>
                </div>

                {(operationError.includes('Cualquiera con el enlace') || operationError.includes('públicamente') || operationError.includes('no se pudo')) && (
                  <div className="bg-white/95 p-3 rounded-xl border border-amber-200 text-[11px] text-stone-800 space-y-1.5">
                    <div className="font-bold text-amber-950">
                      ¿Cómo asegurarte de que tu hoja de Google sea pública?
                    </div>
                    <ol className="list-decimal pl-4 space-y-1 text-stone-700">
                      <li>Abre el documento en Google Sheets.</li>
                      <li>Haz clic en el botón azul <strong>"Compartir"</strong> arriba a la derecha.</li>
                      <li>En <strong>"Acceso general"</strong>, cambia de <em>"Restringido"</em> a <strong>"Cualquiera con el enlace"</strong>.</li>
                      <li>Rol: <strong>"Lector"</strong> (o <em>Editor</em>) y pulsa <em>"Listo"</em>.</li>
                      <li>Pega el enlace arriba y pulsa <strong>"Sincronizar Pública"</strong>. O si tu empresa bloquea compartir fuera de la organización, usa la pestaña <strong>"Pegar / Subir CSV"</strong> para importar en 3 segundos.</li>
                    </ol>
                  </div>
                )}
              </div>
            )}

            {/* TAB 1: CREATE NEW SPREADSHEET */}
            {activeTab === 'create' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#786d5f] mb-1.5">
                    Título del nuevo archivo de Google Sheets
                  </label>
                  <input
                    type="text"
                    value={newSheetTitle}
                    onChange={(e) => setNewSheetTitle(e.target.value)}
                    placeholder="Ej. Matriz de Priorización CRM WhatsApp"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#d6cbba] bg-[#faf8f4] text-sm text-[#1c1917] focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600/30 focus:border-emerald-600 transition-all font-medium"
                  />
                </div>

                {/* Scope & Structure Details */}
                <div className="p-4 rounded-2xl bg-[#faf7f2] border border-[#e8dfd2] space-y-2.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-[#3c342a] flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                      Estructura a Exportar:
                    </span>
                    <span className="font-mono text-emerald-800 font-bold bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                      {tasks.length} filas × 15 columnas
                    </span>
                  </div>
                  <p className="text-xs text-[#685c4e] leading-relaxed">
                    Se creará una hoja con encabezados oscuros institucionales, filas congeladas,
                    prioridad, porcentaje de criticidad, citas de la reunión y protocolos de solución acordados.
                  </p>
                  <div className="flex flex-wrap gap-1.5 text-[10px] font-mono text-[#786d5f]">
                    <span className="px-2 py-0.5 rounded-md bg-white border border-[#e0d6c7]">ID</span>
                    <span className="px-2 py-0.5 rounded-md bg-white border border-[#e0d6c7]">Estado</span>
                    <span className="px-2 py-0.5 rounded-md bg-white border border-[#e0d6c7]">Criticidad %</span>
                    <span className="px-2 py-0.5 rounded-md bg-white border border-[#e0d6c7]">Foco Funcional</span>
                    <span className="px-2 py-0.5 rounded-md bg-white border border-[#e0d6c7]">Responsable</span>
                    <span className="px-2 py-0.5 rounded-md bg-white border border-[#e0d6c7]">Solución Acordada</span>
                  </div>
                </div>

                {/* Create Action Button */}
                <div className="flex items-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={handleCreateNewSheet}
                    disabled={isCreating}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold bg-emerald-700 hover:bg-emerald-800 text-white shadow-md shadow-emerald-900/15 transition-all cursor-pointer disabled:opacity-50"
                  >
                    {isCreating ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Creando Hoja en Google Drive...</span>
                      </>
                    ) : (
                      <>
                        <FileSpreadsheet className="w-4 h-4" />
                        <span>Crear y Exportar a Google Sheets</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Success Banner when created */}
                {createdResult && (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 space-y-3"
                  >
                    <div className="flex items-center gap-2 font-bold text-sm">
                      <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                      <span>¡Hoja de cálculo creada exitosamente en tu Google Drive!</span>
                    </div>
                    <p className="text-xs text-emerald-800">
                      Los datos de los {tasks.length} puntos críticos del CRM WhatsApp han sido organizados con formato ejecutivo.
                    </p>
                    <div className="flex flex-wrap items-center gap-2.5 pt-1">
                      <a
                        href={createdResult.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-emerald-700 hover:bg-emerald-800 text-white transition-all shadow-xs cursor-pointer"
                      >
                        <span>Abrir en Google Sheets</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                      <button
                        type="button"
                        onClick={handleCopyLink}
                        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-white border border-emerald-300 text-emerald-900 hover:bg-emerald-100 transition-all cursor-pointer"
                      >
                        {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copiedLink ? 'Enlace Copiado' : 'Copiar Enlace'}</span>
                      </button>
                    </div>
                  </motion.div>
                )}
              </div>
            )}

            {/* TAB 2: SYNC WITH EXISTING SPREADSHEET */}
            {activeTab === 'sync' && (
              <div className="space-y-4">
                <p className="text-xs text-[#685c4e] leading-relaxed">
                  Selecciona una hoja de cálculo existente de tu Google Drive o pega el enlace/ID para actualizar sus filas con los datos vigentes del CRM.
                </p>

                {/* Manual Sheet ID / URL Input */}
                <div className="space-y-2">
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                    <input
                      type="text"
                      value={manualSheetInput}
                      onChange={(e) => setManualSheetInput(e.target.value)}
                      placeholder="Pega la URL pública o ID de Google Sheets (ej. https://docs.google.com/spreadsheets/d/...)"
                      className="flex-1 px-3.5 py-2.5 rounded-xl border border-[#d6cbba] bg-[#faf8f4] text-xs text-[#1c1917] focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600/30 font-medium"
                    />
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={handleManualInputSubmit}
                        disabled={isLoadingDetails || !manualSheetInput.trim()}
                        className="px-3.5 py-2.5 rounded-xl text-xs font-bold bg-[#292524] text-white hover:bg-[#44403c] transition-all cursor-pointer disabled:opacity-50 inline-flex items-center gap-1.5"
                      >
                        {isLoadingDetails ? <RefreshCw className="w-3 h-3 animate-spin" /> : null}
                        <span>{isLoadingDetails ? 'Cargando...' : 'Cargar Hoja'}</span>
                      </button>
                      <button
                        type="button"
                        onClick={handleLoadAndReadPublicSheet}
                        disabled={isImporting || !manualSheetInput.trim()}
                        className="px-3.5 py-2.5 rounded-xl text-xs font-bold bg-emerald-700 text-white hover:bg-emerald-800 transition-all cursor-pointer disabled:opacity-50 inline-flex items-center gap-1.5 shadow-2xs"
                        title="Lee y sincroniza directamente el documento público sin necesidad de iniciar sesión con Google"
                      >
                        <Database className="w-3.5 h-3.5" />
                        <span>{isImporting ? 'Leyendo...' : 'Sincronizar Pública'}</span>
                      </button>
                    </div>
                  </div>

                  <div className="p-2.5 rounded-xl bg-emerald-50/70 border border-emerald-200/80 text-[11px] text-emerald-900 flex items-start gap-2">
                    <Info className="w-3.5 h-3.5 text-emerald-700 shrink-0 mt-0.5" />
                    <span className="leading-snug">
                      <strong>Documentos públicos:</strong> Si la hoja fue compartida como <em>"Cualquiera con el enlace"</em>, no requieres iniciar sesión con Google. Puedes cargarla y sincronizarla directamente con el botón <strong>"Sincronizar Pública"</strong>.
                    </span>
                  </div>
                </div>

                {/* Google Drive Files Explorer */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold text-[#786d5f]">
                    <span className="flex items-center gap-1.5">
                      <FolderOpen className="w-3.5 h-3.5 text-amber-600" />
                      Tus Hojas de Cálculo Recientes en Drive
                    </span>
                    <button
                      type="button"
                      onClick={loadUserSpreadsheets}
                      disabled={isLoadingFiles}
                      className="inline-flex items-center gap-1 text-[11px] text-emerald-700 hover:text-emerald-900 cursor-pointer"
                    >
                      <RefreshCw className={`w-3 h-3 ${isLoadingFiles ? 'animate-spin' : ''}`} />
                      <span>Refrescar</span>
                    </button>
                  </div>

                  {driveFiles.length > 5 && (
                    <div className="relative">
                      <Search className="w-3.5 h-3.5 text-[#8c7e6c] absolute left-3 top-2.5" />
                      <input
                        type="text"
                        value={searchDriveQuery}
                        onChange={(e) => setSearchDriveQuery(e.target.value)}
                        placeholder="Buscar archivo por nombre..."
                        className="w-full pl-8 pr-3 py-1.5 rounded-lg border border-[#e4dcce] bg-white text-xs"
                      />
                    </div>
                  )}

                  {isLoadingFiles ? (
                    <div className="p-8 text-center text-xs text-[#786d5f]">
                      <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-emerald-600" />
                      <span>Buscando archivos de Google Sheets en tu Drive...</span>
                    </div>
                  ) : filteredDriveFiles.length === 0 ? (
                    <div className="p-4 rounded-xl bg-[#faf7f2] border border-[#e8dfd2] text-center text-xs text-[#786d5f]">
                      No se encontraron hojas recientes o no has iniciado sesión. Usa el formulario de arriba para pegar una URL directa o inicia sesión.
                    </div>
                  ) : (
                    <div className="max-h-48 overflow-y-auto rounded-xl border border-[#e2d8c9] divide-y divide-[#ece4d6] bg-white">
                      {filteredDriveFiles.map((file) => (
                        <div
                          key={file.id}
                          onClick={() => handleSelectSpreadsheet(file.id)}
                          className={`flex items-center justify-between p-2.5 text-xs hover:bg-[#f6f2ea] cursor-pointer transition-all ${
                            selectedFileId === file.id ? 'bg-emerald-50 text-emerald-950 font-bold' : 'text-[#292524]'
                          }`}
                        >
                          <div className="flex items-center gap-2 truncate">
                            <FileSpreadsheet className="w-4 h-4 text-emerald-700 shrink-0" />
                            <span className="truncate">{file.name}</span>
                          </div>
                          <span className="text-[10px] text-[#8c7e6c] shrink-0">
                            {new Date(file.modifiedTime).toLocaleDateString()}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Selected File Details & Tab Choice */}
                {fileDetails && (
                  <div className="p-4 rounded-2xl bg-[#faf7f2] border border-[#e8dfd2] space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="font-bold text-xs text-[#1c1917] truncate">
                        Documento: {fileDetails.title}
                      </div>
                      <a
                        href={`https://docs.google.com/spreadsheets/d/${fileDetails.id}/edit`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[11px] text-emerald-700 hover:text-emerald-900 inline-flex items-center gap-1"
                      >
                        <span>Ver en Sheets</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-[#786d5f] mb-1">
                        Selecciona la pestaña (Sheet Tab) a actualizar:
                      </label>
                      <select
                        value={selectedSheetTab}
                        onChange={(e) => setSelectedSheetTab(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-[#d6cbba] bg-white text-xs font-semibold"
                      >
                        {fileDetails.sheets.map((s) => (
                          <option key={s.sheetId} value={s.title}>
                            {s.title}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="pt-1">
                      <button
                        type="button"
                        onClick={handleRequestUpdateExisting}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white shadow-2xs transition-all cursor-pointer"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                        <span>Actualizar Datos en esta Hoja</span>
                      </button>
                    </div>
                  </div>
                )}

                {updateSuccessMessage && (
                  <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>{updateSuccessMessage}</span>
                  </div>
                )}
              </div>
            )}

            {/* TAB 3: IMPORT / READ DATA */}
            {activeTab === 'import' && (
              <div className="space-y-4">
                <p className="text-xs text-[#685c4e] leading-relaxed">
                  Lee los datos existentes desde cualquier hoja de cálculo de Google Sheets para inspeccionar los registros o sincronizar los estados de tareas con el CRM.
                </p>

                {fileDetails ? (
                  <div className="p-4 rounded-2xl bg-[#faf7f2] border border-[#e8dfd2] space-y-3">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-[#1c1917]">
                        Hoja activa: {fileDetails.title}
                      </span>
                      <span className="text-[11px] text-[#786d5f]">
                        Pestaña: <strong>{selectedSheetTab || 'Sheet1'}</strong>
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={handleReadSheet}
                      disabled={isImporting}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-emerald-700 hover:bg-emerald-800 text-white transition-all cursor-pointer disabled:opacity-50"
                    >
                      {isImporting ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          <span>Leyendo celdas desde Google Sheets...</span>
                        </>
                      ) : (
                        <>
                          <Database className="w-3.5 h-3.5" />
                          <span>Leer Filas de la Hoja</span>
                        </>
                      )}
                    </button>
                  </div>
                ) : (
                  <div className="p-4 rounded-2xl bg-[#faf7f2] border border-[#e8dfd2] text-xs text-[#786d5f]">
                    Primero selecciona o carga un documento en la pestaña <strong>"Sincronizar Hoja Existente"</strong> para poder leer sus datos.
                  </div>
                )}

                {importSuccess && (
                  <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>{importSuccess}</span>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 shrink-0">
                      {onUpdateAllTasks && importPreview && importPreview.length > 1 && (
                        <button
                          type="button"
                          onClick={handleSyncAllFromSheet}
                          className="px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-700 text-white hover:bg-emerald-800 shadow-2xs transition-all cursor-pointer inline-flex items-center gap-1.5"
                          title="Crea nuevos globos 3D y tarjetas en la web a partir de las nuevas filas del Sheet"
                        >
                          <Sparkles className="w-3.5 h-3.5" />
                          <span>Sincronizar y Generar en la Web</span>
                        </button>
                      )}
                      {onUpdateTaskStates && (
                        <button
                          type="button"
                          onClick={handleApplyImportedStates}
                          className="px-2.5 py-1.5 rounded-xl text-xs font-semibold bg-white border border-emerald-300 text-emerald-800 hover:bg-emerald-100 transition-all cursor-pointer"
                        >
                          Solo Estados (Activo/Inactivo)
                        </button>
                      )}
                    </div>
                  </div>
                )}

                {importPreview && importPreview.length > 0 && (
                  <div className="space-y-2">
                    <div className="text-xs font-bold text-[#786d5f]">
                      Vista Previa de Celdas Leídas ({importPreview.length} filas):
                    </div>
                    <div className="max-h-56 overflow-auto rounded-xl border border-[#e2d8c9] bg-white text-[11px]">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="bg-[#292524] text-[#f6f3ed]">
                            {importPreview[0].slice(0, 6).map((cell, idx) => (
                              <th key={idx} className="p-2 border-b border-[#3e3835] font-semibold">
                                {String(cell)}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#ece4d6]">
                          {importPreview.slice(1, 10).map((row, rIdx) => (
                            <tr key={rIdx} className="hover:bg-[#faf7f2]">
                              {row.slice(0, 6).map((cell, cIdx) => (
                                <td key={cIdx} className="p-2 truncate max-w-[140px] text-[#443c32]">
                                  {String(cell)}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* TAB 4: PASTE / UPLOAD CSV OR TSV */}
            {activeTab === 'csv' && (
              <div className="space-y-4">
                <div className="p-3.5 rounded-xl bg-stone-50 border border-stone-200 text-xs text-stone-700 leading-relaxed">
                  <strong>Sincronización Directa sin Restricciones:</strong> Copia las celdas de tu hoja en Google Sheets (Ctrl+C) y pégalas aquí, o descarga el archivo como CSV (<em>Archivo &gt; Descargar &gt; Valores separados por comas .csv</em>) y súbelo. ¡Funciona al 100% incluso si tu cuenta de Google o empresa bloquea el acceso externo!
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-bold uppercase tracking-wider text-[#786d5f]">
                      Pegar Filas de Google Sheets o Subir CSV
                    </label>
                    <label className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold bg-white border border-stone-300 text-stone-800 hover:bg-stone-100 transition-all cursor-pointer shadow-2xs">
                      <Upload className="w-3.5 h-3.5 text-stone-600" />
                      <span>Subir archivo .csv</span>
                      <input
                        type="file"
                        accept=".csv,.tsv,.txt"
                        onChange={handleFileUpload}
                        className="hidden"
                      />
                    </label>
                  </div>

                  <textarea
                    rows={6}
                    value={csvInputText}
                    onChange={(e) => setCsvInputText(e.target.value)}
                    placeholder={`ID Tarea\tDescripción\tCliente / Empresa\tPrioridad\t...\nPega aquí las celdas copiadas directamente de Google Sheets o tu archivo CSV...`}
                    className="w-full p-3 rounded-xl border border-[#d6cbba] bg-[#faf8f4] text-xs font-mono text-[#1c1917] focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600/30"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => handleParseAndPreviewCsv()}
                    disabled={!csvInputText.trim()}
                    className="px-4 py-2.5 rounded-xl text-xs font-bold bg-emerald-700 hover:bg-emerald-800 text-white transition-all cursor-pointer disabled:opacity-50 inline-flex items-center gap-1.5 shadow-2xs"
                  >
                    <Database className="w-3.5 h-3.5" />
                    <span>Procesar y Previsualizar Filas</span>
                  </button>

                  {csvInputText && (
                    <button
                      type="button"
                      onClick={() => setCsvInputText('')}
                      className="text-xs text-stone-500 hover:text-stone-800 cursor-pointer font-medium"
                    >
                      Limpiar texto
                    </button>
                  )}
                </div>

                {/* Preview and Sync button if parsed */}
                {importSuccess && (
                  <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>{importSuccess}</span>
                    </div>
                    {onUpdateAllTasks && importPreview && importPreview.length > 1 && (
                      <button
                        type="button"
                        onClick={handleSyncAllFromSheet}
                        className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-emerald-700 text-white hover:bg-emerald-800 shadow-2xs transition-all cursor-pointer inline-flex items-center gap-1.5 shrink-0"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Sincronizar y Generar en la Web</span>
                      </button>
                    )}
                  </div>
                )}

                {importPreview && importPreview.length > 0 && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs font-bold text-[#786d5f]">
                      <span>Vista Previa ({importPreview.length} filas detectadas):</span>
                    </div>
                    <div className="max-h-56 overflow-auto rounded-xl border border-[#e2d8c9] bg-white text-[11px]">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="bg-[#292524] text-[#f6f3ed]">
                            {importPreview[0].slice(0, 6).map((cell, idx) => (
                              <th key={idx} className="p-2 border-b border-[#3e3835] font-semibold">
                                {String(cell)}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#ece4d6]">
                          {importPreview.slice(1, 10).map((row, rIdx) => (
                            <tr key={rIdx} className="hover:bg-[#faf7f2]">
                              {row.slice(0, 6).map((cell, cIdx) => (
                                <td key={cIdx} className="p-2 truncate max-w-[140px] text-[#443c32]">
                                  {String(cell)}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-[#ece4d6] bg-[#faf7f2] flex items-center justify-between text-xs text-[#786d5f]">
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Conexión cifrada OAuth 2.0 con Google Cloud</span>
            </span>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-[#292524] text-white hover:bg-[#44403c] transition-all cursor-pointer"
            >
              Cerrar
            </button>
          </div>
        </motion.div>

        {/* MANDATORY CONFIRMATION DIALOG FOR DESTRUCTIVE / OVERWRITE OPERATIONS */}
        {confirmDialog.isOpen && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
            <motion.div
              initial={{ scale: 0.92, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="w-full max-w-md bg-white rounded-3xl p-5 sm:p-6 border border-amber-300 shadow-2xl space-y-4"
            >
              <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-900 flex items-center justify-center mx-auto">
                <AlertTriangle className="w-6 h-6 text-amber-700" />
              </div>

              <div className="text-center space-y-1.5">
                <h4 className="font-serif-warm font-bold text-base text-[#1c1917]">
                  ¿Confirmar sobrescritura de datos en Google Sheets?
                </h4>
                <p className="text-xs text-[#685c4e] leading-relaxed">
                  Estás a punto de actualizar la pestaña{' '}
                  <strong className="text-[#1c1917]">"{confirmDialog.sheetName}"</strong> del archivo{' '}
                  <strong className="text-[#1c1917]">"{confirmDialog.title}"</strong> con los {tasks.length} registros del CRM WhatsApp.
                </p>
                <div className="p-3 rounded-xl bg-amber-50/80 border border-amber-200 text-amber-900 text-[11px] text-left mt-2">
                  <strong>Aviso:</strong> Esta acción mutará y sobrescribirá el contenido existente en dicha pestaña de Google Sheets con la matriz actual.
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setConfirmDialog({ ...confirmDialog, isOpen: false })}
                  disabled={isUpdatingExisting}
                  className="flex-1 px-4 py-2.5 rounded-xl text-xs font-semibold bg-[#faf7f2] hover:bg-[#ede5d8] border border-[#e4dccf] text-[#574d3f] transition-all cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleConfirmUpdate}
                  disabled={isUpdatingExisting}
                  className="flex-1 px-4 py-2.5 rounded-xl text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-2xs"
                >
                  {isUpdatingExisting ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Actualizando...</span>
                    </>
                  ) : (
                    <span>Confirmar y Sobrescribir</span>
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </div>
    </AnimatePresence>
  );
};
