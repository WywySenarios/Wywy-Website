export type JSONValue =
  | string
  | number
  | boolean
  | null
  | { [key: string]: JSONValue }
  | JSONValue[];

export type OriginName = "master-database" | "cache";

export type EndpointFactory = (origin: OriginName) => string;
export type EndpointRecord = Record<OriginName, string>;
