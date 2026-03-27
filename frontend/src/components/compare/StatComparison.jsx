function delta(a, b) {
  if (!b || b === 0) return null;
  return ((a - b) / b) * 100;
}

function DeltaBadge({ pct, isGood }) {
  if (pct === null) return null;
  return (
    <span className={`text-xs font-medium px-1.5 py-0.5 rounded-full ${isGood ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
      {pct >= 0 ? '+' : ''}{pct.toFixed(1)}%
    </span>
  );
}

function Row({ label, a, b, format, higherIsBetter = true }) {
  const aVal = a ?? 0;
  const bVal = b ?? 0;
  const pct = delta(aVal, bVal);
  // always show the real %, color based on whether the direction is good
  const isGood = pct === null ? null : higherIsBetter ? pct >= 0 : pct <= 0;

  return (
    <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 py-3 border-b border-gray-100 last:border-0">
      <div className="text-right">
        <span className="font-semibold text-gray-900">{format(aVal)}</span>
      </div>
      <div className="flex flex-col items-center gap-0.5 min-w-[120px]">
        <span className="text-xs text-gray-400 font-medium text-center leading-tight">{label}</span>
        <DeltaBadge pct={pct} isGood={isGood} />
      </div>
      <div className="text-left">
        <span className="font-semibold text-gray-500">{format(bVal)}</span>
      </div>
    </div>
  );
}

function fmt(n, decimals = 0) {
  return Number(n).toLocaleString('de-CH', { maximumFractionDigits: decimals });
}

export default function StatComparison({ periodA, periodB, labelA = 'Period A', labelB = 'Period B' }) {
  const a = periodA.stats;
  const b = periodB.stats;

  const hasWatts = a.avgWatts || b.avgWatts || a.avgNormalizedPower || b.avgNormalizedPower;

  return (
    <div className="card overflow-hidden">
      {/* Header */}
      <div className="grid grid-cols-[1fr_auto_1fr] bg-gray-50 border-b border-gray-200 px-4 py-3">
        <div className="text-right flex items-center justify-end gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-strava-orange" />
          <span className="font-semibold text-sm text-gray-900">{labelA}</span>
        </div>
        <div className="min-w-[120px]" />
        <div className="text-left flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
          <span className="font-semibold text-sm text-gray-500">{labelB}</span>
        </div>
      </div>

      <div className="px-4">
        <Row label="Activities" a={a.totalActivities} b={b.totalActivities} format={(v) => fmt(v)} />
        <Row label="Total Distance" a={a.totalDistance / 1000} b={b.totalDistance / 1000} format={(v) => `${fmt(v, 1)} km`} />
        <Row label="Moving Time" a={a.totalMovingTime / 3600} b={b.totalMovingTime / 3600} format={(v) => `${fmt(v, 1)} h`} />
        <Row label="Elevation Gain" a={a.totalElevation} b={b.totalElevation} format={(v) => `${fmt(v)} m`} />
        <Row label="Avg Distance" a={a.avgDistance / 1000} b={b.avgDistance / 1000} format={(v) => `${fmt(v, 1)} km`} />
        <Row label="Avg Duration" a={a.avgMovingTime / 60} b={b.avgMovingTime / 60} format={(v) => `${fmt(v, 0)} min`} />
        {(a.avgHeartrate || b.avgHeartrate) && (
          <Row label="Avg Heart Rate" a={a.avgHeartrate} b={b.avgHeartrate} format={(v) => v ? `${fmt(v, 0)} bpm` : '—'} higherIsBetter={false} />
        )}
        {hasWatts && (
          <>
            {(a.avgWatts || b.avgWatts) && (
              <Row label="Avg Watts" a={a.avgWatts} b={b.avgWatts} format={(v) => v ? `${fmt(v, 0)} W` : '—'} />
            )}
            {(a.avgNormalizedPower || b.avgNormalizedPower) && (
              <Row label="Avg NP" a={a.avgNormalizedPower} b={b.avgNormalizedPower} format={(v) => v ? `${fmt(v, 0)} W` : '—'} />
            )}
          </>
        )}
        {(a.totalCalories || b.totalCalories) && (
          <Row label="Total Calories" a={a.totalCalories} b={b.totalCalories} format={(v) => v ? `${fmt(v, 0)} kcal` : '—'} />
        )}
      </div>
    </div>
  );
}
