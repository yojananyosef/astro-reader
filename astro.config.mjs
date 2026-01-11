import { defineConfig } from 'astro/config';
import preact from '@astrojs/preact';
import tailwindcss from '@tailwindcss/vite';
import node from '@astrojs/node';
import vercel from '@astrojs/vercel/serverless';
import cloudflare from '@astrojs/cloudflare';

const pickAdapter = () => {
  if (process.env.VERCEL) return vercel();
  if (process.env.CF_PAGES || process.env.CLOUDFLARE) return cloudflare();
  return node({ mode: 'standalone' });
};

export default defineConfig({
  output: 'server',
  adapter: pickAdapter(),
  integrations: [preact()],
  image: {
    service: {
      entrypoint: 'astro/assets/services/noop'
    }
  },
  vite: {
    plugins: [tailwindcss()]
  }
});
