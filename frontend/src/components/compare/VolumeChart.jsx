import {
  ResponsiveContainer, ComposedChart, Bar, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
} from 'recharts';

const COLOR_A = '#FC4C02';
const COLOR_B = '#3b82f6';

function buildChartData(timelineA, timelineB) {
  const len = Math.max(timelineA.length, timelineB.length);
  return Array.from({ length: len }, (_, i) => ({
    label: (timelineA[i] || timelineB[i])?.label ?? `Wk ${i + 1}`,
    distA: timelineA[i] ? +(timelineA[i].distance / 1000).toFixed(2) : 0,
    distB: timelineB[i] ? +(timelineB[i].distance / 1000).toFixed(2) : 0,
    countA: timelineA[i]?.count ?? 0,
    countB: timelineB[i]?.count ?? 0,
    elevA: timelineA[i] ? Math.round(timelineA[i].elevation) : 0,
    elevB: timelineB[i] ? Math.round(timelineB[i].elevation) : 0,
  }));
}

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-3 text-xs space-y-1">
      <p className="font-semibold text-gray-700 mb-1.5">{label}</p>
      {payload.map((p) => (
        <div key={p.dataKey} className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: p.color }} />
          <span className="text-gray-600">{p.name}:</span>
          <span className="font-medium text-gray-900">{p.value}{p.unit}</span>
        </div>
      ))}
    </div>
  );
};

export default function VolumeChart({ timelineA, timelineB, metric = 'distance', labelA = 'A', labelB = 'B' }) {
  const data = buildChartData(timelineA, timelineB);

  const configs = {
    distance: { keyA: 'distA', keyB: 'distB', unit: ' km', label: 'Distance (km)' },
    count:    { keyA: 'countA', keyB: 'countB', unit: '', label: 'Activities' },
    elevation:{ keyA: 'elevA', keyB: 'elevB', unit: ' m', label: 'Elevation (m)' },
  };
  const cfg = configs[metric] || configs.distance;

  return (
    <ResponsiveContainer width="100%" height={260}>
      <ComposedChart data={data} margin={{ top: 4, right: 4, left: -10, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
        <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#9ca3af' }} tickLine={false} axisLine={false} />
        <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} tickLine={false} axisLine={false} />
        <Tooltip content={<CustomTooltip />} />
        <Legend
          iconType="circle"
          iconSize={8}
          wrapperStyle={{ fontSize: 12, paddingTop: 8 }}
          formatter={(v) => <span className="text-gray-600">{v}</span>}
        />
        <Bar dataKey={cfg.keyA} name={labelA} fill={COLOR_A} radius={[3, 3, 0, 0]} maxBarSize={40} unit={cfg.unit} />
        <Bar dataKey={cfg.keyB} name={labelB} fill={COLOR_B} radius={[3, 3, 0, 0]} maxBarSize={40} unit={cfg.unit} opacity={0.7} />
      </ComposedChart>
    </ResponsiveContainer>
  );
}
