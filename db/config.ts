import type { MainConfigSchema } from '@root/src/env';
import { defineDb, defineTable, column } from 'astro:db';
import * as fs from 'fs';
import * as yaml from 'js-yaml';

function loadYamlFile<T>(filePath: string): T {
  const fileContents = fs.readFileSync(filePath, 'utf-8');
  return yaml.load(fileContents) as T
}

const config = loadYamlFile<MainConfigSchema>("./config/config.yml");

// maps strings to the Astro datatypes accepted for Astro DB.
const astroDatatypes: Record<string, (params?: Record<any, any>) => any> = {
  "date": column.date,
  "integer": column.number,
  "int": column.number,
  "float": column.number,
  "number": column.number,
  "string": column.text,
  "str": column.text,
  "text": column.text,
  "json": column.json,
  "JSON": column.json,
  "bool": column.boolean,
  "boolean": column.boolean,
}

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
