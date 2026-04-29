import { type NumberLike, toNumber } from "@utils/math";

export function number_subtraction(x: number, ...args: number[]) {
  return x - args.reduce((accumulatedValue, value) => accumulatedValue + value);
}

export function array_subtraction(
  x: Array<NumberLike>,
  // Matrix of vectors
  ...args: Array<Array<Array<NumberLike>>>
) {
  const expectedLength = x.length;

  // check args
  for (const arg of args[0]) {
    if (arg.length != expectedLength) {
      throw new TypeError(
        "Array length mismatch: array subtraction can only occur on arrays of the same length.",
      );
    }
  }

  const output = x.map((value, index) => {
    let output = toNumber(value);
    for (const arg of args[0]) output -= toNumber(arg[index]);
    return output;
  });

  return output;
}
