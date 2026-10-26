import { Platform } from 'react-native';
import * as Location from 'expo-location';
import { DEMO } from './api';

export type Place = { lat: number; lng: number; city: string };

/**
 * Gets an approximate position (we only ever store it rounded to ~1km) and a "City, ST" label.
 * Reverse geocoding uses the platform's own geocoder, so no third-party key is needed.
 */
export async function locateMe(): Promise<Place> {
  // The demo has no real neighbours, so it always places you in Mahwah, NJ next to the seeded people.
  if (DEMO) return { lat: 41.09, lng: -74.15, city: 'Mahwah, NJ' };
  const { status } = await Location.requestForegroundPermissionsAsync();
  if (status !== 'granted') throw new Error('Location permission was declined. You can type your city instead.');
  const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Low });
  const { latitude: lat, longitude: lng } = pos.coords;
  let city = '';
  if (Platform.OS !== 'web') {
    try {
      const [place] = await Location.reverseGeocodeAsync({ latitude: lat, longitude: lng });
      if (place) city = [place.city ?? place.subregion, place.region].filter(Boolean).join(', ');
    } catch {}
  }
  return { lat, lng, city };
}

let lastSent: { lat: number; lng: number; at: number } | null = null;
const kmBetween = (a: { lat: number; lng: number }, b: { lat: number; lng: number }) =>
  Math.hypot(a.lat - b.lat, (a.lng - b.lng) * Math.cos((a.lat * Math.PI) / 180)) * 111;

/**
 * Where you are right now, for keeping distances current. Never shows a permission prompt (it only
 * runs if you already allowed location) and skips the update when you haven't moved about a kilometre.
 */
export async function currentPlaceIfMoved(): Promise<Place | null> {
  if (DEMO) return null;
  const { status } = await Location.getForegroundPermissionsAsync();
  if (status !== 'granted') return null;
  if (lastSent && Date.now() - lastSent.at < 10 * 60_000) return null;
  const pos = (await Location.getLastKnownPositionAsync({ maxAge: 10 * 60_000 })) ?? (await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Low }));
  const here = { lat: pos.coords.latitude, lng: pos.coords.longitude };
  if (lastSent && kmBetween(lastSent, here) < 1) {
    lastSent = { ...lastSent, at: Date.now() };
    return null;
  }
  lastSent = { ...here, at: Date.now() };
  let city = '';
  if (Platform.OS !== 'web') {
    try {
      const [place] = await Location.reverseGeocodeAsync({ latitude: here.lat, longitude: here.lng });
      if (place) city = [place.city ?? place.subregion, place.region].filter(Boolean).join(', ');
    } catch {}
  }
  return { ...here, city };
}
