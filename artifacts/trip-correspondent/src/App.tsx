import { useEffect, useRef, useState } from 'react';
import { QueryClient, QueryClientProvider, useQueryClient } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Route, Switch, Redirect, useLocation, Router as WouterRouter } from 'wouter';
import { ClerkProvider, SignIn, SignUp, Show, useClerk } from '@clerk/react';
import { publishableKeyFromHost } from '@clerk/react/internal';
import { shadcn } from '@clerk/themes';
import { AnimatePresence, motion } from 'framer-motion';
import Landing from '@/pages/landing';
import Home from '@/pages/home';
import Trip from '@/pages/trip';
import Feed from '@/pages/feed';
import Profile from '@/pages/profile';
import Explore from '@/pages/explore';
import { LoadingScreen } from '@/components/loading-screen';
import { AppBackground } from '@/components/app-background';

const queryClient = new QueryClient();

// REQUIRED — copy verbatim. Resolves the key from window.location.hostname so the
// same build serves multiple Clerk custom domains. Do not inline the env var, leave
// publishableKey undefined, or replace publishableKeyFromHost with anything else.
const clerkPubKey = publishableKeyFromHost(
  window.location.hostname,
  import.meta.env.VITE_CLERK_PUBLISHABLE_KEY,
);

// REQUIRED — copy verbatim. Empty in dev (Clerk hits dev FAPI directly), auto-set
// in prod. Do NOT gate on import.meta.env.PROD / NODE_ENV — the empty dev value
// is intentional, and any branching breaks the prod proxy.
const clerkProxyUrl = import.meta.env.VITE_CLERK_PROXY_URL;

const basePath = import.meta.env.BASE_URL.replace(/\/$/, '');

// Clerk passes full paths to routerPush/routerReplace, but wouter's
// setLocation prepends the base — strip it to avoid doubling.
function stripBase(path: string): string {
  return basePath && path.startsWith(basePath) ? path.slice(basePath.length) || '/' : path;
}

if (!clerkPubKey) {
  throw new Error('Missing VITE_CLERK_PUBLISHABLE_KEY in .env file');
}

const clerkAppearance = {
  theme: shadcn,
  cssLayerName: 'clerk',
  options: {
    logoPlacement: 'inside' as const,
    logoLinkUrl: basePath || '/',
    logoImageUrl: `${window.location.origin}${basePath}/logo.svg`,
  },
  variables: {
    colorPrimary: 'hsl(243 65% 48%)',
    colorForeground: 'hsl(234 40% 10%)',
    colorMutedForeground: 'hsl(234 15% 42%)',
    colorDanger: 'hsl(0 84% 60%)',
    colorBackground: 'hsl(220 25% 97%)',
    colorInput: 'hsl(0 0% 100%)',
    colorInputForeground: 'hsl(234 40% 10%)',
    colorNeutral: 'hsl(220 15% 88%)',
    fontFamily: "'DM Sans', sans-serif",
    borderRadius: '0.25rem',
  },
  elements: {
    rootBox: 'w-full flex justify-center',
    cardBox: 'bg-white border border-border rounded-none w-[440px] max-w-full overflow-hidden shadow-lg',
    card: '!shadow-none !border-0 !bg-transparent !rounded-none',
    footer: '!shadow-none !border-0 !bg-transparent !rounded-none',
    headerTitle: 'font-serif text-2xl text-foreground',
    headerSubtitle: 'text-muted-foreground',
    socialButtonsBlockButtonText: 'text-foreground font-medium',
    formFieldLabel: 'text-foreground font-mono text-xs uppercase tracking-widest',
    footerActionLink: 'text-primary font-medium hover:text-primary/80',
    footerActionText: 'text-muted-foreground',
    dividerText: 'text-muted-foreground',
    identityPreviewEditButton: 'text-primary',
    formFieldSuccessText: 'text-foreground',
    alertText: 'text-destructive',
    logoBox: 'mb-2',
    logoImage: 'h-9',
    socialButtonsBlockButton: 'border-border rounded-none',
    formButtonPrimary: 'bg-primary hover:bg-primary/90 text-primary-foreground rounded-none font-mono text-xs uppercase tracking-widest',
    formFieldInput: 'rounded-none border-border',
    footerAction: 'border-t border-border pt-4',
    dividerLine: 'bg-border',
    alert: 'rounded-none',
    otpCodeFieldInput: 'rounded-none border-border',
    formFieldRow: '',
    main: '',
  },
};

