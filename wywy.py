"""
Welcome to WYWY, my CLI assistant. Wywy is really nice ❤️, so he decided to help me with CLI! He'll be here as your assisstant to keep your website up and running :D
"""

# imports
import cmd # Say hi to Wywy!
from subprocess import Popen
import subprocess
import json

# peak at config
with open("config.json", "r") as file:
    config = json.load(file)
    

class Wywy(cmd.Cmd):

    prompt = ">> "
    intro = "Hi there! I'm Wywy! Type \"help\" for avaliable commands."
    
    def do_refreshSheets(self, arg):
        subprocess.run([config["python"], "scripts\\getSheets.py"])

    def do_refresh(self, arg):
        if arg == "": # if the user did not put any arguments, refresh EVERYTHING
            self.do_refreshSheets("")
        else:
            args = arg.split(" ") # get ALL the args the user gave us
            for i in args:
                if i == "sheets" or i == "sheet":
                    self.do_refreshSheets("")

    def do_runServer(self, arg):
        Popen(["node", "scripts\\server.js"]) # run the server
        Popen(["cloudflared", "tunnel", "run", arg]) # host via cloudflare tunnel
        
    
    def do_refreshrun(self, arg):
        self.do_refresh()
    
    def do_install(self, arg):
        print("WARNNIG: REINSTALLING THE SERVER MAY OVERRIDE CODE, ASSETS, AND MARKDOWN FILES. PLEASE BACKUP YOUR FOLDER BEFORE RUNNING THIS COMMAND.")
        print("The astro config will be destroyed.")
        
        input("Acknowledged...")
        
        Popen(["scripts\\installServer.bat"])


    def do_help(self, arg):
        print("""Here are a list of commands you can run:
run [tunnel name] -> runs the server using node & hosts it online via a cloudflare tunnel. Takes in the tunnel name as an argument.
refresh -> refreshes data based on the argument provided. If no argument is provided, this refreshes all the data this website imports from other places.
    sheets || sheet -> refreshes data from google sheets
refreshrun -> refreshes EVERYTHING then runs the server, taking in the tunnel name as an argument.
install -> attempts to install every dependancy. WARNNIG: MAY OVERRIDE CODE, ASSETS, AND MARKDOWN FILES. PLEASE BACKUP YOUR FOLDER BEFORE RUNNING THIS COMMAND.
""")


if __name__ == "__main__":
    Wywy().cmdloop()