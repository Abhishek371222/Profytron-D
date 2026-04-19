"use client";

import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '@/lib/api/admin';
import { toast } from 'sonner';

type QueueStrategy = {
  id: string;
  name: string;
  category: string;
  riskLevel: string;
  verificationStatus: string;
  creator?: { fullName?: string; email?: string };
  createdAt: string;
};

export default function AdminStrategiesPage() {
  const queryClient = useQueryClient();
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [filter, setFilter] = useState<'ALL' | 'PENDING' | 'VERIFIED' | 'UNVERIFIED'>('PENDING');

  const queueQuery = useQuery({
    queryKey: ['admin', 'verification-queue'],
    queryFn: () => adminApi.getVerificationQueue(),
  });

  useEffect(() => {
    if (queueQuery.isError) {
      toast.error('Unable to load verification queue');
    }
  }, [queueQuery.isError]);

  const verifyMutation = useMutation({
    mutationFn: ({
      id,
      approve,
      note,
    }: {
      id: string;
      approve: boolean;
      note?: string;
    }) => adminApi.handleVerification(id, approve, note),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'verification-queue'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'dashboard'] });
      toast.success('Verification action completed');
    },
    onError: () => {
      toast.error('Verification action failed');
    },
  });

  const rows = useMemo(() => {
    const allRows = (queueQuery.data ?? []) as QueueStrategy[];
    if (filter === 'ALL') return allRows;
    return allRows.filter((item) => item.verificationStatus === filter);
  }, [queueQuery.data, filter]);

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-white">Strategy Verification Queue</h1>
          <p className="text-sm text-slate-400">Approve or reject strategy submissions from creators.</p>
        </div>
        <select
          value={filter}
          onChange={(event) => setFilter(event.target.value as typeof filter)}
          className="rounded border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white"
        >
          <option value="PENDING">Pending</option>
          <option value="VERIFIED">Verified</option>
          <option value="UNVERIFIED">Unverified</option>
          <option value="ALL">All</option>
        </select>
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-800 bg-slate-900">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-slate-800 bg-slate-950 text-xs text-slate-400">
            <tr>
              <th className="px-4 py-3">Strategy</th>
              <th className="px-4 py-3">Creator</th>
              <th className="px-4 py-3">Category / Risk</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Notes</th>
              <th className="px-4 py-3 text-right">Action</th>
            </tr>
          </thead>
          <tbody>
            {queueQuery.isLoading ? (
              <tr>
                <td className="px-4 py-4 text-slate-400" colSpan={6}>Loading verification queue...</td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td className="px-4 py-4 text-slate-400" colSpan={6}>No strategies in this queue.</td>
              </tr>
            ) : (
              rows.map((strategy) => (
                <tr key={strategy.id} className="border-b border-slate-800/80 align-top">
                  <td className="px-4 py-3">
                    <div className="font-medium text-white">{strategy.name}</div>
                    <div className="text-xs text-slate-500">{new Date(strategy.createdAt).toLocaleString()}</div>
                  </td>
                  <td className="px-4 py-3 text-slate-300">
                    <div>{strategy.creator?.fullName ?? 'Unknown'}</div>
                    <div className="text-xs text-slate-500">{strategy.creator?.email ?? '-'}</div>
                  </td>
                  <td className="px-4 py-3 text-slate-300">
                    {strategy.category} / {strategy.riskLevel}
                  </td>
                  <td className="px-4 py-3">
                    <span className="rounded border border-slate-600 px-2 py-1 text-xs text-slate-300">
                      {strategy.verificationStatus}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <textarea
                      value={notes[strategy.id] ?? ''}
                      onChange={(event) =>
                        setNotes((prev) => ({ ...prev, [strategy.id]: event.target.value }))
                      }
                      placeholder="Optional reviewer note"
                      className="h-16 w-full rounded border border-slate-700 bg-slate-950 p-2 text-xs text-white outline-none focus:border-red-500"
                    />
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() =>
                          verifyMutation.mutate({
                            id: strategy.id,
                            approve: true,
                            note: notes[strategy.id],
                          })
                        }
                        className="rounded bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-500"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() =>
                          verifyMutation.mutate({
                            id: strategy.id,
                            approve: false,
                            note: notes[strategy.id],
                          })
                        }
                        className="rounded bg-red-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-500"
                      >
                        Reject
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
