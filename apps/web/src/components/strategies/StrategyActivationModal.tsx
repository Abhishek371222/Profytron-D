'use client';

import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Terminal, Cpu, CheckCircle2, Shield, Activity, 
  Fingerprint, Network, Check, X, AlertCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { 
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription 
} from '@/components/ui/dialog';
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
        colors: ['#6366f1', '#06b6d4', '#8b5cf6', '#ffffff'],
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
      <DialogContent className="max-w-2xl bg-[#050505] border-white/10 p-0 overflow-hidden rounded-[30px] shadow-[0_0_100px_rgba(0,0,0,1)]">
        
        {/* Modal Ambient Glow */}
        <div className="absolute inset-0 bg-linear-to-br from-indigo-500/10 via-transparent to-cyan-500/10 pointer-events-none" />
        
        {/* Scanline overlay */}
        <div className="absolute inset-0 bg-[url('/scanlines.png')] opacity-[0.03] mix-blend-overlay pointer-events-none" />

        <div className="relative z-10 p-8">
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
                  <div className="flex items-center gap-3 text-indigo-400 font-jet-mono text-xs uppercase tracking-[0.3em] font-semibold">
                    <Terminal className="w-4 h-4" />
                    <span>Node Deployment Sequence Initiated</span>
                  </div>
                  <h2 className="text-3xl font-semibold text-white uppercase tracking-tight">Review Data</h2>
                </div>

                <div className="p-6 rounded-3xl bg-black/60 border border-white/5 space-y-6 backdrop-blur-xl relative overflow-hidden group">
                  <div className="absolute inset-0 bg-linear-to-r from-indigo-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
                  
                  <div className="flex items-start justify-between relative z-10">
                    <div className="flex items-center gap-4">
                      <div className="h-16 w-16 rounded-2xl bg-white/3 border border-white/10 flex items-center justify-center shadow-inner">
                        <Cpu className="h-8 w-8 text-white/60" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-white text-2xl tracking-tight uppercase">{strategy.name}</h4>
                        <div className="flex items-center gap-3 mt-2">
                          <span className="text-xs font-semibold px-3 py-1 rounded-full bg-white/5 border border-white/10 text-white/60 uppercase tracking-widest">
                            {strategy.category}
                          </span>
                          {strategy.isVerified && (
                            <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-semibold uppercase tracking-widest bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
                              <CheckCircle2 className="h-3 w-3" />
                              Verified Node
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4 pt-6 border-t border-white/5 relative z-10">
                    <div className="space-y-2">
                      <p className="text-xs text-white/30 uppercase font-semibold tracking-widest">Alpha Returns</p>
                      <p className="text-2xl font-semibold text-emerald-400">+{strategy.latestPerformance?.winRate || 0}%</p>
                    </div>
                    <div className="space-y-2 border-l border-white/5 pl-4">
                      <p className="text-xs text-white/30 uppercase font-semibold tracking-widest">Max Drawdown</p>
                      <p className="text-2xl font-semibold text-rose-400">-{strategy.latestPerformance?.maxDrawdown || 0}%</p>
                    </div>
                    <div className="space-y-2 border-l border-white/5 pl-4">
                      <p className="text-xs text-white/30 uppercase font-semibold tracking-widest">Sharpe Ratio</p>
                      <p className="text-2xl font-semibold text-cyan-400">{strategy.latestPerformance?.sharpeRatio || 0}</p>
                    </div>
                  </div>
                </div>

                <div className="flex gap-4 pt-4">
                  <Button variant="ghost" onClick={onClose} className="h-14 flex-1 rounded-2xl border border-white/10 font-jet-mono text-xs uppercase tracking-widest hover:bg-white/5">Abort</Button>
                  <Button onClick={() => setStep(2)} className="h-14 flex-2 bg-white text-black hover:bg-white/90 rounded-2xl font-semibold text-xs uppercase tracking-[0.2em] shadow-[0_0_30px_rgba(255,255,255,0.1)]">Authenticate Logic &rarr;</Button>
                </div>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-8"
              >
                <div className="space-y-2">
                  <div className="flex items-center gap-3 text-amber-400 font-jet-mono text-xs uppercase tracking-[0.3em] font-semibold">
                    <Shield className="w-4 h-4" />
                    <span>Security & Risk Parameters</span>
                  </div>
                  <h2 className="text-3xl font-semibold text-white uppercase tracking-tight">Configure Node Logic</h2>
                </div>

                <div className="space-y-6">
                  <div className="p-5 rounded-[20px] bg-black/60 border border-white/10 backdrop-blur-md space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className={cn("p-3 rounded-xl", paperTrading ? "bg-amber-500/20 text-amber-400" : "bg-rose-500/20 text-rose-400")}>
                          {paperTrading ? <Activity className="w-5 h-5" /> : <Activity className="w-5 h-5" />}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-white uppercase tracking-widest">{paperTrading ? 'Simulation Matrix' : 'Live Global Capital'}</p>
                          <p className="text-xs font-jet-mono text-white/40 mt-1 uppercase tracking-wider">
                            {paperTrading ? 'Virtual liquidity engine engaged' : 'Warning: Real capital exposure'}
                          </p>
                        </div>
                      </div>
                      <Switch checked={paperTrading} onCheckedChange={setPaperTrading} className="scale-125 data-[state=checked]:bg-amber-500 data-[state=unchecked]:bg-rose-500" />
                    </div>
                  </div>

                  <div className="p-6 rounded-[20px] bg-black/60 border border-white/10 backdrop-blur-md space-y-8">
                    <div className="flex justify-between items-end">
                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-white/40 uppercase tracking-[0.2em]">Risk Exposure Multiplier</label>
                        <p className="text-xs text-white/20 font-jet-mono">Base lot size variation</p>
                      </div>
                      <span className="text-3xl font-semibold text-white">{riskMultiplier[0]}x</span>
                    </div>
                    <Slider 
                      min={0.5} 
                      max={3} 
                      step={0.1} 
                      value={riskMultiplier} 
                      onValueChange={setRiskMultiplier}
                      className="[&_[role=slider]]:h-6 [&_[role=slider]]:w-6 [&_[role=slider]]:border-primary"
                    />
                    <div className="p-3 bg-white/5 border border-white/10 rounded-xl font-jet-mono text-xs text-white/40 uppercase text-center tracking-widest">
                      Neural Output: {(riskMultiplier[0] * 0.12).toFixed(2)} lots / execution
                    </div>
                  </div>
                </div>

                <div className="flex gap-4 pt-4">
                  <Button variant="ghost" onClick={() => setStep(1)} className="h-14 flex-1 rounded-2xl border border-white/10 font-jet-mono text-xs uppercase tracking-widest hover:bg-white/5">Back</Button>
                  <Button onClick={() => setStep(3)} className="h-14 flex-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-semibold text-xs uppercase tracking-[0.2em] shadow-[0_0_30px_rgba(99,102,241,0.2)]">Sign Logic Contract</Button>
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
                  <div className="flex items-center gap-3 text-rose-400 font-jet-mono text-xs uppercase tracking-[0.3em] font-semibold animate-pulse">
                    <Fingerprint className="w-4 h-4" />
                    <span>Awaiting Profile Confirmation</span>
                  </div>
                  <h2 className="text-3xl font-semibold text-white uppercase tracking-tight">Finalize Deployment</h2>
                </div>

                <div className="p-8 rounded-3xl bg-black/80 border border-white/10 relative overflow-hidden backdrop-blur-3xl">
                  {/* Cryptographic background logic */}
                  <div className="absolute inset-0 opacity-[0.02] font-jet-mono text-xs leading-tight break-all overflow-hidden flex flex-wrap content-start select-none">
                    {Array.from({length: 80}).map((_, i) => `${((i + 1) * 12345).toString(36).toUpperCase().slice(0, 8)} `)}
                  </div>
                  
                  <div className="relative z-10 space-y-6">
                    <div className="flex items-center gap-4 mb-6 pb-6 border-b border-white/10">
                      <div className="h-12 w-12 rounded-full bg-white/10 animate-pulse flex items-center justify-center">
                        <Network className="text-white/50 w-6 h-6" />
                      </div>
                      <div>
                        <p className="text-xs text-white/50 font-jet-mono uppercase tracking-widest">Routing to</p>
                        <p className="font-semibold text-xl text-white">Primary Node</p>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="flex justify-between items-center py-2">
                        <span className="text-xs text-white/40 font-semibold uppercase tracking-[0.2em]">Model Identity</span>
                        <span className="text-xs font-jet-mono text-white">{strategy.name}</span>
                      </div>
                      <div className="flex justify-between items-center py-2">
                        <span className="text-xs text-white/40 font-semibold uppercase tracking-[0.2em]">Execution Matrix</span>
                        <span className={cn("text-xs font-jet-mono font-semibold", paperTrading ? "text-amber-400" : "text-rose-400")}>
                          {paperTrading ? "SIMULATED_CAP" : "LIVE_MARKET"}
                        </span>
                      </div>
                      <div className="flex justify-between items-center py-2">
                        <span className="text-xs text-white/40 font-semibold uppercase tracking-[0.2em]">Risk Tensor</span>
                        <span className="text-xs font-jet-mono text-white">{riskMultiplier[0]}x Base</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex gap-4 pt-4">
                  <Button 
                    disabled={activateMutation.isPending}
                    onClick={() => setStep(2)} 
                    className="h-16 flex-[1] bg-transparent border border-white/10 hover:bg-white/5 rounded-2xl font-jet-mono text-xs uppercase tracking-widest"
                  >
                    Refine
                  </Button>
                  <Button 
                    disabled={activateMutation.isPending}
                    onClick={processActivation} 
                    className="h-16 flex-2 relative overflow-hidden bg-white text-black hover:bg-white/90 rounded-2xl font-semibold text-sm uppercase tracking-[0.2em] shadow-[0_0_40px_rgba(255,255,255,0.2)] group"
                  >
                    {activateMutation.isPending ? (
                      <div className="flex items-center gap-3">
                        <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                        <span>Deploying...</span>
                      </div>
                    ) : (
                      <>
                        <span className="relative z-10 group-hover:tracking-[0.3em] transition-all duration-300">Authorize Deployment</span>
                        <div className="absolute inset-0 bg-[linear-gradient(90deg,transparent,rgba(0,0,0,0.1),transparent)] -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]" />
                      </>
                    )}
                  </Button>
                </div>
              </motion.div>
            )}

            {step === 4 && (
              <motion.div
                key="step4"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="py-16 flex flex-col items-center text-center space-y-8 relative"
              >
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(16,185,129,0.1),transparent_60%)] pointer-events-none" />
                
                <div className="relative group cursor-pointer">
                  <div className="absolute inset-0 bg-green-500/20 rounded-full blur-2xl group-hover:blur-3xl transition-all duration-500" />
                  <div className="h-24 w-24 rounded-full bg-[#0a0a0a] border border-green-500/50 flex items-center justify-center relative z-10 shadow-[inset_0_0_20px_rgba(16,185,129,0.2)]">
                    <Check className="h-10 w-10 text-green-400 drop-shadow-[0_0_10px_rgba(16,185,129,0.8)]" />
                  </div>
                </div>

                <div className="space-y-4 relative z-10">
                  <h3 className="text-4xl lg:text-5xl font-semibold text-white uppercase tracking-tight drop-shadow-xl">Node Deployed</h3>
                  <p className="text-white/50 max-w-sm mx-auto font-jet-mono text-xs uppercase tracking-widest leading-relaxed">
                    Algorithms <span className="text-white font-bold">{strategy.name}</span> successfully instantiated. Currently monitoring market topography.
                  </p>
                </div>
                <Button 
                  onClick={onClose}
                  className="w-full max-w-sm h-14 bg-white/5 border border-white/10 hover:bg-white/10 text-white font-semibold uppercase tracking-[0.2em] rounded-2xl text-xs backdrop-blur-md transition-all duration-500 relative z-10"
                >
                  View active nodes in dashboard
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </DialogContent>
    </Dialog>
  );
}
