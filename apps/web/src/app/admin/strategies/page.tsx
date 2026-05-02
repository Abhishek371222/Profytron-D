"use client";

import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  CheckCircle2,
  Edit3,
  Layers,
  Plus,
  RefreshCw,
  Search,
  ShieldCheck,
  Star,
  Users,
} from 'lucide-react';
import { toast } from 'sonner';
import { adminApi } from '@/lib/api/admin';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

type StrategyRow = {
  id: string;
  name: string;
  description: string;
  category: string;
  riskLevel: string;
  isPublished: boolean;
  isVerified: boolean;
  verificationStatus: string;
  maxCopies: number;
  copiesCount: number;
  monthlyPrice?: number | null;
  annualPrice?: number | null;
  lifetimePrice?: number | null;
  isFeatured: boolean;
  configJson?: unknown;
  creatorId: string;
  creator?: {
    id: string;
    fullName?: string;
    email?: string;
  };
  listing?: {
    trialDays?: number;
    creatorSharePct?: number;
    platformSharePct?: number;
    payoutEnabled?: boolean;
  } | null;
  _count?: {
    subscriptions?: number;
    trades?: number;
  };
  updatedAt: string;
};

type FormState = {
  creatorId: string;
  name: string;
  description: string;
  category: string;
  riskLevel: string;
  monthlyPrice: string;
  annualPrice: string;
  lifetimePrice: string;
  maxCopies: string;
  isFeatured: boolean;
  isPublished: boolean;
  isVerified: boolean;
  trialDays: string;
  creatorSharePct: string;
  platformSharePct: string;
  payoutEnabled: boolean;
  configJson: string;
};

type StrategyPdfPreview = {
  name?: string;
  description?: string;
  category?: string;
  riskLevel?: string;
  monthlyPrice?: number;
  annualPrice?: number;
  lifetimePrice?: number;
  maxCopies?: number;
  trialDays?: number;
  isFeatured?: boolean;
  isPublished?: boolean;
  isVerified?: boolean;
  payoutEnabled?: boolean;
  configJson?: unknown;
};

const defaultFormState: FormState = {
  creatorId: '',
  name: '',
  description: '',
  category: 'TREND',
  riskLevel: 'MEDIUM',
  monthlyPrice: '0',
  annualPrice: '0',
  lifetimePrice: '0',
  maxCopies: '500',
  isFeatured: false,
  isPublished: true,
  isVerified: true,
  trialDays: '7',
  creatorSharePct: '0.8',
  platformSharePct: '0.2',
  payoutEnabled: true,
  configJson: JSON.stringify(
    {
      model: 'institutional-core-v1',
      universe: ['BTCUSDT', 'ETHUSDT'],
      timeframe: '1h',
      entryRules: ['ema_cross', 'volatility_filter'],
      risk: { stopLossPct: 1.5, takeProfitPct: 3.5 },
    },
    null,
    2,
  ),
};

const categories = ['TREND', 'SCALPING', 'RANGE', 'VOLATILITY', 'ARBITRAGE'];
const riskLevels = ['LOW', 'MEDIUM', 'HIGH', 'EXPERT'];

const toNumberOrUndefined = (value: string) => {
  const trimmed = value.trim();
  if (!trimmed.length) {
    return undefined;
  }
  const parsed = Number(trimmed);
  return Number.isFinite(parsed) ? parsed : undefined;
};

const buildPayload = (form: FormState) => {
  let parsedConfig: unknown = {};
  if (form.configJson.trim()) {
    parsedConfig = JSON.parse(form.configJson);
  }

  const monthlyPrice = toNumberOrUndefined(form.monthlyPrice) ?? 0;
  const annualPrice = toNumberOrUndefined(form.annualPrice) ?? 0;
  const lifetimePrice = toNumberOrUndefined(form.lifetimePrice) ?? 0;
  const maxCopies = toNumberOrUndefined(form.maxCopies) ?? 500;

  return {
    creatorId: form.creatorId.trim(),
    name: form.name.trim(),
    description: form.description.trim(),
    category: form.category,
    riskLevel: form.riskLevel,
    monthlyPrice,
    annualPrice,
    lifetimePrice,
    maxCopies,
    isFeatured: form.isFeatured,
    isPublished: form.isPublished,
    isVerified: form.isVerified,
    trialDays: toNumberOrUndefined(form.trialDays) ?? 7,
    creatorSharePct: toNumberOrUndefined(form.creatorSharePct) ?? 0.8,
    platformSharePct: toNumberOrUndefined(form.platformSharePct) ?? 0.2,
    payoutEnabled: form.payoutEnabled,
    configJson: parsedConfig,
  };
};

