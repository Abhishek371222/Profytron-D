'use client';

import React from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { CheckCircle2, XCircle, ExternalLink, FileCheck } from 'lucide-react';
import { adminApi } from '@/lib/api/admin';
import { Button } from '@/components/ui/button';

type KycDocument = {
  id: string;
  docType: string;
  status: string;
  storagePath: string;
  submittedAt: string;
};

type PendingUser = {
  id: string;
  email: string;
  fullName?: string | null;
  kycStatus: string;
  createdAt: string;
  kycDocuments: KycDocument[];
};

function apiErrorMessage(error: unknown, fallback: string) {
  const payload = (error as { response?: { data?: { message?: unknown; error?: unknown } } })
    ?.response?.data;
  const message = payload?.message ?? payload?.error;
  if (Array.isArray(message)) return message.join(', ');
  if (typeof message === 'string' && message.trim()) return message;
  return fallback;
}

export default function AdminKycPage() {
  const queryClient = useQueryClient();
  const [notesByUser, setNotesByUser] = React.useState<Record<string, string>>({});

  const pendingQuery = useQuery({
    queryKey: ['admin', 'kyc-pending'],
    queryFn: () => adminApi.getPendingKyc(),
    refetchInterval: 30_000,
  });

  const reviewMutation = useMutation({
    mutationFn: ({ userId, approve, notes }: { userId: string; approve: boolean; notes?: string }) =>
      adminApi.reviewKyc(userId, approve, notes),
    onSuccess: (_, { approve }) => {
      toast.success(approve ? 'KYC approved' : 'KYC rejected');
      queryClient.invalidateQueries({ queryKey: ['admin', 'kyc-pending'] });
    },
    onError: (error: unknown) => {
      toast.error(apiErrorMessage(error, 'Failed to update KYC status'));
    },
  });

  const viewDocument = async (docId: string) => {
    try {
      const { url } = await adminApi.getKycDocumentUrl(docId);
      window.open(url, '_blank', 'noopener,noreferrer');
    } catch (error) {
      toast.error(apiErrorMessage(error, 'Failed to open document'));
    }
  };

  const users = (pendingQuery.data ?? []) as PendingUser[];

  return (
    <div className="space-y-6 p-6">
      <div className="rounded-2xl border border-[var(--card-border)] bg-card p-5">
        <h1 className="flex items-center gap-2 text-2xl font-semibold text-foreground">
          <FileCheck className="h-6 w-6 text-primary" />
          KYC Review
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {users.length} submission{users.length === 1 ? '' : 's'} awaiting review.
        </p>
      </div>

      {pendingQuery.isLoading && (
        <p className="text-sm text-muted-foreground">Loading pending submissions...</p>
      )}

      {!pendingQuery.isLoading && users.length === 0 && (
        <div className="rounded-2xl border border-[var(--card-border)] bg-card p-8 text-center text-sm text-muted-foreground">
          No pending KYC submissions.
        </div>
      )}

      <div className="space-y-4">
        {users.map((u) => {
          const pendingDocs = u.kycDocuments.filter((d) => d.status === 'PENDING');
          const isBusy = reviewMutation.isPending && reviewMutation.variables?.userId === u.id;
          return (
            <div key={u.id} className="rounded-2xl border border-[var(--card-border)] bg-card p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-semibold text-foreground">{u.fullName || 'Unnamed user'}</p>
                  <p className="text-sm text-muted-foreground">{u.email}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Submitted {new Date(pendingDocs[0]?.submittedAt ?? u.createdAt).toLocaleString()}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="gap-1.5 text-destructive hover:text-destructive"
                    disabled={isBusy}
                    onClick={() =>
                      reviewMutation.mutate({
                        userId: u.id,
                        approve: false,
                        notes: notesByUser[u.id]?.trim() || undefined,
                      })
                    }
                  >
                    <XCircle className="h-4 w-4" />
                    Reject
                  </Button>
                  <Button
                    size="sm"
                    className="gap-1.5"
                    disabled={isBusy}
                    onClick={() =>
                      reviewMutation.mutate({
                        userId: u.id,
                        approve: true,
                        notes: notesByUser[u.id]?.trim() || undefined,
                      })
                    }
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    Approve
                  </Button>
                </div>
              </div>

              <div className="mt-4 space-y-2">
                {pendingDocs.map((doc) => (
                  <div
                    key={doc.id}
                    className="flex items-center justify-between gap-3 rounded-xl border border-[var(--card-border)] bg-muted/20 p-3"
                  >
                    <span className="text-sm font-medium text-foreground">{doc.docType}</span>
                    <button
                      type="button"
                      onClick={() => viewDocument(doc.id)}
                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline"
                    >
                      View document
                      <ExternalLink className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>

              <textarea
                value={notesByUser[u.id] ?? ''}
                onChange={(e) => setNotesByUser((prev) => ({ ...prev, [u.id]: e.target.value }))}
                placeholder="Optional notes (visible to the user if rejected)"
                rows={2}
                className="mt-3 w-full rounded-xl border border-[var(--card-border)] bg-muted/40 p-3 text-sm text-foreground outline-none focus:border-primary"
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
