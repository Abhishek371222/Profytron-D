import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { BROKER_DIRECTORY } from '@/lib/broker/broker-directory';
import { buildPageMetadata } from '@/lib/seo/metadata';
import { BrokerSetupClient } from './BrokerSetupClient';

type Props = { params: Promise<{ slug: string }> };

export async function generateStaticParams() {
  return BROKER_DIRECTORY.filter((b) => b.id !== 'PAPER').map((broker) => ({
    slug: broker.id.toLowerCase().replace(/_/g, '-'),
  }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const broker = findBroker(slug);
  if (!broker) return { title: 'Broker Setup' };
  return buildPageMetadata({
    title: `Connect ${broker.displayName} to Profytron MT5 Bots`,
    description: `Step-by-step guide to connect ${broker.displayName} (${broker.platform}) with Profytron for automated bot trading. ${broker.description}`,
    path: `/brokers/${slug}`,
    keywords: [
      `${broker.name} MT5 setup`,
      `${broker.name} copy trading`,
      'MT5 automated trading India',
      'Profytron broker connect',
    ],
  });
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

  return <BrokerSetupClient broker={broker} />;
}