export default function AdminStrategiesPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [verificationFilter, setVerificationFilter] = useState<'ALL' | 'VERIFIED' | 'PENDING' | 'UNVERIFIED'>('ALL');
  const [editingStrategyId, setEditingStrategyId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(defaultFormState);
  const [uploadedPdfFile, setUploadedPdfFile] = useState<File | null>(null);
  const [strategyPdfPreview, setStrategyPdfPreview] = useState<StrategyPdfPreview | null>(null);

  const strategiesQuery = useQuery({
    queryKey: ['admin', 'strategies-full'],
    queryFn: () => adminApi.getStrategies(),
    refetchInterval: 30_000,
  });

  useEffect(() => {
    if (strategiesQuery.isError) {
      toast.error('Unable to load strategies');
    }
  }, [strategiesQuery.isError]);

  const createMutation = useMutation({
    mutationFn: async () => adminApi.createStrategy(buildPayload(form)),
    onSuccess: () => {
      toast.success('Strategy created and published for users');
      setForm(defaultFormState);
      setEditingStrategyId(null);
      queryClient.invalidateQueries({ queryKey: ['admin', 'strategies-full'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'dashboard'] });
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message ?? 'Failed to create strategy');
    },
  });

  const updateMutation = useMutation({
    mutationFn: async () => {
      if (!editingStrategyId) {
        throw new Error('No strategy selected');
      }
      return adminApi.updateStrategy(editingStrategyId, buildPayload(form));
    },
    onSuccess: () => {
      toast.success('Strategy updated');
      setForm(defaultFormState);
      setEditingStrategyId(null);
      queryClient.invalidateQueries({ queryKey: ['admin', 'strategies-full'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'verification-queue'] });
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message ?? 'Failed to update strategy');
    },
  });

  const parsePdfMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      return adminApi.uploadStrategyPdf(formData);
    },
    onSuccess: (result: StrategyPdfPreview) => {
      setStrategyPdfPreview(result);
      setForm((current) => ({
        ...current,
        name: result.name ?? current.name,
        description: result.description ?? current.description,
        category: result.category ?? current.category,
        riskLevel: result.riskLevel ?? current.riskLevel,
        monthlyPrice:
          result.monthlyPrice !== undefined ? String(result.monthlyPrice) : current.monthlyPrice,
        annualPrice:
          result.annualPrice !== undefined ? String(result.annualPrice) : current.annualPrice,
        lifetimePrice:
          result.lifetimePrice !== undefined ? String(result.lifetimePrice) : current.lifetimePrice,
        maxCopies:
          result.maxCopies !== undefined ? String(result.maxCopies) : current.maxCopies,
        trialDays:
          result.trialDays !== undefined ? String(result.trialDays) : current.trialDays,
        isFeatured: result.isFeatured ?? current.isFeatured,
        isPublished: result.isPublished ?? current.isPublished,
        isVerified: result.isVerified ?? current.isVerified,
        payoutEnabled: result.payoutEnabled ?? current.payoutEnabled,
        configJson: result.configJson
          ? JSON.stringify(result.configJson, null, 2)
          : current.configJson,
      }));
      toast.success('Parsed strategy PDF. Review imported values before saving.');
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message ?? 'Failed to parse strategy PDF');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => adminApi.deleteStrategy(id),
    onSuccess: () => {
      toast.success('Strategy deleted');
      queryClient.invalidateQueries({ queryKey: ['admin', 'strategies-full'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'dashboard'] });
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message ?? 'Failed to delete strategy');
    },
  });

  const verifyMutation = useMutation({
    mutationFn: ({ id, approve }: { id: string; approve: boolean }) =>
      adminApi.handleVerification(id, approve, approve ? 'Verified by admin strategy desk' : 'Rejected by admin strategy desk'),
    onSuccess: () => {
      toast.success('Verification status updated');
      queryClient.invalidateQueries({ queryKey: ['admin', 'strategies-full'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'verification-queue'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'dashboard'] });
    },
    onError: () => {
      toast.error('Verification action failed');
    },
  });

  const rows = useMemo(() => {
    const allRows = (strategiesQuery.data ?? []) as StrategyRow[];
    return allRows.filter((row) => {
      const matchesSearch =
        !search.trim().length ||
        row.name.toLowerCase().includes(search.toLowerCase()) ||
        row.description.toLowerCase().includes(search.toLowerCase()) ||
        row.creator?.fullName?.toLowerCase().includes(search.toLowerCase()) ||
        row.creator?.email?.toLowerCase().includes(search.toLowerCase());
      const matchesStatus =
        verificationFilter === 'ALL' || row.verificationStatus === verificationFilter;
      return matchesSearch && matchesStatus;
    });
  }, [strategiesQuery.data, search, verificationFilter]);

  const stats = useMemo(() => {
    const allRows = (strategiesQuery.data ?? []) as StrategyRow[];
    return {
      total: allRows.length,
      published: allRows.filter((row) => row.isPublished).length,
      verified: allRows.filter((row) => row.isVerified).length,
      totalSubscribers: allRows.reduce((sum, row) => sum + Number(row._count?.subscriptions ?? row.copiesCount ?? 0), 0),
    };
  }, [strategiesQuery.data]);

  const hydrateEditForm = (row: StrategyRow) => {
    setEditingStrategyId(row.id);
    setForm({
      creatorId: row.creatorId,
      name: row.name,
      description: row.description,
      category: row.category,
      riskLevel: row.riskLevel,
      monthlyPrice: String(row.monthlyPrice ?? 0),
      annualPrice: String(row.annualPrice ?? 0),
      lifetimePrice: String(row.lifetimePrice ?? 0),
      maxCopies: String(row.maxCopies ?? 500),
      isFeatured: Boolean(row.isFeatured),
      isPublished: Boolean(row.isPublished),
      isVerified: Boolean(row.isVerified),
      trialDays: String(row.listing?.trialDays ?? 7),
      creatorSharePct: String(row.listing?.creatorSharePct ?? 0.8),
      platformSharePct: String(row.listing?.platformSharePct ?? 0.2),
      payoutEnabled: Boolean(row.listing?.payoutEnabled ?? true),
      configJson: JSON.stringify(row.configJson ?? {}, null, 2),
    });
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col gap-4 rounded-2xl border border-slate-800 bg-slate-900 p-5 xl:flex-row xl:items-center xl:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-white">Strategy Control Room</h1>
          <p className="text-sm text-slate-400">
            Create and publish complete strategies from admin, with all metadata instantly visible to users.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatPill label="Strategies" value={stats.total} icon={<Layers className="h-4 w-4" />} />
          <StatPill label="Published" value={stats.published} icon={<CheckCircle2 className="h-4 w-4" />} />
          <StatPill label="Verified" value={stats.verified} icon={<ShieldCheck className="h-4 w-4" />} />
          <StatPill label="Subscribers" value={stats.totalSubscribers} icon={<Users className="h-4 w-4" />} />
        </div>
      </div>

      <div className="grid gap-5 xl:grid-cols-[1fr_1.2fr]">
        <div className="space-y-4 rounded-2xl border border-slate-800 bg-slate-900 p-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-widest text-slate-300">
              {editingStrategyId ? 'Edit strategy' : 'Create strategy'}
            </h2>
            {editingStrategyId && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setEditingStrategyId(null);
                  setForm(defaultFormState);
                  setUploadedPdfFile(null);
                  setStrategyPdfPreview(null);
                }}
              >
                Reset
              </Button>
            )}
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-950/10 p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-semibold text-white">Import strategy from PDF</p>
                <p className="text-xs text-slate-400">
                  Upload a PDF to extract strategy metadata, pricing, and config payload.
                </p>
              </div>

              <div className="grid w-full gap-3 sm:w-auto sm:grid-cols-[minmax(0,1fr)_auto]">
                <input
                  type="file"
                  accept="application/pdf"
                  onChange={(event) => {
                    const file = event.target.files?.[0] ?? null;
                    setUploadedPdfFile(file);
                    setStrategyPdfPreview(null);
                  }}
                  className="rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-white file:mr-4 file:rounded-full file:border-0 file:bg-slate-800 file:px-3 file:py-2 file:text-sm file:text-white"
                />
                <Button
                  onClick={() => {
                    if (!uploadedPdfFile) {
                      toast.error('Please choose a PDF to import.');
                      return;
                    }
                    parsePdfMutation.mutate(uploadedPdfFile);
                  }}
                  isLoading={parsePdfMutation.isPending}
                  className="whitespace-nowrap"
                >
                  Parse PDF
                </Button>
              </div>
            </div>

            {strategyPdfPreview && (
              <div className="mt-4 grid gap-2 rounded-2xl border border-slate-800 bg-slate-900 p-3 text-sm text-slate-300">
                <div className="text-xs uppercase tracking-widest text-slate-500">Parsed preview</div>
                {strategyPdfPreview.name && <div><strong>Name:</strong> {strategyPdfPreview.name}</div>}
                {strategyPdfPreview.description && <div><strong>Description:</strong> {strategyPdfPreview.description}</div>}
                {strategyPdfPreview.category && <div><strong>Category:</strong> {strategyPdfPreview.category}</div>}
                {strategyPdfPreview.riskLevel && <div><strong>Risk:</strong> {strategyPdfPreview.riskLevel}</div>}
                {strategyPdfPreview.monthlyPrice !== undefined && <div><strong>Monthly:</strong> ${strategyPdfPreview.monthlyPrice}</div>}
                {strategyPdfPreview.annualPrice !== undefined && <div><strong>Annual:</strong> ${strategyPdfPreview.annualPrice}</div>}
                {strategyPdfPreview.lifetimePrice !== undefined && <div><strong>Lifetime:</strong> ${strategyPdfPreview.lifetimePrice}</div>}
                {strategyPdfPreview.maxCopies !== undefined && <div><strong>Max copies:</strong> {strategyPdfPreview.maxCopies}</div>}
                {strategyPdfPreview.trialDays !== undefined && <div><strong>Trial days:</strong> {strategyPdfPreview.trialDays}</div>}
              </div>
            )}
          </div>

          <Field label="Creator user id">
            <Input
              value={form.creatorId}
              onChange={(event) => setForm((current) => ({ ...current, creatorId: event.target.value }))}
              placeholder="User id of strategy owner"
              className="border-slate-800 bg-slate-950 text-white"
            />
          </Field>

          <Field label="Strategy name">
            <Input
              value={form.name}
              onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
              placeholder="Your Momentum Pro"
              className="border-slate-800 bg-slate-950 text-white"
            />
          </Field>

          <Field label="Description">
            <textarea
              value={form.description}
              onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
              placeholder="Explain exactly what users should see in marketplace"
              className="h-24 w-full rounded-xl border border-slate-800 bg-slate-950 p-3 text-sm text-white outline-none focus:border-red-500"
            />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Category">
              <select
                value={form.category}
                onChange={(event) => setForm((current) => ({ ...current, category: event.target.value }))}
                className="h-10 w-full rounded-xl border border-slate-800 bg-slate-950 px-3 text-sm text-white outline-none focus:border-red-500"
              >
                {categories.map((category) => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </Field>
            <Field label="Risk level">
              <select
                value={form.riskLevel}
                onChange={(event) => setForm((current) => ({ ...current, riskLevel: event.target.value }))}
                className="h-10 w-full rounded-xl border border-slate-800 bg-slate-950 px-3 text-sm text-white outline-none focus:border-red-500"
              >
                {riskLevels.map((risk) => (
                  <option key={risk} value={risk}>{risk}</option>
                ))}
              </select>
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Monthly price">
              <Input
                value={form.monthlyPrice}
                onChange={(event) => setForm((current) => ({ ...current, monthlyPrice: event.target.value }))}
                className="border-slate-800 bg-slate-950 text-white"
              />
            </Field>
            <Field label="Annual price">
              <Input
                value={form.annualPrice}
                onChange={(event) => setForm((current) => ({ ...current, annualPrice: event.target.value }))}
                className="border-slate-800 bg-slate-950 text-white"
              />
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Lifetime price">
              <Input
                value={form.lifetimePrice}
                onChange={(event) => setForm((current) => ({ ...current, lifetimePrice: event.target.value }))}
                className="border-slate-800 bg-slate-950 text-white"
              />
            </Field>
            <Field label="Max copies">
              <Input
                value={form.maxCopies}
                onChange={(event) => setForm((current) => ({ ...current, maxCopies: event.target.value }))}
                className="border-slate-800 bg-slate-950 text-white"
              />
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Trial days">
              <Input
                value={form.trialDays}
                onChange={(event) => setForm((current) => ({ ...current, trialDays: event.target.value }))}
                className="border-slate-800 bg-slate-950 text-white"
              />
            </Field>
            <Field label="Creator share pct">
              <Input
                value={form.creatorSharePct}
                onChange={(event) => setForm((current) => ({ ...current, creatorSharePct: event.target.value }))}
                className="border-slate-800 bg-slate-950 text-white"
              />
            </Field>
          </div>

          <Field label="Strategy config JSON">
            <textarea
              value={form.configJson}
              onChange={(event) => setForm((current) => ({ ...current, configJson: event.target.value }))}
              className="h-36 w-full rounded-xl border border-slate-800 bg-slate-950 p-3 font-mono text-xs text-white outline-none focus:border-red-500"
            />
          </Field>

          <div className="grid grid-cols-2 gap-2 text-xs text-slate-300">
            <Toggle
              checked={form.isFeatured}
              onToggle={() => setForm((current) => ({ ...current, isFeatured: !current.isFeatured }))}
              label="Featured"
            />
            <Toggle
              checked={form.isPublished}
              onToggle={() => setForm((current) => ({ ...current, isPublished: !current.isPublished }))}
              label="Published"
            />
            <Toggle
              checked={form.isVerified}
              onToggle={() => setForm((current) => ({ ...current, isVerified: !current.isVerified }))}
              label="Verified"
            />
            <Toggle
              checked={form.payoutEnabled}
              onToggle={() => setForm((current) => ({ ...current, payoutEnabled: !current.payoutEnabled }))}
              label="Payout enabled"
            />
          </div>

          <Button
            onClick={() => {
              try {
                if (!form.creatorId.trim() || !form.name.trim() || !form.description.trim()) {
                  toast.error('Creator, strategy name, and description are required');
                  return;
                }
                if (editingStrategyId) {
                  updateMutation.mutate();
                } else {
                  createMutation.mutate();
                }
              } catch {
                toast.error('Invalid strategy payload. Check JSON and numeric fields.');
              }
            }}
            isLoading={createMutation.isPending || updateMutation.isPending}
            className="w-full justify-center"
          >
            {editingStrategyId ? (
              <>Update strategy <Edit3 className="ml-2 h-4 w-4" /></>
            ) : (
              <>Create strategy <Plus className="ml-2 h-4 w-4" /></>
            )}
          </Button>
        </div>

        <div className="space-y-4 rounded-2xl border border-slate-800 bg-slate-900 p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative w-full sm:max-w-sm">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search strategy, creator, email"
                className="border-slate-800 bg-slate-950 pl-9 text-white"
              />
            </div>
            <div className="flex items-center gap-2">
              <select
                value={verificationFilter}
                onChange={(event) =>
                  setVerificationFilter(event.target.value as typeof verificationFilter)
                }
                className="h-10 rounded-xl border border-slate-800 bg-slate-950 px-3 text-sm text-white"
              >
                <option value="ALL">All</option>
                <option value="VERIFIED">Verified</option>
                <option value="PENDING">Pending</option>
                <option value="UNVERIFIED">Unverified</option>
              </select>
              <Button
                variant="outline"
                size="sm"
                onClick={() => strategiesQuery.refetch()}
                isLoading={strategiesQuery.isFetching}
              >
                <RefreshCw className="mr-2 h-4 w-4" /> Refresh
              </Button>
            </div>
          </div>

          <div className="grid gap-3">
            {strategiesQuery.isLoading ? (
              <div className="rounded-xl border border-dashed border-slate-800 px-4 py-8 text-center text-sm text-slate-500">
                Loading strategies...
              </div>
            ) : rows.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-800 px-4 py-8 text-center text-sm text-slate-500">
                No strategies match this filter.
              </div>
            ) : (
              rows.map((row) => (
                <div key={row.id} className="rounded-xl border border-slate-800 bg-slate-950 p-4">
                  <div className="flex flex-col gap-3 xl:flex-row xl:items-start xl:justify-between">
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-base font-semibold text-white">{row.name}</h3>
                        {row.isFeatured && (
                          <span className="inline-flex items-center gap-1 rounded-full border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-[10px] uppercase tracking-widest text-amber-300">
                            <Star className="h-3 w-3" /> Featured
                          </span>
                        )}
                        <span className="rounded-full border border-slate-700 px-2 py-0.5 text-[10px] uppercase tracking-widest text-slate-400">
                          {row.category}
                        </span>
                        <span className="rounded-full border border-slate-700 px-2 py-0.5 text-[10px] uppercase tracking-widest text-slate-400">
                          {row.riskLevel}
                        </span>
                      </div>
                      <p className="line-clamp-2 text-sm text-slate-400">{row.description}</p>
                      <p className="text-xs text-slate-500">
                        Creator: {row.creator?.fullName ?? row.creator?.email ?? row.creatorId}
                      </p>
                      <p className="text-xs text-slate-500">
                        Updated: {new Date(row.updatedAt).toLocaleString()}
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs text-slate-300 sm:grid-cols-4">
                      <Badge label="Monthly" value={`$${Number(row.monthlyPrice ?? 0).toFixed(2)}`} />
                      <Badge label="Annual" value={`$${Number(row.annualPrice ?? 0).toFixed(2)}`} />
                      <Badge label="Copies" value={`${row._count?.subscriptions ?? row.copiesCount ?? 0}`} />
                      <Badge label="Max" value={`${row.maxCopies}`} />
                    </div>
                  </div>

                  <div className="mt-4 flex flex-wrap items-center gap-2">
                    <StatusChip active={row.isPublished} label="Published" />
                    <StatusChip active={row.isVerified} label={row.verificationStatus} />
                    <StatusChip active={Boolean(row.listing?.payoutEnabled)} label="Payout" />
                  </div>

                  <div className="mt-4 flex flex-wrap items-center gap-2">
                    <Button variant="outline" size="sm" onClick={() => hydrateEditForm(row)}>
                      <Edit3 className="mr-2 h-4 w-4" /> Edit
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => verifyMutation.mutate({ id: row.id, approve: true })}
                      isLoading={verifyMutation.isPending}
                    >
                      Verify
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => verifyMutation.mutate({ id: row.id, approve: false })}
                      isLoading={verifyMutation.isPending}
                    >
                      Set unverified
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => {
                        if (!confirm('Delete this strategy? This cannot be undone.')) {
                          return;
                        }
                        deleteMutation.mutate(row.id);
                      }}
                      isLoading={deleteMutation.isPending}
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs uppercase tracking-widest text-slate-500">{label}</label>
      {children}
    </div>
  );
}

