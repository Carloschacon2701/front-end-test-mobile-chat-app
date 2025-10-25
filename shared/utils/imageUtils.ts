import * as ImagePicker from "expo-image-picker";
import * as ImageManipulator from "expo-image-manipulator";
import * as FileSystem from "expo-file-system";

export interface ImageResult {
  uri: string;
  width: number;
  height: number;
  type: string;
}

export interface CompressedImageResult {
  originalUri: string;
  thumbnailUri: string;
  width: number;
  height: number;
}

/**
 * Request camera and media library permissions
 */
export async function requestPermissions(): Promise<boolean> {
  const { status: cameraStatus } =
    await ImagePicker.requestCameraPermissionsAsync();
  const { status: mediaLibraryStatus } =
    await ImagePicker.requestMediaLibraryPermissionsAsync();

  return cameraStatus === "granted" && mediaLibraryStatus === "granted";
}

/**
 * Open image picker to select a photo
 */
export async function pickImage(): Promise<ImageResult | null> {
  try {
    const hasPermission = await requestPermissions();
    if (!hasPermission) {
      throw new Error("Camera and media library permissions are required");
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: false,
      quality: 1, // We'll compress it ourselves
    });

    if (result.canceled) {
      return null;
    }

    const asset = result.assets[0];
    return {
      uri: asset.uri,
      width: asset.width,
      height: asset.height,
      type: asset.type || "image",
    };
  } catch (error) {
    console.error("Error picking image:", error);
    throw error;
  }
}

/**
 * Compress and resize image to max 800x800px while maintaining aspect ratio
 */
export async function compressImage(
  imageUri: string
): Promise<CompressedImageResult> {
  try {
    // Get original image dimensions
    const imageInfo = await FileSystem.getInfoAsync(imageUri);
    if (!imageInfo.exists) {
      throw new Error("Image file not found");
    }

    // Create a unique filename for the compressed image
    const timestamp = Date.now();
    const compressedUri = `${FileSystem.documentDirectory}compressed_${timestamp}.jpg`;
    const thumbnailUri = `${FileSystem.documentDirectory}thumbnail_${timestamp}.jpg`;

    // Compress to max 800x800px for preview
    const compressedResult = await ImageManipulator.manipulateAsync(
      imageUri,
      [{ resize: { width: 800, height: 800 } }],
      {
        compress: 0.8,
        format: ImageManipulator.SaveFormat.JPEG,
        base64: false,
      }
    );

    // Create thumbnail (200x200px) for fast loading
    const thumbnailResult = await ImageManipulator.manipulateAsync(
      imageUri,
      [{ resize: { width: 200, height: 200 } }],
      {
        compress: 0.6,
        format: ImageManipulator.SaveFormat.JPEG,
        base64: false,
      }
    );

    // Save compressed images to file system
    await FileSystem.copyAsync({
      from: compressedResult.uri,
      to: compressedUri,
    });

    await FileSystem.copyAsync({
      from: thumbnailResult.uri,
      to: thumbnailUri,
    });

    return {
      originalUri: imageUri,
      thumbnailUri,
      width: compressedResult.width,
      height: compressedResult.height,
    };
  } catch (error) {
    console.error("Error compressing image:", error);
    throw error;
  }
}

/**
 * Save image to file system with a unique filename
 */
export async function saveImageToFileSystem(imageUri: string): Promise<string> {
  try {
    const timestamp = Date.now();
    const filename = `photo_${timestamp}.jpg`;
    const fileUri = `${FileSystem.documentDirectory}${filename}`;

    await FileSystem.copyAsync({
      from: imageUri,
      to: fileUri,
    });

    return fileUri;
  } catch (error) {
    console.error("Error saving image to file system:", error);
    throw error;
  }
}

/**
 * Delete image files from file system
 */
export async function deleteImageFiles(
  originalUri: string,
  thumbnailUri: string
): Promise<void> {
  try {
    const filesToDelete = [originalUri, thumbnailUri].filter((uri) => uri);

    for (const fileUri of filesToDelete) {
      const fileInfo = await FileSystem.getInfoAsync(fileUri);
      if (fileInfo.exists) {
        await FileSystem.deleteAsync(fileUri);
      }
    }
  } catch (error) {
    console.error("Error deleting image files:", error);
    // Don't throw error for cleanup failures
  }
}

/**
 * Get file size in bytes
 */
export async function getFileSize(fileUri: string): Promise<number> {
  try {
    const fileInfo = await FileSystem.getInfoAsync(fileUri);
    return fileInfo.exists ? fileInfo.size || 0 : 0;
  } catch (error) {
    console.error("Error getting file size:", error);
    return 0;
  }
}
