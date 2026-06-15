'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import {
 Terminal, Key, Plus, Copy, Eye, EyeOff, Trash2,
 CheckCircle, AlertCircle,
} from '@/components/ui/icons';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { apiClient } from '@/lib/api/client';

interface ApiKey {
  id: string;
  name: string;
  keyPrefix: string;
  scopes: string[];
  lastUsedAt: string | null;
  expiresAt: string | null;
  createdAt: string;
}

const SCOPE_PRESETS = [
  { label: 'READ', scopes: ['read:trades', 'read:analytics', 'read:strategies', 'read:wallet'], color: 'bg-chart-5/10 text-chart-5 border-chart-5/20' },
  { label: 'TRADE', scopes: ['read:trades', 'write:trades'], color: 'bg-primary/10 text-primary border-primary/20' },
  { label: 'ANALYTICS', scopes: ['read:analytics'], color: 'bg-chart-2/10 text-chart-2 border-chart-2/20' },
  { label: 'FULL ACCESS', scopes: ['read:trades', 'read:analytics', 'read:strategies', 'read:wallet', 'write:trades', 'write:strategies'], color: 'bg-destructive/10 text-destructive border-destructive/20' },
] as const;

function deriveScopeLabel(scopes: string[]): string {
  if (scopes.includes('write:strategies') || scopes.length >= 6) return 'FULL ACCESS';
  if (scopes.some(s => s.startsWith('write:trades'))) return 'TRADE';
  if (scopes.length === 1 && scopes[0] === 'read:analytics') return 'ANALYTICS';
  return 'READ';
}

const PERMISSION_COLORS: Record<string, string> = {
  'READ': 'bg-chart-5/10 text-chart-5 border-chart-5/20',
  'TRADE': 'bg-primary/10 text-primary border-primary/20',
  'ANALYTICS': 'bg-chart-2/10 text-chart-2 border-chart-2/20',
  'FULL ACCESS': 'bg-destructive/10 text-destructive border-destructive/20',
};

const TERMINAL_LOGS = [
 { ts: '14:31:02', method: 'GET', endpoint: '/api/v1/trading/trades', status: 200, ms: 48 },
 { ts: '14:30:55', method: 'POST', endpoint: '/api/v1/trading/place', status: 201, ms: 122 },
 { ts: '14:30:47', method: 'GET', endpoint: '/api/v1/analytics/summary', status: 200, ms: 35 },
 { ts: '14:30:31', method: 'GET', endpoint: '/api/v1/market/quote/BTCUSDT', status: 200, ms: 19 },
 { ts: '14:29:58', method: 'DELETE', endpoint: '/api/v1/trading/cancel/ord_14829', status: 204, ms: 67 },
 { ts: '14:29:42', method: 'GET', endpoint: '/api/v1/analytics/performance', status: 200, ms: 88 },
 { ts: '14:29:10', method: 'POST', endpoint: '/api/v1/strategies/activate', status: 400, ms: 14 },
];

