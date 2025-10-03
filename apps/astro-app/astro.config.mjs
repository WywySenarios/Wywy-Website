// @ts-check
import { defineConfig } from 'astro/config';

import node from '@astrojs/node';
import react from '@astrojs/react';
import { networkInterfaces } from 'os';
import yaml from '@rollup/plugin-yaml';

import tailwindcss from '@tailwindcss/vite';

const nets = networkInterfaces();
const results = Object.create(null); // Or just '{}', an empty object


// @TODO determine what this actually does :sob emoji:
for (const name of Object.keys(nets)) {
  // @ts-ignore
  for (const net of nets[name]) {
    // Skip over non-IPv4 and internal (i.e. 127.0.0.1) addresses
    // 'IPv4' is in Node <= 17, from 18 it's a number 4 or 6
    const familyV4Value = typeof net.family === 'string' ? 'IPv4' : 4
    if (net.family === familyV4Value && !net.internal) {
      if (!results[name]) {
        results[name] = [];
      }
      results[name].push(net.address);
    }
  }
}

// https://astro.build/config
export default defineConfig({
  site: "https://www.ericzhu.me",
  output: 'server',

  adapter: node({
    mode: 'standalone',
  }),

  server: () => (
    { port: 5322, host: results["Wi-Fi"][0] }
  ),

  vite: {
    plugins: [tailwindcss(), yaml()]
  },

  integrations: [react()]
});