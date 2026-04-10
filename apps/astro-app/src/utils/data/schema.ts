/**
 * Module for datatype validation.
 * @TODO complete migration to this file
 * Includes:
 *  * Zod schema generation
 *  * Datatype validation
 */

import type { DataColumn, DescriptorInfo, TableInfo } from "@/types/data";
import { z, ZodNumber, type ZodType } from "zod";
import { toSnakeCase } from "../parse";
import type { GeodeticCoordinate } from "../datatypes/geodetic";

export const TAGGING_TABLE_TAGS_SCHEMA = z.object({
  id: z.number().int(),
  entry_id: z.number().int(),
  tag_id: z.number().int(),
});

export const TAGGING_TABLE_TAG_NAMES_SCHEMA = z.object({
  id: z.number().int(),
  tag_name: z.string(),
});

export const TAGGING_TABLE_TAG_ALIASES_SCHEMA = z.object({
  alias: z.string(),
  tag_id: z.number().int(),
});

export const TAGGING_TABLE_TAG_GROUPS_SCHEMA = z.object({
  id: z.number().int(),
  tag_id: z.number().int(),
  group_name: z.string(),
});

export const FORM_TAGS_ZOD_SCHEMA = z.array(z.string()).nonempty();

export function getZodColumnSchema(columnInfo: DataColumn) {
  let output: ZodType<any>;

  switch (columnInfo.datatype) {
    case "int":
    case "integer":
      output = z.number().int();
      if ("min" in columnInfo && columnInfo.min !== undefined)
        output = (output as ZodNumber).max(columnInfo.min);
      if ("max" in columnInfo && columnInfo.max !== undefined)
        output = (output as ZodNumber).max(columnInfo.max);
      break;
    case "float":
    case "number":
      output = z.number();
      break;
    case "str":
    case "string":
    case "text":
      output = z.string();
      break;
    case "bool":
    case "boolean":
      output = z.coerce.boolean();
      break;
    // THIS IS BY NO MEANS ROBUST
    case "time":
      output = z
        .string()
        .regex(/^(?:[01]\d|2[0-3]):[0-5]\d(?::[0-5]\d(?:\.\d+)?)?Z?$/, {
          message: "Invalid ISO time format",
        });
      break;
    // THIS IS BY NO MEANS ROBUST
    case "date":
      output = z.string().regex(/^[0-9]{1,4}-[0-9]{2}-[0-9]{2}$/, {
        message: "Invalid Date format",
      });
      break;
    // THIS IS BY NO MEANS ROBUST
    case "timestamp":
      output = z.coerce.date();
      break;
    case "enum":
      output = z.enum(columnInfo.values);
      break;
    case "geodetic point":
      output = z.custom<GeodeticCoordinate>(
        (val) => {
          if (typeof val !== "object") return false;
          if (val === null) return true;

          const v = val as GeodeticCoordinate;

          if (typeof v.latitude !== "number" || !Number.isFinite(v.latitude))
            return false;
          if (typeof v.longitude !== "number" || !Number.isFinite(v.longitude))
            return false;

          if (v.latitude < -90 || v.latitude > 90) return false;

          if (v.longitude < -180 || v.longitude > 180) return false;

          // Optional numeric fields (must be number or null if present)
          const optionalNumberOrNull = (n: unknown) =>
            n === null ||
            n === undefined ||
            (typeof n === "number" && Number.isFinite(n));

          if (!optionalNumberOrNull(v.altitude)) return false;
          if (!optionalNumberOrNull(v.accuracy)) return false;
          if (!optionalNumberOrNull(v.altitudeAccuracy)) return false;
          if (!optionalNumberOrNull(v.heading)) return false;
          if (!optionalNumberOrNull(v.speed)) return false;

          return true;
        },
        {
          message: "Invalid geodetic point",
        },
      );
      break;
  }

  // traits that might apply to any column
  // optional
  output = output.optional();

  return output;
}

/**
 * Creates a Zod Object that corresponds with the given entry schema. The zod object excludes the primary tag attribute because it is processed post-submission.
 * @param entrySchema
 * @returns
 */
export function getZodEntrySchema(entrySchema: TableInfo | DescriptorInfo) {
  const outputShape: Record<string, ZodType<any>> = {};

  for (const columnInfo of entrySchema.schema) {
    const columnName = toSnakeCase(columnInfo.name);

    // data column, default values are not injected
    outputShape[columnName] = getZodColumnSchema(columnInfo);

    // comments column
    // @TODO add length restriction
    if (columnInfo.comments) {
      outputShape[`${columnName}_comments`] = z.string().optional();
    }
  }

  return z.object(outputShape);
}

export const TAG_NAMES_DATASET_SCHEMA = z.object({
  columns: z.tuple([z.literal("id"), z.literal("tag_name")]),
  data: z.array(z.tuple([z.number().int(), z.string()])).nonempty(),
});

export type TAG_NAMES_DATASET = z.infer<typeof TAG_NAMES_DATASET_SCHEMA>;

/**
 * Constructs a zod schema for a dataset from a columns schema.
 * @param datasetSchema The schema of the dataset to pull.
 * @param tagging Whether or not the given item table has a related tagging table (i.e. needs primary_tag column)
 * @returns The zod schema forthe dataset to pull.
 */
export function getZodDatasetType(
  datasetSchema: Array<DataColumn>,
  tagging: boolean = false,
) {
  const rowSchema: Array<ZodType<any>> = [];

  // ID column
  rowSchema.push(z.number().int());

  // primary_tag column
  if (tagging) rowSchema.push(z.string().nonempty());

  for (let columnSchema of datasetSchema) {
    switch (columnSchema.datatype) {
      case "date":
      case "time":
      case "timestamp":
        rowSchema.push(
          z.preprocess((val) => {
            if (typeof val === "string" && !val.endsWith("Z")) return val + "Z";
          }, z.coerce.date()),
        );
        break;
      case "geodetic point": // geodetic point
        rowSchema.push(
          z
            .string()
            .nullable()
            .refine((arg: string | null) => {
              if (arg === null) return true;
              const matches = arg.match(
                /^POINT ?\((-?[0-9]+(\.[0-9]+)?) (-?[0-9]+(\.[0-9]+)?)\)$/,
              );

              if (!matches) return false;

              let longitude = parseFloat(matches[1]);
              let latitude = parseFloat(matches[2]);
              if (longitude < -180 || longitude > 180) return false;
              if (latitude < -90 || latitude > 90) return false;

              return true;
            }),
        );
        // latlong accuracy
        rowSchema.push(z.number().positive().nullable());
        // altitude
        rowSchema.push(z.number().nullable());
        // altitude accuracy
        rowSchema.push(z.number().positive().nullable());

        break;
      default:
        rowSchema.push(getZodColumnSchema(columnSchema));
        break;
    }

    if (columnSchema.comments) {
      rowSchema.push(z.string().optional());
    }
  }

  return z
    .object({
      columns: z.array(z.string().nonempty()).length(rowSchema.length),
      data: z.array(z.tuple(rowSchema as [ZodType<any>, ...ZodType<any>[]])),
    })
    .strict();
}
