// imports
import express from 'express';
import cors from 'cors';
// import bodyParser from 'body-parser';
import { handler as ssrHandler } from '../dist/server/entry.mjs';

// constants
// const port = 5322;
const app = express();
// const sleepLength = 100; // sleep length in ms for the client; separation between test cases

app.use(cors()); // allow input from ANY ip address
// app.use(bodyParser.json()); // allow JSON input (related to the POST function)

// full express server configs:
// import path from 'path';
// import { fileURLToPath } from "url";
// const __filename = fileURLToPath(import.meta.url);
// const __dirname = path.dirname(__filename);
// app.use(express.static(path.join(__dirname, "dist"))); // allow static file access

const base = '/';
app.use(base, express.static('dist/client/'));
app.use(ssrHandler);

// app.use(express.urlencoded({
//   extended: true, // use complex algorithm for large amounts of nested data?
//   limit: 10000, // limit in bit thingies (a 0 or 1)
//   parameterLimit: 5 // max # items
// }));

// app.listen(port, () => {
//   console.log(`Server online at port ${port}.`);
// });