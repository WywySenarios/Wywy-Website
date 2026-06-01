// @ts-check
import { defineConfig, envField } from "astro/config";
import cloudflare from "@astrojs/cloudflare";
import tailwindcss from "@tailwindcss/vite";
import mdx from "@astrojs/mdx";
import react from "@astrojs/react";
import yaml from "@rollup/plugin-yaml";
import path from "path";
import { fileURLToPath } from "url";

const BUILD_TARGET = process.env.BUILD_TARGET || "web";
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// https://astro.build/config
export default defineConfig({
  ...(BUILD_TARGET === "electron" || BUILD_TARGET === "capacitor"
    ? { output: "static" }
    : { adapter: cloudflare() }),

  vite: {
    plugins: [tailwindcss(), yaml()],
    resolve: {
      alias: {
        "@pipeline": path.resolve(__dirname, "../pipeline/src"),
        "@wywy/http": path.resolve(__dirname, "../http/src"),
      },
    },
    define: {
      "import.meta.env.PUBLIC_MAIN_URL": JSON.stringify(process.env.MAIN_URL),
      "import.meta.env.PUBLIC_DATABASE_URL": JSON.stringify(process.env.DATABASE_URL),
      "import.meta.env.PUBLIC_CACHE_URL": JSON.stringify(process.env.CACHE_URL),
    },
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
