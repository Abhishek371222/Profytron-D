'use client';

import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { vpsApi, type VpsAccount, type BotInstance } from '@/lib/api/vps';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import {
  Server, Bot, Play, Square, Trash2, Plus, Cpu, MemoryStick,
  Activity, AlertCircle, CheckCircle, Loader2, Zap, Globe
} from 'lucide-react';
import { toast } from 'sonner';

const PROVIDERS = ['AWS', 'DIGITALOCEAN', 'LINODE', 'VULTR'] as const;
type Provider = (typeof PROVIDERS)[number];

const PROVIDER_LABELS: Record<Provider, string> = {
  AWS: 'Amazon Web Services',
  DIGITALOCEAN: 'DigitalOcean',
  LINODE: 'Linode / Akamai',
  VULTR: 'Vultr',
};

const STATUS_CONFIG: Record<string, { color: string; icon: React.ComponentType<{ className?: string }>; label: string }> = {
  RUNNING: { color: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20', icon: CheckCircle, label: 'Running' },
  STOPPED: { color: 'text-white/30 bg-white/5 border-white/10', icon: Square, label: 'Stopped' },
  PROVISIONING: { color: 'text-blue-400 bg-blue-400/10 border-blue-400/20', icon: Loader2, label: 'Provisioning' },
  ERROR: { color: 'text-red-400 bg-red-400/10 border-red-400/20', icon: AlertCircle, label: 'Error' },
};

function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.STOPPED;
  return (
    <span className={cn('inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border', cfg.color)}>
      {status === 'RUNNING' && <CheckCircle className="w-3 h-3" />}
      {status === 'STOPPED' && <Square className="w-3 h-3" />}
      {status === 'PROVISIONING' && <Loader2 className="w-3 h-3 animate-spin" />}
      {status === 'ERROR' && <AlertCircle className="w-3 h-3" />}
      {cfg.label}
    </span>
  );
}