function Toggle({
  checked,
  onToggle,
  label,
}: {
  checked: boolean;
  onToggle: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className="flex items-center justify-between rounded-lg border border-slate-800 bg-slate-950 px-3 py-2"
    >
      <span>{label}</span>
      <span
        className={checked ? 'text-emerald-300' : 'text-slate-500'}
      >
        {checked ? 'On' : 'Off'}
      </span>
    </button>
  );
}

function StatPill({ label, value, icon }: { label: string; value: number; icon: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-950 px-3 py-2">
      <div className="mb-1 flex items-center justify-between text-slate-500">
        <span className="text-[10px] uppercase tracking-widest">{label}</span>
        {icon}
      </div>
      <div className="text-lg font-semibold text-white">{value.toLocaleString()}</div>
    </div>
  );
}

function Badge({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-slate-800 bg-slate-900 px-2 py-1">
      <div className="text-[10px] uppercase tracking-widest text-slate-500">{label}</div>
      <div className="text-sm font-medium text-white">{value}</div>
    </div>
  );
}

function StatusChip({ active, label }: { active: boolean; label: string }) {
  return (
    <span
      className={
        active
          ? 'rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[10px] uppercase tracking-widest text-emerald-300'
          : 'rounded-full border border-slate-700 px-2 py-0.5 text-[10px] uppercase tracking-widest text-slate-500'
      }
    >
      {label}
    </span>
  );
}
