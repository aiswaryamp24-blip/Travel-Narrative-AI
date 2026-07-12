import type { Trip } from '@workspace/api-client-react';
import { MapContainer, TileLayer, Marker, Tooltip } from 'react-leaflet';
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
    .filter((d) => typeof d.lat === 'number' && typeof d.lon === 'number')
    .sort((a, b) => a.dayIndex - b.dayIndex);

  if (days.length === 0) return null;

  const positions: [number, number][] = days.map((d) => [d.lat, d.lon]);
  const center = positions[Math.floor(positions.length / 2)];

  return (
    <section className="border-b border-border">
      <div className="max-w-6xl mx-auto px-6 py-16">
        <div className="text-center mb-8">
          <h3 className="text-2xl font-serif">Where You Were</h3>
          <p className="text-muted-foreground font-mono text-xs uppercase tracking-widest mt-2">
            Approximate location per day, from photo GPS data
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
