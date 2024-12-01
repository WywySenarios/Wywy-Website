import json

# respective commands
COMMANDS = {
    "dev": "astro dev",
    "start": "astro dev",
    "build": "astro check && astro build",
    "preview": "astro preview",
    "astro": "astro"
}

# read current package.json & append some stuff
packageFile = open("package.json", "r")
output = json.load(packageFile)
output["scripts"] = COMMANDS
packageFile.close()

packageFile = open("package.json", "w")
packageFile.write(json.dumps(output, indent=4))
packageFile.close()