import * as FileSystem from 'expo-file-system/legacy';
import * as ImagePicker from 'expo-image-picker';
import * as MediaLibrary from 'expo-media-library';
import { Product } from '@/types';

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
 * Copies all product images to a new public album on the device
 * named `ElMagoChina_YYYYMMDD_HHMM`, renaming each file to match
 * the product code (e.g. EM-0015.jpg).
 *
 * Two-phase approach to avoid per-image native permission dialogs on Android:
 *   Phase 1 — create all MediaLibrary assets (with progress reporting).
 *   Phase 2 — add the full asset list to the album in a single native call.
 *
 * Returns the number of images successfully copied.
 * Throws if permissions are denied.
 */
export async function backupImagesToGallery(
  products: Product[],
  onProgress?: (current: number, total: number) => void
): Promise<number> {
  // ── Request permission ONCE before touching any files ──────────────────────
  const { status } = await MediaLibrary.requestPermissionsAsync(true);
  if (status !== 'granted') {
    throw new Error('Permiso de galería denegado. Habilitá el acceso en Ajustes del dispositivo.');
  }

  if (products.length === 0) return 0;

  // Build album name with local timestamp: ElMagoChina_20260311_0820
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  const datePart = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}`;
  const timePart = `${pad(now.getHours())}${pad(now.getMinutes())}`;
  const albumName = `ElMagoChina_${datePart}_${timePart}`;

  // ── Phase 1: create all assets, report progress ────────────────────────────
  const assets: MediaLibrary.Asset[] = [];
  const total = products.length;

  for (let i = 0; i < total; i++) {
    const product = products[i];

    // Yield to the JS thread so the UI can re-render the progress bar
    await new Promise((resolve) => setTimeout(resolve, 0));
    if (onProgress) onProgress(i + 1, total);

    if (!product.image_uri) continue;

    try {
      const fileInfo = await FileSystem.getInfoAsync(product.image_uri);
      if (!fileInfo.exists) continue;

      // Rename to product code while copying through cache
      const safeCode = product.product_code.trim().replace(/[^a-zA-Z0-9\-_]/g, '_');
      const tempDest = `${FileSystem.cacheDirectory}${safeCode}.jpg`;

      await FileSystem.deleteAsync(tempDest, { idempotent: true });
      await FileSystem.copyAsync({ from: product.image_uri, to: tempDest });

      const asset = await MediaLibrary.createAssetAsync(tempDest);
      assets.push(asset);

      // Clean up temp file immediately after the asset is registered
      await FileSystem.deleteAsync(tempDest, { idempotent: true });
    } catch {
      // Skip corrupted / missing files and continue
    }
  }

  if (assets.length === 0) return 0;

  // ── Phase 2: add all assets to the album in a single native call ───────────
  // createAlbumAsync takes the first asset; addAssetsToAlbumAsync handles the rest.
  const album = await MediaLibrary.createAlbumAsync(albumName, assets[0], false);
  if (assets.length > 1) {
    await MediaLibrary.addAssetsToAlbumAsync(assets.slice(1), album, false);
  }

  return assets.length;
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
