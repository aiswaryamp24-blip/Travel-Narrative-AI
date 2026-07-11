import type { Trip } from '@workspace/api-client-react';
import { Compass, Globe2, Thermometer, CalendarDays } from 'lucide-react';

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
  const locations = new Set(
    days.map((d) => d.locationName).filter((l): l is string => !!l),
  );

  const temps = days
    .map((d) => d.weather)
    .filter((w): w is NonNullable<typeof w> => !!w)
    .flatMap((w) => [w.tempMinC, w.tempMaxC])
    .filter((t): t is number => t !== null && t !== undefined);

  const tempMin = temps.length > 0 ? Math.min(...temps) : null;
  const tempMax = temps.length > 0 ? Math.max(...temps) : null;

  const stats: { icon: typeof Compass; label: string; value: string }[] = [
    { icon: CalendarDays, label: 'Days Documented', value: String(days.length) },
    {
      icon: Compass,
      label: 'Distance Covered',
      value: trip.totalDistanceKm ? `${Math.round(trip.totalDistanceKm)} km` : '—',
    },
    {
      icon: Globe2,
      label: countries.size > 1 ? 'Countries' : 'Locations',
      value: String(countries.size > 1 ? countries.size : locations.size),
    },
    {
      icon: Thermometer,
      label: 'Temperature Range',
      value:
        tempMin !== null && tempMax !== null
          ? `${Math.round(tempMin)}° – ${Math.round(tempMax)}°`
          : '—',
    },
  ];

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
