/// <reference path="../.astro/types.d.ts" />

import type { DatabaseInfo } from "./types/data";

// START - environment variables
interface ImportMetaEnv {
  readonly MAIN_URL: string;
  readonly DATABASE_URL: string;
  readonly CACHE_URL: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
// END - environment variables

declare module "env" {
  const config: MainConfigSchema;
  export = config;
}

export interface MainConfigSchema {
  websiteTitle: string; // Title of the website (e.g. "EZ & Wywy's Website!")
  websiteIcon: string; // path (relative to the public folder) for the website icon (e.g. "/favicon.svg")
  python: string; // path to python executeable to be used (e.g. ".venv\\Scripts\\python.exe")
  features: {
    // enable/disbable features
    dataHarvesting: boolean;
  };
  // govern website content
  websiteData: {
    schedule: string; // schedule to be displayed (e.g. default)
    blog: {
      homepage: {
        pinned: Array<string>; // pinned posts (urls?)
      };
    };
    Senarios: {
      homepage: {
        pinned: Array<string>; // @TODO explain
      };
    };
  };
  data: Array<DatabaseInfo>;
}
