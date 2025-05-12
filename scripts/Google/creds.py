"""
This module is SOLELY for managing Google credentials.
This file should be the only file that is able to modify Google tokens.
"""
import os
from json import load as loadJSON
from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import InstalledAppFlow
from typing import Optional

# After modify the scopes, delete the token. In ideal scenarios, the token's location should be specified in the config file.
FEATURESSCOPES = {
    "dataHarvesting": {
        "main": ['https://www.googleapis.com/auth/drive.file']
    }
}

"""
        Data Harvesting is all about finding data and storing it.
        Wywy needs to be able to:
        * READ data from Google Sheets (finding data)
        * WRITE data to Google Sheets (storing data)
        """

# Open and read the config file
with open('config.json', 'r') as file:
    config = loadJSON(file)


def getAllScopes() -> list[str]:
    """
    Returns all the scopes for all the features. Does NOT use/call the getScopes function.
    
    Returns:
        list[str]: The scopes for all the features.
    """
    
    scopes = []
    for feature in config["features"]:
        # if the feature is enabled,
        if config["features"][feature]:
            scopes.extend(FEATURESSCOPES[feature]["main"])
    
    return scopes
    

def getScopes(feature: str) -> list[str]:
    """
    Returns the scopes for a given feature.
    
    Returns:
        list[str]: The scopes for the feature.
    """
    
    if feature in config["dataHarvesting"]:
        return FEATURESSCOPES[feature]["main"]
    else:
        # @TODO determine if ValueError is the right exception to raise
        raise ValueError(f"Feature '{feature}' not found in config file.")

def getToken(deleteOldToken: bool = False) -> Optional[Credentials]:
    """
    Fetches a fresh token. Optionally deletes the old token. This function assumes that the credentials and tokens file should be in the location specified in the config file. It also assumes that all the requested features are stored in the config file.
    
    @deleteOldToken (bool): If True, deletes the old token before fetching a new one.
    
    Returns:
        Credentials: Returns a new, valid token if possible, and None if not.
    """
    creds = None
    
    if deleteOldToken:
        # delete the old token if it exists
        if os.path.exists(config["Google"]["token"]):
            # Delete the old token file
            os.remove('data/token.json')
    else:
        creds = Credentials.from_authorized_user_file(config["Google"]["credentials"], getAllScopes())
    
    # Request to refresh the token if it is expired
    # (make sure that the refresh token is available to use)
    if creds and creds.refresh_token:
        creds.refresh(Request())
    else: # validation from user for perms is required
        flow = InstalledAppFlow.from_client_secrets_file(config["Google"]["credentials"], getAllScopes())
        creds = flow.run_local_server(port=0)
    
    # store the creds if they are valid
    if creds and creds.valid:
        with open(config["Google"]["token"], "w") as token:
            token.write(creds.to_json())
        return creds
    else:
        return None

def getCreds() -> Optional[Credentials]:
    """
    Returns the credentials for the Google API. If the credentials are expired, this function will attempt to refresh them.
    
    Returns:
        Credentials: The credentials for the Google API. This function does not guarentee that the credentials are valid.
    """
    creds = getToken()
    
    # If there are no (valid) credentials available, let the user log in.
    if not creds or not creds.valid:
        if creds and creds.expired and creds.refresh_token:
            creds.refresh(Request())
        else:
            flow = InstalledAppFlow.from_client_secrets_file(config["Google"]["credentials"], getAllScopes())
            creds = flow.run_local_server(port=0)
        
        # Save the credentials for the next run
        with open(config["token"], 'w') as token:
            token.write(creds.to_json())
    
    return creds