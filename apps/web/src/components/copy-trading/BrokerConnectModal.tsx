'use client';

import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { brokerApi } from '@/lib/api/broker';
import { toast } from 'sonner';

interface Props {
  open: boolean;
  onClose: () => void;
}

type Step = 'form' | 'testing' | 'success' | 'error';

export function BrokerConnectModal({ open, onClose }: Props) {
  const [step, setStep] = React.useState<Step>('form');
  const [error, setError] = React.useState('');
  const [pending, setPending] = React.useState(false);
  const [form, setForm] = React.useState({ login: '', password: '', server: '', platform: 'mt5' as 'mt4' | 'mt5' });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.login || !form.password || !form.server) return;
    setStep('testing');
    setError('');
    try {
      const result = await brokerApi.connectBroker({
        login: form.login,
        password: form.password,
        serverName: form.server,
        brokerName: form.platform === 'mt4' ? 'MT4' : 'MT5',
        platform: form.platform,
      });
      setPending(Boolean(result?.pending));
      setStep('success');
    } catch (err: any) {
      setError(err?.response?.data?.error ?? err.message ?? 'Connection failed');
      setStep('error');
    }
  };

  const reset = () => {
    setStep('form');
    setError('');
    setPending(false);
    setForm({ login: '', password: '', server: '', platform: 'mt5' });
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          onClick={(e) => e.target === e.currentTarget && handleClose()}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 12 }}
            className="w-full max-w-md rounded-2xl border border-border-default bg-bg-elevated glass shadow-2xl overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-border-default">
              <h2 className="text-base font-semibold text-text-primary">Connect MT4/MT5 Broker</h2>
              <button onClick={handleClose} className="p-1 rounded-lg hover:bg-foreground/5 text-text-secondary">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6">
              {/* Form */}
              {(step === 'form' || step === 'error') && (
                <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                  {step === 'error' && (
                    <div className="flex items-start gap-3 p-3 rounded-xl bg-red-500/10 border border-red-500/20">
                      <AlertCircle className="w-4 h-4 text-red-400 mt-0.5 shrink-0" />
                      <p className="text-sm text-red-400">{error}</p>
                    </div>
                  )}

                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-medium text-text-secondary">MT5 Login (account number)</label>
                    <input
                      type="text"
                      value={form.login}
                      onChange={(e) => setForm({ ...form, login: e.target.value })}
                      placeholder="e.g. 12345678"
                      className="w-full px-3 py-2.5 rounded-xl bg-bg-card border border-border-default text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-1 focus:ring-chart-2/50"
                      required
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-medium text-text-secondary">MT5 Password</label>
                    <input
                      type="password"
                      value={form.password}
                      onChange={(e) => setForm({ ...form, password: e.target.value })}
                      placeholder="Trading password"
                      className="w-full px-3 py-2.5 rounded-xl bg-bg-card border border-border-default text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-1 focus:ring-chart-2/50"
                      required
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-medium text-text-secondary">Broker Server</label>
                    <input
                      type="text"
                      value={form.server}
                      onChange={(e) => setForm({ ...form, server: e.target.value })}
                      placeholder="e.g. Exness-Real"
                      className="w-full px-3 py-2.5 rounded-xl bg-bg-card border border-border-default text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-1 focus:ring-chart-2/50"
                      required
                    />
                    <p className="text-xs text-text-muted">Find this in your MT5 terminal under File → Open an Account</p>
                  </div>

                  <div className="flex gap-2">
                    {(['mt5', 'mt4'] as const).map((p) => (
                      <button
                        key={p}
                        type="button"
                        onClick={() => setForm({ ...form, platform: p })}
                        className={`flex-1 py-2 rounded-xl border text-sm font-medium transition-colors ${
                          form.platform === p
                            ? 'border-chart-2/50 bg-chart-2/10 text-chart-2'
                            : 'border-border-default text-text-secondary hover:border-border-hover'
                        }`}
                      >
                        {p.toUpperCase()}
                      </button>
                    ))}
                  </div>

                  <div className="flex gap-3 mt-2">
                    <Button type="button" variant="ghost" className="flex-1" onClick={handleClose}>
                      Cancel
                    </Button>
                    <Button type="submit" className="flex-1">
                      Connect Broker
                    </Button>
                  </div>
                </form>
              )}

              {/* Testing */}
              {step === 'testing' && (
                <div className="flex flex-col items-center gap-4 py-6">
                  <Loader2 className="w-10 h-10 text-chart-2 animate-spin" />
                  <p className="text-sm text-text-secondary text-center">
                    Connecting to <span className="text-text-primary font-medium">{form.server}</span>…
                    <br />
                    Provisioning a secure bridge to your broker — this can take up to 90 seconds.
                  </p>
                </div>
              )}

              {/* Success */}
              {step === 'success' && (
                <div className="flex flex-col items-center gap-4 py-6">
                  <CheckCircle2 className="w-12 h-12 text-chart-3" />
                  <div className="text-center">
                    <p className="font-semibold text-text-primary">
                      {pending ? 'Broker Linked — Connecting…' : 'Broker Connected!'}
                    </p>
                    <p className="text-sm text-text-secondary mt-1">
                      {pending
                        ? 'Your account is provisioned. The broker terminal is still connecting — your live balance will appear in a minute.'
                        : 'Your MT5 account is ready — bot execution can start after purchase.'}
                    </p>
                  </div>
                  <Button className="w-full" onClick={handleClose}>
                    Done
                  </Button>
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
