import { fileURLToPath } from 'node:url';
import { astryxStylex } from '@astryxdesign/build/vite';
import { tanstackStart } from '@tanstack/react-start/plugin/vite';
import { varlockVitePlugin } from '@varlock/vite-integration';
import viteReact from '@vitejs/plugin-react';
import type { Plugin, PluginOption } from 'vite';
import { defineConfig } from 'vite-plus';

const srcDir = fileURLToPath(new URL('./src', import.meta.url));

function isVitePlugin(value: unknown): value is Plugin {
  return (
    typeof value === 'object' && value !== null && 'name' in value && typeof value.name === 'string'
  );
}

function toVitePlugins(value: unknown): Array<PluginOption> {
  if (Array.isArray(value)) {
    return value.flatMap((entry) => toVitePlugins(entry));
  }
  if (isVitePlugin(value)) {
    return [value];
  }
  return [];
}

const varlockPlugins = toVitePlugins(varlockVitePlugin());

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
  resolve: {
    alias: {
      '#': srcDir,
    },
  },
  plugins: [...varlockPlugins, ...astryxPlugins, tanstackStart(), viteReact()],
});
