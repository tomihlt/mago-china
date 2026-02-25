import * as FileSystem from 'expo-file-system/legacy';
import * as ImagePicker from 'expo-image-picker';

const IMAGE_DIR = `${FileSystem.documentDirectory}product_images/`;

async function ensureImageDirExists(): Promise<void> {
  const info = await FileSystem.getInfoAsync(IMAGE_DIR);
  if (!info.exists) {
    await FileSystem.makeDirectoryAsync(IMAGE_DIR, { intermediates: true });
  }
}

/**
 * Copies an image from a temporary URI to persistent app storage.
 * Returns the permanent URI.
 */
export async function saveImage(tempUri: string): Promise<string> {
  await ensureImageDirExists();
  const filename = `img_${Date.now()}_${Math.random().toString(36).slice(2)}.jpg`;
  const destUri = `${IMAGE_DIR}${filename}`;
  await FileSystem.copyAsync({ from: tempUri, to: destUri });
  return destUri;
}

/**
 * Deletes an image file from the filesystem.
 */
export async function deleteImage(uri: string): Promise<void> {
  try {
    const info = await FileSystem.getInfoAsync(uri);
    if (info.exists) {
      await FileSystem.deleteAsync(uri, { idempotent: true });
    }
  } catch {
    // Image deletion failures are non-critical
  }
}

/**
 * Opens the camera and returns the captured image URI, or null if cancelled.
 */
export async function getPhotoFromCamera(): Promise<string | null> {
  const { status } = await ImagePicker.requestCameraPermissionsAsync();
  if (status !== 'granted') {
    return null;
  }

  const result = await ImagePicker.launchCameraAsync({
    mediaTypes: ['images'],
    quality: 0.8,
    allowsEditing: false,
  });

  if (result.canceled || !result.assets[0]) return null;
  return result.assets[0].uri;
}

/**
 * Opens the gallery and returns the selected image URI, or null if cancelled.
 */
export async function getPhotoFromGallery(): Promise<string | null> {
  const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (status !== 'granted') {
    return null;
  }

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    quality: 0.8,
    allowsEditing: false,
  });

  if (result.canceled || !result.assets[0]) return null;
  return result.assets[0].uri;
}
