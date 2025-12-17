import { defineConfig } from 'astro/config';
import preact from '@astrojs/preact';
import netlify from '@astrojs/netlify';
import node from '@astrojs/node';
import tailwindcss from '@tailwindcss/vite';

export const resolveAdapterTarget = (env = process.env) => {
  const isNetlify =
    env.NETLIFY === 'true' ||
    env.ASTRO_DEPLOY_TARGET === 'netlify' ||
    typeof env.DEPLOY_URL === 'string';
  return isNetlify ? 'netlify' : 'node';
};

const target = resolveAdapterTarget();
const adapter = target === 'netlify' ? netlify() : node({ mode: 'standalone' });

// https://astro.build/config
export default defineConfig({
  output: 'server',
  adapter,
  integrations: [preact()],

  vite: {
    plugins: [tailwindcss()]
  }
});
