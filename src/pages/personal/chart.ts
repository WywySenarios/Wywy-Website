import type { APIRoute } from 'astro';
import rawData from "@root/data/daily.json";
import regression from 'regression';

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

        let unprocessedContent = [];
        let datum = [];
        // get all data
        for (let i = 0; i < master[x["section"]]["content"].length; i++) {
            datum = [master[x["section"]]["content"][i][x["index"]]["value"], master[y["section"]]["content"][i][y["index"]]["value"]]
            // content.push({x: datum[0], y: datum[1]});
            unprocessedContent.push(datum);
        }

        // remove datapoints with a missing X or Y value, because that just doesn't make sense to graph!
        // content = content.filter((datum) => datum.x != '' && datum.y != '');
        unprocessedContent = unprocessedContent.filter((datum) => datum[0] != '' && datum[1] != '');

        // save the regression module's life by parsing every integer. IDK why this boi hates me for inputting strings.
        unprocessedContent.map((value: string[], index: number) => {
            content.push([parseInt(value[0]), parseInt(value[1])]);
        })

        // sort by X-axis value
        content.sort((a, b) => {return a[0] - b[0]});

        let regressionResults = regression.linear(content);
        return new Response(JSON.stringify({ "content": content, "x-axis": x, "y-axis": y, "regression": regressionResults }), {
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