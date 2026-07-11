import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Route, Switch, Router as WouterRouter } from 'wouter';
import Home from '@/pages/home';
import Trip from '@/pages/trip';

const queryClient = new QueryClient();

// Keep a minimal layout shell if we want, but currently using per-page layouts
function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/trips/:id" component={Trip} />
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

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}>
          <Router />
        </WouterRouter>
        <Toaster position="bottom-right" className="font-sans" />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
