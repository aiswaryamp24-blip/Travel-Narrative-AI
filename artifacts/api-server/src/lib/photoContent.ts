import sharp from "sharp";
import { ObjectStorageService } from "./objectStorage";
import { logger } from "./logger";

const objectStorageService = new ObjectStorageService();

/** Longest edge (px) photos are downsized to before being sent to Claude —
 * keeps vision token cost and request size bounded without losing the
 * detail needed to read people/activity/setting. Kept modest (rather than
 * e.g. 1024) specifically to keep per-day processing time down. */
const MAX_DIMENSION = 768;
const JPEG_QUALITY = 78;

export interface PhotoImageBlock {
  mediaType: "image/jpeg";
  base64: string;
  /** ISO capture timestamp, when known — lets the narrative sequence the
   * day by time of day (morning arrival, midday exploring, evening meal)
   * instead of treating all photos as interchangeable. */
  takenAt: string | null;
}

export interface PhotoRef {
  objectPath: string;
  takenAt: string | null;
}

/** Downloads one photo from object storage and downsizes it for vision
 * input. Returns null (rather than throwing) on failure so one bad/missing
 * photo doesn't take down a whole day's research — the caller just gets
 * fewer images to look at. */
async function loadPhotoImageBlock(photo: PhotoRef): Promise<PhotoImageBlock | null> {
  try {
    const file = await objectStorageService.getObjectEntityFile(photo.objectPath);
    const [buffer] = await file.download();
    const resized = await sharp(buffer)
      .rotate() // respect EXIF orientation before resizing
      .resize({ width: MAX_DIMENSION, height: MAX_DIMENSION, fit: "inside", withoutEnlargement: true })
      .jpeg({ quality: JPEG_QUALITY })
      .toBuffer();
    return { mediaType: "image/jpeg", base64: resized.toString("base64"), takenAt: photo.takenAt };
  } catch (error) {
    logger.warn({ err: error, objectPath: photo.objectPath }, "Failed to load photo for vision analysis, skipping it");
    return null;
  }
}

export async function loadPhotoImageBlocks(photos: PhotoRef[]): Promise<PhotoImageBlock[]> {
  const results = await Promise.all(photos.map(loadPhotoImageBlock));
  return results.filter((r): r is PhotoImageBlock => r !== null);
}
