'use client';

import React from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Clock, XCircle, CheckCircle2, Upload, FileText } from 'lucide-react';
import { usersApi } from '@/lib/api/users';
import { SettingsSection, SettingsField } from '@/components/settings/SettingsUi';
import { DashButton } from '@/components/dashboard/DashboardPrimitives';
import { cn } from '@/lib/utils';

const DOC_TYPES = [
  { value: 'AADHAAR', label: 'Aadhaar Card' },
  { value: 'PAN', label: 'PAN Card' },
  { value: 'PASSPORT', label: 'Passport' },
  { value: 'DRIVING_LICENSE', label: 'Driving License' },
] as const;

const STATUS_STYLE: Record<string, { label: string; className: string; icon: typeof Clock }> = {
  NOT_STARTED: { label: 'Not started', className: 'border-[var(--card-border)] text-muted-foreground', icon: FileText },
  PENDING: { label: 'Under review', className: 'border-chart-4/30 bg-chart-4/10 text-chart-4', icon: Clock },
  VERIFIED: { label: 'Verified', className: 'border-primary/30 bg-primary/10 text-primary', icon: CheckCircle2 },
  REJECTED: { label: 'Rejected', className: 'border-destructive/30 bg-destructive/10 text-destructive', icon: XCircle },
};

function apiErrorMessage(error: unknown, fallback: string) {
  const payload = (error as { response?: { data?: { message?: unknown; error?: unknown } } })
    ?.response?.data;
  const message = payload?.message ?? payload?.error;
  if (Array.isArray(message)) return message.join(', ');
  if (typeof message === 'string' && message.trim()) return message;
  return fallback;
}

export default function KycSettingsPage() {
  const queryClient = useQueryClient();
  const [docType, setDocType] = React.useState<(typeof DOC_TYPES)[number]['value']>('AADHAAR');
  const [file, setFile] = React.useState<File | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);

  const kycQuery = useQuery({
    queryKey: ['kyc-status'],
    queryFn: () => usersApi.getKycStatus(),
    staleTime: 30_000,
  });

  const submitMutation = useMutation({
    mutationFn: () => {
      if (!file) throw new Error('Select a document to upload');
      return usersApi.submitKyc(docType, file);
    },
    onSuccess: () => {
      toast.success('Document submitted for review');
      setFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      queryClient.invalidateQueries({ queryKey: ['kyc-status'] });
    },
    onError: (error: unknown) => {
      toast.error(apiErrorMessage(error, 'Failed to submit document'));
    },
  });

  const status = kycQuery.data?.kycStatus ?? 'NOT_STARTED';
  const statusMeta = STATUS_STYLE[status] ?? STATUS_STYLE.NOT_STARTED;
  const StatusIcon = statusMeta.icon;
  const documents = kycQuery.data?.documents ?? [];
  const canSubmit = status !== 'VERIFIED' && status !== 'PENDING';

  return (
    <div className="space-y-5">
      <SettingsSection
        title="Identity verification"
        description="Verify your identity to enable withdrawals from your wallet."
      >
        <div
          className={cn(
            'flex items-center gap-3 rounded-xl border px-4 py-3 text-sm font-semibold',
            statusMeta.className,
          )}
        >
          <StatusIcon className="h-4 w-4 shrink-0" />
          {statusMeta.label}
        </div>

        {status === 'VERIFIED' && (
          <p className="text-sm text-muted-foreground">
            Your identity has been verified. You can withdraw funds from your wallet.
          </p>
        )}
        {status === 'PENDING' && (
          <p className="text-sm text-muted-foreground">
            Your document is under review. This usually takes 1-2 business days — we&apos;ll notify you once it&apos;s done.
          </p>
        )}
        {status === 'REJECTED' && (
          <p className="text-sm text-muted-foreground">
            Your last submission was rejected. Check the notes below and submit a new document.
          </p>
        )}
        {status === 'NOT_STARTED' && (
          <p className="text-sm text-muted-foreground">
            You haven&apos;t started verification yet. This is required before you can withdraw funds.
          </p>
        )}
      </SettingsSection>

      {canSubmit && (
        <SettingsSection title="Submit a document" description="JPEG, PNG, WebP, or PDF — max 10MB.">
          <SettingsField label="Document type">
            <select
              value={docType}
              onChange={(e) => setDocType(e.target.value as typeof docType)}
              className="dash-input h-11 w-full text-sm"
            >
              {DOC_TYPES.map((d) => (
                <option key={d.value} value={d.value}>
                  {d.label}
                </option>
              ))}
            </select>
          </SettingsField>

          <SettingsField label="Document file">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,application/pdf"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              className="dash-input h-11 w-full text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-muted file:px-3 file:py-1.5 file:text-xs file:font-semibold"
            />
          </SettingsField>

          <DashButton
            onClick={() => submitMutation.mutate()}
            disabled={!file || submitMutation.isPending}
            className="gap-2"
          >
            <Upload className="h-4 w-4" />
            {submitMutation.isPending ? 'Submitting...' : 'Submit for review'}
          </DashButton>
        </SettingsSection>
      )}

      {documents.length > 0 && (
        <SettingsSection title="Submission history">
          <ul className="space-y-2">
            {documents.map((doc) => {
              const meta = STATUS_STYLE[doc.status] ?? STATUS_STYLE.PENDING;
              const DocIcon = meta.icon;
              return (
                <li
                  key={doc.id}
                  className="flex items-center justify-between gap-3 rounded-xl border border-[var(--card-border)] bg-muted/20 p-3"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground">
                      {DOC_TYPES.find((d) => d.value === doc.docType)?.label ?? doc.docType}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Submitted {new Date(doc.submittedAt).toLocaleDateString()}
                      {doc.notes ? ` · ${doc.notes}` : ''}
                    </p>
                  </div>
                  <span
                    className={cn(
                      'inline-flex shrink-0 items-center gap-1.5 rounded-lg border px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide',
                      meta.className,
                    )}
                  >
                    <DocIcon className="h-3 w-3" />
                    {meta.label}
                  </span>
                </li>
              );
            })}
          </ul>
        </SettingsSection>
      )}
    </div>
  );
}
