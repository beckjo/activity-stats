import { useState } from 'react';
import { format } from 'date-fns';
import Header from '../components/Header';
import PeriodSelector from '../components/compare/PeriodSelector';
import StatComparison from '../components/compare/StatComparison';
import VolumeChart from '../components/compare/VolumeChart';
import SportTypeChart from '../components/compare/SportTypeChart';
import { useCompare } from '../hooks/useCompare';

const VOLUME_METRICS = [
  { value: 'distance', label: 'Distance' },
  { value: 'count', label: 'Activities' },
  { value: 'elevation', label: 'Elevation' },
];

const TYPE_METRICS = [
  { value: 'count', label: 'By count' },
  { value: 'distance', label: 'By distance' },
];

function periodLabel(start, end) {
  if (!start || !end) return '—';
  try {
    return `${format(new Date(start), 'MMM d')} – ${format(new Date(end), 'MMM d, yyyy')}`;
  } catch {
    return '—';
  }
}

function ChartCard({ title, children, controls, controlValue, onControl }) {
  return (
    <div className="card p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-gray-800 text-sm">{title}</h3>
        {controls && (
          <div className="flex gap-1">
            {controls.map((c) => (
              <button
                key={c.value}
                onClick={() => onControl(c.value)}
                className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all ${
                  controlValue === c.value
                    ? 'bg-strava-orange text-white'
                    : 'text-gray-500 hover:bg-gray-100'
                }`}
              >
                {c.label}
              </button>
            ))}
          </div>
        )}
      </div>
      {children}
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-4">
      {[280, 220, 220].map((h, i) => (
        <div key={i} className="card p-4">
          <div className="h-4 w-32 skeleton rounded mb-4" />
          <div className={`skeleton rounded`} style={{ height: h }} />
        </div>
      ))}
    </div>
  );
}

export default function ComparePage() {
  const [periods, setPeriods] = useState({});
  const [volumeMetric, setVolumeMetric] = useState('distance');
  const [typeMetric, setTypeMetric] = useState('count');

  const { data, isLoading, isFetching } = useCompare(
    periods.aStart ? { ...periods } : null
  );

  const labelA = periodLabel(periods.aStart, periods.aEnd);
  const labelB = periodLabel(periods.bStart, periods.bEnd);

  const ready = data && !isLoading;

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">

        <div>
          <h1 className="text-xl font-bold text-gray-900">Compare Periods</h1>
          <p className="text-sm text-gray-500 mt-0.5">Compare two time periods side by side</p>
        </div>

        <PeriodSelector value={periods} onChange={setPeriods} />

        {/* Loading */}
        {(isLoading || isFetching) && !ready && (
          <LoadingSkeleton />
        )}

        {/* Results */}
        {ready && (
          <div className={`space-y-4 transition-opacity ${isFetching ? 'opacity-60' : 'opacity-100'}`}>

            {/* Stats table */}
            <StatComparison
              periodA={data.periodA}
              periodB={data.periodB}
              labelA={labelA}
              labelB={labelB}
            />

            {/* Volume over time */}
            <ChartCard
              title="Volume over time"
              controls={VOLUME_METRICS}
              controlValue={volumeMetric}
              onControl={setVolumeMetric}
            >
              <div className="flex gap-4 mb-3">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-strava-orange" />
                  <span className="text-xs text-gray-500 truncate max-w-[140px]">{labelA}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                  <span className="text-xs text-gray-500 truncate max-w-[140px]">{labelB}</span>
                </div>
              </div>
              <VolumeChart
                timelineA={data.periodA.timeline}
                timelineB={data.periodB.timeline}
                metric={volumeMetric}
                labelA={labelA}
                labelB={labelB}
              />
            </ChartCard>

            {/* By sport type */}
            <ChartCard
              title="By activity type"
              controls={TYPE_METRICS}
              controlValue={typeMetric}
              onControl={setTypeMetric}
            >
              <SportTypeChart
                byTypeA={data.periodA.byType}
                byTypeB={data.periodB.byType}
                metric={typeMetric}
                labelA={labelA}
                labelB={labelB}
              />
            </ChartCard>

          </div>
        )}

        {/* Empty state */}
        {!isLoading && !data && periods.aStart && (
          <div className="card p-10 text-center text-gray-400 text-sm">
            No data found for the selected periods.
          </div>
        )}

      </main>
    </div>
  );
}
