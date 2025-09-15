Developed on a Windows 11 computer
Made in WSL -> Ubuntu 24.04.2 LTS

# WSL Config
This is only necessary if you're using WSL.
To open the WSL config, cd to ~ and open .wslconfig in notepad:
 * cd ~
 * notepad .wslconfig

The content inside .wslconfig is:
[wsl2]
networkingMode=mirrored

# Required Libraries
* libcyaml
* libpq-dev
* jansson