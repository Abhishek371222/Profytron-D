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
  createdAt: string;
  lastLoginAt?: string | null;
};

export default function AdminUsersPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);

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

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-semibold text-white">User Management</h1>
        <p className="text-sm text-slate-400">Real users from the admin API.</p>
      </div>

      <div className="relative max-w-xl">
        <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
        <input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search users by name, email, id"
          className="w-full rounded-lg border border-slate-700 bg-slate-900 py-2 pl-9 pr-3 text-sm text-white outline-none focus:border-red-500"
        />
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[2fr_1fr]">
        <div className="overflow-hidden rounded-xl border border-slate-800 bg-slate-900">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-800 bg-slate-950 text-xs text-slate-400">
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
                  <td className="px-4 py-4 text-slate-400" colSpan={5}>Loading users...</td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td className="px-4 py-4 text-slate-400" colSpan={5}>No users found.</td>
                </tr>
              ) : (
                filteredUsers.map((user) => (
                  <tr
                    key={user.id}
                    className="cursor-pointer border-b border-slate-800/80 hover:bg-slate-800/40"
                    onClick={() => setSelectedUserId(user.id)}
                  >
                    <td className="px-4 py-3">
                      <div className="font-medium text-white">{user.fullName}</div>
                      <div className="text-xs text-slate-400">{user.email}</div>
                    </td>
                    <td className="px-4 py-3 text-slate-300">{user.subscriptionTier}</td>
                    <td className="px-4 py-3 text-slate-300">{user.role}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded px-2 py-1 text-xs font-medium ${
                          user.isSuspended
                            ? 'border border-red-500/30 bg-red-500/10 text-red-400'
                            : 'border border-emerald-500/30 bg-emerald-500/10 text-emerald-400'
                        }`}
                      >
                        {user.isSuspended ? 'SUSPENDED' : 'ACTIVE'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={(event) => {
                          event.stopPropagation();
                          suspendMutation.mutate({ id: user.id, isSuspended: !user.isSuspended });
                        }}
                        className={`rounded px-3 py-1.5 text-xs font-medium ${
                          user.isSuspended
                            ? 'bg-emerald-600 text-white hover:bg-emerald-500'
                            : 'bg-red-600 text-white hover:bg-red-500'
                        }`}
                      >
                        {user.isSuspended ? 'Unsuspend' : 'Suspend'}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900 p-4">
          <h2 className="mb-3 text-sm font-medium text-slate-300">User Detail</h2>
          {!selectedUserId ? (
            <p className="text-sm text-slate-500">Select a user to view details.</p>
          ) : selectedUserQuery.isLoading ? (
            <p className="text-sm text-slate-500">Loading user detail...</p>
          ) : selectedUserQuery.isError ? (
            <p className="text-sm text-red-400">Unable to load user detail.</p>
          ) : (
            <div className="space-y-2 text-sm">
              <DetailRow label="Name" value={selectedUserQuery.data?.fullName} />
              <DetailRow label="Email" value={selectedUserQuery.data?.email} />
              <DetailRow label="Role" value={selectedUserQuery.data?.role} />
              <DetailRow
                label="Trades"
                value={String(selectedUserQuery.data?._count?.trades ?? 0)}
              />
              <DetailRow
                label="Subscriptions"
                value={String(selectedUserQuery.data?._count?.subscriptions ?? 0)}
              />
              <DetailRow
                label="Wallet Gross"
                value={String(selectedUserQuery.data?.walletGross ?? 0)}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string | undefined }) {
  return (
    <div className="flex items-center justify-between rounded bg-slate-950 px-3 py-2">
      <span className="text-slate-400">{label}</span>
      <span className="font-medium text-white">{value ?? '-'}</span>
    </div>
  );
}
