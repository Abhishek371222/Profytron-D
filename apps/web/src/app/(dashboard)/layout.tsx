'use client';

import React from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { useTradingStore } from '@/lib/stores/useTradingStore';
import { cn } from '@/lib/utils';
import { Info, X, ArrowRight, Zap, CheckCircle, Loader2, Search, Globe, ShieldCheck, Star, Building2, Heart, SlidersHorizontal, BadgeCheck, Crown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { usePathname } from 'next/navigation';
import { brokerApi } from '@/lib/api/broker';
import { toast } from 'sonner';

type BrokerEntry = {
  id: string;
  name: string;
  displayName: string;
  region: string;
  platform: string;
  execution: string;
  minDeposit: string;
  spread: string;
  highlight: string;
  description: string;
  tags: string[];
  categories: string[];
  accent: string;
  integration: 'PAPER' | 'MT5';
};

const BROKER_FILTERS = ['All', 'Favorites', 'Paper', 'MT5', 'ECN', 'STP', 'DMA', 'Beginner-friendly'] as const;
const FEATURED_BROKERS = ['MT5', 'IC_MARKETS', 'PEPPERSTONE', 'EXNESS', 'OANDA', 'PAPER'] as const;

const BROKER_REGIONS = ['Global', 'US / Global', 'EU / Global', 'UK / Global'] as const;

const BROKER_BRAND: Record<string, { mark: string; text: string; ring: string; badgeBg: string }> = {
  PAPER: { mark: 'P', text: 'text-emerald-200', ring: 'ring-emerald-300/30', badgeBg: 'bg-emerald-500/20' },
  MT5: { mark: 'MT5', text: 'text-indigo-100', ring: 'ring-indigo-300/30', badgeBg: 'bg-indigo-500/20' },
  IC_MARKETS: { mark: 'IC', text: 'text-cyan-100', ring: 'ring-cyan-300/30', badgeBg: 'bg-cyan-500/20' },
  PEPPERSTONE: { mark: 'PS', text: 'text-violet-100', ring: 'ring-violet-300/30', badgeBg: 'bg-violet-500/20' },
  EXNESS: { mark: 'EX', text: 'text-amber-100', ring: 'ring-amber-300/30', badgeBg: 'bg-amber-500/20' },
  XM: { mark: 'XM', text: 'text-rose-100', ring: 'ring-rose-300/30', badgeBg: 'bg-rose-500/20' },
  FOREX_COM: { mark: 'FX', text: 'text-sky-100', ring: 'ring-sky-300/30', badgeBg: 'bg-sky-500/20' },
  OANDA: { mark: 'OA', text: 'text-lime-100', ring: 'ring-lime-300/30', badgeBg: 'bg-lime-500/20' },
  AVATRADE: { mark: 'AV', text: 'text-red-100', ring: 'ring-red-300/30', badgeBg: 'bg-red-500/20' },
  FP_MARKETS: { mark: 'FP', text: 'text-blue-100', ring: 'ring-blue-300/30', badgeBg: 'bg-blue-500/20' },
  ADMIRALS: { mark: 'AD', text: 'text-yellow-100', ring: 'ring-yellow-300/30', badgeBg: 'bg-yellow-500/20' },
  TICKMILL: { mark: 'TM', text: 'text-cyan-100', ring: 'ring-cyan-300/30', badgeBg: 'bg-cyan-500/20' },
  AXI: { mark: 'AX', text: 'text-purple-100', ring: 'ring-purple-300/30', badgeBg: 'bg-purple-500/20' },
  FXTM: { mark: 'FT', text: 'text-indigo-100', ring: 'ring-indigo-300/30', badgeBg: 'bg-indigo-500/20' },
  ROBOFOREX: { mark: 'RF', text: 'text-emerald-100', ring: 'ring-emerald-300/30', badgeBg: 'bg-emerald-500/20' },
  HFM: { mark: 'HF', text: 'text-slate-100', ring: 'ring-slate-300/30', badgeBg: 'bg-slate-500/20' },
  BLACKBULL: { mark: 'BB', text: 'text-orange-100', ring: 'ring-orange-300/30', badgeBg: 'bg-orange-500/20' },
  CMC: { mark: 'CMC', text: 'text-zinc-100', ring: 'ring-zinc-300/30', badgeBg: 'bg-zinc-500/20' },
  IG: { mark: 'IG', text: 'text-emerald-100', ring: 'ring-emerald-300/30', badgeBg: 'bg-emerald-500/20' },
  SWISSQUOTE: { mark: 'SQ', text: 'text-stone-100', ring: 'ring-stone-300/30', badgeBg: 'bg-stone-500/20' },
  SAXO: { mark: 'SX', text: 'text-cyan-100', ring: 'ring-cyan-300/30', badgeBg: 'bg-cyan-500/20' },
};

const BROKER_DIRECTORY: BrokerEntry[] = [
  {
    id: 'PAPER',
    name: 'Paper Trading',
    displayName: 'Paper Trading',
    region: 'Global',
    platform: 'Simulated',
    execution: 'Virtual / Instant',
    minDeposit: '$0',
    spread: 'Synthetic',
    highlight: 'Best for strategy testing',
    description: 'High-fidelity sandbox with virtual capital, no real market exposure, and instant fills.',
    tags: ['Demo', 'Risk-free', 'Backtest-ready'],
    categories: ['Paper', 'Beginner-friendly'],
    accent: 'from-emerald-400/20 via-teal-400/10 to-transparent',
    integration: 'PAPER',
  },
  {
    id: 'MT5',
    name: 'MetaTrader 5',
    displayName: 'MT5 Bridge',
    region: 'Global',
    platform: 'MT5 Terminal',
    execution: 'ECN / STP',
    minDeposit: 'Varies',
    spread: 'Broker dependent',
    highlight: 'Universal forex terminal',
    description: 'Universal bridge for forex, indices, metals, and CFDs using the MT5 connection flow.',
    tags: ['Universal', 'EA-ready', 'Multi-asset'],
    categories: ['MT5', 'Beginner-friendly'],
    accent: 'from-p/25 via-indigo-400/10 to-transparent',
    integration: 'MT5',
  },
  {
    id: 'IC_MARKETS',
    name: 'IC Markets',
    displayName: 'IC Markets',
    region: 'Global',
    platform: 'MT5 / cTrader',
    execution: 'RAW ECN',
    minDeposit: '$200',
    spread: 'From 0.0 pips',
    highlight: 'Popular ECN choice',
    description: 'A common raw-spread forex venue for high-frequency and automated strategies.',
    tags: ['ECN', 'Raw spread', 'HFT-friendly'],
    categories: ['MT5', 'ECN'],
    accent: 'from-cyan-400/20 via-blue-400/10 to-transparent',
    integration: 'MT5',
  },
  {
    id: 'PEPPERSTONE',
    name: 'Pepperstone',
    displayName: 'Pepperstone',
    region: 'Global',
    platform: 'MT5 / cTrader',
    execution: 'Low-latency',
    minDeposit: '$0',
    spread: 'From 0.0 pips',
    highlight: 'Low-latency execution',
    description: 'Well-known for fast execution and multiple platform support for forex trading.',
    tags: ['Low latency', 'Multi-platform', 'Scalping'],
    categories: ['MT5', 'ECN', 'STP'],
    accent: 'from-violet-400/20 via-fuchsia-400/10 to-transparent',
    integration: 'MT5',
  },
  {
    id: 'EXNESS',
    name: 'Exness',
    displayName: 'Exness',
    region: 'Global',
    platform: 'MT5 / MT4',
    execution: 'Instant / Market',
    minDeposit: '$10',
    spread: 'Floating',
    highlight: 'Flexible account types',
    description: 'Offers retail-friendly onboarding and multiple account configurations for FX traders.',
    tags: ['Flexible', 'Micro deposits', 'Multi-account'],
    categories: ['MT5', 'Beginner-friendly'],
    accent: 'from-amber-400/20 via-orange-400/10 to-transparent',
    integration: 'MT5',
  },
  {
    id: 'XM',
    name: 'XM',
    displayName: 'XM',
    region: 'Global',
    platform: 'MT5 / MT4',
    execution: 'Market execution',
    minDeposit: '$5',
    spread: 'From 0.6 pips',
    highlight: 'Entry-friendly broker',
    description: 'Popular among retail FX traders for low minimums and broad account availability.',
    tags: ['Retail-friendly', 'Low minimum', 'Multi-account'],
    categories: ['MT5', 'Beginner-friendly'],
    accent: 'from-pink-400/20 via-rose-400/10 to-transparent',
    integration: 'MT5',
  },
  {
    id: 'FOREX_COM',
    name: 'FOREX.com',
    displayName: 'FOREX.com',
    region: 'US / Global',
    platform: 'MT5 / Web',
    execution: 'DMA / Dealing desk',
    minDeposit: '$100',
    spread: 'Variable',
    highlight: 'Major US forex venue',
    description: 'Well-known regulated broker option with strong platform tooling and research.',
    tags: ['US broker', 'Research', 'DMA'],
    categories: ['MT5', 'DMA'],
    accent: 'from-sky-400/20 via-cyan-400/10 to-transparent',
    integration: 'MT5',
  },
  {
    id: 'OANDA',
    name: 'OANDA',
    displayName: 'OANDA',
    region: 'US / Global',
    platform: 'MT5 / API',
    execution: 'Spread-only',
    minDeposit: '$0',
    spread: 'Transparent',
    highlight: 'API-friendly',
    description: 'Favored for API access and clean FX execution for systematic traders.',
    tags: ['API-first', 'US regulated', 'Transparent'],
    categories: ['MT5', 'DMA'],
    accent: 'from-emerald-400/20 via-lime-400/10 to-transparent',
    integration: 'MT5',
  },
  {
    id: 'AVATRADE',
    name: 'AvaTrade',
    displayName: 'AvaTrade',
    region: 'Global',
    platform: 'MT5 / AvaTradeGO',
    execution: 'Market execution',
    minDeposit: '$100',
    spread: 'Fixed / floating',
    highlight: 'Retail-friendly bundle',
    description: 'Retail broker with multiple platform options and broad asset coverage.',
    tags: ['Retail', 'Web + mobile', 'Multi-asset'],
    categories: ['MT5', 'Beginner-friendly'],
    accent: 'from-rose-400/20 via-red-400/10 to-transparent',
    integration: 'MT5',
  },
  {
    id: 'FP_MARKETS',
    name: 'FP Markets',
    displayName: 'FP Markets',
    region: 'Global',
    platform: 'MT5 / cTrader',
    execution: 'RAW ECN',
    minDeposit: '$100',
    spread: 'From 0.0 pips',
    highlight: 'Strong ECN access',
    description: 'Popular with traders who want raw spreads and solid platform choices.',
    tags: ['ECN', 'Raw pricing', 'Fast execution'],
    categories: ['MT5', 'ECN'],
    accent: 'from-indigo-400/20 via-blue-400/10 to-transparent',
    integration: 'MT5',
  },
  {
    id: 'ADMIRALS',
    name: 'Admirals',
    displayName: 'Admirals',
    region: 'EU / Global',
    platform: 'MT5 / MT4',
    execution: 'Market / ECN',
    minDeposit: '$100',
    spread: 'Variable',
    highlight: 'Balanced all-rounder',
    description: 'A broad brokerage option for traders who want platform variety and research.',
    tags: ['Balanced', 'Research', 'EU'],
    categories: ['MT5', 'STP'],
    accent: 'from-yellow-400/20 via-amber-400/10 to-transparent',
    integration: 'MT5',
  },
  {
    id: 'TICKMILL',
    name: 'Tickmill',
    displayName: 'Tickmill',
    region: 'Global',
    platform: 'MT5 / MT4',
    execution: 'ECN',
    minDeposit: '$100',
    spread: 'Raw ECN',
    highlight: 'Scalper favorite',
    description: 'Known for tight execution and raw-style forex account types.',
    tags: ['Scalping', 'ECN', 'Tight spread'],
    categories: ['MT5', 'ECN'],
    accent: 'from-cyan-400/20 via-sky-400/10 to-transparent',
    integration: 'MT5',
  },
  {
    id: 'AXI',
    name: 'Axi',
    displayName: 'Axi',
    region: 'Global',
    platform: 'MT5',
    execution: 'Market execution',
    minDeposit: '$0',
    spread: 'Competitive',
    highlight: 'Simple MT5 access',
    description: 'Clean MT5-based broker for forex traders who want a straightforward workflow.',
    tags: ['MT5', 'Simple', 'FX-focused'],
    categories: ['MT5', 'Beginner-friendly'],
    accent: 'from-purple-400/20 via-violet-400/10 to-transparent',
    integration: 'MT5',
  },
  {
    id: 'FXTM',
    name: 'FXTM',
    displayName: 'FXTM',
    region: 'Global',
    platform: 'MT5 / MT4',
    execution: 'Market / Instant',
    minDeposit: '$10',
    spread: 'Variable',
    highlight: 'Flexible account levels',
    description: 'Retail-oriented FX venue with account variety and platform coverage.',
    tags: ['Flexible', 'Retail', 'MT5'],
    categories: ['MT5', 'Beginner-friendly'],
    accent: 'from-p/20 via-indigo-400/10 to-transparent',
    integration: 'MT5',
  },
  {
    id: 'ROBOFOREX',
    name: 'RoboForex',
    displayName: 'RoboForex',
    region: 'Global',
    platform: 'MT5 / MT4',
    execution: 'ECN / market',
    minDeposit: '$10',
    spread: 'Variable',
    highlight: 'Strategy-friendly',
    description: 'Popular with algorithmic traders and those testing across multiple account styles.',
    tags: ['Algo-friendly', 'Low minimum', 'Multi-account'],
    categories: ['MT5', 'ECN'],
    accent: 'from-teal-400/20 via-emerald-400/10 to-transparent',
    integration: 'MT5',
  },
  {
    id: 'HFM',
    name: 'HFM',
    displayName: 'HFM',
    region: 'Global',
    platform: 'MT5 / MT4',
    execution: 'Market / ECN',
    minDeposit: '$5',
    spread: 'Floating',
    highlight: 'Low-entry access',
    description: 'Widely used retail broker with low deposits and multiple account styles.',
    tags: ['Retail', 'Low deposit', 'MT5'],
    categories: ['MT5', 'Beginner-friendly'],
    accent: 'from-slate-400/20 via-gray-400/10 to-transparent',
    integration: 'MT5',
  },
  {
    id: 'BLACKBULL',
    name: 'BlackBull Markets',
    displayName: 'BlackBull Markets',
    region: 'Global',
    platform: 'MT5 / cTrader',
    execution: 'ECN',
    minDeposit: '$0',
    spread: 'Raw / variable',
    highlight: 'Raw pricing option',
    description: 'ECN venue aimed at traders who want direct-market style execution.',
    tags: ['ECN', 'Raw pricing', 'Direct access'],
    categories: ['MT5', 'ECN'],
    accent: 'from-orange-400/20 via-amber-400/10 to-transparent',
    integration: 'MT5',
  },
  {
    id: 'CMC',
    name: 'CMC Markets',
    displayName: 'CMC Markets',
    region: 'UK / Global',
    platform: 'MT5 / Next Gen',
    execution: 'Market execution',
    minDeposit: '$0',
    spread: 'Competitive',
    highlight: 'Deep research stack',
    description: 'Strong for traders that value charting, research, and established broker infrastructure.',
    tags: ['Research', 'Established', 'Web platform'],
    categories: ['MT5', 'STP'],
    accent: 'from-white/10 via-cyan-400/10 to-transparent',
    integration: 'MT5',
  },
  {
    id: 'IG',
    name: 'IG',
    displayName: 'IG',
    region: 'UK / Global',
    platform: 'Web / MT5',
    execution: 'Market execution',
    minDeposit: '$0',
    spread: 'Variable',
    highlight: 'Institutional-grade presence',
    description: 'Long-standing broker with broad market access and strong compliance footprint.',
    tags: ['Global', 'Established', 'Multi-market'],
    categories: ['MT5', 'DMA'],
    accent: 'from-emerald-400/20 via-cyan-400/10 to-transparent',
    integration: 'MT5',
  },
  {
    id: 'SWISSQUOTE',
    name: 'Swissquote',
    displayName: 'Swissquote',
    region: 'EU / Global',
    platform: 'MT5 / proprietary',
    execution: 'Market execution',
    minDeposit: '$1,000+',
    spread: 'Premium',
    highlight: 'Premium brokerage tier',
    description: 'Bank-backed broker option for traders who want premium custody and access.',
    tags: ['Premium', 'Bank-backed', 'Global'],
    categories: ['MT5', 'DMA'],
    accent: 'from-stone-200/20 via-slate-400/10 to-transparent',
    integration: 'MT5',
  },
  {
    id: 'SAXO',
    name: 'Saxo',
    displayName: 'Saxo',
    region: 'EU / Global',
    platform: 'SaxoTrader / MT5',
    execution: 'Market execution',
    minDeposit: 'Premium',
    spread: 'Institutional',
    highlight: 'Multi-asset premium access',
    description: 'Premium broker for multi-asset traders who want institutional-style tooling.',
    tags: ['Premium', 'Multi-asset', 'Institutional'],
    categories: ['MT5', 'DMA'],
    accent: 'from-cyan-300/20 via-indigo-400/10 to-transparent',
    integration: 'MT5',
  },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
 const pathname = usePathname();
 const [showDemoBanner, setShowDemoBanner] = React.useState(true);
 const [showBrokerModal, setShowBrokerModal] = React.useState(false);
 const [mounted, setMounted] = React.useState(false);
 
 // Broker Form State
 const [selectedBrokerId, setSelectedBrokerId] = React.useState('MT5');
 const [brokerSearch, setBrokerSearch] = React.useState('');
 const [activeFilter, setActiveFilter] = React.useState<(typeof BROKER_FILTERS)[number]>('All');
 const [favoriteBrokers, setFavoriteBrokers] = React.useState<string[]>([]);
 const [recentBrokerIds, setRecentBrokerIds] = React.useState<string[]>(['MT5', 'PAPER']);
 const [accountNumber, setAccountNumber] = React.useState('');
 const [password, setPassword] = React.useState('');
 const [serverName, setServerName] = React.useState('');
 const [isConnecting, setIsConnecting] = React.useState(false);

 React.useEffect(() => {
 setMounted(true);
 }, []);

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
         matchesFilter = broker.integration === 'PAPER';
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

 const isBuilder = pathname?.includes('/strategies/builder');
 const isDemo = process.env.NEXT_PUBLIC_DEMO_MODE === 'true'; 

 const handleConnectBroker = async () => {
   setIsConnecting(true);
   try {
     await brokerApi.connectBroker({
       brokerName: selectedBroker.integration === 'PAPER' ? 'PAPER' : selectedBroker.name,
       accountNumber,
       password,
       serverName,
     });
     markRecentBroker(selectedBroker.id);
    toast.success(`${selectedBroker.name} connected securely`);
     setShowBrokerModal(false);
     setShowDemoBanner(false);
   } catch (e: any) {
     toast.error('Broker connection failed', {
       description: e.response?.data?.message || 'Connection failed',
     });
   } finally {
     setIsConnecting(false);
   }
 };

 return (
 <AppShell>
 <div suppressHydrationWarning className={cn("relative flex flex-col", !isBuilder &&"gap-6")}>
 <AnimatePresence>
 {mounted && isDemo && showDemoBanner && !isBuilder && (
 <motion.div
 initial={{ height: 0, opacity: 0 }}
 animate={{ height: 'auto', opacity: 1 }}
 exit={{ height: 0, opacity: 0 }}
 className="overflow-hidden"
 >
 <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4 flex items-center justify-between group">
 <div className="flex items-center gap-3">
 <div className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center border border-amber-500/30">
 <Info className="w-5 h-5 text-amber-500" />
 </div>
 <div>
 <h4 className="text-sm font-bold text-amber-500 uppercase tracking-widest">Demo Mode Active</h4>
 <p className="text-xs text-amber-500/70 font-medium">Simulated market data. No real capital at risk.</p>
 </div>
 </div>
 
 <div className="flex items-center gap-6">
 <button 
   onClick={() => setShowBrokerModal(true)}
   className="flex items-center gap-2 text-xs font-semibold text-white hover:text-p transition-colors uppercase tracking-widest group/btn"
 >
 Connect real broker
 <ArrowRight className="w-3 h-3 group-hover/btn:translate-x-1 transition-transform" />
 </button>
 <button 
 onClick={() => setShowDemoBanner(false)}
 className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center border border-white/5 hover:bg-white/10 transition-colors"
 >
 <X className="w-4 h-4 text-white/40" />
 </button>
 </div>
 </div>
 </motion.div>
 )}
 </AnimatePresence>

 <AnimatePresence>
  {showBrokerModal && (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/80 backdrop-blur-xl"
      onClick={(e) => e.target === e.currentTarget && setShowBrokerModal(false)}
    >
      <motion.div
        initial={{ scale: 0.95, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.95 }}
        className="w-full max-w-6xl max-h-[90vh] rounded-4xl bg-[#080808] border border-white/10 p-5 md:p-6 shadow-2xl relative overflow-hidden"
      >
        <div className="absolute inset-0 bg-linear-to-br from-p/5 to-transparent pointer-events-none" />

        <div className="relative z-10 flex flex-col h-[calc(90vh-2.5rem)]">
          <div className="flex items-start justify-between gap-4 pb-4 border-b border-white/5">
            <div className="space-y-1">
               <h3 className="text-2xl md:text-3xl font-semibold text-white uppercase tracking-tight">Connect Broker</h3>
               <p className="text-xs text-white/40 font-semibold uppercase tracking-widest">AES-GCM encrypted connection • forex-ready broker directory</p>
            </div>
            <button onClick={() => setShowBrokerModal(false)} className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10 shrink-0">
              <X className="w-4 h-4 text-white/60" />
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-[1.15fr_0.85fr] gap-4 xl:gap-6 flex-1 min-h-0 pt-4">
            <div className="space-y-4 min-h-0 flex flex-col">
              <div className="relative">
                <Search className="w-4 h-4 text-white/30 absolute left-4 top-1/2 -translate-y-1/2" />
                <input
                  value={brokerSearch}
                  onChange={(e) => setBrokerSearch(e.target.value)}
                  placeholder="Search broker, platform, region, or tag..."
                  className="w-full h-12 bg-white/3 border border-white/5 rounded-2xl pl-11 pr-4 text-sm text-white placeholder:text-white/20 focus:border-p/50 outline-none"
                />
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {BROKER_FILTERS.map((filter) => (
                  <button
                    key={filter}
                    onClick={() => setActiveFilter(filter)}
                    className={cn(
                      "px-3 py-2 rounded-full border text-[10px] font-semibold uppercase tracking-widest transition-all",
                      activeFilter === filter
                        ? "bg-p text-white border-p/40"
                        : "bg-white/3 text-white/40 border-white/5 hover:text-white hover:border-white/10",
                    )}
                  >
                    {filter}
                  </button>
                ))}
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.3em] font-semibold text-white/25">
                  <BadgeCheck className="w-3.5 h-3.5 text-p" /> Recently used
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
                          "px-3 py-2 rounded-full border text-[10px] font-semibold uppercase tracking-widest transition-all",
                          selectedBrokerId === broker.id
                            ? "bg-p text-white border-p/40"
                            : "bg-white/3 text-white/40 border-white/5 hover:border-white/10 hover:text-white",
                        )}
                      >
                        {broker.name}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.3em] font-semibold text-white/25">
                  <Crown className="w-3.5 h-3.5 text-amber-400" /> Featured brokers
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
                  {featuredBrokers.map((broker) => {
                    const active = selectedBrokerId === broker.id;
                    const favorite = favoriteBrokers.includes(broker.id);
                    const brand = BROKER_BRAND[broker.id] ?? { mark: broker.name.slice(0, 2).toUpperCase(), text: 'text-white', ring: 'ring-white/20', badgeBg: 'bg-white/10' };
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
                          active ? "bg-p/10 border-p/30 shadow-[0_0_28px_rgba(99,102,241,0.2)]" : "bg-white/2 border-white/5 hover:border-white/10 hover:bg-white/4",
                        )}
                      >
                        <div className={cn("absolute inset-0 bg-linear-to-br opacity-60", broker.accent)} />
                        <div className="relative z-10 space-y-3">
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex items-center gap-3 min-w-0">
                              <div className={cn("w-11 h-11 rounded-2xl flex items-center justify-center border shrink-0 ring-1", brand.badgeBg, brand.ring, active ? "border-p/40" : "border-white/10")}>
                                <span className={cn('text-[11px] font-bold tracking-tight', brand.text)}>{brand.mark}</span>
                              </div>
                              <div className="min-w-0">
                                <div className="text-xs font-semibold text-white uppercase tracking-tight truncate">{broker.name}</div>
                                <div className="text-[10px] text-white/30 uppercase tracking-[0.25em] mt-1 truncate">{broker.highlight}</div>
                              </div>
                            </div>

                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleFavorite(broker.id);
                              }}
                              className={cn(
                                "w-7 h-7 rounded-full border flex items-center justify-center transition-all shrink-0",
                                favorite ? "bg-amber-500/10 text-amber-400 border-amber-500/20" : "bg-white/5 text-white/30 border-white/10 hover:text-white",
                              )}
                            >
                              <Heart className={cn("w-3.5 h-3.5", favorite && "fill-current")} />
                            </button>
                          </div>

                          <div className="flex items-center justify-between gap-2 text-[10px] uppercase tracking-widest text-white/40">
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
                <div className="p-4 rounded-2xl bg-white/3 border border-white/5">
                  <div className="flex items-center gap-2 text-white/40 text-[10px] uppercase tracking-widest font-semibold mb-2"><Globe className="w-3.5 h-3.5" /> Global access</div>
                  <div className="text-sm text-white font-semibold">20+ broker choices</div>
                </div>
                <div className="p-4 rounded-2xl bg-white/3 border border-white/5">
                  <div className="flex items-center gap-2 text-white/40 text-[10px] uppercase tracking-widest font-semibold mb-2"><ShieldCheck className="w-3.5 h-3.5" /> Secure flow</div>
                  <div className="text-sm text-white font-semibold">AES-GCM encryption</div>
                </div>
                <div className="p-4 rounded-2xl bg-white/3 border border-white/5 sm:col-span-1 col-span-2">
                  <div className="flex items-center gap-2 text-white/40 text-[10px] uppercase tracking-widest font-semibold mb-2"><Star className="w-3.5 h-3.5" /> Recommended</div>
                  <div className="text-sm text-white font-semibold">MT5 + paper sandbox</div>
                </div>
              </div>

              <div className="flex-1 min-h-0 rounded-[28px] bg-white/2 border border-white/5 p-3 overflow-hidden">
                <div className="h-full overflow-y-auto pr-1 space-y-3">
                  {filteredBrokers.map((broker) => {
                    const active = selectedBrokerId === broker.id;
                    const favorite = favoriteBrokers.includes(broker.id);
                    const brand = BROKER_BRAND[broker.id] ?? { mark: broker.name.slice(0, 2).toUpperCase(), text: 'text-white', ring: 'ring-white/20', badgeBg: 'bg-white/10' };
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
                          active ? "bg-p/10 border-p/30 shadow-[0_0_24px_rgba(99,102,241,0.18)]" : "bg-white/2 border-white/5 hover:border-white/10 hover:bg-white/4",
                        )}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="space-y-2 min-w-0">
                            <div className="flex items-center gap-3 min-w-0">
                              <div className={cn(
                                "w-10 h-10 rounded-xl flex items-center justify-center border shrink-0 relative overflow-hidden ring-1",
                                active ? "bg-p text-white border-p/40" : "bg-white/5 text-white/60 border-white/10",
                                brand.ring,
                              )}>
                                <div className={cn("absolute inset-0 bg-linear-to-br", broker.accent)} />
                                <span className={cn('relative z-10 text-[11px] font-bold tracking-tight', brand.text)}>{brand.mark}</span>
                              </div>
                              <div className="min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="text-sm font-semibold text-white uppercase tracking-tight">{broker.name}</span>
                                  <span className={cn("px-2 py-0.5 rounded-md text-[10px] font-semibold uppercase tracking-widest border", broker.integration === 'PAPER' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-white/5 text-white/40 border-white/10')}>
                                    {broker.integration === 'PAPER' ? 'Demo' : broker.platform}
                                  </span>
                                  {broker.categories.includes('DMA') && <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold uppercase tracking-widest border bg-cyan-500/10 text-cyan-400 border-cyan-500/20">DMA</span>}
                                  {broker.categories.includes('ECN') && <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold uppercase tracking-widest border bg-indigo-500/10 text-indigo-400 border-indigo-500/20">ECN</span>}
                                  {broker.categories.includes('STP') && <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold uppercase tracking-widest border bg-amber-500/10 text-amber-400 border-amber-500/20">STP</span>}
                                </div>
                                <p className="text-[11px] text-white/30 uppercase tracking-[0.2em] mt-1 truncate">{broker.highlight}</p>
                              </div>
                            </div>

                            <div className="flex flex-wrap gap-2">
                              {broker.tags.slice(0, 3).map((tag) => (
                                <span key={tag} className="px-2.5 py-1 rounded-full bg-white/5 border border-white/5 text-[10px] font-semibold uppercase tracking-widest text-white/40">
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
                                favorite ? "bg-amber-500/10 text-amber-400 border-amber-500/20" : "bg-white/5 text-white/30 border-white/10 hover:text-white",
                              )}
                              aria-label={favorite ? `Remove ${broker.name} from favorites` : `Add ${broker.name} to favorites`}
                            >
                              <Heart className={cn("w-3.5 h-3.5", favorite && "fill-current")} />
                            </button>
                            <div className="text-[10px] font-semibold uppercase tracking-widest text-white/20">{broker.region}</div>
                            <div className="text-[10px] font-semibold uppercase tracking-widest text-white/40">{broker.execution}</div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.3em] font-semibold text-white/25">
                  <SlidersHorizontal className="w-3.5 h-3.5 text-cyan-400" /> Region groups
                </div>
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">
                  {regionGroups.map((group) => (
                    <div key={group.region} className="p-4 rounded-[22px] bg-white/2 border border-white/5 space-y-3">
                      <div className="flex items-center justify-between gap-3">
                        <div className="text-xs font-semibold uppercase tracking-[0.25em] text-white/40">{group.region}</div>
                        <div className="text-[10px] font-semibold uppercase tracking-widest text-white/20">{group.brokers.length} brokers</div>
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
                              "px-3 py-2 rounded-full border text-[10px] font-semibold uppercase tracking-widest transition-all",
                              selectedBrokerId === broker.id
                                ? "bg-p text-white border-p/40"
                                : "bg-white/3 text-white/40 border-white/5 hover:border-white/10 hover:text-white",
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

            <div className="rounded-[28px] bg-[#0a0a0a] border border-white/5 p-4 xl:p-5 flex flex-col min-h-0">
              <div className="space-y-4 flex-1 min-h-0">
                <div className="p-4 rounded-2xl bg-white/3 border border-white/5 space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2 text-xs uppercase tracking-[0.3em] text-p font-semibold"><Building2 className="w-4 h-4" /> Selected broker</div>
                      <div className="flex items-center gap-3 min-w-0">
                        <div className={cn(
                          'w-10 h-10 rounded-xl flex items-center justify-center border ring-1 shrink-0',
                          (BROKER_BRAND[selectedBroker.id]?.badgeBg ?? 'bg-white/10'),
                          (BROKER_BRAND[selectedBroker.id]?.ring ?? 'ring-white/20'),
                          'border-white/10',
                        )}>
                          <span className={cn('text-[11px] font-bold tracking-tight', BROKER_BRAND[selectedBroker.id]?.text ?? 'text-white')}>
                            {BROKER_BRAND[selectedBroker.id]?.mark ?? selectedBroker.name.slice(0, 2).toUpperCase()}
                          </span>
                        </div>
                        <h4 className="text-2xl font-semibold text-white uppercase tracking-tight break-words">{selectedBroker.name}</h4>
                      </div>
                    </div>
                    <div className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[10px] font-semibold uppercase tracking-widest text-white/40">
                      {selectedBroker.integration === 'PAPER' ? 'Simulation' : 'Live bridge'}
                    </div>
                  </div>

                  <p className="text-sm text-white/40 leading-relaxed">{selectedBroker.description}</p>

                  <div className="flex flex-wrap gap-2">
                    {selectedBroker.tags.map((tag) => (
                      <span key={tag} className="px-2.5 py-1 rounded-full bg-white/5 border border-white/5 text-[10px] font-semibold uppercase tracking-widest text-white/40">
                        {tag}
                      </span>
                    ))}
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div className="p-3 rounded-xl bg-black/20 border border-white/5">
                      <div className="text-white/20 uppercase tracking-widest font-semibold mb-1">Platform</div>
                      <div className="text-white font-semibold">{selectedBroker.platform}</div>
                    </div>
                    <div className="p-3 rounded-xl bg-black/20 border border-white/5">
                      <div className="text-white/20 uppercase tracking-widest font-semibold mb-1">Min deposit</div>
                      <div className="text-white font-semibold">{selectedBroker.minDeposit}</div>
                    </div>
                    <div className="p-3 rounded-xl bg-black/20 border border-white/5">
                      <div className="text-white/20 uppercase tracking-widest font-semibold mb-1">Spread</div>
                      <div className="text-white font-semibold">{selectedBroker.spread}</div>
                    </div>
                    <div className="p-3 rounded-xl bg-black/20 border border-white/5">
                      <div className="text-white/20 uppercase tracking-widest font-semibold mb-1">Region</div>
                      <div className="text-white font-semibold">{selectedBroker.region}</div>
                    </div>
                  </div>
                </div>

                {selectedBroker.integration === 'PAPER' ? (
                  <div className="p-4 rounded-2xl bg-emerald-500/5 border border-emerald-500/20 text-center space-y-2">
                    <p className="text-xs text-emerald-300 uppercase tracking-[0.3em] font-semibold">Paper / Demo mode</p>
                    <p className="text-xs text-white/40 uppercase tracking-widest leading-relaxed">No credentials required. Use this for sandbox testing, strategy validation, and UI walkthroughs.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-[10px] text-white/40 uppercase tracking-widest ml-1 font-bold">Account Number</label>
                      <input value={accountNumber} onChange={(e) => setAccountNumber(e.target.value)} className="w-full h-12 bg-white/3 border border-white/5 rounded-xl px-4 text-sm text-white focus:border-p/50 outline-none" placeholder="1040294" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] text-white/40 uppercase tracking-widest ml-1 font-bold">Master Password</label>
                      <input value={password} onChange={(e) => setPassword(e.target.value)} type="password" className="w-full h-12 bg-white/3 border border-white/5 rounded-xl px-4 text-sm text-white focus:border-p/50 outline-none" placeholder="••••••••" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] text-white/40 uppercase tracking-widest ml-1 font-bold">Server Name</label>
                      <input value={serverName} onChange={(e) => setServerName(e.target.value)} className="w-full h-12 bg-white/3 border border-white/5 rounded-xl px-4 text-sm text-white focus:border-p/50 outline-none" placeholder="Broker-Server-Live" />
                    </div>
                  </div>
                )}
              </div>

              <div className="pt-4 mt-4 border-t border-white/5 space-y-3">
                <button 
                  onClick={handleConnectBroker}
                  disabled={isConnecting || (selectedBroker.integration !== 'PAPER' && (!accountNumber || !password || !serverName))}
                  className="w-full h-14 bg-white text-black font-semibold uppercase tracking-widest rounded-xl hover:bg-white/90 disabled:opacity-50 flex items-center justify-center gap-3 transition-colors"
                >
                  {isConnecting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Zap className="w-4 h-4" />}
                  {isConnecting ? 'Verifying Integrity...' : selectedBroker.integration === 'PAPER' ? 'Launch Demo Account' : `Connect ${selectedBroker.name}`}
                </button>
                <p className="text-[10px] text-white/25 uppercase tracking-[0.25em] leading-relaxed text-center">
                  {selectedBroker.integration === 'PAPER'
                    ? 'Demo account uses simulated execution with virtual balance.'
                    : 'Credentials are encrypted before storage. Live brokers route through the current MT5-compatible bridge.'}
                </p>
              </div>
            </div>
            </div>
          </div>
      </motion.div>
    </motion.div>
  )}
 </AnimatePresence>
 
 {children}
 </div>
 </AppShell>
 );
}
