import type { APIRoute } from 'astro';
import rawData from "@root/data/daily.json";

type rawDataType = {
	[key: string]: {
		headers: string[];
		content: { note: string; value:string }[][];
	};
}

type data = {
    [key: string]: any;
}

let master: rawDataType = rawData;

export const GET: APIRoute = async ({ url }) => {
    let content: any[] = [];

    // Get the query string parameters
    const params = new URLSearchParams(url.search);

    // Convert params to an object for easier usage
    const queryObject: Record<string, string> = {};
    for (const [key, value] of params.entries()) {
        queryObject[key] = value;
    }

    let x: data = { "name": queryObject["x-axis"], "content": [] }; // header name
    let y: data = { "name": queryObject["y-axis"], "content": [] }; // header name
    if (x["name"] != null && y["name"] != null) {
        // search for index & section of x & y axis
        for (const i in master) {
            for (const a in master[i]["headers"]) {
                if (master[i]["headers"][a] == x["name"]) {
                    x["index"] = a;
                    x["section"] = i;
                }
                if (master[i]["headers"][a] == y["name"]) {
                    y["index"] = a;
                    y["section"] = i;
                }
            }
        }

        // get all data
        for (let i = 0; i < master[x["section"]]["content"].length; i++) {
            content.push({x: master[x["section"]]["content"][i][x["index"]]["value"], y: master[y["section"]]["content"][i][y["index"]]["value"]});
        }

        return new Response(JSON.stringify({ "content": content, "x-axis": x, "y-axis": y}), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
        });
    } else {
        return new Response(JSON.stringify(queryObject), {
            status: 400,
            headers: { 'Content-Type': 'application/json' },
        });
    }
};