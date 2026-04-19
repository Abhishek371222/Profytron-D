'use client';

import React, { useRef } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { 
  Upload, 
  CheckCircle, 
  Globe, 
  Twitter, 
  Linkedin, 
  MessageSquare,
  Info,
  Shield,
  Zap,
  Activity,
  Cpu,
  Mail,
  User,
  Fingerprint,
  ChevronRight,
  Monitor,
  RotateCcw,
  Sparkles,
  Search,
  Box,
  Terminal,
  ShieldCheck,
  AlertCircle
} from '@/components/ui/icons';
import { Button } from '@/components/ui/button';
import { Magnetic } from '@/components/ui/Interactions';
import { useCurrentUser } from '@/lib/hooks/useCurrentUser';
import { usersApi } from '@/lib/api/users';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

const Switch = ({ checked, onChange, label, desc }: { checked: boolean; onChange: (v: boolean) => void; label: string; desc: string }) => (
  <div className="flex items-center justify-between p-8 rounded-[40px] bg-white/1 border border-white/5 hover:border-primary/20 transition-all duration-700 group relative overflow-hidden">
    <div className="absolute inset-0 bg-linear-to-r from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
    <div className="space-y-1 relative z-10">
      <h4 className="text-[14px] font-semibold text-white uppercase tracking-[0.2em] group-hover:text-primary transition-colors">{label}</h4>
      <p className="text-[11px] text-white/20 font-bold uppercase tracking-[0.3em] font-mono">{desc}</p>
    </div>
    <button 
      onClick={() => onChange(!checked)}
      className={cn(
        "w-16 h-8 rounded-full relative transition-all duration-500 p-1 border overflow-hidden flex items-center",
        checked
          ? "bg-primary border-primary/40 shadow-[0_0_20px_rgba(99,102,241,0.5)] justify-end"
          : "bg-white/5 border-white/10 justify-start"
      )}
    >
      <div className="absolute inset-0 bg-scanlines opacity-10" />
      <motion.div 
        layout
        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
        className={cn(
          "w-6 h-6 rounded-full shadow-lg transition-colors relative z-10",
          checked ? "bg-white" : "bg-white/20"
        )} 
      />
    </button>
  </div>
);

