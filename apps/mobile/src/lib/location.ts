import { Platform } from 'react-native';
import * as Location from 'expo-location';

export type Place = { lat: number; lng: number; city: string };

/**
 * Gets an approximate position (we only ever store it rounded to ~1km) and a "City, ST" label.
 * Reverse geocoding uses the platform's own geocoder, so no third-party key is needed.
 */
export async function locateMe(): Promise<Place> {
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
