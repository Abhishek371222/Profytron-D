'use client';

import React, { Suspense } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { cn } from '@/lib/utils';
import { X, ArrowRight, Zap, Loader2, Search, Globe, ShieldCheck, Star, Building2, Heart, SlidersHorizontal, BadgeCheck, Crown } from 'lucide-react';
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
  integration: 'PAPER' | 'MT4' | 'MT5';
  /** Pre-filled server names shown in the dropdown for this broker */
  servers?: string[];
};

const BROKER_FILTERS = ['All', 'Favorites', 'Paper', 'MT4', 'MT5', 'ECN', 'STP', 'Beginner-friendly'] as const;
const FEATURED_BROKERS = ['IC_MARKETS', 'PEPPERSTONE', 'EXNESS', 'XM', 'FXTM', 'PAPER'] as const;

const BROKER_REGIONS = ['Global', 'US / Global', 'EU / Global', 'UK / Global', 'AU / Global'] as const;

const BROKER_BRAND: Record<string, { mark: string; text: string; ring: string; badgeBg: string }> = {
  PAPER:        { mark: 'P',   text: 'text-emerald-200', ring: 'ring-emerald-300/30', badgeBg: 'bg-emerald-500/20' },
  IC_MARKETS:   { mark: 'IC',  text: 'text-cyan-100',    ring: 'ring-cyan-300/30',    badgeBg: 'bg-cyan-500/20'    },
  PEPPERSTONE:  { mark: 'PS',  text: 'text-violet-100',  ring: 'ring-violet-300/30',  badgeBg: 'bg-violet-500/20'  },
  EXNESS:       { mark: 'EX',  text: 'text-amber-100',   ring: 'ring-amber-300/30',   badgeBg: 'bg-amber-500/20'   },
  XM:           { mark: 'XM',  text: 'text-rose-100',    ring: 'ring-rose-300/30',    badgeBg: 'bg-rose-500/20'    },
  FXTM:         { mark: 'FT',  text: 'text-indigo-100',  ring: 'ring-indigo-300/30',  badgeBg: 'bg-indigo-500/20'  },
  AVATRADE:     { mark: 'AV',  text: 'text-red-100',     ring: 'ring-red-300/30',     badgeBg: 'bg-red-500/20'     },
  FP_MARKETS:   { mark: 'FP',  text: 'text-blue-100',    ring: 'ring-blue-300/30',    badgeBg: 'bg-blue-500/20'    },
  TICKMILL:     { mark: 'TM',  text: 'text-cyan-100',    ring: 'ring-cyan-300/30',    badgeBg: 'bg-cyan-500/20'    },
  AXI:          { mark: 'AX',  text: 'text-purple-100',  ring: 'ring-purple-300/30',  badgeBg: 'bg-purple-500/20'  },
  HFM:          { mark: 'HF',  text: 'text-slate-100',   ring: 'ring-slate-300/30',   badgeBg: 'bg-slate-500/20'   },
  BLACKBULL:    { mark: 'BB',  text: 'text-orange-100',  ring: 'ring-orange-300/30',  badgeBg: 'bg-orange-500/20'  },
  ROBOFOREX:    { mark: 'RF',  text: 'text-emerald-100', ring: 'ring-emerald-300/30', badgeBg: 'bg-emerald-500/20' },
  ADMIRALS:     { mark: 'AD',  text: 'text-yellow-100',  ring: 'ring-yellow-300/30',  badgeBg: 'bg-yellow-500/20'  },
  OANDA:        { mark: 'OA',  text: 'text-lime-100',    ring: 'ring-lime-300/30',    badgeBg: 'bg-lime-500/20'    },
  VANTAGE:      { mark: 'VFX', text: 'text-sky-100',     ring: 'ring-sky-300/30',     badgeBg: 'bg-sky-500/20'     },
  EIGHTCAP:     { mark: '8C',  text: 'text-teal-100',    ring: 'ring-teal-300/30',    badgeBg: 'bg-teal-500/20'    },
  FOREX_COM:    { mark: 'FX',  text: 'text-sky-100',     ring: 'ring-sky-300/30',     badgeBg: 'bg-sky-500/20'     },
  IG:           { mark: 'IG',  text: 'text-emerald-100', ring: 'ring-emerald-300/30', badgeBg: 'bg-emerald-500/20' },
  SWISSQUOTE:   { mark: 'SQ',  text: 'text-stone-100',   ring: 'ring-stone-300/30',   badgeBg: 'bg-stone-500/20'   },
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
    servers: [],
  },
  // ── IC Markets ────────────────────────────────────────────────────────────
  {
    id: 'IC_MARKETS',
    name: 'IC Markets',
    displayName: 'IC Markets',
    region: 'AU / Global',
    platform: 'MT4 / MT5',
    execution: 'RAW ECN',
    minDeposit: '$200',
    spread: 'From 0.0 pips',
    highlight: 'Most popular ECN broker',
    description: 'Largest forex CFD broker by volume. True ECN with raw spreads from 0.0 pips and ultra-fast execution.',
    tags: ['ECN', 'Raw spread', 'HFT-friendly', 'Scalping'],
    categories: ['MT4', 'MT5', 'ECN'],
    accent: 'from-cyan-400/20 via-blue-400/10 to-transparent',
    integration: 'MT5',
    servers: ['ICMarketsLive3-MT5', 'ICMarketsLive-MT5 3', 'ICMarkets-Live01', 'ICMarkets-Demo01'],
  },
  // ── Pepperstone ───────────────────────────────────────────────────────────
  {
    id: 'PEPPERSTONE',
    name: 'Pepperstone',
    displayName: 'Pepperstone',
    region: 'AU / Global',
    platform: 'MT4 / MT5',
    execution: 'NDD / ECN',
    minDeposit: '$0',
    spread: 'From 0.0 pips',
    highlight: 'Razor-thin spreads',
    description: 'Award-winning broker known for ultra-fast NDD execution, tight spreads, and deep liquidity pools.',
    tags: ['NDD', 'Low latency', 'Scalping', 'EA-ready'],
    categories: ['MT4', 'MT5', 'ECN', 'STP'],
    accent: 'from-violet-400/20 via-fuchsia-400/10 to-transparent',
    integration: 'MT5',
    servers: ['Pepperstone-Live', 'Pepperstone-Demo01', 'Pepperstone-Edge-Live', 'Pepperstone-Edge-Demo'],
  },
  // ── Exness ────────────────────────────────────────────────────────────────
  {
    id: 'EXNESS',
    name: 'Exness',
    displayName: 'Exness',
    region: 'Global',
    platform: 'MT4 / MT5',
    execution: 'Instant / Market',
    minDeposit: '$10',
    spread: 'Floating / Fixed',
    highlight: 'Unlimited leverage available',
    description: 'Offers instant withdrawals, high leverage options, and a wide range of account types for all trader levels.',
    tags: ['Flexible leverage', 'Instant withdrawal', 'Low deposit'],
    categories: ['MT4', 'MT5', 'Beginner-friendly'],
    accent: 'from-amber-400/20 via-orange-400/10 to-transparent',
    integration: 'MT5',
    servers: ['Exness-Real', 'Exness-Trial', 'ExnessServer', 'ExnessServer-MT5Real'],
  },
  // ── XM ────────────────────────────────────────────────────────────────────
  {
    id: 'XM',
    name: 'XM',
    displayName: 'XM',
    region: 'Global',
    platform: 'MT4 / MT5',
    execution: 'Market execution',
    minDeposit: '$5',
    spread: 'From 0.6 pips',
    highlight: 'No re-quotes, no rejection',
    description: 'Popular global broker with no re-quotes, micro accounts, and broad instrument coverage across 1000+ assets.',
    tags: ['No re-quotes', 'Micro accounts', 'Beginner-friendly'],
    categories: ['MT4', 'MT5', 'Beginner-friendly'],
    accent: 'from-pink-400/20 via-rose-400/10 to-transparent',
    integration: 'MT5',
    servers: ['XMTrading-MT5', 'XMTrading-MT5 2', 'XMTrading-MT5 3', 'XMTrading-Demo'],
  },
  // ── FXTM ──────────────────────────────────────────────────────────────────
  {
    id: 'FXTM',
    name: 'FXTM',
    displayName: 'ForexTime',
    region: 'Global',
    platform: 'MT4 / MT5',
    execution: 'Market / Instant',
    minDeposit: '$10',
    spread: 'Variable',
    highlight: 'Flexible account levels',
    description: 'Regulated global broker offering ECN, STP and standard accounts with micro lot support for all experience levels.',
    tags: ['ECN', 'Micro lots', 'Copy trading'],
    categories: ['MT4', 'MT5', 'Beginner-friendly', 'ECN'],
    accent: 'from-indigo-400/20 via-blue-400/10 to-transparent',
    integration: 'MT5',
    servers: ['ForexTimeFXTM-Real', 'ForexTimeFXTM-Demo', 'FXTM-Real 2', 'ForexTimeFXTM-Real ECN'],
  },
  // ── AvaTrade ──────────────────────────────────────────────────────────────
  {
    id: 'AVATRADE',
    name: 'AvaTrade',
    displayName: 'AvaTrade',
    region: 'Global',
    platform: 'MT4 / MT5',
    execution: 'Market execution',
    minDeposit: '$100',
    spread: 'Fixed / Floating',
    highlight: 'Fixed spreads available',
    description: 'Multi-regulated broker offering fixed and floating spreads, 250+ instruments, and auto-trading support.',
    tags: ['Fixed spreads', 'Multi-regulated', 'Auto-trading'],
    categories: ['MT4', 'MT5', 'STP', 'Beginner-friendly'],
    accent: 'from-rose-400/20 via-red-400/10 to-transparent',
    integration: 'MT5',
    servers: ['AvaTrade-Real', 'AvaTrade-Demo', 'AvaTrade MT5 Real', 'AvaTrade MT5 Demo'],
  },
  // ── FP Markets ────────────────────────────────────────────────────────────
  {
    id: 'FP_MARKETS',
    name: 'FP Markets',
    displayName: 'FP Markets',
    region: 'AU / Global',
    platform: 'MT4 / MT5',
    execution: 'RAW ECN',
    minDeposit: '$100',
    spread: 'From 0.0 pips',
    highlight: 'Deep institutional liquidity',
    description: 'Australian-regulated ECN broker with institutional liquidity, sub-millisecond execution, and 10,000+ instruments.',
    tags: ['ECN', 'DMA', 'Raw pricing', 'Fast execution'],
    categories: ['MT4', 'MT5', 'ECN'],
    accent: 'from-blue-400/20 via-indigo-400/10 to-transparent',
    integration: 'MT5',
    servers: ['FPMarkets-Live01', 'FPMarkets-Demo', 'FPMarkets-MT5-Real', 'FPMarkets-MT5-Demo'],
  },
  // ── Tickmill ──────────────────────────────────────────────────────────────
  {
    id: 'TICKMILL',
    name: 'Tickmill',
    displayName: 'Tickmill',
    region: 'EU / Global',
    platform: 'MT4 / MT5',
    execution: 'ECN / STP',
    minDeposit: '$100',
    spread: 'From 0.0 pips',
    highlight: 'Scalper & EA favorite',
    description: 'ECN-style execution with interbank liquidity, low commissions, and VPS support for algorithmic strategies.',
    tags: ['Scalping', 'ECN', 'Low commission', 'EA-friendly'],
    categories: ['MT4', 'MT5', 'ECN'],
    accent: 'from-cyan-400/20 via-sky-400/10 to-transparent',
    integration: 'MT5',
    servers: ['Tickmill-Live', 'Tickmill-Demo', 'Tickmill-Live2', 'Tickmill-MT5 Live'],
  },
  // ── Axi ───────────────────────────────────────────────────────────────────
  {
    id: 'AXI',
    name: 'Axi',
    displayName: 'Axi',
    region: 'AU / Global',
    platform: 'MT4 / MT5',
    execution: 'Market execution',
    minDeposit: '$0',
    spread: 'From 0.0 pips',
    highlight: 'Zero min deposit',
    description: 'ASIC-regulated broker with 140+ FX pairs, free VPS, and a professional-grade MT4/MT5 execution environment.',
    tags: ['Zero deposit', 'VPS included', 'ASIC regulated'],
    categories: ['MT4', 'MT5', 'Beginner-friendly', 'ECN'],
    accent: 'from-purple-400/20 via-violet-400/10 to-transparent',
    integration: 'MT5',
    servers: ['Axi-Live', 'Axi-Demo', 'AxiTrader-Live', 'AxiTrader-Demo'],
  },
  // ── HFM ───────────────────────────────────────────────────────────────────
  {
    id: 'HFM',
    name: 'HFM',
    displayName: 'HF Markets',
    region: 'Global',
    platform: 'MT4 / MT5',
    execution: 'Market / ECN',
    minDeposit: '$5',
    spread: 'From 0.0 pips',
    highlight: 'Low-entry ECN access',
    description: 'CySEC and FCA regulated broker offering ECN execution from just $5, ideal for beginners and scalpers alike.',
    tags: ['Low deposit', 'ECN', 'Regulated', 'Copy trading'],
    categories: ['MT4', 'MT5', 'ECN', 'Beginner-friendly'],
    accent: 'from-slate-400/20 via-gray-400/10 to-transparent',
    integration: 'MT5',
    servers: ['HFMarketsGlobal-Demo02', 'HFMarketsGlobal-Live5', 'HFMarketsGlobal-Live6', 'HFMarketsGlobal-Live 1'],
  },
  // ── BlackBull ─────────────────────────────────────────────────────────────
  {
    id: 'BLACKBULL',
    name: 'BlackBull Markets',
    displayName: 'BlackBull',
    region: 'AU / Global',
    platform: 'MT4 / MT5',
    execution: 'True ECN',
    minDeposit: '$0',
    spread: 'From 0.0 pips',
    highlight: 'True ECN, no dealing desk',
    description: 'NZ-based ECN broker with no dealing desk, fast STP execution, and institutional-grade liquidity.',
    tags: ['True ECN', 'No DD', 'NDD', 'Raw pricing'],
    categories: ['MT4', 'MT5', 'ECN'],
    accent: 'from-orange-400/20 via-amber-400/10 to-transparent',
    integration: 'MT5',
    servers: ['BlackBull-Live 1', 'BlackBull-Demo', 'BlackBull Markets Live', 'BlackBull Markets Demo'],
  },
  // ── RoboForex ─────────────────────────────────────────────────────────────
  {
    id: 'ROBOFOREX',
    name: 'RoboForex',
    displayName: 'RoboForex',
    region: 'Global',
    platform: 'MT4 / MT5',
    execution: 'ECN / STP',
    minDeposit: '$10',
    spread: 'From 0.0 pips',
    highlight: 'Algo & EA optimized',
    description: 'Offshore broker popular with algorithmic traders for its ECN-Pro accounts, 8000+ instruments, and copy trading platform.',
    tags: ['Algo-friendly', 'Copy trading', 'ECN-Pro', 'Low minimum'],
    categories: ['MT4', 'MT5', 'ECN', 'STP'],
    accent: 'from-teal-400/20 via-emerald-400/10 to-transparent',
    integration: 'MT5',
    servers: ['RoboForex-Real', 'RoboForex-Demo', 'RoboForex-ECN-Real', 'RoboForex-Pro'],
  },
  // ── Admirals ──────────────────────────────────────────────────────────────
  {
    id: 'ADMIRALS',
    name: 'Admirals',
    displayName: 'Admirals',
    region: 'EU / Global',
    platform: 'MT4 / MT5',
    execution: 'Market / ECN',
    minDeposit: '$100',
    spread: 'From 0.0 pips',
    highlight: 'FCA & ASIC regulated',
    description: 'Multi-regulated European broker with 8000+ symbols, zero-spread account options, and free MetaTrader Supreme plugin.',
    tags: ['FCA regulated', 'Zero spread', 'MT Supreme'],
    categories: ['MT4', 'MT5', 'ECN', 'STP'],
    accent: 'from-yellow-400/20 via-amber-400/10 to-transparent',
    integration: 'MT5',
    servers: ['Admirals-Live5', 'Admirals-Demo', 'AdmiralMarkets-Live', 'AdmiralMarkets-Demo'],
  },
  // ── Vantage ───────────────────────────────────────────────────────────────
  {
    id: 'VANTAGE',
    name: 'Vantage',
    displayName: 'Vantage FX',
    region: 'AU / Global',
    platform: 'MT4 / MT5',
    execution: 'RAW ECN',
    minDeposit: '$50',
    spread: 'From 0.0 pips',
    highlight: 'Raw ECN from $50',
    description: 'ASIC-regulated broker with RAW ECN accounts from just $50, co-location servers, and copy trading support.',
    tags: ['RAW ECN', 'ASIC', 'Copy trading', 'Low commission'],
    categories: ['MT4', 'MT5', 'ECN'],
    accent: 'from-sky-400/20 via-cyan-400/10 to-transparent',
    integration: 'MT5',
    servers: ['Vantage-Live', 'Vantage-Demo', 'VantageFX-Live', 'VantageFX-Demo'],
  },
  // ── Eightcap ──────────────────────────────────────────────────────────────
  {
    id: 'EIGHTCAP',
    name: 'Eightcap',
    displayName: 'Eightcap',
    region: 'AU / Global',
    platform: 'MT4 / MT5',
    execution: 'STP / ECN',
    minDeposit: '$100',
    spread: 'From 0.0 pips',
    highlight: 'Crypto + FX specialist',
    description: 'ASIC/SCB regulated broker offering forex, crypto CFDs, and indices with TradingView integration.',
    tags: ['Crypto CFDs', 'TradingView', 'ASIC', 'STP'],
    categories: ['MT4', 'MT5', 'ECN', 'STP'],
    accent: 'from-teal-400/20 via-cyan-400/10 to-transparent',
    integration: 'MT5',
    servers: ['Eightcap-Live', 'Eightcap-Demo', 'EightcapLive-1', 'EightcapDemo-1'],
  },
  // ── OANDA ─────────────────────────────────────────────────────────────────
  {
    id: 'OANDA',
    name: 'OANDA',
    displayName: 'OANDA',
    region: 'US / Global',
    platform: 'MT4 / Web API',
    execution: 'Spread-only / NDD',
    minDeposit: '$0',
    spread: 'Transparent variable',
    highlight: 'Trusted US forex broker',
    description: 'Highly regulated US broker with a strong API, zero min deposit, and transparent spread pricing.',
    tags: ['US regulated', 'API-first', 'No min deposit'],
    categories: ['MT4', 'STP', 'Beginner-friendly'],
    accent: 'from-emerald-400/20 via-lime-400/10 to-transparent',
    integration: 'MT4',
    servers: ['OANDA-v20 Live-1', 'OANDA-v20 Live-2', 'OANDA-v20 Practice', 'OANDA-fxTrade Practice'],
  },
  // ── IG ────────────────────────────────────────────────────────────────────
  {
    id: 'IG',
    name: 'IG',
    displayName: 'IG',
    region: 'UK / Global',
    platform: 'MT4 / Web',
    execution: 'DMA / Market',
    minDeposit: '$0',
    spread: 'Variable',
    highlight: 'UK\'s largest broker',
    description: 'World\'s No.1 CFD provider with DMA access to 17,000+ markets, deep liquidity, and 40+ years of history.',
    tags: ['DMA', 'FCA regulated', 'Global', '17k markets'],
    categories: ['MT4', 'DMA'],
    accent: 'from-emerald-400/20 via-cyan-400/10 to-transparent',
    integration: 'MT4',
    servers: ['IG-demo', 'IG-live', 'IG-live2', 'IG-live3'],
  },
  // ── Swissquote ────────────────────────────────────────────────────────────
  {
    id: 'SWISSQUOTE',
    name: 'Swissquote',
    displayName: 'Swissquote',
    region: 'EU / Global',
    platform: 'MT4 / MT5',
    execution: 'Market execution',
    minDeposit: '$1,000',
    spread: 'From 1.3 pips',
    highlight: 'Swiss bank regulation',
    description: 'FINMA-regulated Swiss bank offering institutional-grade FX execution and securities custody.',
    tags: ['FINMA', 'Bank-grade', 'Swiss', 'Institutional'],
    categories: ['MT4', 'MT5', 'DMA'],
    accent: 'from-stone-400/20 via-slate-400/10 to-transparent',
    integration: 'MT5',
    servers: ['SWFX Trader', 'Swissquote Bank', 'Swissquote-Demo'],
  },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
 const pathname = usePathname();
 const [showDemoBanner, setShowDemoBanner] = React.useState(false);
 const [showBrokerModal, setShowBrokerModal] = React.useState(false);
 const [mounted, setMounted] = React.useState(false);
 
 // Broker Form State
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
   if (!mounted) return;
   const dismissed = window.localStorage.getItem('profytron_mt5_banner_dismissed');
   setShowDemoBanner(dismissed !== 'true');
 }, [mounted]);

 const handleDismissBanner = () => {
   setShowDemoBanner(false);
   if (mounted) window.localStorage.setItem('profytron_mt5_banner_dismissed', 'true');
 };

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

 // When broker changes: reset form + auto-fill first server + set default platform
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

 const isBuilder = pathname?.includes('/strategies/builder');

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
     setShowBrokerModal(false);
     setShowDemoBanner(false);
     if (mounted) window.localStorage.setItem('profytron_mt5_banner_dismissed', 'true');
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
 <AppShell>
 <div suppressHydrationWarning className={cn("relative flex flex-col", !isBuilder &&"gap-6")}>
 <AnimatePresence>
   {mounted && showDemoBanner && !isBuilder && (
     <motion.div
       initial={{ height: 0, opacity: 0 }}
       animate={{ height: 'auto', opacity: 1 }}
       exit={{ height: 0, opacity: 0 }}
       className="overflow-hidden"
     >
       <div className="relative overflow-hidden rounded-2xl border border-indigo-500/20 bg-[#07070f]">
         <div className="absolute inset-0 bg-gradient-to-r from-indigo-600/10 via-violet-600/5 to-transparent pointer-events-none" />
         <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-gradient-to-b from-indigo-500 via-violet-500 to-indigo-500 rounded-l-2xl" />
         <div className="relative flex items-center justify-between gap-4 px-5 py-3.5">
           <div className="flex items-center gap-3.5 min-w-0">
             <div className="w-9 h-9 rounded-xl bg-indigo-500/15 border border-indigo-500/25 flex items-center justify-center shrink-0">
               <Zap className="w-4 h-4 text-indigo-400" />
             </div>
             <div className="min-w-0">
               <div className="flex items-center gap-2.5 flex-wrap">
                 <span className="text-xs font-bold text-white uppercase tracking-[0.2em]">Connect MT5 Account</span>
                 <span className="px-2 py-0.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-[10px] font-semibold text-indigo-300 uppercase tracking-widest">Live Trading</span>
               </div>
               <p className="text-[11px] text-white/35 font-medium mt-0.5 truncate">Link your MetaTrader&nbsp;5 broker account to enable live strategy execution and copy trading</p>
             </div>
           </div>
           <div className="flex items-center gap-2.5 shrink-0">
             <button
               onClick={() => { setSelectedBrokerId('IC_MARKETS'); setShowBrokerModal(true); }}
               className="flex items-center gap-2 px-4 h-9 rounded-xl bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white text-[11px] font-bold uppercase tracking-widest transition-colors"
             >
               <Zap className="w-3.5 h-3.5" />
               Connect Now
             </button>
             <button
               onClick={() => { setSelectedBrokerId('PAPER'); setShowBrokerModal(true); }}
               className="flex items-center gap-2 px-4 h-9 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white/60 hover:text-white text-[11px] font-semibold uppercase tracking-widest transition-colors"
             >
               Demo
               <ArrowRight className="w-3 h-3" />
             </button>
             <button
               onClick={handleDismissBanner}
               className="w-8 h-8 rounded-lg bg-white/5 border border-white/5 hover:bg-white/10 flex items-center justify-center transition-colors"
             >
               <X className="w-3.5 h-3.5 text-white/30" />
             </button>
           </div>
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
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 bg-black/80 backdrop-blur-xl"
      onClick={(e) => e.target === e.currentTarget && setShowBrokerModal(false)}
    >
      <motion.div
        initial={{ scale: 0.95, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.95 }}
        className="w-full max-w-6xl max-h-[85dvh] sm:max-h-[90vh] rounded-3xl sm:rounded-4xl bg-[#080808] border border-white/10 p-3 sm:p-4 md:p-6 shadow-2xl relative overflow-hidden"
      >
        <div className="absolute inset-0 bg-linear-to-br from-p/5 to-transparent pointer-events-none" />

        <div className="relative z-10 flex flex-col h-full">
          <div className="flex items-start justify-between gap-4 pb-4 border-b border-white/5">
            <div className="space-y-1">
               <h3 className="text-xl sm:text-2xl md:text-3xl font-semibold text-white uppercase tracking-tight">Connect Broker</h3>
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

            <div className="rounded-[28px] bg-[#0a0a0a] border border-white/5 p-4 xl:p-5 flex flex-col min-h-0 overflow-hidden">
              <div className="space-y-3 flex-1 min-h-0 overflow-y-auto pr-1">
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
                        <h4 className="text-xl font-semibold text-white uppercase tracking-tight break-words leading-tight">{selectedBroker.name}</h4>
                      </div>
                    </div>
                    <div className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[10px] font-semibold uppercase tracking-widest text-white/40">
                      {selectedBroker.integration === 'PAPER' ? 'Simulation' : 'Live bridge'}
                    </div>
                  </div>

                  <p className="text-xs text-white/35 leading-relaxed line-clamp-2">{selectedBroker.description}</p>

                  <div className="flex flex-wrap gap-1.5">
                    {selectedBroker.tags.map((tag) => (
                      <span key={tag} className="px-2 py-0.5 rounded-full bg-white/5 border border-white/5 text-[9px] font-semibold uppercase tracking-widest text-white/35">
                        {tag}
                      </span>
                    ))}
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="p-2.5 rounded-xl bg-black/20 border border-white/5">
                      <div className="text-white/20 uppercase tracking-widest font-semibold text-[9px] mb-0.5">Platform</div>
                      <div className="text-white font-semibold">{selectedBroker.platform}</div>
                    </div>
                    <div className="p-2.5 rounded-xl bg-black/20 border border-white/5">
                      <div className="text-white/20 uppercase tracking-widest font-semibold text-[9px] mb-0.5">Min deposit</div>
                      <div className="text-white font-semibold">{selectedBroker.minDeposit}</div>
                    </div>
                    <div className="p-2.5 rounded-xl bg-black/20 border border-white/5">
                      <div className="text-white/20 uppercase tracking-widest font-semibold text-[9px] mb-0.5">Spread</div>
                      <div className="text-white font-semibold">{selectedBroker.spread}</div>
                    </div>
                    <div className="p-2.5 rounded-xl bg-black/20 border border-white/5">
                      <div className="text-white/20 uppercase tracking-widest font-semibold text-[9px] mb-0.5">Region</div>
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
                  <div className="space-y-3">
                    {/* Platform selector — only show for brokers that support both */}
                    {selectedBroker.categories.includes('MT4') && selectedBroker.categories.includes('MT5') && (
                      <div className="space-y-2">
                        <label className="text-[10px] text-white/40 uppercase tracking-widest ml-1 font-bold">Platform</label>
                        <div className="grid grid-cols-2 gap-2">
                          {(['mt4', 'mt5'] as const).map((p) => (
                            <button
                              key={p}
                              type="button"
                              onClick={() => setPlatform(p)}
                              className={cn(
                                'h-10 rounded-xl border text-xs font-bold uppercase tracking-widest transition-all',
                                platform === p
                                  ? 'bg-p/15 border-p/40 text-white'
                                  : 'bg-white/3 border-white/5 text-white/40 hover:text-white hover:border-white/15',
                              )}
                            >
                              {p.toUpperCase()}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="space-y-1.5">
                      <label className="text-[10px] text-white/40 uppercase tracking-widest ml-1 font-bold">Login ID (Account Number)</label>
                      <input
                        value={login}
                        onChange={(e) => setLogin(e.target.value)}
                        className="w-full h-10 bg-white/3 border border-white/5 rounded-xl px-4 text-sm text-white focus:border-p/50 outline-none"
                        placeholder="e.g. 1040294"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] text-white/40 uppercase tracking-widest ml-1 font-bold">Master Password</label>
                      <input
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        type="password"
                        className="w-full h-10 bg-white/3 border border-white/5 rounded-xl px-4 text-sm text-white focus:border-p/50 outline-none"
                        placeholder="••••••••"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] text-white/40 uppercase tracking-widest ml-1 font-bold">Server Name</label>
                      {(selectedBroker.servers?.length ?? 0) > 0 ? (
                        <select
                          value={serverName}
                          onChange={(e) => setServerName(e.target.value)}
                          className="w-full h-10 bg-white/3 border border-white/5 rounded-xl px-4 text-sm text-white focus:border-p/50 outline-none appearance-none cursor-pointer"
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
                          className="w-full h-10 bg-white/3 border border-white/5 rounded-xl px-4 text-sm text-white focus:border-p/50 outline-none"
                          placeholder="e.g. BrokerName-Live"
                        />
                      )}
                      {serverName === '__custom__' && (
                        <input
                          autoFocus
                          value=""
                          onChange={(e) => setServerName(e.target.value)}
                          className="w-full h-10 bg-white/3 border border-p/30 rounded-xl px-4 text-sm text-white focus:border-p/50 outline-none"
                          placeholder="Type custom server name…"
                        />
                      )}
                      <p className="text-[10px] text-white/20 ml-1 mt-0.5">Find in MT4/MT5 → File → Login → Server dropdown</p>
                    </div>
                  </div>
                )}
              </div>

              <div className="shrink-0 pt-4 mt-2 border-t border-white/5 space-y-2">
                <button
                  onClick={handleConnectBroker}
                  disabled={isConnecting || (selectedBroker.integration !== 'PAPER' && (!login || !password || !serverName || serverName === '__custom__'))}
                  className="w-full h-12 bg-white text-black text-sm font-bold uppercase tracking-widest rounded-xl hover:bg-white/90 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2.5 transition-colors"
                >
                  {isConnecting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
                  {isConnecting ? 'Verifying…' : selectedBroker.integration === 'PAPER' ? 'Launch Demo Account' : `Connect ${selectedBroker.name}`}
                </button>
                <p className="text-[10px] text-white/20 leading-relaxed text-center px-2">
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
 
 <Suspense
   fallback={
     <div className="flex-1 flex flex-col gap-4 animate-pulse" aria-busy="true">
       <div className="h-8 w-64 rounded-xl bg-white/[0.03] border border-white/[0.05]" />
       <div className="h-48 rounded-2xl bg-white/[0.02] border border-white/[0.04]" />
       <div className="grid grid-cols-3 gap-4">
         {Array.from({ length: 3 }).map((_, i) => (
           <div key={i} className="h-28 rounded-2xl bg-white/[0.02] border border-white/[0.04]" />
         ))}
       </div>
     </div>
   }
 >
   {children}
 </Suspense>
 </div>
 </AppShell>
 );
}
