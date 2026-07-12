import { useState, useCallback } from 'react';
import exifr from 'exifr';
import {
  useCreateTrip,
  useRequestUploadUrl,
  useAddTripPhotos,
  useProcessTrip,
  useListTrips,
} from '@workspace/api-client-react';
import { useLocation } from 'wouter';
import { useQueryClient } from '@tanstack/react-query';
import { getListTripsQueryKey } from '@workspace/api-client-react';
import { toast } from 'sonner';

interface UploadProgress {
  status: 'idle' | 'creating' | 'uploading' | 'processing' | 'done' | 'error';
  totalPhotos: number;
  uploadedPhotos: number;
  error?: string;
}

export function useUploadFlow() {
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const [progress, setProgress] = useState<UploadProgress>({
    status: 'idle',
    totalPhotos: 0,
    uploadedPhotos: 0,
  });

  const createTrip = useCreateTrip();
  const requestUploadUrl = useRequestUploadUrl();
  const addTripPhotos = useAddTripPhotos();
  const processTrip = useProcessTrip();

  const startUpload = useCallback(
    async (title: string, files: File[]) => {
      try {
        if (!files.length) {
          toast.error("Please select at least one photo.");
          return;
        }

        setProgress({ status: 'creating', totalPhotos: files.length, uploadedPhotos: 0 });

        // 1. Create Trip
        const trip = await createTrip.mutateAsync({ data: { title } });
        
        setProgress({ status: 'uploading', totalPhotos: files.length, uploadedPhotos: 0 });

        const photoPayloads = [];

        // 2. Process and Upload each file
        // Note: Doing them sequentially to avoid hammering the browser,
        // but could be batched. Let's do batches of 3.
        const BATCH_SIZE = 3;
        let uploaded = 0;

        for (let i = 0; i < files.length; i += BATCH_SIZE) {
          const batch = files.slice(i, i + BATCH_SIZE);
          
          const batchPromises = batch.map(async (file) => {
            // Extract EXIF
            let lat = null, lon = null, takenAt = null;
            try {
              const parsedExif = await exifr.parse(file, true); // true extracts GPS
              if (parsedExif) {
                if (parsedExif.latitude !== undefined && parsedExif.longitude !== undefined) {
                  lat = parsedExif.latitude;
                  lon = parsedExif.longitude;
                }
                if (parsedExif.DateTimeOriginal) {
                  // EXIF's DateTimeOriginal has no timezone — it's just the
                  // wall-clock time where the photo was taken. exifr turns
                  // it into a Date using the *browser's* local timezone, so
                  // a naive .toISOString() here would reinterpret those
                  // numbers through the viewer's timezone rather than the
                  // trip's, which can shift a late-night photo into the
                  // wrong calendar day (and therefore query weather for the
                  // wrong day). Re-read the same wall-clock numbers as a UTC
                  // instant instead, so the calendar date always matches
                  // what the camera recorded, regardless of the browser.
                  const d: Date = parsedExif.DateTimeOriginal;
                  takenAt = new Date(Date.UTC(
                    d.getFullYear(), d.getMonth(), d.getDate(),
                    d.getHours(), d.getMinutes(), d.getSeconds(),
                  )).toISOString();
                } else if (file.lastModified) {
                  takenAt = new Date(file.lastModified).toISOString();
                }
              }
            } catch (err) {
              console.warn("Failed to parse EXIF for", file.name, err);
            }

            // Get upload URL
            const { uploadURL, objectPath } = await requestUploadUrl.mutateAsync({
              data: {
                name: file.name,
                size: file.size,
                contentType: file.type || 'application/octet-stream',
              }
            });

            // PUT to GCS
            const res = await fetch(uploadURL, {
              method: 'PUT',
              body: file,
              headers: {
                'Content-Type': file.type || 'application/octet-stream',
              },
            });

            if (!res.ok) {
              throw new Error(`Failed to upload ${file.name}`);
            }

            return {
              objectPath,
              filename: file.name,
              lat,
              lon,
              takenAt,
            };
          });

          const results = await Promise.all(batchPromises);
          photoPayloads.push(...results);
          
          uploaded += results.length;
          setProgress(p => ({ ...p, uploadedPhotos: uploaded }));
        }

        setProgress({ status: 'processing', totalPhotos: files.length, uploadedPhotos: uploaded });

        // 3. Attach photos to trip
        await addTripPhotos.mutateAsync({
          tripId: trip.id,
          data: { photos: photoPayloads }
        });

        // 4. Process Trip
        await processTrip.mutateAsync({ tripId: trip.id });

        // Refresh trips list
        queryClient.invalidateQueries({ queryKey: getListTripsQueryKey() });

        setProgress({ status: 'done', totalPhotos: files.length, uploadedPhotos: uploaded });
        
        // 5. Navigate to trip page
        setLocation(`/trips/${trip.id}`);
        
      } catch (err: any) {
        console.error("Upload flow error:", err);
        setProgress(p => ({ 
          ...p, 
          status: 'error', 
          error: err.message || "An error occurred during upload." 
        }));
        toast.error("Upload failed: " + (err.message || "Unknown error"));
      }
    },
    [createTrip, requestUploadUrl, addTripPhotos, processTrip, setLocation, queryClient]
  );

  return { progress, startUpload };
}
