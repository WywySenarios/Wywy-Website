This is a framework for my personal website! Unforutnately, user friendliness is a secondary consideration when I am making this project.

# SETUP SERVER:
Note: npm REQUIRES execution policy to be set to "RemoteSigned" or a policy that is less strict than "RemoteSigned"

How to install node js on Windows: https://learn.microsoft.com/en-us/windows/dev-environment/javascript/nodejs-on-windows

Run the following commands in the respective folder to install node packages:
npm install express cors body-parser ua-parser fs child_process

Install the python "google" package & verify your credentials. Read https://developers.google.com/sheets/api/quickstart/python

Make sure to put your credentials inside the root directory in a file called "credentials.json".

NOTE: runGetDaily.bat is automatically configured to run using a virtual environment. Change it if you need to use another installation of python.

Change the filepaths of "config\filepaths.cfg" to reflect the respective locations you are going to use. (absolute pathes have not been tested)