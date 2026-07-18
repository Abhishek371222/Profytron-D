'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { z } from '@/lib/zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowLeft, Bot, FileImage, FileText, Database, Loader2, Plus, X } from 'lucide-react';
import { toast } from 'sonner';
import {
  DashboardPage,
  DashboardBreadcrumbs,
  DashboardPageHeader,
  DashButton,
} from '@/components/dashboard/DashboardPrimitives';
import { strategiesApi, type Strategy, type StrategyDocumentKind } from '@/lib/api/strategies';
import { cn } from '@/lib/utils';

const CATEGORIES = [
  { value: 'TREND', label: 'Trend' },
  { value: 'SCALPING', label: 'Scalping' },
  { value: 'RANGE', label: 'Range' },
  { value: 'VOLATILITY', label: 'Volatility' },
  { value: 'ARBITRAGE', label: 'Arbitrage' },
] as const;

const RISK_LEVELS = [
  { value: 'LOW', label: 'Low' },
  { value: 'MEDIUM', label: 'Medium' },
  { value: 'HIGH', label: 'High' },
  { value: 'EXPERT', label: 'Expert' },
] as const;

const MARKET_OPTIONS = ['Forex', 'Crypto', 'Indices', 'Commodities', 'Stocks'] as const;

const TIMEFRAMES = ['M1', 'M3', 'M5', 'M15', 'H1', 'H4'] as const;

const addBotSchema = z.object({
  name: z.string().min(3, 'Bot name must be at least 3 characters').max(80),
  strategyStyle: z.string().min(2, 'Enter the strategy style or name it follows'),
  category: z.enum(['TREND', 'SCALPING', 'RANGE', 'VOLATILITY', 'ARBITRAGE']),
  riskLevel: z.enum(['LOW', 'MEDIUM', 'HIGH', 'EXPERT']),
  expectedProfitPct: z.number().min(0, 'Must be 0 or more').max(1000),
  monthlyPrice: z.number().min(0, 'Price cannot be negative'),
  markets: z.array(z.string()).min(1, 'Select at least one market'),
  timeframe: z.enum(TIMEFRAMES),
  description: z.string().min(20, 'Describe the bot in at least 20 characters').max(2000),
  publishNow: z.boolean().optional(),
});

type AddBotFormValues = z.infer<typeof addBotSchema>;

type PendingFile = {
  id: string;
  kind: StrategyDocumentKind;
  file: File;
};

const fieldClass =
  'w-full rounded-xl border border-[var(--card-border)] bg-card px-3 py-2.5 text-sm text-foreground outline-none transition-colors focus:border-primary/40';

const KIND_MAX_BYTES: Record<StrategyDocumentKind, number> = {
  IMAGE: 5 * 1024 * 1024,
  PDF: 10 * 1024 * 1024,
  DATA: 10 * 1024 * 1024,
};

const UPLOAD_SLOTS: Array<{
  kind: StrategyDocumentKind;
  label: string;
  hint: string;
  accept: string;
  icon: typeof FileImage;
  maxLabel: string;
}> = [
  {
    kind: 'IMAGE',
    label: 'Add image',
    hint: 'Charts, screenshots, or bot visuals (JPG, PNG, WebP)',
    accept: 'image/jpeg,image/png,image/webp,image/gif',
    icon: FileImage,
    maxLabel: 'Max 5MB',
  },
  {
    kind: 'PDF',
    label: 'Add PDF (optional)',
    hint: 'Strategy docs or research notes — optional if you add image or data',
    accept: 'application/pdf',
    icon: FileText,
    maxLabel: 'Max 10MB',
  },
  {
    kind: 'DATA',
    label: 'Add data',
    hint: 'Backtest exports, CSV, JSON, or Excel files',
    accept: '.csv,.json,.txt,.xlsx,.xls,text/csv,application/json,text/plain',
    icon: Database,
    maxLabel: 'Max 10MB',
  },
];

function extractErrorMessage(error: unknown, fallback: string) {
  if (typeof error === 'object' && error !== null && 'response' in error) {
    const data = (error as { response?: { data?: { error?: string; message?: string | string[] } } })
      .response?.data;
    if (typeof data?.error === 'string') return data.error;
    if (typeof data?.message === 'string') return data.message;
    if (Array.isArray(data?.message)) return data.message.join(', ');
  }
  if (error instanceof Error && error.message) return error.message;
  return fallback;
}

