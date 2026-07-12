import type { Trip } from '@workspace/api-client-react';
import { MapContainer, TileLayer, Marker, Polyline, Tooltip } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Leaflet's default marker icons reference image URLs that don't resolve
// correctly under bundlers, so we render simple numbered div-icons instead.
function dayIcon(dayIndex: number) {
  return L.divIcon({
    className: '',
    html: `<div style="
      background: hsl(var(--primary));
      color: hsl(var(--primary-foreground));
      width: 28px; height: 28px; border-radius: 9999px;
      display: flex; align-items: center; justify-content: center;
      font-family: monospace; font-size: 12px; font-weight: 700;
      border: 2px solid white; box-shadow: 0 1px 4px rgba(0,0,0,0.4);
    ">${dayIndex}</div>`,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
  });
}

export function TripRouteMap({ trip }: { trip: Trip }) {
  const days = trip.days
    // (0, 0) is the pipeline's placeholder for "no GPS data anywhere in
    // this trip" — a real, resolvable coordinate (Gulf of Guinea), not an
    // empty value, so it has to be filtered out explicitly rather than
    // just checking for null/undefined.
    .filter((d) => typeof d.lat === 'number' && typeof d.lon === 'number' && !(d.lat === 0 && d.lon === 0))
    .sort((a, b) => a.dayIndex - b.dayIndex);

  if (days.length === 0) return null;

  // Prefer the actual chronological trail of geotagged photos for the
  // drawn route — a straight line between day centroids collapses an
  // entire day of movement (e.g. touring a city) into a single point and
  // badly misrepresents where the travelers actually went. Fall back to
  // the day's centroid for any day that has no route points of its own.
  const positions: [number, number][] = days.flatMap((d) => {
    const points = (d.routePoints ?? []) as Array<{ lat: number; lon: number }>;
    if (points.length > 0) {
      return points.map((p): [number, number] => [p.lat, p.lon]);
    }
    return [[d.lat, d.lon]] as [number, number][];
  });
  const center = positions[Math.floor(positions.length / 2)];

  return (
    <section className="border-b border-border">
      <div className="max-w-6xl mx-auto px-6 py-16">
        <div className="text-center mb-8">
          <h3 className="text-2xl font-serif">The Route</h3>
          <p className="text-muted-foreground font-mono text-xs uppercase tracking-widest mt-2">
            Traced from your photos&rsquo; GPS data
          </p>
        </div>
        <div className="h-[400px] md:h-[480px] border border-border overflow-hidden">
          <MapContainer
            center={center}
            zoom={days.length > 1 ? 6 : 10}
            scrollWheelZoom={false}
            style={{ height: '100%', width: '100%' }}
          >
            <TileLayer
              attribution='&copy; OpenStreetMap contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {positions.length > 1 && (
              <Polyline positions={positions} pathOptions={{ color: 'currentColor', weight: 3, opacity: 0.7 }} />
            )}
            {days.map((day) => (
              <Marker key={day.id} position={[day.lat, day.lon]} icon={dayIcon(day.dayIndex)}>
                <Tooltip>
                  Day {day.dayIndex} — {day.locationName ?? 'Unknown location'}
                </Tooltip>
              </Marker>
            ))}
          </MapContainer>
        </div>
      </div>
    </section>
  );
}
