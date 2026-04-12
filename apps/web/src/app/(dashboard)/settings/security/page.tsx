'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import {
 Lock, ShieldCheck, Key, Smartphone, Laptop,
 Trash2, AlertTriangle, ChevronRight, X, History,
 Shield, CheckCircle, Copy, Zap, Fingerprint, RefreshCcw,
 Globe, AlertCircle, Clock, Terminal, Eye, Activity, MapPin
} from '@/components/ui/icons';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Magnetic } from '@/components/ui/Interactions';
import { usersApi } from '@/lib/api/users';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

const AUDIT_EVENTS = [
 { id: 'evt_001', action: 'LOGIN_SUCCESS', device: 'Chrome / Desktop', location: 'Mumbai, IN', ip: '122.161.49.21', ts: '2 min ago', level: 'info' },
 { id: 'evt_002', action: 'API_KEY_CREATED', device: 'Chrome / Desktop', location: 'Mumbai, IN', ip: '122.161.49.21', ts: '1 hour ago', level: 'warning' },
 { id: 'evt_003', action: 'PASSWORD_CHANGED', device: 'Safari / iPhone', location: 'Delhi, IN', ip: '45.122.21.14', ts: '2 days ago', level: 'critical' },
 { id: 'evt_004', action: 'LOGIN_FAILED', device: 'Unknown Agent', location: 'Shanghai, CN', ip: '203.77.141.3', ts: '3 days ago', level: 'critical' },
 { id: 'evt_005', action: 'STRATEGY_DEPLOYED', device: 'Chrome / Desktop', location: 'Mumbai, IN', ip: '122.161.49.21', ts: '4 days ago', level: 'info' },
 { id: 'evt_006', action: '2FA_ENABLED', device: 'Chrome / Desktop', location: 'Mumbai, IN', ip: '122.161.49.21', ts: '5 days ago', level: 'info' },
 { id: 'evt_007', action: 'WITHDRAWAL_INITIATED', device: 'Chrome / Desktop', location: 'Mumbai, IN', ip: '122.161.49.21', ts: '6 days ago', level: 'warning' },
 { id: 'evt_008', action: 'LOGIN_FAILED', device: 'Unknown Bot', location: 'Frankfurt, DE', ip: '185.220.101.55', ts: '7 days ago', level: 'critical' },
];

