import os, re, shutil
"""This script restores all default files. Please do not run this except if you are setting up the server. This script has the potential to delete any data inside of this folder.
"""

# creates a JSON dummy at the specified path (pretty intuitive)
def copyFile(path):
    # create folder path if it doesn't exist
    folderPath = re.findall(".+\\\\", path)[0]

    # create the JSON file
    if not os.path.exists(folderPath):
        os.makedirs(folderPath)
    output = open(path, "w+")
    output.write("{}")
    output.close()

def main():
    # look at defaults folder and recursive search for all files AND folders. Copy them ALL.
    destination = os.getcwd() # get root folder's directory
    source = destination + "\\scripts\\defaults" # source folder's directory

    shutil.copytree(source, destination, dirs_exist_ok=True)

# create dummy folders

if __name__ == "__main__":
    main()