export default function AddBotPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [pendingFiles, setPendingFiles] = React.useState<PendingFile[]>([]);
  const [assetError, setAssetError] = React.useState<string | null>(null);
  const fileInputRefs = React.useRef<Record<StrategyDocumentKind, HTMLInputElement | null>>({
    IMAGE: null,
    PDF: null,
    DATA: null,
  });

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isValid },
  } = useForm<AddBotFormValues>({
    resolver: zodResolver(addBotSchema),
    mode: 'onChange',
    defaultValues: {
      name: '',
      strategyStyle: '',
      category: 'TREND',
      riskLevel: 'MEDIUM',
      expectedProfitPct: 10,
      monthlyPrice: 2499,
      markets: ['Forex'],
      timeframe: 'H1',
      description: '',
      publishNow: true,
    },
  });

  const selectedMarkets = watch('markets') || [];

  const toggleMarket = (market: string) => {
    const next = selectedMarkets.includes(market)
      ? selectedMarkets.filter((m) => m !== market)
      : [...selectedMarkets, market];
    setValue('markets', next, { shouldValidate: true, shouldDirty: true });
  };

  const addFiles = (kind: StrategyDocumentKind, list: FileList | null) => {
    if (!list?.length) return;
    const files = Array.from(list);
    const maxBytes = KIND_MAX_BYTES[kind];
    const oversized = files.find((f) => f.size > maxBytes);
    if (oversized) {
      setAssetError(
        `${oversized.name} is ${(oversized.size / (1024 * 1024)).toFixed(1)}MB — ${kind} files are limited to ${Math.round(maxBytes / (1024 * 1024))}MB.`,
      );
      return;
    }
    const next = files.map((file) => ({
      id: `${kind}-${file.name}-${file.size}-${file.lastModified}`,
      kind,
      file,
    }));
    setPendingFiles((prev) => {
      const withoutDupes = prev.filter((p) => !next.some((n) => n.id === p.id));
      return [...withoutDupes, ...next];
    });
    setAssetError(null);
  };

  const removeFile = (id: string) => {
    setPendingFiles((prev) => prev.filter((f) => f.id !== id));
  };

  const createMutation = useMutation({
    mutationFn: async (values: AddBotFormValues) => {
      if (pendingFiles.length === 0) {
        throw new Error('Upload at least one image, PDF, or data file before submitting.');
      }

      const created = await strategiesApi.createStrategy({
        name: values.name.trim(),
        category: values.category,
        riskLevel: values.riskLevel,
        assetClass: values.markets[0],
        timeframe: values.timeframe,
        description: values.description.trim(),
        monthlyPrice: values.monthlyPrice,
        annualPrice: Math.round(values.monthlyPrice * 10),
        configJson: {
          strategyStyle: values.strategyStyle.trim(),
          expectedProfitPct: values.expectedProfitPct,
          markets: values.markets,
          timeframe: values.timeframe.trim(),
          source: 'creator-studio',
        },
      });

      if (!created?.id) {
        throw new Error('Bot was created but no id was returned. Please try again.');
      }

      const uploadResults = await Promise.allSettled(
        pendingFiles.map((item) =>
          strategiesApi.uploadDocument(created.id, item.file, item.kind, item.file.name),
        ),
      );
      const failedUploads = uploadResults.filter((r) => r.status === 'rejected');
      if (failedUploads.length > 0) {
        try {
          await strategiesApi.deleteStrategy(created.id);
        } catch {
        }
        const firstReason =
          failedUploads[0].status === 'rejected'
            ? extractErrorMessage(failedUploads[0].reason, 'Upload failed')
            : 'Upload failed';
        throw new Error(
          `File upload failed (${failedUploads.length}/${pendingFiles.length}). Bot was not submitted. ${firstReason}`,
        );
      }

      if (values.publishNow) {
        await strategiesApi.publishStrategy(created.id);
      }

      return { created, submitted: Boolean(values.publishNow) };
    },
    onSuccess: async ({ submitted, created }) => {
      queryClient.setQueryData(['strategies-created'], (prev: Strategy[] | undefined) => {
        const list = Array.isArray(prev) ? prev : [];
        if (list.some((b) => b.id === created.id)) return list;
        return [created as Strategy, ...list];
      });
      await queryClient.invalidateQueries({ queryKey: ['strategies-created'] });
      toast.success(
        submitted
          ? 'Bot saved and sent for 1-week marketplace review'
          : 'Bot saved as draft in Creator Studio',
      );
      router.push('/creator');
    },
    onError: (error: unknown) => {
      const message = extractErrorMessage(error, 'Could not add bot. Please try again.');
      toast.error('Failed to add bot', { description: message });
      if (message.toLowerCase().includes('upload') || message.toLowerCase().includes('file')) {
        setAssetError(message);
      }
    },
  });

  const onSubmit = (values: AddBotFormValues) => {
    if (pendingFiles.length === 0) {
      setAssetError('Upload at least one of: image, PDF, or data file.');
      toast.error('Missing strategy assets', {
        description: 'Add at least one image, PDF, or data file before submitting.',
      });
      return;
    }
    setAssetError(null);
    createMutation.mutate(values);
  };

  return (
    <DashboardPage>
      <DashboardBreadcrumbs
        items={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Creator Studio', href: '/creator' },
          { label: 'Add Bot' },
        ]}
      />

      <DashboardPageHeader
        title="Add"
        titleAccent="Bot"
        description="Describe your bot and attach images, PDFs, or data. Submit for a 1-week Profytron review before it can go live."
        icon={Bot}
        actions={
          <DashButton variant="outline" onClick={() => router.push('/creator')} className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back
          </DashButton>
        }
      />

      <form
        onSubmit={handleSubmit(onSubmit)}
        className="dashboard-card p-5 md:p-6 space-y-5 max-w-3xl"
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2 space-y-1.5">
            <label htmlFor="bot-name" className="text-xs font-semibold text-muted-foreground">Bot name</label>
            <input id="bot-name" {...register('name')} className={fieldClass} placeholder="e.g. MomentumPro AI" />
            {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
          </div>

          <div className="space-y-1.5">
            <label htmlFor="bot-strategyStyle" className="text-xs font-semibold text-muted-foreground">Strategy it follows</label>
            <input
              id="bot-strategyStyle"
              {...register('strategyStyle')}
              className={fieldClass}
              placeholder="e.g. EMA crossover + RSI filter"
            />
            {errors.strategyStyle && (
              <p className="text-xs text-destructive">{errors.strategyStyle.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <label htmlFor="bot-timeframe" className="text-xs font-semibold text-muted-foreground">Timeframe</label>
            <select id="bot-timeframe" {...register('timeframe')} className={fieldClass}>
              {TIMEFRAMES.map((tf) => (
                <option key={tf} value={tf}>
                  {tf}
                </option>
              ))}
            </select>
            {errors.timeframe && <p className="text-xs text-destructive">{errors.timeframe.message}</p>}
          </div>

          <div className="space-y-1.5">
            <label htmlFor="bot-category" className="text-xs font-semibold text-muted-foreground">Category</label>
            <select id="bot-category" {...register('category')} className={fieldClass}>
              {CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="bot-riskLevel" className="text-xs font-semibold text-muted-foreground">Risk level</label>
            <select id="bot-riskLevel" {...register('riskLevel')} className={fieldClass}>
              {RISK_LEVELS.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="bot-expectedProfitPct" className="text-xs font-semibold text-muted-foreground">Expected profit %</label>
            <input
              id="bot-expectedProfitPct"
              type="number"
              step="0.1"
              {...register('expectedProfitPct', { valueAsNumber: true })}
              className={fieldClass}
              placeholder="e.g. 12"
            />
            {errors.expectedProfitPct && (
              <p className="text-xs text-destructive">{errors.expectedProfitPct.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <label htmlFor="bot-monthlyPrice" className="text-xs font-semibold text-muted-foreground">Monthly price (₹)</label>
            <input
              id="bot-monthlyPrice"
              type="number"
              step="1"
              {...register('monthlyPrice', { valueAsNumber: true })}
              className={fieldClass}
              placeholder="e.g. 2499"
            />
            {errors.monthlyPrice && (
              <p className="text-xs text-destructive">{errors.monthlyPrice.message}</p>
            )}
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-semibold text-muted-foreground">Markets it deals on</label>
          <div className="flex flex-wrap gap-2">
            {MARKET_OPTIONS.map((market) => {
              const active = selectedMarkets.includes(market);
              return (
                <button
                  key={market}
                  type="button"
                  onClick={() => toggleMarket(market)}
                  className={cn(
                    'rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors',
                    active
                      ? 'border-primary/30 bg-primary/10 text-primary'
                      : 'border-[var(--card-border)] bg-card text-muted-foreground hover:text-foreground',
                  )}
                >
                  {market}
                </button>
              );
            })}
          </div>
          {errors.markets && <p className="text-xs text-destructive">{errors.markets.message}</p>}
        </div>

        <div className="space-y-1.5">
          <label htmlFor="bot-description" className="text-xs font-semibold text-muted-foreground">Description</label>
          <textarea
            id="bot-description"
            {...register('description')}
            rows={5}
            className={cn(fieldClass, 'resize-y min-h-[120px]')}
            placeholder="Explain how the bot works, entry/exit logic, and who it is for."
          />
          {errors.description && (
            <p className="text-xs text-destructive">{errors.description.message}</p>
          )}
        </div>

        <div className="space-y-3">
          <div>
            <label className="text-xs font-semibold text-muted-foreground">
              Strategy assets <span className="text-destructive">*</span>
            </label>
            <p className="mt-0.5 text-[11px] text-muted-foreground">
              Upload at least one file (image, PDF, or data). PDF is optional if you already add an image or data file.
              Users see these on the bot page after approval and publish.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            {UPLOAD_SLOTS.map((slot) => {
              const Icon = slot.icon;
              const count = pendingFiles.filter((f) => f.kind === slot.kind).length;
              return (
                <div key={slot.kind} className="rounded-xl border border-[var(--card-border)] bg-muted/20 p-3">
                  <input
                    ref={(el) => {
                      fileInputRefs.current[slot.kind] = el;
                    }}
                    type="file"
                    accept={slot.accept}
                    multiple
                    className="hidden"
                    onChange={(e) => {
                      addFiles(slot.kind, e.target.files);
                      e.target.value = '';
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRefs.current[slot.kind]?.click()}
                    className="flex w-full flex-col items-start gap-2 text-left"
                  >
                    <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-primary/20 bg-primary/10 text-primary">
                      <Icon className="h-4 w-4" />
                    </span>
                    <span className="text-sm font-semibold text-foreground">{slot.label}</span>
                    <span className="text-[11px] text-muted-foreground leading-snug">{slot.hint}</span>
                    <span className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground/70">{slot.maxLabel}</span>
                    {count > 0 && (
                      <span className="text-[11px] font-semibold text-primary">
                        {count} file{count === 1 ? '' : 's'} selected
                      </span>
                    )}
                  </button>
                </div>
              );
            })}
          </div>

          {assetError && <p className="text-xs text-destructive">{assetError}</p>}

          {pendingFiles.length > 0 && (
            <ul className="space-y-1.5 rounded-xl border border-[var(--card-border)] bg-card p-3">
              {pendingFiles.map((item) => (
                <li
                  key={item.id}
                  className="flex items-center justify-between gap-2 text-xs text-foreground"
                >
                  <span className="truncate">
                    <span className="font-semibold text-muted-foreground mr-2">{item.kind}</span>
                    {item.file.name}
                  </span>
                  <button
                    type="button"
                    onClick={() => removeFile(item.id)}
                    className="shrink-0 rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
                    aria-label="Remove file"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <label className="flex items-start gap-2 text-sm text-foreground">
          <input
            type="checkbox"
            {...register('publishNow')}
            className="mt-0.5 rounded border-[var(--card-border)]"
          />
          <span>
            Submit for marketplace review after saving
            <span className="block text-xs text-muted-foreground mt-0.5">
              Profytron reviews performance for ~1 week. Your bot stays pending in Creator Studio and is not public until approved and you publish it.
            </span>
          </span>
        </label>

        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end pt-2">
          <DashButton type="button" variant="outline" onClick={() => router.push('/creator')}>
            Cancel
          </DashButton>
          <DashButton
            type="submit"
            disabled={!isValid || createMutation.isPending || pendingFiles.length === 0}
            className="gap-2"
          >
            {createMutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Plus className="h-4 w-4" />
                Add Bot
              </>
            )}
          </DashButton>
        </div>
      </form>
    </DashboardPage>
  );
}
