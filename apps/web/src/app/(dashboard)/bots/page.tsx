'use client';

import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { vpsApi, type VpsAccount, type BotInstance } from '@/lib/api/vps';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import {
  Server, Bot, Play, Square, Trash2, Plus, Cpu, Activity,
  AlertCircle, CheckCircle, Loader2, Zap, Globe, ChevronDown
} from 'lucide-react';
import { MemoryStick } from 'lucide-react';
import { toast } from 'sonner';

const PROVIDERS = ['AWS', 'DIGITALOCEAN', 'LINODE', 'VULTR'] as const;
type Provider = (typeof PROVIDERS)[number];

const PROVIDER_LABELS: Record<Provider, string> = {
  AWS: 'Amazon Web Services',
  DIGITALOCEAN: 'DigitalOcean',
  LINODE: 'Linode / Akamai',
  VULTR: 'Vultr',
};

const PROVIDER_COLORS: Record<Provider, string> = {
  AWS: 'from-amber-500/10 to-orange-500/10 border-amber-500/15',
  DIGITALOCEAN: 'from-blue-500/10 to-cyan-500/10 border-blue-500/15',
  LINODE: 'from-green-500/10 to-emerald-500/10 border-green-500/15',
  VULTR: 'from-violet-500/10 to-purple-500/10 border-violet-500/15',
};

const STATUS_CONFIG: Record<string, { dot: string; badge: string; label: string }> = {
  RUNNING: {
    dot: 'bg-emerald-400 shadow-[0_0_8px_#34d399]',
    badge: 'bg-emerald-400/10 text-emerald-400 border-emerald-400/20',
    label: 'Running',
  },
  STOPPED: {
    dot: 'bg-white/20',
    badge: 'bg-white/5 text-white/30 border-white/10',
    label: 'Stopped',
  },
  PROVISIONING: {
    dot: 'bg-blue-400 animate-pulse',
    badge: 'bg-blue-400/10 text-blue-400 border-blue-400/20',
    label: 'Provisioning',
  },
  ERROR: {
    dot: 'bg-red-400',
    badge: 'bg-red-400/10 text-red-400 border-red-400/20',
    label: 'Error',
  },
};

function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.STOPPED;
  return (
    <span className={cn('inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border', cfg.badge)}>
      <span className={cn('w-1.5 h-1.5 rounded-full', cfg.dot)} />
      {cfg.label}
    </span>
  );
}

function BotRow({ bot, onStart, onStop }: { bot: BotInstance; onStart: () => void; onStop: () => void }) {
  const isRunning = bot.status === 'RUNNING';
  return (
    <div className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.025] border border-white/[0.06] hover:border-white/[0.1] transition-all group">
      <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center shrink-0', isRunning ? 'bg-emerald-400/10 border border-emerald-400/20' : 'bg-white/5 border border-white/10')}>
        <Bot className={cn('w-4 h-4', isRunning ? 'text-emerald-400' : 'text-white/25')} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold text-white truncate">{bot.name}</p>
        <p className="text-[10px] text-white/25 uppercase tracking-widest">
          {isRunning && bot.processPid ? `PID ${bot.processPid}` : 'Idle'}
        </p>
      </div>
      <StatusBadge status={bot.status} />
      <button
        onClick={isRunning ? onStop : onStart}
        className={cn(
          'w-8 h-8 rounded-lg flex items-center justify-center transition-all',
          isRunning
            ? 'bg-red-400/8 hover:bg-red-400/18 text-red-400 border border-red-400/15'
            : 'bg-emerald-400/8 hover:bg-emerald-400/18 text-emerald-400 border border-emerald-400/15',
        )}
      >
        {isRunning ? <Square className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
      </button>
    </div>
  );
}

