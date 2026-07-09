import Link from "next/link";
import { Globe, MessageSquare, Mail, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TrustBadges } from "@/components/trust/TrustBadges";
import { BrandLogo } from "@/components/brand/BrandLogo";

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
    { name: "Strategy Marketplace", href: "/register" },
    { name: "Visual Builder", href: "/register" },
    { name: "Copy Trading", href: "/register" },
    { name: "Pricing", href: "/#pricing" },
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
    { name: "Community", href: "/community" },
  ],
  Legal: [
    { name: "Privacy Policy", href: "/privacy" },
    { name: "Terms of Service", href: "/terms" },
    { name: "Risk Disclosure", href: "/risk-disclosure" },
    { name: "Cookie Policy", href: "/cookies" },
  ],
};


export function Footer() {
  return (
    <footer className="relative overflow-hidden border-t border-border bg-bg-secondary pb-[calc(3rem+env(safe-area-inset-bottom,0px))] pt-16 sm:pt-24">
      <div className="container relative z-10 mx-auto max-w-[1200px] px-[clamp(1rem,4vw,1.5rem)]">
        <div className="mb-12">
          <TrustBadges />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 md:gap-16 lg:gap-24 mb-12 lg:mb-24">
          {/* Logo & Foundation */}
          <div className="lg:col-span-5">
            <Link href="/" className="flex items-center gap-3 mb-8 group">
              <BrandLogo size="lg" showWordmark />
            </Link>
            <p className="text-foreground/40 text-sm mb-8 leading-relaxed max-w-sm font-medium">
              Building the future of trading success. Your edge, refined for tomorrow's markets.
            </p>
            <div className="flex gap-3">
              {([
                { icon: MessageSquare, href: 'https://discord.gg/profytron', label: 'Discord', external: true },
                { icon: InstagramIcon, href: 'https://www.instagram.com/profytron/', label: 'Instagram', external: true },
                { icon: Globe, href: '/', label: 'Website', external: false },
                { icon: Mail, href: 'mailto:hello@profytron.com', label: 'Email', external: false },
              ] as const).map(({ icon: Icon, href, label, external }) => (
                <a
                  key={label}
                  href={href}
                  {...(external ? { target: '_blank', rel: 'noreferrer' } : {})}
                  aria-label={label}
                  className="w-10 h-10 rounded-full bg-foreground/2 border border-border flex items-center justify-center text-foreground/40 hover:text-foreground hover:bg-foreground/10 transition-all duration-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary/70 focus-visible:rounded-full"
                >
                  <Icon className="w-4 h-4" />
                </a>
              ))}
            </div>
          </div>

          {/* Your Navigation */}
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
                        className="text-foreground/40 hover:text-foreground transition-colors text-sm font-medium inline-flex items-center"
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

        {/* Global Status Bar */}
        <div className="pt-8 border-t border-border flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="hidden sm:flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-chart-3 shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
              <span className="text-caption font-medium tracking-widest uppercase text-foreground/50">
                System Status: Operational
              </span>
            </div>
          </div>

          <p className="text-caption text-foreground/30 tracking-widest uppercase font-medium">
            © 2026 PROFYTRON
          </p>

          <p className="text-caption text-foreground/30 tracking-widest uppercase font-medium">
            Designed in India
          </p>
        </div>

        {/* Mobile Disclosure */}
        <div className="mt-8 pt-8 border-t border-border text-center w-full">
          <p className="text-micro text-foreground/35 leading-relaxed font-mono max-w-4xl mx-auto uppercase tracking-wide">
            Risk Disclosure: Digital asset trading involves substantial risk of
            loss and is not suitable for all investors. The performance of
            algorithmic strategies is inherently speculative.
          </p>
        </div>
      </div>
    </footer>
  );
}
