'use client';

import React from 'react';
import {
  X,
  Zap,
  Loader2,
  Search,
  Globe,
  ShieldCheck,
  Star,
  Building2,
  Heart,
  SlidersHorizontal,
  BadgeCheck,
  Crown,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { brokerApi } from '@/lib/api/broker';
import {
  type BrokerEntry,
  BROKER_FILTERS,
  FEATURED_BROKERS,
  BROKER_REGIONS,
  BROKER_BRAND,
  BROKER_DIRECTORY,
} from '@/lib/broker/broker-directory';

export type DashboardBrokerConnectModalProps = {
  open: boolean;
  onClose: () => void;
  initialBrokerId?: string;
  onConnected?: () => void;
};

export default function DashboardBrokerConnectModal({
  open,
  onClose,
  initialBrokerId,
  onConnected,
}: DashboardBrokerConnectModalProps) {
  const [mounted, setMounted] = React.useState(false);
  const [selectedBrokerId, setSelectedBrokerId] = React.useState('IC_MARKETS');
  const [brokerSearch, setBrokerSearch] = React.useState('');
  const [activeFilter, setActiveFilter] = React.useState<(typeof BROKER_FILTERS)[number]>('All');
  const [favoriteBrokers, setFavoriteBrokers] = React.useState<string[]>([]);
  const [recentBrokerIds, setRecentBrokerIds] = React.useState<string[]>(['IC_MARKETS', 'PEPPERSTONE', 'PAPER']);
  const [login, setLogin] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [serverName, setServerName] = React.useState('');
  const [platform, setPlatform] = React.useState<'mt4' | 'mt5'>('mt5');
  const [isConnecting, setIsConnecting] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  React.useEffect(() => {
    if (!open) return;
    if (initialBrokerId) {
      setSelectedBrokerId(initialBrokerId);
    }
  }, [open, initialBrokerId]);

  React.useEffect(() => {
    if (!mounted) return;
    try {
      const stored = window.localStorage.getItem('brokerFavorites');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) setFavoriteBrokers(parsed.filter((id) => typeof id === 'string'));
      }
    } catch {
      // Ignore invalid storage.
    }
  }, [mounted]);

  React.useEffect(() => {
    if (!mounted) return;
    try {
      const stored = window.localStorage.getItem('brokerRecent');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) setRecentBrokerIds(parsed.filter((id) => typeof id === 'string').slice(0, 6));
      }
    } catch {
      // Ignore invalid storage.
    }
  }, [mounted]);

  React.useEffect(() => {
    if (!mounted) return;
    window.localStorage.setItem('brokerFavorites', JSON.stringify(favoriteBrokers));
  }, [favoriteBrokers, mounted]);

  React.useEffect(() => {
    if (!mounted) return;
    window.localStorage.setItem('brokerRecent', JSON.stringify(recentBrokerIds.slice(0, 6)));
  }, [recentBrokerIds, mounted]);

  const selectedBroker = React.useMemo(
    () => BROKER_DIRECTORY.find((broker) => broker.id === selectedBrokerId) ?? BROKER_DIRECTORY[0],
    [selectedBrokerId],
  );

  const filteredBrokers = React.useMemo(() => {
    const query = brokerSearch.trim().toLowerCase();
    return BROKER_DIRECTORY.filter((broker) => {
      const matchesQuery =
        !query ||
        broker.name.toLowerCase().includes(query) ||
        broker.displayName.toLowerCase().includes(query) ||
        broker.region.toLowerCase().includes(query) ||
        broker.platform.toLowerCase().includes(query) ||
        broker.tags.some((tag) => tag.toLowerCase().includes(query));

      let matchesFilter = false;
      switch (activeFilter) {
        case 'All':
          matchesFilter = true;
          break;
        case 'Favorites':
          matchesFilter = favoriteBrokers.includes(broker.id);
          break;
        case 'Paper':
          matchesFilter = broker.integration === 'PAPER' || broker.categories.includes('Paper');
          break;
        default:
          matchesFilter = broker.categories.includes(activeFilter);
          break;
      }

      return matchesQuery && matchesFilter;
    });
  }, [brokerSearch, activeFilter, favoriteBrokers]);

  const featuredBrokers = React.useMemo(
    () => FEATURED_BROKERS.map((id) => BROKER_DIRECTORY.find((broker) => broker.id === id)).filter(Boolean) as BrokerEntry[],
    [],
  );

  const regionGroups = React.useMemo(() => {
    return BROKER_REGIONS.map((region) => ({
      region,
      brokers: BROKER_DIRECTORY.filter((broker) => broker.region === region),
    })).filter((group) => group.brokers.length > 0);
  }, []);

  React.useEffect(() => {
    if (!filteredBrokers.length) return;
    if (!filteredBrokers.some((broker) => broker.id === selectedBrokerId)) {
      setSelectedBrokerId(filteredBrokers[0].id);
    }
  }, [filteredBrokers, selectedBrokerId]);

  React.useEffect(() => {
    const broker = BROKER_DIRECTORY.find((b) => b.id === selectedBrokerId);
    if (!broker) return;
    setLogin('');
    setPassword('');
    setServerName(broker.servers?.[0] ?? '');
    setPlatform(broker.integration === 'MT4' ? 'mt4' : 'mt5');
  }, [selectedBrokerId]);

  const toggleFavorite = (brokerId: string) => {
    setFavoriteBrokers((current) =>
      current.includes(brokerId)
        ? current.filter((id) => id !== brokerId)
        : [...current, brokerId],
    );
  };

  const markRecentBroker = (brokerId: string) => {
    setRecentBrokerIds((current) => [brokerId, ...current.filter((id) => id !== brokerId)].slice(0, 6));
  };

  const handleConnectBroker = async () => {
    setIsConnecting(true);
    try {
      await brokerApi.connectBroker({
        brokerName: selectedBroker.integration === 'PAPER' ? 'PAPER' : (platform === 'mt4' ? 'MT4' : 'MT5'),
        login,
        password,
        serverName,
        platform,
      });
      markRecentBroker(selectedBroker.id);
      toast.success(`${selectedBroker.name} connected securely`);
      onConnected?.();
      onClose();
    } catch (e: any) {
      const msg =
        e.response?.data?.message ||
        e.response?.data?.error ||
        e.message ||
        'Connection failed';
      toast.error('Broker connection failed', { description: msg });
    } finally {
      setIsConnecting(false);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 bg-black/80 backdrop-blur-xl"
          onClick={(e) => e.target === e.currentTarget && onClose()}
        >
          <motion.div
            initial={{ scale: 0.95, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.95 }}
            className="w-full max-w-6xl max-h-[85dvh] sm:max-h-[90vh] rounded-3xl sm:rounded-4xl bg-[#080808] border border-border p-3 sm:p-4 md:p-6 shadow-2xl relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-linear-to-br from-primary/5 to-transparent pointer-events-none" />

            <div className="relative z-10 flex flex-col h-full">
              <div className="flex items-start justify-between gap-4 pb-4 border-b border-border">
                <div className="space-y-1">
                  <h3 className="text-xl sm:text-2xl md:text-3xl font-semibold text-foreground uppercase tracking-tight">Connect Broker</h3>
                  <p className="text-xs text-foreground/40 font-semibold uppercase tracking-widest">AES-GCM encrypted connection • forex-ready broker directory</p>
                </div>
                <button onClick={onClose} className="w-8 h-8 rounded-full bg-foreground/5 flex items-center justify-center hover:bg-foreground/10 shrink-0">
                  <X className="w-4 h-4 text-foreground/60" />
                </button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-[1.15fr_0.85fr] gap-4 xl:gap-6 flex-1 min-h-0 pt-4">
                <div className="space-y-4 min-h-0 flex flex-col">
                  <div className="relative">
                    <Search className="w-4 h-4 text-foreground/30 absolute left-4 top-1/2 -translate-y-1/2" />
                    <input
                      value={brokerSearch}
                      onChange={(e) => setBrokerSearch(e.target.value)}
                      placeholder="Search broker, platform, region, or tag..."
                      className="w-full h-12 bg-foreground/3 border border-border rounded-2xl pl-11 pr-4 text-sm text-foreground placeholder:text-foreground/20 focus:border-primary/50 outline-none"
                    />
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    {BROKER_FILTERS.map((filter) => (
                      <button
                        key={filter}
                        onClick={() => setActiveFilter(filter)}
                        className={cn(
                          "px-3 py-2 rounded-full border text-micro font-semibold uppercase tracking-widest transition-all",
                          activeFilter === filter
                            ? "bg-primary text-foreground border-primary/40"
                            : "bg-foreground/3 text-foreground/40 border-border hover:text-foreground hover:border-border",
                        )}
                      >
                        {filter}
                      </button>
                    ))}
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-micro uppercase tracking-[0.3em] font-semibold text-foreground/25">
                      <BadgeCheck className="w-3.5 h-3.5 text-primary" /> Recently used
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {recentBrokerIds.map((brokerId) => {
                        const broker = BROKER_DIRECTORY.find((item) => item.id === brokerId);
                        if (!broker) return null;
                        return (
                          <button
                            key={broker.id}
                            onClick={() => setSelectedBrokerId(broker.id)}
                            className={cn(
                              "px-3 py-2 rounded-full border text-micro font-semibold uppercase tracking-widest transition-all",
                              selectedBrokerId === broker.id
                                ? "bg-primary text-foreground border-primary/40"
                                : "bg-foreground/3 text-foreground/40 border-border hover:border-border hover:text-foreground",
                            )}
                          >
                            {broker.name}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-micro uppercase tracking-[0.3em] font-semibold text-foreground/25">
                      <Crown className="w-3.5 h-3.5 text-chart-4" /> Featured brokers
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
                      {featuredBrokers.map((broker) => {
                        const active = selectedBrokerId === broker.id;
                        const favorite = favoriteBrokers.includes(broker.id);
                        const brand = BROKER_BRAND[broker.id] ?? { mark: broker.name.slice(0, 2).toUpperCase(), text: 'text-foreground', ring: 'ring-white/20', badgeBg: 'bg-foreground/10' };
                        return (
                          <div
                            key={broker.id}
                            onClick={() => {
                              setSelectedBrokerId(broker.id);
                              markRecentBroker(broker.id);
                            }}
                            role="button"
                            tabIndex={0}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' || e.key === ' ') {
                                e.preventDefault();
                                setSelectedBrokerId(broker.id);
                                markRecentBroker(broker.id);
                              }
                            }}
                            className={cn(
                              "relative text-left p-4 rounded-[22px] border overflow-hidden transition-all group",
                              active ? "bg-primary/10 border-primary/30 shadow-[0_0_28px_rgba(99,102,241,0.2)]" : "bg-foreground/2 border-border hover:border-border hover:bg-foreground/4",
                            )}
                          >
                            <div className={cn("absolute inset-0 bg-linear-to-br opacity-60", broker.accent)} />
                            <div className="relative z-10 space-y-3">
                              <div className="flex items-start justify-between gap-3">
                                <div className="flex items-center gap-3 min-w-0">
                                  <div className={cn("w-11 h-11 rounded-2xl flex items-center justify-center border shrink-0 ring-1", brand.badgeBg, brand.ring, active ? "border-primary/40" : "border-border")}>
                                    <span className={cn('text-caption font-bold tracking-tight', brand.text)}>{brand.mark}</span>
                                  </div>
                                  <div className="min-w-0">
                                    <div className="text-xs font-semibold text-foreground uppercase tracking-tight truncate">{broker.name}</div>
                                    <div className="text-micro text-foreground/30 uppercase tracking-[0.25em] mt-1 truncate">{broker.highlight}</div>
                                  </div>
                                </div>

                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    toggleFavorite(broker.id);
                                  }}
                                  className={cn(
                                    "w-7 h-7 rounded-full border flex items-center justify-center transition-all shrink-0",
                                    favorite ? "bg-chart-4/10 text-chart-4 border-chart-4/20" : "bg-foreground/5 text-foreground/30 border-border hover:text-foreground",
                                  )}
                                >
                                  <Heart className={cn("w-3.5 h-3.5", favorite && "fill-current")} />
                                </button>
                              </div>

                              <div className="flex items-center justify-between gap-2 text-micro uppercase tracking-widest text-foreground/40">
                                <span>{broker.platform}</span>
                                <span>{broker.execution}</span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    <div className="p-4 rounded-2xl bg-foreground/3 border border-border">
                      <div className="flex items-center gap-2 text-foreground/40 text-micro uppercase tracking-widest font-semibold mb-2"><Globe className="w-3.5 h-3.5" /> Global access</div>
                      <div className="text-sm text-foreground font-semibold">20+ broker choices</div>
                    </div>
                    <div className="p-4 rounded-2xl bg-foreground/3 border border-border">
                      <div className="flex items-center gap-2 text-foreground/40 text-micro uppercase tracking-widest font-semibold mb-2"><ShieldCheck className="w-3.5 h-3.5" /> Secure flow</div>
                      <div className="text-sm text-foreground font-semibold">AES-GCM encryption</div>
                    </div>
                    <div className="p-4 rounded-2xl bg-foreground/3 border border-border sm:col-span-1 col-span-2">
                      <div className="flex items-center gap-2 text-foreground/40 text-micro uppercase tracking-widest font-semibold mb-2"><Star className="w-3.5 h-3.5" /> Recommended</div>
                      <div className="text-sm text-foreground font-semibold">MT5 + paper sandbox</div>
                    </div>
                  </div>

                  <div className="flex-1 min-h-0 rounded-[28px] bg-foreground/2 border border-border p-3 overflow-hidden">
                    <div className="h-full overflow-y-auto pr-1 space-y-3">
                      {filteredBrokers.map((broker) => {
                        const active = selectedBrokerId === broker.id;
                        const favorite = favoriteBrokers.includes(broker.id);
                        const brand = BROKER_BRAND[broker.id] ?? { mark: broker.name.slice(0, 2).toUpperCase(), text: 'text-foreground', ring: 'ring-white/20', badgeBg: 'bg-foreground/10' };
                        return (
                          <div
                            key={broker.id}
                            onClick={() => {
                              setSelectedBrokerId(broker.id);
                              markRecentBroker(broker.id);
                            }}
                            role="button"
                            tabIndex={0}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' || e.key === ' ') {
                                e.preventDefault();
                                setSelectedBrokerId(broker.id);
                                markRecentBroker(broker.id);
                              }
                            }}
                            className={cn(
                              "w-full text-left p-4 rounded-2xl border transition-all group",
                              active ? "bg-primary/10 border-primary/30 shadow-[0_0_24px_rgba(99,102,241,0.18)]" : "bg-foreground/2 border-border hover:border-border hover:bg-foreground/4",
                            )}
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className="space-y-2 min-w-0">
                                <div className="flex items-center gap-3 min-w-0">
                                  <div className={cn(
                                    "w-10 h-10 rounded-xl flex items-center justify-center border shrink-0 relative overflow-hidden ring-1",
                                    active ? "bg-primary text-foreground border-primary/40" : "bg-foreground/5 text-foreground/60 border-border",
                                    brand.ring,
                                  )}>
                                    <div className={cn("absolute inset-0 bg-linear-to-br", broker.accent)} />
                                    <span className={cn('relative z-10 text-caption font-bold tracking-tight', brand.text)}>{brand.mark}</span>
                                  </div>
                                  <div className="min-w-0">
                                    <div className="flex items-center gap-2 flex-wrap">
                                      <span className="text-sm font-semibold text-foreground uppercase tracking-tight">{broker.name}</span>
                                      <span className={cn("px-2 py-0.5 rounded-md text-micro font-semibold uppercase tracking-widest border", broker.integration === 'PAPER' ? 'bg-chart-3/10 text-chart-3 border-chart-3/20' : 'bg-foreground/5 text-foreground/40 border-border')}>
                                        {broker.integration === 'PAPER' ? 'Demo' : broker.platform}
                                      </span>
                                      {broker.categories.includes('DMA') && <span className="px-2 py-0.5 rounded-md text-micro font-semibold uppercase tracking-widest border bg-chart-5/10 text-chart-5 border-chart-5/20">DMA</span>}
                                      {broker.categories.includes('ECN') && <span className="px-2 py-0.5 rounded-md text-micro font-semibold uppercase tracking-widest border bg-primary/10 text-primary border-primary/20">ECN</span>}
                                      {broker.categories.includes('STP') && <span className="px-2 py-0.5 rounded-md text-micro font-semibold uppercase tracking-widest border bg-chart-4/10 text-chart-4 border-chart-4/20">STP</span>}
                                    </div>
                                    <p className="text-caption text-foreground/30 uppercase tracking-[0.2em] mt-1 truncate">{broker.highlight}</p>
                                  </div>
                                </div>

                                <div className="flex flex-wrap gap-2">
                                  {broker.tags.slice(0, 3).map((tag) => (
                                    <span key={tag} className="px-2.5 py-1 rounded-full bg-foreground/5 border border-border text-micro font-semibold uppercase tracking-widest text-foreground/40">
                                      {tag}
                                    </span>
                                  ))}
                                </div>
                              </div>

                              <div className="text-right shrink-0 space-y-1">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    toggleFavorite(broker.id);
                                  }}
                                  className={cn(
                                    "ml-auto mb-1 w-7 h-7 rounded-full border flex items-center justify-center transition-all",
                                    favorite ? "bg-chart-4/10 text-chart-4 border-chart-4/20" : "bg-foreground/5 text-foreground/30 border-border hover:text-foreground",
                                  )}
                                  aria-label={favorite ? `Remove ${broker.name} from favorites` : `Add ${broker.name} to favorites`}
                                >
                                  <Heart className={cn("w-3.5 h-3.5", favorite && "fill-current")} />
                                </button>
                                <div className="text-micro font-semibold uppercase tracking-widest text-foreground/20">{broker.region}</div>
                                <div className="text-micro font-semibold uppercase tracking-widest text-foreground/40">{broker.execution}</div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-micro uppercase tracking-[0.3em] font-semibold text-foreground/25">
                      <SlidersHorizontal className="w-3.5 h-3.5 text-chart-5" /> Region groups
                    </div>
                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">
                      {regionGroups.map((group) => (
                        <div key={group.region} className="p-4 rounded-[22px] bg-foreground/2 border border-border space-y-3">
                          <div className="flex items-center justify-between gap-3">
                            <div className="text-xs font-semibold uppercase tracking-[0.25em] text-foreground/40">{group.region}</div>
                            <div className="text-micro font-semibold uppercase tracking-widest text-foreground/20">{group.brokers.length} brokers</div>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {group.brokers.slice(0, 4).map((broker) => (
                              <button
                                key={broker.id}
                                onClick={() => {
                                  setSelectedBrokerId(broker.id);
                                  markRecentBroker(broker.id);
                                }}
                                className={cn(
                                  "px-3 py-2 rounded-full border text-micro font-semibold uppercase tracking-widest transition-all",
                                  selectedBrokerId === broker.id
                                    ? "bg-primary text-foreground border-primary/40"
                                    : "bg-foreground/3 text-foreground/40 border-border hover:border-border hover:text-foreground",
                                )}
                              >
                                {broker.name}
                              </button>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="rounded-[28px] bg-[#0a0a0a] border border-border p-4 xl:p-5 flex flex-col min-h-0 overflow-hidden">
                  <div className="space-y-3 flex-1 min-h-0 overflow-y-auto pr-1">
                    <div className="p-4 rounded-2xl bg-foreground/3 border border-border space-y-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="space-y-1 min-w-0">
                          <div className="flex items-center gap-2 text-xs uppercase tracking-[0.3em] text-primary font-semibold"><Building2 className="w-4 h-4" /> Selected broker</div>
                          <div className="flex items-center gap-3 min-w-0">
                            <div className={cn(
                              'w-10 h-10 rounded-xl flex items-center justify-center border ring-1 shrink-0',
                              (BROKER_BRAND[selectedBroker.id]?.badgeBg ?? 'bg-foreground/10'),
                              (BROKER_BRAND[selectedBroker.id]?.ring ?? 'ring-white/20'),
                              'border-border',
                            )}>
                              <span className={cn('text-caption font-bold tracking-tight', BROKER_BRAND[selectedBroker.id]?.text ?? 'text-foreground')}>
                                {BROKER_BRAND[selectedBroker.id]?.mark ?? selectedBroker.name.slice(0, 2).toUpperCase()}
                              </span>
                            </div>
                            <h4 className="text-xl font-semibold text-foreground uppercase tracking-tight break-words leading-tight">{selectedBroker.name}</h4>
                          </div>
                        </div>
                        <div className="px-3 py-1 rounded-full bg-foreground/5 border border-border text-micro font-semibold uppercase tracking-widest text-foreground/40">
                          {selectedBroker.integration === 'PAPER' ? 'Simulation' : 'Live bridge'}
                        </div>
                      </div>

                      <p className="text-xs text-foreground/35 leading-relaxed line-clamp-2">{selectedBroker.description}</p>

                      <div className="flex flex-wrap gap-1.5">
                        {selectedBroker.tags.map((tag) => (
                          <span key={tag} className="px-2 py-0.5 rounded-full bg-foreground/5 border border-border text-micro font-semibold uppercase tracking-widest text-foreground/35">
                            {tag}
                          </span>
                        ))}
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div className="p-2.5 rounded-xl bg-black/20 border border-border">
                          <div className="text-foreground/20 uppercase tracking-widest font-semibold text-micro mb-0.5">Platform</div>
                          <div className="text-foreground font-semibold">{selectedBroker.platform}</div>
                        </div>
                        <div className="p-2.5 rounded-xl bg-black/20 border border-border">
                          <div className="text-foreground/20 uppercase tracking-widest font-semibold text-micro mb-0.5">Min deposit</div>
                          <div className="text-foreground font-semibold">{selectedBroker.minDeposit}</div>
                        </div>
                        <div className="p-2.5 rounded-xl bg-black/20 border border-border">
                          <div className="text-foreground/20 uppercase tracking-widest font-semibold text-micro mb-0.5">Spread</div>
                          <div className="text-foreground font-semibold">{selectedBroker.spread}</div>
                        </div>
                        <div className="p-2.5 rounded-xl bg-black/20 border border-border">
                          <div className="text-foreground/20 uppercase tracking-widest font-semibold text-micro mb-0.5">Region</div>
                          <div className="text-foreground font-semibold">{selectedBroker.region}</div>
                        </div>
                      </div>
                    </div>

                    {selectedBroker.integration === 'PAPER' ? (
                      <div className="p-4 rounded-2xl bg-chart-3/5 border border-chart-3/20 text-center space-y-2">
                        <p className="text-xs text-chart-3 uppercase tracking-[0.3em] font-semibold">Paper / Demo mode</p>
                        <p className="text-xs text-foreground/40 uppercase tracking-widest leading-relaxed">No credentials required. Use this for sandbox testing, strategy validation, and UI walkthroughs.</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {selectedBroker.categories.includes('MT4') && selectedBroker.categories.includes('MT5') && (
                          <div className="space-y-2">
                            <label className="text-micro text-foreground/40 uppercase tracking-widest ml-1 font-bold">Platform</label>
                            <div className="grid grid-cols-2 gap-2">
                              {(['mt4', 'mt5'] as const).map((p) => (
                                <button
                                  key={p}
                                  type="button"
                                  onClick={() => setPlatform(p)}
                                  className={cn(
                                    'h-10 rounded-xl border text-xs font-bold uppercase tracking-widest transition-all',
                                    platform === p
                                      ? 'bg-primary/15 border-primary/40 text-foreground'
                                      : 'bg-foreground/3 border-border text-foreground/40 hover:text-foreground hover:border-border',
                                  )}
                                >
                                  {p.toUpperCase()}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}

                        <div className="space-y-1.5">
                          <label className="text-micro text-foreground/40 uppercase tracking-widest ml-1 font-bold">Login ID (Account Number)</label>
                          <input
                            value={login}
                            onChange={(e) => setLogin(e.target.value)}
                            className="w-full h-10 bg-foreground/3 border border-border rounded-xl px-4 text-sm text-foreground focus:border-primary/50 outline-none"
                            placeholder="e.g. 1040294"
                          />
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-micro text-foreground/40 uppercase tracking-widest ml-1 font-bold">Master Password</label>
                          <input
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            type="password"
                            className="w-full h-10 bg-foreground/3 border border-border rounded-xl px-4 text-sm text-foreground focus:border-primary/50 outline-none"
                            placeholder="••••••••"
                          />
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-micro text-foreground/40 uppercase tracking-widest ml-1 font-bold">Server Name</label>
                          {(selectedBroker.servers?.length ?? 0) > 0 ? (
                            <select
                              value={serverName}
                              onChange={(e) => setServerName(e.target.value)}
                              className="w-full h-10 bg-foreground/3 border border-border rounded-xl px-4 text-sm text-foreground focus:border-primary/50 outline-none appearance-none cursor-pointer"
                            >
                              {selectedBroker.servers!.map((s) => (
                                <option key={s} value={s} className="bg-[#111]">{s}</option>
                              ))}
                              <option value="__custom__" className="bg-[#111]">Enter custom…</option>
                            </select>
                          ) : (
                            <input
                              value={serverName}
                              onChange={(e) => setServerName(e.target.value)}
                              className="w-full h-10 bg-foreground/3 border border-border rounded-xl px-4 text-sm text-foreground focus:border-primary/50 outline-none"
                              placeholder="e.g. BrokerName-Live"
                            />
                          )}
                          {serverName === '__custom__' && (
                            <input
                              autoFocus
                              value=""
                              onChange={(e) => setServerName(e.target.value)}
                              className="w-full h-10 bg-foreground/3 border border-primary/30 rounded-xl px-4 text-sm text-foreground focus:border-primary/50 outline-none"
                              placeholder="Type custom server name…"
                            />
                          )}
                          <p className="text-micro text-foreground/20 ml-1 mt-0.5">Find in MT4/MT5 → File → Login → Server dropdown</p>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="shrink-0 pt-4 mt-2 border-t border-border space-y-2">
                    <button
                      onClick={handleConnectBroker}
                      disabled={isConnecting || (selectedBroker.integration !== 'PAPER' && (!login || !password || !serverName || serverName === '__custom__'))}
                      className="w-full h-12 bg-white text-primary-foreground text-sm font-bold uppercase tracking-widest rounded-xl hover:bg-foreground/90 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2.5 transition-colors"
                    >
                      {isConnecting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
                      {isConnecting ? 'Verifying…' : selectedBroker.integration === 'PAPER' ? 'Launch Demo Account' : `Connect ${selectedBroker.name}`}
                    </button>
                    <p className="text-micro text-foreground/20 leading-relaxed text-center px-2">
                      {selectedBroker.integration === 'PAPER'
                        ? 'Demo account uses simulated execution with virtual balance.'
                        : 'Credentials encrypted with AES-GCM before storage. Connection proxied via MetaAPI bridge.'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
