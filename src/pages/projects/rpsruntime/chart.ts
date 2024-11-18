/*
 * Querystring params:
 * "trialID"=[trial ID 1],[trial ID 2],[...]
 * "sortBy"=[trial ID][algorithmName]
 * 
 * Returns a JSON with an array ("content") with JSONs of each individual person, sorted just as the client pleased (sortBy ascending order)
 */

import type { APIRoute } from 'astro';

import master from "@root/data/RPSRuntime/master.json";
import { L } from '@root/dist/server/chunks/astro/assets-service_g6DNmJna.mjs';


export const GET: APIRoute = async ({ url }) => {
    let output = {};

    // Get the query string parameters
    const params = new URLSearchParams(url.search);

    // Convert params to an object for easier usage
    const queryObject: Record<string, string> = {};
    for (const [key, value] of params.entries()) {
        queryObject[key] = value;
    }

    if (queryObject["trialID"] != null && queryObject["sortBy"]) {
        let trialIDs = queryObject["trialID"].split(",");
        let sortBy = queryObject["sortBy"].split(',')
        let trialToSearchFor = sortBy[0];
        let algorithmToSearchFor = sortBy[1];

        let content = [];
        let temp;
        for (const key in master) {
            type temp = {[key:string]:any};
            temp = {};
            // @ts-ignore
            temp["name"] = master[key]["specs"]["device model"];
            for (const i of trialIDs) {
                // @ts-ignore
                temp[i] = master[key][i];
            }

            content.push(temp);
        }

        // sort x axis (rank) by runtime (increasing order)
        content.sort(function (a, b) {
            // @ts-ignore
            return a[trialToSearchFor][algorithmToSearchFor] - b[trialToSearchFor][algorithmToSearchFor]
        });

        return new Response(JSON.stringify({"content": content}), {
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