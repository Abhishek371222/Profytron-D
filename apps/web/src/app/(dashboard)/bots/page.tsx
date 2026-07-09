'use client';

import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { vpsApi, type VpsAccount, type BotInstance } from '@/lib/api/vps';
import { motion, AnimatePresence } from 'framer-motion';
import {
  DashboardPage,
  DashboardBreadcrumbs,
  DashboardPageHeader,
  DashButton,
  DashStatCard,
} from '@/components/dashboard/DashboardPrimitives';
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
  AWS: 'from-chart-4/10 to-chart-1/10 border-chart-4/15',
  DIGITALOCEAN: 'from-primary/10 to-chart-5/10 border-primary/15',
  LINODE: 'from-chart-3/10 to-primary/10 border-chart-3/15',
  VULTR: 'from-chart-2/10 to-chart-4/10 border-chart-2/15',
};

const STATUS_CONFIG: Record<string, { dot: string; badge: string; label: string }> = {
  RUNNING: {
    dot: 'bg-chart-3 shadow-[0_0_8px_var(--chart-3)]',
    badge: 'bg-chart-3/10 text-chart-3 border-chart-3/20',
    label: 'Running',
  },
  STOPPED: {
    dot: 'bg-foreground/20',
    badge: 'bg-foreground/5 text-foreground/30 border-border',
    label: 'Stopped',
  },
  PROVISIONING: {
    dot: 'bg-chart-5 animate-pulse',
    badge: 'bg-chart-5/10 text-chart-5 border-chart-5/20',
    label: 'Provisioning',
  },
  ERROR: {
    dot: 'bg-destructive',
    badge: 'bg-destructive/10 text-destructive border-destructive/20',
    label: 'Error',
  },
};

function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.STOPPED;
  return (
    <span className={cn('inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-micro font-bold uppercase tracking-widest border', cfg.badge)}>
      <span className={cn('w-1.5 h-1.5 rounded-full', cfg.dot)} />
      {cfg.label}
    </span>
  );
}

