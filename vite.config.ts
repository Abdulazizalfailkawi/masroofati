import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';

// One id per build. It is baked into the bundle (__BUILD_ID__) and also published as
// /version.json, so a running app can tell when a newer deployment is available.
const BUILD_ID = Date.now().toString(36);

const versionFile = () => ({
  name: 'masroofati-version-file',
  generateBundle(this: any) {
    this.emitFile({
      type: 'asset',
      fileName: 'version.json',
      source: JSON.stringify({v: BUILD_ID}),
    });
  },
});

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss(), versionFile()],
    define: {
      __BUILD_ID__: JSON.stringify(BUILD_ID),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
