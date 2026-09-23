import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  signInWithPopup,
  GoogleAuthProvider,
  onAuthStateChanged,
  signOut,
  User,
} from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';

// Initialize Firebase app if not already initialized
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
export const auth = getAuth(app);

// Scopes required for Google Drive & Google Sheets
export const WORKSPACE_SCOPES = [
  'https://www.googleapis.com/auth/drive',
  'https://www.googleapis.com/auth/drive.file',
  'https://www.googleapis.com/auth/drive.readonly',
  'https://www.googleapis.com/auth/spreadsheets',
  'https://www.googleapis.com/auth/spreadsheets.readonly',
];

const provider = new GoogleAuthProvider();
WORKSPACE_SCOPES.forEach((scope) => {
  provider.addScope(scope);
});
provider.setCustomParameters({
  prompt: 'select_account',
});

// Flag to track ongoing sign in flow
let isSigningIn = false;

// Cached access token in memory (never localStorage)
let cachedAccessToken: string | null = null;

/**
 * Initialize auth listener on app boot.
 */
export const initAuth = (
  onAuthSuccess?: (user: User, token: string) => void,
  onAuthFailure?: () => void
) => {
  return onAuthStateChanged(auth, async (user: User | null) => {
    if (user && cachedAccessToken) {
      if (onAuthSuccess) onAuthSuccess(user, cachedAccessToken);
    } else {
      cachedAccessToken = null;
      if (onAuthFailure) onAuthFailure();
    }
  });
};

/**
 * Trigger Google Sign In with popup to get user and OAuth access token with Sheets scopes.
 * Falls back to Google Identity Services (GSI) Token Client if Firebase domain check fails.
 */
export const googleSignIn = async (): Promise<{ user: User | any; accessToken: string } | null> => {
  try {
    isSigningIn = true;
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential?.accessToken) {
      throw new Error('No se pudo obtener el token de acceso de Google Sheets.');
    }

    cachedAccessToken = credential.accessToken;
    return { user: result.user, accessToken: cachedAccessToken };
  } catch (error: any) {
    console.warn('Firebase popup sign-in encountered an issue:', error?.code, error?.message);

    // If unauthorized domain in Firebase, attempt fallback to Google Identity Services (GSI) client
    if (
      (error?.code === 'auth/unauthorized-domain' || error?.message?.includes('unauthorized-domain')) &&
      typeof window !== 'undefined' &&
      (window as any).google?.accounts?.oauth2 &&
      firebaseConfig.oAuthClientId
    ) {
      console.log('Attempting GSI token client fallback for Google Sheets...');
      try {
        const token = await new Promise<string>((resolve, reject) => {
          const client = (window as any).google.accounts.oauth2.initTokenClient({
            client_id: firebaseConfig.oAuthClientId,
            scope: WORKSPACE_SCOPES.join(' '),
            callback: (res: any) => {
              if (res.error) {
                reject(new Error(res.error_description || res.error || 'Error en Google OAuth'));
              } else if (res.access_token) {
                resolve(res.access_token);
              } else {
                reject(new Error('No se recibió token de acceso de Google.'));
              }
            },
            error_callback: (err: any) => {
              reject(new Error(err?.message || 'Error al invocar Google Identity Services.'));
            },
          });
          client.requestAccessToken({ prompt: 'select_account' });
        });

        cachedAccessToken = token;
        return {
          user: {
            displayName: 'Cuenta de Google Conectada',
            email: 'google-sheets@workspace',
          },
          accessToken: token,
        };
      } catch (gsiErr: any) {
        console.error('GSI fallback error:', gsiErr);
      }
    }

    // Translate common errors with actionable guidance
    if (
      error?.message?.includes('access_denied') ||
      error?.message?.includes('verificación') ||
      error?.code === 'auth/access-denied' ||
      error?.code === '403'
    ) {
      throw new Error(
        'Acceso restringido por Google (Error 403: app en fase de prueba en Google Cloud). ' +
        '¡NO necesitas iniciar sesión con Google! Tu hoja de Google Sheets se sincroniza directamente sin cuenta con la opción "Sincronizar Hoja Pública" o pegando el enlace.'
      );
    }

    if (error?.code === 'auth/unauthorized-domain' || error?.message?.includes('unauthorized-domain')) {
      const currentHost = typeof window !== 'undefined' ? window.location.hostname : 'este dominio';
      throw new Error(
        `Dominio no autorizado en Firebase (${currentHost}). ` +
        `Si tu hoja de cálculo es pública ("Cualquiera con el enlace"), ¡no necesitas iniciar sesión! ` +
        `Puedes sincronizarla directamente usando la opción "Sincronizar Hoja Pública".`
      );
    }

    if (error?.code === 'auth/popup-blocked') {
      throw new Error('La ventana emergente de inicio de sesión fue bloqueada por el navegador. Por favor permite popups.');
    }

    if (error?.code === 'auth/popup-closed-by-user') {
      throw new Error('Se cerró la ventana de inicio de sesión antes de completar la autorización.');
    }

    throw error;
  } finally {
    isSigningIn = false;
  }
};

/**
 * Get current in-memory access token
 */
export const getAccessToken = async (): Promise<string | null> => {
  return cachedAccessToken;
};

/**
 * Set token in memory (e.g. if refreshed or obtained during session)
 */
export const setCachedAccessToken = (token: string | null) => {
  cachedAccessToken = token;
};

/**
 * Log out from Firebase and clear cached token
 */
export const logoutGoogle = async () => {
  await signOut(auth);
  cachedAccessToken = null;
};
