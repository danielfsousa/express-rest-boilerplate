import { astryxStylex } from '@astryxdesign/build/vite';
import viteReact from '@vitejs/plugin-react';
import { defineConfig } from 'vite-plus';

export default defineConfig({
  plugins: [...astryxStylex(), viteReact()],
  resolve: {
    dedupe: ['react', 'react-dom'],
  },
});