export default function ProfileSettingsPage() {
  const router = useRouter();
  const { data: user, isLoading } = useCurrentUser();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isDirty, setIsDirty] = React.useState(false);
  const [isSaving, setIsSaving] = React.useState(false);

  // Form State
  const [fullName, setFullName] = React.useState('');
  const [username, setUsername] = React.useState('');
  const [bio, setBio] = React.useState('');
  const [avatarPreview, setAvatarPreview] = React.useState('');

  React.useEffect(() => {
    if (user && !isDirty) {
      setFullName(user.fullName || '');
      setUsername(user.username || '');
      setBio(user.bio || '');
      setAvatarPreview(user.avatarUrl || '');
    }
  }, [user, isDirty]);

  const [demoMode, setDemoMode] = React.useState(false);
  const [volatilitySync, setVolatilitySync] = React.useState(true);
  const [latencySim, setLatencySim] = React.useState(false);
  const [injectionPower, setInjectionPower] = React.useState(2.4);

  const handleDemoModeChange = (next: boolean) => {
    setDemoMode(next);
    toast.message(next ? 'Simulation mode enabled' : 'Simulation mode disabled');
  };

  const handleVolatilitySyncChange = (next: boolean) => {
    setVolatilitySync(next);
    toast.message(next ? 'Volatility pulse enabled' : 'Volatility pulse disabled');
  };

  const handleLatencySimChange = (next: boolean) => {
    setLatencySim(next);
    toast.message(next ? 'Signal delay enabled' : 'Signal delay disabled');
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await usersApi.updateProfile({ fullName, username, bio });
      await queryClient.invalidateQueries({ queryKey: ['currentUser'] });
      setIsDirty(false);
      toast.success('Profile synchronized');
    } catch (e) {
      console.error('Failed to update profile', e);
      toast.error('Profile sync failed');
    } finally {
      setIsSaving(false);
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const previewUrl = URL.createObjectURL(file);
      setAvatarPreview(previewUrl);

      const res = await usersApi.uploadAvatar(file);
      setAvatarPreview(res.avatarUrl); // Set permanent URL
      await queryClient.invalidateQueries({ queryKey: ['currentUser'] });
      toast.success('Avatar updated');
    } catch (e) {
      console.error('Upload failed', e);
      if (user?.avatarUrl) setAvatarPreview(user.avatarUrl); // Revert
      toast.error('Avatar upload failed');
    }
  };

  const handleResetChanges = () => {
    if (!user) return;
    setFullName(user.fullName || '');
    setUsername(user.username || '');
    setBio(user.bio || '');
    setAvatarPreview(user.avatarUrl || '');
    setIsDirty(false);
    toast.message('Changes reverted');
  };

  if (isLoading) return <div className="text-white">Loading profile...</div>;

  return (
    <div className="grid grid-cols-1 2xl:grid-cols-[minmax(0,1fr)_340px] gap-8 2xl:gap-10 items-start">
      <div className="space-y-14 xl:space-y-18 2xl:space-y-20 min-w-0">
        {/* IDENTITY BIO-MODULE */}
        <div className="flex flex-col lg:flex-row items-center lg:items-start gap-8 xl:gap-12 group/identity min-w-0">
          <div className="relative group/avatar">
            <input 
              type="file" 
              className="hidden" 
              ref={fileInputRef} 
              onChange={handleAvatarUpload} 
              accept="image/*"
            />
            {/* Holographic Back Glow */}
            <div className="absolute -inset-10 bg-primary/10 rounded-full blur-[80px] opacity-0 group-hover/identity:opacity-100 transition-opacity duration-1000 animate-pulse" />
            
            <div className="w-56 h-56 rounded-full p-[2px] bg-linear-to-tr from-primary via-indigo-500 to-cyan-400 relative overflow-hidden shadow-2xl">
              <div className="absolute inset-0 animate-scanline bg-gradient-to-b from-transparent via-white/20 to-transparent h-[200%] pointer-events-none z-10" />
              <div className="w-full h-full rounded-full bg-[#08080a] flex items-center justify-center border border-white/5 group-hover/avatar:border-white/20 transition-all overflow-hidden relative">
                <div className="absolute inset-0 bg-primary/5 opacity-50 transition-opacity" />
                {avatarPreview ? (
                  <img 
                    src={avatarPreview} 
                    alt="Profile" 
                    className="w-full h-full object-cover scale-110 group-hover/avatar:scale-125 transition-transform duration-1000"
                  />
                ) : (
                   <span className="text-4xl text-primary font-bold">{fullName?.charAt(0) || 'U'}</span>
                )}
                
                {/* ID Scan Effect */}
                <div className="absolute inset-0 bg-primary/20 opacity-0 group-hover/avatar:opacity-100 transition-opacity pointer-events-none flex flex-col items-center justify-center backdrop-blur-sm z-20">
                  <Fingerprint className="w-20 h-20 text-white shadow-[0_0_30px_#6366f1] animate-pulse" />
                  <span className="text-[10px] font-bold text-white uppercase tracking-[0.5em] mt-4">ID_PROT_PASS</span>
                </div>
              </div>
            </div>
            
            <Magnetic strength={0.3}>
              <button 
                onClick={() => fileInputRef.current?.click()}
                className="absolute bottom-4 right-4 w-14 h-14 rounded-[22px] bg-primary border-4 border-[#08080a] flex items-center justify-center text-white shadow-[0_20px_40px_rgba(99,102,241,0.4)] hover:scale-110 active:scale-95 transition-all z-30"
              >
                <Upload className="w-6 h-6" />
              </button>
            </Magnetic>
          </div>
          
          <div className="space-y-6 flex-1 min-w-0 text-center lg:text-left">
            <div className="space-y-2">
              <div className="flex items-center justify-center lg:justify-start gap-4">
                <h3 className="text-3xl xl:text-4xl 2xl:text-5xl font-semibold text-white uppercase tracking-tighter leading-none break-words">{fullName || 'Network Operative'}</h3>
                <div className="px-4 py-1.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center gap-2.5 shadow-lg">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest">Neural_Verified</span>
                </div>
              </div>
              <p className="text-[11px] text-white/20 font-bold uppercase tracking-[0.6em] font-mono">NODE_HASH: PX_{user?.id?.substring(0,8)}</p>
            </div>

            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-6 xl:gap-12 pt-4">
              <div className="flex items-center gap-5">
                <div className="w-14 h-14 rounded-2xl bg-white/3 border border-white/5 flex items-center justify-center shadow-inner group-hover/identity:border-primary/20 transition-colors">
                  <Zap className="w-7 h-7 text-primary drop-shadow-[0_0_10px_#6366f1]" />
                </div>
                <div className="flex flex-col text-left">
                  <span className="text-[10px] font-bold text-white/30 uppercase tracking-[0.3em]">Access Level</span>
                  <span className="text-sm font-semibold text-white tracking-[0.2em] uppercase">{user?.subscriptionTier || 'Apex_Prime_Plus'}</span>
                </div>
              </div>
              <div className="w-px h-12 bg-white/5" />
              <div className="flex flex-col text-left">
                <span className="text-[10px] font-bold text-white/30 uppercase tracking-[0.4em]">Current Epoch</span>
                <span className="text-sm font-semibold text-primary tracking-widest uppercase font-jet-mono transition-all group-hover/identity:translate-x-1">X8-28_CYBORG</span>
              </div>
            </div>
          </div>
        </div>

        {/* SIMULATION CORE MODULE */}
        <section className="space-y-12 relative">
          <div className="flex items-center gap-8">
            <div className="w-16 h-16 rounded-[28px] bg-primary/10 border border-primary/20 flex items-center justify-center shadow-[0_20px_40px_rgba(99,102,241,0.1)] group">
              <Monitor className="w-8 h-8 text-primary group-hover:scale-110 transition-transform" />
            </div>
            <div className="space-y-1">
              <h4 className="text-3xl font-semibold text-white uppercase tracking-tight">Fabrication Core</h4>
              <p className="text-[10px] text-primary/40 font-bold uppercase tracking-[0.4em]">Configure Sandbox Execution and Neural Mocks</p>
            </div>
            <div className="h-px flex-1 bg-linear-to-r from-white/10 to-transparent" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <Switch 
              checked={demoMode} 
              onChange={handleDemoModeChange} 
              label="Simulation Mode" 
              desc="Redirect transmissions to virtualized shadow networks" 
            />
            <Switch 
              checked={volatilitySync} 
              onChange={handleVolatilitySyncChange} 
              label="Volatility Pulse" 
              desc="Inject high-fidelity market stress vectors" 
            />
            <Switch 
              checked={latencySim} 
              onChange={handleLatencySimChange} 
              label="Signal Delay" 
              desc="Induce institutional relay lag [60ms - 240ms]" 
            />
            <div className="p-8 rounded-[40px] bg-primary/2 border border-primary/10 flex items-center justify-between group hover:border-primary/40 transition-all duration-700 relative overflow-hidden shadow-inner">
               <div className="absolute inset-0 bg-scanlines opacity-[0.03]" />
               <div className="space-y-1 relative z-10">
                <h4 className="text-[14px] font-semibold text-primary uppercase tracking-widest">Injection Power</h4>
                <p className="text-[10px] text-white/20 font-bold uppercase tracking-[0.3em] font-mono">Scaling Mock Signal Density</p>
              </div>
              <div className="flex items-center gap-6 relative z-10">
                <span className="text-2xl font-bold text-white font-jet-mono tracking-tighter">X{injectionPower.toFixed(1)}</span>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    onClick={() => setInjectionPower((v) => Math.max(1.0, Number((v - 0.1).toFixed(1))))}
                    className="w-12 h-12 rounded-2xl bg-white/3 border border-white/5 hover:bg-primary hover:text-white transition-all text-white/20"
                  >
                    -
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={() => setInjectionPower((v) => Math.min(5.0, Number((v + 0.1).toFixed(1))))}
                    className="w-12 h-12 rounded-2xl bg-white/3 border border-white/5 hover:bg-primary hover:text-white transition-all text-white/20 border-b-4 border-b-primary/30"
                  >
                    +
                  </Button>
                </div>
              </div>
            </div>
          </div>

          <AnimatePresence>
            {demoMode && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                transition={{ duration: 0.6, ease: [0.23, 1, 0.32, 1] }}
              >
                <div className="p-10 rounded-[48px] bg-amber-500/2 border-2 border-amber-500/20 flex items-center gap-10 relative overflow-hidden shadow-2xl">
                  <div className="absolute inset-0 bg-scanlines opacity-[0.05]" />
                  <div className="absolute top-0 right-0 w-48 h-48 bg-amber-500/10 rounded-full blur-[80px] -mr-24 -mt-24 animate-pulse" />
                  <div className="w-16 h-16 rounded-3xl bg-amber-500/10 flex items-center justify-center border border-amber-500/20 flex-shrink-0 animate-pulse shadow-[0_0_20px_rgba(245,158,11,0.2)]">
                    <AlertCircle className="w-8 h-8 text-amber-500" />
                  </div>
                  <div className="space-y-2">
                    <h5 className="text-xl font-semibold text-amber-500 uppercase tracking-tight">Virtualization_Active</h5>
                    <p className="text-[11px] text-white/40 font-bold uppercase tracking-[0.4em] leading-[1.8]">Core Protocol redirected to shadow subnet. All executions are simulated. Financial impacts are virtual. High-fidelity verification layer is ENABLED.</p>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </section>

        {/* IDENTITY REGISTRY SECTION */}
        <section className="space-y-12">
          <div className="flex items-center gap-8">
            <div className="w-16 h-16 rounded-[28px] bg-white/3 border border-white/10 flex items-center justify-center shadow-2xl">
              <Fingerprint className="w-8 h-8 text-white/20" />
            </div>
            <h4 className="text-3xl font-semibold text-white uppercase tracking-tight">Identity Registry</h4>
            <div className="h-px flex-1 bg-linear-to-r from-white/10 to-transparent" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            <div className="space-y-4 group">
              <label className="text-[10px] font-bold text-white/20 uppercase tracking-[0.6em] ml-4 group-focus-within:text-primary transition-colors">Physical Alias</label>
              <div className="relative">
                <div className="absolute -inset-0.5 bg-linear-to-br from-primary/20 to-transparent rounded-4xl opacity-0 group-focus-within:opacity-100 transition-opacity" />
                <input 
                  value={fullName}
                  onChange={(e) => { setFullName(e.target.value); setIsDirty(true); }}
                  className="w-full h-20 bg-[#08080a] border border-white/3 rounded-[30px] px-10 text-[16px] font-semibold text-white outline-none focus:border-primary/40 focus:bg-primary/2 transition-all relative z-10 shadow-inner"
                />
                <div className="absolute right-8 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-white/10" />
              </div>
            </div>

            <div className="space-y-4 group">
              <label className="text-[10px] font-bold text-white/20 uppercase tracking-[0.6em] ml-4 group-focus-within:text-primary transition-colors">Network ID</label>
              <div className="relative">
                 <div className="absolute -inset-0.5 bg-linear-to-br from-emerald-500/20 to-transparent rounded-4xl opacity-0 group-focus-within:opacity-100 transition-opacity" />
                <input 
                  value={username}
                  onChange={(e) => { setUsername(e.target.value); setIsDirty(true); }}
                  className="w-full h-20 bg-[#08080a] border border-emerald-500/5 rounded-[30px] px-10 text-[16px] font-semibold text-white outline-none focus:border-emerald-500/40 focus:bg-emerald-500/2 transition-all tabular-nums relative z-10 shadow-inner"
                />
                <div className="absolute right-8 top-1/2 -translate-y-1/2 flex items-center gap-5">
                  <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest animate-pulse">VERIFIED_AVAILABLE</span>
                  <CheckCircle className="w-6 h-6 text-emerald-400 drop-shadow-[0_0_10px_#10b981]" />
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-4 group">
            <div className="flex items-center justify-between ml-4">
              <label className="text-[10px] font-bold text-white/20 uppercase tracking-[0.6em] group-focus-within:text-primary transition-colors">Neural Signature [METADATA]</label>
              <span className="text-[10px] font-bold text-white/10 uppercase tracking-widest font-mono">LINT: 112 / 160 CHAR_MAX</span>
            </div>
            <div className="relative">
              <div className="absolute -inset-0.5 bg-linear-to-br from-primary/20 to-transparent rounded-[42px] opacity-0 group-focus-within:opacity-100 transition-opacity" />
              <textarea 
                rows={4}
                value={bio}
                onChange={(e) => { setBio(e.target.value); setIsDirty(true); }}
                className="w-full bg-[#08080a] border border-white/3 rounded-[40px] p-10 text-[15px] font-semibold text-white/70 outline-none focus:border-primary/40 focus:bg-primary/2 transition-all resize-none leading-relaxed shadow-inner relative z-10"
              />
            </div>
          </div>
        </section>

        {/* BOTTOM PROTOCOL ACTIONS */}
        <div className="pt-14 xl:pt-20 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-8 xl:gap-12">
          <div className="flex items-center gap-8 group/status">
            <div className="w-5 h-5 rounded-full bg-primary/20 animate-pulse relative">
              <div className="absolute inset-0 bg-primary rounded-full animate-ping opacity-20" />
            </div>
            <p className="text-[11px] font-bold text-white/10 uppercase tracking-[0.4em] group-hover/status:text-white/30 transition-colors break-all">Protocol_Status: AES:L2_ENCRYPTED_ID_STABLE</p>
          </div>
          
          <div className="flex items-center gap-16">
            <button 
              className={cn(
                "text-[12px] font-bold text-white/20 uppercase tracking-[0.6em] hover:text-white transition-all",
                !isDirty && "opacity-0 pointer-events-none"
              )}
              onClick={handleResetChanges}
            >
              Abort_Changes
            </button>
            
            <Magnetic strength={0.3}>
              <Button 
                className={cn(
                  "h-24 px-20 rounded-[40px] font-bold uppercase tracking-[0.8em] text-[13px] transition-all relative overflow-hidden shadow-2xl",
                  isDirty 
                    ? "bg-primary hover:bg-indigo-500 shadow-[0_30px_60px_rgba(99,102,241,0.3)] text-white" 
                    : "bg-white/2 text-white/10 pointer-events-none border border-white/5"
                )}
                onClick={handleSave}
              >
                {isSaving ? (
                  <div className="flex items-center gap-8">
                    <div className="w-8 h-8 border-4 border-white/10 border-t-white rounded-full animate-spin" />
                    <span className="tracking-[1em]">PROTO_SYNC...</span>
                  </div>
                ) : (
                  "COMMIT_CORE_CHANGES"
                )}
                
                {isDirty && (
                  <div className="absolute inset-0 animate-scanline bg-gradient-to-b from-transparent via-white/10 to-transparent h-[200%] pointer-events-none" />
                )}
              </Button>
            </Magnetic>
          </div>
        </div>
      </div>

      {/* SIDEBAR TELEMETRY snapshot */}
      <div className="space-y-8 xl:space-y-10 2xl:space-y-12 min-w-0 2xl:w-[340px] xl:grid xl:grid-cols-2 xl:gap-6 2xl:block">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-5 xl:p-6 2xl:p-8 rounded-[30px] xl:rounded-[32px] 2xl:rounded-[44px] glass-ultra border border-white/5 bg-white/1 space-y-8 xl:space-y-8 2xl:space-y-12 relative overflow-hidden group shadow-[0_40px_80px_rgba(0,0,0,0.6)]"
        >
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/10 rounded-full blur-[120px] -mr-60 -mt-60 animate-pulse pointer-events-none" />
          <div className="absolute inset-0 bg-scanlines opacity-[0.03] pointer-events-none" />
          
          <div className="space-y-6 relative z-10">
            <span className="text-[11px] font-bold text-white/20 uppercase tracking-[0.6em]">Trust_Score_Index</span>
            <div className="flex items-end justify-between">
              <span className="text-4xl xl:text-5xl 2xl:text-6xl font-semibold text-white tracking-tighter">9.82</span>
              <div className="flex flex-col items-end gap-1">
                <span className="px-3 py-1 rounded-lg bg-emerald-500/10 text-[10px] font-bold text-emerald-400 uppercase tracking-widest border border-emerald-500/20">A+ STATUS</span>
                <span className="text-[10px] font-bold text-white/10 uppercase tracking-widest font-mono">HIGH_INTEGRITY</span>
              </div>
            </div>
            <div className="w-full h-3 bg-white/5 rounded-full overflow-hidden mt-10 border border-white/5 p-1 relative shadow-inner">
              <motion.div 
                initial={{ width: 0 }} 
                animate={{ width: '98%' }} 
                transition={{ duration: 2, ease: "circOut" }}
                className="h-full bg-linear-to-r from-primary via-indigo-400 to-cyan-400 rounded-full shadow-[0_0_20px_rgba(99,102,241,0.6)]" 
              />
            </div>
          </div>

          <div className="space-y-10 relative z-10 pt-4">
            {[
              { label: '2FA Protocol', icon: Shield, color: 'text-primary', active: true },
              { label: 'Pulse Node Sync', icon: Activity, color: 'text-indigo-400', active: true },
              { label: 'System Verify', icon: Box, color: 'text-cyan-400', active: true },
              { label: 'Quantum Relay', icon: Cpu, color: 'text-amber-500', active: false, label2: 'PENDING_MOD' },
            ].map((item, i) => (
              <div key={i} className="flex items-center justify-between group/row">
                <div className="flex items-center gap-6">
                  <div className="w-12 h-12 rounded-2xl bg-white/3 border border-white/5 flex items-center justify-center group-hover/row:border-white/20 transition-all duration-500">
                    <item.icon className={cn("w-6 h-6", item.active ? item.color : "text-white/5")} />
                  </div>
                  <span className="text-[12px] font-semibold text-white/30 uppercase tracking-[0.2em] group-hover/row:text-white transition-all">{item.label}</span>
                </div>
                {item.active ? (
                  <CheckCircle className="w-5 h-5 text-emerald-400 drop-shadow-[0_0_10px_#10b981]" />
                ) : (
                  <span className="text-[10px] font-bold text-amber-500 uppercase tracking-widest bg-amber-500/5 px-2.5 py-1 rounded-lg border border-amber-500/10">{item.label2}</span>
                )}
              </div>
            ))}
          </div>

          <Button onClick={() => router.push('/settings/security')} variant="ghost" className="w-full h-14 xl:h-16 2xl:h-20 rounded-3xl bg-white/1 border border-white/5 hover:bg-white/3 hover:border-primary/20 text-[10px] 2xl:text-[11px] font-bold uppercase tracking-[0.28em] 2xl:tracking-[0.45em] text-white/20 hover:text-white transition-all group/audit overflow-hidden relative">
            <span className="relative z-10 flex items-center justify-center gap-4">
              Detailed System Audit
              <ChevronRight className="w-5 h-5 group-hover/audit:translate-x-3 transition-transform duration-700" />
            </span>
            <div className="absolute inset-0 bg-scanlines opacity-0 group-hover/audit:opacity-10 transition-opacity" />
          </Button>
        </motion.div>

        <div className="p-6 xl:p-6 2xl:p-8 rounded-[30px] xl:rounded-[32px] 2xl:rounded-[40px] border border-white/5 bg-white/1 space-y-6 relative overflow-hidden group">
          <div className="absolute inset-0 bg-linear-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="flex items-center gap-4">
            <Sparkles className="w-6 h-6 text-primary animate-pulse" />
            <h5 className="text-[11px] font-bold text-white/20 uppercase tracking-[0.6em]">Neural AI Directive</h5>
          </div>
          <p className="text-[15px] text-white/40 leading-relaxed font-medium">
            "Your profile integrity is currently rated as Institutional Grade. We recommend rotating your Quantum Relay nodes to bypass emerging latency vectors in the AP-South-1 region."
          </p>
          <div className="pt-6 border-t border-white/5">
            <span className="text-[10px] font-bold text-primary/30 uppercase tracking-[0.4em] font-mono">ADVICE_LOG_ID: PX_771092</span>
          </div>
        </div>
      </div>
    </div>
  );
}
