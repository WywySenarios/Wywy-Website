// @ts-check
import { defineConfig, envField } from "astro/config";
import cloudflare from "@astrojs/cloudflare";
import tailwindcss from "@tailwindcss/vite";
import mdx from "@astrojs/mdx";
import react from "@astrojs/react";
import yaml from "@rollup/plugin-yaml";

const BUILD_TARGET = process.env.BUILD_TARGET || "web";

// https://astro.build/config
export default defineConfig({
  ...(BUILD_TARGET === "electron" || BUILD_TARGET === "capacitor"
    ? { output: "static" }
    : { adapter: cloudflare() }),

  vite: {
    plugins: [tailwindcss(), yaml()],
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
      BUILD_TARGET: envField.string({
        context: "client",
        access: "public",
        optional: true,
        default: "web",
      }),
    },
  },

  integrations: [mdx(), react()],
});
