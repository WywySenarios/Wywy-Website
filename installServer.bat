:: disable echo to save your braincells when reading the CMD XD
@echo off

:: clean out Astro file
py scripts/cleanConfig.py

echo Config successfully cleaned.
pause

:: Install Astro & node dependancies.
call npm install astro
call npm install express
call npm install cors
call npm install body-parser
call npm install ua-parser-js
call npm install fs
call npm install child_process
call npm install lucide-react
call npm install class-variance-authority
call npm install tailwindcss
call npm install chart.js
call npm install --save regression

echo "Succesfully installed astro & node dependancies."
pause

:: install critical Astro integrations
call npx astro add node tailwind react

echo "Succesfully installed critical Astro integrations."
pause

:: Install tailwind CSS for ShadCN to use
call npm install -D tailwindcss postcss autoprefixer vite &:: I'm not sure if this line is needed, but this is for redundnacy, I guess. I'm just too lazy to test without it :P
call npx tailwind init

echo "Successfully installed Tailwind CSS."
pause

:: Install ShadCN. Please do NOT override any components.
echo "When installing ShadCN, please DO NOT override any components."
pause
@REM call npx shadcn@latest init
call npx shadcn@latest add button calendar table

echo "ShadCN & related components succesfully installed."
pause

:: node module types? IDK if this is needed anymore
call npm i @types/node

echo "Successfully installed node types."
pause

:: reinstate original Astro config
py scripts/reinstateConfig.py

echo "Successfully reinstated original Astro config."
pause

:: add commands to the package.json file
py scripts/addCommands.py

echo "Succesfully added commands to package.json."
pause

:: optionally build the project once all dependancies have been installed.
choice /c TF /m "Do you want to build this project (press lowercase key)"
if errorlevel 2 (
    echo "Build skipped."
) else (
    call npm run build
    echo "Build complete."
)

echo "Server Installation Complete."
pause