export default function APIKeysPage() {
 const [keys, setKeys] = React.useState<ApiKey[]>([]);
 const [isLoading, setIsLoading] = React.useState(true);
 const [visibleKeys, setVisibleKeys] = React.useState<Set<string>>(new Set());
 const [copied, setCopied] = React.useState<string | null>(null);
 const [isCreating, setIsCreating] = React.useState(false);
 const [newKeyName, setNewKeyName] = React.useState('');
 const [selectedPreset, setSelectedPreset] = React.useState<string>('READ');
 const [createdKeyValue, setCreatedKeyValue] = React.useState<string | null>(null);
 const [activeTab, setActiveTab] = React.useState<'keys' | 'terminal'>('keys');
 const [pendingDeleteId, setPendingDeleteId] = React.useState<string | null>(null);
 const [isSubmitting, setIsSubmitting] = React.useState(false);

 React.useEffect(() => {
   apiClient.get<{ data: ApiKey[] }>('/settings/api-keys')
     .then(r => setKeys((r.data as any).data ?? r.data ?? []))
     .catch(() => toast.error('Failed to load API keys'))
     .finally(() => setIsLoading(false));
 }, []);

 const toggleKeyVisibility = (id: string) => {
   setVisibleKeys(prev => {
     const next = new Set(prev);
     next.has(id) ? next.delete(id) : next.add(id);
     return next;
   });
 };

 const handleCopy = (text: string, id: string) => {
   navigator.clipboard.writeText(text);
   setCopied(id);
   toast.success('Copied to clipboard');
   setTimeout(() => setCopied(null), 2000);
 };

 const handleCreateKey = async () => {
   if (!newKeyName.trim() || isSubmitting) return;
   const preset = SCOPE_PRESETS.find(p => p.label === selectedPreset);
   if (!preset) return;
   setIsSubmitting(true);
   try {
     const res = await apiClient.post<{ data: { key: string; prefix: string; name: string; scopes: string[] } }>(
       '/settings/api-keys',
       { name: newKeyName.trim(), scopes: preset.scopes },
     );
     const created = (res.data as any).data ?? res.data;
     setCreatedKeyValue(created.key);
     setIsCreating(false);
     setNewKeyName('');
     setSelectedPreset('READ');
     toast.success('API key generated — copy it now');
     // Refresh the list
     const list = await apiClient.get<{ data: ApiKey[] }>('/settings/api-keys');
     setKeys((list.data as any).data ?? list.data ?? []);
   } catch {
     toast.error('Failed to create API key');
   } finally {
     setIsSubmitting(false);
   }
 };

 const handleDeleteKey = async (id: string) => {
   if (pendingDeleteId !== id) {
     setPendingDeleteId(id);
     toast.message('Click revoke again to confirm');
     return;
   }
   try {
     await apiClient.delete(`/settings/api-keys/${id}`);
     setKeys(prev => prev.filter(k => k.id !== id));
     setPendingDeleteId(null);
     toast.success('API key revoked');
   } catch {
     toast.error('Failed to revoke key');
   }
 };

 const getMethodColor = (method: string) => {
   if (method === 'GET') return 'text-chart-5';
   if (method === 'POST') return 'text-chart-3';
   if (method === 'DELETE') return 'text-destructive';
   return 'text-chart-4';
 };

 const getStatusColor = (status: number) => {
   if (status >= 200 && status < 300) return 'text-chart-3';
   if (status >= 400) return 'text-destructive';
   return 'text-chart-4';
 };

 const formatLastUsed = (val: string | null) => {
   if (!val) return 'never';
   const diff = Date.now() - new Date(val).getTime();
   const mins = Math.floor(diff / 60000);
   if (mins < 1) return 'just now';
   if (mins < 60) return `${mins} min ago`;
   const hrs = Math.floor(mins / 60);
   if (hrs < 24) return `${hrs}h ago`;
   return `${Math.floor(hrs / 24)}d ago`;
 };

 return (
   <div className="space-y-10 pb-20">
     {/* Header */}
     <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
       <div className="space-y-3">
         <div className="flex items-center gap-3">
           <div className="w-2 h-2 rounded-full bg-primary animate-pulse shadow-[0_0_10px_#6366f1]" />
           <span className="text-xs font-semibold text-primary uppercase tracking-[0.5em] font-jet-mono">Secure Key Infrastructure</span>
         </div>
         <h2 className="text-4xl font-semibold text-foreground uppercase tracking-tight">API Terminal</h2>
         <p className="text-xs text-foreground/30 font-semibold uppercase tracking-[0.2em] max-w-lg">
           Manage cryptographic access tokens and monitor live API telemetry in real-time.
         </p>
       </div>
       <button
         onClick={() => setIsCreating(true)}
         className="flex items-center gap-3 h-14 px-8 rounded-[18px] bg-white text-primary-foreground hover:bg-foreground/90 font-semibold text-sm uppercase tracking-[0.2em] shadow-[0_0_30px_rgba(255,255,255,0.1)] transition-all group"
       >
         <Plus className="w-4 h-4 group-hover:rotate-90 transition-transform duration-300" />
         Generate New Key
       </button>
     </div>

     {/* Revealed Key Banner */}
     <AnimatePresence>
       {createdKeyValue && (
         <motion.div
           initial={{ opacity: 0, y: -20 }}
           animate={{ opacity: 1, y: 0 }}
           exit={{ opacity: 0, y: -20 }}
           className="p-6 rounded-3xl bg-chart-3/5 border border-chart-3/30 flex items-center justify-between gap-6 relative overflow-hidden"
         >
           <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_left,rgba(16,185,129,0.05),transparent_60%)] pointer-events-none" />
           <div className="flex items-start gap-4 relative z-10">
             <div className="w-10 h-10 rounded-xl bg-chart-3/20 border border-chart-3/30 flex items-center justify-center shrink-0 mt-0.5">
               <CheckCircle className="w-5 h-5 text-chart-3" />
             </div>
             <div className="space-y-1.5">
               <p className="text-xs font-semibold text-chart-3 uppercase tracking-widest">Key Generated — Copy Now. This cannot be viewed again.</p>
               <code className="text-sm font-jet-mono text-foreground/80 break-all leading-relaxed">{createdKeyValue}</code>
             </div>
           </div>
           <button
             onClick={() => handleCopy(createdKeyValue, 'new')}
             className="shrink-0 flex items-center gap-2 h-10 px-5 rounded-xl bg-chart-3/20 border border-chart-3/30 text-chart-3 hover:bg-chart-3/30 transition-all text-sm font-semibold uppercase tracking-widest relative z-10"
           >
             {copied === 'new' ? <CheckCircle className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
             {copied === 'new' ? 'Copied!' : 'Copy'}
           </button>
         </motion.div>
       )}
     </AnimatePresence>

     {/* Sub-tab switcher */}
     <div className="flex items-center gap-2 p-1.5 bg-foreground/2 border border-border rounded-[18px] w-fit">
       {(['keys', 'terminal'] as const).map(tab => (
         <button
           key={tab}
           onClick={() => setActiveTab(tab)}
           className={cn(
             'relative px-6 py-2.5 rounded-[14px] text-xs font-semibold uppercase tracking-[0.2em] transition-all duration-300',
             activeTab === tab ? 'text-foreground' : 'text-foreground/30 hover:text-foreground/60',
           )}
         >
           <span className="relative z-10 flex items-center gap-2">
             {tab === 'keys' ? <Key className="w-3.5 h-3.5" /> : <Terminal className="w-3.5 h-3.5" />}
             {tab === 'keys' ? 'Access Keys' : 'Live Terminal'}
           </span>
           {activeTab === tab && (
             <motion.div
               layoutId="apiTabIndicator"
               className="absolute inset-0 bg-foreground/10 border border-border rounded-[14px]"
               transition={{ type: 'spring', bounce: 0.2, duration: 0.5 }}
             />
           )}
         </button>
       ))}
     </div>

     <AnimatePresence mode="wait">
       {activeTab === 'keys' && (
         <motion.div key="keys" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-6">
           {isLoading ? (
             <div className="p-12 text-center text-sm text-foreground/30 font-semibold uppercase tracking-widest animate-pulse">Loading keys…</div>
           ) : keys.length === 0 ? (
             <div className="p-12 rounded-[28px] border border-dashed border-border bg-foreground/1 text-center space-y-4">
               <p className="text-sm font-semibold text-foreground/30 uppercase tracking-[0.25em]">No active keys available</p>
               <Button onClick={() => setIsCreating(true)} className="h-11 px-6 rounded-xl bg-white text-primary-foreground hover:bg-foreground/90 uppercase tracking-[0.2em] text-xs font-semibold">
                 Generate First Key
               </Button>
             </div>
           ) : keys.map((key, idx) => {
             const permLabel = deriveScopeLabel(key.scopes);
             return (
               <motion.div
                 key={key.id}
                 initial={{ opacity: 0, y: 20 }}
                 animate={{ opacity: 1, y: 0 }}
                 transition={{ delay: idx * 0.06 }}
                 className="group relative p-6 rounded-[28px] bg-card border border-border hover:border-border transition-all duration-500 overflow-hidden"
               >
                 <div className="absolute inset-0 bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.01),transparent)] -translate-x-full group-hover:translate-x-full transition-transform duration-[1.5s] pointer-events-none" />
                 <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
                   <div className="flex items-start gap-5 flex-1 min-w-0">
                     <div className="w-12 h-12 rounded-[14px] bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
                       <Key className="w-5 h-5 text-primary" />
                     </div>
                     <div className="min-w-0 space-y-2 flex-1">
                       <div className="flex items-center gap-3 flex-wrap">
                         <span className="text-sm font-semibold text-foreground uppercase tracking-tight">{key.name}</span>
                         <div className="px-2.5 py-0.5 rounded-md text-xs font-semibold uppercase tracking-widest border bg-chart-3/10 text-chart-3 border-chart-3/20">
                           ● ACTIVE
                         </div>
                       </div>
                       <div className="flex items-center gap-3 font-jet-mono">
                         <code className="text-xs text-foreground/40">
                           {visibleKeys.has(key.id)
                             ? `${key.keyPrefix}${'x'.repeat(20)}`
                             : `${key.keyPrefix}••••••••••••••••••••`}
                         </code>
                         <button onClick={() => toggleKeyVisibility(key.id)} className="text-foreground/20 hover:text-foreground/60 transition-colors">
                           {visibleKeys.has(key.id) ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                         </button>
                       </div>
                       <div className="flex items-center gap-2 flex-wrap">
                         <span className={cn('px-2 py-0.5 rounded text-xs font-semibold uppercase tracking-widest border', PERMISSION_COLORS[permLabel])}>
                           {permLabel}
                         </span>
                         {key.scopes.map(s => (
                           <span key={s} className="px-2 py-0.5 rounded text-micro font-semibold tracking-wider border bg-foreground/3 border-border text-foreground/30 font-jet-mono">
                             {s}
                           </span>
                         ))}
                       </div>
                     </div>
                   </div>
                   <div className="grid grid-cols-2 gap-6 lg:w-auto shrink-0">
                     <div className="flex flex-col items-center gap-1 text-center">
                       <span className="text-xs font-semibold text-foreground/20 uppercase tracking-widest">Created</span>
                       <span className="text-xs font-semibold text-foreground/60 font-jet-mono whitespace-nowrap">
                         {new Date(key.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: '2-digit' })}
                       </span>
                     </div>
                     <div className="flex flex-col items-center gap-1 text-center">
                       <span className="text-xs font-semibold text-foreground/20 uppercase tracking-widest">Last Used</span>
                       <span className="text-xs font-semibold text-foreground/60 font-jet-mono whitespace-nowrap">{formatLastUsed(key.lastUsedAt)}</span>
                     </div>
                   </div>
                   <button
                     onClick={() => handleDeleteKey(key.id)}
                     className={cn(
                       'shrink-0 w-10 h-10 rounded-[10px] border flex items-center justify-center transition-all opacity-0 group-hover:opacity-100',
                       pendingDeleteId === key.id
                         ? 'bg-chart-4/10 border-chart-4/30 text-chart-4'
                         : 'bg-destructive/10 border-destructive/20 text-destructive hover:bg-destructive/20',
                     )}
                   >
                     {pendingDeleteId === key.id ? <AlertCircle className="w-4 h-4" /> : <Trash2 className="w-4 h-4" />}
                   </button>
                 </div>
               </motion.div>
             );
           })}
         </motion.div>
       )}

       {activeTab === 'terminal' && (
         <motion.div key="terminal" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
           <div className="rounded-[28px] bg-background border border-border overflow-hidden shadow-[0_30px_60px_rgba(0,0,0,0.8)]">
             <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-foreground/1">
               <div className="flex items-center gap-4">
                 <div className="flex items-center gap-2">
                   <div className="w-3 h-3 rounded-full bg-destructive/60" />
                   <div className="w-3 h-3 rounded-full bg-chart-4/60" />
                   <div className="w-3 h-3 rounded-full bg-chart-3/60" />
                 </div>
                 <div className="flex items-center gap-2 text-xs font-semibold text-foreground/30 uppercase tracking-widest font-jet-mono">
                   <Terminal className="w-3.5 h-3.5 text-primary" />
                   <span>profytron_api // live_request_monitor</span>
                 </div>
               </div>
               <div className="flex items-center gap-2">
                 <div className="w-2 h-2 rounded-full bg-chart-3 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
                 <span className="text-xs font-semibold text-chart-3 uppercase tracking-widest font-jet-mono">LIVE</span>
               </div>
             </div>
             <div className="p-6 space-y-2 font-jet-mono">
               {TERMINAL_LOGS.map((log, i) => (
                 <motion.div
                   key={i}
                   initial={{ opacity: 0, x: -10 }}
                   animate={{ opacity: 1, x: 0 }}
                   transition={{ delay: i * 0.05 }}
                   className="flex items-center gap-4 text-xs py-2.5 px-4 rounded-[10px] hover:bg-foreground/2 transition-colors group/log cursor-default"
                 >
                   <span className="text-foreground/20 shrink-0 w-16">{log.ts}</span>
                   <span className={cn('font-semibold uppercase shrink-0 w-14', getMethodColor(log.method))}>{log.method}</span>
                   <span className="text-foreground/50 flex-1 truncate group-hover/log:text-foreground/80 transition-colors">{log.endpoint}</span>
                   <span className={cn('font-semibold shrink-0 w-10 text-right', getStatusColor(log.status))}>{log.status}</span>
                   <span className="text-foreground/20 shrink-0 w-16 text-right">{log.ms}ms</span>
                 </motion.div>
               ))}
               <div className="flex items-center gap-3 px-4 py-2 text-xs">
                 <span className="text-foreground/20">{'>'}</span>
                 <span className="w-2 h-4 bg-primary/70 animate-pulse inline-block" />
               </div>
             </div>
             <div className="flex items-center justify-between px-6 py-4 border-t border-border bg-foreground/1 flex-wrap gap-4">
               {[
                 { label: 'Active Keys', val: String(keys.length), color: 'text-foreground' },
                 { label: 'Avg Speed', val: '56ms', color: 'text-chart-5' },
                 { label: 'Error Rate', val: '0.04%', color: 'text-chart-3' },
                 { label: 'Rate Limit', val: '60 req/min', color: 'text-chart-4' },
               ].map(s => (
                 <div key={s.label} className="flex items-center gap-3">
                   <span className="text-xs text-foreground/20 font-semibold uppercase tracking-widest">{s.label}</span>
                   <span className={cn('text-xs font-semibold font-jet-mono', s.color)}>{s.val}</span>
                 </div>
               ))}
             </div>
           </div>
         </motion.div>
       )}
     </AnimatePresence>

     {/* Create Key Modal */}
     <AnimatePresence>
       {isCreating && (
         <motion.div
           initial={{ opacity: 0 }}
           animate={{ opacity: 1 }}
           exit={{ opacity: 0 }}
           className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/80 backdrop-blur-xl"
           onClick={(e) => e.target === e.currentTarget && !isSubmitting && setIsCreating(false)}
         >
           <motion.div
             initial={{ opacity: 0, scale: 0.95, y: 20 }}
             animate={{ opacity: 1, scale: 1, y: 0 }}
             exit={{ opacity: 0, scale: 0.95 }}
             className="w-full max-w-lg rounded-4xl bg-[#080808] border border-border p-8 space-y-8 shadow-[0_0_80px_rgba(0,0,0,1)] relative overflow-hidden"
           >
             <div className="absolute inset-0 bg-linear-to-br from-primary/5 to-transparent pointer-events-none" />
             <div className="relative z-10 space-y-2">
               <div className="flex items-center gap-3 text-primary text-xs font-semibold uppercase tracking-[0.3em] font-jet-mono">
                 <Key className="w-4 h-4" />
                 <span>Key Generation Sequence</span>
               </div>
               <h3 className="text-2xl font-semibold text-foreground uppercase tracking-tight">Create New API Key</h3>
             </div>

             <div className="relative z-10 space-y-6">
               <div className="space-y-3">
                 <label className="text-xs font-semibold text-foreground/30 uppercase tracking-[0.3em]">Key Identity Label</label>
                 <input
                   value={newKeyName}
                   onChange={e => setNewKeyName(e.target.value)}
                   placeholder="e.g. Production Trading Node"
                   className="w-full h-14 bg-foreground/3 border border-border rounded-2xl px-5 text-sm font-semibold text-foreground placeholder:text-foreground/20 outline-none focus:border-primary/50 transition-all font-jet-mono"
                 />
               </div>

               <div className="space-y-3">
                 <label className="text-xs font-semibold text-foreground/30 uppercase tracking-[0.3em]">Permission Scope</label>
                 <div className="flex flex-wrap gap-3">
                   {SCOPE_PRESETS.map(p => (
                     <button
                       key={p.label}
                       onClick={() => setSelectedPreset(p.label)}
                       className={cn(
                         'px-4 py-2 rounded-[10px] text-xs font-semibold uppercase tracking-widest border transition-all',
                         selectedPreset === p.label ? p.color : 'bg-foreground/2 border-border text-foreground/30 hover:border-border',
                       )}
                     >
                       {p.label}
                     </button>
                   ))}
                 </div>
               </div>

               <div className="p-4 rounded-[14px] bg-chart-4/5 border border-chart-4/20 flex items-start gap-3">
                 <AlertCircle className="w-4 h-4 text-chart-4 shrink-0 mt-0.5" />
                 <p className="text-xs text-foreground/40 font-semibold uppercase tracking-wider leading-relaxed">
                   The key will only be shown once upon creation. Store it securely.
                 </p>
               </div>
             </div>

             <div className="flex gap-4 relative z-10">
               <Button
                 onClick={() => !isSubmitting && setIsCreating(false)}
                 className="flex-1 h-12 bg-foreground/5 border border-border hover:bg-foreground/10 text-foreground text-sm font-semibold uppercase tracking-widest rounded-[14px]"
               >
                 Cancel
               </Button>
               <Button
                 onClick={handleCreateKey}
                 disabled={!newKeyName.trim() || isSubmitting}
                 className="flex-2 h-12 bg-white text-primary-foreground hover:bg-foreground/90 text-sm font-semibold uppercase tracking-[0.2em] rounded-[14px] shadow-[0_0_20px_rgba(255,255,255,0.1)] disabled:opacity-30"
               >
                 {isSubmitting ? 'Generating…' : 'Generate Key'}
               </Button>
             </div>
           </motion.div>
         </motion.div>
       )}
     </AnimatePresence>
   </div>
 );
}
