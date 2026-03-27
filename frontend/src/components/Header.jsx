import { NavLink } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useSyncStatus, useStartSync } from '../hooks/useActivities';
import { useQueryClient } from '@tanstack/react-query';

function SyncBanner({ syncStatus, activityCount, onSync }) {
  if (syncStatus === 'syncing') {
    return (
      <div className="bg-blue-50 border-b border-blue-100 px-4 py-2">
        <div className="max-w-7xl mx-auto flex items-center gap-2 text-sm text-blue-700">
          <div className="w-3.5 h-3.5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin flex-shrink-0" />
          <span>Syncing your Strava activities... {activityCount > 0 && `(${activityCount.toLocaleString()} fetched so far)`}</span>
        </div>
      </div>
    );
  }

  if (syncStatus === 'error') {
    return (
      <div className="bg-red-50 border-b border-red-100 px-4 py-2">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4 text-sm">
          <span className="text-red-700">Sync failed. Some activities may be missing.</span>
          <button onClick={onSync} className="text-red-600 font-medium hover:underline">Retry</button>
        </div>
      </div>
    );
  }

  return null;
}

export default function Header() {
  const { user, logout } = useAuth();
  const { data: syncData } = useSyncStatus();
  const startSync = useStartSync();
  const queryClient = useQueryClient();

  const handleSync = async () => {
    await startSync();
    // Refresh activities after sync completes
    queryClient.invalidateQueries({ queryKey: ['activities'] });
  };

  const initials = user
    ? `${user.firstName?.[0] || ''}${user.lastName?.[0] || ''}`.toUpperCase() || '?'
    : '?';

  return (
    <>
      <SyncBanner
        syncStatus={syncData?.syncStatus}
        activityCount={syncData?.activityCount}
        onSync={handleSync}
      />
      <header className="bg-white border-b border-gray-200 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-strava-orange rounded-lg flex items-center justify-center">
                <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
              <span className="font-bold text-gray-900">Activity Stats</span>
            <nav className="hidden sm:flex items-center gap-1 ml-4">
              <NavLink
                to="/dashboard"
                className={({ isActive }) =>
                  `px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${isActive ? 'bg-gray-100 text-gray-900' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-700'}`
                }
              >
                Activities
              </NavLink>
              <NavLink
                to="/compare"
                className={({ isActive }) =>
                  `px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${isActive ? 'bg-gray-100 text-gray-900' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-700'}`
                }
              >
                Compare
              </NavLink>
            </nav>
            </div>

            {/* Right side */}
            <div className="flex items-center gap-3">
              {syncData?.syncStatus !== 'syncing' && (
                <button
                  onClick={handleSync}
                  title="Re-sync from Strava"
                  className="btn-ghost text-xs hidden sm:flex"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Sync
                </button>
              )}

              {/* User menu */}
              <div className="flex items-center gap-2">
                {user?.profilePicture ? (
                  <img
                    src={user.profilePicture}
                    alt={`${user.firstName} ${user.lastName}`}
                    className="w-8 h-8 rounded-full object-cover ring-2 ring-gray-200"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-strava-orange text-white flex items-center justify-center text-xs font-bold">
                    {initials}
                  </div>
                )}
                <span className="text-sm font-medium text-gray-700 hidden sm:block">
                  {user?.firstName} {user?.lastName}
                </span>
                <button
                  onClick={logout}
                  className="btn-ghost text-xs ml-1"
                  title="Sign out"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  <span className="hidden sm:inline">Sign out</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>
    </>
  );
}
