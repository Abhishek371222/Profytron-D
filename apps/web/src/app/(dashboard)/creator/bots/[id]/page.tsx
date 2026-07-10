'use client';

import React from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, FileText, ImageIcon, Database, Loader2 } from 'lucide-react';
import {
  DashboardPage,
  DashboardBreadcrumbs,
  DashboardPageHeader,
  DashboardCard,
  DashMetricTile,
  DashSectionTitle,
  DashButton,
  DashErrorState,
} from '@/components/dashboard/DashboardPrimitives';
import { strategiesApi, type StrategyDocument } from '@/lib/api/strategies';
import { formatBotDescription, formatBotName } from '@/lib/bot-labels';
import { cn } from '@/lib/utils';

function statusLabel(bot: {
  isPublished?: boolean;
  isVerified?: boolean;
  verificationStatus?: string;
}) {
  if (bot.isPublished && bot.isVerified) {
    return { text: 'Live on marketplace', className: 'bg-chart-3/10 text-chart-3 border-chart-3/20' };
  }
  if (bot.isVerified || bot.verificationStatus === 'VERIFIED') {
    return { text: 'Approved — ready to publish', className: 'bg-chart-3/10 text-chart-3 border-chart-3/20' };
  }
  if (bot.verificationStatus === 'PENDING') {
    return { text: 'Pending approval', className: 'bg-amber-500/10 text-amber-700 border-amber-500/20' };
  }
  return { text: 'Draft', className: 'bg-muted text-muted-foreground border-[var(--card-border)]' };
}

