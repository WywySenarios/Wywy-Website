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

// selectors
import { step_within_selector } from "./math/selectors/matrix/step_within";
MATH.import(
  {
    step_within: typed("step_within", {
      "number, number, Array": step_within_selector,
    }),
  },
  { wrap: true },
);

import { closest_step_selector } from "./math/selectors/row/closest_step";
MATH.import(
  {
    closest_step: typed("closest_step", {
      "number, Array": closest_step_selector,
    }),
  },
  { wrap: true },
);

export { MATH };

// selectors
