"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { Search, Sparkles, ArrowUpRight } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { useUIStore } from "@/lib/stores/useUIStore";
import { searchApi, type GlobalSearchItem } from "@/lib/api/search";
import { cn } from "@/lib/utils";

const typeLabel: Record<GlobalSearchItem["type"], string> = {
  strategy: "Strategy",
  marketplace: "Marketplace",
  creator: "Creator",
  page: "Page",
};

export function GlobalCommandPalette() {
  const router = useRouter();
  const { commandPaletteOpen, setCommandPaletteOpen } = useUIStore();
  const [query, setQuery] = React.useState("");
  const [results, setResults] = React.useState<GlobalSearchItem[]>([]);
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setCommandPaletteOpen(!commandPaletteOpen);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [commandPaletteOpen, setCommandPaletteOpen]);

  React.useEffect(() => {
    if (!commandPaletteOpen) {
      return;
    }

    let active = true;
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const data = await searchApi.globalSearch(query);
        if (active) {
          setResults(data);
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }, 180);

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [query, commandPaletteOpen]);

  const navigate = React.useCallback(
    (href: string) => {
      setCommandPaletteOpen(false);
      setQuery("");
      router.push(href);
    },
    [router, setCommandPaletteOpen],
  );

  return (
    <Dialog open={commandPaletteOpen} onOpenChange={setCommandPaletteOpen}>
      <DialogContent
        className="max-w-2xl border border-white/10 bg-[#0a0a0f] p-0 shadow-2xl"
        showCloseButton={false}
      >
        <div className="border-b border-white/10 p-4">
          <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-3 py-2">
            <Search className="h-4 w-4 text-white/50" />
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search strategies, marketplace, creators, pages..."
              className="h-9 w-full bg-transparent text-sm text-white outline-none placeholder:text-white/35"
            />
            <div className="rounded-md border border-white/10 bg-white/5 px-2 py-0.5 text-xs text-white/45">
              ESC
            </div>
          </div>
        </div>

        <div className="max-h-[420px] overflow-y-auto p-2">
          {loading ? (
            <div className="p-6 text-center text-sm text-white/55">Searching...</div>
          ) : results.length === 0 ? (
            <div className="flex flex-col items-center gap-2 p-10 text-center">
              <Sparkles className="h-5 w-5 text-indigo-400" />
              <p className="text-sm text-white/70">No matches found.</p>
              <p className="text-xs text-white/45">Try broader terms like strategy, risk, or wallet.</p>
            </div>
          ) : (
            <AnimatePresence initial={false}>
              {results.map((item, index) => (
                <motion.button
                  key={`${item.type}-${item.id}-${index}`}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.02 }}
                  onClick={() => navigate(item.href)}
                  className={cn(
                    "group flex w-full items-center justify-between rounded-xl border border-transparent px-4 py-3 text-left transition-all",
                    "hover:border-indigo-400/40 hover:bg-indigo-500/10",
                  )}
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-white">{item.title}</span>
                      <span className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] uppercase tracking-wider text-white/60">
                        {typeLabel[item.type]}
                      </span>
                    </div>
                    {item.subtitle ? (
                      <p className="mt-1 text-xs text-white/55">{item.subtitle}</p>
                    ) : null}
                  </div>
                  <ArrowUpRight className="h-4 w-4 text-white/35 transition-colors group-hover:text-indigo-300" />
                </motion.button>
              ))}
            </AnimatePresence>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
