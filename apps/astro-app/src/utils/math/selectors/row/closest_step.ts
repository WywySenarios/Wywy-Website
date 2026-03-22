export function closest_step_selector(
  value: number,
  datasetMatrix: Array<Array<unknown>>,
): Array<unknown> {
  if (datasetMatrix.length == 0)
    throw TypeError("Cannot select data from a dataset with no columns.");
  const numRows = datasetMatrix[0].length;
  const independentColumn = datasetMatrix[0];

  // check that all vectors have the same length
  for (const column of datasetMatrix) {
    if (column.length != numRows)
      throw TypeError(`Vector length mismatch. Expected length ${numRows}`);
  }

  // check if there is data to return
  if (numRows == 0)
    throw TypeError("Cannot select data from an empty dataset.");

  let closestIndex = 0;
  let smallestDistance = Number.MAX_VALUE;
  for (let i = 0; i < numRows; i++) {
    const independentValue = Number(independentColumn[i]);
    if (isNaN(independentValue))
      throw TypeError(
        `Expected number or bigint independent values but received ${typeof independentColumn[i]}`,
      );

    const currentDistance = Math.abs(independentValue - value);

    if (currentDistance < smallestDistance) {
      smallestDistance = currentDistance;
      closestIndex = i;
    }
  }

  return datasetMatrix
    .map((column: Array<unknown>) => column[closestIndex])
    .slice(1);
}
