'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { 
 Bell, 
 Zap, 
 Shield, 
 Activity, 
 Smartphone, 
 Mail, 
 MessageSquare,
 Network,
 Cpu,
 RefreshCcw,
 Volume2,
 VolumeX,
 CheckCircle2,
 AlertTriangle,
 ArrowRight
} from '@/components/ui/icons';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

const NOTIF_CHANNELS = [
 { id: 'ch_app', icon: Smartphone, label: 'Platform HUD', desc: 'In-app terminal overlays', active: true },
 { id: 'ch_mail', icon: Mail, label: 'Neural Relay (Email)', desc: 'Periodic protocol summaries', active: true },
 { id: 'ch_tg', icon: MessageSquare, label: 'Fast Telegram', desc: 'Encrypted instant signaling', active: false },
];

const NOTIF_TYPES = [
 { 
 id: 'type_sig', 
 icon: Zap, 
 label: 'Alpha Signal Alerts', 
 desc: 'Instant relay when strategies match deployment criteria.',
 severity: 'critical',
 channels: ['app', 'mail', 'tg']
 },
 { 
 id: 'type_exe', 
 icon: Activity, 
 label: 'Execution Status', 
 desc: 'Real-time telemetry on active node entry/exit events.',
 severity: 'high',
 channels: ['app', 'tg']
 },
 { 
 id: 'type_sys', 
 icon: Shield, 
 label: 'Security & Auth', 
 desc: 'Critical biometric handshake and access protocols.',
 severity: 'critical',
 channels: ['all']
 },
 { 
 id: 'type_liq', 
 icon: Network, 
 label: 'Liquidity Events', 
 desc: 'Significant slippage or depth-of-market shifts.',
 severity: 'medium',
 channels: ['app']
 }
];

const Switch = ({ checked, onChange, color = 'p' }: { checked: boolean; onChange: () => void; color?: 'p' | 'rose' | 'cyan' }) => (
 <button
 onClick={onChange}
 className={cn(
"w-12 h-6 rounded-full transition-all p-1 flex items-center relative",
 checked
	? color === 'rose'
		? 'bg-rose-500 border border-rose-400/40 justify-end'
		: color === 'cyan'
			? 'bg-cyan-500 border border-cyan-400/40 justify-end'
			: 'bg-p border border-p/40 justify-end'
	: "bg-white/5 border border-white/10 justify-start"
 )}
 >
 <motion.div layout className={cn("h-full aspect-square rounded-full", checked ?"bg-white shadow-[0_0_10px_white]" :"bg-white/20")} />
 </button>
);