function BotRow({ bot, onStart, onStop }: { bot: BotInstance; onStart: () => void; onStop: () => void }) {
  const isRunning = bot.status === 'RUNNING';
  return (
    <div className="flex items-center gap-3 p-3 rounded-xl bg-white/3 border border-white/5">
      <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center', isRunning ? 'bg-emerald-400/10' : 'bg-white/5')}>
        <Bot className={cn('w-4 h-4', isRunning ? 'text-emerald-400' : 'text-white/30')} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold text-white truncate">{bot.name}</p>
        <p className="text-[10px] text-white/30 uppercase tracking-widest">
          {isRunning && bot.processPid ? `PID ${bot.processPid}` : 'Idle'}
        </p>
      </div>
      <StatusBadge status={bot.status} />
      <button
        onClick={isRunning ? onStop : onStart}
        className={cn(
          'w-8 h-8 rounded-lg flex items-center justify-center transition-colors',
          isRunning ? 'bg-red-400/10 hover:bg-red-400/20 text-red-400' : 'bg-emerald-400/10 hover:bg-emerald-400/20 text-emerald-400',
        )}
      >
        {isRunning ? <Square className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
      </button>
    </div>
  );
}

function VpsCard({ vps }: { vps: VpsAccount }) {
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

  return (
    <motion.div
      layout
      className="p-5 rounded-2xl bg-white/3 border border-white/8 space-y-4"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className={cn('w-11 h-11 rounded-xl flex items-center justify-center border', isRunning ? 'bg-emerald-400/10 border-emerald-400/20' : 'bg-white/5 border-white/10')}>
            <Server className={cn('w-5 h-5', isRunning ? 'text-emerald-400' : 'text-white/30')} />
          </div>
          <div>
            <p className="text-sm font-bold text-white">{PROVIDER_LABELS[vps.provider as Provider] ?? vps.provider}</p>
            <p className="text-[10px] text-white/30 uppercase tracking-widest">{vps.hostname}</p>
          </div>
        </div>
        <StatusBadge status={vps.status} />
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="p-3 rounded-xl bg-white/3 text-center">
          <Cpu className="w-4 h-4 text-white/30 mx-auto mb-1" />
          <p className="text-sm font-bold text-white">{vps.cpuCores}</p>
          <p className="text-[9px] text-white/20 uppercase tracking-widest">vCPU</p>
        </div>
        <div className="p-3 rounded-xl bg-white/3 text-center">
          <MemoryStick className="w-4 h-4 text-white/30 mx-auto mb-1" />
          <p className="text-sm font-bold text-white">{vps.memoryGb}GB</p>
          <p className="text-[9px] text-white/20 uppercase tracking-widest">RAM</p>
        </div>
        <div className="p-3 rounded-xl bg-white/3 text-center">
          <Activity className="w-4 h-4 text-white/30 mx-auto mb-1" />
          <p className="text-sm font-bold text-white">{runningBots}</p>
          <p className="text-[9px] text-white/20 uppercase tracking-widest">Bots Active</p>
        </div>
      </div>

      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          {isRunning ? (
            <button
              onClick={() => stopMutation.mutate()}
              disabled={stopMutation.isPending}
              className="h-8 px-3 rounded-lg bg-red-400/10 border border-red-400/20 text-red-400 text-[10px] font-bold uppercase tracking-widest hover:bg-red-400/20 disabled:opacity-50 flex items-center gap-1.5 transition-colors"
            >
              {stopMutation.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <Square className="w-3 h-3" />}
              Stop
            </button>
          ) : (
            <button
              onClick={() => startMutation.mutate()}
              disabled={startMutation.isPending}
              className="h-8 px-3 rounded-lg bg-emerald-400/10 border border-emerald-400/20 text-emerald-400 text-[10px] font-bold uppercase tracking-widest hover:bg-emerald-400/20 disabled:opacity-50 flex items-center gap-1.5 transition-colors"
            >
              {startMutation.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <Play className="w-3 h-3" />}
              Start
            </button>
          )}
          <button
            onClick={() => setExpanded((v) => !v)}
            className="h-8 px-3 rounded-lg bg-white/5 text-white/40 text-[10px] font-bold uppercase tracking-widest hover:bg-white/10 transition-colors"
          >
            {expanded ? 'Hide' : 'Bots'}
          </button>
        </div>
        <button
          onClick={() => {
            if (confirm('Delete this VPS instance? This action cannot be undone.')) {
              deleteMutation.mutate();
            }
          }}
          disabled={deleteMutation.isPending}
          className="w-8 h-8 rounded-lg bg-white/5 text-white/20 hover:text-red-400 hover:bg-red-400/10 flex items-center justify-center transition-colors"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="pt-3 border-t border-white/5 space-y-2">
              <p className="text-[10px] text-white/20 uppercase tracking-widest font-bold mb-3">
                {bots.length} bot instance{bots.length !== 1 ? 's' : ''}
              </p>
              {botsLoading ? (
                <div className="h-16 rounded-xl bg-white/3 animate-pulse" />
              ) : bots.length === 0 ? (
                <p className="text-xs text-white/20 text-center py-4">No bots running on this VPS</p>
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
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="w-full max-w-md bg-bg-base border border-white/10 rounded-3xl p-6 space-y-5"
      >
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-white uppercase tracking-widest">Provision VPS Instance</h3>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10">
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
                    provider === p ? 'bg-p/10 border-p/30 text-white' : 'bg-white/3 border-white/5 text-white/40 hover:border-white/10',
                  )}
                >
                  <p className="text-xs font-bold">{p}</p>
                  <p className="text-[10px] text-white/30 mt-0.5">{PROVIDER_LABELS[p].split(' ')[0]}</p>
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] font-bold text-white/30 uppercase tracking-widest block mb-2">vCPU Cores</label>
              <div className="flex gap-2">
                {[1, 2, 4].map((c) => (
                  <button key={c} onClick={() => setCpu(c)} className={cn('flex-1 h-10 rounded-xl border text-sm font-bold transition-all', cpu === c ? 'bg-p text-white border-p/40' : 'bg-white/3 text-white/40 border-white/5 hover:border-white/10')}>
                    {c}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-[10px] font-bold text-white/30 uppercase tracking-widest block mb-2">RAM (GB)</label>
              <div className="flex gap-2">
                {[2, 4, 8].map((r) => (
                  <button key={r} onClick={() => setRam(r)} className={cn('flex-1 h-10 rounded-xl border text-sm font-bold transition-all', ram === r ? 'bg-p text-white border-p/40' : 'bg-white/3 text-white/40 border-white/5 hover:border-white/10')}>
                    {r}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-white/3 border border-white/5">
            <p className="text-[10px] text-white/30 uppercase tracking-widest mb-1">Estimated Cost</p>
            <p className="text-lg font-bold text-white">~$20<span className="text-sm text-white/30">/month</span></p>
          </div>
        </div>

        <button
          onClick={() => createMutation.mutate()}
          disabled={createMutation.isPending}
          className="w-full h-11 bg-p text-white rounded-xl text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-p/90 disabled:opacity-50"
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

  return (
    <div className="space-y-8">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <h2 className="text-2xl font-semibold text-white uppercase tracking-tight">Trading Bots</h2>
          <p className="text-xs text-white/30 uppercase tracking-widest font-semibold">Servers · Bot processes · Cloud Servers</p>
        </div>
        <button
          onClick={() => setShowProvision(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-p text-white text-xs font-bold uppercase tracking-widest hover:bg-p/90 transition-colors"
        >
          <Plus className="w-4 h-4" />
          New VPS
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl bg-white/3 border border-white/8 text-center">
          <p className="text-2xl font-bold text-white">{vpsList.length}</p>
          <p className="text-[10px] text-white/30 uppercase tracking-widest mt-1">Total VPS</p>
        </div>
        <div className="p-4 rounded-2xl bg-emerald-400/5 border border-emerald-400/15 text-center">
          <p className="text-2xl font-bold text-emerald-400">{totalRunning}</p>
          <p className="text-[10px] text-white/30 uppercase tracking-widest mt-1">Running</p>
        </div>
        <div className="p-4 rounded-2xl bg-white/3 border border-white/8 text-center">
          <p className="text-2xl font-bold text-white">${vpsList.reduce((sum: number, v: any) => sum + v.monthlyPrice, 0)}</p>
          <p className="text-[10px] text-white/30 uppercase tracking-widest mt-1">Monthly Cost</p>
        </div>
      </div>

      {/* VPS Grid */}
      {isLoading ? (
        <div className="grid gap-4">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="h-44 rounded-2xl bg-white/3 animate-pulse" />
          ))}
        </div>
      ) : vpsList.length === 0 ? (
        <div className="py-20 text-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-white/3 border border-white/8 flex items-center justify-center mx-auto">
            <Server className="w-8 h-8 text-white/10" />
          </div>
          <div className="space-y-2">
            <p className="text-sm text-white/30 uppercase tracking-widest font-semibold">No Servers</p>
            <p className="text-xs text-white/15">Provision a cloud server to host your trading bots 24/7</p>
          </div>
          <button
            onClick={() => setShowProvision(true)}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-p/15 border border-p/30 text-p text-xs font-bold uppercase tracking-widest hover:bg-p/20 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Provision First VPS
          </button>
        </div>
      ) : (
        <div className="grid gap-4">
          {vpsList.map((vps: any) => (
            <VpsCard key={vps.id} vps={vps} />
          ))}
        </div>
      )}

      <AnimatePresence>
        {showProvision && <ProvisionModal onClose={() => setShowProvision(false)} />}
      </AnimatePresence>
    </div>
  );
}
