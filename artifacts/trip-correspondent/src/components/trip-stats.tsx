import type { Trip } from '@workspace/api-client-react';
import { Compass, Globe2, MapPin, Thermometer, CalendarDays } from 'lucide-react';

function extractCountry(locationName: string | null): string | null {
  if (!locationName) return null;
  const parts = locationName.split(',').map((p) => p.trim()).filter(Boolean);
  if (parts.length === 0) return null;
  return parts[parts.length - 1];
}

export function TripStats({ trip }: { trip: Trip }) {
  const days = trip.days;
  if (days.length === 0) return null;

  const countries = new Set(
    days.map((d) => extractCountry(d.locationName)).filter((c): c is string => !!c),
  );
  const cities = new Set(
    days.map((d) => d.locationName).filter((l): l is string => !!l),
  );

  const temps = days
    .map((d) => d.weather)
    .filter((w): w is NonNullable<typeof w> => !!w)
    .flatMap((w) => [w.tempMinC, w.tempMaxC])
    .filter((t): t is number => t !== null && t !== undefined);

  const tempMin = temps.length > 0 ? Math.min(...temps) : null;
  const tempMax = temps.length > 0 ? Math.max(...temps) : null;

  const stats: { icon: typeof Globe2; label: string; value: string }[] = [
    { icon: CalendarDays, label: 'Days Documented', value: String(days.length) },
  ];

  // Distance is only meaningful when at least one day had real GPS data to
  // measure movement from — showing a "—" for every trip without GPS reads
  // as broken rather than "no data available", so hide it entirely instead.
  if (trip.totalDistanceKm) {
    stats.push({
      icon: Compass,
      label: 'Distance Covered',
      value: `${Math.round(trip.totalDistanceKm)} km`,
    });
  }

  // Cities and Countries are shown as separate stats (rather than one
  // toggling into the other) so a single-country, multi-city trip — like a
  // Poland trip covering Krakow and Warsaw — still surfaces city-level detail.
  if (cities.size > 0) {
    stats.push({ icon: MapPin, label: cities.size === 1 ? 'City Visited' : 'Cities Visited', value: String(cities.size) });
  }
  if (countries.size > 1) {
    stats.push({ icon: Globe2, label: 'Countries', value: String(countries.size) });
  }

  if (tempMin !== null && tempMax !== null) {
    stats.push({
      icon: Thermometer,
      label: 'Temperature Range',
      value: `${Math.round(tempMin)}° – ${Math.round(tempMax)}°`,
    });
  }

  return (
    <section className="border-b border-border bg-card">
      <div className="max-w-6xl mx-auto px-6 py-10 grid grid-cols-2 md:grid-cols-4 gap-8">
        {stats.map((stat) => (
          <div key={stat.label} className="text-center space-y-2">
            <stat.icon className="h-5 w-5 mx-auto text-primary" />
            <div className="text-3xl md:text-4xl font-serif">{stat.value}</div>
            <div className="text-[10px] md:text-xs font-mono uppercase tracking-widest text-muted-foreground">
              {stat.label}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