function VpsCard({ vps, index }: { vps: VpsAccount; index: number }) {
  const queryClient = useQueryClient();
  const [expanded, setExpanded] = React.useState(false);

  const { data: bots = [], isLoading: botsLoading } = useQuery({
    queryKey: ['vps-bots', vps.id],
    queryFn: () => vpsApi.getBots(vps.id),
    enabled: expanded,
  });

  const startMutation = useMutation({
    mutationFn: () => vpsApi.start(vps.id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['vps'] }); toast.success('VPS starting...'); },
    onError: () => toast.error('Failed to start VPS'),
  });

  const stopMutation = useMutation({
    mutationFn: () => vpsApi.stop(vps.id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['vps'] }); toast.success('VPS stopped'); },
    onError: () => toast.error('Failed to stop VPS'),
  });

  const deleteMutation = useMutation({
    mutationFn: () => vpsApi.remove(vps.id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['vps'] }); toast.success('VPS deleted'); },
    onError: () => toast.error('Failed to delete VPS'),
  });

  const startBotMutation = useMutation({
    mutationFn: (botId: string) => vpsApi.startBot(botId),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['vps-bots', vps.id] }); toast.success('Bot started'); },
    onError: () => toast.error('Failed to start bot'),
  });

  const stopBotMutation = useMutation({
    mutationFn: (botId: string) => vpsApi.stopBot(botId),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['vps-bots', vps.id] }); toast.success('Bot stopped'); },
    onError: () => toast.error('Failed to stop bot'),
  });

  const isRunning = vps.status === 'RUNNING';
  const runningBots = bots.filter((b: any) => b.status === 'RUNNING').length;
  const providerKey = vps.provider as Provider;
  const gradientClass = PROVIDER_COLORS[providerKey] ?? 'from-white/5 to-white/5 border-white/8';

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06 }}
      className={cn('rounded-2xl border bg-gradient-to-br overflow-hidden', gradientClass)}
    >
      <div className="p-5 space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className={cn('w-11 h-11 rounded-xl flex items-center justify-center border', isRunning ? 'bg-emerald-400/10 border-emerald-400/20' : 'bg-white/5 border-white/10')}>
              <Server className={cn('w-5 h-5', isRunning ? 'text-emerald-400' : 'text-white/30')} />
            </div>
            <div>
              <p className="text-sm font-bold text-white">{PROVIDER_LABELS[providerKey] ?? vps.provider}</p>
              <p className="text-[10px] text-white/30 uppercase tracking-widest mt-0.5">{vps.hostname}</p>
            </div>
          </div>
          <StatusBadge status={vps.status} />
        </div>

        {/* Specs */}
        <div className="grid grid-cols-3 gap-3">
          <div className="p-3 rounded-xl bg-black/20 border border-white/[0.06] text-center">
            <Cpu className="w-4 h-4 text-white/25 mx-auto mb-1" />
            <p className="text-sm font-bold text-white">{vps.cpuCores}</p>
            <p className="text-[9px] text-white/20 uppercase tracking-widest">vCPU</p>
          </div>
          <div className="p-3 rounded-xl bg-black/20 border border-white/[0.06] text-center">
            <MemoryStick className="w-4 h-4 text-white/25 mx-auto mb-1" />
            <p className="text-sm font-bold text-white">{vps.memoryGb}GB</p>
            <p className="text-[9px] text-white/20 uppercase tracking-widest">RAM</p>
          </div>
          <div className="p-3 rounded-xl bg-black/20 border border-white/[0.06] text-center">
            <Activity className="w-4 h-4 text-white/25 mx-auto mb-1" />
            <p className={cn('text-sm font-bold', runningBots > 0 ? 'text-emerald-400' : 'text-white')}>{runningBots}</p>
            <p className="text-[9px] text-white/20 uppercase tracking-widest">Active</p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            {isRunning ? (
              <button
                onClick={() => stopMutation.mutate()}
                disabled={stopMutation.isPending}
                className="h-8 px-3 rounded-lg bg-red-400/8 border border-red-400/20 text-red-400 text-[10px] font-bold uppercase tracking-widest hover:bg-red-400/15 disabled:opacity-40 flex items-center gap-1.5 transition-all"
              >
                {stopMutation.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <Square className="w-3 h-3" />}
                Stop
              </button>
            ) : (
              <button
                onClick={() => startMutation.mutate()}
                disabled={startMutation.isPending}
                className="h-8 px-3 rounded-lg bg-emerald-400/8 border border-emerald-400/20 text-emerald-400 text-[10px] font-bold uppercase tracking-widest hover:bg-emerald-400/15 disabled:opacity-40 flex items-center gap-1.5 transition-all"
              >
                {startMutation.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <Play className="w-3 h-3" />}
                Start
              </button>
            )}
            <button
              onClick={() => setExpanded((v) => !v)}
              className="h-8 px-3 rounded-lg bg-white/5 border border-white/10 text-white/40 text-[10px] font-bold uppercase tracking-widest hover:bg-white/10 hover:text-white transition-all flex items-center gap-1.5"
            >
              <Bot className="w-3 h-3" />
              Bots
              <motion.span animate={{ rotate: expanded ? 180 : 0 }} transition={{ duration: 0.2 }}>
                <ChevronDown className="w-3 h-3" />
              </motion.span>
            </button>
          </div>
          <button
            onClick={() => {
              if (confirm('Delete this VPS instance? This action cannot be undone.')) {
                deleteMutation.mutate();
              }
            }}
            disabled={deleteMutation.isPending}
            className="w-8 h-8 rounded-lg bg-white/[0.03] border border-white/[0.06] text-white/20 hover:text-red-400 hover:bg-red-400/8 hover:border-red-400/15 flex items-center justify-center transition-all"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Bot List */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="px-5 pb-5 pt-1 border-t border-white/[0.05] space-y-2">
              <p className="text-[10px] text-white/20 uppercase tracking-widest font-bold pt-3 mb-2">
                {bots.length} bot instance{bots.length !== 1 ? 's' : ''}
              </p>
              {botsLoading ? (
                <div className="h-14 rounded-xl bg-white/3 animate-pulse" />
              ) : bots.length === 0 ? (
                <div className="py-6 text-center">
                  <Bot className="w-8 h-8 text-white/10 mx-auto mb-2" />
                  <p className="text-xs text-white/20">No bots on this server</p>
                </div>
              ) : (
                bots.map((bot: any) => (
                  <BotRow
                    key={bot.id}
                    bot={bot}
                    onStart={() => startBotMutation.mutate(bot.id)}
                    onStop={() => stopBotMutation.mutate(bot.id)}
                  />
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function ProvisionModal({ onClose }: { onClose: () => void }) {
  const queryClient = useQueryClient();
  const [provider, setProvider] = React.useState<Provider>('DIGITALOCEAN');
  const [cpu, setCpu] = React.useState(2);
  const [ram, setRam] = React.useState(4);

  const createMutation = useMutation({
    mutationFn: () => vpsApi.create({ provider, cpuCores: cpu, memoryGb: ram }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vps'] });
      onClose();
      toast.success('VPS provisioned successfully');
    },
    onError: () => toast.error('Failed to provision VPS'),
  });

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0, y: 10 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 10 }}
        className="w-full max-w-md bg-[#0c0c14] border border-white/10 rounded-3xl p-6 space-y-5 shadow-2xl"
      >
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-white uppercase tracking-widest">Provision Server</h3>
            <p className="text-[10px] text-white/30 mt-0.5">Deploy a cloud VPS to host your trading bots 24/7</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-all">
            <Plus className="w-4 h-4 text-white/40 rotate-45" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-[10px] font-bold text-white/30 uppercase tracking-widest block mb-2">Cloud Provider</label>
            <div className="grid grid-cols-2 gap-2">
              {PROVIDERS.map((p) => (
                <button
                  key={p}
                  onClick={() => setProvider(p)}
                  className={cn(
                    'p-3 rounded-xl border text-left transition-all',
                    provider === p
                      ? 'bg-indigo-500/10 border-indigo-500/30 text-white'
                      : 'bg-white/[0.03] border-white/[0.06] text-white/40 hover:border-white/10 hover:text-white/60',
                  )}
                >
                  <p className="text-xs font-bold">{p}</p>
                  <p className="text-[10px] text-white/25 mt-0.5">{PROVIDER_LABELS[p].split(' ')[0]}</p>
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] font-bold text-white/30 uppercase tracking-widest block mb-2">vCPU Cores</label>
              <div className="flex gap-2">
                {[1, 2, 4].map((c) => (
                  <button
                    key={c}
                    onClick={() => setCpu(c)}
                    className={cn(
                      'flex-1 h-10 rounded-xl border text-sm font-bold transition-all',
                      cpu === c ? 'bg-indigo-500 text-white border-indigo-500/50' : 'bg-white/[0.03] text-white/40 border-white/[0.06] hover:border-white/10',
                    )}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-[10px] font-bold text-white/30 uppercase tracking-widest block mb-2">RAM (GB)</label>
              <div className="flex gap-2">
                {[2, 4, 8].map((r) => (
                  <button
                    key={r}
                    onClick={() => setRam(r)}
                    className={cn(
                      'flex-1 h-10 rounded-xl border text-sm font-bold transition-all',
                      ram === r ? 'bg-indigo-500 text-white border-indigo-500/50' : 'bg-white/[0.03] text-white/40 border-white/[0.06] hover:border-white/10',
                    )}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.06]">
            <p className="text-[10px] text-white/30 uppercase tracking-widest mb-1">Estimated Cost</p>
            <p className="text-xl font-bold text-white">~$20<span className="text-sm text-white/30 font-normal">/month</span></p>
          </div>
        </div>

        <button
          onClick={() => createMutation.mutate()}
          disabled={createMutation.isPending}
          className="w-full h-11 bg-indigo-500 hover:bg-indigo-500/90 text-white rounded-xl text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-2 disabled:opacity-50 transition-all"
        >
          {createMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Server className="w-4 h-4" />}
          {createMutation.isPending ? 'Provisioning...' : 'Provision Instance'}
        </button>
      </motion.div>
    </motion.div>
  );
}

export default function BotsPage() {
  const [showProvision, setShowProvision] = React.useState(false);

  const { data: vpsList = [], isLoading } = useQuery({
    queryKey: ['vps'],
    queryFn: () => vpsApi.list(),
  });

  const totalRunning = vpsList.filter((v: any) => v.status === 'RUNNING').length;
  const totalCost = vpsList.reduce((sum: number, v: any) => sum + (v.monthlyPrice ?? 0), 0);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center">
            <Zap className="w-5 h-5 text-violet-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">Trading Bots</h1>
            <p className="text-xs text-white/30 uppercase tracking-[0.3em] font-semibold mt-0.5">Servers · Bot Processes · Cloud Infrastructure</p>
          </div>
        </div>
        <button
          onClick={() => setShowProvision(true)}
          className="flex items-center gap-2 px-5 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-bold uppercase tracking-widest hover:bg-indigo-500/20 transition-all"
        >
          <Plus className="w-4 h-4" />
          New Server
        </button>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-2xl bg-white/[0.025] border border-white/[0.07] p-5 text-center">
          <p className="text-2xl font-bold text-white">{vpsList.length}</p>
          <p className="text-[10px] text-white/25 uppercase tracking-widest mt-1.5 font-semibold">Total Servers</p>
        </div>
        <div className="rounded-2xl bg-gradient-to-br from-emerald-500/8 to-cyan-500/8 border border-emerald-500/15 p-5 text-center">
          <p className="text-2xl font-bold text-emerald-400">{totalRunning}</p>
          <div className="flex items-center justify-center gap-1.5 mt-1.5">
            {totalRunning > 0 && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_6px_#34d399]" />}
            <p className="text-[10px] text-white/25 uppercase tracking-widest font-semibold">Running</p>
          </div>
        </div>
        <div className="rounded-2xl bg-white/[0.025] border border-white/[0.07] p-5 text-center">
          <p className="text-2xl font-bold text-white">${totalCost}</p>
          <p className="text-[10px] text-white/25 uppercase tracking-widest mt-1.5 font-semibold">Monthly Cost</p>
        </div>
      </div>

      {/* VPS Grid */}
      {isLoading ? (
        <div className="grid gap-4">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="h-48 rounded-2xl bg-white/[0.025] border border-white/[0.06] animate-pulse" />
          ))}
        </div>
      ) : vpsList.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="py-20 rounded-2xl bg-white/[0.015] border border-white/[0.06] flex flex-col items-center gap-5"
        >
          <div className="w-20 h-20 rounded-3xl bg-white/[0.03] border border-white/[0.08] flex items-center justify-center">
            <Server className="w-10 h-10 text-white/10" />
          </div>
          <div className="text-center space-y-1.5">
            <p className="text-sm font-bold text-white/30 uppercase tracking-[0.3em]">No Servers Provisioned</p>
            <p className="text-xs text-white/15 max-w-sm">Provision a cloud server to host your trading bots 24/7 without keeping your computer on</p>
          </div>
          <button
            onClick={() => setShowProvision(true)}
            className="h-10 px-7 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-bold uppercase tracking-widest hover:bg-indigo-500/20 transition-all flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Provision First Server
          </button>
        </motion.div>
      ) : (
        <div className="grid gap-4">
          {vpsList.map((vps: any, i: number) => (
            <VpsCard key={vps.id} vps={vps} index={i} />
          ))}
        </div>
      )}

      <AnimatePresence>
        {showProvision && <ProvisionModal onClose={() => setShowProvision(false)} />}
      </AnimatePresence>
    </div>
  );
}
