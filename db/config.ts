import type { MainConfigSchema } from '@root/src/env';
import { defineDb, defineTable } from 'astro:db';
import * as fs from 'fs';
import * as yaml from 'js-yaml';
import { astroDatatypes } from "@root/src/constants";

function loadYamlFile<T>(filePath: string): T {
  const fileContents = fs.readFileSync(filePath, 'utf-8');
  return yaml.load(fileContents) as T
}

const config = loadYamlFile<MainConfigSchema>("./config/config.yml");

var tables: Record<string, any> = {};

// construct the schema for every table

// console.log(config)
for (const [tableName, table] of Object.entries(config.data.databases)) {
  // construct the schema for one table
  let currentColumns: Record<string, any> = {};

  // for every column,
  for (const [columnName, columnSchema] of Object.entries(table.schema)) {
    // take note of what the column schema is like, inserting the params if specified.
    //@ts-ignore
    currentColumns[columnName] = astroDatatypes[columnSchema.datatype](columnSchema?.params);
  }

  // define the table using the given column schemas.
  tables[tableName] = defineTable({
    columns: currentColumns
  });
}

// https://astro.build/db/config
export default defineDb({
  tables: tables
});
