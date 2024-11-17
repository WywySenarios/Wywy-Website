# Wywy's Website!!!
This is a framework for my personal website! Unforutnately, user friendliness is a secondary consideration when I am making this project.

## SETUP SERVER:
Note: npm REQUIRES execution policy to be set to "RemoteSigned" or a policy that is less strict than "RemoteSigned"
How to install node js on Windows: https://learn.microsoft.com/en-us/windows/dev-environment/javascript/nodejs-on-windows
Run the following commands in the respective folder to install node packages: (to be updated???)
npm install express cors body-parser ua-parser fs child_process lucide-react class-variance-authority tailwindcss
npm install -D tailwindcss postcss autoprefixer vite
npm tailwindcss init

Install astro in an empty directory and copy over the files to there. Install typescript.
npm create astro@latest

Run the following command in the respective folder to install astro packages:
npx astro add node tailwind react

Other things I ran that might be important:
npm i @types/node

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