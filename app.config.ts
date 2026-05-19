import { defineConfig } from '@tanstack/react-start/config';

export default defineConfig({
  vite: {
    plugins: [],
  },
  server: {
    preset: 'netlify',
  },
  tsr: {
    routesDirectory: './src/routes',
    generatedRouteTree: './src/routeTree.gen.ts',
  },
});
