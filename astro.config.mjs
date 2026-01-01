import { defineConfig } from 'astro/config';
import preact from '@astrojs/preact';
import tailwindcss from '@tailwindcss/vite';

import node from '@astrojs/node';
import vercel from '@astrojs/vercel/serverless';
import cloudflare from '@astrojs/cloudflare';

const pickAdapter = () => {
  if (process.env.VERCEL) {
    console.log('▶ Using Vercel adapter');
    return vercel();
  }

  if (process.env.CF_PAGES || process.env.CLOUDFLARE) {
    console.log('▶ Using Cloudflare adapter');
    return cloudflare({
      platformProxy: {
        enabled: true
      }
    });
  }

  console.log('▶ Using Node adapter');
  return node({ mode: 'standalone' });
};

export default defineConfig({
  // Mejor rendimiento y menor costo en Cloudflare
  output: 'hybrid',

  adapter: pickAdapter(),

  integrations: [
    preact({
      compat: false,
      devtools: import.meta.env.DEV
    })
  ],

  vite: {
    plugins: [tailwindcss()]
  }
});
