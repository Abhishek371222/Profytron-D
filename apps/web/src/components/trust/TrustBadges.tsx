import { Shield, Lock, Headphones, Sparkles, Building2, Activity } from "lucide-react";
import { cn } from "@/lib/utils";

const BADGES = [
  { label: "ISO 27001", icon: Shield },
  { label: "SOC 2", icon: Shield },
  { label: "GDPR", icon: Lock },
  { label: "SSL Secured", icon: Lock },
  { label: "99.99% Uptime", icon: Activity },
  { label: "24/7 Support", icon: Headphones },
  { label: "Enterprise Ready", icon: Building2 },
  { label: "AI Powered", icon: Sparkles },
] as const;

export function TrustBadges({
  className,
  compact = false,
}: {
  className?: string;
  compact?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex flex-wrap items-center gap-2",
        compact ? "gap-1.5" : "gap-2.5",
        className,
      )}
      role="list"
      aria-label="Security and compliance certifications"
    >
      {BADGES.map(({ label, icon: Icon }) => (
        <span
          key={label}
          role="listitem"
          className={cn(
            "landing-trust-chip",
            compact ? "px-2.5 py-1 text-[11px] normal-case tracking-normal" : "px-3 py-1.5 text-caption",
          )}
        >
          <Icon className={cn(compact ? "h-3 w-3" : "h-3.5 w-3.5", "text-primary shrink-0")} aria-hidden />
          {label}
        </span>
      ))}
    </div>
  );
}
