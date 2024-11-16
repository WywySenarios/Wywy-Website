import os.path
import json

from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import InstalledAppFlow
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError

# If modifying these scopes, delete the file token.json.
SCOPES = ["https://www.googleapis.com/auth/spreadsheets.readonly"]

# The ID and range of a sample spreadsheet.
SPREADSHEET_ID = "1reqTRELv3O9aNCOr1_wG2pbsL14POf8uvKY2uPpwh-U"
DATA_SHEET_NAME = "Daily Data"

# Open and read the config filepath file
with open('config.json', 'r') as file:
    cfgFilepaths = json.load(file)

"""
Returns values of the given range
"""
def getRange(rangeName):
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
    sheet = service.spreadsheets()
    result = (
        sheet.values()
        .get(spreadsheetId=SPREADSHEET_ID, range=rangeName)
        .execute()
    )
    values = result.get("values", [])

    if not values:
      return None # no data found :(
    
    return values
  except HttpError as err:
    return None # error encountered :(

def main():
  dailyQualitative = getRange(DATA_SHEET_NAME + "!A2:J")
  dailyQuantitative = getRange(DATA_SHEET_NAME + "!M2:U")

  # convert string to float values when applicable
  for a in range(len(dailyQualitative)):
    for b in range(len(dailyQualitative[a])):
      try:
        dailyQualitative[a][b] = float(dailyQualitative[a][b])
      except:
        pass

  for a in range(len(dailyQuantitative)):
    for b in range(len(dailyQuantitative[a])):
      try:
        dailyQuantitative[a][b] = float(dailyQuantitative[a][b])
      except:
        pass

  try:
    open("data/daily.json", "x")
  except:
    pass

  dailyFile = open("data/daily.json", "w")

  dailyFile.write("{" + "\"Qualitative\":{\"headers\":" + str(dailyQualitative.pop(0)).replace("\'", "\"") + ",\"values\":" + str(dailyQualitative).replace("\'", "\"") + "},\"Quantitative\":{\"headers\":" + str(dailyQuantitative.pop(0)).replace("\'", "\"") + ",\"values\":" + str(dailyQuantitative).replace("\'", "\"") + "}}")

  dailyFile.close()


if __name__ == "__main__":
  main()