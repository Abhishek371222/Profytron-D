"use client";

import * as React from "react";
import { Check, ChevronsUpDown, Search } from "lucide-react";
import { cn } from "@/lib/utils";

export interface ComboboxOption {
  value: string;
  label: string;
  description?: string;
}

interface ComboboxProps {
  options: ComboboxOption[];
  value?: string;
  onValueChange?: (value: string) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyText?: string;
  disabled?: boolean;
  className?: string;
}

export function Combobox({
  options,
  value,
  onValueChange,
  placeholder = "Select option...",
  searchPlaceholder = "Search...",
  emptyText = "No results found.",
  disabled = false,
  className,
}: ComboboxProps) {
  const [open, setOpen] = React.useState(false);
  const [search, setSearch] = React.useState("");
  const ref = React.useRef<HTMLDivElement>(null);

  const selected = options.find((o) => o.value === value);

  const filtered = React.useMemo(
    () =>
      search.trim()
        ? options.filter(
            (o) =>
              o.label.toLowerCase().includes(search.toLowerCase()) ||
              o.description?.toLowerCase().includes(search.toLowerCase()),
          )
        : options,
    [options, search],
  );

  React.useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    if (open) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  return (
    <div ref={ref} className={cn("relative", className)}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className={cn(
          "flex h-10 w-full items-center justify-between rounded-xl border border-border bg-muted/30 px-3 py-2 text-sm text-foreground/70 transition-all",
          "hover:border-primary/30 hover:bg-muted/50 focus:outline-none focus:ring-2 focus:ring-primary/40",
          disabled && "cursor-not-allowed opacity-50",
          open && "border-primary/30 ring-2 ring-primary/20",
        )}
      >
        <span className={cn(!selected && "text-foreground/30")}>
          {selected ? selected.label : placeholder}
        </span>
        <ChevronsUpDown className="h-4 w-4 shrink-0 text-foreground/30" />
      </button>

      {open && (
        <div className="absolute z-50 mt-1 w-full rounded-xl border border-border bg-popover shadow-2xl overflow-hidden">
          <div className="flex items-center gap-2 px-3 py-2 border-b border-border">
            <Search className="h-3.5 w-3.5 text-foreground/30 shrink-0" />
            <input
              autoFocus
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={searchPlaceholder}
              className="flex-1 bg-transparent text-sm text-foreground/70 placeholder:text-foreground/25 outline-none"
            />
          </div>

          <ul
            role="listbox"
            className="max-h-60 overflow-y-auto py-1 scrollbar-thin scrollbar-thumb-white/10"
          >
            {filtered.length === 0 ? (
              <li className="px-3 py-4 text-center text-xs text-foreground/30">{emptyText}</li>
            ) : (
              filtered.map((option) => (
                <li
                  key={option.value}
                  role="option"
                  aria-selected={option.value === value}
                  onClick={() => {
                    onValueChange?.(option.value === value ? "" : option.value);
                    setOpen(false);
                    setSearch("");
                  }}
                  className={cn(
                    "flex items-center gap-2 px-3 py-2.5 text-sm cursor-pointer transition-colors",
                    option.value === value
                      ? "bg-primary/10 text-primary"
                      : "text-foreground/60 hover:bg-muted/4 hover:text-foreground/80",
                  )}
                >
                  <Check
                    className={cn(
                      "h-3.5 w-3.5 shrink-0",
                      option.value === value ? "text-primary opacity-100" : "opacity-0",
                    )}
                  />
                  <div className="min-w-0">
                    <span className="block truncate font-medium">{option.label}</span>
                    {option.description && (
                      <span className="block truncate text-xs text-foreground/30">{option.description}</span>
                    )}
                  </div>
                </li>
              ))
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
