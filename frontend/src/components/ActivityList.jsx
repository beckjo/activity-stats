import ActivityCard from './ActivityCard';
import Pagination from './Pagination';

function SkeletonCard() {
  return (
    <div className="card p-4 space-y-3">
      <div className="flex items-start gap-3">
        <div className="w-8 h-8 skeleton rounded-lg" />
        <div className="flex-1 space-y-2">
          <div className="h-4 skeleton rounded w-48" />
          <div className="h-3 skeleton rounded w-32" />
        </div>
      </div>
      <div className="grid grid-cols-4 gap-2 pt-3 border-t border-gray-100">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="space-y-1">
            <div className="h-4 skeleton rounded mx-auto w-12" />
            <div className="h-3 skeleton rounded mx-auto w-8" />
          </div>
        ))}
      </div>
    </div>
  );
}

function EmptyState({ hasFilters }) {
  return (
    <div className="text-center py-16 px-4">
      <div className="text-4xl mb-3">{hasFilters ? '🔍' : '🏃'}</div>
      <h3 className="text-lg font-semibold text-gray-700 mb-1">
        {hasFilters ? 'No activities match your filters' : 'No activities yet'}
      </h3>
      <p className="text-gray-400 text-sm">
        {hasFilters
          ? 'Try adjusting or clearing your filters.'
          : 'Your Strava activities will appear here once the sync completes.'}
      </p>
    </div>
  );
}

export default function ActivityList({ activities, pagination, onPageChange, isLoading, isFetching, hasFilters }) {
  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => <SkeletonCard key={i} />)}
      </div>
    );
  }

  if (!activities || activities.length === 0) {
    return <EmptyState hasFilters={hasFilters} />;
  }

  return (
    <div>
      {/* Subtle loading overlay when fetching new page/filters */}
      <div className={`space-y-3 transition-opacity duration-200 ${isFetching && !isLoading ? 'opacity-60' : 'opacity-100'}`}>
        {activities.map((activity) => (
          <ActivityCard key={activity.id} activity={activity} />
        ))}
      </div>

      <Pagination pagination={pagination} onPageChange={onPageChange} />
    </div>
  );
}
