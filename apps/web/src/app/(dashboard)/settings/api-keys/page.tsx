'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import {
 Terminal, Key, Plus, Copy, Eye, EyeOff, Trash2,
 CheckCircle, AlertCircle, Zap, Shield, Activity,
 Clock, Globe, RefreshCcw, Code, Cpu, Lock
} from '@/components/ui/icons';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

const MOCK_KEYS = [
 {
 id: 'key_001',
 name: 'Alpha Trading Node',
 prefix: 'profy_live_a7Kx',
 suffix: '...4mNq',
 created: '2024-01-15',
 lastUsed: '2 min ago',
 permissions: ['READ', 'TRADE', 'ANALYTICS'],
 status: 'active',
 requests: 14820,
 rateLimit: '1000 req/min',
 },
 {
 id: 'key_002',
 name: 'Analytics Beacon',
 prefix: 'profy_live_b2Wp',
 suffix: '...9sVr',
 created: '2024-02-20',
 lastUsed: '1 hour ago',
 permissions: ['READ', 'ANALYTICS'],
 status: 'active',
 requests: 3211,
 rateLimit: '500 req/min',
 },
 {
 id: 'key_003',
 name: 'Webhook Relay Node',
 prefix: 'profy_test_c8Jq',
 suffix: '...1xTm',
 created: '2024-03-08',
 lastUsed: '3 days ago',
 permissions: ['READ'],
 status: 'inactive',
 requests: 0,
 rateLimit: '100 req/min',
 },
];

const PERMISSION_COLORS: Record<string, string> = {
 'READ': 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
 'TRADE': 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
 'ANALYTICS': 'bg-violet-500/10 text-violet-400 border-violet-500/20',
 'ADMIN': 'bg-rose-500/10 text-rose-400 border-rose-500/20',
};

const TERMINAL_LOGS = [
 { ts: '14:31:02', method: 'GET', endpoint: '/api/v2/strategies/active', status: 200, ms: 48 },
 { ts: '14:30:55', method: 'POST', endpoint: '/api/v2/orders/place', status: 201, ms: 122 },
 { ts: '14:30:47', method: 'GET', endpoint: '/api/v2/portfolio/summary', status: 200, ms: 35 },
 { ts: '14:30:31', method: 'GET', endpoint: '/api/v2/market/tickers', status: 200, ms: 19 },
 { ts: '14:29:58', method: 'DELETE', endpoint: '/api/v2/orders/cancel/ord_14829', status: 204, ms: 67 },
 { ts: '14:29:42', method: 'GET', endpoint: '/api/v2/analytics/performance', status: 200, ms: 88 },
 { ts: '14:29:10', method: 'POST', endpoint: '/api/v2/strategies/activate', status: 400, ms: 14 },
];

