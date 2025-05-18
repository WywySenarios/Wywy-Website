# TODO determine if formattedValue is really the best way to go (or just make which type to pick a variable)

import os.path
import json
import sys
from datetime import datetime
from datetime import date
from google.oauth2.credentials import Credentials
from scripts.Google.creds import getCreds
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError

# If modifying these scopes, delete the file token.json.
SCOPES = ["https://www.googleapis.com/auth/spreadsheets.readonly"]

# Open and read the config file
with open('config.json', 'r') as file:
    config = json.load(file)

def columnIndexToLetter(index: int) -> str:
  """
  Converts a number to a letter in the format that Google Sheets uses. i.e. 1 -> A, 2 -> B, 27 -> AA, etc.
  """
  index = index + 1
  letter = ""
  while index > 0:
    index, remainder = divmod(index - 1, 26)
    letter = chr(65 + remainder) + letter
  return letter

def getCell(sheet, row: int, col: int) -> dict:
  """
  Gets a cell from the given sheet.
  """
  if row < 0:
    raise ValueError("row must be greater than or equal to 0")
  if col < 0:
    raise ValueError("col must be greater than or equal to 0")
  
  return sheet["data"][0]["rowData"][row]["values"][col]

def getValue(sheet, row: int, col: int, valueType: str = "formattedValue") -> str:
  """
  Gets a value from the given sheet and cell. Uses getCell() in the background.
  @param sheet: The sheet to get the value from.
  @param row: The row to get the value from.
  @param col: The column to get the value from.
  @param valueType: The type of value to get. Can be "formattedValue", or "effectiveValue".
  """
  if valueType != "formattedValue" and valueType != "effectiveValue":
    raise ValueError("valueType must be either 'formattedValue' or 'effectiveValue'")
  return getCell(sheet, row, col)[valueType]

