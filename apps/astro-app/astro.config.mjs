// @ts-check
import { defineConfig } from 'astro/config';

import cloudflare from '@astrojs/cloudflare';
import tailwindcss from '@tailwindcss/vite';
import react from '@astrojs/react';
import yaml from '@rollup/plugin-yaml';

// https://astro.build/config
export default defineConfig({
  adapter: cloudflare(),

  vite: {
    plugins: [tailwindcss(), yaml()],
    // build: {
    //   minify: false,
    // },
  },

  integrations: [react()]
});