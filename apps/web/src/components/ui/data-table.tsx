"use client";

import * as React from "react";
import { ChevronUp, ChevronDown, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { Pagination } from "@/components/ui/pagination";

export interface DataTableColumn<T> {
  key: keyof T | string;
  header: string;
  cell?: (row: T) => React.ReactNode;
  sortable?: boolean;
  className?: string;
  headerClassName?: string;
}

interface DataTableProps<T> {
  columns: DataTableColumn<T>[];
  data: T[];
  isLoading?: boolean;
  emptyMessage?: string;
  keyField?: keyof T;
  pageSize?: number;
  className?: string;
  onRowClick?: (row: T) => void;
}

type SortDir = "asc" | "desc" | null;

function getCellValue<T>(row: T, key: keyof T | string): unknown {
  return (row as any)[key as string];
}

export function DataTable<T extends object>({
  columns,
  data,
  isLoading = false,
  emptyMessage = "No data found.",
  keyField,
  pageSize = 20,
  className,
  onRowClick,
}: DataTableProps<T>) {
  const [sortKey, setSortKey] = React.useState<string | null>(null);
  const [sortDir, setSortDir] = React.useState<SortDir>(null);
  const [page, setPage] = React.useState(1);

  const sorted = React.useMemo(() => {
    if (!sortKey || !sortDir) return data;
    return [...data].sort((a, b) => {
      const av = getCellValue(a, sortKey);
      const bv = getCellValue(b, sortKey);
      if (av == null && bv == null) return 0;
      if (av == null) return sortDir === "asc" ? -1 : 1;
      if (bv == null) return sortDir === "asc" ? 1 : -1;
      if (typeof av === "number" && typeof bv === "number") {
        return sortDir === "asc" ? av - bv : bv - av;
      }
      const as = String(av).toLowerCase();
      const bs = String(bv).toLowerCase();
      return sortDir === "asc" ? as.localeCompare(bs) : bs.localeCompare(as);
    });
  }, [data, sortKey, sortDir]);

  const totalPages = Math.ceil(sorted.length / pageSize);
  const paginated = sorted.slice((page - 1) * pageSize, page * pageSize);

  const handleSort = (key: string) => {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : d === "desc" ? null : "asc"));
      if (sortDir === "desc") setSortKey(null);
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
    setPage(1);
  };

  const SortIcon = ({ col }: { col: DataTableColumn<T> }) => {
    const key = String(col.key);
    if (sortKey !== key) return <ChevronsUpDown className="h-3 w-3 text-foreground/20" />;
    if (sortDir === "asc") return <ChevronUp className="h-3 w-3 text-primary" />;
    return <ChevronDown className="h-3 w-3 text-primary" />;
  };

  return (
    <div className={cn("w-full", className)}>
      <div className="overflow-x-auto rounded-xl border border-white/[0.07]">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/[0.07] bg-muted/2">
              {columns.map((col) => (
                <th
                  key={String(col.key)}
                  onClick={col.sortable ? () => handleSort(String(col.key)) : undefined}
                  className={cn(
                    "px-4 py-3 text-left text-micro font-bold uppercase tracking-[0.2em] text-foreground/30",
                    col.sortable && "cursor-pointer select-none hover:text-foreground/50 transition-colors",
                    col.headerClassName,
                  )}
                >
                  <span className="flex items-center gap-1.5">
                    {col.header}
                    {col.sortable && <SortIcon col={col} />}
                  </span>
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} className="border-b border-white/[0.04]">
                  {columns.map((col) => (
                    <td key={String(col.key)} className="px-4 py-3">
                      <Skeleton className="h-4 w-full max-w-[120px]" />
                    </td>
                  ))}
                </tr>
              ))
            ) : paginated.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length}
                  className="px-4 py-12 text-center text-sm text-foreground/25"
                >
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              paginated.map((row, i) => (
                <tr
                  key={keyField ? String(getCellValue(row, keyField as string)) : i}
                  onClick={() => onRowClick?.(row)}
                  className={cn(
                    "border-b border-white/[0.04] transition-colors",
                    onRowClick && "cursor-pointer hover:bg-muted/3",
                    i === paginated.length - 1 && "border-b-0",
                  )}
                >
                  {columns.map((col) => (
                    <td
                      key={String(col.key)}
                      className={cn("px-4 py-3 text-foreground/60", col.className)}
                    >
                      {col.cell
                        ? col.cell(row)
                        : String(getCellValue(row, String(col.key)) ?? "—")}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {!isLoading && totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between text-xs text-foreground/30">
          <span>
            Showing {Math.min((page - 1) * pageSize + 1, sorted.length)}–
            {Math.min(page * pageSize, sorted.length)} of {sorted.length}
          </span>
          <Pagination
            currentPage={page}
            totalPages={totalPages}
            onPageChange={setPage}
          />
        </div>
      )}
    </div>
  );
}
