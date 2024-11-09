// import
import express from 'express';
// import urlLibrary from 'url';
import cors from 'cors';
// const multer = require('multer');
import bodyParser from 'body-parser';
import UAParsing from 'ua-parser-js';
import fs from 'fs';
// import childProcess from "child_process";
import { handler as ssrHandler } from './dist/server/entry.mjs';


function randomizeTestCases(numGames) {
  let output = "";

  for (let i = 0; i < numGames; i++) {
    output += Math.round(1 + Math.random() * 2).toString() + Math.round(1 + Math.random() * 2).toString();
  }

  //console.log("Test cases generated: " + output)
  return output;
}

// constants
const port = 5322;
const app = express();
const sleepLength = 100; // sleep length in ms for the client; separation between test cases

app.use(cors()); // allow input from ANY ip address
app.use(bodyParser.json()); // allow JSON input (related to the POST function)

// full express server configs:
// import path from 'path';
// import { fileURLToPath } from "url";
// const __filename = fileURLToPath(import.meta.url);
// const __dirname = path.dirname(__filename);
// app.use(express.static(path.join(__dirname, "dist"))); // allow static file access

const base = '/';
app.use(base, express.static('dist/client/'));
app.use(ssrHandler);

app.use(express.urlencoded({
  extended: true, // use complex algorithm for large amounts of nested data?
  limit: 10000, // limit in bit thingies (a 0 or 1)
  parameterLimit: 5 // max # items
}));

// const upload = multer({ dest: 'files/' });


// GET requests for test cases
function respondTestCases(req, res, numTestCases) {
  var data = { "Content": randomizeTestCases(numTestCases), "sleepLength": sleepLength };

  console.log("Sending test cases...");

  res.writeHead(200, { "Content-Type": "application/json" });
  res.write(JSON.stringify(data));
  res.end();
}

app.get('/testCases/100', (req, res) => { respondTestCases(req, res, 100); });
app.get('/testCases/1000', (req, res) => { respondTestCases(req, res, 1000); });
app.get('/testCases/10000', (req, res) => { respondTestCases(req, res, 10000); });
app.get('/testCases/100000', (req, res) => { respondTestCases(req, res, 100000); });
app.get('/testCases/1000000', (req, res) => { respondTestCases(req, res, 1000000); });
app.get('/testCases/10000000', (req, res) => { respondTestCases(req, res, 10000000); });

app.get('/graph', (req, res) => {
  let urlparams = new URLSearchParams((new URL("http:localhost:" + port + req.originalUrl)).searchParams);
  try {
    sendGraph(req, res, urlparams.get("trialID"), urlparams.get("algorithmName"));
  } catch (error) {
    console.log("Error happened when 'sendGraph' function was called");
    res.write({ "content": [] });
    res.status(213);
    res.end();
  }
});

function sendGraph(req, res, trialID, algorithmName) {
  let masterData = JSON.parse(fs.readFileSync("data\\RPSRuntime\\" + trialID + ".json").toString());
  let output = Array(0);

  for (const key in masterData) {
    // runtime & Label (device model)
    output.push([masterData[key][algorithmName], masterData[key]["specs"]["device model"]]);
  }

  // sort x axis (rank) by runtime (increasing order)
  output.sort(function (a, b) { return a[0] - b[0] });

  res.write(JSON.stringify({ "content": output }));
  res.status(200);
  res.end();
}


// Do NOT use "data" or "type" as the incomingIndex variable
function appendJSON(filePath, incomingIndex, infoToAdd) {
  let data;
  try {
    const dataFile = fs.readFileSync(filePath);
    data = JSON.parse(dataFile.toString());
    console.log(`Data (before): ${JSON.stringify(data)}`);
  } catch (error) {
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
  const output = fs.writeFileSync(filePath, JSON.stringify(data));
}


// POST request for the user to upload RPS runtime results
app.post('/upload', (req, res) => {
  // look for the user's info using user-agent s
  let userInfo = (new UAParsing.UAParser(req.headers["user-agent"])).getResult();
  let userID;
  let data;

  try {
    data = req.body;
    console.log(`Receiving Data:${JSON.stringify(data)}:END-Receiving Data`); // note what input has been given in logs
    // add user-agent related specs
    data["specs"]["browser"] = userInfo["browser"];
    data["specs"]["engine"] = userInfo["engine"]; // js engine
    data["specs"]["os"]["name"] = userInfo["os"]["name"];
    // some weird behaviour with Windows causes window 11 & 10 to be indifferentiable to the server
    // Add server data ONLY IF client does not self-report
    if (data["specs"]["os"]["version"] == "") {
      data["specs"]["os"]["version"] = userInfo["version"];
    }

    // contextualize some data by adding units
    // some people have a habit of adding "GHz" to their information without the server needing to step in!
    if (data["specs"]["CPU clock speed"].substring(data["specs"]["CPU clock speed"].length - 1 - 3, data["specs"]["CPU clock speed"].length - 1) != "GHz") {
      data["specs"]["CPU clock speed"] += "GHz";
    }
    data["specs"]["memory"] += "GB";

    // generate a UID for the user's input based on their username & the current time
    let username = data["name"];
    userID = username + "_" + Date.now().toString(); // ID is always unique even if the same person comes back to the program at a later date
    delete data["name"];
  } catch (error) { // erroneous user input
    console.log(error);
    res.status(213);
    res.end();
    return;
  }
  // add all data to master file
  appendJSON("data\\RPSRuntime\\master.json", userID, data);

  // add data to individual trial files
  let currentData;
  for (const key in data) {
    if (key == "specs") {
      continue;
    }

    try {
      currentData = data[key];
      currentData["specs"] = data["specs"]; // add specs for extra context
      appendJSON("data\\RPSRuntime\\" + key + ".json", userID, currentData);
    } catch (error) {
      console.log("User tried to run a test case that the server didn't recognize?");
    }
  }

  // the code below is disabled because graph.js already generates graphs,
  // so I don't need 
  // setup & run bash file
  // const bash_run = childProcess.spawn(
  //   'cmd.exe', ['/c', "graphs.bat"], { env: process.env });
  // bash_run.stdout.on('data', function (data) {
  //   console.log('graphs.bat: ' + data);
  // });
  // bash_run.stderr.on('data', function (data) {
  //   console.log('graphs.bat ERROR: ' + data);
  // });
  // END setup & run bash file

  // Tell client that their data has been successfully sent & stored
  res.status(201);
  res.end();
});

app.listen(port, () => {
  console.log(`Server online at port ${port}.`);
});