import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  UserCheck, 
  LogIn, 
  ShieldCheck, 
  Mail, 
  CheckCircle2, 
  LogOut, 
  Sparkles,
  Users
} from 'lucide-react';
import { googleSignIn, logoutGoogle } from '../lib/googleAuth';

export interface TeamMember {
  email: string;
  name: string;
  role: string;
  avatarColor: string;
}

export const PRESET_TEAM_MEMBERS: TeamMember[] = [
  {
    email: 'marketingvivibox@gmail.com',
    name: 'Super Admin / Vivibox',
    role: 'Mesa de Trabajo & Marketing',
    avatarColor: 'from-amber-500 to-red-600',
  },
  {
    email: 'mayir@vivibox.com',
    name: 'Mayir',
    role: 'Gestión & Operaciones CRM / Editor Autorizado',
    avatarColor: 'from-teal-500 to-emerald-700',
  },
  {
    email: 'alex.softwarefactory@vivibox.com',
    name: 'Alex',
    role: 'Líder Técnico / Software Factory',
    avatarColor: 'from-cyan-500 to-blue-600',
  },
  {
    email: 'freddy.ventas@vivibox.com',
    name: 'Freddy',
    role: 'Jefe de Ventas Call Center',
    avatarColor: 'from-emerald-500 to-teal-600',
  },
  {
    email: 'antoinette.procesos@vivibox.com',
    name: 'Antoinette',
    role: 'Líder Procesos & Sistemas TI',
    avatarColor: 'from-purple-500 to-indigo-600',
  },
  {
    email: 'josecarlos.ads@vivibox.com',
    name: 'Jose Carlos',
    role: 'Especialista Meta Ads & Atribución',
    avatarColor: 'from-rose-500 to-pink-600',
  },
];

interface TeamAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: TeamMember | null;
  onSelectUser: (user: TeamMember) => void;
  onLogout: () => void;
  actionReason?: string;
}

