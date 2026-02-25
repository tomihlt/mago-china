import * as FileSystem from 'expo-file-system/legacy';
import * as ImagePicker from 'expo-image-picker';
import * as MediaLibrary from 'expo-media-library';

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
 * Saves a newly captured camera photo to the device's native gallery (Camera Roll)
 * with the product code as the filename (e.g. EM-0015.jpg).
 *
 * Only call this for photos taken with the camera — NOT for images selected
 * from the gallery (to avoid creating duplicates).
 *
 * Returns true if saved successfully, false if permission was denied.
 */
export async function savePhotoToGallery(
  photoUri: string,
  productCode: string
): Promise<boolean> {
  // writeOnly: true avoids requesting READ_MEDIA_AUDIO on Android,
  // which is not declared in the manifest and causes a crash in Expo Go.
  const { status } = await MediaLibrary.requestPermissionsAsync(true);
  if (status !== 'granted') {
    return false;
  }

  // Sanitize product code for use as a filename (replace invalid chars with '_')
  const safeCode = productCode.trim().replace(/[^a-zA-Z0-9\-_]/g, '_');
  const filename = `${safeCode}.jpg`;

  // Copy the photo to cacheDirectory with the desired product-code filename.
  // MediaLibrary will read from this local URI when creating the gallery asset.
  const tempDest = `${FileSystem.cacheDirectory}${filename}`;
  await FileSystem.copyAsync({ from: photoUri, to: tempDest });

  try {
    // Save the renamed file to the Camera Roll / Photos library
    await MediaLibrary.createAssetAsync(tempDest);
  } finally {
    // Always clean up the temp file regardless of success/failure
    await FileSystem.deleteAsync(tempDest, { idempotent: true });
  }

  return true;
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
 * Opens the camera and returns the captured image URI, or null if cancelled/denied.
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
 * Opens the gallery and returns the selected image URI, or null if cancelled/denied.
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
