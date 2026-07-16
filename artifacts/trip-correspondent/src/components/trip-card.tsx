import type { FeedTripSummary } from '@workspace/api-client-react';
import { Link } from 'wouter';
import { format } from 'date-fns';
import { Map } from 'lucide-react';
import { motion } from 'framer-motion';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { SocialShareModal } from '@/components/social-share-modal';

export function TripCard({ trip }: { trip: FeedTripSummary }) {
  return (
    <motion.article
      className="relative bg-card border border-border h-full flex flex-col"
      style={{ transformPerspective: 800 }}
      whileHover={{ y: -6, rotateX: 2, boxShadow: '0 20px 40px -15px rgb(0 0 0 / 0.25)' }}
      whileTap={{ scale: 0.98 }}
      transition={{ type: 'spring', stiffness: 300, damping: 22 }}
    >
      <Link href={`/trips/${trip.id}`} className="group block">
        <div className="relative aspect-[4/5] overflow-hidden bg-muted border-b border-border p-6 flex flex-col justify-end">
          {trip.coverObjectPath ? (
            <>
              <img
                src={`/api/storage${trip.coverObjectPath}`}
                alt={trip.title}
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
            </>
          ) : (
            <div className="absolute inset-0 flex items-center justify-center bg-accent">
              <Map className="h-16 w-16 text-muted-foreground opacity-20" />
            </div>
          )}
          <div className="relative z-10 space-y-2 text-white">
            <div className="flex items-center gap-2 text-xs font-mono tracking-widest uppercase mb-4 opacity-80">
              <span>{format(new Date(trip.createdAt), 'MMM yyyy')}</span>
            </div>
            <h3 className="text-3xl font-serif leading-tight drop-shadow-md">{trip.title}</h3>
          </div>
        </div>
      </Link>
      <div className="p-6 flex-grow flex flex-col justify-between space-y-4">
        {trip.summary && (
          <p className="text-muted-foreground text-sm line-clamp-3 font-serif italic">"{trip.summary}"</p>
        )}
        <div className="flex items-center justify-between">
          <Link href={`/users/${trip.owner.id}`} className="flex items-center gap-2 group w-fit">
            <Avatar className="h-6 w-6 rounded-none border border-border">
              <AvatarImage src={trip.owner.avatarUrl ?? undefined} alt={trip.owner.displayName} className="rounded-none" />
              <AvatarFallback className="rounded-none text-xs font-serif">
                {trip.owner.displayName.slice(0, 1).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <span className="text-xs font-mono uppercase tracking-widest text-muted-foreground group-hover:text-foreground transition-colors">
              {trip.owner.displayName}
            </span>
          </Link>
          {/* Social share */}
          <SocialShareModal trip={trip} />
        </div>
      </div>
    </motion.article>
  );
}

export function TripGridSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
      {[1, 2, 3].map((i) => (
        <div key={i} className="space-y-4">
          <Skeleton className="aspect-[4/5] w-full rounded-none" />
          <Skeleton className="h-6 w-3/4" />
        </div>
      ))}
    </div>
  );
}
