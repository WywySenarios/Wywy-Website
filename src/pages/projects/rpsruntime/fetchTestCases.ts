export const prerender = true;

import type { APIRoute } from 'astro';

const sleepLength = 50;
const testCaseNames = [
  "100",
  "1000",
  "10000",
  "100000",
  "1000000"];

function randomizeTestCases(numGames: number) {
  let output = "";

  for (let i = 0; i < numGames; i++) {
    output += Math.round(1 + Math.random() * 2).toString() + Math.round(1 + Math.random() * 2).toString();
  }

  //console.log("Test cases generated: " + output)
  return output;
}

export const GET: APIRoute = () => {
  let output = JSON.parse("{}");
  output["sleepLength"] = sleepLength;

  for (const i in testCaseNames) {
    output[testCaseNames[i].split(".")[0]] = randomizeTestCases(testCaseNames[i].split(".")[0] as unknown as number);
  }

  return new Response(
    JSON.stringify(output)
  )
}