export default function APIKeysPage() {
 const [keys, setKeys] = React.useState(MOCK_KEYS);
 const [visibleKeys, setVisibleKeys] = React.useState<Set<string>>(new Set());
 const [copied, setCopied] = React.useState<string | null>(null);
 const [isCreating, setIsCreating] = React.useState(false);
 const [newKeyName, setNewKeyName] = React.useState('');
 const [newKeyPerms, setNewKeyPerms] = React.useState<string[]>(['READ']);
 const [createdKeyValue, setCreatedKeyValue] = React.useState<string | null>(null);
 const [activeTab, setActiveTab] = React.useState<'keys' | 'terminal'>('keys');
 const [pendingDeleteId, setPendingDeleteId] = React.useState<string | null>(null);

 React.useEffect(() => {
  try {
   const storedKeys = localStorage.getItem('settings.apiKeys.items');
   if (storedKeys) {
    const parsed = JSON.parse(storedKeys);
    if (Array.isArray(parsed)) setKeys(parsed);
   }
  } catch {
   // Ignore malformed saved keys.
  }
 }, []);

 React.useEffect(() => {
  localStorage.setItem('settings.apiKeys.items', JSON.stringify(keys));
 }, [keys]);

 const toggleKeyVisibility = (id: string) => {
 setVisibleKeys(prev => {
 const next = new Set(prev);
      const wasVisible = next.has(id);
      if (wasVisible) {
        next.delete(id);
      } else {
        next.add(id);
      }
      toast.message(wasVisible ? 'Credential masked' : 'Credential revealed');
 return next;
 });
 };

 const handleOpenCreateModal = () => {
  setIsCreating(true);
  toast.message('Key generator opened');
 };

 const handleCloseCreateModal = () => {
  setIsCreating(false);
  toast.message('Key generator closed');
 };

 const handleTabChange = (tab: 'keys' | 'terminal') => {
  setActiveTab(tab);
  toast.message(tab === 'keys' ? 'Viewing access keys' : 'Viewing live terminal');
 };

 const handleCopy = (text: string, id: string) => {
 navigator.clipboard.writeText(text);
 setCopied(id);
 toast.success('Credential copied to clipboard');
 setTimeout(() => setCopied(null), 2000);
 };

 const handleCreateKey = () => {
 if (!newKeyName.trim()) return;
 const fakeKey = `profy_live_${Math.random().toString(36).substr(2, 8)}${Math.random().toString(36).substr(2, 24)}`;
 const prefix = fakeKey.slice(0, 15);
 const suffix = `...${fakeKey.slice(-4)}`;
 setKeys((prev) => [
  {
   id: `key_${Date.now()}`,
   name: newKeyName.trim(),
   prefix,
   suffix,
   created: new Date().toISOString().slice(0, 10),
   lastUsed: 'never',
   permissions: newKeyPerms,
   status: 'active',
   requests: 0,
   rateLimit: newKeyPerms.includes('ADMIN') ? '2000 req/min' : '1000 req/min',
  },
  ...prev,
 ]);
 setCreatedKeyValue(fakeKey);
 setIsCreating(false);
 setNewKeyName('');
 setNewKeyPerms(['READ']);
 toast.success('API key generated');
 };

 const handleDeleteKey = (id: string) => {
  if (pendingDeleteId !== id) {
   setPendingDeleteId(id);
   toast.message('Click revoke again to confirm');
   return;
  }
  setKeys((prev) => prev.filter((key) => key.id !== id));
  setPendingDeleteId(null);
  toast.success('API key revoked');
 };

 const getMethodColor = (method: string) => {
 if (method === 'GET') return 'text-cyan-400';
 if (method === 'POST') return 'text-emerald-400';
 if (method === 'DELETE') return 'text-rose-400';
 return 'text-amber-400';
 };

 const getStatusColor = (status: number) => {
 if (status >= 200 && status < 300) return 'text-emerald-400';
 if (status >= 400) return 'text-rose-400';
 return 'text-amber-400';
 };

 return (
 <div className="space-y-10 pb-20">
 {/* Header */}
 <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
 <div className="space-y-3">
 <div className="flex items-center gap-3">
 <div className="w-2 h-2 rounded-full bg-p animate-pulse shadow-[0_0_10px_#6366f1]" />
 <span className="text-xs font-semibold text-p uppercase tracking-[0.5em] font-jet-mono">Secure Key Infrastructure</span>
 </div>
 <h2 className="text-4xl font-semibold text-white uppercase tracking-tight">API Terminal</h2>
 <p className="text-xs text-white/30 font-semibold uppercase tracking-[0.2em] max-w-lg">
 Manage cryptographic access tokens and monitor live API telemetry in real-time.
 </p>
 </div>
 <button
 onClick={handleOpenCreateModal}
 className="flex items-center gap-3 h-14 px-8 rounded-[18px] bg-white text-black hover:bg-white/90 font-semibold text-sm uppercase tracking-[0.2em] shadow-[0_0_30px_rgba(255,255,255,0.1)] transition-all group"
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
 className="p-6 rounded-3xl bg-emerald-500/5 border border-emerald-500/30 flex items-center justify-between gap-6 relative overflow-hidden"
 >
 <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_left,rgba(16,185,129,0.05),transparent_60%)] pointer-events-none" />
 <div className="flex items-start gap-4 relative z-10">
 <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center shrink-0 mt-0.5">
 <CheckCircle className="w-5 h-5 text-emerald-400" />
 </div>
 <div className="space-y-1.5">
 <p className="text-xs font-semibold text-emerald-400 uppercase tracking-widest">Key Generated — Copy Now. This cannot be viewed again.</p>
 <code className="text-sm font-jet-mono text-white/80 break-all leading-relaxed">{createdKeyValue}</code>
 </div>
 </div>
 <button
 onClick={() => handleCopy(createdKeyValue, 'new')}
 className="shrink-0 flex items-center gap-2 h-10 px-5 rounded-xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/30 transition-all text-sm font-semibold uppercase tracking-widest relative z-10"
 >
 {copied === 'new' ? <CheckCircle className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
 {copied === 'new' ? 'Copied!' : 'Copy'}
 </button>
 </motion.div>
 )}
 </AnimatePresence>

 {/* Sub-tab switcher */}
 <div className="flex items-center gap-2 p-1.5 bg-white/2 border border-white/5 rounded-[18px] w-fit">
 {(['keys', 'terminal'] as const).map(tab => (
 <button
 key={tab}
 onClick={() => handleTabChange(tab)}
 className={cn(
"relative px-6 py-2.5 rounded-[14px] text-xs font-semibold uppercase tracking-[0.2em] transition-all duration-300",
 activeTab === tab ?"text-white" :"text-white/30 hover:text-white/60"
 )}
 >
 <span className="relative z-10 flex items-center gap-2">
 {tab === 'keys' ? <Key className="w-3.5 h-3.5" /> : <Terminal className="w-3.5 h-3.5" />}
 {tab === 'keys' ? 'Access Keys' : 'Live Terminal'}
 </span>
 {activeTab === tab && (
 <motion.div
 layoutId="apiTabIndicator"
 className="absolute inset-0 bg-white/10 border border-white/15 rounded-[14px]"
 transition={{ type: 'spring', bounce: 0.2, duration: 0.5 }}
 />
 )}
 </button>
 ))}
 </div>

 <AnimatePresence mode="wait">
 {activeTab === 'keys' && (
 <motion.div key="keys" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-6">
 {keys.length === 0 && (
 <div className="p-12 rounded-[28px] border border-dashed border-white/10 bg-white/1 text-center space-y-4">
 <p className="text-sm font-semibold text-white/30 uppercase tracking-[0.25em]">No active keys available</p>
 <Button onClick={handleOpenCreateModal} className="h-11 px-6 rounded-xl bg-white text-black hover:bg-white/90 uppercase tracking-[0.2em] text-xs font-semibold">
 Generate First Key
 </Button>
 </div>
 )}
 {keys.map((key, idx) => (
 <motion.div
 key={key.id}
 initial={{ opacity: 0, y: 20 }}
 animate={{ opacity: 1, y: 0 }}
 transition={{ delay: idx * 0.06 }}
 className="group relative p-6 rounded-[28px] bg-[#050505] border border-white/5 hover:border-white/15 transition-all duration-500 overflow-hidden"
 >
 <div className="absolute inset-0 bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.01),transparent)] -translate-x-full group-hover:translate-x-full transition-transform duration-[1.5s] pointer-events-none" />
 
 <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
 {/* Key Info */}
 <div className="flex items-start gap-5 flex-1 min-w-0">
 <div className={cn(
"w-12 h-12 rounded-[14px] flex items-center justify-center shrink-0 border",
 key.status === 'active' ?"bg-p/10 border-p/20" :"bg-white/3 border-white/10"
 )}>
 <Key className={cn("w-5 h-5", key.status === 'active' ?"text-p" :"text-white/20")} />
 </div>
 <div className="min-w-0 space-y-2 flex-1">
 <div className="flex items-center gap-3 flex-wrap">
 <span className="text-sm font-semibold text-white uppercase tracking-tight">{key.name}</span>
 <div className={cn(
"px-2.5 py-0.5 rounded-md text-xs font-semibold uppercase tracking-widest border",
 key.status === 'active' ?"bg-emerald-500/10 text-emerald-400 border-emerald-500/20" :"bg-white/5 text-white/20 border-white/10"
 )}>
 {key.status === 'active' ? '● ACTIVE' : '○ INACTIVE'}
 </div>
 </div>
 
 {/* Key Value */}
 <div className="flex items-center gap-3 font-jet-mono">
 <code className="text-xs text-white/40">
 {visibleKeys.has(key.id)
 ? `${key.prefix}${'x'.repeat(20)}${key.suffix}`
 : `${key.prefix}••••••••••••••••••••${key.suffix}`}
 </code>
 <button onClick={() => toggleKeyVisibility(key.id)} className="text-white/20 hover:text-white/60 transition-colors">
 {visibleKeys.has(key.id) ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
 </button>
 <button onClick={() => handleCopy(`${key.prefix}xxxxxxxxxxxxxxxxxxxx${key.suffix}`, key.id)} className="text-white/20 hover:text-p transition-colors">
 {copied === key.id ? <CheckCircle className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
 </button>
 </div>

 {/* Permissions */}
 <div className="flex items-center gap-2 flex-wrap">
 {key.permissions.map(p => (
 <span key={p} className={cn("px-2 py-0.5 rounded text-xs font-semibold uppercase tracking-widest border", PERMISSION_COLORS[p])}>
 {p}
 </span>
 ))}
 </div>
 </div>
 </div>

 {/* Stats */}
 <div className="grid grid-cols-3 gap-6 lg:w-auto shrink-0">
 <div className="flex flex-col items-center gap-1 text-center">
 <span className="text-xs font-semibold text-white/20 uppercase tracking-widest">Requests</span>
 <span className="text-sm font-semibold text-white font-jet-mono">{key.requests.toLocaleString()}</span>
 </div>
 <div className="flex flex-col items-center gap-1 text-center">
 <span className="text-xs font-semibold text-white/20 uppercase tracking-widest">Last Used</span>
 <span className="text-xs font-semibold text-white/60 font-jet-mono whitespace-nowrap">{key.lastUsed}</span>
 </div>
 <div className="flex flex-col items-center gap-1 text-center">
 <span className="text-xs font-semibold text-white/20 uppercase tracking-widest">Rate Limit</span>
 <span className="text-xs font-semibold text-cyan-400 font-jet-mono whitespace-nowrap">{key.rateLimit}</span>
 </div>
 </div>

 {/* Action */}
 <button onClick={() => handleDeleteKey(key.id)} className={cn("shrink-0 w-10 h-10 rounded-[10px] border flex items-center justify-center transition-all opacity-0 group-hover:opacity-100", pendingDeleteId === key.id ? "bg-amber-500/10 border-amber-500/30 text-amber-300" : "bg-rose-500/10 border-rose-500/20 text-rose-400 hover:bg-rose-500/20")}>
 {pendingDeleteId === key.id ? <AlertCircle className="w-4 h-4" /> : <Trash2 className="w-4 h-4" />}
 </button>
 </div>
 </motion.div>
 ))}
 </motion.div>
 )}

 {activeTab === 'terminal' && (
 <motion.div key="terminal" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
 <div className="rounded-[28px] bg-[#030303] border border-white/10 overflow-hidden shadow-[0_30px_60px_rgba(0,0,0,0.8)]">
 {/* Terminal Header */}
 <div className="flex items-center justify-between px-6 py-4 border-b border-white/5 bg-white/1">
 <div className="flex items-center gap-4">
 <div className="flex items-center gap-2">
 <div className="w-3 h-3 rounded-full bg-rose-500/60" />
 <div className="w-3 h-3 rounded-full bg-amber-500/60" />
 <div className="w-3 h-3 rounded-full bg-emerald-500/60" />
 </div>
 <div className="flex items-center gap-2 text-xs font-semibold text-white/30 uppercase tracking-widest font-jet-mono">
 <Terminal className="w-3.5 h-3.5 text-p" />
 <span>profy_api // live_request_monitor</span>
 </div>
 </div>
 <div className="flex items-center gap-2">
 <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
 <span className="text-xs font-semibold text-emerald-400 uppercase tracking-widest font-jet-mono">LIVE</span>
 </div>
 </div>

 {/* Log Lines */}
 <div className="p-6 space-y-2 font-jet-mono">
 {TERMINAL_LOGS.map((log, i) => (
 <motion.div
 key={i}
 initial={{ opacity: 0, x: -10 }}
 animate={{ opacity: 1, x: 0 }}
 transition={{ delay: i * 0.05 }}
 className="flex items-center gap-4 text-xs py-2.5 px-4 rounded-[10px] hover:bg-white/2 transition-colors group/log cursor-default"
 >
 <span className="text-white/20 shrink-0 w-16">{log.ts}</span>
 <span className={cn("font-semibold uppercase shrink-0 w-14", getMethodColor(log.method))}>{log.method}</span>
 <span className="text-white/50 flex-1 truncate group-hover/log:text-white/80 transition-colors">{log.endpoint}</span>
 <span className={cn("font-semibold shrink-0 w-10 text-right", getStatusColor(log.status))}>{log.status}</span>
 <span className="text-white/20 shrink-0 w-16 text-right">{log.ms}ms</span>
 </motion.div>
 ))}

 {/* Blinking cursor */}
 <div className="flex items-center gap-3 px-4 py-2 text-xs">
 <span className="text-white/20">{'>'}</span>
 <span className="w-2 h-4 bg-p/70 animate-pulse inline-block" />
 </div>
 </div>

 {/* Footer Stats */}
 <div className="flex items-center justify-between px-6 py-4 border-t border-white/5 bg-white/1 flex-wrap gap-4">
 {[
 { label: 'Total Requests Today', val: '18,031', color: 'text-white' },
 { label: 'Avg Latency', val: '56ms', color: 'text-cyan-400' },
 { label: 'Error Rate', val: '0.04%', color: 'text-emerald-400' },
 { label: 'Rate Limit Used', val: '43%', color: 'text-amber-400' },
 ].map(s => (
 <div key={s.label} className="flex items-center gap-3">
 <span className="text-xs text-white/20 font-semibold uppercase tracking-widest">{s.label}</span>
 <span className={cn("text-xs font-semibold font-jet-mono", s.color)}>{s.val}</span>
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
 onClick={(e) => e.target === e.currentTarget && handleCloseCreateModal()}
 >
 <motion.div
 initial={{ opacity: 0, scale: 0.95, y: 20 }}
 animate={{ opacity: 1, scale: 1, y: 0 }}
 exit={{ opacity: 0, scale: 0.95 }}
 className="w-full max-w-lg rounded-4xl bg-[#080808] border border-white/10 p-8 space-y-8 shadow-[0_0_80px_rgba(0,0,0,1)] relative overflow-hidden"
 >
 <div className="absolute inset-0 bg-linear-to-br from-p/5 to-transparent pointer-events-none" />
 
 <div className="relative z-10 space-y-2">
 <div className="flex items-center gap-3 text-p text-xs font-semibold uppercase tracking-[0.3em] font-jet-mono">
 <Key className="w-4 h-4" />
 <span>Key Generation Sequence</span>
 </div>
 <h3 className="text-2xl font-semibold text-white uppercase tracking-tight">Create New API Key</h3>
 </div>

 <div className="relative z-10 space-y-6">
 <div className="space-y-3">
 <label className="text-xs font-semibold text-white/30 uppercase tracking-[0.3em]">Key Identity Label</label>
 <input
 value={newKeyName}
 onChange={e => setNewKeyName(e.target.value)}
 placeholder="e.g. Production Trading Node"
 className="w-full h-14 bg-white/3 border border-white/10 rounded-2xl px-5 text-sm font-semibold text-white placeholder:text-white/20 outline-none focus:border-p/50 transition-all font-jet-mono"
 />
 </div>

 <div className="space-y-3">
 <label className="text-xs font-semibold text-white/30 uppercase tracking-[0.3em]">Permission Scope</label>
 <div className="flex flex-wrap gap-3">
 {['READ', 'TRADE', 'ANALYTICS', 'ADMIN'].map(p => (
 <button
 key={p}
 onClick={() => setNewKeyPerms(prev =>
 prev.includes(p) ? prev.filter(x => x !== p) : [...prev, p]
 )}
 className={cn(
"px-4 py-2 rounded-[10px] text-xs font-semibold uppercase tracking-widest border transition-all",
 newKeyPerms.includes(p) ? PERMISSION_COLORS[p] :"bg-white/2 border-white/5 text-white/30 hover:border-white/15"
 )}
 >
 {p}
 </button>
 ))}
 </div>
 </div>

 <div className="p-4 rounded-[14px] bg-amber-500/5 border border-amber-500/20 flex items-start gap-3">
 <AlertCircle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
 <p className="text-xs text-white/40 font-semibold uppercase tracking-wider leading-relaxed">
 The key will only be shown once upon creation. Store it securely in your vault.
 </p>
 </div>
 </div>

 <div className="flex gap-4 relative z-10">
 <Button
 onClick={handleCloseCreateModal}
 className="flex-1 h-12 bg-white/5 border border-white/10 hover:bg-white/10 text-white text-sm font-semibold uppercase tracking-widest rounded-[14px]"
 >
 Cancel
 </Button>
 <Button
 onClick={handleCreateKey}
 disabled={!newKeyName.trim() || newKeyPerms.length === 0}
 className="flex-2 h-12 bg-white text-black hover:bg-white/90 text-sm font-semibold uppercase tracking-[0.2em] rounded-[14px] shadow-[0_0_20px_rgba(255,255,255,0.1)] disabled:opacity-30"
 >
 Generate Key
 </Button>
 </div>
 </motion.div>
 </motion.div>
 )}
 </AnimatePresence>
 </div>
 );
}
