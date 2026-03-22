export function step_within_selector(
  lowerBound: number,
  upperBound: number,
  datasetMatrix: Array<Array<unknown>>,
): Array<Array<unknown>> {
  if (datasetMatrix.length == 0)
    throw TypeError("Cannot select data from a dataset with no columns.");
  const numRows = datasetMatrix[0].length;
  const independentColumn = datasetMatrix[0];

  // check that all vectors have the same length
  for (const column of datasetMatrix) {
    if (column.length != numRows)
      throw TypeError(`Vector length mismatch. Expected length ${numRows}`);
  }

  const output: Array<Array<unknown>> = [];

  for (let i = 0; i < numRows; i++) {
    const independentValue = Number(independentColumn[i]);
    if (isNaN(independentValue))
      throw TypeError(
        `Expected number or bigint independent values but received ${typeof independentColumn[i]}`,
      );
    if (lowerBound <= independentValue && independentValue <= upperBound) {
      output.push(
        datasetMatrix.map((column: Array<unknown>) => column[i]).slice(1),
      );
    }
  }

  return output;
}
