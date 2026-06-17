import Link from 'next/link';
import { Mail, MessageSquare, Building2, Headphones, MapPin } from 'lucide-react';
import { PublicPageLayout } from '@/components/layout/PublicPageLayout';
import { JsonLd } from '@/components/seo/JsonLd';
import { Breadcrumbs } from '@/components/seo/Breadcrumbs';
import { CONTACT_EMAIL, SUPPORT_EMAIL, SITE_URL } from '@/lib/seo/constants';

const CONTACT_CHANNELS = [
  {
    icon: Headphones,
    title: 'Customer Support',
    description: 'Billing, account access, broker connections, and platform help.',
    email: SUPPORT_EMAIL,
    cta: 'Email Support',
  },
  {
    icon: Building2,
    title: 'Enterprise & Sales',
    description: 'Prop desks, institutions, white-label, and custom SLAs.',
    email: 'enterprise@profytron.com',
    cta: 'Contact Sales',
  },
  {
    icon: MessageSquare,
    title: 'Community',
    description: 'Join traders and strategy creators on Discord.',
    href: 'https://discord.gg/profytron',
    cta: 'Join Discord',
  },
] as const;

export default function ContactPage() {
  return (
    <PublicPageLayout>
      <JsonLd
        type="breadcrumb"
        breadcrumbs={[
          { name: 'Home', url: SITE_URL },
          { name: 'Contact', url: `${SITE_URL}/contact` },
        ]}
      />

      <main className="min-h-screen px-6 py-24">
        <div className="mx-auto max-w-5xl">
          <Breadcrumbs items={[{ label: 'Contact' }]} />

          <header className="mt-8 mb-14 max-w-2xl">
            <span className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/[0.06] px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em] text-primary mb-5">
              Contact
            </span>
            <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-foreground mb-4">
              We&apos;re here to help you trade smarter
            </h1>
            <p className="text-lg text-muted-foreground leading-relaxed">
              Reach our support team for product help, or talk to sales about enterprise
              and institutional deployments. We respond within 24 hours on business days.
            </p>
          </header>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-14">
            {CONTACT_CHANNELS.map((channel) => {
              const Icon = channel.icon;
              const href = 'email' in channel ? `mailto:${channel.email}` : channel.href;
              return (
                <article
                  key={channel.title}
                  className="rounded-2xl border border-[var(--card-border)] bg-card p-6 shadow-sm hover:border-primary/20 transition-colors"
                >
                  <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                    <Icon className="w-5 h-5 text-primary" aria-hidden />
                  </div>
                  <h2 className="text-lg font-bold text-foreground mb-2">{channel.title}</h2>
                  <p className="text-sm text-muted-foreground leading-relaxed mb-5">
                    {channel.description}
                  </p>
                  <a
                    href={href}
                    target={href.startsWith('http') ? '_blank' : undefined}
                    rel={href.startsWith('http') ? 'noreferrer' : undefined}
                    className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline underline-offset-4"
                  >
                    <Mail className="w-4 h-4" aria-hidden />
                    {channel.cta}
                  </a>
                </article>
              );
            })}
          </div>

          <section className="rounded-2xl border border-[var(--card-border)] bg-[var(--bg-secondary)] p-8 md:p-10">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
              <div>
                <div className="flex items-center gap-2 text-muted-foreground mb-2">
                  <MapPin className="w-4 h-4" aria-hidden />
                  <span className="text-sm font-medium">Headquarters</span>
                </div>
                <p className="text-foreground font-semibold">Profytron Technologies</p>
                <p className="text-sm text-muted-foreground mt-1">Bangalore, India · Remote-first team</p>
              </div>
              <div className="flex flex-col sm:flex-row gap-3">
                <a
                  href={`mailto:${CONTACT_EMAIL}`}
                  className="inline-flex h-11 items-center justify-center px-6 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:brightness-110 transition"
                >
                  {CONTACT_EMAIL}
                </a>
                <Link
                  href="/help"
                  className="inline-flex h-11 items-center justify-center px-6 rounded-xl border border-[var(--card-border)] bg-card text-sm font-semibold text-foreground hover:bg-muted/50 transition"
                >
                  Visit Help Center
                </Link>
              </div>
            </div>
          </section>
        </div>
      </main>
    </PublicPageLayout>
  );
}