function SignInPage() {
  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-background px-4">
      <SignIn routing="path" path={`${basePath}/sign-in`} signUpUrl={`${basePath}/sign-up`} />
    </div>
  );
}

function SignUpPage() {
  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-background px-4">
      <SignUp routing="path" path={`${basePath}/sign-up`} signInUrl={`${basePath}/sign-in`} />
    </div>
  );
}

function HomeRedirect() {
  return (
    <>
      <Show when="signed-in">
        <Redirect to="/library" />
      </Show>
      <Show when="signed-out">
        <Landing />
      </Show>
    </>
  );
}

function LibraryPage() {
  return (
    <>
      <Show when="signed-in">
        <Home />
      </Show>
      <Show when="signed-out">
        <Redirect to="/" />
      </Show>
    </>
  );
}

function FeedPage() {
  return (
    <>
      <Show when="signed-in">
        <Feed />
      </Show>
      <Show when="signed-out">
        <Redirect to="/" />
      </Show>
    </>
  );
}

// Helps user's webview stay up-to-date when the signed-in user changes by invalidating the QueryClient cache.
function ClerkQueryClientCacheInvalidator() {
  const { addListener } = useClerk();
  const queryClient = useQueryClient();
  const prevUserIdRef = useRef<string | null | undefined>(undefined);

  useEffect(() => {
    const unsubscribe = addListener(({ user }) => {
      const userId = user?.id ?? null;
      if (prevUserIdRef.current !== undefined && prevUserIdRef.current !== userId) {
        queryClient.clear();
      }
      prevUserIdRef.current = userId;
    });
    return unsubscribe;
  }, [addListener, queryClient]);

  return null;
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={HomeRedirect} />
      <Route path="/library" component={LibraryPage} />
      <Route path="/sign-in/*?" component={SignInPage} />
      <Route path="/sign-up/*?" component={SignUpPage} />
      <Route path="/trips/:id" component={Trip} />
      <Route path="/feed" component={FeedPage} />
      <Route path="/explore" component={Explore} />
      <Route path="/users/:id" component={Profile} />
      <Route>
        <div className="min-h-screen flex items-center justify-center text-center p-6 bg-background">
          <div>
            <h1 className="text-4xl font-serif mb-2">404</h1>
            <p className="text-muted-foreground font-mono uppercase tracking-widest text-xs">Page Not Found</p>
          </div>
        </div>
      </Route>
    </Switch>
  );
}

function ClerkProviderWithRoutes() {
  const [, setLocation] = useLocation();

  return (
    <ClerkProvider
      publishableKey={clerkPubKey}
      proxyUrl={clerkProxyUrl}
      appearance={clerkAppearance}
      signInUrl={`${basePath}/sign-in`}
      signUpUrl={`${basePath}/sign-up`}
      localization={{
        signIn: {
          start: {
            title: 'Welcome back',
            subtitle: 'Sign in to pick up your next story',
          },
        },
        signUp: {
          start: {
            title: 'Start your story',
            subtitle: 'Create an account to turn your trip photos into one',
          },
        },
      }}
      routerPush={(to) => setLocation(stripBase(to))}
      routerReplace={(to) => setLocation(stripBase(to), { replace: true })}
    >
      <QueryClientProvider client={queryClient}>
        <ClerkQueryClientCacheInvalidator />
        <Router />
        <Toaster position="bottom-right" className="font-sans" />
      </QueryClientProvider>
    </ClerkProvider>
  );
}

/** Fixed-duration splash overlay shown on initial mount, layered on top of
 * the real app (which mounts and starts initializing immediately
 * underneath, so nothing is actually delayed) — not tied to Clerk's
 * internal loading state, since this project's Clerk wrapper's exact
 * loading-state API wasn't something that could be verified. */
function useShowSplash(durationMs = 1600) {
  const [showSplash, setShowSplash] = useState(true);
  useEffect(() => {
    const timer = setTimeout(() => setShowSplash(false), durationMs);
    return () => clearTimeout(timer);
  }, []);
  return showSplash;
}

function App() {
  const showSplash = useShowSplash();

  return (
    <TooltipProvider>
      <WouterRouter base={basePath}>
        <AppBackground />
        <ClerkProviderWithRoutes />
      </WouterRouter>
      <AnimatePresence>
        {showSplash && (
          <motion.div exit={{ opacity: 0 }} transition={{ duration: 0.5 }}>
            <LoadingScreen />
          </motion.div>
        )}
      </AnimatePresence>
    </TooltipProvider>
  );
}

export default App;
