// @ts-check
import { defineConfig, envField } from "astro/config";

import cloudflare from "@astrojs/cloudflare";
import tailwindcss from "@tailwindcss/vite";
import react from "@astrojs/react";
import yaml from "@rollup/plugin-yaml";

// https://astro.build/config
export default defineConfig({
  adapter: cloudflare(),

  vite: {
    plugins: [tailwindcss(), yaml()],
    // build: {
    //   minify: false,
    // },
  },

  env: {
    schema: {
      MAIN_URL: envField.string({
        context: "client",
        access: "public",
        optional: false,
      }),
      DATABASE_URL: envField.string({
        context: "client",
        access: "public",
        optional: false,
      }),
      CACHE_URL: envField.string({
        context: "client",
        access: "public",
        optional: false,
      }),
    },
  },

  integrations: [react()],
});
