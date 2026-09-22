import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { viteSingleFile } from 'vite-plugin-singlefile';

// `npm run build:single` emits one self-contained .html file, so the app can still
// be copied to a phone and opened from the filesystem — the way v1 was used.
const single = process.env.SINGLE_FILE === '1';

export default defineConfig({
  base: './',
  plugins: [react(), tailwindcss(), ...(single ? [viteSingleFile()] : [])],
  build: { target: 'es2020' },
  test: {
    environment: 'jsdom',
    include: ['src/**/*.test.{ts,tsx}'],
  },
});
