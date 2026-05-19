// src/router.tsx
import { createRouter } from '@tanstack/react-router';
import { routeTree } from './routeTree.gen';

// Create the router instance
const router = createRouter({
  routeTree,
  defaultPreload: 'intent',
  scrollRestoration: true,
});

// Named export required by TanStack Start
export const getRouter = () => router;

// Default export (kept for compatibility)
export default router;

// TypeScript type registration
declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}
