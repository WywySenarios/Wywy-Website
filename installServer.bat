:: disable echo to save your braincells when reading the CMD XD
@echo off

:: clean out Astro file
py cleanConfig.py

echo Config successfully cleaned.
pause

:: Install Astro & node dependancies.
npm install astro
npm install express
npm install cors
npm install body-parser
npm install ua-parser-js
npm install fs child_process
npm install lucide-react
npm install class-variance-authority
npm install tailwindcss
npm install chart.js
npm install --save regression

echo Succesfully installed astro & node dependancies.
pause

:: install critical Astro integrations
npx astro add node tailwind react

echo Succesfully installed critical Astro integrations.
pause

:: Install tailwind CSS for ShadCN to use
npm install -D tailwindcss postcss autoprefixer vite &:: I'm not sure if this line is needed, but this is for redundnacy, I guess. I'm just too lazy to test without it :P
npx tailwind init

echo Successfully installed Tailwind CSS.
pause

:: Install ShadCN. Please do NOT override any components.
echo When installing ShadCN, please DO NOT override any components.
pause
npx shadcn@latest init
npx shadcn@latest add button calendar table

echo ShadCN & related components succesfully installed.
pause

:: node module types? IDK if this is needed anymore
npm i @types/node

echo Successfully installed node types.
pause

:: build the project once all dependancies have been installed.
@REM npm run build

pause
cmd /k