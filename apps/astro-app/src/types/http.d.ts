export type JSONValue =
  | string
  | number
  | boolean
  | null
  | { [key: string]: JSONValue }
  | JSONValue[];

// Internal names that distinguish each possible origin.
// Origin names are based off service names.
export type OriginName = "master-database" | "cache";
