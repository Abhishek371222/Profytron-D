"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  Search,
  Sparkles,
  ArrowUpRight,
  BarChart3,
  ShoppingBag,
  User,
  LayoutDashboard,
  Command,
  Hash,
  TrendingUp,
  Loader2,
  type LucideIcon,
} from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { useUIStore } from "@/lib/stores/useUIStore";
import { searchApi, type GlobalSearchItem } from "@/lib/api/search";
import { cn } from "@/lib/utils";

const TYPE_CONFIG: Record<
  GlobalSearchItem["type"],
  { label: string; icon: LucideIcon; color: string; bg: string }
> = {
  strategy:    { label: "Bot",    icon: TrendingUp,    color: "text-chart-3", bg: "bg-chart-3/[0.07] border-chart-3/20" },
  marketplace: { label: "Marketplace", icon: ShoppingBag,   color: "text-primary",  bg: "bg-primary/[0.07] border-primary/20"  },
  creator:     { label: "Creator",     icon: User,          color: "text-chart-2",  bg: "bg-chart-2/[0.07] border-chart-2/20"  },
  page:        { label: "Page",        icon: LayoutDashboard, color: "text-chart-5", bg: "bg-chart-5/[0.07] border-chart-5/20"      },
};

const QUICK_LINKS: { title: string; href: string; icon: LucideIcon; hint: string }[] = [
  { title: "Dashboard",   href: "/dashboard",   icon: LayoutDashboard, hint: "Home"   },
  { title: "Markets",     href: "/markets",     icon: TrendingUp,      hint: "Charts" },
  { title: "Marketplace", href: "/marketplace", icon: ShoppingBag,     hint: "Browse" },
  { title: "Alpha Coach",  href: "/alpha-coach", icon: Sparkles,        hint: "Ask Alpha" },
  { title: "Analytics",   href: "/analytics",   icon: BarChart3,       hint: "Stats"  },
];

