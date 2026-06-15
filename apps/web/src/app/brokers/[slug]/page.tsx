import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { PublicPageLayout } from '@/components/layout/PublicPageLayout';
import { BROKER_DIRECTORY } from '@/lib/broker/broker-directory';

type Props = { params: Promise<{ slug: string }> };

export async function generateStaticParams() {
  return BROKER_DIRECTORY.filter((b) => b.id !== 'PAPER').map((broker) => ({
    slug: broker.id.toLowerCase().replace(/_/g, '-'),
  }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const broker = findBroker(slug);
  if (!broker) return { title: 'Broker Setup | Profytron' };
  return {
    title: `Connect ${broker.displayName} to Profytron MT5 Copy Trading`,
    description: `Step-by-step guide to connect ${broker.displayName} (${broker.platform}) with Profytron for automated copy trading. ${broker.description}`,
    keywords: [
      `${broker.name} MT5 setup`,
      `${broker.name} copy trading`,
      'MT5 automated trading India',
      'Profytron broker connect',
    ],
  };
}

function findBroker(slug: string) {
  const normalized = slug.toUpperCase().replace(/-/g, '_');
  return BROKER_DIRECTORY.find(
    (b) =>
      b.id === normalized ||
      b.id.toLowerCase().replace(/_/g, '-') === slug.toLowerCase(),
  );
}

export default async function BrokerSetupPage({ params }: Props) {
  const { slug } = await params;
  const broker = findBroker(slug);
  if (!broker) notFound();

  return (
    <PublicPageLayout>
      <main className="min-h-screen text-foreground px-6 py-24">
        <div className="mx-auto max-w-3xl">
          <p className="text-primary text-xs font-bold uppercase tracking-widest mb-4">
            Broker Setup Guide
          </p>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
            Connect {broker.displayName} to Profytron
          </h1>
          <p className="mt-4 text-foreground/60 leading-relaxed">{broker.description}</p>

          <dl className="mt-10 grid grid-cols-2 gap-4 text-sm">
            <div className="rounded-xl border border-border bg-foreground/5 p-4">
              <dt className="text-foreground/40">Platform</dt>
              <dd className="font-semibold mt-1">{broker.platform}</dd>
            </div>
            <div className="rounded-xl border border-border bg-foreground/5 p-4">
              <dt className="text-foreground/40">Min deposit</dt>
              <dd className="font-semibold mt-1">{broker.minDeposit}</dd>
            </div>
            <div className="rounded-xl border border-border bg-foreground/5 p-4">
              <dt className="text-foreground/40">Execution</dt>
              <dd className="font-semibold mt-1">{broker.execution}</dd>
            </div>
            <div className="rounded-xl border border-border bg-foreground/5 p-4">
              <dt className="text-foreground/40">Spreads</dt>
              <dd className="font-semibold mt-1">{broker.spread}</dd>
            </div>
          </dl>

          <section className="mt-12 space-y-4">
            <h2 className="text-2xl font-semibold">Quick setup</h2>
            <ol className="list-decimal list-inside space-y-3 text-foreground/70">
              <li>Create a Profytron account and complete onboarding</li>
              <li>Open Copy Trading → Connect Broker → select {broker.displayName}</li>
              <li>Enter your MT login, password, and server name</li>
              <li>Subscribe to a verified marketplace strategy</li>
              <li>Configure lot multiplier and risk limits — trades copy automatically</li>
            </ol>
            {broker.servers && broker.servers.length > 0 && (
              <div className="mt-6 rounded-xl border border-border bg-black/40 p-4">
                <p className="text-xs uppercase tracking-widest text-foreground/40 mb-2">
                  Common server names
                </p>
                <ul className="font-mono text-sm text-indigo-200 space-y-1">
                  {broker.servers.map((s) => (
                    <li key={s}>{s}</li>
                  ))}
                </ul>
              </div>
            )}
          </section>

          <div className="mt-12 flex flex-wrap gap-4">
            <Link
              href="/register"
              className="inline-flex h-12 items-center px-6 rounded-xl bg-primary hover:bg-primary font-semibold"
            >
              Start 7-Day Free Trial
            </Link>
            <Link
              href="/copy-trading"
              className="inline-flex h-12 items-center px-6 rounded-xl border border-border hover:bg-foreground/5 font-semibold"
            >
              Connect Broker
            </Link>
          </div>
        </div>
      </main>
    </PublicPageLayout>
  );
}
