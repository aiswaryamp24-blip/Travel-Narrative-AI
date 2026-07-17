import type { TripDayLocation } from '@workspace/api-client-react';
import { MapContainer, TileLayer, Marker, Tooltip } from 'react-leaflet';
import { Link } from 'wouter';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Leaflet's default marker icons reference image URLs that don't resolve
// correctly under bundlers, so we render a simple colored dot instead —
// no per-day numbering here since points span unrelated trips.
function dotIcon() {
  return L.divIcon({
    className: '',
    html: `<div style="
      background: hsl(var(--primary));
      width: 12px; height: 12px; border-radius: 9999px;
      border: 2px solid white; box-shadow: 0 1px 4px rgba(0,0,0,0.4);
    "></div>`,
    iconSize: [12, 12],
    iconAnchor: [6, 6],
  });
}

/**
 * A single world map plotting every day across every one of a user's
 * visible trips — not one trip's route, every trip. Modeled on
 * TripRouteMap, but without a connecting Polyline (these points span
 * unrelated trips, so a line between them would be meaningless) and a
 * wide default zoom instead of centering on one trip's midpoint.
 */
export function EverywhereMap({ locations }: { locations: TripDayLocation[] }) {
  if (locations.length === 0) return null;

  return (
    <section className="border border-border">
      <div className="relative border-b border-border px-6 py-4 flex items-baseline justify-between bg-card">
        <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary" />
        <h2 className="text-2xl font-serif font-black uppercase tracking-tight pl-2">Everywhere I&rsquo;ve Been</h2>
        <span className="font-mono text-[9px] uppercase tracking-[0.3em] text-muted-foreground">
          {locations.length} {locations.length === 1 ? 'Day' : 'Days'}
        </span>
      </div>
      <div className="h-[400px] md:h-[480px]">
        <MapContainer
          center={[20, 0]}
          zoom={2}
          scrollWheelZoom={false}
          style={{ height: '100%', width: '100%' }}
        >
          <TileLayer
            attribution='&copy; OpenStreetMap contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {locations.map((loc, i) => (
            <Marker key={`${loc.tripId}-${loc.dayIndex}-${i}`} position={[loc.lat, loc.lon]} icon={dotIcon()}>
              <Tooltip>
                <Link href={`/trips/${loc.tripId}`}>
                  {loc.tripTitle} — Day {loc.dayIndex + 1}
                  {loc.locationName ? ` — ${loc.locationName}` : ''}
                </Link>
              </Tooltip>
            </Marker>
          ))}
        </MapContainer>
      </div>
    </section>
  );
}
