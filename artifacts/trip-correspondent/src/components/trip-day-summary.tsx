import type { Trip } from '@workspace/api-client-react';
import { Camera, MapPin, Thermometer } from 'lucide-react';

/**
 * Day-by-day breakdown replacing the route map. Shows each day's location,
 * weather, photo count and distance — always useful regardless of whether
 * the trip spans one city or many.
 */
export function TripDaySummary({ trip }: { trip: Trip }) {
  const days = [...trip.days].sort((a, b) => a.dayIndex - b.dayIndex);
  if (days.length === 0) return null;

  return (
    <section className="border-b border-border">
      <div className="max-w-6xl mx-auto px-6 py-16">
        <div className="mb-6 flex items-baseline justify-between">
          <span className="font-mono text-[9px] uppercase tracking-[0.4em] text-foreground/60">
            Day by Day
          </span>
          <span className="font-mono text-[9px] uppercase tracking-[0.4em] text-foreground/50">
            {days.length} {days.length === 1 ? 'day' : 'days'} documented
          </span>
        </div>

        <div className="border border-border divide-y divide-border">
          {days.map((day) => {
            const photos = trip.photos.filter((p) => p.tripDayId === day.id);
            const weather = day.weather as {
              tempMinC?: number;
              tempMaxC?: number;
              description?: string;
            } | null;
            const hasTemp =
              weather && (weather.tempMinC != null || weather.tempMaxC != null);

            return (
              <div
                key={day.id}
                className="grid grid-cols-[60px_1fr_auto] gap-6 px-6 py-5 items-center"
              >
                {/* Day number */}
                <div>
                  <div className="font-mono text-[8px] uppercase tracking-widest text-muted-foreground leading-none mb-1">
                    Day
                  </div>
                  <div className="font-serif font-black text-4xl leading-none text-primary">
                    {day.dayIndex + 1}
                  </div>
                </div>

                {/* Location + weather + distance */}
                <div className="space-y-2 min-w-0">
                  {day.locationName && (
                    <div className="flex items-center gap-2">
                      <MapPin className="h-3 w-3 text-muted-foreground shrink-0" />
                      <span className="font-mono text-[10px] uppercase tracking-widest truncate">
                        {day.locationName}
                      </span>
                    </div>
                  )}
                  {hasTemp && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Thermometer className="h-3 w-3 shrink-0" />
                      <span className="font-mono text-[10px]">
                        {weather!.tempMinC != null
                          ? `${Math.round(weather!.tempMinC)}°`
                          : ''}
                        {weather!.tempMinC != null && weather!.tempMaxC != null
                          ? ' – '
                          : ''}
                        {weather!.tempMaxC != null
                          ? `${Math.round(weather!.tempMaxC)}°C`
                          : ''}
                        {weather!.description
                          ? `  ·  ${weather!.description}`
                          : ''}
                      </span>
                    </div>
                  )}
                  {typeof day.distanceKm === 'number' && day.distanceKm > 0 && (
                    <div className="font-mono text-[10px] text-muted-foreground pl-5">
                      {Math.round(day.distanceKm)} km on foot
                    </div>
                  )}
                </div>

                {/* Photo count */}
                <div className="text-right shrink-0">
                  <div className="flex items-center gap-1.5 justify-end">
                    <span className="font-mono text-xl font-black tabular-nums leading-none">
                      {photos.length}
                    </span>
                    <Camera className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="font-mono text-[8px] uppercase tracking-widest text-muted-foreground mt-1">
                    frames
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
