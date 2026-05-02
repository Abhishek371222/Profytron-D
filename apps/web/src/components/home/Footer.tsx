import { Zap, Globe, MessageSquare, Mail, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

const InstagramIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
    <circle cx="12" cy="12" r="4" />
    <circle cx="17.5" cy="6.5" r="0.5" fill="currentColor" stroke="none" />
  </svg>
);


const footerLinks = {
  Product: [
    { name: "Features", href: "#features" },
    { name: "Strategy Library", href: "/strategies" },
    { name: "Visual Builder", href: "/strategies/builder" },
    { name: "Marketplace", href: "/marketplace" },
    { name: "Security System", href: "/settings/security" },
  ],
  Company: [
    { name: "About Us", href: "/about" },
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
    <footer className="pt-24 pb-12 bg-black border-t border-white/5 relative overflow-hidden">
      {/* Background Architectural Glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[300px] bg-p/5 blur-[120px] rounded-full pointer-events-none" />

      <div className="container mx-auto px-6 relative z-10 max-w-[1200px]">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 md:gap-24 mb-24">
          {/* Logo & Foundation */}
          <div className="lg:col-span-5">
            <a href="/" className="flex items-center gap-3 mb-8 group">
              <div className="w-10 h-10 bg-white/3 rounded-xl flex items-center justify-center border border-white/10 group-hover:border-p/50 transition-all duration-500 shadow-inner group-hover:bg-p/10">
                <Zap className="w-5 h-5 text-white/70 group-hover:text-p transition-colors" />
              </div>
              <span className="text-xl font-bold tracking-tight text-white group-hover:text-white/90 transition-colors">
                PROFYTRON
              </span>
            </a>
            <p className="text-white/40 text-sm mb-10 leading-relaxed max-w-sm font-medium">
              Building the of trading success. Your
              power, refined for the trading future.
            </p>
            <div className="flex gap-3">
              {[
                { icon: MessageSquare, href: 'https://discord.gg/profytron', label: 'Discord' },
                { icon: InstagramIcon, href: 'https://www.instagram.com/profytron/', label: 'Instagram' },
                { icon: Globe, href: '/', label: 'Website' },
                { icon: Mail, href: 'mailto:hello@profytron.com', label: 'Email' },
              ].map(({ icon: Icon, href, label }) => (
                <a
                  key={label}
                  href={href}
                  target={href.startsWith('http') ? '_blank' : undefined}
                  rel={href.startsWith('http') ? 'noreferrer' : undefined}
                  aria-label={label}
                  className="w-10 h-10 rounded-full bg-white/2 border border-white/5 flex items-center justify-center text-white/40 hover:text-white hover:bg-white/10 transition-all duration-300"
                >
                  <Icon className="w-4 h-4" />
                </a>
              ))}
            </div>
          </div>

          {/* Your Navigation */}
          <div className="lg:col-span-7 grid grid-cols-2 md:grid-cols-4 gap-12">
            {Object.entries(footerLinks).map(([title, links]) => (
              <div key={title} className="flex flex-col gap-6">
                <h6 className="font-semibold text-white text-sm tracking-tight">
                  {title}
                </h6>
                <ul className="flex flex-col gap-4">
                  {links.map((link) => (
                    <li key={link.name}>
                      <a
                        href={link.href}
                        className="text-white/40 hover:text-white transition-colors text-sm font-medium inline-flex items-center"
                      >
                        {link.name}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* Global Status Bar */}
        <div className="pt-8 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="hidden sm:flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
              <span className="text-[11px] font-medium tracking-widest uppercase text-white/50">
                System Status: Operational
              </span>
            </div>
          </div>

          <p className="text-[11px] text-white/30 tracking-widest uppercase font-medium">
            © 2026 PROFYTRON
          </p>

          <p className="text-[11px] text-white/30 tracking-widest uppercase font-medium">
            Designed in India
          </p>
        </div>

        {/* Mobile Disclosure */}
        <div className="mt-8 pt-8 border-t border-white/5 text-center w-full">
          <p className="text-[10px] text-white/20 leading-relaxed font-mono max-w-4xl mx-auto uppercase tracking-wide">
            Risk Disclosure: Digital asset trading involves substantial risk of
            loss and is not suitable for all investors. The performance of
            algorithmic strategies is inherently speculative.
          </p>
        </div>
      </div>
    </footer>
  );
}
