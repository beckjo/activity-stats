import { useActivityStats } from '../hooks/useActivities';

function StatCard({ icon, label, value, sub }) {
  return (
    <div className="card px-5 py-4 flex items-center gap-3">
      <span className="text-2xl">{icon}</span>
      <div>
        <div className="text-xs text-gray-500 font-medium uppercase tracking-wide">{label}</div>
        <div className="text-lg font-bold text-gray-900 leading-tight">{value}</div>
        {sub && <div className="text-xs text-gray-400">{sub}</div>}
      </div>
    </div>
  );
}

function StatCardSkeleton() {
  return (
    <div className="card px-5 py-4 flex items-center gap-3">
      <div className="w-8 h-8 skeleton rounded" />
      <div className="space-y-1">
        <div className="w-16 h-3 skeleton rounded" />
        <div className="w-24 h-5 skeleton rounded" />
      </div>
    </div>
  );
}

export default function StatsBar() {
  const { data: stats, isLoading } = useActivityStats();

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {Array.from({ length: 4 }).map((_, i) => <StatCardSkeleton key={i} />)}
      </div>
    );
  }

  if (!stats) return null;

  const totalDistKm = (stats.totals.distance / 1000).toFixed(0);
  const totalHours = Math.round(stats.totals.movingTime / 3600);
  const totalElevM = Math.round(stats.totals.elevationGain);
  const topType = stats.sportTypes[0];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      <StatCard
        icon="🏅"
        label="Total Activities"
        value={stats.totalActivities.toLocaleString()}
        sub={topType ? `Mostly ${topType.type}` : undefined}
      />
      <StatCard
        icon="📏"
        label="Total Distance"
        value={`${Number(totalDistKm).toLocaleString()} km`}
      />
      <StatCard
        icon="⏱️"
        label="Moving Time"
        value={`${totalHours.toLocaleString()} hrs`}
      />
      <StatCard
        icon="⛰️"
        label="Elevation Gain"
        value={`${totalElevM.toLocaleString()} m`}
      />
    </div>
  );
}
