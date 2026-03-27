import { useQuery, useQueryClient } from '@tanstack/react-query';
import { authApi } from '../services/api';

export function useAuth() {
  const queryClient = useQueryClient();

  const {
    data,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ['auth', 'me'],
    queryFn: authApi.me,
    retry: false,
    staleTime: 5 * 60 * 1000, // 5 min
    enabled: !!localStorage.getItem('auth_token'),
  });

  const logout = () => {
    localStorage.removeItem('auth_token');
    queryClient.clear();
    window.location.href = '/';
  };

  return {
    user: data?.user ?? null,
    isLoading,
    isAuthenticated: !!data?.user,
    isError,
    error,
    logout,
  };
}
