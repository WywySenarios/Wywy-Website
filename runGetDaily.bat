@echo off
set configJSON = ConvertFrom-Json Get-Content config\filepaths.cfg
set pyPath = %configJSON.python%

%pyPath% getDaily.py

PRINT The Python script has finished executing.

timeout 3