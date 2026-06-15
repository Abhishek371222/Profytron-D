import * as React from "react";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
  className?: string;
}

export function Breadcrumb({ items, className }: BreadcrumbProps) {
  return (
    <nav aria-label="Breadcrumb" className={cn("flex items-center gap-1.5 text-xs text-foreground/30", className)}>
      {items.map((item, index) => {
        const isLast = index === items.length - 1;
        return (
          <React.Fragment key={index}>
            {isLast || !item.href ? (
              <span className={cn("font-medium", isLast ? "text-foreground/70" : "text-foreground/30")}>
                {item.label}
              </span>
            ) : (
              <Link
                href={item.href}
                className="hover:text-foreground/60 transition-colors duration-150"
              >
                {item.label}
              </Link>
            )}
            {!isLast && (
              <ChevronRight className="w-3 h-3 text-foreground/20 flex-shrink-0" />
            )}
          </React.Fragment>
        );
      })}
    </nav>
  );
}
