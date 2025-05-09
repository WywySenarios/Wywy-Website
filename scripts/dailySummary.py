"""
This script is run to collect data at the end of the day. It's mainly for my own convenience!
"""

import json
from screentime.coldTurkeyBlocker import getAppStats

# config
with open('config.json', 'r') as file:
    config = json.load(file)

# map functions to keywords in config. All characters are lower-case, and all spaces are removed.
KEYWORDS = {
    "coldturkey": getAppStats,
    "coldturkeyblocker": getAppStats,
}

def main():
    # loop through the config
    for task in config["dataHarvesting"]["dailySummary"]:
        # convert keywords to lower-case and remove all spaces
        taskKeyword = task.lower().replace(" ", "")
        
        # if it's a valid task,
        if taskKeyword in KEYWORDS:
            # try to execute the task
            print(KEYWORDS[taskKeyword]())
        else:
            print("Task:", task, "is not recognized")


if __name__ == "__main__":
    main()