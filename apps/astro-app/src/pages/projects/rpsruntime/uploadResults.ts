import type { APIRoute } from 'astro';
import { readFileSync, writeFileSync } from "node:fs";
import { UAParser } from "ua-parser-js";


// Do NOT use "data" or "type" as the incomingIndex variable
function appendJSON(filePath: string, incomingIndex: string, infoToAdd: JSON) {
  let data;
  try {
    const dataFile = readFileSync(filePath);
    data = JSON.parse(dataFile.toString());
    // console.log(`Data (before): ${JSON.stringify(data)}`);
  } catch (error: any) {
    if (error.code === 'ENOENT') {
      data = {};
    } else {
      console.log("Oops! Couldn't read the file.");
      throw error;
    }
  }
  // data is only printed before because the data afterwards may be accessed through the file itself or the next write function's state before writing.
  data[incomingIndex] = infoToAdd;

  //remove weird readFileSync behaviour
  delete data["type"];
  delete data["data"];
  // console.log(`Data (after): ${JSON.stringify(data)}`);

  // come back and see if the removing the let statement broke anything
  writeFileSync(filePath, JSON.stringify(data));
}


export const POST: APIRoute = async ({ request }) => {
  // console.log("Received a POST request!!!");
  let userInfo = (new UAParser(request.headers.get("user-agent") || "")).getResult();

  try {
    let userID;
    let data = await request.json(); // Parse JSON data from the request body

    // Perform actions with the received data (e.g., save to a database)
    console.log("Receiving Data:", data, ":END-Receiving Data"); // note what input has been given in logs
    // add user-agent related specs
    data["specs"]["browser"] = userInfo["browser"];
    data["specs"]["engine"] = userInfo["engine"]; // js engine
    data["specs"]["os"]["name"] = userInfo["os"]["name"];

    // some weird behaviour with Windows causes window 11 & 10 to be indifferentiable to the server
    // Add server data ONLY IF client does not self-report
    if (data["specs"]["os"]["version"] == "") {
      try {
        data["specs"]["os"]["version"] = userInfo.os.version;
      } catch {}
    }

    // contextualize some data by adding units PLEASE ADD IF STATEMENTS LATER
    // some people have a habit of adding "GHz" to their information without the server needing to step in!
    if (data["specs"]["CPU clock speed"].substring(data["specs"]["CPU clock speed"].length - 1 - 3, data["specs"]["CPU clock speed"].length - 1) != "GHz") {
      data["specs"]["CPU clock speed"] += "GHz";
    }
    data["specs"]["memory"] += "GB";

    // generate a UID for the user's input based on their username & the current time
    let username = data["name"];
    userID = username + "_" + Date.now().toString(); // ID is always unique even if the same person comes back to the program at a later date
    delete data["name"];
  // add all data to master file
  appendJSON("data\\RPSRuntime\\master.json", userID, data);
  
    return new Response(JSON.stringify({ success: true, message: "Data received & stored successfully" }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error handling POST request:', error);
    return new Response(JSON.stringify({ success: false, message: "Error processing request" }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};