export const TeamAuthModal: React.FC<TeamAuthModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onSelectUser,
  onLogout,
  actionReason,
}) => {
  const [customEmail, setCustomEmail] = useState('');
  const [customName, setCustomName] = useState('');
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customEmail || !customEmail.includes('@')) {
      setAuthError('Por favor ingresa un correo electrónico válido.');
      return;
    }
    const name = customName.trim() || customEmail.split('@')[0];
    onSelectUser({
      email: customEmail.trim().toLowerCase(),
      name,
      role: 'Editor de Equipo',
      avatarColor: 'from-stone-600 to-stone-800',
    });
    setAuthError(null);
    onClose();
  };

  const handleGoogleLogin = async () => {
    setIsGoogleLoading(true);
    setAuthError(null);
    try {
      const res = await googleSignIn();
      if (res && res.user) {
        onSelectUser({
          email: res.user.email || 'marketingvivibox@gmail.com',
          name: res.user.displayName || 'Usuario Google',
          role: 'Editor Google Sheets',
          avatarColor: 'from-blue-600 to-emerald-600',
        });
        onClose();
      }
    } catch (err: any) {
      console.warn('Google sign-in attempt:', err);
      // If popup was blocked or closed, allow manual selection
      setAuthError(
        err?.message?.includes('redirect_uri_mismatch')
          ? 'El dominio actual no está en la lista de redirección OAuth de Google Cloud. Puedes identificarte seleccionando tu usuario de equipo o escribiendo tu correo a continuación.'
          : err?.message || 'Error al conectar con Google. Puedes identificarte con tu correo en la lista inferior.'
      );
    } finally {
      setIsGoogleLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-[#fcfbfa] rounded-3xl border border-[#dcd3c4] shadow-2xl overflow-hidden p-6 sm:p-7">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 pb-4 border-b border-[#ebd8c4]">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-[#292524] text-amber-400 shadow-sm">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-[#1c1917] font-serif-warm">
                Identificación de Equipo CRM
              </h3>
              <p className="text-xs text-[#786d5f]">
                {actionReason || 'Para colaborar y editar la matriz en equipo, identifícate con tu correo.'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-[#786d5f] hover:bg-[#ede5d8] hover:text-[#1c1917] transition-all cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Current status if already logged in */}
        {currentUser && (
          <div className="mt-4 p-3.5 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${currentUser.avatarColor} text-white font-bold text-xs flex items-center justify-center shrink-0`}>
                {currentUser.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="text-xs font-bold text-[#1c1917]">{currentUser.name}</p>
                <p className="text-[11px] text-[#786d5f] font-mono">{currentUser.email}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                onLogout();
                logoutGoogle().catch(() => {});
              }}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold bg-white hover:bg-rose-50 text-rose-700 border border-rose-200 transition-all cursor-pointer shadow-2xs"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Cerrar Sesión</span>
            </button>
          </div>
        )}

        {/* Google OAuth Login Button */}
        <div className="mt-5">
          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={isGoogleLoading}
            className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-2xl bg-white hover:bg-[#f6f2eb] border border-[#d5c7b3] text-[#1c1917] font-bold text-xs sm:text-sm shadow-xs hover:shadow-md transition-all cursor-pointer disabled:opacity-50"
          >
            <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            <span>
              {isGoogleLoading ? 'Conectando con Google...' : 'Iniciar Sesión con Google (Tokens de Edición)'}
            </span>
          </button>
        </div>

        {authError && (
          <p className="mt-3 text-xs text-rose-700 bg-rose-50 p-2.5 rounded-xl border border-rose-200">
            {authError}
          </p>
        )}

        {/* Quick select member */}
        <div className="mt-5">
          <p className="text-[11px] font-bold text-[#8a7c6c] uppercase tracking-wider mb-2.5">
            O selecciona tu perfil de la mesa de trabajo:
          </p>
          <div className="grid grid-cols-1 gap-2 max-h-48 overflow-y-auto pr-1">
            {PRESET_TEAM_MEMBERS.map((member) => (
              <button
                key={member.email}
                type="button"
                onClick={() => {
                  onSelectUser(member);
                  onClose();
                }}
                className={`flex items-center justify-between p-2.5 rounded-xl text-left border transition-all cursor-pointer ${
                  currentUser?.email === member.email
                    ? 'bg-[#292524] text-white border-amber-400 shadow-sm'
                    : 'bg-white hover:bg-[#f6f2ea] text-[#292524] border-[#e2d8ca]'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <div className={`w-7 h-7 rounded-full bg-gradient-to-br ${member.avatarColor} text-white font-bold text-[11px] flex items-center justify-center shrink-0`}>
                    {member.name.charAt(0)}
                  </div>
                  <div>
                    <p className="text-xs font-bold">{member.name}</p>
                    <p className={`text-[10px] ${currentUser?.email === member.email ? 'text-amber-200' : 'text-[#786d5f]'}`}>
                      {member.email}
                    </p>
                  </div>
                </div>
                <span className={`text-[10px] font-medium px-2 py-0.5 rounded-md ${
                  currentUser?.email === member.email ? 'bg-amber-400 text-stone-900 font-bold' : 'bg-stone-100 text-stone-600'
                }`}>
                  {member.role.split('/')[0]}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Custom email form */}
        <form onSubmit={handleCustomSubmit} className="mt-5 pt-4 border-t border-[#ebd8c4]">
          <p className="text-[11px] font-bold text-[#8a7c6c] uppercase tracking-wider mb-2">
            O ingresa otro correo de tu equipo:
          </p>
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              type="email"
              value={customEmail}
              onChange={(e) => setCustomEmail(e.target.value)}
              placeholder="tu.correo@vivibox.com"
              className="flex-1 px-3 py-2 rounded-xl bg-white border border-[#d5c7b3] text-xs text-[#1c1917] placeholder:text-[#998b79] focus:outline-hidden focus:ring-2 focus:ring-amber-500/30"
            />
            <input
              type="text"
              value={customName}
              onChange={(e) => setCustomName(e.target.value)}
              placeholder="Tu Nombre"
              className="sm:w-36 px-3 py-2 rounded-xl bg-white border border-[#d5c7b3] text-xs text-[#1c1917] placeholder:text-[#998b79] focus:outline-hidden focus:ring-2 focus:ring-amber-500/30"
            />
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-[#292524] text-white hover:bg-[#44403c] font-bold text-xs transition-all cursor-pointer shrink-0 shadow-2xs"
            >
              Identificarme
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
