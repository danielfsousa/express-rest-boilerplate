import { defineConfig } from 'vite-plus';

export default defineConfig({
  pack: {
    entry: {
      index: 'src/templates-entry.ts',
    },
    outDir: 'dist/templates',
    format: 'esm',
    dts: true,
    deps: {
      alwaysBundle: [/^@starter\/ui/],
    },
  },
});
