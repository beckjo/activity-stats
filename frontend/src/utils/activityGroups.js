export const ACTIVITY_GROUPS = [
  {
    label: '🚴 All Rides',
    types: ['Ride', 'GravelRide', 'VirtualRide', 'MountainBikeRide', 'EMountainBikeRide', 'EBikeRide', 'Velomobile', 'Handcycle'],
  },
  {
    label: '🏃 All Runs',
    types: ['Run', 'TrailRun', 'VirtualRun', 'Race'],
  },
];

/**
 * Returns the group whose types exactly match the current selection, or null.
 */
export function getActiveGroup(selectedTypes) {
  if (!selectedTypes?.length) return null;
  const set = new Set(selectedTypes);
  return ACTIVITY_GROUPS.find(
    (g) => g.types.length === set.size && g.types.every((t) => set.has(t))
  ) ?? null;
}
