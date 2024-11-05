/*
 * games: [[p1, p2], etc.]
 */
const progressBar = document.getElementById("status");
const progressLabel = document.getElementById("statusLabel")


let sleepLength = 0; // sleep length in ms
let testCases = {
	"100": null,
	"1000": null,
	"10000": null,
	"100000": null,
	"1000000": null
}

function defaultTestCases() {
	return "111213212223313233";
}

// length should be a STRING
async function serverTestCases(length) {
	try {
		let response = await fetch("/testCases/" + length, {
			method: "GET"
		});

		const json = await response.json();
		// console.log(`Received Test Cases ${json["Content"]}`);
		sleepLength = json["sleepLength"];
		return await processTestCases(json["Content"]);
	} catch (error) {
		console.error(`${error.message}\n\nProceeding to use default test cases...`);
		return await defaultTestCases();
	}
}

async function processTestCases(gamesStr) {
	// console.log(`Test cases to process: ${gamesStr}`);
	let output = Array(0);
	let next = Array(2);
	for (let i = 0; i < gamesStr.length / 2; i++) {
		switch (gamesStr.charAt(2 * i)) {
			case "1":
				next[0] = 1;
				break;
			case "2":
				next[0] = 2;
				break;
			case "3":
				next[0] = 3;
				break;
			default:
				continue;
		}
		switch (gamesStr.charAt(2 * i + 1)) {
			case "1":
				next[1] = 1;
				break;
			case "2":
				next[1] = 2;
				break;
			case "3":
				next[1] = 3;
				break;
			default:
				continue;
		}

		await output.push([next[0], next[1]]);
	}

	return output;
}

async function runInit() {
	progressLabel.innerHTML = "Grabbing Server Test Cases...";
	let testCasesToGrab = ["100", "1000", "10000", "100000", "1000000"];
	for (const i of testCasesToGrab) {
		progressLabel.innerHTML = "Grabbing Test Case for " + i + " cases trial...";
		testCases[i] = await serverTestCases(i);
	}

	progressLabel.innerHTML = "Grabbing Specs...";
	let results = await {
		"specs": {
			"device model": document.getElementById("device model").value,
			"system type": document.getElementById("system type").value,
			"processor": document.getElementById("processor").value,
			"CPU clock speed": document.getElementById("CPU clock speed").value,
			"os": { "version": document.getElementById("OS version").value },
			"modifications": document.getElementById("modifications").value,
			"website priority": document.getElementById("website priority").value,
			"device age": document.getElementById("device age").value,
			"memory": document.getElementById("memory").value
		},
		"name": document.getElementById("name").value,
		"100": await run("100", ""),
		"1000": await run("1000", ""),
		"10000": await run("10000", ""),
		// "100000": await run("100000", ""),
		"100000.1": await run("100000", ".1"),
		"100000.2": await run("100000", ".2"),
		"100000.3": await run("100000", ".3"),
		"100000.4": await run("100000", ".4"),
		"100000.5": await run("100000", ".5"),
		"100000.6": await run("100000", ".6"),
		"100000.7": await run("100000", ".7"),
		"100000.8": await run("100000", ".8"),
		"100000.9": await run("100000", ".9"),
		"100000.10": await run("100000", ".10"),
		"1000000.1": await run("1000000", ".1"),
		"1000000.2": await run("1000000", ".2"),
		"1000000.3": await run("1000000", ".3"),
		"1000000.4": await run("1000000", ".4"),
		"1000000.5": await run("1000000", ".5"),
		"1000000.6": await run("1000000", ".6"),
		"1000000.7": await run("1000000", ".7"),
		"1000000.8": await run("1000000", ".8"),
		"1000000.9": await run("1000000", ".9"),
		"1000000.10": await run("1000000", ".10")
	}

	progressLabel.innerHTML = "Gathering Results...";

	// send results to server
	console.log("Data to send: " + JSON.stringify(results));

	// user self-reports using Windows 11 instead of 10?
	console.log(document.getElementById("windows11").value);
	if (document.getElementById("windows11").checked == true) {
		results["os"] = {
			"name": "Windows 11"
		};
	}

	progressLabel.innerHTML = "Sending Results to Server...";

	fetch("/upload", {
		method: "POST",
		body: await JSON.stringify(results),
		headers: {
			"Content-type": "application/json; charset=UTF-8"
		}
	});

	progressLabel.innerHTML = "Done!";
}

