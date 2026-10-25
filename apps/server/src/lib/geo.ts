const EARTH_RADIUS_MI = 3958.8;
const rad = (deg: number) => (deg * Math.PI) / 180;

/** Great-circle distance in miles between two coordinates. */
export function distanceMiles(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  const dLat = rad(b.lat - a.lat);
  const dLng = rad(b.lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS_MI * Math.asin(Math.min(1, Math.sqrt(h)));
}

/** Rounds coordinates to ~1km so exact home locations are never stored or shared. */
export const coarsen = (value: number) => Math.round(value * 100) / 100;

/** "3 mi away" style label. Never more precise than a mile. */
export function distanceLabel(miles: number) {
  if (miles < 1) return 'Under a mile away';
  return `${Math.round(miles)} mi away`;
}
