import { createHash } from 'node:crypto';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { defineConfig, type Plugin } from 'vitest/config';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { viteSingleFile } from 'vite-plugin-singlefile';

// `npm run build:single` emits one self-contained .html file, so the app can still
// be copied to a phone and opened from the filesystem — the way v1 was used.
// `npm run build` is the hosted build (GitHub Pages): it adds the web manifest and a
// service worker so the hosted copy installs to the home screen and opens offline.
const single = process.env.SINGLE_FILE === '1';

function listFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    return statSync(path).isDirectory() ? listFiles(path) : [path];
  });
}

/**
 * Replace each placeholder exactly once, or fail the build. A placeholder that silently
 * stays in sw.js leaves a worker that throws on load, and offline quietly stops working.
 */
function fill(template: string, values: Record<string, string>): string {
  let out = template;
  for (const [token, value] of Object.entries(values)) {
    const count = out.split(token).length - 1;
    if (count !== 1) throw new Error(`sw.template.js: expected "${token}" once, found ${count}`);
    out = out.replace(token, () => value);
  }
  return out;
}

/** Web manifest link + a service worker that precaches exactly what this build emitted. */
function pwa(): Plugin {
  return {
    name: 'mcr-pwa',
    apply: 'build',
    enforce: 'post',
    transformIndexHtml: () => [
      { tag: 'link', attrs: { rel: 'manifest', href: './manifest.webmanifest' }, injectTo: 'head' },
      { tag: 'link', attrs: { rel: 'apple-touch-icon', href: './icons/apple-touch-icon.png' }, injectTo: 'head' },
    ],
    generateBundle(_, bundle) {
      const publicFiles = listFiles('public').map((p) => relative('public', p).split('\\').join('/'));
      const files = [...new Set(['index.html', ...Object.keys(bundle), ...publicFiles])].sort();

      // Version changes whenever any shipped byte changes, so clients drop the old cache.
      const hash = createHash('sha256');
      for (const name of files) {
        hash.update(name);
        const out = bundle[name];
        if (out) hash.update(out.type === 'asset' ? out.source : out.code);
        else if (publicFiles.includes(name)) hash.update(readFileSync(join('public', name)));
      }

      const source = fill(readFileSync('pwa/sw.template.js', 'utf8'), {
        "'mcr-{{VERSION}}'": `'mcr-${hash.digest('hex').slice(0, 12)}'`,
        '/* {{PRECACHE}} */ []': JSON.stringify(['./', ...files.map((f) => `./${f}`)], null, 2),
      });
      this.emitFile({ type: 'asset', fileName: 'sw.js', source });
    },
  };
}

export default defineConfig({
  base: './',
  plugins: [react(), tailwindcss(), ...(single ? [viteSingleFile()] : [pwa()])],
  define: { __PWA__: JSON.stringify(!single) },
  build: { target: 'es2020' },
  test: {
    environment: 'jsdom',
    include: ['src/**/*.test.{ts,tsx}'],
  },
});