// run all algorithms in a random order with "games" as the test cases
async function run(numTestCases, elementName) {
	let games = testCases[numTestCases];
	// console.log("Test cases: " + games);

	let algorithms = [["standard", RPSstandard], ["optimized", RPSoptimized], ["zeroes", RPSzeroes], ["polynomial", RPSnoComparisons]];
	let results = {
		"runtime": {
			"standard": NaN,
			"optimized": NaN,
			"zeroes": NaN,
			"polynomial": NaN
		},
		"executionResults": {
			"standard": null,
			"optimized": null,
			"zeroes": null,
			"polynomial": null
		}
	};

	await sleep(sleepLength); // sleep to ensure that CPU usage is spread out and does not severely impact runtime

	// run all algorithms in a random order while keeping track of runtime
	let index = 0;
	let output = null;
	let userOutput = null;
	let currentLength = algorithms.length;
	while (currentLength > 0) {
		index = Math.round(Math.random() * algorithms.length); // pick a random algorithm to run
		if (algorithms[index] == null) {
			continue;
		} else {
			progressLabel.innerHTML = "Testing " + algorithms[index][0] + " algorithm with " + numTestCases + " cases";
			console.log(`Testing algorithm: ${algorithms[index][0]}`);
			currentLength--;
		}
		// console.log(`Index: ${index}, length: ${algorithms.length}`);
		// console.log(algorithms[index]);

		await sleep(sleepLength); // sleep to ensure that CPU usage is spread out and does not severely impact runtime
		output = await algorithms[index][1](games);
		output[0] = Math.round(output[0] * 1000) / 1000 // round to 1 decimal place??

		// console.log(`Output: ${output}`);
		userOutput = document.getElementById(algorithms[index][0] + numTestCases + elementName);
		console.log(algorithms[index][0] + numTestCases + elementName);
		// tell user that the program is running!
		userOutput.innerHTML = output[0]; // runtime result
		progressBar.value = parseInt(progressBar.value) + 1;

		results["runtime"][algorithms[index][0]] = output[0];
		results["executionResults"][algorithms[index][0]] = output[1];
		if (await ! await delete algorithms[index]) {
			console.log("Failed to delete array element. \"run()\" function failed. Aborting...");
			return;
		}
	}
	// μ

	// console.log(`Execution results: ${results[executionResults]}`);
	// prevent a packet that is too large to process:
	results["executionResults"] = null;


	return results["runtime"];
}

async function sleep(ms) {
	await new Promise(r => setTimeout(r, ms));
}



// Below are RPS functions. They return an array with [runtime, execution results].

async function RPSstandard(games) {
	let results = Array(0);

	runtime = await performance.now();
	for (let i = 0; i < games.length; i++) {
		if (games[i][0] == games[i][1]) { // tie
			results.push(0);
		} else if (games[i][0] == 1) { // p1 rock
			if (games[i][1] == 2) { // p2 papers
				results.push(2);
			} else {
				results.push(1);
			}
		} else if (games[i][0] == 2) { // p1 paper
			if (games[i][1] == 1) { // p2 rock
				results.push(1);
			} else {
				results.push(2);
			}
		} else { // p1 scissors
			if (games[i][1] == 2) { // p2 paper
				results.push(1);
			} else {
				results.push(2);
			}
		}
	}

	runtime = await performance.now() - runtime;
	return [runtime, results];
}

// Returns an array with the execution results
async function RPSoptimized(games) {
	let results = Array(0);

	runtime = await performance.now();
	for (let i = 0; i < games.length; i++) {
		if (games[i][0] == games[i][1]) { // tie
			results.push(0);
		} else if (games[i][0] == (-3 * games[i][1] * games[i][1] + 11 * games[i][1] - 4) / 2) { // P1 wins
			// the above quadratic equation converts p2 into a value equal to p1 when P1 wins.
			// this means that the quadratic equation has points (1,3), (2,1), and (3,2)
			results.push(1);
		} else {
			results.push(2);
		}
	}

	runtime = await performance.now() - runtime;
	return [runtime, results];
}

// Returns an array with the execution results
async function RPSzeroes(games) {
	let results = Array(0);

	runtime = await performance.now();
	for (let i = 0; i < games.length; i++) {
		let game = games[i][0] * 10 + games[i][1]; // [p1][p2]

		if ((game - 11) * (game - 22) * (game - 33) == 0) { // tie
			results.push(0);
		} else if ((game - 13) * (game - 21) * (game - 32) == 0) { // P1 wins
			results.push(1);
		} else { // P2 wins
			results.push(2);
		}
	}

	runtime = await performance.now() - runtime;
	return [runtime, results];
}

// Returns an array with the execution results
async function RPSnoComparisons(games) {
	let results = Array(0);

	runtime = await performance.now();
	for (let i = 0; i < games.length; i++) {
		/*
		 * Polynomial equation that satisfies the following points:
		 * (1,1,0) (2,2,0) (3,3,0)
		 * (1,3,1) (2,1,1) (3,2,1)
		 * (1,2,2) (2,3,2) (3,1,2)
		 */
		let x = games[i][0];
		let z = games[i][1];

		results.push(Math.round((x - z) * (x + -2.66069 * z) * (x + -0.753293 * z) * (x + -2.96691 * z) * (x + -0.751818 * z) * (x + -1.48948 * z) * (x + -0.33313 * z) * (x + -0.751626 * z) * (x + -1.05309 * z)));
	}

	runtime = await performance.now() - runtime;
	return [runtime, results];
}