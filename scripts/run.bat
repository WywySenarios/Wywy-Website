@REM @deprecated
@echo off
cd ..

set configJSON = ConvertFrom-Json Get-Content config.json
set pyPath = %configJSON.python%

node server.js

cloudflared tunnel run Wywy-Website

timeout 3