import { useQuery, useQueryClient } from '@tanstack/react-query';
import { activitiesApi } from '../services/api';
import { useCallback } from 'react';

export function useActivities(filters) {
  return useQuery({
    queryKey: ['activities', filters],
    queryFn: () => activitiesApi.list(filters),
    staleTime: 2 * 60 * 1000, // 2 min
    placeholderData: (prev) => prev, // keep previous data while loading
  });
}

export function useActivityStats() {
  return useQuery({
    queryKey: ['activities', 'stats'],
    queryFn: activitiesApi.stats,
    staleTime: 5 * 60 * 1000,
  });
}

export function useActivityTypes() {
  return useQuery({
    queryKey: ['activities', 'types'],
    queryFn: activitiesApi.types,
    staleTime: 10 * 60 * 1000,
  });
}

export function useSyncStatus() {
  return useQuery({
    queryKey: ['activities', 'sync-status'],
    queryFn: activitiesApi.syncStatus,
    refetchInterval: (query) => {
      // Poll every 3 seconds while syncing
      const status = query.state.data?.syncStatus;
      return status === 'syncing' ? 3000 : false;
    },
    staleTime: 0,
  });
}

export function useStartSync() {
  const queryClient = useQueryClient();

  return useCallback(async () => {
    await activitiesApi.startSync();
    queryClient.invalidateQueries({ queryKey: ['activities', 'sync-status'] });
  }, [queryClient]);
}
