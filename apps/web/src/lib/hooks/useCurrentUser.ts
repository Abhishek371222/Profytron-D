import { useQuery } from '@tanstack/react-query';
import { usersApi } from '../api/users';
import { useAuthStore } from '../stores/useAuthStore';

export function useCurrentUser() {
  const { isAuthenticated, isHydrating, user } = useAuthStore();

  return useQuery({
    queryKey: ['currentUser'],
    queryFn: async () => {
      try {
        const data = await usersApi.getMe();
        return data;
      } catch {
        if (user) {
          return user;
        }
        throw new Error('Unable to load current user');
      }
    },
    enabled: isAuthenticated && !isHydrating,
    staleTime: 5 * 60 * 1000, // 5 minutes cache
  });
}
