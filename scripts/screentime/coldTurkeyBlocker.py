"""
This module is used to get the screen time data from the Cold Turkey Blocker app.

Requires file path -> Application name mapping inside the config file.
"""

from typing import Optional
import sqlite3
import datetime
import yaml

# Constants
BROWSER_DB_PATH = r"C:\ProgramData\Cold Turkey\data-browser.db"
APP_DB_PATH = r"C:\ProgramData\Cold Turkey\data-helper.db"

# config
with open('config/config.yml', 'r') as file:
    config = yaml.load(file)
    
def dateToUnixTimestamp(date_obj: datetime.datetime | datetime.date) -> int:
    """
    Converts a date object to a Unix timestamp.
    @TODO timezone

    Args:
        date_obj (datetime.date): Date to convert.

    Returns:
        int: Unix timestamp.
    """
    
    if isinstance(date_obj, datetime.datetime):
        return int(date_obj.timestamp())
    elif isinstance(date_obj, datetime.date):
        return int(datetime.datetime.combine(date_obj, datetime.time()).timestamp())

def investigateAppName(appPath: str) -> str:
    """
    Investigates whether or not the appPath relates to an app from the config file. If not, it will ask the user to input the app name and will remember the app name (inside the config file) for future reference.
    Please note that there is no checking to determine whether or not the app name is used multiple times to describe multiple different files. This is intended, and it is up to the user to decide what conventions they want to follow.

    Args:
        appPath (str): The file path of the application.

    Returns:
        str: The app name.
    """
    
    # if the app name is already there,
    name = config.get("dataHarvesting", {}).get("appNames", {}).get(appPath, None)
    if name:
        return name
    else:
        # prompt user for input.
        name = input(f"What is the name of the app found at {appPath}? This will be used for future reference. You can change the name of the app in the config file at any time.: ")
        
        # remember the input for future reference.
        config["dataHarvesting"]["appNames"][appPath] = name
        with open('config/config.yml', 'w') as file:
            yaml.dump(config, file, indent=4)
        
        return name


def getWebsiteStats(startDate: Optional[int]=None, endDate: Optional[int]=None) -> dict:
    """
    This function gets the website stats from the Cold Turkey Blocker app, assumed to be stored in "C:\\ProgramData\\Cold Turkey\\data-browser.db".
    
    Args:
        startDate (int): The start date for the stats (Unix timestamp). If no start date is provided, it will default to the current date (at 12:00AM).
        endDate (int): The end date for the stats (Unix timestamp). If no end date is provided, it will default to the current time plus 1 minute and 1 second.
        
    Returns:
        dict: {
            "2024-12-01": {
                "site1": 1234,
                "site2": 5678,
                etc.
            },
            etc.,
        }
    """
    startDate = startDate if startDate else dateToUnixTimestamp(datetime.date.today()) # 12:00AM
    endDate = endDate if endDate else dateToUnixTimestamp(datetime.datetime.now()) + 61 # 1 minute and 1 second
    output = {}
    
    db = sqlite3.connect(BROWSER_DB_PATH)
    cursor = db.cursor()
    
    # loop through every single entry within the specified time frame
    data = cursor.execute("SELECT date, domain, seconds FROM stats where date >= ? and date <= ?", (startDate, endDate)).fetchall()
    for row in data:
        date = datetime.datetime.fromtimestamp(row[0]).date().isoformat()
        
        # store the entry in the output, keeping in mind the ISO date and the app names.
        if date in output:
            day = output[date]
            
            # check if this application is already in the list of applications for this day.
            if row[1] in day:
                day[row[1]] += row[2]
            else:
                day[row[1]] = row[2]
        else:
            output[date] = {row[1]: row[2]}
    
    return output

def getAppStats(startDate: Optional[int]=None, endDate: Optional[int]=None) -> dict:
    """
    This function gets the app stats from the Cold Turkey Blocker app, assumed to be stored in "C:\\ProgramData\\Cold Turkey\\data-helper.db". All units are in seconds.
    
    Args:
        startDate (int): The start date for the stats (Unix timestamp). If no start date is provided, it will default to the current date (at 12:00AM).
        endDate (int): The end date for the stats (Unix timestamp). If no end date is provided, it will default to the current time plus 1 minute and 1 second.
        
    Returns:
        dict: {
            "2024-12-01": {
                "app1": 1234 (in seconds),
                "app2": 5678 (in seconds),
                etc.
            },
            etc.,
        }
    """
    startDate = startDate if startDate else dateToUnixTimestamp(datetime.date.today()) # 12:00AM
    endDate = endDate if endDate else dateToUnixTimestamp(datetime.datetime.now()) + 61 # 1 minute and 1 second
    output = {}

    db = sqlite3.connect(APP_DB_PATH)
    cursor = db.cursor()
    
    # loop through every single entry within the specified time frame
    data = cursor.execute("SELECT date, file, seconds FROM statsApp where date >= ? and date <= ?", (startDate, endDate)).fetchall()
    for row in data:
        appName = investigateAppName(row[1])
        date = datetime.datetime.fromtimestamp(row[0]).date().isoformat()
        
        # store the entry in the output, keeping in mind the ISO date and the app names.
        if date in output:
            day = output[date]
            
            # check if this application is already in the list of applications for this day.
            if appName in day:
                day[appName] += row[2]
            else:
                day[appName] = row[2]
        else:
            output[date] = {appName: row[2]}
    
    return output

def main():
    print(getAppStats())
    print(getWebsiteStats())

if __name__ == "__main__":
  main()