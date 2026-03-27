import { format } from 'date-fns';

// ── Formatters ─────────────────────────────────────────────────────────────────

function formatDistance(meters) {
  if (meters === 0) return '—';
  if (meters >= 1000) return `${(meters / 1000).toFixed(2)} km`;
  return `${Math.round(meters)} m`;
}

function formatDuration(seconds) {
  if (!seconds) return '—';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

function formatPace(meters, seconds) {
  if (!meters || !seconds) return null;
  const pace = seconds / (meters / 1000); // sec/km
  const paceMin = Math.floor(pace / 60);
  const paceSec = Math.round(pace % 60);
  return `${paceMin}:${String(paceSec).padStart(2, '0')} /km`;
}

function formatSpeed(mps) {
  if (!mps) return null;
  return `${(mps * 3.6).toFixed(1)} km/h`;
}

function formatElevation(meters) {
  if (!meters) return null;
  return `${Math.round(meters)} m`;
}

// ── Sport type config ─────────────────────────────────────────────────────────

const SPORT_CONFIG = {
  Run: { color: 'bg-green-100 text-green-800', icon: '🏃' },
  Ride: { color: 'bg-blue-100 text-blue-800', icon: '🚴' },
  Swim: { color: 'bg-cyan-100 text-cyan-800', icon: '🏊' },
  Walk: { color: 'bg-yellow-100 text-yellow-800', icon: '🚶' },
  Hike: { color: 'bg-lime-100 text-lime-800', icon: '🥾' },
  GravelRide: { color: 'bg-amber-100 text-amber-800', icon: '🚵🏼' },
  VirtualRide: { color: 'bg-purple-100 text-purple-800', icon: '🖥️' },
  VirtualRun: { color: 'bg-teal-100 text-teal-800', icon: '🖥️' },
  TrailRun: { color: 'bg-emerald-100 text-emerald-800', icon: '🏃🏼‍♂️' },
  Workout: { color: 'bg-red-100 text-red-800', icon: '💪' },
  WeightTraining: { color: 'bg-red-100 text-red-800', icon: '🏋️' },
  Yoga: { color: 'bg-pink-100 text-pink-800', icon: '🧘' },
  Kayaking: { color: 'bg-blue-100 text-blue-800', icon: '🛶' },
  default: { color: 'bg-gray-100 text-gray-700', icon: '🏅' },
};

function getSportConfig(type) {
  return SPORT_CONFIG[type] || SPORT_CONFIG.default;
}

// ── Stat tile ─────────────────────────────────────────────────────────────────

function Stat({ label, value }) {
  if (!value) return null;
  return (
    <div className="text-center">
      <div className="text-sm font-semibold text-gray-900">{value}</div>
      <div className="text-[10px] text-gray-400 uppercase tracking-wide mt-0.5">{label}</div>
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────

const POWER_SPORT_TYPES = new Set(['Ride', 'GravelRide', 'VirtualRide', 'MountainBikeRide', 'Velomobile']);

export default function ActivityCard({ activity }) {
  const sport = getSportConfig(activity.sportType);
  const isRun = activity.sportType?.toLowerCase().includes('run');
  const isRide = activity.sportType?.toLowerCase().includes('ride');
  const showPower = POWER_SPORT_TYPES.has(activity.sportType);

  const speedOrPace = isRun
    ? formatPace(activity.distance, activity.movingTime)
    : isRide
    ? formatSpeed(activity.averageSpeed)
    : formatSpeed(activity.averageSpeed);

  return (
    <div className="card p-4 hover:shadow-md transition-shadow duration-200 group">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-start gap-3 min-w-0">
          <span className="text-2xl flex-shrink-0 mt-0.5">{sport.icon}</span>
          <div className="min-w-0">
            <a
              href={`https://www.strava.com/activities/${activity.stravaId}`}
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-gray-900 leading-tight truncate group-hover:text-strava-orange transition-colors hover:underline"
            >
              {activity.name}
            </a>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              <span className={`badge ${sport.color}`}>{activity.sportType}</span>
              <span className="text-xs text-gray-400">
                {format(new Date(activity.startDateLocal), 'EEE, MMM d, yyyy')}
              </span>
            </div>
          </div>
        </div>
        {activity.kudosCount > 0 && (
          <div className="flex items-center gap-1 text-xs text-gray-400 flex-shrink-0">
            <span>👍</span>
            <span>{activity.kudosCount}</span>
          </div>
        )}
      </div>

      {/* Description */}
      {activity.description && (
        <p className="text-sm text-gray-500 mb-3 line-clamp-2 leading-relaxed">
          {activity.description}
        </p>
      )}

      {/* Stats grid */}
      <div className="grid grid-cols-4 gap-2 py-3 border-t border-gray-100">
        <Stat label="Distance" value={formatDistance(activity.distance)} />
        <Stat label="Time" value={formatDuration(activity.movingTime)} />
        <Stat label={isRun ? 'Pace' : 'Speed'} value={speedOrPace} />
        <Stat label="Elevation" value={formatElevation(activity.totalElevationGain)} />
      </div>

      {/* Secondary stats */}
      {(activity.averageHeartrate || activity.averageWatts || activity.normalizedPower || activity.calories) && (
        <div className="flex gap-4 pt-2 flex-wrap">
          {activity.averageHeartrate && (
            <span className="text-xs text-gray-500">
              ❤️ {Math.round(activity.averageHeartrate)} bpm avg
            </span>
          )}
          {showPower && activity.averageWatts && (
            <span className="text-xs text-gray-500">⚡ {Math.round(activity.averageWatts)}W avg</span>
          )}
          {showPower && activity.normalizedPower && (
            <span className="text-xs font-medium text-gray-700" title="Normalized Power">
              ⚡ {Math.round(activity.normalizedPower)}W NP
            </span>
          )}
          {activity.calories && (
            <span className="text-xs text-gray-500">🔥 {Math.round(activity.calories)} cal</span>
          )}
        </div>
      )}
    </div>
  );
}
