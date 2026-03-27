import { useQuery } from '@tanstack/react-query';
import { compareApi } from '../services/api';

export function useCompare(params) {
  const enabled = !!(params?.aStart && params?.aEnd && params?.bStart && params?.bEnd);
  return useQuery({
    queryKey: ['compare', params],
    queryFn: () => compareApi.compare(params),
    enabled,
    staleTime: 2 * 60 * 1000,
  });
}
