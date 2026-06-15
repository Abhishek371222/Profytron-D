import Link from 'next/link';
import { PublicPageLayout } from '@/components/layout/PublicPageLayout';

const sections = [
  {
    title: 'Getting Started',
    links: [
      { label: 'Create account', href: '/register' },
      { label: 'Connect MT5 / Paper account', href: '/docs' },
      { label: 'Browse marketplace strategies', href: '/marketplace' },
    ],
  },
  {
    title: 'Billing & Wallet',
    links: [
      { label: 'Plans & pricing', href: '/pricing' },
      { label: 'Manage subscription', href: '/settings/billing' },
      { label: 'Fund wallet (UPI/Razorpay)', href: '/wallet' },
    ],
  },
  {
    title: 'Support',
    links: [
      { label: 'Documentation', href: '/docs' },
      { label: 'FAQ on homepage', href: '/#faq' },
      { label: 'Open support ticket', href: '/settings/support' },
      { label: 'Email support', href: 'mailto:support@profytron.com' },
    ],
  },
];

export default function HelpPage() {
  return (
    <PublicPageLayout>
      <main className="min-h-screen text-foreground px-6 py-24">
        <div className="mx-auto max-w-3xl">
          <h1 className="text-4xl font-bold tracking-tight">Help Center</h1>
          <p className="mt-3 text-foreground/60">
            Quick answers and links for Profytron copy trading, billing, and broker setup.
          </p>
          <div className="mt-12 space-y-10">
            {sections.map((section) => (
              <section key={section.title}>
                <h2 className="text-lg font-semibold text-primary mb-4">
                  {section.title}
                </h2>
                <ul className="space-y-2">
                  {section.links.map((link) => (
                    <li key={link.href}>
                      <Link
                        href={link.href}
                        className="text-foreground/70 hover:text-foreground underline-offset-4 hover:underline"
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </div>
        </div>
      </main>
    </PublicPageLayout>
  );
}
