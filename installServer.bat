:: disable echo to save your braincells when reading the CMD XD
@echo off

:: clean out Astro file
py cleanConfig.py

:: Install Astro & node dependancies.
npm install astro express cors body-parser ua-parser-js fs child_process lucide-react class-variance-authority tailwindcss chart.js
npm install --save regression

:: install critical libraries
npx astro add node tailwind react

:: Install tailwind CSS for ShadCN to use
npm install -D tailwindcss postcss autoprefixer vite &:: I'm not sure if this line is needed, but this is for redundnacy, I guess. I'm just too lazy to test without it :P
npx tailwind init

:: Install ShadCN. Please do NOT override any components.
npx shadcn@latest init
npx shadcn@latest add button calendar table

:: node module types? IDK if this is needed anymore
npm i @types/node

:: build the project once all dependancies have been installed.
@REM npm run build