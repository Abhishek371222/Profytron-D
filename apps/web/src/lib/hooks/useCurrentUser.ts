import { useQuery } from '@tanstack/react-query';
import { usersApi } from '../api/users';
import { useAuthStore } from '../stores/useAuthStore';

export function useCurrentUser() {
  const { isAuthenticated } = useAuthStore();

  return useQuery({
    queryKey: ['currentUser'],
    queryFn: async () => {
      const data = await usersApi.getMe();
      return data;
    },
    enabled: isAuthenticated, // Only fetch if we already have a token
    staleTime: 5 * 60 * 1000, // 5 minutes cache
  });
}
