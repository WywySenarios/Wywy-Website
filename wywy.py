"""
Welcome to WYWY, my CLI assistant. Wywy is really nice ❤️, so he decided to help me with CLI! He'll be here as your assisstant to keep your website up and running :D
"""

# imports
from typing import List
import cmd # Say hi to Wywy!
import sys
from subprocess import Popen
import psycopg2
import yaml
import re

# peak at config
with open("config.yml", "r") as file:
    config = yaml.safe_load(file)
    

def toUnderscoreNotation(target: str) -> str:
    """Attempts to convert from regular words/sentences to underscore notation. This will not affect strings already in underscore notation. (Does not work with camelCase)
    @param target
    @return Returns underscore notation string. e.g. "hi I am Wywy" -> "hi_I_am_Wywy"
    """
    stringFrags: List[str] = re.split(r"[\.\s]", target)
    
    output: str = ""
    
    for i in stringFrags:
        output += i + "_"
    
    return output[:-1] # remove trailing underscore with "[:-1]"

class Wywy(cmd.Cmd):
    prompt = ">> "
    intro = "Hi there! I'm Wywy! Type \"help\" for avaliable commands."

    def do_runServer(self, arg):
        # start the Astro server
        # start the SQL Receptionist
        
        Popen(["node", "scripts\\server.js"]) # run the server
        Popen(["cloudflared", "tunnel", "run", arg]) # host via cloudflare tunnel
        
    
    def do_install(self, arg):
        print("WARNNIG: REINSTALLING THE SERVER MAY OVERRIDE CODE, ASSETS, AND MARKDOWN FILES. PLEASE BACKUP YOUR FOLDER BEFORE RUNNING THIS COMMAND.")
        print("The astro config will be destroyed.")
        
        input("Acknowledged...")
        
        Popen(["scripts\\installServer.bat"])
    
    
    def do_create_db_tables(self, arg):
        """Attempts to create the necessary tables to power the data section of the website. Skips & notifies user when any attempt to create tables fails because they already exist.
        """
        
        # try to connect to PostgreSQL database server
        try:
            psycopg2config: dict = {
                "host": config["postgres"].get("host", "localhost"),
                "port": config["postgres"].get("port", "5432"),
                "user": config["postgres"].get("user", "postgres"),
            }
            
            if "password" in config["postgres"]:
                psycopg2config["password"] = config["postgres"]["password"]
            
            # loop through every database that has tables to be created
            for dbInfo in config["data"]:
                psycopg2config["dbname"] = dbInfo["dbname"]

                # loop through every table that needs to be created @TODO verify config validity to avoid errors
                for tableInfo in dbInfo.get("tables", []):
                    # look for prereqs:
                    valid = True # innocent until proven guilty
                    # it has a name
                    if not "tableName" in tableInfo or tableInfo["tableName"] is None or len(tableInfo["tableName"]) == 0:
                        print("Tables must have a non-empty name specified in key \"tableName\"")
                        valid = False
                    # there are 1+ columns
                    if not "schema" in tableInfo or not (type(tableInfo["schema"]) is List or type(tableInfo["schema"]) is list) or len(tableInfo["schema"]) < 1 or not tableInfo["schema"]:
                        print("Table", tableInfo["tableName"], "must have a column schema containing at least 1 column of data to store.")
                        valid = False
                    if not "schema" in tableInfo or "id" in tableInfo["schema"]:
                        print("Table", tableInfo["tableName"], "must not have a column named \"id\", which is reserved for the table's primary key.")
                    # it has a name that will be recognized by the PostgresSQL database & server
                    
                    if not valid:
                        print("Skipping creation of table", tableInfo.get("tableName", "???"), "due to schema violation(s).")
                        continue
                    
                    with psycopg2.connect(**psycopg2config) as conn:
                        with conn.cursor() as cur:
                            # @TODO create a function to modify constraints rather than create new tables
                            currentCommand: str = "CREATE TABLE " + tableInfo["tableName"] + " ("

                            # since SQL cannot tolerate trailing commas, I will add the primary key last and never give it a comma.
                            # add in all of the columns
                            for columnInfo in tableInfo["schema"]:
                                # @TODO verify column validity
                                if not "name" in columnInfo:
                                    print("Skipping a column in table", tableInfo["tableName"], "due to missing \"name\" key in column schema.")
                                
                                columnDisplayName = toUnderscoreNotation(columnInfo["name"])
                                
                                # add in the column's name & datatype @TODO validate datatype
                                currentCommand += columnDisplayName + " " + columnInfo["datatype"] + ","
                                
                                # check out constraints
                                if columnInfo.get("unique", False) == True:
                                    currentCommand += "CONSTRAINT " + columnDisplayName + "_unique UNIQUE(" + columnDisplayName + "),"
                                if columnInfo.get("optional", True) == False:
                                    currentCommand += "CONSTRAINT " + columnDisplayName + "_optional NOT NULL,"
                                # @TODO CHECK (REGEX, number comparisons)
                                whitelist = columnInfo.get("whitelist", [])
                                if whitelist is list and len(whitelist) > 0: # @TODO datatype validation
                                    currentCommand += "CONSTRAINT " + columnDisplayName + "_whitelist CHECK (" + columnDisplayName + " IN ("
                                    for item in whitelist:
                                        if item is None: break # do NOT deal with null values.
                                        currentCommand += "\'" + str(item) + "\',"
                                    
                                    # strip trailing comma & add closing brackets
                                    currentCommand = currentCommand[:-1] + ")),"
                                # @TODO foreign keys
                                # @TODO defaults
                                
                            # add in ID column
                            currentCommand += "id SERIAL PRIMARY KEY"
                            
                            currentCommand += ")"
                            
                            # try to execute the command
                            cur.execute(currentCommand)
                            # print(currentCommand)
        except (psycopg2.DatabaseError) as error:
            print("Database error. Proceed with caution.")
            print(error)

    # NOTE: please contain not only the aliases but also the default recognized syntax as well
    aliases = {
        "run": do_runServer,
        "runServer": do_runServer,
        "install": do_install,
        "create_db_tables": do_create_db_tables,
        "create-db-tables": do_create_db_tables,
    }
    
    # made with code thanks to the first response of https://stackoverflow.com/questions/12911327/aliases-for-commands-with-python-cmd-module
    def default(self, line):
        cmd, arg, line = self.parseline(line)
        if cmd == "help":
            self.do_help(arg)
        elif cmd in self.aliases:
            self.aliases[cmd](self, arg)
        else:
            print("UH OH! - Unknown Syntax: %s" % line)


if __name__ == "__main__":
    wywy = Wywy()
    
    # run all passed in arguments as commands. TODO make this better and be able to pass in arguments
    for i in sys.argv:
        if i in wywy.aliases:
            wywy.onecmd(i)
    
    wywy.cmdloop()