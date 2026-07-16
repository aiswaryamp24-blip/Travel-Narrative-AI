import { vi } from 'vitest';

// The app wires up real Clerk middleware (session cookies, JWKS, the Clerk
// proxy) which has no meaning in a test process with no Clerk instance
// configured. Replace it with a trivial stand-in that trusts a test-only
// `x-test-user-id` header, so routes exercise real auth *gating* logic
// (requireAuth / ownership checks) without needing a live Clerk session.
vi.mock('@clerk/express', () => ({
  clerkMiddleware: () => (_req: unknown, _res: unknown, next: () => void) => next(),
  getAuth: (req: { headers: Record<string, string | string[] | undefined> }) => {
    const header = req.headers['x-test-user-id'];
    const userId = Array.isArray(header) ? header[0] : header;
    return { userId: userId || null };
  },
  clerkClient: {
    users: {
      getUser: vi.fn(),
    },
  },
}));

vi.mock('@clerk/shared/keys', () => ({
  publishableKeyFromHost: () => 'pk_test_stub',
}));
