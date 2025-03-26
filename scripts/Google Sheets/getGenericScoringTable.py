# TODO determine if formattedValue is really the best way to go (or just make which type to pick a variable)

import os.path
import json
import sys

from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import InstalledAppFlow
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError

# If modifying these scopes, delete the file token.json.
SCOPES = ["https://www.googleapis.com/auth/spreadsheets.readonly"]

# Open and read the config filepath file
with open('config.json', 'r') as file:
    config = json.load(file)

# The ID and range of the spreadsheet.
SPREADSHEET_ID = config["sheets"]["content"]["id"]

if len(sys.argv) > 1:
  DATA_SHEET_NAME = sys.argv[1]
else:
  DATA_SHEET_NAME = ""

"""
Converts a number to a letter in the format that Google Sheets uses. i.e. 1 -> A, 2 -> B, 27 -> AA, etc.
"""
def columnIndexToLetter(index):
  index = index + 1
  letter = ""
  while index > 0:
    index, remainder = divmod(index - 1, 26)
    letter = chr(65 + remainder) + letter
  return letter

"""
Returns values of the given range, and notes, too, if you wanted them :)
"""
def getRange(rangeName, notes):
  creds = None
  # The file token.json stores the user's access and refresh tokens, and is
  # created automatically when the authorization flow completes for the first
  # time.
  if os.path.exists(config["sheets"]["token"]):
    creds = Credentials.from_authorized_user_file(config["sheets"]["token"], SCOPES)
  # If there are no (valid) credentials available, let the user log in.
  if not creds or not creds.valid:
    if creds and creds.expired and creds.refresh_token:
      creds.refresh(Request())
    else:
      flow = InstalledAppFlow.from_client_secrets_file(
          config["sheets"]["credentials"], SCOPES
      )
      creds = flow.run_local_server(port=0)
    # Save the credentials for the next run
    with open(config["sheets"]["token"], "w") as token:
      token.write(creds.to_json())

  try:
    service = build("sheets", "v4", credentials=creds)

    # Call the Sheets API
    data = None
    if (notes):
      # get ALL THE INFO ABOUT THE CELLS :)))))
      sheet = service.spreadsheets().get(spreadsheetId=SPREADSHEET_ID, ranges=[rangeName], includeGridData=True).execute()
      
      data = []
      for sheet in sheet.get("sheets", []):
        for row_data in sheet["data"][0].get('rowData', []):
          row = []
          for cell in row_data.get('values', []):
            note = cell.get('note', '') # fetch cell note
            value = cell.get('formattedValue', '')
            # value = cell.get('effectiveValue', {}).get('stringValue', '')
            row.append({"note": note, "value": value})
          data.append(row)
    else:
      sheet = service.spreadsheets().values().get(spreadsheetId=SPREADSHEET_ID, range=rangeName).execute()
      data = sheet.get("values", [])
    
    return data
  except HttpError as err:
    return None # error encountered :(


