import Link from "next/link";
import { Globe, MessageSquare, Mail } from "lucide-react";
import { TrustBadges } from "@/components/trust/TrustBadges";
import { BrandLogo } from "@/components/brand/BrandLogo";
import { DISCORD_URL, INSTAGRAM_URL } from "@/lib/seo/constants";

const InstagramIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
    <circle cx="12" cy="12" r="4" />
    <circle cx="17.5" cy="6.5" r="0.5" fill="currentColor" stroke="none" />
  </svg>
);

const footerLinks = {
  Product: [
    { name: "Features", href: "/#features" },
    { name: "Pricing", href: "/pricing" },
    { name: "Get Bots", href: "/get-bots" },
    { name: "Brokers", href: "/brokers" },
    { name: "Help", href: "/help" },
  ],
  Company: [
    { name: "About Us", href: "/about" },
    { name: "Contact", href: "/contact" },
    { name: "Careers", href: "/careers" },
    { name: "Blog", href: "/blog" },
  ],
  Resources: [
    { name: "Documentation", href: "/docs" },
    { name: "API Reference", href: "/api-reference" },
    { name: "Market Guides", href: "/guides" },
    { name: "Brokers", href: "/brokers" },
    { name: "Community", href: "/community" },
    { name: "System Status", href: "/status" },
  ],
  Legal: [
    { name: "Privacy Policy", href: "/privacy" },
    { name: "Terms of Service", href: "/terms" },
    { name: "Risk Disclosure", href: "/risk-disclosure" },
    { name: "Cookie Policy", href: "/cookies" },
    { name: "Cookie preferences", href: "/cookies#manage-cookies" },
  ],
};

export function Footer() {
  return (
    <footer className="relative overflow-hidden border-t border-border bg-bg-secondary pb-[calc(3rem+env(safe-area-inset-bottom,0px))] pt-16 sm:pt-24">
      <div className="page-container relative z-10 w-full">
        <div className="mb-12">
          <TrustBadges />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 md:gap-16 lg:gap-24 mb-12 lg:mb-24">
          <div className="lg:col-span-5">
            <Link href="/" className="flex items-center gap-3 mb-8 group">
              <BrandLogo size="lg" />
            </Link>
            <p className="text-muted-foreground text-sm mb-8 leading-relaxed max-w-sm font-medium">
              Forex trading bots for MT4/MT5 — marketplace strategies, paper trading, and AI risk
              controls. Capital stays at your broker.
            </p>
            <div className="flex gap-3">
              {([
                { icon: MessageSquare, href: DISCORD_URL, label: 'Discord', external: true },
                { icon: InstagramIcon, href: INSTAGRAM_URL, label: 'Instagram', external: true },
                { icon: Globe, href: '/', label: 'Website', external: false },
                { icon: Mail, href: 'mailto:support@profytron.com', label: 'Email', external: false },
              ] as const).map(({ icon: Icon, href, label, external }) => (
                <a
                  key={label}
                  href={href}
                  {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
                  aria-label={label}
                  className="w-10 h-10 rounded-full bg-foreground/2 border border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-foreground/10 transition-all duration-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary/70 focus-visible:rounded-full"
                >
                  <Icon className="w-4 h-4" />
                </a>
              ))}
            </div>
          </div>
          <div className="lg:col-span-7 grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-12">
            {Object.entries(footerLinks).map(([title, links]) => (
              <div key={title} className="flex flex-col gap-3 md:gap-6">
                <p className="font-semibold text-foreground text-sm tracking-tight">
                  {title}
                </p>
                <ul className="flex flex-col gap-3 md:gap-4">
                  {links.map((link) => (
                    <li key={link.name}>
                      <Link
                        href={link.href}
                        className="text-muted-foreground hover:text-foreground transition-colors text-sm font-medium inline-flex items-center"
                      >
                        {link.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
        <div className="pt-8 border-t border-border flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="hidden sm:flex items-center gap-4">
            <Link
              href="/status"
              className="flex items-center gap-2 text-caption font-medium tracking-widest uppercase text-foreground/50 transition-colors hover:text-foreground"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-chart-3 shadow-[0_0_10px_rgba(16,185,129,0.5)]" aria-hidden />
              System Status
            </Link>
          </div>

          <p className="text-caption text-muted-foreground tracking-widest uppercase font-medium">
            © 2026 PROFYTRON
          </p>

          <p className="text-caption text-muted-foreground tracking-widest uppercase font-medium">
            Forex bots · MT4/MT5
          </p>
        </div>
        <div className="mt-8 pt-8 border-t border-border text-center w-full">
          <p className="text-micro text-muted-foreground leading-relaxed font-mono max-w-4xl mx-auto uppercase tracking-wide">
            Risk Disclosure: Forex and CFD trading involve substantial risk of
            loss and are not suitable for all investors. Automated strategies are
            inherently speculative. Capital remains with your broker.
          </p>
        </div>
      </div>
    </footer>
  );
}
