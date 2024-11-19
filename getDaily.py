import os.path
import json

from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import InstalledAppFlow
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError

# If modifying these scopes, delete the file token.json.
SCOPES = ["https://www.googleapis.com/auth/spreadsheets.readonly"]

# Open and read the config filepath file
with open('config.json', 'r') as file:
    cfgFilepaths = json.load(file)

# The ID and range of the spreadsheet.
SPREADSHEET_ID = cfgFilepaths.get("personalSheet").get("id")
DATA_SHEET_NAME = "Daily Data"

"""
Returns values of the given range, and notes, too, if you wanted them :)
"""
def getRange(rangeName, notes):
  creds = None
  # The file token.json stores the user's access and refresh tokens, and is
  # created automatically when the authorization flow completes for the first
  # time.
  if os.path.exists(cfgFilepaths.get("googleToken")):
    creds = Credentials.from_authorized_user_file(cfgFilepaths.get("googleToken"), SCOPES)
  # If there are no (valid) credentials available, let the user log in.
  if not creds or not creds.valid:
    if creds and creds.expired and creds.refresh_token:
      creds.refresh(Request())
    else:
      flow = InstalledAppFlow.from_client_secrets_file(
          cfgFilepaths.get("googleCredentials"), SCOPES
      )
      creds = flow.run_local_server(port=0)
    # Save the credentials for the next run
    with open(cfgFilepaths.get("googleToken"), "w") as token:
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
  allData = json.loads("{}")
  a = 0
  ranges = cfgFilepaths.get("personalSheet").get("ranges")
  for itemName in ranges:
    item = ranges.get(itemName)
    currentData = json.loads("{}")
    
    
    currentData["headers"] = getRange(DATA_SHEET_NAME + "!" + item["headers"]["range"], item["headers"]["notes"])
    currentData["content"] = getRange(DATA_SHEET_NAME + "!" + item["content"]["range"], item["content"]["notes"])
    
    
    # strip notes within a range specified by the config
    for i in item["content"]["strip_notes"]:
      for a in currentData["content"]:
        a[i]["note"] = ""
    allData[itemName] = currentData

  # write to file :)))
  dailyFile = open("data/daily.json", "w")
  dailyFile.write(json.dumps(allData))
  dailyFile.close()


if __name__ == "__main__":
  main()