function sizeLabel(bytes: number) {
  return bytes >= 1024 * 1024
    ? `${(bytes / 1024 / 1024).toFixed(1)} MB`
    : `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

export default function CreatorBotDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const botId = params?.id;

  const botQuery = useQuery({
    queryKey: ['creator-bot', botId],
    queryFn: () => strategiesApi.getStrategy(botId),
    enabled: Boolean(botId),
  });

  const docsQuery = useQuery({
    queryKey: ['creator-bot-docs', botId],
    queryFn: () => strategiesApi.listDocuments(botId),
    enabled: Boolean(botId),
  });

  if (botQuery.isLoading) {
    return (
      <DashboardPage>
        <div className="flex items-center justify-center py-20 text-muted-foreground gap-2">
          <Loader2 className="h-5 w-5 animate-spin" />
          Loading bot details…
        </div>
      </DashboardPage>
    );
  }

  if (botQuery.isError || !botQuery.data) {
    return (
      <DashboardPage>
        <DashboardBreadcrumbs
          items={[
            { label: 'Creator Studio', href: '/creator' },
            { label: 'Bot' },
          ]}
        />
        <DashErrorState
          message="Couldn't load this bot. It may have been removed or you may not own it."
          onRetry={() => botQuery.refetch()}
        />
      </DashboardPage>
    );
  }

  const bot = botQuery.data;
  const status = statusLabel(bot);
  const config = (bot.configJson || {}) as Record<string, unknown>;
  const strategyStyle =
    typeof config.strategyStyle === 'string' ? config.strategyStyle : null;
  const markets = Array.isArray(config.markets)
    ? (config.markets as string[]).join(', ')
    : null;
  const timeframe = typeof config.timeframe === 'string' ? config.timeframe : null;
  const profit =
    typeof config.expectedProfitPct === 'number' ? config.expectedProfitPct : null;

  const docs: StrategyDocument[] = Array.isArray(docsQuery.data)
    ? docsQuery.data
    : [];
  const images = docs.filter((d) => d.kind === 'IMAGE' || d.mimeType?.startsWith('image/'));
  const pdfs = docs.filter((d) => d.kind === 'PDF' || d.mimeType === 'application/pdf');
  const dataFiles = docs.filter(
    (d) => d.kind === 'DATA' || (!images.includes(d) && !pdfs.includes(d)),
  );

  const displayName = formatBotName(bot.name);
  const displayDescription = formatBotDescription(bot.description);

  return (
    <DashboardPage>
      <DashboardBreadcrumbs
        items={[
          { label: 'Marketplace', href: '/marketplace' },
          { label: 'Creator Studio', href: '/creator' },
          { label: displayName },
        ]}
      />

      <DashboardPageHeader
        title={displayName}
        description={displayDescription}
        actions={
          <div className="flex flex-wrap gap-2">
            <DashButton variant="outline" onClick={() => router.push('/creator')} className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back
            </DashButton>
            {bot.isPublished && (
              <Link href={`/marketplace/${bot.id}`}>
                <DashButton variant="outline">View on marketplace</DashButton>
              </Link>
            )}
          </div>
        }
      />

      <div className="flex flex-wrap items-center gap-2">
        <span className={cn('rounded-full border px-2.5 py-0.5 text-xs font-semibold', status.className)}>
          {status.text}
        </span>
        {bot.verificationStatus === 'PENDING' && (
          <span className="text-xs text-amber-700">
            Not visible to the public until Profytron approves and you publish.
          </span>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <DashMetricTile label="Category" value={bot.category} />
        <DashMetricTile label="Risk" value={bot.riskLevel} />
        <DashMetricTile
          label="Monthly"
          value={
            Number(bot.monthlyPrice || 0) > 0
              ? `₹${Number(bot.monthlyPrice).toLocaleString('en-IN')}`
              : 'FREE'
          }
        />
        <DashMetricTile
          label="Target"
          value={profit != null ? `~${profit}%` : '—'}
        />
      </div>

      <DashboardCard className="p-6">
        <DashSectionTitle className="mb-4">Strategy details</DashSectionTitle>
        <div className="grid gap-4 sm:grid-cols-3 text-sm">
          <div>
            <p className="text-xs text-muted-foreground">Strategy it follows</p>
            <p className="mt-1 font-medium text-foreground">{strategyStyle || '—'}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Timeframe</p>
            <p className="mt-1 font-medium text-foreground">{timeframe || '—'}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Markets</p>
            <p className="mt-1 font-medium text-foreground">{markets || '—'}</p>
          </div>
        </div>
        <div className="mt-5">
          <p className="text-xs text-muted-foreground">Description</p>
          <p className="mt-1 text-sm text-foreground whitespace-pre-wrap">{displayDescription}</p>
        </div>
      </DashboardCard>

      <DashboardCard className="p-6">
        <DashSectionTitle className="mb-4">Strategy assets</DashSectionTitle>
        {docsQuery.isLoading ? (
          <div className="h-24 animate-pulse rounded-xl bg-muted/40" />
        ) : docs.length === 0 ? (
          <p className="text-sm text-muted-foreground">No images, PDFs, or data files uploaded yet.</p>
        ) : (
          <div className="space-y-6">
            {images.length > 0 && (
              <div>
                <p className="mb-3 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  <ImageIcon className="h-3.5 w-3.5" />
                  Images
                </p>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {images.map((doc) => (
                    <a
                      key={doc.id}
                      href={doc.downloadUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="overflow-hidden rounded-xl border border-[var(--card-border)] bg-muted/20 transition-colors hover:border-primary/30"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={doc.downloadUrl}
                        alt={doc.title}
                        className="h-40 w-full object-cover"
                      />
                      <div className="p-3">
                        <p className="text-sm font-semibold text-foreground line-clamp-1">{doc.title}</p>
                        <p className="text-[11px] text-muted-foreground mt-0.5">
                          {sizeLabel(doc.fileSizeBytes)}
                        </p>
                      </div>
                    </a>
                  ))}
                </div>
              </div>
            )}

            {pdfs.length > 0 && (
              <div>
                <p className="mb-3 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  <FileText className="h-3.5 w-3.5" />
                  PDF documents
                </p>
                <div className="grid gap-3 md:grid-cols-2">
                  {pdfs.map((doc) => (
                    <a
                      key={doc.id}
                      href={doc.downloadUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="dashboard-card flex flex-col gap-1 p-4 transition-colors hover:border-primary/30"
                    >
                      <span className="text-sm font-semibold text-foreground">{doc.title}</span>
                      <span className="text-[11px] text-primary mt-1">
                        View PDF · {sizeLabel(doc.fileSizeBytes)}
                      </span>
                    </a>
                  ))}
                </div>
              </div>
            )}

            {dataFiles.length > 0 && (
              <div>
                <p className="mb-3 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  <Database className="h-3.5 w-3.5" />
                  Data files
                </p>
                <div className="grid gap-3 md:grid-cols-2">
                  {dataFiles.map((doc) => (
                    <a
                      key={doc.id}
                      href={doc.downloadUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="dashboard-card flex flex-col gap-1 p-4 transition-colors hover:border-primary/30"
                    >
                      <span className="text-sm font-semibold text-foreground">{doc.title}</span>
                      <span className="text-[11px] text-primary mt-1">
                        Download data · {sizeLabel(doc.fileSizeBytes)}
                      </span>
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </DashboardCard>
    </DashboardPage>
  );
}
