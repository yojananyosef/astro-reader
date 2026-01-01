import { defineConfig } from 'astro/config';
import preact from '@astrojs/preact';
import tailwindcss from '@tailwindcss/vite';
import cloudflare from '@astrojs/cloudflare';

export default defineConfig({
  output: 'static',
  adapter: cloudflare({
    sessions: false
  }),
  integrations: [
    preact({
      compat: false,
      devtools: false
    })
  ],
  vite: {
    plugins: [tailwindcss()]
  }
});
