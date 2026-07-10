"use client";

import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '@/lib/api/admin';
import { Search } from 'lucide-react';
import { toast } from 'sonner';

type AdminUser = {
  id: string;
  fullName: string;
  email: string;
  role: string;
  subscriptionTier: string;
  isSuspended: boolean;
  isActive?: boolean;
  deletedAt?: string | null;
  createdAt: string;
  lastLoginAt?: string | null;
};

function userStatus(user: {
  isSuspended?: boolean;
  isActive?: boolean;
  deletedAt?: string | null;
  isDeleted?: boolean;
}) {
  if (user.isDeleted || user.deletedAt || user.isActive === false) {
    return {
      label: 'DELETED',
      className: 'border border-muted-foreground/30 bg-muted text-muted-foreground',
    };
  }
  if (user.isSuspended) {
    return {
      label: 'SUSPENDED',
      className: 'border border-red-500/30 bg-red-500/10 text-red-600',
    };
  }
  return {
    label: 'ACTIVE',
    className: 'border border-chart-3/30 bg-chart-3/10 text-chart-3',
  };
}

export default function AdminUsersPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [withdrawBank, setWithdrawBank] = useState('');
  const [withdrawNote, setWithdrawNote] = useState('');

  const usersQuery = useQuery({
    queryKey: ['admin', 'users'],
    queryFn: () => adminApi.getUsers(),
  });

  const selectedUserQuery = useQuery({
    queryKey: ['admin', 'users', selectedUserId],
    queryFn: () => adminApi.getUserDetail(selectedUserId as string),
    enabled: Boolean(selectedUserId),
  });

  useEffect(() => {
    if (usersQuery.isError) {
      toast.error('Unable to load users');
    }
  }, [usersQuery.isError]);

  useEffect(() => {
    if (selectedUserQuery.isError) {
      toast.error('Unable to load selected user details');
    }
  }, [selectedUserQuery.isError]);

  useEffect(() => {
    setWithdrawAmount('');
    setWithdrawBank('');
    setWithdrawNote('');
  }, [selectedUserId]);

  const suspendMutation = useMutation({
    mutationFn: ({ id, isSuspended }: { id: string; isSuspended: boolean }) =>
      adminApi.updateUserStatus(id, isSuspended),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
      if (selectedUserId) {
        queryClient.invalidateQueries({ queryKey: ['admin', 'users', selectedUserId] });
      }
      toast.success('User status updated');
    },
    onError: () => {
      toast.error('Failed to update user status');
    },
  });

  const withdrawMutation = useMutation({
    mutationFn: () =>
      adminApi.withdrawFromUser(selectedUserId as string, {
        amount: Number(withdrawAmount),
        bankAccount: withdrawBank.trim() || undefined,
        note: withdrawNote.trim() || undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'users', selectedUserId] });
      setWithdrawAmount('');
      setWithdrawBank('');
      setWithdrawNote('');
      toast.success('Withdrawal queued for this account');
    },
    onError: (error: unknown) => {
      const payload =
        typeof error === 'object' && error !== null && 'response' in error
          ? (error as { response?: { data?: { error?: string | string[]; message?: string | string[] } } })
              .response?.data
          : undefined;
      const raw = payload?.error ?? payload?.message;
      const message = Array.isArray(raw)
        ? raw.join(', ')
        : typeof raw === 'string' && raw.trim()
          ? raw
          : 'Withdrawal failed';
      toast.error(message);
    },
  });

  const filteredUsers = useMemo(() => {
    const users = (usersQuery.data ?? []) as AdminUser[];
    if (!search.trim()) return users;
    const q = search.toLowerCase();
    return users.filter(
      (user) =>
        user.fullName?.toLowerCase().includes(q) ||
        user.email?.toLowerCase().includes(q) ||
        user.id?.toLowerCase().includes(q),
    );
  }, [usersQuery.data, search]);

  const detail = selectedUserQuery.data;
  const detailStatus = detail ? userStatus(detail) : null;
  const available = Number(detail?.walletAvailable ?? 0);

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">User Management</h1>
        <p className="text-sm text-muted-foreground">
          Admins retain full access to deleted accounts. Users cannot log in or re-register that email.
        </p>
      </div>

      <div className="relative max-w-xl">
        <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
        <input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search users by name, email, id"
          className="w-full rounded-lg border border-[var(--card-border)] bg-card py-2 pl-9 pr-3 text-sm text-foreground outline-none focus:border-primary"
        />
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[2fr_1fr]">
        <div className="overflow-hidden rounded-xl border border-[var(--card-border)] bg-card">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-[var(--card-border)] bg-muted/40 text-xs text-muted-foreground">
              <tr>
                <th className="px-4 py-3">User</th>
                <th className="px-4 py-3">Plan</th>
                <th className="px-4 py-3">Role</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {usersQuery.isLoading ? (
                <tr>
                  <td className="px-4 py-4 text-muted-foreground" colSpan={5}>Loading users...</td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td className="px-4 py-4 text-muted-foreground" colSpan={5}>No users found.</td>
                </tr>
              ) : (
                filteredUsers.map((user) => {
                  const status = userStatus(user);
                  const isDeleted = status.label === 'DELETED';
                  return (
                    <tr
                      key={user.id}
                      className="cursor-pointer border-b border-[var(--card-border)] hover:bg-muted"
                      onClick={() => setSelectedUserId(user.id)}
                    >
                      <td className="px-4 py-3">
                        <div className="font-medium text-foreground">{user.fullName}</div>
                        <div className="text-xs text-muted-foreground">{user.email}</div>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">{user.subscriptionTier}</td>
                      <td className="px-4 py-3 text-muted-foreground">{user.role}</td>
                      <td className="px-4 py-3">
                        <span className={`rounded px-2 py-1 text-xs font-medium ${status.className}`}>
                          {status.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        {!isDeleted && (
                          <button
                            onClick={(event) => {
                              event.stopPropagation();
                              suspendMutation.mutate({
                                id: user.id,
                                isSuspended: !user.isSuspended,
                              });
                            }}
                            className={`rounded px-3 py-1.5 text-xs font-medium ${
                              user.isSuspended
                                ? 'bg-chart-3 text-white hover:bg-chart-3/90'
                                : 'bg-red-600 text-white hover:bg-red-500'
                            }`}
                          >
                            {user.isSuspended ? 'Unsuspend' : 'Suspend'}
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <div className="rounded-xl border border-[var(--card-border)] bg-card p-4 space-y-4">
          <h2 className="text-sm font-medium text-muted-foreground">User Detail</h2>
          {!selectedUserId ? (
            <p className="text-sm text-muted-foreground">Select a user to view details.</p>
          ) : selectedUserQuery.isLoading ? (
            <p className="text-sm text-muted-foreground">Loading user detail...</p>
          ) : selectedUserQuery.isError ? (
            <p className="text-sm text-red-600">Unable to load user detail.</p>
          ) : (
            <>
              <div className="space-y-2 text-sm">
                <DetailRow label="Name" value={detail?.fullName} />
                <DetailRow label="Email" value={detail?.email} />
                <DetailRow label="Role" value={detail?.role} />
                <DetailRow label="Status" value={detailStatus?.label} />
                <DetailRow
                  label="Trades"
                  value={String(detail?._count?.trades ?? 0)}
                />
                <DetailRow
                  label="Subscriptions"
                  value={String(detail?._count?.subscriptions ?? 0)}
                />
                <DetailRow
                  label="Wallet total"
                  value={`₹${Number(detail?.walletGross ?? 0).toLocaleString('en-IN')}`}
                />
                <DetailRow
                  label="Available"
                  value={`₹${available.toLocaleString('en-IN')}`}
                />
              </div>

              <div className="space-y-3 rounded-lg border border-[var(--card-border)] bg-muted/30 p-3">
                <div>
                  <p className="text-sm font-semibold text-foreground">Admin withdraw</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    No password or OTP required. Works on deleted accounts.
                  </p>
                </div>
                <input
                  type="number"
                  min={1}
                  step="1"
                  value={withdrawAmount}
                  onChange={(e) => setWithdrawAmount(e.target.value)}
                  placeholder="Amount (INR)"
                  className="w-full rounded-lg border border-[var(--card-border)] bg-card px-3 py-2 text-sm outline-none focus:border-primary"
                />
                <input
                  value={withdrawBank}
                  onChange={(e) => setWithdrawBank(e.target.value)}
                  placeholder="Bank / payout reference (optional)"
                  className="w-full rounded-lg border border-[var(--card-border)] bg-card px-3 py-2 text-sm outline-none focus:border-primary"
                />
                <input
                  value={withdrawNote}
                  onChange={(e) => setWithdrawNote(e.target.value)}
                  placeholder="Note (optional)"
                  className="w-full rounded-lg border border-[var(--card-border)] bg-card px-3 py-2 text-sm outline-none focus:border-primary"
                />
                <button
                  type="button"
                  disabled={
                    withdrawMutation.isPending ||
                    !withdrawAmount ||
                    Number(withdrawAmount) <= 0 ||
                    Number(withdrawAmount) > available
                  }
                  onClick={() => withdrawMutation.mutate()}
                  className="w-full rounded-lg bg-primary px-3 py-2 text-xs font-semibold uppercase tracking-wide text-primary-foreground disabled:opacity-50"
                >
                  {withdrawMutation.isPending ? 'Processing…' : 'Withdraw from account'}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string | undefined }) {
  return (
    <div className="flex items-center justify-between rounded bg-muted/40 px-3 py-2">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium text-foreground">{value ?? '-'}</span>
    </div>
  );
}
