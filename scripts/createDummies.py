import os, re

# creates a JSON dummy at the specified path (pretty intuitive)
def createJSONDummy(path):
    # create folder path if it doesn't exist
    folderPath = re.findall(".+\\\\", path)[0]

    # create the JSON file
    if not os.path.exists(folderPath):
        os.makedirs(folderPath)
    output = open(path, "w+")
    output.write("{}")
    output.close()

# create RPSRuntime folder to avoid errors

# create JSON files
createJSONDummy("data\\RPSRuntime\\master.json")
createJSONDummy("data\\daily.json")