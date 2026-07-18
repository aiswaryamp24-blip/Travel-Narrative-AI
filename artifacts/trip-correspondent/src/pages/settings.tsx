import { useUser } from '@clerk/react';
import { Redirect, Link } from 'wouter';
import {
  useGetUserProfile,
  getGetUserProfileQueryKey,
  useUpdateUserSettings,
} from '@workspace/api-client-react';
import type { DigestCadenceMonths, DigestStyle } from '@workspace/api-client-react';
import { useQueryClient } from '@tanstack/react-query';
import { ChevronLeft, Bell, Newspaper, Palette } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { Logo } from '@/components/logo';

const CADENCE_OPTIONS = [
  { value: 3, label: 'Every 3 months' },
  { value: 4, label: 'Every 4 months' },
  { value: 6, label: 'Every 6 months' },
];

const STYLE_OPTIONS: Array<{ value: DigestStyle; label: string; description: string }> = [
  { value: 'pop-art', label: 'Pop Art', description: 'Bold primaries, thick borders, Ben-day energy' },
  { value: 'supermarket', label: 'Supermarket', description: 'Receipt paper white, barcode accents' },
  { value: 'camera-interface', label: 'Viewfinder Interface', description: 'Black EVF, green CRT readouts' },
  { value: 'canon-camera', label: 'Canon Camera', description: 'Classic body black, signature red' },
  { value: 'ios-core', label: 'iOS Core', description: 'Light grouped backgrounds, system blue' },
  { value: 'android-core', label: 'Android Core', description: 'Material dark surface, tertiary purple' },
];

export default function Settings() {
  const { user, isLoaded } = useUser();

  if (!isLoaded) {
    return <SettingsSkeleton />;
  }

  if (!user) {
    return <Redirect to="/" />;
  }

  return <SettingsContent userId={user.id} />;
}

