import { useState, useCallback, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import Header from '../components/Header';
import StatsBar from '../components/StatsBar';
import Filters from '../components/Filters';
import SearchBar from '../components/SearchBar';
import ActivityList from '../components/ActivityList';
import { useActivities, useSyncStatus } from '../hooks/useActivities';

const DEFAULT_FILTERS = {
  page: 1,
  limit: 20,
  sortBy: 'startDate',
  sortOrder: 'desc',
};

export default function DashboardPage() {
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const queryClient = useQueryClient();

  const { data, isLoading, isFetching } = useActivities(filters);
  const { data: syncData } = useSyncStatus();

  // Invalidate activity queries when sync completes
  const prevSyncStatus = usePrevious(syncData?.syncStatus);
  useEffect(() => {
    if (prevSyncStatus === 'syncing' && syncData?.syncStatus === 'complete') {
      queryClient.invalidateQueries({ queryKey: ['activities'] });
    }
  }, [syncData?.syncStatus, prevSyncStatus, queryClient]);

  const handleFiltersChange = useCallback((newFilters) => {
    setFilters(newFilters);
  }, []);

  const handleSearchChange = useCallback((search) => {
    setFilters((prev) => ({ ...prev, search: search || undefined, page: 1 }));
  }, []);

  const handlePageChange = useCallback((page) => {
    setFilters((prev) => ({ ...prev, page }));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const hasFilters = !!(
    filters.type ||
    filters.minDistance !== undefined ||
    filters.maxDistance !== undefined ||
    filters.startDate ||
    filters.endDate ||
    filters.search
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Stats overview */}
        <StatsBar />

        {/* Search */}
        <SearchBar value={filters.search || ''} onChange={handleSearchChange} />

        {/* Filters */}
        <Filters
          filters={filters}
          onChange={handleFiltersChange}
          totalCount={data?.pagination?.total}
        />

        {/* Activity list */}
        <ActivityList
          activities={data?.activities}
          pagination={data?.pagination}
          onPageChange={handlePageChange}
          isLoading={isLoading}
          isFetching={isFetching}
          hasFilters={hasFilters}
        />
      </main>
    </div>
  );
}

// Simple usePrevious hook
function usePrevious(value) {
  const [prev, setPrev] = useState(undefined);
  useEffect(() => {
    setPrev(value);
  }, [value]);
  return prev;
}
