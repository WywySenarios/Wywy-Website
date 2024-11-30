# Wywy's Website!!!
This is a framework for my personal website! Unforutnately, user friendliness is a secondary consideration when I am making this project.

### SETUP SERVER:
This section will run you through how to setup the server from the developer side!
# Node Package Manager (npm)
Note: npm REQUIRES execution policy to be set to "RemoteSigned" or a policy that is less strict than "RemoteSigned"
How to install node js on Windows: https://learn.microsoft.com/en-us/windows/dev-environment/javascript/nodejs-on-windows
Yes, you need node js for this.

# Python
Install python through their official website: https://www.python.org/
I wrote a python script to help you install this website, and it's a super useful programming language, too!

# Astro, Astro & Node packages
BEFORE DOING THIS, PLEASE CLEAN ASTRO's CONFIG FILE.
Run "installServer.bat" to install Astro & most dependancies.
DO NOT override any files when installing ShadCN.

# Additional feature: Read Google Sheets (Setup Python virtual environment)
Install the python "google" package & verify your credentials. Read https://developers.google.com/sheets/api/quickstart/python
Make sure to put your credentials inside the root directory in a file called "credentials.json".
NOTE: runGetDaily.bat is automatically configured to run python using a virtual environment. Change it if you need to use another installation of python.
Change the filepaths of "config\filepaths.cfg" to reflect the respective locations you are going to use. (absolute paths have not been tested)

Look at "Building & Running the Project" to see how to launch it.

## Why I used google sheets
Google Sheets is particularily annoying when it comes to processing data---it's super clunky to use complex formulas on a couple arrays of numbers inside the google sheet, and it eventually gets SUPER DUPER LAGGY when you're trying to process thousands of data points.
However, Google Sheets is super good at one thing---making it easy to input data. Yes, I made the server run around my lifestyle. I love it :P

## Resumes
Resumes are automatically detected in the "public/resumes" folder. The filetype should be PDF. The folder path is NOT modifiable because static files should definitely be inside the static files folder :P 

## Building & Running the Project
To build, run this command: npm run build

To run, run this command: node server.js

Build before you run, please.