const LEVEL_STYLES = {
 info: { dot: 'bg-cyan-500', badge: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20', glow: '' },
 warning: { dot: 'bg-amber-500', badge: 'bg-amber-500/10 text-amber-400 border-amber-500/20', glow: '' },
 critical: { dot: 'bg-rose-500 animate-pulse', badge: 'bg-rose-500/10 text-rose-400 border-rose-500/20', glow: 'shadow-[0_0_20px_rgba(244,63,94,0.1)]' },
};

export default function SecuritySettingsPage() {
 const queryClient = useQueryClient();
 const [is2faEnabled, setIs2faEnabled] = React.useState(false);
 const [is2faOpen, setIs2faOpen] = React.useState(false);
 const [isDeleteModalOpen, setIsDeleteModalOpen] = React.useState(false);
 const [deleteConfirm, setDeleteConfirm] = React.useState('');
 const [auditFilter, setAuditFilter] = React.useState<'all' | 'critical' | 'warning'>('all');
 const [otpInput, setOtpInput] = React.useState('');
 
 // Password State
 const [currentPassword, setCurrentPassword] = React.useState('');
 const [newPassword, setNewPassword] = React.useState('');
 const [isChangingPassword, setIsChangingPassword] = React.useState(false);

 const { data: sessions, isLoading: isLoadingSessions, refetch: refreshSessions, isFetching: isRefreshing } = useQuery({
   queryKey: ['userSessions'],
   queryFn: () => usersApi.getSessions(),
 });

 const handle2faToggle = () => {
 if (is2faEnabled) setIs2faEnabled(false);
 else setIs2faOpen(true);
 };

 const handleVerify2fa = () => {
 setIs2faEnabled(true);
 setIs2faOpen(false);
 setOtpInput('');
 };

 const handleRotateKey = async () => {
   if(!currentPassword || !newPassword) return;
   setIsChangingPassword(true);
   try {
     await usersApi.changePassword({ currentPassword, newPassword });
     setCurrentPassword('');
     setNewPassword('');
     alert('Password changed successfully');
   } catch (e) {
     alert('Failed to change password');
   } finally {
     setIsChangingPassword(false);
   }
 };

 const handleRevokeSession = async (id: string) => {
   try {
     await usersApi.revokeSession(id);
     refreshSessions();
   } catch (e) {
     console.error('Failed to revoke', e);
   }
 };

 const handleDeleteAccount = async () => {
   try {
     await usersApi.deleteAccount(deleteConfirm);
     window.location.href = '/login';
   } catch (e) {
     alert('Failed to delete account. Check confirmation word.');
   }
 };

 const filteredEvents = AUDIT_EVENTS.filter(e =>
 auditFilter === 'all' ? true : e.level === auditFilter
 );

 return (
 <div className="space-y-16 pb-20">

 {/* ── ACCESS CREDENTIALS ── */}
 <section className="space-y-8">
 <div className="flex items-center gap-5">
 <div className="w-12 h-12 rounded-[18px] bg-white/5 border border-white/10 flex items-center justify-center">
 <Lock className="w-6 h-6 text-white/40" />
 </div>
 <h3 className="text-2xl font-semibold text-white uppercase tracking-tight">Access Credentials</h3>
 <div className="h-px flex-1 bg-white/5" />
 </div>

 <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
 <div className="space-y-3 group">
 <label className="text-xs font-semibold text-white/20 uppercase tracking-[0.5em] ml-1 group-focus-within:text-p transition-colors">Current Cipher</label>
 <div className="relative">
 <input
 type="password"
 value={currentPassword}
 onChange={e => setCurrentPassword(e.target.value)}
 placeholder="••••••••••••"
 className="w-full h-14 bg-white/[0.03] border border-white/5 rounded-[20px] px-6 text-sm font-semibold text-white outline-none focus:border-p/40 focus:bg-p/5 transition-all"
 />
 </div>
 </div>
 <div className="space-y-3 group">
 <label className="text-xs font-semibold text-white/20 uppercase tracking-[0.5em] ml-1 group-focus-within:text-p transition-colors">New Quantum Key</label>
 <div className="relative">
 <input
 type="password"
 value={newPassword}
 onChange={e => setNewPassword(e.target.value)}
 placeholder="••••••••••••"
 className="w-full h-14 bg-white/[0.03] border border-white/5 rounded-[20px] px-6 text-sm font-semibold text-white outline-none focus:border-p/40 focus:bg-p/5 transition-all"
 />
 <Key className="absolute right-5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/10" />
 </div>
 </div>
 </div>

 <Button 
   onClick={handleRotateKey} 
   disabled={isChangingPassword}
   className="h-12 px-8 rounded-[16px] bg-white/5 border border-white/10 hover:bg-white/10 font-semibold uppercase tracking-[0.2em] text-xs text-white/40 hover:text-white transition-all disabled:opacity-50"
  >
 {isChangingPassword ? 'Rotating...' : 'Rotate Secure Key'}
 </Button>
 </section>

 {/* ── 2FA PROTOCOL ── */}
 <section className="relative group">
 <div className="absolute -inset-px bg-gradient-to-br from-p/20 to-indigo-500/5 rounded-[36px] blur-xl opacity-30 group-hover:opacity-60 transition-opacity duration-1000" />
 <div className="relative p-8 rounded-[32px] border border-p/20 bg-p/[0.02] overflow-hidden">
 <div className="absolute top-0 right-0 w-64 h-64 bg-p/10 rounded-full blur-[100px] -mr-32 -mt-32 animate-pulse pointer-events-none" />

 <div className="flex flex-col lg:flex-row items-start justify-between gap-10 relative z-10">
 <div className="space-y-5 flex-1">
 <div className="flex items-center gap-5">
 <div className={cn(
"w-14 h-14 rounded-[20px] flex items-center justify-center border",
 is2faEnabled ?"bg-emerald-500/10 border-emerald-500/20" :"bg-p/10 border-p/20"
 )}>
 {is2faEnabled ? <ShieldCheck className="w-7 h-7 text-emerald-400" /> : <Shield className="w-7 h-7 text-p" />}
 </div>
 <div>
 <h3 className="text-xl font-semibold text-white uppercase tracking-tight">Two-Factor Auth</h3>
 <div className="flex items-center gap-2 mt-1">
 <div className={cn("w-1.5 h-1.5 rounded-full", is2faEnabled ?"bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]" :"bg-rose-500 animate-pulse shadow-[0_0_8px_rgba(244,63,94,0.8)]")} />
 <span className={cn("text-xs font-semibold uppercase tracking-widest font-jet-mono", is2faEnabled ?"text-emerald-400" :"text-rose-400")}>
 {is2faEnabled ? 'PROTOCOL_ACTIVE' : 'SECURITY_BYPASS_RISK'}
 </span>
 </div>
 </div>
 </div>
 <p className="text-xs text-white/30 font-semibold uppercase tracking-[0.2em] leading-relaxed max-w-md">
 Require a time-based one-time password on every login. Protects against credential theft.
 </p>
 </div>

 <button
 onClick={handle2faToggle}
 className={cn(
"w-20 h-10 rounded-full border transition-all p-1.5 flex shrink-0",
 is2faEnabled ?"bg-emerald-500/20 border-emerald-500/40 justify-end shadow-[0_0_20px_rgba(16,185,129,0.2)]" :"bg-white/5 border-white/10 justify-start"
 )}
 >
 <motion.div layout className={cn("h-full aspect-square rounded-full", is2faEnabled ?"bg-emerald-400 shadow-[0_0_12px_rgba(16,185,129,1)]" :"bg-white/20")} />
 </button>
 </div>
 </div>
 </section>

 {/* ── AUTHORIZED NODES ── */}
 <section className="space-y-8">
 <div className="flex items-center justify-between">
 <div className="flex items-center gap-5">
 <div className="w-12 h-12 rounded-[18px] bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
 <Smartphone className="w-6 h-6 text-indigo-400" />
 </div>
 <h3 className="text-2xl font-semibold text-white uppercase tracking-tight">Authorized Nodes</h3>
 </div>
 <button onClick={() => refreshSessions()} className="flex items-center gap-2 text-xs font-semibold text-white/20 uppercase tracking-widest hover:text-white transition-colors">
 <RefreshCcw className={cn("w-3.5 h-3.5 transition-transform duration-700", isRefreshing &&"animate-spin")} />
 Sync
 </button>
 </div>

 <div className="space-y-4">
 {isLoadingSessions ? (
   <div className="p-6 rounded-[24px] bg-white/[0.02] border border-white/5 animate-pulse h-24" />
 ) : sessions?.length === 0 ? (
   <div className="p-6 text-center text-white/30 text-xs uppercase tracking-widest">No active sessions found</div>
 ) : sessions?.map((s: any) => (
 <motion.div
 key={s.id}
 initial={{ opacity: 0, x: -20 }}
 animate={{ opacity: 1, x: 0 }}
 className="flex items-center justify-between p-6 rounded-[24px] bg-white/[0.02] border border-white/5 hover:border-white/15 hover:bg-p/[0.02] transition-all group"
 >
 <div className="flex items-center gap-6">
 <div className="w-14 h-14 rounded-[18px] bg-white/[0.02] border border-white/5 flex items-center justify-center relative group-hover:border-p/30 transition-colors">
 <Laptop className="w-7 h-7 text-white/20 group-hover:text-p transition-colors duration-500" />
 </div>
 <div>
 <div className="flex items-center gap-3">
 <span className="text-sm font-semibold text-white uppercase tracking-tight">{s.deviceName || 'Unknown Device'}</span>
 <span className="text-xs font-semibold text-white/20 uppercase font-jet-mono">{s.ipAddress}</span>
 </div>
 <div className="flex items-center gap-3 mt-1">
 <span className="text-xs text-white/30 font-semibold uppercase tracking-widest">{s.browser || 'Unknown'}</span>
 <div className="w-1 h-1 rounded-full bg-white/10" />
 <span className="text-xs text-white/30 font-semibold uppercase tracking-widest flex items-center gap-1">
 <Globe className="w-3 h-3" />{s.country || 'Global'}
 </span>
 </div>
 </div>
 </div>
 <button onClick={() => handleRevokeSession(s.id)} className="opacity-0 group-hover:opacity-100 transition-opacity w-9 h-9 rounded-[10px] bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400 hover:bg-rose-500/20">
 <X className="w-4 h-4" />
 </button>
 </motion.div>
 ))}
 </div>
 </section>

 {/* ── SECURITY AUDIT LOG ── */}
 <section className="space-y-8">
 <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
 <div className="flex items-center gap-5">
 <div className="w-12 h-12 rounded-[18px] bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
 <History className="w-6 h-6 text-amber-400" />
 </div>
 <div>
 <h3 className="text-2xl font-semibold text-white uppercase tracking-tight">Security Audit Log</h3>
 <p className="text-xs text-white/20 font-semibold uppercase tracking-[0.3em] mt-1">Immutable event ledger — last 30 days</p>
 </div>
 </div>

 {/* Filter pills */}
 <div className="flex items-center gap-2 p-1 bg-white/[0.02] border border-white/5 rounded-[14px]">
 {(['all', 'warning', 'critical'] as const).map(f => (
 <button
 key={f}
 onClick={() => setAuditFilter(f)}
 className={cn(
"px-4 py-2 rounded-[10px] text-xs font-semibold uppercase tracking-widest transition-all relative",
 auditFilter === f ?"text-white" :"text-white/30 hover:text-white/60"
 )}
 >
 <span className="relative z-10">{f}</span>
 {auditFilter === f && (
 <motion.div layoutId="auditFilter" className="absolute inset-0 bg-white/10 border border-white/15 rounded-[10px]" transition={{ type: 'spring', bounce: 0.2, duration: 0.4 }} />
 )}
 </button>
 ))}
 </div>
 </div>

 <div className="rounded-[28px] bg-[#030303] border border-white/5 overflow-hidden">
 {/* Table header */}
 <div className="grid grid-cols-[1fr_150px_120px_80px] gap-4 px-6 py-4 border-b border-white/5 bg-white/[0.01]">
 {['Event', 'Location', 'Time', 'Level'].map(h => (
 <span key={h} className="text-xs font-semibold text-white/20 uppercase tracking-[0.3em]">{h}</span>
 ))}
 </div>

 <AnimatePresence>
 {filteredEvents.map((evt, idx) => {
 const styles = LEVEL_STYLES[evt.level as keyof typeof LEVEL_STYLES];
 return (
 <motion.div
 key={evt.id}
 initial={{ opacity: 0 }}
 animate={{ opacity: 1 }}
 exit={{ opacity: 0 }}
 transition={{ delay: idx * 0.03 }}
 className={cn(
"grid grid-cols-[1fr_150px_120px_80px] gap-4 px-6 py-4 border-b border-white/[0.03] items-center hover:bg-white/[0.02] transition-colors group/row",
 styles.glow
 )}
 >
 {/* Event */}
 <div className="flex items-center gap-4 min-w-0">
 <div className={cn("w-2 h-2 rounded-full shrink-0", styles.dot)} />
 <div className="min-w-0">
 <span className="text-xs font-semibold text-white uppercase tracking-tight font-jet-mono block truncate">{evt.action}</span>
 <span className="text-xs text-white/20 font-semibold uppercase tracking-widest truncate block">{evt.device} · {evt.ip}</span>
 </div>
 </div>

 {/* Location */}
 <div className="flex items-center gap-2">
 <MapPin className="w-3 h-3 text-white/20 shrink-0" />
 <span className="text-xs text-white/40 font-semibold uppercase tracking-widest truncate">{evt.location}</span>
 </div>

 {/* Time */}
 <div className="flex items-center gap-2">
 <Clock className="w-3 h-3 text-white/20 shrink-0" />
 <span className="text-xs text-white/40 font-semibold uppercase tracking-widest truncate">{evt.ts}</span>
 </div>

 {/* Level badge */}
 <div>
 <span className={cn("px-2.5 py-1 rounded-md text-xs font-semibold uppercase tracking-widest border", styles.badge)}>
 {evt.level}
 </span>
 </div>
 </motion.div>
 );
 })}
 </AnimatePresence>

 {filteredEvents.length === 0 && (
 <div className="py-16 flex flex-col items-center gap-4 text-center">
 <Shield className="w-10 h-10 text-white/5" />
 <p className="text-xs text-white/20 font-semibold uppercase tracking-widest">No events match this filter</p>
 </div>
 )}

 <div className="px-6 py-4 flex items-center justify-between">
 <span className="text-xs text-white/20 font-semibold uppercase tracking-widest font-jet-mono">{filteredEvents.length} events displayed</span>
 <button className="flex items-center gap-2 text-xs font-semibold text-p/60 hover:text-p uppercase tracking-widest transition-colors">
 Export Full Ledger <ChevronRight className="w-3.5 h-3.5" />
 </button>
 </div>
 </div>
 </section>

 {/* ── DANGER ZONE ── */}
 <section className="pt-8 border-t border-rose-500/20">
 <div className="relative group">
 <div className="absolute -inset-px bg-rose-500/10 rounded-[32px] blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
 <div className="relative p-8 rounded-[28px] border border-rose-500/20 bg-rose-500/[0.01] overflow-hidden">
 <div className="absolute top-0 right-0 w-48 h-48 bg-rose-500/5 rounded-full blur-[80px] -mr-24 -mt-24 pointer-events-none" />
 <div className="flex flex-col lg:flex-row items-center justify-between gap-10 relative z-10">
 <div className="space-y-4">
 <div className="flex items-center gap-4">
 <AlertTriangle className="w-7 h-7 text-rose-500 animate-pulse" />
 <h4 className="text-xl font-semibold text-white uppercase tracking-tight">Decommission Protocol</h4>
 </div>
 <p className="text-xs text-white/30 font-semibold uppercase tracking-[0.2em] leading-relaxed max-w-lg">
 This will permanently terminate your institutional access, purge all algorithmic signatures, and wipe your Risk DNA history. This action is irreversible.
 </p>
 </div>
 <Button
 variant="ghost"
 onClick={() => setIsDeleteModalOpen(true)}
 className="shrink-0 h-14 px-10 rounded-[18px] border-2 border-rose-500/30 text-rose-400 hover:bg-rose-500 hover:text-white font-semibold uppercase tracking-[0.3em] text-sm shadow-[0_0_30px_rgba(239,68,68,0.05)] transition-all"
 >
 Execute Purge
 </Button>
 </div>
 </div>
 </div>
 </section>

 {/* ── 2FA SETUP MODAL ── */}
 <AnimatePresence>
 {is2faOpen && (
 <motion.div
 initial={{ opacity: 0 }}
 animate={{ opacity: 1 }}
 exit={{ opacity: 0 }}
 className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/80 backdrop-blur-xl"
 >
 <motion.div
 initial={{ scale: 0.95, y: 20 }}
 animate={{ scale: 1, y: 0 }}
 exit={{ scale: 0.95 }}
 className="w-full max-w-md rounded-[32px] bg-[#080808] border border-white/10 p-8 space-y-8 shadow-[0_0_80px_rgba(0,0,0,1)] relative overflow-hidden"
 >
 <div className="absolute inset-0 bg-gradient-to-br from-p/5 to-transparent pointer-events-none" />

 <div className="relative z-10 space-y-2">
 <div className="flex items-center gap-3 text-p text-xs font-semibold uppercase tracking-[0.3em] font-jet-mono">
 <Fingerprint className="w-4 h-4" />
 <span>Cryptographic Verification</span>
 </div>
 <h3 className="text-2xl font-semibold text-white uppercase tracking-tight">Enable 2FA Protocol</h3>
 </div>

 <div className="relative z-10 space-y-6">
 {/* Fake QR Code */}
 <div className="flex items-center justify-center">
 <div className="p-4 bg-white rounded-[16px] shadow-[0_0_40px_rgba(255,255,255,0.1)]">
 <div className="w-32 h-32 grid grid-cols-8 gap-0.5">
 {Array.from({ length: 64 }).map((_, i) => (
 <div key={i} className={cn("rounded-[1px]", (i % 3 === 0 || i % 7 === 0) ?"bg-black" :"bg-white")} />
 ))}
 </div>
 </div>
 </div>
 <p className="text-center text-xs text-white/30 font-semibold uppercase tracking-[0.3em]">
 Scan with Google Authenticator, Authy, or ProfyKey
 </p>

 <div className="space-y-3">
 <label className="text-xs font-semibold text-white/30 uppercase tracking-[0.3em]">Enter 6-digit OTP</label>
 <input
 value={otpInput}
 onChange={e => setOtpInput(e.target.value.replace(/\D/g, '').slice(0, 6))}
 placeholder="000000"
 className="w-full h-14 bg-white/[0.03] border border-white/10 rounded-[16px] px-5 text-2xl font-semibold text-white text-center tracking-[0.8em] outline-none focus:border-p/50 transition-all font-jet-mono placeholder:tracking-widest placeholder:text-white/10"
 />
 </div>
 </div>

 <div className="flex gap-4 relative z-10">
 <Button onClick={() => setIs2faOpen(false)} className="flex-1 h-12 bg-white/5 border border-white/10 hover:bg-white/10 text-white text-sm font-semibold uppercase tracking-widest rounded-[14px]">
 Cancel
 </Button>
 <Button
 onClick={handleVerify2fa}
 disabled={otpInput.length !== 6}
 className="flex-[2] h-12 bg-white text-black hover:bg-white/90 text-sm font-semibold uppercase tracking-[0.2em] rounded-[14px] disabled:opacity-30"
 >
 Verify & Activate
 </Button>
 </div>
 </motion.div>
 </motion.div>
 )}

 {isDeleteModalOpen && (
  <motion.div
  initial={{ opacity: 0 }}
  animate={{ opacity: 1 }}
  exit={{ opacity: 0 }}
  className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/80 backdrop-blur-xl"
  >
  <motion.div
  initial={{ scale: 0.95, y: 20 }}
  animate={{ scale: 1, y: 0 }}
  exit={{ scale: 0.95 }}
  className="w-full max-w-md rounded-[32px] bg-[#080808] border border-rose-500/30 p-8 space-y-8 shadow-[0_0_80px_rgba(239,68,68,0.2)] relative overflow-hidden"
  >
  <div className="absolute inset-0 bg-gradient-to-br from-rose-500/5 to-transparent pointer-events-none" />

  <div className="relative z-10 space-y-2">
  <div className="flex items-center gap-3 text-rose-500 text-xs font-semibold uppercase tracking-[0.3em] font-jet-mono">
  <AlertTriangle className="w-4 h-4 animate-pulse" />
  <span>Critical Warning</span>
  </div>
  <h3 className="text-2xl font-semibold text-white uppercase tracking-tight">Decommission Node</h3>
  </div>

  <div className="relative z-10 space-y-6">
  <p className="text-sm text-white/60 font-semibold uppercase tracking-widest">
  Type <strong className="text-rose-500">DELETE</strong> to confirm permanent destruction.
  </p>

  <div className="space-y-3">
  <input
  value={deleteConfirm}
  onChange={e => setDeleteConfirm(e.target.value)}
  placeholder="DELETE"
  className="w-full h-14 bg-white/[0.03] border border-white/10 rounded-[16px] px-5 text-lg font-semibold text-white tracking-[0.4em] outline-none focus:border-rose-500/50 transition-all font-jet-mono"
  />
  </div>
  </div>

  <div className="flex gap-4 relative z-10">
  <Button onClick={() => setIsDeleteModalOpen(false)} className="flex-1 h-12 bg-white/5 border border-white/10 hover:bg-white/10 text-white text-sm font-semibold uppercase tracking-widest rounded-[14px]">
  Abort
  </Button>
  <Button
  onClick={handleDeleteAccount}
  disabled={deleteConfirm !== 'DELETE'}
  className="flex-[2] h-12 bg-rose-500 text-white hover:bg-rose-600 text-sm font-semibold uppercase tracking-[0.2em] rounded-[14px] disabled:opacity-30"
  >
  Execute Purge
  </Button>
  </div>
  </motion.div>
  </motion.div>
  )}
 </AnimatePresence>
 </div>
 );
}
