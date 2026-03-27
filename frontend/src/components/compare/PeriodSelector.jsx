import { useState, useEffect } from 'react';
import { format, subDays, subMonths, startOfMonth, endOfMonth, startOfYear, endOfYear, subYears } from 'date-fns';
import { useActivityTypes } from '../../hooks/useActivities';
import { ACTIVITY_GROUPS, getActiveGroup } from '../../utils/activityGroups';

const fmt = (d) => format(d, 'yyyy-MM-dd');
const today = () => new Date();

const PRESETS = [
  {
    label: 'Last 7 days vs. prev. 7 days',
    a: () => ({ start: fmt(subDays(today(), 6)), end: fmt(today()) }),
    b: () => ({ start: fmt(subDays(today(), 13)), end: fmt(subDays(today(), 7)) }),
  },
  {
    label: 'Last 30 days vs. prev. 30 days',
    a: () => ({ start: fmt(subDays(today(), 29)), end: fmt(today()) }),
    b: () => ({ start: fmt(subDays(today(), 59)), end: fmt(subDays(today(), 30)) }),
  },
  {
    label: 'Last 90 days vs. prev. 90 days',
    a: () => ({ start: fmt(subDays(today(), 89)), end: fmt(today()) }),
    b: () => ({ start: fmt(subDays(today(), 179)), end: fmt(subDays(today(), 90)) }),
  },
  {
    label: 'This month vs. last month',
    a: () => ({ start: fmt(startOfMonth(today())), end: fmt(endOfMonth(today())) }),
    b: () => {
      const lm = subMonths(today(), 1);
      return { start: fmt(startOfMonth(lm)), end: fmt(endOfMonth(lm)) };
    },
  },
  {
    label: 'This year vs. last year',
    a: () => ({ start: fmt(startOfYear(today())), end: fmt(endOfYear(today())) }),
    b: () => {
      const ly = subYears(today(), 1);
      return { start: fmt(startOfYear(ly)), end: fmt(endOfYear(ly)) };
    },
  },
];

export default function PeriodSelector({ value, onChange }) {
  const [preset, setPreset] = useState('0');
  const { data: typesData } = useActivityTypes();
  const availableTypes = typesData?.types || [];
  const selectedTypes = value.sportTypes || [];

  // Apply preset on mount
  useEffect(() => {
    applyPreset('0');
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  function applyPreset(idx) {
    setPreset(idx);
    if (idx === 'custom') return;
    const p = PRESETS[parseInt(idx, 10)];
    const a = p.a();
    const b = p.b();
    onChange({ ...value, aStart: a.start, aEnd: a.end, bStart: b.start, bEnd: b.end });
  }

  function toggleType(type) {
    const next = selectedTypes.includes(type)
      ? selectedTypes.filter((t) => t !== type)
      : [...selectedTypes, type];
    onChange({ ...value, sportTypes: next });
  }

  function toggleGroup(group) {
    const activeGroup = getActiveGroup(selectedTypes);
    const next = activeGroup?.label === group.label ? [] : group.types;
    onChange({ ...value, sportTypes: next });
  }

  return (
    <div className="card p-4 space-y-4">
      <div className="flex flex-wrap gap-3 items-end">
        {/* Preset selector */}
        <div className="flex-1 min-w-[220px]">
          <label className="block text-xs font-medium text-gray-500 mb-1">Preset</label>
          <select
            className="select"
            value={preset}
            onChange={(e) => applyPreset(e.target.value)}
          >
            {PRESETS.map((p, i) => (
              <option key={i} value={String(i)}>{p.label}</option>
            ))}
            <option value="custom">Custom…</option>
          </select>
        </div>

        {/* Group by */}
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Grouping</label>
          <select
            className="select w-32"
            value={value.groupBy || 'week'}
            onChange={(e) => onChange({ ...value, groupBy: e.target.value })}
          >
            <option value="week">Weekly</option>
            <option value="month">Monthly</option>
          </select>
        </div>
      </div>

      {/* Sport type filter */}
      {availableTypes.length > 0 && (
        <div className="border-t border-gray-100 pt-3">
          <label className="block text-xs font-medium text-gray-500 mb-2">
            Activity types
            {selectedTypes.length > 0 && (
              <button
                onClick={() => onChange({ ...value, sportTypes: [] })}
                className="ml-2 text-strava-orange hover:underline font-medium"
              >
                Clear
              </button>
            )}
          </label>
          <div className="flex flex-wrap gap-1.5">
            {/* Group shortcuts */}
            {ACTIVITY_GROUPS.map((group) => {
              const isActive = getActiveGroup(selectedTypes)?.label === group.label;
              return (
                <button
                  key={group.label}
                  onClick={() => toggleGroup(group)}
                  className={`px-2.5 py-1 rounded-full text-xs font-semibold border transition-all ${
                    isActive
                      ? 'bg-gray-800 text-white border-gray-800'
                      : 'bg-white text-gray-700 border-gray-400 hover:border-gray-600 hover:text-gray-900'
                  }`}
                >
                  {group.label}
                </button>
              );
            })}
            <span className="text-gray-300 text-xs self-center">|</span>
            {/* Individual types */}
            {availableTypes.map((type) => {
              const active = selectedTypes.includes(type);
              return (
                <button
                  key={type}
                  onClick={() => toggleType(type)}
                  className={`px-2.5 py-1 rounded-full text-xs font-medium border transition-all ${
                    active
                      ? 'bg-strava-orange text-white border-strava-orange'
                      : 'bg-white text-gray-600 border-gray-300 hover:border-strava-orange hover:text-strava-orange'
                  }`}
                >
                  {type}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Period inputs — always visible for fine-tuning */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <PeriodInput
          label="Period A"
          color="orange"
          start={value.aStart}
          end={value.aEnd}
          onStartChange={(v) => { setPreset('custom'); onChange({ ...value, aStart: v }); }}
          onEndChange={(v) => { setPreset('custom'); onChange({ ...value, aEnd: v }); }}
        />
        <PeriodInput
          label="Period B"
          color="blue"
          start={value.bStart}
          end={value.bEnd}
          onStartChange={(v) => { setPreset('custom'); onChange({ ...value, bStart: v }); }}
          onEndChange={(v) => { setPreset('custom'); onChange({ ...value, bEnd: v }); }}
        />
      </div>
    </div>
  );
}

function PeriodInput({ label, color, start, end, onStartChange, onEndChange }) {
  const dot = color === 'orange' ? 'bg-strava-orange' : 'bg-blue-500';
  return (
    <div>
      <div className="flex items-center gap-2 mb-1.5">
        <span className={`w-2.5 h-2.5 rounded-full ${dot}`} />
        <label className="text-xs font-semibold text-gray-700">{label}</label>
      </div>
      <div className="flex gap-2">
        <input type="date" className="input text-xs" value={start || ''} onChange={(e) => onStartChange(e.target.value)} />
        <input type="date" className="input text-xs" value={end || ''} onChange={(e) => onEndChange(e.target.value)} />
      </div>
    </div>
  );
}
