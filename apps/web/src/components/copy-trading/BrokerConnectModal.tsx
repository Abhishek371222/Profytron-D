'use client';

import React from 'react';
import Link from 'next/link';
import { AnimatePresence, motion } from 'framer-motion';
import { X, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { brokerApi } from '@/lib/api/broker';
import {
  getLiveBrokers,
  getMt5ServerOptions,
} from '@/lib/broker/broker-directory';
import { cn } from '@/lib/utils';
import { useModalMotionProps } from '@/platform/motion';
import { useQueryClient } from '@tanstack/react-query';
import { celebrateSuccessMoment } from '@/lib/activation/success-moments';
import {
  ADOPTION_EVENTS,
  trackAdoptionEvent,
} from '@/lib/analytics/track-adoption';

interface Props {
  open: boolean;
  onClose: () => void;
  onConnected?: () => void;
}

type Step = 'form' | 'testing' | 'success' | 'error';
type ConnectMode = 'paper' | 'live';

const CUSTOM_SERVER = '__custom__';
const ALL_BROKERS = '__all__';

const liveBrokers = getLiveBrokers();
const allServerOptions = getMt5ServerOptions();

function extractErrorMessage(err: any): string {
  const data = err?.response?.data;
  const raw =
    data?.message ?? data?.error ?? data?.data?.message ?? err?.message;
  if (Array.isArray(raw)) return raw.map(String).join(', ');
  if (typeof raw === 'string' && raw.trim()) return raw;
  return 'Connection failed';
}

export function BrokerConnectModal({ open, onClose, onConnected }: Props) {
  const queryClient = useQueryClient();
  const [step, setStep] = React.useState<Step>('form');
  const [mode, setMode] = React.useState<ConnectMode>('live');
  const [error, setError] = React.useState('');
  const [pending, setPending] = React.useState(false);
  const [bridgeToken, setBridgeToken] = React.useState('');
  const [brokerFilter, setBrokerFilter] = React.useState('BITRAGE');
  const [serverChoice, setServerChoice] = React.useState(
    'BitrageCapitalMarkets-Server',
  );
  const [customServer, setCustomServer] = React.useState('');
  const [form, setForm] = React.useState({ login: '', password: '' });

  const serverOptions = React.useMemo(() => {
    const list =
      brokerFilter === ALL_BROKERS
        ? allServerOptions
        : allServerOptions.filter((s) => s.brokerId === brokerFilter);
    return [...list].sort((a, b) => {
      const aBit = a.brokerId === 'BITRAGE' ? 0 : 1;
      const bBit = b.brokerId === 'BITRAGE' ? 0 : 1;
      if (aBit !== bBit) return aBit - bBit;
      return a.label.localeCompare(b.label);
    });
  }, [brokerFilter]);

  const resolvedServer =
    serverChoice === CUSTOM_SERVER ? customServer.trim() : serverChoice;

  const handleBrokerFilterChange = (value: string) => {
    setBrokerFilter(value);
    setServerChoice('');
    setCustomServer('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStep('testing');
    setError('');
    try {
      let result: any;
      if (mode === 'paper') {
        result = await brokerApi.connectBroker({
          brokerName: 'PAPER',
          login: 'PAPER',
          password: 'paper',
          serverName: 'PAPER',
          platform: 'mt5',
        });
      } else {
        if (!form.login || !form.password || !resolvedServer) {
          setError('Login, password, and server are required.');
          setStep('error');
          return;
        }
        result = await brokerApi.connectBroker({
          login: form.login.trim(),
          password: form.password,
          serverName: resolvedServer,
          brokerName: 'MT5',
          platform: 'mt5',
        });
      }
      setPending(Boolean(result?.pending));
      setBridgeToken(
        typeof result?.bridgeToken === 'string' ? result.bridgeToken : '',
      );
      setStep('success');
      celebrateSuccessMoment(
        'broker_connected',
        mode === 'paper' ? 'Paper account ready' : 'Broker connected',
        'Next: ask Alpha Coach or activate a strategy from the checklist.',
      );
      trackAdoptionEvent(ADOPTION_EVENTS.RECOVERY_SUCCESS, {
        step: 'broker',
        metadata: { mode, recovered: false },
      });
      trackAdoptionEvent(ADOPTION_EVENTS.STEP_COMPLETE, {
        step: 'broker',
        href: '/connected-accounts',
      });
      void queryClient.invalidateQueries({ queryKey: ['activation-progress'] });
      onConnected?.();
    } catch (err: any) {
      setError(extractErrorMessage(err));
      setStep('error');
      trackAdoptionEvent(ADOPTION_EVENTS.RETRY, {
        step: 'broker',
        metadata: { phase: 'failed' },
      });
    }
  };

  const reset = () => {
    setStep('form');
    setError('');
    setPending(false);
    setBridgeToken('');
    setMode('live');
    setBrokerFilter('BITRAGE');
    setServerChoice('BitrageCapitalMarkets-Server');
    setCustomServer('');
    setForm({ login: '', password: '' });
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const isQuotaError = /allows \d+ connected account/i.test(error);
  const modal = useModalMotionProps();

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={modal.backdrop.initial}
          animate={modal.backdrop.animate}
          exit={modal.backdrop.exit}
          transition={modal.backdrop.transition}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          onClick={(e) => e.target === e.currentTarget && handleClose()}
        >
          <motion.div
            initial={modal.panel.initial}
            animate={modal.panel.animate}
            exit={modal.panel.exit}
            transition={modal.panel.transition}
            className="w-full max-w-md max-h-[90dvh] overflow-y-auto rounded-2xl border border-border-default bg-bg-elevated glass shadow-2xl"
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-border-default">
              <div>
                <h2 className="text-base font-semibold text-text-primary">
                  Connect MT5 Account
                </h2>
                <p className="text-[11px] text-chart-3 mt-0.5">
                  Live MT5 via MetaApi G2 · balance + copy fills
                </p>
              </div>
              <button
                onClick={handleClose}
                className="p-1 rounded-lg hover:bg-foreground/5 text-text-secondary"
                type="button"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6">
              {(step === 'form' || step === 'error') && (
                <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                  {step === 'error' && (
                    <div className="flex items-start gap-3 p-3 rounded-xl bg-destructive/10 border border-destructive/20">
                      <AlertCircle className="w-4 h-4 text-destructive mt-0.5 shrink-0" />
                      <div className="text-sm text-destructive space-y-2">
                        <p>{error}</p>
                        {isQuotaError && (
                          <p className="text-destructive/90">
                            Disconnect an unused account under{' '}
                            <Link
                              href="/connected-accounts"
                              className="underline font-medium"
                              onClick={handleClose}
                            >
                              Connected Accounts
                            </Link>
                            .
                          </p>
                        )}
                        <ul className="list-disc pl-4 text-destructive/85 text-xs space-y-1">
                          <li>Confirm login, password, and MT5 server spelling.</li>
                          <li>Try paper mode first if you only need to explore bots.</li>
                          <li>
                            Still stuck? Open{' '}
                            <Link
                              href="/connected-accounts"
                              className="underline font-medium"
                              onClick={handleClose}
                            >
                              Connected Accounts
                            </Link>{' '}
                            for reconnect and sync status.
                          </li>
                        </ul>
                        <p className="text-xs text-destructive/80">
                          Fix the fields below and submit again to retry.
                        </p>
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-2 p-1 rounded-xl bg-muted/30 border border-border-default">
                    <button
                      type="button"
                      onClick={() => setMode('paper')}
                      className={cn(
                        'h-9 rounded-lg text-xs font-bold uppercase tracking-wide transition-colors',
                        mode === 'paper'
                          ? 'bg-primary text-primary-foreground'
                          : 'text-muted-foreground hover:text-foreground',
                      )}
                    >
                      Paper (demo)
                    </button>
                    <button
                      type="button"
                      onClick={() => setMode('live')}
                      className={cn(
                        'h-9 rounded-lg text-xs font-bold uppercase tracking-wide transition-colors',
                        mode === 'live'
                          ? 'bg-primary text-primary-foreground'
                          : 'text-muted-foreground hover:text-foreground',
                      )}
                    >
                      Live MT5
                    </button>
                  </div>

                  {mode === 'paper' ? (
                    <p className="text-sm text-text-secondary">
                      Instant virtual account with $100k demo balance. Best for
                      testing bots with zero broker cost.
                    </p>
                  ) : (
                    <>
                      <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-medium text-text-secondary">
                          Broker
                        </label>
                        <div className="relative">
                          <select
                            value={brokerFilter}
                            onChange={(e) =>
                              handleBrokerFilterChange(e.target.value)
                            }
                            className="w-full appearance-none px-3 py-2.5 pr-10 rounded-xl bg-bg-card border border-border-default text-sm text-text-primary focus:outline-none focus:ring-1 focus:ring-chart-2/50 cursor-pointer"
                          >
                            <option value={ALL_BROKERS}>All brokers</option>
                            {liveBrokers.map((b) => (
                              <option key={b.id} value={b.id}>
                                {b.displayName}
                              </option>
                            ))}
                          </select>
                          <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-text-muted text-xs">
                            ▼
                          </span>
                        </div>
                      </div>

                      <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-medium text-text-secondary">
                          MT5 Server
                        </label>
                        <div className="relative">
                          <select
                            value={serverChoice}
                            onChange={(e) => setServerChoice(e.target.value)}
                            className="w-full appearance-none px-3 py-2.5 pr-10 rounded-xl bg-bg-card border border-border-default text-sm text-text-primary focus:outline-none focus:ring-1 focus:ring-chart-2/50 cursor-pointer"
                            required={serverChoice !== CUSTOM_SERVER}
                          >
                            <option value="" disabled>
                              Select server…
                            </option>
                            {serverOptions.map((opt) => (
                              <option
                                key={`${opt.brokerId}:${opt.server}`}
                                value={opt.server}
                              >
                                {brokerFilter === ALL_BROKERS
                                  ? opt.label
                                  : opt.server}
                              </option>
                            ))}
                            <option value={CUSTOM_SERVER}>
                              Other / type manually…
                            </option>
                          </select>
                          <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-text-muted text-xs">
                            ▼
                          </span>
                        </div>
                        {serverChoice === CUSTOM_SERVER && (
                          <input
                            type="text"
                            value={customServer}
                            onChange={(e) => setCustomServer(e.target.value)}
                            placeholder="Exact server name from MT5"
                            className="w-full px-3 py-2.5 rounded-xl bg-bg-card border border-border-default text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-1 focus:ring-chart-2/50"
                            required
                          />
                        )}
                        <p className="text-xs text-text-muted">
                          Pick broker, then server. Example: Bitrage Markets →
                          BitrageCapitalMarkets-Server
                        </p>
                      </div>

                      <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-medium text-text-secondary">
                          MT5 Login (account number)
                        </label>
                        <input
                          type="text"
                          value={form.login}
                          onChange={(e) =>
                            setForm({ ...form, login: e.target.value })
                          }
                          placeholder="e.g. 961338"
                          className="w-full px-3 py-2.5 rounded-xl bg-bg-card border border-border-default text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-1 focus:ring-chart-2/50"
                          required={mode === 'live'}
                        />
                      </div>

                      <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-medium text-text-secondary">
                          MT5 Password
                        </label>
                        <input
                          type="password"
                          value={form.password}
                          onChange={(e) =>
                            setForm({ ...form, password: e.target.value })
                          }
                          placeholder="Master (trading) password"
                          className="w-full px-3 py-2.5 rounded-xl bg-bg-card border border-border-default text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-1 focus:ring-chart-2/50"
                          required={mode === 'live'}
                        />
                      </div>
                    </>
                  )}

                  <div className="flex gap-3 mt-2">
                    <Button
                      type="button"
                      variant="ghost"
                      className="flex-1"
                      onClick={handleClose}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      className="flex-1"
                      disabled={mode === 'live' && !resolvedServer}
                    >
                      {mode === 'paper' ? 'Connect paper' : 'Connect MT5'}
                    </Button>
                  </div>
                </form>
              )}

              {step === 'testing' && (
                <div className="flex flex-col items-center gap-4 py-6">
                  <Loader2 className="w-10 h-10 text-chart-2 animate-spin" />
                  <p className="text-sm text-text-secondary text-center">
                    {mode === 'paper'
                      ? 'Creating your paper account…'
                      : `Connecting ${resolvedServer} via MetaApi…`}
                    <br />
                    {mode === 'live'
                      ? 'This can take up to a minute on first connect.'
                      : null}
                  </p>
                </div>
              )}

              {step === 'success' && (
                <div className="flex flex-col items-center gap-4 py-6">
                  <CheckCircle2 className="w-12 h-12 text-chart-3" />
                  <div className="text-center">
                    <p className="font-semibold text-text-primary">
                      {mode === 'paper'
                        ? 'Paper account ready'
                        : pending
                          ? 'Broker linked'
                          : 'Broker connected'}
                    </p>
                    <p className="text-sm text-text-secondary mt-1">
                      {mode === 'paper'
                        ? 'Subscribe to a bot to receive simulated copies on this account.'
                        : pending
                          ? 'Account provisioned — live balance appears once MetaApi finishes deploying.'
                          : 'Live balance and copy fills run through your MetaApi-linked MT5.'}
                    </p>
                  </div>
                  {mode === 'live' && bridgeToken && (
                    <div className="w-full space-y-2 rounded-xl border border-border-default bg-bg-card p-3 text-left">
                      <p className="text-xs font-medium text-text-primary">
                        Bridge token (copy once)
                      </p>
                      <p className="text-[11px] text-text-muted">
                        Paste into ProfytronCopyBridge EA on your MT5 so live
                        orders place on your broker. Keep MT5 + EA running.
                      </p>
                      <code className="block break-all rounded-lg bg-muted/40 px-2 py-2 text-[11px] text-text-primary">
                        {bridgeToken}
                      </code>
                      <button
                        type="button"
                        className="text-xs text-chart-2 underline"
                        onClick={() =>
                          void navigator.clipboard.writeText(bridgeToken)
                        }
                      >
                        Copy token
                      </button>
                    </div>
                  )}
                  <Button
                    className="w-full"
                    onClick={() => {
                      handleClose();
                      window.location.href = '/alpha-coach';
                    }}
                  >
                    Ask Alpha Coach next
                  </Button>
                  <Button variant="outline" className="w-full" onClick={handleClose}>
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
