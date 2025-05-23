@REM @deprecated
@echo off
set configJSON = ConvertFrom-Json Get-Content config.json
set pyPath = %configJSON.python%

%pyPath% getDaily.py

PRINT The Python script has finished executing.

timeout 3