export default function NotificationsPage() {
 const [channels, setChannels] = React.useState<Record<string, boolean>>({
 ch_app: true,
 ch_mail: true,
 ch_tg: false,
 });

 const [activeTab, setActiveTab] = React.useState('relay');
 const [soundMode, setSoundMode] = React.useState<'Muted' | 'Ambient' | 'High Alert'>('Ambient');
 const [isDirty, setIsDirty] = React.useState(false);
 const [notifMatrix, setNotifMatrix] = React.useState<Record<string, { App: boolean; Relay: boolean; Push: boolean }>>({
  type_sig: { App: true, Relay: true, Push: true },
  type_exe: { App: true, Relay: true, Push: false },
  type_sys: { App: true, Relay: true, Push: true },
  type_liq: { App: true, Relay: false, Push: false },
 });

 const toggleMatrix = (typeId: string, channel: 'App' | 'Relay' | 'Push') => {
  const typeLabel = NOTIF_TYPES.find((t) => t.id === typeId)?.label || 'Alert route';
  const nextEnabled = !notifMatrix[typeId]?.[channel];
  setNotifMatrix((prev) => ({
   ...prev,
   [typeId]: {
	...prev[typeId],
	[channel]: !prev[typeId]?.[channel],
   },
  }));
  setIsDirty(true);
  toast.message(`${typeLabel}: ${channel} ${nextEnabled ? 'enabled' : 'disabled'}`);
 };

 const handleChannelToggle = (channelId: string) => {
  const next = !channels[channelId];
  const channelLabel = NOTIF_CHANNELS.find((ch) => ch.id === channelId)?.label || channelId;
  setChannels((prev) => ({ ...prev, [channelId]: next }));
  setIsDirty(true);
  toast.message(`${channelLabel} ${next ? 'enabled' : 'disabled'}`);
 };

 const handleSoundModeChange = (mode: 'Muted' | 'Ambient' | 'High Alert') => {
  setSoundMode(mode);
  setIsDirty(true);
  toast.message(`Sound mode set to ${mode}`);
 };

 const savePreferences = () => {
  localStorage.setItem('settings.notifications.channels', JSON.stringify(channels));
  localStorage.setItem('settings.notifications.matrix', JSON.stringify(notifMatrix));
  localStorage.setItem('settings.notifications.soundMode', soundMode);
  setIsDirty(false);
  toast.success('Notification preferences saved');
 };

 React.useEffect(() => {
  try {
   const storedChannels = localStorage.getItem('settings.notifications.channels');
   const storedMatrix = localStorage.getItem('settings.notifications.matrix');
   const storedSound = localStorage.getItem('settings.notifications.soundMode');
   if (storedChannels) setChannels(JSON.parse(storedChannels));
   if (storedMatrix) setNotifMatrix(JSON.parse(storedMatrix));
   if (storedSound === 'Muted' || storedSound === 'Ambient' || storedSound === 'High Alert') setSoundMode(storedSound);
   setIsDirty(false);
  } catch {
   // Ignore malformed values.
  }
 }, []);

 return (
 <div className="space-y-16 pb-20">
 {/* ── ALERTS HUD ── */}
 <section className="space-y-10">
 <div className="flex items-center justify-between">
 <div className="flex items-center gap-5">
 <div className="w-14 h-14 rounded-[22px] bg-p/10 border border-p/20 flex items-center justify-center shadow-2xl">
 <Bell className="w-7 h-7 text-p animate-pulse" />
 </div>
 <div className="space-y-1">
 <h3 className="text-3xl font-semibold text-white uppercase tracking-tight">Notifications</h3>
 <p className="text-xs text-p/60 font-semibold uppercase tracking-[0.3em]">Configure real-time telemetry relay channels</p>
 </div>
 </div>
 <div className="hidden md:flex items-center gap-4">
 <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/20">
 <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
 <span className="text-xs font-semibold text-emerald-400 uppercase tracking-widest">Relay Active</span>
 </div>
 <div className={cn("flex items-center gap-2 px-4 py-2 rounded-full border", isDirty ? "bg-amber-500/10 border-amber-500/20" : "bg-cyan-500/10 border-cyan-500/20")}>
 <div className={cn("w-1.5 h-1.5 rounded-full", isDirty ? "bg-amber-400" : "bg-cyan-400")} />
 <span className={cn("text-xs font-semibold uppercase tracking-widest", isDirty ? "text-amber-300" : "text-cyan-300")}>
 {isDirty ? 'Unsaved Changes' : 'Matrix Synced'}
 </span>
 </div>
 </div>
 </div>

 {/* Channels Grid */}
 <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
 {NOTIF_CHANNELS.map((ch) => (
 <div 
 key={ch.id}
 className={cn(
"p-8 rounded-4xl border transition-all group relative overflow-hidden",
 channels[ch.id] 
 ?"bg-p/3 border-p/20 shadow-[0_20px_40px_rgba(99,102,241,0.05)]" 
 :"bg-white/1 border-white/5 opacity-50 grayscale hover:grayscale-0 hover:opacity-100"
 )}
 >
 {channels[ch.id] && (
 <div className="absolute top-0 right-0 w-32 h-32 bg-p/5 rounded-full blur-[60px] -mr-16 -mt-16" />
 )}
 
 <div className="flex items-center justify-between mb-8 relative z-10">
 <div className={cn(
"w-12 h-12 rounded-2xl flex items-center justify-center border",
 channels[ch.id] ?"bg-p/10 border-p/20" :"bg-white/5 border-white/10"
 )}>
 <ch.icon className={cn("w-6 h-6", channels[ch.id] ?"text-p" :"text-white/20")} />
 </div>
 <Switch 
 checked={channels[ch.id]} 
 onChange={() => handleChannelToggle(ch.id)} 
 />
 </div>
 
 <div className="space-y-1 relative z-10">
 <h4 className="text-sm font-semibold text-white uppercase tracking-widest">{ch.label}</h4>
 <p className="text-xs text-white/30 font-semibold uppercase tracking-widest">{ch.desc}</p>
 </div>
 </div>
 ))}
 </div>
 </section>

 {/* ── EVENT MATRIX ── */}
 <section className="space-y-10">
 <div className="flex items-center gap-6">
 <div className="w-14 h-14 rounded-[22px] bg-white/5 border border-white/10 flex items-center justify-center">
 <Activity className="w-7 h-7 text-white/40" />
 </div>
 <h4 className="text-2xl font-semibold text-white uppercase tracking-tight">Signal Hierarchy</h4>
 <div className="h-px flex-1 bg-white/5" />
 </div>

 <div className="grid grid-cols-1 gap-4">
 {NOTIF_TYPES.map((type, idx) => (
 <motion.div
 key={type.id}
 initial={{ opacity: 0, y: 10 }}
 animate={{ opacity: 1, y: 0 }}
 transition={{ delay: idx * 0.1 }}
 className="flex flex-col lg:flex-row items-center justify-between p-8 rounded-[36px] bg-white/1 border border-white/5 hover:border-white/15 hover:bg-white/2 transition-all group"
 >
 <div className="flex items-center gap-8 flex-1">
 <div className={cn(
"w-16 h-16 rounded-3xl flex items-center justify-center border transition-all duration-500",
 type.severity === 'critical' ?"bg-rose-500/10 border-rose-500/20 text-rose-500" :
 type.severity === 'high' ?"bg-p/10 border-p/20 text-p" :
"bg-cyan-500/10 border-cyan-500/20 text-cyan-500"
 )}>
 <type.icon className="w-8 h-8" />
 </div>
 <div>
 <div className="flex items-center gap-3">
 <h5 className="text-xl font-semibold text-white uppercase tracking-tight">{type.label}</h5>
 <span className={cn(
"px-2 py-0.5 rounded-md text-xs font-semibold uppercase tracking-[0.2em] border",
 type.severity === 'critical' ?"bg-rose-500/10 text-rose-500 border-rose-500/20" :
 type.severity === 'high' ?"bg-p/10 text-p border-p/20" :
"bg-cyan-500/10 text-cyan-400 border-cyan-500/20"
 )}>
 {type.severity}
 </span>
 </div>
 <p className="text-sm text-white/30 font-semibold uppercase tracking-[0.2em] mt-2 max-w-md">
 {type.desc}
 </p>
 </div>
 </div>

 <div className="flex items-center gap-12 mt-8 lg:mt-0">
 <div className="flex items-center gap-8">
 {['App', 'Relay', 'Push'].map((label) => (
 <div key={label} className="flex flex-col items-center gap-3">
 <span className="text-xs font-semibold text-white/20 uppercase tracking-[0.3em]">{label}</span>
 <Switch checked={!!notifMatrix[type.id]?.[label as 'App' | 'Relay' | 'Push']} onChange={() => toggleMatrix(type.id, label as 'App' | 'Relay' | 'Push')} color={type.severity === 'critical' ? 'rose' : type.severity === 'medium' ? 'cyan' : 'p'} />
 </div>
 ))}
 </div>
 <div className="w-px h-12 bg-white/5 hidden lg:block" />
 <button onClick={() => toast.message(`${type.label} route tuning opened`)} className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center text-white/20 hover:bg-white/10 hover:text-white transition-all">
 <ArrowRight className="w-6 h-6" />
 </button>
 </div>
 </motion.div>
 ))}
 </div>
 </section>

 {/* ── SOUNDSCAPE & HAPTICS ── */}
 <section className="space-y-10">
 <div className="flex items-center gap-6">
 <div className="w-14 h-14 rounded-[22px] bg-white/5 border border-white/10 flex items-center justify-center">
 <Volume2 className="w-7 h-7 text-white/40" />
 </div>
 <h4 className="text-2xl font-semibold text-white uppercase tracking-tight">Terminal Soundscape</h4>
 <div className="h-px flex-1 bg-white/5" />
 </div>

 <div className="p-10 rounded-[40px] bg-linear-to-br from-[#0c0c0c] to-[#050505] border border-white/5 relative overflow-hidden">
 <div className="absolute top-0 right-0 w-96 h-96 bg-p/5 rounded-full blur-[120px] -mr-48 -mt-48" />
 <div className="flex flex-col lg:flex-row items-center justify-between gap-12 relative z-10">
 <div className="space-y-4">
 <h5 className="text-xl font-semibold text-white uppercase tracking-tight">Auditory Feedback System</h5>
 <p className="text-xs text-white/30 font-semibold uppercase tracking-[0.2em] leading-relaxed max-w-lg">
 High-fidelity synthesized audio cues for critical market events. Designed for situational awareness without cognitive fatigue.
 </p>
 </div>
 <div className="flex items-center gap-4">
 {['Muted', 'Ambient', 'High Alert'].map((mode) => (
 <button 
 key={mode}
 onClick={() => handleSoundModeChange(mode as 'Muted' | 'Ambient' | 'High Alert')}
 className={cn(
"px-8 py-4 rounded-[20px] text-xs font-semibold uppercase tracking-widest border transition-all",
 soundMode === mode ?"bg-p text-white border-p shadow-[0_0_30px_rgba(99,102,241,0.3)]" :"bg-white/5 border-white/5 text-white/20 hover:bg-white/10"
 )}
 >
 {mode}
 </button>
 ))}
 </div>
 </div>
 </div>
 </section>

 <div className="flex justify-end">
   <Button disabled={!isDirty} onClick={savePreferences} className="h-12 px-8 rounded-2xl bg-white text-black hover:bg-white/90 uppercase tracking-[0.2em] text-xs font-semibold disabled:opacity-40 disabled:cursor-not-allowed">
    {isDirty ? 'Save Alert Matrix' : 'Matrix Saved'}
  </Button>
 </div>
 </div>
 );
}
