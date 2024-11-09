let charts = {};

// returns [labels, runtime] or an empty array given an error
async function getChartData(trialIDs, algorithmName) {
  try {
    let output = [];
    for (let i = 0; i < trialIDs.length; i++) {
      let response = await fetch("/graph" + "?algorithmName=" + algorithmName + "&trialID=" + trialIDs[i], {
        method: "GET"
      });

      const data = await response.json();
      let labels = Array(0);
      let runtime = Array(0);
      for (let i = 0; i < data["content"].length; i++) {
        runtime.push(data["content"][i][0]);
        labels.push(data["content"][i][1]);
      }

      output.push([labels, runtime]);
    }

    return output;
  } catch (error) {
    console.error(`ERROR: ${error.message}\n\nGraph will now be empty`);
    return [];
  }
}


// returns the chart that has been set
async function setChart(trialIDs, algorithmName, chartElement, chartType) {
  let dataIn = await getChartData(trialIDs, algorithmName);
  let chartDatasets = [];
  for (let i = 0; i < dataIn.length; i++) {
    chartDatasets.push({
      label: "Runtime Ascending Order Trial " + trialIDs[i],
      data: dataIn[i][1],
      borderWidth: 1
    });
  }

  return await new Chart(chartElement, {
    type: chartType,
    data: {
      labels: dataIn[0][0],
      datasets: chartDatasets
    },
    options: {
      scales: {
        y: {
          beginAtZero: true
        }
      }
    }
  });
}

async function chart(id) {
  try { charts[id].destroy(); } catch (error) { } // delete a chart if it's already there so a new one may be generated

  let trialIDs = [];
  let elements = document.getElementById(id + " select").children;
  for (const i of elements) {
    if (i.checked == true) {
      trialIDs.push(i.id);
    }
  }

  charts[id] = await setChart(trialIDs, document.getElementById(id + " algorithm").value, document.getElementById(id), document.getElementById(id + " chart type").value);
}

function selectAll(id) {
  let elements = document.getElementById(id + " select").children;
  for (const i of elements) {
    if (i.type == "checkbox") { i.checked = true; }
  }
}