"""
"personalSheet": {
  "id": "1reqTRELv3O9aNCOr1_wG2pbsL14POf8uvKY2uPpwh-U",
  "ranges": {
    "Qualitative": {
      "dataSheetName": "Daily Data",
      "range": "B3:J",
      "notes": ["B3:B", "E3:J"] 
    },
  "Quantitative": {
      "dataSheetName": "Daily Data",
      "range": "M3:U",
      "notes": []
    }
  }
}
"""
def main():
  service = None
  creds = None
  output = {
    "data": {},
    "totals": {},
    } # a single variable for ALL the data. I'm so sorry XD
  
  # The file token.json stores the user's access and refresh tokens, and is
  # created automatically when the authorization flow completes for the first
  # time.
  if os.path.exists(config["sheets"]["token"]):
    creds = Credentials.from_authorized_user_file(config["sheets"]["token"], SCOPES)
  # If there are no (valid) credentials available, let the user log in.
  if not creds or not creds.valid:
    if creds and creds.expired and creds.refresh_token:
      creds.refresh(Request())
    else:
      flow = InstalledAppFlow.from_client_secrets_file(
          config["sheets"]["credentials"], SCOPES
      )
      creds = flow.run_local_server(port=0)
    # Save the credentials for the next run
    with open(config["sheets"]["token"], "w") as token:
      token.write(creds.to_json())
  
  # attempt and assert that the Google Sheets service is ready to go
  try:
    service = build("sheets", "v4", credentials=creds)
  except HttpError as err:
    print(f"Error: {err}", file=sys.stderr)  # Print error to stderr
    sys.exit(1)  # Explicitly exit with a non-zero code
  
  # grab ALL the data from the entire document (sorry about efficiency!)
  document = service.spreadsheets().get(spreadsheetId=SPREADSHEET_ID, includeGridData=True).execute()

  # look for the sheet that you need and assert that it is there
  matching_sheets = [s for s in document.get("sheets", []) if s["properties"]["title"] == DATA_SHEET_NAME]
  if len(matching_sheets) == 0:
    print(f"Error: Sheet '{DATA_SHEET_NAME}' not found", file=sys.stderr)
    sys.exit(1)
  
  # look at the first match
  sheet = matching_sheets[0]
  sheet_id = sheet["properties"]["sheetId"]
  print(f"Sheet '{DATA_SHEET_NAME}' found with ID {sheet_id}")
  
  
  # time to get data from the sheet!
  # map each subscore to the original scores
  subscoreRef = {}
  
  # loop through row 1, ignoring cell A1
  for col_index, cell in enumerate(sheet["data"][0].get("rowData", [])[0].get("values", [])):
    value = cell.get("formattedValue", "")
    # ignore notes
    if value.lower() == "subscore":
      # look at second and third row, which are just below it:
      # TODO deal with merged cells later
      subscoreRef.update({sheet["data"][0].get("rowData", [])[2].get("values", [])[col_index].get("formattedValue", ""): sheet["data"][0].get("rowData", [])[1].get("values", [])[col_index].get("formattedValue", "")})

  dataColumns = {}
  # Loop through row 3, looking for non-empty, not capitalized cells. Ignore the first column (indepdenant variable moment).
  for col_index, cell in enumerate(sheet["data"][0].get("rowData", [])[2].get("values", [])):
    # TODO please don't do this, but I really don't know if it's possible not to do this
    if col_index == 0:
      continue
    
    value = cell.get("formattedValue", "")
    # ignore notes
    
    # not capitalized, non-empty cells.
    if not value.isupper() and value != "":
      # store this as a recognized column and record its column index (this is a number).
      dataColumns[col_index] = value
  
  # look at every row's data
  for i in range(3, len(sheet["data"][0].get("rowData", []))):
    row = sheet["data"][0].get("rowData", [])[i].get("values", [])
    independantValue = row[0].get("formattedValue", "")
    # break out if we're at the end of the data
    if independantValue.isupper():
      break
    
    # look at all recognized columns
    output["data"][independantValue] = {}
    for key in dataColumns.keys():
      # TODO add empty keyword thingy (e.g. "NULL") variable
      output["data"][independantValue][dataColumns[key]] = {"value": row[key].get("formattedValue", ""), "note": row[key].get("note", "")}
  
  # look at the totals or bottom of the sheet
  for i in range(len(sheet["data"][0].get("rowData", [])) - 1, 0, -1):
    row = sheet["data"][0].get("rowData", [])[i].get("values", [])
    independantValue = row[0].get("formattedValue", "")
    # break out if we're at the end of totals
    if not independantValue.isupper():
      break
    
    # look at all recognized columns
    output["totals"][independantValue] = {}
    for key in dataColumns.keys():
      # TODO add empty keyword thingy (e.g. "NULL") variable
      output["totals"][independantValue][dataColumns[key]] = row[key].get("formattedValue", "")
  
  print(subscoreRef)
  print(dataColumns)
  
  # look at the head column to see if the data should be tracked or not
  # ignore the first column, as it is the independent variable
  
  a = open("data\\daily.json", "w")
  a.write(json.dumps(output))
  a.close()
  


if __name__ == "__main__":
  main()