import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';

const COLOR_A = '#FC4C02';
const COLOR_B = '#3b82f6';

function buildData(byTypeA, byTypeB) {
  const types = new Set([...byTypeA.map((t) => t.type), ...byTypeB.map((t) => t.type)]);
  const mapA = Object.fromEntries(byTypeA.map((t) => [t.type, t]));
  const mapB = Object.fromEntries(byTypeB.map((t) => [t.type, t]));

  return [...types].map((type) => ({
    type,
    countA: mapA[type]?.count ?? 0,
    countB: mapB[type]?.count ?? 0,
    distA: +((mapA[type]?.distance ?? 0) / 1000).toFixed(1),
    distB: +((mapB[type]?.distance ?? 0) / 1000).toFixed(1),
  })).sort((a, b) => (b.countA + b.countB) - (a.countA + a.countB));
}

export default function SportTypeChart({ byTypeA, byTypeB, labelA = 'A', labelB = 'B', metric = 'count' }) {
  const data = buildData(byTypeA, byTypeB);
  const keyA = metric === 'count' ? 'countA' : 'distA';
  const keyB = metric === 'count' ? 'countB' : 'distB';
  const unit = metric === 'count' ? '' : ' km';

  if (data.length === 0) return <p className="text-sm text-gray-400 text-center py-8">No data</p>;

  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data} layout="vertical" margin={{ top: 0, right: 4, left: 60, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" horizontal={false} />
        <XAxis type="number" tick={{ fontSize: 11, fill: '#9ca3af' }} tickLine={false} axisLine={false} />
        <YAxis dataKey="type" type="category" tick={{ fontSize: 11, fill: '#6b7280' }} tickLine={false} axisLine={false} width={58} />
        <Tooltip
          formatter={(v, name) => [`${v}${unit}`, name]}
          contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e5e7eb' }}
        />
        <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12 }} />
        <Bar dataKey={keyA} name={labelA} fill={COLOR_A} radius={[0, 3, 3, 0]} maxBarSize={18} unit={unit} />
        <Bar dataKey={keyB} name={labelB} fill={COLOR_B} radius={[0, 3, 3, 0]} maxBarSize={18} unit={unit} opacity={0.75} />
      </BarChart>
    </ResponsiveContainer>
  );
}
