# Wywy's Website!!!
This is a framework for my personal website! Unforutnately, user friendliness is a secondary consideration when I am making this project.

# SETUP SERVER:
This section will run you through how to setup the server from the developer side!
## Install Special Software
### Install Node Package Manager (npm)
Note: npm REQUIRES execution policy to be set to "RemoteSigned" or a policy that is less strict than "RemoteSigned"
How to install node js on Windows: https://learn.microsoft.com/en-us/windows/dev-environment/javascript/nodejs-on-windows
Yes, you need node js for this.

### Install Python
Install python through their official website: https://www.python.org/
I wrote a python script to help you install this website, and it's a super useful programming language, too!

## Install Astro, Astro & Node packages
Run "installServer.bat" to install Astro & most dependancies.
You can navigate to the root directory's folder, open CMD, and run this command to run the batch file: ".\installServer.bat"
DO NOT override any files when installing ShadCN.

## Additional feature: Read Google Sheets (Setup Python virtual environment)
Install the python "google" package & verify your credentials. Read https://developers.google.com/sheets/api/quickstart/python
Make sure to put your credentials inside the root directory in a file called "credentials.json".
NOTE: runGetDaily.bat is automatically configured to run python using a virtual environment. Change it if you need to use another installation of python.
Change the filepaths of "config\filepaths.cfg" to reflect the respective locations you are going to use. (absolute paths have not been tested)

Look at "Building & Running the Project" to see how to launch it.

# Projects
The name of the .md file determines the link where the Card from ./projects links to (AKA that's the URL to the page of the project).

# Google Sheets Interactions
## Basic Setup Template
See this sheet for a basic template:
https://docs.google.com/spreadsheets/d/14c2IYDWpd3uxK_PdfJplrstjo9-n5j7QKFZLZsLIb3I/edit?gid=440337105#gid=440337105

## Row 1: Datatypes
Here are all the valid datatypes currently:
* Score
* Subscore; scores that will contribute to a the value of a score elsewhere on the sheet.
* Raw

## Ignoring Columns
You can prevent data extraction from a column by having its title (row 3) be in full caps, or be empty.

## Technical Notes (You can skip these if you want)
* Cell A1 should always be "DATATYPE". The python script will fail to extract data if it is not.
* Cell A2 should always be "Reference". The python script will fail to extract data if it is not.
* Cell A3 should contain the name for the independant variable. The python script will ignore this cell.
* The last couple of lines that contain operations performed on entire columns should have a name like "SUM" on column A. Otherwise, the script will recognize these rows as regular datapoints.

# Resumes
Resumes are automatically detected in the "public/resumes" folder. The filetype should be PDF. The folder path is NOT modifiable because static files should definitely be inside the static files folder :P 

# Building & Running the Project
To build, run this command: npm run build

To run, run this command: node server.js

Build before you run, please.

Astro will notify you of the port that the server is active on.