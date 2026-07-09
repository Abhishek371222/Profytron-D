'use client';

import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Terminal, Cpu, CheckCircle2, Shield, Activity, 
  Fingerprint, Network, Check, Loader2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { DashButton } from '@/components/dashboard/DashboardPrimitives';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { strategiesApi } from '@/lib/api/strategies';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import confetti from 'canvas-confetti';

interface StrategyActivationModalProps {
  isOpen: boolean;
  onClose: () => void;
  strategy: any;
}

export function StrategyActivationModal({ isOpen, onClose, strategy }: StrategyActivationModalProps) {
  const queryClient = useQueryClient();
  const [step, setStep] = React.useState(1);
  const [paperTrading, setPaperTrading] = React.useState(true);
  const [riskMultiplier, setRiskMultiplier] = React.useState([1]);

  React.useEffect(() => {
    if (isOpen) {
      setStep(1);
    }
  }, [isOpen]);

  const activateMutation = useMutation({
    mutationFn: (data: any) => strategiesApi.activateStrategy(strategy.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-strategies'] });
      setStep(4);
      confetti({
        particleCount: 200,
        spread: 90,
        origin: { y: 0.6 },
        // canvas-confetti renders to <canvas>, so it can't read CSS custom
        // properties — these are the literal approved brand hex values.
        colors: ['#348398', '#2D7284', '#9FE1F3', '#ffffff'],
      });
      toast.success('Strategy deployed successfully');
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Deployment failed');
      setStep(1); // Reset to first step on error
    }
  });

  const processActivation = async () => {
    activateMutation.mutate({
      isPaperTrading: paperTrading,
      riskMultiplier: riskMultiplier[0],
    });
  };

  if (!strategy) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl dash-modal-panel p-0 overflow-hidden border-0 shadow-xl">
        <div className="relative p-6 sm:p-8">
          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-8"
              >
                <div className="space-y-2">
                  <div className="dash-modal-status">
                    <Terminal className="w-4 h-4" />
                    <span>Node Deployment Sequence Initiated</span>
                  </div>
                  <h2 className="dash-title uppercase tracking-tight">Review Data</h2>
                </div>

                <div className="dashboard-card p-5 sm:p-6 space-y-5">
                  <div className="flex items-start gap-4">
                    <div className="h-14 w-14 rounded-xl bg-muted border border-[var(--card-border)] flex items-center justify-center shrink-0">
                      <Cpu className="h-7 w-7 text-muted-foreground" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h4 className="font-bold text-lg text-foreground uppercase tracking-tight truncate">{strategy.name}</h4>
                      <div className="flex flex-wrap items-center gap-2 mt-2">
                        {strategy.category ? <span className="dash-badge dash-badge-category">{strategy.category}</span> : null}
                        {strategy.isVerified ? (
                          <span className="dash-badge dash-badge-verified">
                            <CheckCircle2 className="h-3 w-3" />
                            Verified Node
                          </span>
                        ) : null}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2 pt-5 border-t border-[var(--card-border)]">
                    <div className="space-y-1.5">
                      <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground whitespace-nowrap">Return</p>
                      <p className="text-xl font-bold text-[var(--success)] tabular-nums">+{strategy.latestPerformance?.winRate || 0}%</p>
                    </div>
                    <div className="space-y-1.5 border-l border-[var(--card-border)] pl-3">
                      <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground whitespace-nowrap">Drawdown</p>
                      <p className="text-xl font-bold text-destructive tabular-nums">-{strategy.latestPerformance?.maxDrawdown || 0}%</p>
                    </div>
                    <div className="space-y-1.5 border-l border-[var(--card-border)] pl-3">
                      <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground whitespace-nowrap">Sharpe</p>
                      <p className="text-xl font-bold text-primary tabular-nums">{strategy.latestPerformance?.sharpeRatio || 0}</p>
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={onClose} className="flex-1 h-11 rounded-xl border border-[var(--card-border)] text-foreground/50 hover:text-foreground hover:border-foreground/30 text-xs font-semibold uppercase tracking-wide transition-colors">
                    Abort
                  </button>
                  <button type="button" onClick={() => setStep(2)} className="flex-[2] h-11 rounded-xl bg-foreground text-background text-xs font-bold uppercase tracking-wide hover:bg-foreground/90 transition-colors">
                    Activate Strategy →
                  </button>
                </div>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="space-y-2">
                  <div className="dash-modal-status">
                    <Shield className="w-4 h-4" />
                    <span>Security &amp; Risk Parameters</span>
                  </div>
                  <h2 className="dash-title uppercase tracking-tight">Configure Node Logic</h2>
                </div>

                <div className="space-y-4">
                  <div className="dashboard-card p-5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className={cn('p-2.5 rounded-xl shrink-0', paperTrading ? 'bg-primary/10 text-primary' : 'bg-destructive/10 text-destructive')}>
                          {paperTrading ? <Activity className="w-5 h-5" /> : <Activity className="w-5 h-5" />}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-foreground uppercase tracking-widest">{paperTrading ? 'Simulation Matrix' : 'Live Global Capital'}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {paperTrading ? 'Virtual liquidity engine engaged' : 'Warning: Real capital exposure'}
                          </p>
                        </div>
                      </div>
                      <Switch checked={paperTrading} onCheckedChange={setPaperTrading} className="scale-125 data-[state=checked]:bg-chart-4 data-[state=unchecked]:bg-destructive" />
                    </div>
                  </div>

                  <div className="dashboard-card p-5 space-y-6">
                    <div className="flex justify-between items-end">
                      <div className="space-y-1">
                        <label className="dash-eyebrow">Risk Exposure Multiplier</label>
                        <p className="text-xs text-muted-foreground mt-1">Base lot size variation</p>
                      </div>
                      <span className="text-3xl font-semibold text-foreground">{riskMultiplier[0]}x</span>
                    </div>
                    <Slider 
                      min={0.5} 
                      max={3} 
                      step={0.1} 
                      value={riskMultiplier} 
                      onValueChange={setRiskMultiplier}
                      className="[&_[role=slider]]:h-6 [&_[role=slider]]:w-6 [&_[role=slider]]:border-primary"
                    />
                    <div className="p-3 bg-muted rounded-xl text-xs text-muted-foreground uppercase text-center tracking-wide font-semibold">
                      Output: {(riskMultiplier[0] * 0.12).toFixed(2)} lots / execution
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <DashButton variant="outline" onClick={() => setStep(1)} className="flex-1 h-11">Back</DashButton>
                  <DashButton variant="primary" onClick={() => setStep(3)} className="flex-[1.5] h-11">Sign Logic Contract</DashButton>
                </div>
              </motion.div>
            )}

            {step === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-8"
              >
                <div className="space-y-2">
                  <div className="dash-modal-status text-destructive">
                    <Fingerprint className="w-4 h-4" />
                    <span>Awaiting Profile Confirmation</span>
                  </div>
                  <h2 className="dash-title uppercase tracking-tight">Finalize Deployment</h2>
                </div>

                <div className="dashboard-card p-6 space-y-5">
                  <div className="flex items-center gap-4 pb-5 border-b border-[var(--card-border)]">
                    <div className="h-11 w-11 rounded-full bg-primary/10 flex items-center justify-center">
                      <Network className="text-primary w-5 h-5" />
                    </div>
                    <div>
                      <p className="dash-eyebrow">Routing to</p>
                      <p className="font-semibold text-lg text-foreground">Primary Node</p>
                    </div>
                  </div>

                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between gap-4">
                      <span className="dash-eyebrow">Model Identity</span>
                      <span className="font-medium text-foreground truncate">{strategy.name}</span>
                    </div>
                    <div className="flex justify-between gap-4">
                      <span className="dash-eyebrow">Execution Matrix</span>
                      <span className={cn('font-semibold uppercase text-xs', paperTrading ? 'text-primary' : 'text-destructive')}>
                        {paperTrading ? 'Simulated' : 'Live Market'}
                      </span>
                    </div>
                    <div className="flex justify-between gap-4">
                      <span className="dash-eyebrow">Risk Tensor</span>
                      <span className="font-medium text-foreground">{riskMultiplier[0]}x Base</span>
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <DashButton variant="outline" disabled={activateMutation.isPending} onClick={() => setStep(2)} className="flex-1 h-11">
                    Refine
                  </DashButton>
                  <button
                    type="button"
                    disabled={activateMutation.isPending}
                    onClick={processActivation}
                    className="flex-[1.5] h-11 inline-flex items-center justify-center gap-2 rounded-xl bg-foreground text-background text-[11px] font-bold uppercase tracking-wide hover:bg-foreground/90 disabled:opacity-50"
                  >
                    {activateMutation.isPending ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Deploying…
                      </>
                    ) : (
                      'Authorize Deployment'
                    )}
                  </button>
                </div>
              </motion.div>
            )}

            {step === 4 && (
              <motion.div
                key="step4"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                className="py-10 flex flex-col items-center text-center space-y-6"
              >
                <div className="h-20 w-20 rounded-full bg-[var(--success)]/10 border border-[var(--success)]/30 flex items-center justify-center">
                  <Check className="h-9 w-9 text-[var(--success)]" />
                </div>
                <div className="space-y-2">
                  <h3 className="dash-title uppercase">Node Deployed</h3>
                  <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                    <span className="font-semibold text-foreground">{strategy.name}</span> is now active and monitoring market conditions.
                  </p>
                </div>
                <DashButton variant="outline" onClick={onClose} className="w-full max-w-sm h-11">
                  View active nodes
                </DashButton>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </DialogContent>
    </Dialog>
  );
}