function BotRow({ bot, onStart, onStop }: { bot: BotInstance; onStart: () => void; onStop: () => void }) {
  const isRunning = bot.status === 'RUNNING';
  return (
    <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/25 border border-[var(--card-border)] hover:border-white/[0.1] transition-all group">
      <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center shrink-0', isRunning ? 'bg-chart-3/10 border border-chart-3/20' : 'bg-foreground/5 border border-border')}>
        <Bot className={cn('w-4 h-4', isRunning ? 'text-chart-3' : 'text-foreground/25')} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold text-foreground truncate">{bot.name}</p>
        <p className="text-micro text-foreground/25 uppercase tracking-widest">
          {isRunning && bot.processPid ? `PID ${bot.processPid}` : 'Idle'}
        </p>
      </div>
      <StatusBadge status={bot.status} />
      <button
        onClick={isRunning ? onStop : onStart}
        className={cn(
          'w-8 h-8 rounded-lg flex items-center justify-center transition-all',
          isRunning
            ? 'bg-destructive/8 hover:bg-destructive/18 text-destructive border border-destructive/15'
            : 'bg-chart-3/8 hover:bg-chart-3/18 text-chart-3 border border-chart-3/15',
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
  const gradientClass = PROVIDER_COLORS[providerKey] ?? 'from-white/5 to-white/5 border-border';

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06, duration: 0.35, ease: 'easeOut' }}
      whileHover={{ y: -4 }}
      className={cn('rounded-2xl border bg-gradient-to-br overflow-hidden transition-shadow duration-300 hover:shadow-[var(--shadow-card-hover)]', gradientClass)}
    >
      <div className="p-5 space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className={cn('w-11 h-11 rounded-xl flex items-center justify-center border', isRunning ? 'bg-chart-3/10 border-chart-3/20' : 'bg-foreground/5 border-border')}>
              <Server className={cn('w-5 h-5', isRunning ? 'text-chart-3' : 'text-foreground/30')} />
            </div>
            <div>
              <p className="text-sm font-bold text-foreground">{PROVIDER_LABELS[providerKey] ?? vps.provider}</p>
              <p className="text-micro text-foreground/30 uppercase tracking-widest mt-0.5">{vps.hostname}</p>
            </div>
          </div>
          <StatusBadge status={vps.status} />
        </div>

        {/* Specs */}
        <div className="grid grid-cols-3 gap-3">
          <div className="p-3 rounded-xl bg-foreground/5 border border-[var(--card-border)] text-center">
            <Cpu className="w-4 h-4 text-foreground/25 mx-auto mb-1" />
            <p className="text-sm font-bold text-foreground">{vps.cpuCores}</p>
            <p className="text-micro text-foreground/20 uppercase tracking-widest">vCPU</p>
          </div>
          <div className="p-3 rounded-xl bg-foreground/5 border border-[var(--card-border)] text-center">
            <MemoryStick className="w-4 h-4 text-foreground/25 mx-auto mb-1" />
            <p className="text-sm font-bold text-foreground">{vps.memoryGb}GB</p>
            <p className="text-micro text-foreground/20 uppercase tracking-widest">RAM</p>
          </div>
          <div className="p-3 rounded-xl bg-foreground/5 border border-[var(--card-border)] text-center">
            <Activity className="w-4 h-4 text-foreground/25 mx-auto mb-1" />
            <p className={cn('text-sm font-bold', runningBots > 0 ? 'text-chart-3' : 'text-foreground')}>{runningBots}</p>
            <p className="text-micro text-foreground/20 uppercase tracking-widest">Active</p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            {isRunning ? (
              <DashButton
                variant="ghost"
                onClick={() => stopMutation.mutate()}
                disabled={stopMutation.isPending}
                className="bg-destructive/8 border-destructive/20 text-destructive hover:bg-destructive/15 hover:text-destructive"
              >
                {stopMutation.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <Square className="w-3 h-3" />}
                Stop
              </DashButton>
            ) : (
              <DashButton
                variant="ghost"
                onClick={() => startMutation.mutate()}
                disabled={startMutation.isPending}
                className="bg-chart-3/8 border-chart-3/20 text-chart-3 hover:bg-chart-3/15 hover:text-chart-3"
              >
                {startMutation.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <Play className="w-3 h-3" />}
                Start
              </DashButton>
            )}
            <button
              onClick={() => setExpanded((v) => !v)}
              className="h-8 px-3 rounded-lg bg-foreground/5 border border-border text-foreground/40 text-micro font-bold uppercase tracking-widest hover:bg-foreground/10 hover:text-foreground transition-all flex items-center gap-1.5"
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
            className="w-8 h-8 rounded-lg bg-muted border border-[var(--card-border)] text-foreground/20 hover:text-destructive hover:bg-destructive/8 hover:border-destructive/15 flex items-center justify-center transition-all"
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
              <p className="text-micro text-foreground/20 uppercase tracking-widest font-bold pt-3 mb-2">
                {bots.length} bot instance{bots.length !== 1 ? 's' : ''}
              </p>
              {botsLoading ? (
                <div className="h-14 rounded-xl bg-foreground/3 animate-pulse" />
              ) : bots.length === 0 ? (
                <div className="py-6 text-center">
                  <Bot className="w-8 h-8 text-foreground/10 mx-auto mb-2" />
                  <p className="text-xs text-foreground/20">No bots on this server</p>
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
        className="w-full max-w-md bg-background border border-border rounded-3xl p-6 space-y-5 shadow-2xl"
      >
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-foreground uppercase tracking-widest">Provision Server</h3>
            <p className="text-micro text-foreground/30 mt-0.5">Deploy a cloud VPS to host your trading bots 24/7</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-foreground/5 border border-border flex items-center justify-center hover:bg-foreground/10 transition-all">
            <Plus className="w-4 h-4 text-foreground/40 rotate-45" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-micro font-bold text-foreground/30 uppercase tracking-widest block mb-2">Cloud Provider</label>
            <div className="grid grid-cols-2 gap-2">
              {PROVIDERS.map((p) => (
                <button
                  key={p}
                  onClick={() => setProvider(p)}
                  className={cn(
                    'p-3 rounded-xl border text-left transition-all',
                    provider === p
                      ? 'bg-primary/10 border-primary/30 text-foreground'
                      : 'bg-muted border-[var(--card-border)] text-foreground/40 hover:border-border hover:text-foreground/60',
                  )}
                >
                  <p className="text-xs font-bold">{p}</p>
                  <p className="text-micro text-foreground/25 mt-0.5">{PROVIDER_LABELS[p].split(' ')[0]}</p>
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-micro font-bold text-foreground/30 uppercase tracking-widest block mb-2">vCPU Cores</label>
              <div className="flex gap-2">
                {[1, 2, 4].map((c) => (
                  <button
                    key={c}
                    onClick={() => setCpu(c)}
                    className={cn(
                      'flex-1 h-10 rounded-xl border text-sm font-bold transition-all',
                      cpu === c ? 'bg-primary text-primary-foreground border-primary/50' : 'bg-muted text-foreground/40 border-[var(--card-border)] hover:border-border',
                    )}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-micro font-bold text-foreground/30 uppercase tracking-widest block mb-2">RAM (GB)</label>
              <div className="flex gap-2">
                {[2, 4, 8].map((r) => (
                  <button
                    key={r}
                    onClick={() => setRam(r)}
                    className={cn(
                      'flex-1 h-10 rounded-xl border text-sm font-bold transition-all',
                      ram === r ? 'bg-primary text-primary-foreground border-primary/50' : 'bg-muted text-foreground/40 border-[var(--card-border)] hover:border-border',
                    )}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-muted border border-[var(--card-border)]">
            <p className="text-micro text-foreground/30 uppercase tracking-widest mb-1">Estimated Cost</p>
            <p className="text-xl font-bold text-foreground">~$20<span className="text-sm text-foreground/30 font-normal">/month</span></p>
          </div>
        </div>

        <DashButton
          variant="primary"
          onClick={() => createMutation.mutate()}
          disabled={createMutation.isPending}
          className="w-full"
        >
          {createMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Server className="w-4 h-4" />}
          {createMutation.isPending ? 'Provisioning...' : 'Provision Instance'}
        </DashButton>
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
    <DashboardPage>
      <DashboardBreadcrumbs items={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Bots' }]} />

      <DashboardPageHeader
        title="Trading Bots"
        description="Cloud servers, bot processes, and 24/7 automated execution."
        icon={Zap}
        actions={
          <DashButton variant="primary" onClick={() => setShowProvision(true)} className="gap-2">
            <Plus className="w-4 h-4" />
            New Server
          </DashButton>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <DashStatCard label="Total Servers" value={vpsList.length} />
        <DashStatCard label="Running" value={totalRunning} className="border-chart-3/15 bg-chart-3/5" />
        <DashStatCard label="Monthly Cost" value={`$${totalCost.toFixed(0)}`} />
      </div>

      {/* VPS Grid */}
      {isLoading ? (
        <div className="grid gap-4">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="h-48 rounded-2xl bg-muted/25 border border-[var(--card-border)] animate-pulse" />
          ))}
        </div>
      ) : vpsList.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="py-20 rounded-2xl bg-muted/50 border border-[var(--card-border)] flex flex-col items-center gap-5"
        >
          <div className="w-20 h-20 rounded-3xl bg-muted border border-[var(--card-border)] flex items-center justify-center">
            <Server className="w-10 h-10 text-foreground/10" />
          </div>
          <div className="text-center space-y-1.5">
            <p className="text-sm font-bold text-foreground/30 uppercase tracking-[0.3em]">No Servers Provisioned</p>
            <p className="text-xs text-foreground/15 max-w-sm">Provision a cloud server to host your trading bots 24/7 without keeping your computer on</p>
          </div>
          <DashButton
            variant="ghost"
            onClick={() => setShowProvision(true)}
            className="bg-primary/10 border-primary/20 text-primary hover:bg-primary/20 hover:text-primary"
          >
            <Plus className="w-4 h-4" />
            Provision First Server
          </DashButton>
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
    </DashboardPage>
  );
}
