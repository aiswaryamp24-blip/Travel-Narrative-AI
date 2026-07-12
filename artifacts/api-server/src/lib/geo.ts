const EARTH_RADIUS_KM = 6371;

export function haversineKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return EARTH_RADIUS_KM * c;
}

export interface ClusterablePhoto {
  id: number;
  lat: number | null;
  lon: number | null;
  takenAt: Date | null;
}

export interface RoutePoint {
  lat: number;
  lon: number;
}

export interface DayCluster {
  date: string; // YYYY-MM-DD
  lat: number;
  lon: number;
  /** true when the centroid was inferred (no geotagged photo in this day's own bucket) */
  locationInferred: boolean;
  photoIds: number[];
  /**
   * This day's own geotagged photos, in chronological order. Used to draw
   * an accurate route through the day (rather than just its centroid) and
   * to measure how far the travelers actually moved that day.
   */
  routePoints: RoutePoint[];
}

/**
 * Groups photos into calendar-day clusters using their capture timestamp,
 * then computes a geographic centroid for each day from that day's
 * geotagged photos. Photos with a timestamp but no GPS are still grouped
 * into their day (for narrative/photo purposes) but don't contribute to
 * the centroid. Photos with neither a timestamp nor GPS are left out of
 * every cluster (they stay attached to the trip, just not to a specific day).
 *
 * If a day has no geotagged photos of its own, its centroid is inferred by
 * carrying forward the nearest previous day's centroid, or falling back to
 * the trip-wide average of all geotagged photos.
 */
export function clusterPhotosByDay(photos: ClusterablePhoto[]): DayCluster[] {
  const byDate = new Map<string, ClusterablePhoto[]>();

  for (const photo of photos) {
    if (!photo.takenAt) continue;
    const dateKey = photo.takenAt.toISOString().slice(0, 10);
    const bucket = byDate.get(dateKey);
    if (bucket) {
      bucket.push(photo);
    } else {
      byDate.set(dateKey, [photo]);
    }
  }

  const sortedDates = [...byDate.keys()].sort();

  const geotagged = photos.filter(
    (p): p is ClusterablePhoto & { lat: number; lon: number } =>
      p.lat != null && p.lon != null,
  );
  const tripAverage =
    geotagged.length > 0
      ? {
          lat: geotagged.reduce((sum, p) => sum + p.lat, 0) / geotagged.length,
          lon: geotagged.reduce((sum, p) => sum + p.lon, 0) / geotagged.length,
        }
      : null;

  const clusters: DayCluster[] = [];
  let lastKnownCentroid: { lat: number; lon: number } | null = null;

  for (const date of sortedDates) {
    const dayPhotos = byDate.get(date)!;
    const dayGeotagged = dayPhotos.filter((p) => p.lat != null && p.lon != null);

    let lat: number;
    let lon: number;
    let locationInferred = false;

    if (dayGeotagged.length > 0) {
      lat = dayGeotagged.reduce((sum, p) => sum + p.lat!, 0) / dayGeotagged.length;
      lon = dayGeotagged.reduce((sum, p) => sum + p.lon!, 0) / dayGeotagged.length;
    } else if (lastKnownCentroid) {
      ({ lat, lon } = lastKnownCentroid);
      locationInferred = true;
    } else if (tripAverage) {
      ({ lat, lon } = tripAverage);
      locationInferred = true;
    } else {
      lat = 0;
      lon = 0;
      locationInferred = true;
    }

    lastKnownCentroid = { lat, lon };

    // Sort this day's own geotagged photos chronologically so the route
    // through the day reflects the actual order the travelers moved
    // through it, not just a single averaged point.
    const routePoints: RoutePoint[] = [...dayGeotagged]
      .sort((a, b) => (a.takenAt?.getTime() ?? 0) - (b.takenAt?.getTime() ?? 0))
      .map((p) => ({ lat: p.lat!, lon: p.lon! }));

    clusters.push({
      date,
      lat,
      lon,
      locationInferred,
      photoIds: dayPhotos.map((p) => p.id),
      routePoints,
    });
  }

  return clusters;
}

/**
 * Estimates how far the travelers actually moved during a single day: the
 * sum of consecutive point-to-point distances between that day's own
 * geotagged photos (in capture order), plus the "arrival leg" from the last
 * point of the previous day to the first point of this day. This is far
 * closer to the real path traveled than a single centroid-to-centroid hop,
 * which collapses an entire day of movement (e.g. touring a city) into one
 * average point and misses it entirely.
 *
 * Returns null when there isn't enough data to estimate movement for this
 * day (e.g. the very first day with no prior point, and fewer than 2 of its
 * own geotagged photos).
 */
export function computeDayDistanceKm(
  previousLastPoint: RoutePoint | null,
  dayRoutePoints: RoutePoint[],
): number | null {
  const points = previousLastPoint ? [previousLastPoint, ...dayRoutePoints] : dayRoutePoints;
  if (points.length < 2) return null;

  let total = 0;
  for (let i = 1; i < points.length; i++) {
    total += haversineKm(points[i - 1].lat, points[i - 1].lon, points[i].lat, points[i].lon);
  }
  return total;
}