function SettingsContent({ userId }: { userId: string }) {
  const queryClient = useQueryClient();
  const updateSettings = useUpdateUserSettings();

  const { data: profile, isLoading } = useGetUserProfile(userId, {
    query: { queryKey: getGetUserProfileQueryKey(userId), enabled: !!userId },
  });

  const handleCadenceChange = async (value: string) => {
    try {
      await updateSettings.mutateAsync({
        userId,
        data: { digestCadenceMonths: Number(value) as DigestCadenceMonths },
      });
      queryClient.invalidateQueries({ queryKey: getGetUserProfileQueryKey(userId) });
      toast.success('Digest cadence updated.');
    } catch {
      toast.error('Failed to update digest cadence.');
    }
  };

  const handleStyleChange = async (value: string) => {
    if (!profile) return;
    try {
      await updateSettings.mutateAsync({
        userId,
        data: {
          digestCadenceMonths: profile.digestCadenceMonths as DigestCadenceMonths,
          preferredDigestStyle: value as DigestStyle,
        },
      });
      queryClient.invalidateQueries({ queryKey: getGetUserProfileQueryKey(userId) });
      toast.success('Preferred style saved.');
    } catch {
      toast.error('Failed to update preferred style.');
    }
  };

  const handleEmailToggle = async (enabled: boolean) => {
    if (!profile) return;
    try {
      await updateSettings.mutateAsync({
        userId,
        data: {
          digestCadenceMonths: profile.digestCadenceMonths as DigestCadenceMonths,
          digestEmailEnabled: enabled,
        },
      });
      queryClient.invalidateQueries({ queryKey: getGetUserProfileQueryKey(userId) });
      toast.success(enabled ? 'Email notifications turned on.' : 'Email notifications turned off.');
    } catch {
      toast.error('Failed to update email preference.');
    }
  };

  return (
    <div className="min-h-screen pb-24 bg-background">
      <nav className="py-3 px-6 flex justify-between items-center border-b border-border bg-background/95 backdrop-blur-sm sticky top-0 z-40">
        <Link
          href={`/users/${userId}`}
          className="inline-flex items-center text-[10px] font-black font-mono uppercase tracking-[0.2em] border border-primary/50 px-3 py-1.5 text-foreground hover:bg-primary hover:text-primary-foreground hover:border-primary transition-all duration-200"
        >
          <ChevronLeft className="h-3.5 w-3.5 mr-1" /> Profile
        </Link>
        <Logo className="text-lg" />
      </nav>

      <header className="border-b border-border bg-card/50 px-6 py-10">
        <div className="max-w-2xl mx-auto">
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-primary mb-2">Account</p>
          <h1 className="text-4xl font-serif font-black uppercase tracking-tight">Settings</h1>
          <p className="text-muted-foreground text-sm font-mono mt-2">
            Manage your notification and digest preferences.
          </p>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-6 py-12 space-y-10">
        {isLoading || !profile ? (
          <SettingsSectionSkeleton />
        ) : (
          <>
            {/* Digest Notifications */}
            <section className="border border-border">
              <div className="relative border-b border-border px-6 py-4 bg-card flex items-center gap-3">
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary" />
                <Newspaper className="h-4 w-4 text-primary ml-2" />
                <h2 className="font-mono text-xs uppercase tracking-widest font-bold">Digest Emails</h2>
              </div>
              <div className="divide-y divide-border">
                {/* Email toggle */}
                <div className="px-6 py-5 flex items-center justify-between gap-6">
                  <div>
                    <p className="text-sm font-medium">Email notifications</p>
                    <p className="text-xs text-muted-foreground font-mono mt-0.5">
                      Receive your Wrapped digest by email when it's ready
                    </p>
                  </div>
                  <Switch
                    id="settings-email-toggle"
                    checked={profile.digestEmailEnabled}
                    onCheckedChange={handleEmailToggle}
                    disabled={updateSettings.isPending}
                  />
                </div>

                {/* Cadence */}
                <div className="px-6 py-5 flex items-center justify-between gap-6">
                  <div>
                    <Label
                      htmlFor="settings-cadence"
                      className="text-sm font-medium cursor-pointer"
                    >
                      Recap frequency
                    </Label>
                    <p className="text-xs text-muted-foreground font-mono mt-0.5">
                      How often your Wrapped digest is generated
                    </p>
                  </div>
                  <Select
                    value={String(profile.digestCadenceMonths)}
                    onValueChange={handleCadenceChange}
                    disabled={updateSettings.isPending}
                  >
                    <SelectTrigger
                      id="settings-cadence"
                      className="w-[180px] rounded-none font-mono text-xs uppercase tracking-widest"
                    >
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CADENCE_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={String(option.value)}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </section>

            {/* Digest Style */}
            <section className="border border-border">
              <div className="relative border-b border-border px-6 py-4 bg-card flex items-center gap-3">
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary" />
                <Palette className="h-4 w-4 text-primary ml-2" />
                <h2 className="font-mono text-xs uppercase tracking-widest font-bold">Digest Style</h2>
              </div>
              <div className="px-6 py-5 flex items-center justify-between gap-6">
                <div>
                  <p className="text-sm font-medium">Preferred style</p>
                  <p className="text-xs text-muted-foreground font-mono mt-0.5">
                    Default visual theme when generating a new Wrapped
                  </p>
                </div>
                <Select
                  value={profile.preferredDigestStyle}
                  onValueChange={handleStyleChange}
                  disabled={updateSettings.isPending}
                >
                  <SelectTrigger className="w-[200px] rounded-none font-mono text-xs uppercase tracking-widest">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {STYLE_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </section>

            {/* Future preferences placeholder note */}
            <section className="border border-border border-dashed">
              <div className="px-6 py-5 flex items-center gap-3">
                <Bell className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                <p className="text-xs text-muted-foreground font-mono uppercase tracking-widest">
                  More notification options — follower alerts, companion tag invites — coming soon
                </p>
              </div>
            </section>
          </>
        )}
      </main>
    </div>
  );
}

function SettingsSkeleton() {
  return (
    <div className="min-h-screen bg-background">
      <nav className="border-b border-border py-4 px-6 flex justify-between">
        <Skeleton className="h-6 w-24" />
        <Skeleton className="h-6 w-32" />
      </nav>
      <div className="px-6 py-10 border-b border-border bg-card/50">
        <div className="max-w-2xl mx-auto space-y-3">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-4 w-64" />
        </div>
      </div>
      <SettingsSectionSkeleton />
    </div>
  );
}

function SettingsSectionSkeleton() {
  return (
    <div className="max-w-2xl mx-auto px-6 py-12 space-y-6">
      <Skeleton className="h-48 w-full rounded-none" />
      <Skeleton className="h-24 w-full rounded-none" />
    </div>
  );
}
