import { defineConfig } from 'vite';
import { tanstackStart } from '@tanstack/react-start/plugin/vite';
import viteReact from '@vitejs/plugin-react';
import viteTsConfigPaths from 'vite-tsconfig-paths';
import tailwindcss from '@tailwindcss/vite';
import netlify from '@netlify/vite-plugin-tanstack-start';

export default defineConfig({
  plugins: [
    viteTsConfigPaths({ projects: ['./tsconfig.json'] }),
    tailwindcss(),
    netlify(),
    tanstackStart(),
    viteReact(),
  ],
  ssr: {
    noExternal: ['file-saver'],
  },
});
