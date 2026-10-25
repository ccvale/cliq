import { Platform } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';

const MAX_WIDTH = 1080;

/**
 * Lets the person pick (or take) a photo, crops it to the card's shape on device, then shrinks and
 * re-encodes it as JPEG. Re-encoding also drops EXIF data such as GPS coordinates before upload.
 * Resolves to null if they cancel.
 */
export async function pickPhoto(source: 'library' | 'camera'): Promise<Blob | null> {
  const options: ImagePicker.ImagePickerOptions = { mediaTypes: ['images'], allowsEditing: true, aspect: [4, 5], quality: 1 };
  if (source === 'camera') {
    const { granted } = await ImagePicker.requestCameraPermissionsAsync();
    if (!granted) throw new Error('Allow camera access in Settings to take a photo.');
  }
  const result = source === 'camera' ? await ImagePicker.launchCameraAsync(options) : await ImagePicker.launchImageLibraryAsync(options);
  const asset = result.canceled ? null : result.assets[0];
  if (!asset) return null;

  const context = ImageManipulator.manipulate(asset.uri);
  if (asset.width > MAX_WIDTH) context.resize({ width: MAX_WIDTH });
  const image = await context.renderAsync();
  const saved = await image.saveAsync({ format: SaveFormat.JPEG, compress: 0.82 });
  const blob = await (await fetch(saved.uri)).blob();
  // React Native's fetch reports an empty type for local files.
  return Platform.OS === 'web' || blob.type ? blob : new Blob([blob], { type: 'image/jpeg' });
}
