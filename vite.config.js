import { defineConfig } from 'vite';
import { angular } from '@analogjs/vite-plugin-angular';
import { copyFileSync } from 'fs';
import { resolve } from 'path';

export default defineConfig(({ command }) => {
  return {
    plugins: [
      angular(),
      // Custom plugin to copy worker script to public directory
      {
        name: 'copy-worker-script',
        buildStart() {
          try {
            copyFileSync(
              resolve('node_modules/@bnch/benchmarker/dist/worker-script.js'),
              resolve('public/worker-script.js')
            );
            console.log('✅ Copied worker-script.js to public directory');
          } catch (err) {
            console.warn('⚠️ Could not copy worker script:', err.message);
          }
        }
      }
    ],
    optimizeDeps: {
      // Exclude the entire library from optimization
      exclude: ['@bnch/benchmarker']
    },
    server: {
      fs: {
        allow: ['..']
      }
    }
  };
});
