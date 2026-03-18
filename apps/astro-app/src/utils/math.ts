import { create, all, typed } from "mathjs";

// start - Datatype Coercion
export type NumberLike = number | Date;

export type NumberLikeType = "number" | "Date";

export function findNumberLikeType(value: NumberLike): NumberLikeType {
  switch (typeof value) {
    case "number":
      return "number";
    case "object":
      return "Date";
  }
}

export function toNumber(value: NumberLike): number {
  switch (typeof value) {
    case "number":
      return value;
    case "object":
      return value.getTime();
  }
}
// end - Datatype Coercion

export const MATH_CONFIG = {};

const MATH = create(all, MATH_CONFIG);

// load in all custom functions

// transformations
import {
  number_subtraction,
  array_subtraction,
} from "./math/transformations/basic";

MATH.import(
  {
    subtraction: typed("subtraction", {
      "number, ...number": number_subtraction,
      "Array, ...Array": array_subtraction,
    }),
  },
  { wrap: true },
);

export { MATH };

// selectors
