import { useState, useCallback } from 'react';
import { useActivityTypes } from '../hooks/useActivities';
import { ACTIVITY_GROUPS, getActiveGroup } from '../utils/activityGroups';

const SORT_OPTIONS = [
  { value: 'startDate:desc', label: 'Date (newest)' },
  { value: 'startDate:asc', label: 'Date (oldest)' },
  { value: 'distance:desc', label: 'Distance (longest)' },
  { value: 'distance:asc', label: 'Distance (shortest)' },
  { value: 'movingTime:desc', label: 'Duration (longest)' },
  { value: 'movingTime:asc', label: 'Duration (shortest)' },
  { value: 'totalElevationGain:desc', label: 'Elevation (most)' },
];

// Distance presets in meters
const DISTANCE_PRESETS = [
  { label: 'Any', min: undefined, max: undefined },
  { label: '< 5km', min: undefined, max: 5000 },
  { label: '5–10km', min: 5000, max: 10000 },
  { label: '10–25km', min: 10000, max: 25000 },
  { label: '25–50km', min: 25000, max: 50000 },
  { label: '50–100km', min: 50000, max: 100000 },
  { label: '> 100km', min: 100000, max: undefined },
];

export default function Filters({ filters, onChange, totalCount }) {
  const { data: typesData } = useActivityTypes();
  const types = typesData?.types || [];
  const [isExpanded, setIsExpanded] = useState(false);

  const update = useCallback(
    (key, value) => {
      onChange({ ...filters, [key]: value, page: 1 });
    },
    [filters, onChange]
  );

  const resetFilters = () => {
    onChange({ page: 1, limit: 20, sortBy: 'startDate', sortOrder: 'desc' });
  };

  const selectedTypes = filters.types ? filters.types.split(',') : filters.type ? [filters.type] : [];

  function setTypeFilter(types) {
    const { type: _t, types: _ts, ...rest } = filters;
    if (types.length === 0) onChange({ ...rest, page: 1 });
    else if (types.length === 1) onChange({ ...rest, type: types[0], page: 1 });
    else onChange({ ...rest, types: types.join(','), page: 1 });
  }

  function toggleType(t) {
    const next = selectedTypes.includes(t)
      ? selectedTypes.filter((x) => x !== t)
      : [...selectedTypes, t];
    setTypeFilter(next);
  }

  function toggleGroup(group) {
    const isActive = getActiveGroup(selectedTypes)?.label === group.label;
    setTypeFilter(isActive ? [] : group.types);
  }

  const hasActiveFilters =
    selectedTypes.length > 0 ||
    filters.minDistance !== undefined ||
    filters.maxDistance !== undefined ||
    filters.minDuration !== undefined ||
    filters.maxDuration !== undefined ||
    filters.startDate ||
    filters.endDate;

  const sortValue = `${filters.sortBy || 'startDate'}:${filters.sortOrder || 'desc'}`;

  return (
    <div className="card p-4 space-y-4">
      {/* Top row: type + sort + expand */}
      <div className="flex flex-wrap gap-3 items-center">
        {/* Group shortcuts */}
        {ACTIVITY_GROUPS.map((group) => {
          const isActive = getActiveGroup(selectedTypes)?.label === group.label;
          return (
            <button
              key={group.label}
              onClick={() => toggleGroup(group)}
              className={`btn text-xs px-3 py-1.5 rounded-full border transition-all ${
                isActive
                  ? 'bg-gray-800 text-white border-gray-800'
                  : 'bg-white text-gray-700 border-gray-300 hover:border-gray-500'
              }`}
            >
              {group.label}
            </button>
          );
        })}

        {/* Individual type select — still available for single-type */}
        <div className="flex-1 min-w-[140px] max-w-[200px]">
          <select
            className="select"
            value={selectedTypes.length === 1 ? selectedTypes[0] : ''}
            onChange={(e) => setTypeFilter(e.target.value ? [e.target.value] : [])}
          >
            <option value="">All types</option>
            {types.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>

        {/* Sort */}
        <div className="flex-1 min-w-[160px] max-w-[220px]">
          <select
            className="select"
            value={sortValue}
            onChange={(e) => {
              const [sortBy, sortOrder] = e.target.value.split(':');
              onChange({ ...filters, sortBy, sortOrder, page: 1 });
            }}
          >
            {SORT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2 ml-auto">
          {totalCount !== undefined && (
            <span className="text-sm text-gray-500">
              {totalCount.toLocaleString()} {totalCount === 1 ? 'activity' : 'activities'}
            </span>
          )}

          <button
            onClick={() => setIsExpanded((v) => !v)}
            className={`btn-secondary text-xs gap-1.5 ${hasActiveFilters ? 'ring-2 ring-strava-orange ring-offset-1' : ''}`}
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M3 4a1 1 0 011-1h16a1 1 0 010 2H4a1 1 0 01-1-1zm3 5a1 1 0 011-1h10a1 1 0 010 2H7a1 1 0 01-1-1zm4 5a1 1 0 011-1h4a1 1 0 010 2h-4a1 1 0 01-1-1z" />
            </svg>
            Filters
            {hasActiveFilters && (
              <span className="w-1.5 h-1.5 bg-strava-orange rounded-full" />
            )}
          </button>

          {hasActiveFilters && (
            <button onClick={resetFilters} className="btn-ghost text-xs text-red-500 hover:text-red-600 hover:bg-red-50">
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Expanded filters */}
      {isExpanded && (
        <div className="border-t border-gray-100 pt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Distance */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-2">Distance</label>
            <div className="flex flex-wrap gap-1.5">
              {DISTANCE_PRESETS.map((p) => {
                const isActive =
                  p.min === filters.minDistance && p.max === filters.maxDistance;
                return (
                  <button
                    key={p.label}
                    onClick={() =>
                      onChange({
                        ...filters,
                        minDistance: p.min,
                        maxDistance: p.max,
                        page: 1,
                      })
                    }
                    className={`px-2.5 py-1 rounded-full text-xs font-medium border transition-all ${
                      isActive
                        ? 'bg-strava-orange text-white border-strava-orange'
                        : 'bg-white text-gray-600 border-gray-300 hover:border-strava-orange hover:text-strava-orange'
                    }`}
                  >
                    {p.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Date range */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-2">Date range</label>
            <div className="flex gap-2">
              <input
                type="date"
                className="input text-xs"
                value={filters.startDate || ''}
                onChange={(e) => update('startDate', e.target.value || undefined)}
              />
              <input
                type="date"
                className="input text-xs"
                value={filters.endDate || ''}
                onChange={(e) => update('endDate', e.target.value || undefined)}
              />
            </div>
          </div>

          {/* Duration */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-2">Duration (minutes)</label>
            <div className="flex gap-2 items-center">
              <input
                type="number"
                placeholder="Min"
                className="input text-xs"
                value={filters.minDuration !== undefined ? Math.round(filters.minDuration / 60) : ''}
                onChange={(e) =>
                  update('minDuration', e.target.value ? parseInt(e.target.value, 10) * 60 : undefined)
                }
              />
              <span className="text-gray-400 text-sm">—</span>
              <input
                type="number"
                placeholder="Max"
                className="input text-xs"
                value={filters.maxDuration !== undefined ? Math.round(filters.maxDuration / 60) : ''}
                onChange={(e) =>
                  update('maxDuration', e.target.value ? parseInt(e.target.value, 10) * 60 : undefined)
                }
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
