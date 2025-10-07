// @ts-check
import { defineConfig } from 'astro/config';

import node from '@astrojs/node';
import react from '@astrojs/react';
import yaml from '@rollup/plugin-yaml';

import tailwindcss from '@tailwindcss/vite';

// https://astro.build/config
export default defineConfig({
  adapter: node({
    mode: 'standalone',
  }),

  vite: {
    plugins: [tailwindcss(), yaml()]
  },

  integrations: [react()]
});