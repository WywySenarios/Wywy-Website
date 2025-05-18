"""
This script is run to collect data at the end of the day. It's mainly for my own convenience!
@TODO add a schema
"""

import json
from screentime.coldTurkeyBlocker import getAppStats
from typing import Callable
from typing import Optional

# Google Imports
from google.oauth2.credentials import Credentials
from Google.creds import getCreds
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError

# config
with open('config.json', 'r') as file:
    config = json.load(file)

# map functions to keywords in config. All characters are lower-case, and all spaces are removed.
KEYWORDS: dict = {
    "coldturkey": getAppStats,
    "coldturkeyblocker": getAppStats,
}

creds: Credentials = getCreds()
service = build("sheets", "v4", credentials=creds)

def writeToSheet(spreadsheetID: str) -> None:
    # open up credentials if it's not already open
    if creds is None:
        creds = getCreds()

    # includeGridData=True
    service.spreadsheets().values().update(spreadsheetId=spreadsheetID, includeGridData=True)
    

WRITETASKS: dict = {
    "googlesheets": writeToSheet
}

def main():
    # loop through the config, looking for tasks to do
    for outputArea in config["dataHarvesting"]["dailySummary"]:
        currentWriteTask: Optional[Callable[[dict], None]] = WRITETASKS.get(outputArea["type"], None)

        # if we won't end up writing anything, just quit. There's no need to waste runtime.
        if currentWriteTask is None:
            continue

        for columnName, taskName in outputArea["columns"].values():
            # convert keywords to lower-case and remove all spaces
            taskKeyword = taskName.lower().replace(" ", "")
            
            # if it's a valid task,
            if taskKeyword in KEYWORDS:
                # try to execute the task
                taskOutput = KEYWORDS[taskKeyword]()
                print("Task:", taskName, "is done.")

                # auto-magickally write to the specified area
                currentWriteTask(taskOutput)
            else:
                print("Task:", taskName, "is not recognized")


if __name__ == "__main__":
    main()