import { astryxStylex } from '@astryxdesign/build/vite';
import { tanstackStart } from '@tanstack/react-start/plugin/vite';
import viteReact from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

const astryxPlugins = astryxStylex().map((plugin) =>
  plugin.name === 'astryx-build-layer-split'
    ? {
        ...plugin,
        applyToEnvironment(environment: { name: string }) {
          return environment.name === 'client';
        },
      }
    : plugin,
);

export default defineConfig({
  plugins: [...astryxPlugins, tanstackStart(), viteReact()],
});
