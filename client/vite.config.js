import fs from 'node:fs';
import path from 'node:path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

/**
 * Read the project-root .env (shared with the API) ourselves. Vite's own loader would also pick up
 * NODE_ENV=development from that file and silently build React in development mode.
 */
function readRootEnv() {
  const file = path.resolve(__dirname, '..', '.env');
  const out = {};
  if (!fs.existsSync(file)) return out;
  for (const line of fs.readFileSync(file, 'utf8').split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/);
    if (!m) continue;
    out[m[1]] = m[2].replace(/^(['"])(.*)\1$/, '$2');
  }
  return out;
}

export default defineConfig(() => {
  const env = { ...readRootEnv(), ...process.env };
  // Only public VITE_* values reach the browser bundle.
  const define = Object.fromEntries(
    Object.entries(env)
      .filter(([k]) => k.startsWith('VITE_'))
      .map(([k, v]) => [`import.meta.env.${k}`, JSON.stringify(v)]),
  );

  return {
    plugins: [react()],
    define,
    server: {
      port: 5173,
      proxy: {
        '/api': { target: `http://localhost:${env.PORT || 4000}`, changeOrigin: true },
      },
    },
    build: {
      target: 'es2019',
      rollupOptions: {
        output: {
          manualChunks: { react: ['react', 'react-dom', 'react-router-dom'] },
        },
      },
    },
  };
});
