// This file should add typescript type declarations for various items (e.g. files with a certain file extension)

// Type declaration for YAML files
declare module "*.yml" {
  const value: any;
  export default value;
}


declare module "config/config.yml" {
  import type { MainConfigSchema } from "@/env";

  const value: MainConfigSchema;
  export default value;
}