export function GlobalCommandPalette() {
  const router = useRouter();
  const { commandPaletteOpen, setCommandPaletteOpen } = useUIStore();
  const [query, setQuery] = React.useState("");
  const [results, setResults] = React.useState<GlobalSearchItem[]>([]);
  const [loading, setLoading] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setCommandPaletteOpen(!commandPaletteOpen);
      }
      if (event.key === "Escape" && commandPaletteOpen) {
        setCommandPaletteOpen(false);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [commandPaletteOpen, setCommandPaletteOpen]);

  React.useEffect(() => {
    if (commandPaletteOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
      setQuery("");
      setResults([]);
    }
  }, [commandPaletteOpen]);

  React.useEffect(() => {
    if (!commandPaletteOpen || !query.trim()) {
      setResults([]);
      return;
    }
    let active = true;
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const data = await searchApi.globalSearch(query);
        if (active) setResults(data);
      } finally {
        if (active) setLoading(false);
      }
    }, 200);
    return () => { active = false; clearTimeout(timer); };
  }, [query, commandPaletteOpen]);

  const navigate = React.useCallback(
    (href: string) => {
      setCommandPaletteOpen(false);
      setQuery("");
      router.push(href);
    },
    [router, setCommandPaletteOpen],
  );

  const showQuickLinks = !query.trim();

  return (
    <Dialog open={commandPaletteOpen} onOpenChange={setCommandPaletteOpen}>
      <DialogContent
        className="max-w-[600px] bg-popover/97 backdrop-blur-2xl border border-border p-0 shadow-2xl overflow-hidden rounded-2xl"
        showCloseButton={false}
      >
        { }
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent" />
        { }
        <div className="pointer-events-none absolute -top-12 left-1/2 -translate-x-1/2 w-64 h-24 rounded-full bg-primary/[0.08] blur-2xl" />

        { }
        <div className="relative flex items-center gap-3 border-b border-border px-4 py-3.5">
          <div className="relative">
            {loading ? (
              <Loader2 className="w-4 h-4 text-primary animate-spin" />
            ) : (
              <Search className="w-4 h-4 text-foreground/30" />
            )}
          </div>
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search bots, marketplace, creators, pages..."
            className="flex-1 bg-transparent text-body-sm font-medium text-foreground outline-none placeholder:text-foreground/20"
          />
          <div className="flex items-center gap-1 px-2 py-1 rounded-lg border border-border bg-muted/3">
            <span className="text-micro text-foreground/20 font-mono">ESC</span>
          </div>
        </div>

        { }
        <div className="max-h-[420px] overflow-y-auto no-scrollbar">
          {showQuickLinks ? (
            <div className="p-3">
              <p className="text-micro font-bold text-foreground/20 uppercase tracking-[0.25em] px-2 mb-2">Quick Access</p>
              <div className="grid grid-cols-2 gap-1.5">
                {QUICK_LINKS.map((item, idx) => {
                  const Icon = item.icon;
                  return (
                    <motion.button
                      key={item.href}
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.04 }}
                      onClick={() => navigate(item.href)}
                      className="group flex items-center gap-3 p-3 rounded-xl border border-border bg-muted/2 hover:bg-muted/5 hover:border-primary/20 transition-all text-left"
                    >
                      <div className="w-8 h-8 rounded-xl bg-muted/4 border border-border flex items-center justify-center shrink-0 group-hover:bg-primary/10 group-hover:border-primary/20 transition-all">
                        <Icon className="w-3.5 h-3.5 text-foreground/35 group-hover:text-primary transition-colors" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-caption font-semibold text-foreground/70 group-hover:text-foreground transition-colors">{item.title}</p>
                        <p className="text-micro text-foreground/20 uppercase tracking-widest">{item.hint}</p>
                      </div>
                    </motion.button>
                  );
                })}
              </div>

              { }
              <div className="flex items-center justify-center gap-3 mt-4 pt-3 border-t border-border">
                <div className="flex items-center gap-1 text-micro text-foreground/15">
                  <Command className="w-2.5 h-2.5" />
                  <span>K</span>
                  <span className="ml-1">to open</span>
                </div>
                <div className="w-px h-3 bg-foreground/10" />
                <span className="text-micro text-foreground/15">↵ to navigate</span>
                <div className="w-px h-3 bg-foreground/10" />
                <span className="text-micro text-foreground/15">ESC to close</span>
              </div>
            </div>
          ) : loading ? (
            <div className="flex flex-col items-center gap-3 py-12">
              <div className="relative w-10 h-10 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                >
                  <Search className="w-4 h-4 text-primary" />
                </motion.div>
              </div>
              <p className="text-caption text-foreground/25 uppercase tracking-[0.2em]">Searching...</p>
            </div>
          ) : results.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-12">
              <div className="w-12 h-12 rounded-2xl bg-muted/3 border border-border flex items-center justify-center">
                <Hash className="w-5 h-5 text-foreground/15" />
              </div>
              <div className="text-center">
                <p className="text-caption font-semibold text-foreground/30">No results found</p>
                <p className="text-micro text-foreground/15 mt-0.5">Try broader terms like "momentum" or "analytics"</p>
              </div>
            </div>
          ) : (
            <div className="p-2 space-y-0.5">
              <p className="text-micro font-bold text-foreground/15 uppercase tracking-[0.25em] px-3 py-1">
                {results.length} result{results.length !== 1 ? "s" : ""}
              </p>
              <AnimatePresence initial={false}>
                {results.map((item, idx) => {
                  const cfg = TYPE_CONFIG[item.type] ?? TYPE_CONFIG.page;
                  const TypeIcon = cfg.icon;
                  return (
                    <motion.button
                      key={`${item.type}-${item.id}-${idx}`}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.025 }}
                      onClick={() => navigate(item.href)}
                      className="group w-full flex items-center gap-3 px-3 py-2.5 rounded-xl border border-transparent hover:bg-muted/4 hover:border-primary/15 transition-all text-left"
                    >
                      <div className={cn("w-8 h-8 rounded-xl border flex items-center justify-center shrink-0", cfg.bg)}>
                        <TypeIcon className={cn("w-3.5 h-3.5", cfg.color)} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-body-sm font-semibold text-foreground/80 group-hover:text-foreground transition-colors truncate">
                            {item.title}
                          </span>
                          <span className={cn("text-micro font-bold px-1.5 py-0.5 rounded-md border shrink-0 uppercase tracking-widest", cfg.bg, cfg.color)}>
                            {cfg.label}
                          </span>
                        </div>
                        {item.subtitle && (
                          <p className="text-caption text-foreground/30 mt-0.5 truncate">{item.subtitle}</p>
                        )}
                      </div>
                      <ArrowUpRight className="w-3.5 h-3.5 text-foreground/15 group-hover:text-primary shrink-0 transition-colors" />
                    </motion.button>
                  );
                })}
              </AnimatePresence>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