def getGenericScoringTable(SHEET: dict, CATEGORY: str) -> None:
  # quick variables for cnvenience
  ID = SHEET["sheetId"]
  SHEET_NAME = SHEET["sheetName"]
  
  service = None
  creds = getCreds()
  output = {
    "data": {},
    "totals": {},
  } # a single variable for ALL the data. I'm so sorry XD
  
  if not creds or not creds.valid:
    print("Failed to find valid credentials. Aborting...")
    sys.exit(1)
    
  
  # attempt and assert that the Google Sheets service is ready to go
  try:
    service = build("sheets", "v4", credentials=creds)
  except HttpError as err:
    print(f"Error: {err}", file=sys.stderr)  # Print error to stderr
    sys.exit(1)  # Explicitly exit with a non-zero code
  
  # grab ALL the data from the entire document (sorry about efficiency!)
  document = service.spreadsheets().get(spreadsheetId=ID, includeGridData=True).execute()

  # look for the sheet that you need and assert that it is there
  matching_sheets = [s for s in document.get("sheets", []) if s["properties"]["title"] == SHEET_NAME]
  if len(matching_sheets) == 0:
    print(f"Error: Sheet '{SHEET_NAME}' not found", file=sys.stderr)
    sys.exit(1)
  
  # look at the first match
  sheet = matching_sheets[0]
  sheet_id = sheet["properties"]["sheetId"]
  print(f"Sheet '{SHEET_NAME}' found with ID {sheet_id}")
  
  # Start duplicating merged cell values so that all the merged cells point to the same cell by reference.
  # print("Duplicating merged cells...")
  for merge in sheet["merges"]:
    # I should be good for the start and end indexes to not have any operations on them. https://developers.google.com/workspace/sheets/api/reference/rest/v4/spreadsheets/other#GridRange
    for row in range(merge["startRowIndex"], merge["endRowIndex"]):
      for col in range(merge["startColumnIndex"], merge["endColumnIndex"]):
        # duplicate cells!
        sheet["data"][0]["rowData"][row]["values"][col] = getCell(sheet, merge["startRowIndex"], merge["startColumnIndex"])
  
  # time to get data from the sheet!
  # map each subscore to the original scores
  # subscoreRef = {}
  
  # print("Looking at row 1...")
  # # loop through row 1, ignoring cell A1
  # for col_index, cell in enumerate(sheet["data"][0].get("rowData", [])[0].get("values", [])):
  #   value = cell.get("formattedValue", "")
    
  #   # ignore notes. Find all columns that have "sub" at the start of them (case insensitive).
  #   if re.match("sub.*", value.lower()):
  #     # look at second and third row, which are just below it:
  #     subscoreRef.update({sheet["data"][0].get("rowData", [])[2].get("values", [])[col_index].get("formattedValue", ""): sheet["data"][0].get("rowData", [])[1].get("values", [])[col_index].get("formattedValue", "")})

  dataColumns = {}
  # print("Looking at row 3...")
  # Loop through row 3, looking for non-empty, not capitalized cells. Ignore the first column (indepdenant variable moment).
  for col_index, cell in enumerate(sheet["data"][0].get("rowData", [])[2].get("values", [])):
    # TODO please don't do this, but I really don't know if it's possible not to do this
    if col_index == 0:
      continue
    
    value = cell.get("formattedValue", "")
    # ignore notes
    # not capitalized, non-empty cells.
    if not value.isupper() and value != "":
      # if this is a sub-data, record apprioriately (it's sub data if the first three letters of the string are "sub", case insensitive)
      if getValue(sheet, 0, col_index)[0:3].lower() == "sub":
        reference = getValue(sheet, 1, col_index)
        # avoid empty key errors
        if not reference in dataColumns:
          dataColumns[reference] = {}
        
        # recognize this column as a subscore of something else
        """
        Here is an example:
        {
          "Work Performance": {
            "col": 2,
            "Work Ethic": 0,
            "Time Efficiency": 3
          },
          "General": {
            "col": 4,
            "Hours Slept": 1,
            Work Performance": 2
          }
          "Standalone": {
            "col": 5
          }
        }
        """
        # remember that the sheet is responsible for calculating the scores, and this script only needs to communicate the agreed-upon weighting of the scores.
        dataColumns[reference][value] = col_index
        
      # store this as a recognized column and record its column index.
      dataColumns[value] = {"col": col_index}
  
  # look at every row's data
  for i in range(3, len(sheet["data"][0].get("rowData", []))):
    # print("Looking at row", i + 1, "...")
    row = sheet["data"][0].get("rowData", [])[i].get("values", [])
    independantValue = row[0].get("formattedValue", "")
    # break out if we're at the end of the data
    if independantValue.isupper():
      # print("Nope! This is the end of the data.")
      break
    # skip if the independant value is not there (which should signify that the row is not valid OR signifies that we shouldn't look at it)
    if independantValue == "":
      # print("Nope! Row", i + 1, "is not a valid row (independant value must exist and NOT be capitalized).")
      continue
    
    # look at all recognized columns
    output["data"][independantValue] = {}
    for key in dataColumns.keys():
      # TODO add empty keyword thingy (e.g. "NULL") variable
      # look at the value
      nextScore = {"value": row[dataColumns[key]["col"]].get("formattedValue", ""), "note": row[dataColumns[key]["col"]].get("note", "")}
      
      # look at subscores:
      for subscoreKey in dataColumns[key].keys():
        if subscoreKey != "col":
          # ignore subscore notes
          nextScore[subscoreKey] = row[dataColumns[key][subscoreKey]].get("formattedValue", "")
      
      output["data"][independantValue][key] = nextScore
  
  # look at the totals or bottom of the sheet
  for i in range(len(sheet["data"][0].get("rowData", [])) - 1, 0, -1):
    # print("Looking at totals... (row " + str(i + 1) + ")")
    row = sheet["data"][0].get("rowData", [])[i].get("values", [])
    independantValue = row[0].get("formattedValue", "")
    # break out if we're at the end of totals
    if not independantValue.isupper():
      # print("Nope! Row", i + 1, "is not a totals row.")
      break
    
    # look at all recognized columns
    output["totals"][independantValue] = {}
    for key in dataColumns.keys():
      # TODO add empty keyword thingy (e.g. "NULL") variable
      # look at the value
      nextScore = {"value": row[dataColumns[key]["col"]].get("formattedValue", ""), "note": row[dataColumns[key]["col"]].get("note", "")}
      
      # look at subscores
      for subscoreKey in dataColumns[key].keys():
        if subscoreKey != "col":
          # ignore subscore notes
          nextScore[subscoreKey] = row[dataColumns[key][subscoreKey]].get("formattedValue", "")
      
      output["totals"][independantValue][key] = nextScore
  
  # ?? unimplemented?? @TODO
  # @TODO separate ranges of the first column and the rest of the sheet to make runtime hopefully lower/faster
  # look at the head column to see if the data should be tracked or not
  # ignore the first column, as it is the independent variable
  
  # copy down the constraints, description (optional), start date, end date, and supressed columns all according to the config
  output["description"] = config["sheets"]["content"][CATEGORY].get("description", "")
  output["suppress"] = config["sheets"]["content"][CATEGORY].get("suppress", [])
  
  try:
    # print("Column Relationships: ", dataColumns)
    output["constraints"] = config["sheets"]["content"][CATEGORY]["constraints"]
    # remember to convert to ISO format
    output["startDate"] = datetime.strptime(SHEET["startDate"], "%Y-%m-%d").date().isoformat()
    output["endDate"] = datetime.strptime(SHEET["endDate"], "%Y-%m-%d").date().isoformat()
  except KeyError as e:
    raise ValueError(f"Invalid config file (requires constraints, start date, end date):\n{e}")
  
  # store the approximate current time that this output is written
  currentTime = datetime.now()
  output["dateLastUpdated"] = date(currentTime.year, currentTime.month, currentTime.day).isoformat()
  
  # avoid FileNotFoundError errors due to subdirectories not existing:
  if not os.path.exists(config["sheets"]["outputPath"] + "\\" + CATEGORY):
    os.makedirs(config["sheets"]["outputPath"] + "\\" + CATEGORY)
  outputWriter = open(config["sheets"]["outputPath"] + "\\" + CATEGORY + "\\" + SHEET_NAME + ".json", "w+")
  outputWriter.write(json.dumps(output, separators=(',', ':')))
  outputWriter.close()
  
def main():
  # loop through all the generic scoring tables in the config
  for CATEGORY in config["sheets"]["content"].keys():
    if config["sheets"]["content"][CATEGORY]["type"] != "generic":
      continue
    
    for SHEET in config["sheets"]["content"][CATEGORY]["sheets"]:
      try:
        getGenericScoringTable(SHEET, CATEGORY)
      except ValueError as e:
        print(f"WARNING: Skipping table due to invalid config:\n{e}")
      except HttpError as e:
        print("We're having issues with the Google Sheets API (HttpError). Please try again later.", file=sys.stderr)

if __name__ == "__main__":
  main()