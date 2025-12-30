"""Helper script to create PostgreSQL tables based on the config.yml file.
@TODO write to stderr on errors, and figure out warnings, too
@TODO ensure that no table name or column name is used twice
"""
# imports
from os import environ as env
from typing import List, Literal
import re
import psycopg2
from psycopg2 import sql
import yaml

BASE_URL = "wywywebsite_database"

# Constants
RESERVED_DATABASE_NAMES = ["info"]
RESERVED_TABLE_NAMES = []
RESERVED_TABLE_SUFFIXES = ["tags", "tag_aliases", "_tag_names", "tag_groups"]
RESERVED_COLUMN_NAMES = ["id", "user", "users", "primary_tag"]
RESERVED_COLUMN_SUFFIXES  = ["_comments"]
PSQLDATATYPES: dict[str, str] = {
    "int": "integer",
    "integer": "integer",
    "float": "real",
    "number": "real",
    "double": "double precision",
    "str": "text",
    "string": "text",
    "text": "text",
    "bool": "boolean",
    "boolean": "boolean",
    "date": "date",
    "time": "time",
    "timestamp": "timestamp",
}
CONSTRAINT_NAMES = {
    "pkey": "pkey",
    "not_null": "not_null",
    "min": "min",
    "max": "max",
    "values": "values",
    "fkey": "fkey", # requires additional params afterward
    "unique": "unique",
    # "default": "default",
}

psycopg2config: dict = {
    "host": BASE_URL,
    "port": env["POSTGRES_PORT"],
    "user": env["DB_USERNAME"],
    "password": env["DB_PASSWORD"],
    "sslmode": "prefer"
}

# peak at config
with open("../../config.yml", "r") as file:
    config = yaml.safe_load(file)

def to_snake_case(target: str) -> str:
    """Attempts to convert from regular words/sentences to snake_case. This will not affect strings already in underscore notation. (Does not work with camelCase)
    @param target
    @return Returns underscore notation string. e.g. "hi I am Wywy" -> "hi_I_am_Wywy"
    """
    stringFrags: List[str] = re.split(r"[\.\ \-]", target)
    
    output: str = ""
    
    for i in stringFrags:
        output += i + "_"
    
    return output[:-1] # remove trailing underscore with "[:-1]"

def to_lower_snake_case(target: str) -> str:
    """Attempts to convert from regular words/sentences to lower_snake_case. This will not affect strings already in underscore notation. (Does not work with camelCase)
    @param target
    @return Returns lower_snake_case string. e.g. "hi I am Wywy" -> "hi_i_am_wywy"
    """
    stringFrags: List[str] = re.split(r"[\.\ \-]", target)
    
    output: str = ""
    
    for i in stringFrags:
        output += i.lower() + "_"
    
    return output[:-1] # remove trailing underscore with "[:-1]"

def validate_name(name: str, reserved_names: List[str]) -> bool:
    """
    @param name the name to validate
    @param reserved_names a list of reserved names to check for.
    @return Returns whether or not the name is reserved (validity)
    """
    for reserved_name in reserved_names:
        if name == reserved_name: return False
    return True

def validate_suffix(name: str, reserved_suffixes: List[str]) -> bool:
    """
    @param name the name to validate
    @param reserved_suffixes a list of suffixes to check for.
    @returns Returns whether or not the name's suffix is reserved (validity)
    """
    for reserved_suffix in reserved_suffixes:
        suffix_len = len(reserved_suffix)
        if len(name) >= suffix_len and name[:-suffix_len] == reserved_suffix:
            return False
    return True

def table_exists(conn, table_name: str) -> bool:
    """Checks if the given table exists inside the database related to the connection.
    @param conn the connection to the database that may contain the given table.
    @param table_name the table to check for
    @returns True if the table exists, False if it does not.
    """
    with conn.cursor() as cur:
        cur.execute("SELECT EXISTS (SELECT FROM pg_tables WHERE tablename = %s);", (table_name,))
        return cur.fetchone()[0]

def column_exists(conn, table_name: str, column_name: str) -> bool:
    """Checks if the column inside the given table exists. Assumes that the table already exists.
    @param conn the connection to the database that contains the table that may contain the given column.
    @param table_name the name of the table that may contain the given column.
    @param column_name the column to check for
    @returns True if the column exists, False if it does not.
    """
    with conn.cursor() as cur:
        cur.execute("SELECT EXISTS (SELECT * FROM information_schema.columns WHERE table_name = %s AND column_name = %s);", (table_name, column_name,))
        return cur.fetchone()[0]

def enforce_column(conn, table_name: str, column_schema: dict) -> bool:
    """Attempts to ensure that the column conforms to the given schema. Assumes that the respective table already exists. Will remove all constraints and repopulate them without necessarily validating previous data. Chooses to keep rather than destroy old data.
    @param conn the connection to the database that contains the table that will contain the given column.
    @param table_name the name of the table that will contain the given column.
    @param column_schema the column schema to enforce. This function assumes that column_schema is well-formed.
    @returns True if the column matches the schema, False if the column already exists under a different datatype.
    """
    column_name = column_schema["name"]

    # ensure that the column exists
    with conn.cursor() as cur:
        if column_exists(conn, table_name, column_name):
            cur.execute("SELECT datatype FROM information_schema.columns WHERE table_name=%s AND column_name=%s", (table_name, column_schema["name"],))
            is_datatype_correct: bool = cur.fetchone()[0] == PSQLDATATYPES[column_schema["datatype"]]
            if not is_datatype_correct: return False
        else:
            cur.execute("ALTER TABLE %s ADD %s %s", (table_name, column_name, PSQLDATATYPES[column_schema["datatype"]],))

    # remove existing constraints
    with conn.cursor() as cur:
        cur.execute("""
                    SELECT
                        constraint_name
                    FROM
                        information_schema.table_constraints
                    WHERE
                        table_name = %s AND constraint_name <> 'FOREIGN KEY' AND constraint_type NOT IN ('PRIMARY KEY', 'FOREIGN KEY');
                    """, (table_name,))
        constraints = cur.fetchall()
        for (constraint_name,) in cur.fetchall():
            cur.execute(sql.SQL(
                "ALTER TABLE {} DROP CONSTRAINT {};"
            ).format(
                sql.Identifier(table_name),
                sql.Identifier(constraint_name)
            ))
    # enforce schema
    # @TODO enforce fkey
    # check out constraints
    with conn.cursor() as cur:
        if column_schema.get("unique", False):
            cur.execute(sql.SQL(
                "ALTER TABLE {} ADD CONSTRAINT {} UNIQUE ({});"
            ).format(
                sql.Identifier(table_name),
                sql.Identifier(f"{table_name}_{column_name}_unique"),
                sql.Identifier(column_name),
            ))
        if not column_schema.get("optional", True):
            cur.execute(sql.SQL(
                "ALTER TABLE {} ADD CONSTRAINT {} NOT_NULL ({}) NOT VALID;"
            ).format(
                sql.Identifier(table_name),
                sql.Identifier(f"{table_name}_{column_name}_unique"),
                sql.Identifier(column_name),
            ))
        # @TODO CHECK (REGEX, number comparisons)
    
    # special checks for enum values:
    # @TODO
    
    # check for the comments column
    # do not remove old comments columns
    comments_column_exists = column_exists(conn, table_name, column_name + "_comments")
    if not "comments" in column_schema or not column_schema:
        if not comments_column_exists:
            with conn.cursor() as cur:
                cur.execute(sql.SQL("ALTER TABLE {} ADD COLUMN {} text DEFAULT "''";").format(
                    sql.Identifier(table_name),
                    sql.Identifier(column_name + "_comments"),
                ))
                
                cur.execute(sql.SQL("""
                                    CREATE TYPE {} AS ENUM ({});
                                    ALTER TABLE {} ADD COLUMN {} {};
                                    """).format(
                                        sql.Identifier(f"{table_name}_{column_name}_enum"),
                                        sql.SQL(", ").join(map(sql.Literal, column_schema["values"])),
                                        sql.Identifier(table_name),
                                        sql.Identifier(column_name),
                                        sql.Identifier(f"{table_name}_{column_name}_enum")
                                    ))
    elif comments_column_exists:
        return False
    return True


def enforce_reserved_columns(conn, table_schema: dict) -> bool:
    """Attempts to ensure that the table's reserved columns conform to its schema. Assumes that the respective tables already exist (the table itself and the tagging tables). (There's almost nothing this function can do to save the table if it doesn't conform to the schema) @TODO
    @param conn the connection to the database that contains the given table.
    @param table_schema the table schema to enforce. This function assumes that table_schema is well-formed.
    @returns True if the table matches the schema, False if there are reserved columns that should not exist.
    """
    with conn.cursor() as cur:
        # id column
        if not column_exists(conn, table_name, "id"): # @TODO check constraints & primary key status
            return False
        
        # primary_tag column
        if table_schema.get("tagging", False): # if the schema enables tagging,
            if not column_exists(conn, table_name, "primary_tag"): # @TODO check constraints
                cur.execute(sql.SQL("ALTER TABLE {} ADD COLUMN primary_tag text;").format(
                    sql.Identifier(table_name),
                ))
                cur.execute(sql.SQL("ALTER TABLE {} ADD CONSTRAINT {} FOREIGN KEY (primary_tag) REFERENCES {}(id)").format(
                    sql.Identifier(table_name),
                    sql.Identifier("fk_primary_tags"),
                    sql.Identifier(f"{table_name}_tags"),
                ))
        else: # if the schema does not specify tagging or disables tagging
            if column_exists(conn, table_name, "primary_tag"):
                return False
    return True

TAGGING_TABLE_NAMES = Literal["tag_names", "tags", "tag_aliases", "tag_groups"]
TAGGING_TABLE_STATEMENTS: dict[TAGGING_TABLE_NAMES, sql.SQL] = {
    "tag_names": sql.SQL("""
                         CREATE TABLE {} (
                            id SERIAL PRIMARY KEY,
                            tag_name TEXT NOT NULL
                         );
                         """),
    "tags": sql.SQL("""
                    CREATE TABLE {} (
                        id SERIAL PRIMARY KEY,
                        entry_id INT REFERENCES {} (id) NOT NULL,
                        tag_id INT REFERENCES tag_names (id) NOT NULL
                    );
                    """),
    "tag_aliases": sql.SQL("""
                         CREATE TABLE {} (
                            alias TEXT PRIMARY KEY,
                            tag_id INT REFERENCES tag_names (id) NOT NULL
                         );
                         """),
    "tag_groups": sql.SQL("""
                         CREATE TABLE {} (
                            id SERIAL PRIMARY KEY,
                            tag_id INT REFERENCES tag_names (id) NOT NULL,
                            group TEXT NOT NULL
                         );
                         """),
}

def create_tagging_tables(conn, table_name: str):
    """Creates related tagging tables if necessary.

    Args:
        conn (_type_): _description_
        table_name (str): The name of the target table.
    """
    # go through every table in order (foreign key dependencies)
    with conn.cursor() as cur:
        # tag names
        if not table_exists(conn, table_name + "_tag_names"):
            cur.execute(TAGGING_TABLE_STATEMENTS["tag_names"].format(sql.Identifier(table_name + "_tag_names")))
        
        # tags
        if not table_exists(conn, table_name + "_tags"):
            cur.execute(TAGGING_TABLE_STATEMENTS["tags"].format(sql.Identifier(table_name + "_tags"), sql.Identifier(table_name)))
        
        # tag aliases
        if not table_exists(conn, table_name + "_tag_aliases"):
            cur.execute(TAGGING_TABLE_STATEMENTS["tag_aliases"].format(sql.Identifier(table_name + "_tag_aliases")))
        
        # tag groups
        if not table_exists(conn, table_name + "_tag_groups"):
            cur.execute(TAGGING_TABLE_STATEMENTS["tag_groups"].format(sql.Identifier(table_name + "_tag_groups")))

if __name__ == "__main__":
    print("Attempting to create tables based on config.yml...")
    # loop through every database that has tables to be created
    for dbInfo in config["data"]:
        # immediately exit if the database name is empty
        if not "dbname" in dbInfo or dbInfo["dbname"] is None or not type(dbInfo["dbname"]) is str or len(dbInfo["dbname"]) == 0:
            print("Databases must have names under the key \"dbname\". Skipping the creation of a nameless database.")
            continue

        db_name = to_lower_snake_case(dbInfo["dbname"])

        # validate database name
        schema_violations: List[str] = []
        if not validate_name(db_name, RESERVED_DATABASE_NAMES):
            schema_violations.append(f"{db_name} is a reserved database name.")
        
        if len(schema_violations) > 0:
            print(f"Skipping creation of database {db_name} due to schema {"violation" if len(schema_violations) == 1 else "violations"}")
            for schema_violation in schema_violations:
                print(f" * {schema_violation}")

        psycopg2config.pop("dbname", None)
        
        # check if the table already exists
        # @TODO reduce the number of with statements
        conn = psycopg2.connect(**psycopg2config)
        conn.set_isolation_level(psycopg2.extensions.ISOLATION_LEVEL_AUTOCOMMIT)

        try:
            with conn.cursor() as cur:
                cur.execute("SELECT EXISTS (SELECT FROM pg_database WHERE datname = %s);", (dbInfo["dbname"],))
                dbExists = cur.fetchone()[0]
                
                if not dbExists:
                    try:
                        cur.execute("CREATE DATABASE " + dbInfo["dbname"] + ";")
                    except psycopg2.errors.DuplicateDatabase:
                        pass
        finally:
            conn.close()

        psycopg2config["dbname"] = db_name

        # loop through every table that needs to be created @TODO verify config validity to avoid errors
        for tableInfo in dbInfo.get("tables", []):
            # immediately skip if the table is nameless
            if not "tableName" in tableInfo or tableInfo["tableName"] is None or not type(tableInfo["tableName"]) is str or len(tableInfo["tableName"]) == 0:
                print(f"Tables must have a non-empty name specified in key \"tableName\". Skipping creation of a nameless table in {db_name}.")
                continue
            # convert to lower_snake_case
            table_name = to_lower_snake_case(tableInfo["tableName"])

            # skip any already created tables without raising any issues
            with psycopg2.connect(**psycopg2config) as conn:
                with conn.cursor() as cur:
                    cur.execute("SELECT EXISTS (SELECT FROM pg_tables WHERE tablename = '" + table_name + "');")
                    tableExists = cur.fetchone()[0]
                    
                    if tableExists:
                        print("Table \"", table_name, "\" already exists in database \"", dbInfo["dbname"] + "\"; skipping creation.", sep="")
                        continue
            
            # validate the table name
            # do not check for nameless tables because this was previously validated
            schema_violations: List[str] = []
            valid = True # innocent until proven guilty

            # avoid reserved table names
            if not validate_name(table_name, RESERVED_TABLE_NAMES):
                schema_violations.append(f"\"{tableInfo["table_name"]}\" is a reserved table name.")

            # avoid reserved table suffixes
            if not validate_suffix(table_name, RESERVED_TABLE_SUFFIXES):
                schema_violations.append(f"\"{tableInfo["table_name"]}\" contains a reserved table suffix ({RESERVED_TABLE_SUFFIXES}).")
                
            # there are 1+ columns
            if not "schema" in tableInfo or not (type(tableInfo["schema"]) is List or type(tableInfo["schema"]) is list) or len(tableInfo["schema"]) < 1 or not tableInfo["schema"]:
                schema_violations.append(f"Table {tableInfo["tableName"]} must have least 1 column of data to store.")

            if len(schema_violations) > 0:
                print(f"Skipping creation of table {db_name}/{table_name} due to schema {"violation" if len(schema_violations) == 1 else "violations"}:")
                for schema_violation in schema_violations:
                    print(f" * {schema_violation}")
            
            with psycopg2.connect(**psycopg2config) as conn:
                with conn.cursor() as cur:
                    # @TODO create a function to modify constraints rather than create new tables
                    currentCommand: str = "CREATE TABLE " + table_name + " ("

                    # since SQL cannot tolerate trailing commas, I will add the primary key last and never give it a comma.
                    # add in all of the columns
                    for columnInfo in tableInfo["schema"]:
                        if not "name" in columnInfo or columnInfo["name"] is None or not type(columnInfo["name"]) is str or len(columnInfo["name"]) == 0:
                            print(f"Columns must have a non-empty name under key \"name\". Skipping a column in {db_name}/{table_name}")
                        
                        # validate column name
                        column_name = to_snake_case(columnInfo["name"])
                        schema_violations: List[str] = []

                        if not validate_name(column_name, RESERVED_COLUMN_NAMES):
                            schema_violations.append(f"{column_name} is a reserved column name.")
                        
                        if not validate_suffix(column_name, RESERVED_COLUMN_SUFFIXES):
                            schema_violations.append(f"{column_name} contains a reserved column name suffix ({RESERVED_COLUMN_SUFFIXES}).")
                        
                        if len(schema_violations) > 0:
                            print(f"Skipping a column in {db_name}/{table_name} due to schema {"violation" if len(schema_violations) == 1 else "violations"}:")
                            for schema_violation in schema_violations:
                                print(f" * {schema_violation}")

                        # add in the column's name & datatype @TODO validate datatype
                        currentCommand += column_name + " " + PSQLDATATYPES[columnInfo["datatype"]] + ","
                        
                        # check out constraints
                        if columnInfo.get("unique", False) == True:
                            currentCommand += "CONSTRAINT " + column_name + "_unique UNIQUE(" + column_name + "),"
                        if columnInfo.get("optional", True) == False:
                            currentCommand += "CONSTRAINT " + column_name + "_optional NOT NULL,"
                        # @TODO CHECK (REGEX, number comparisons)
                        whitelist: list = columnInfo.get("whitelist", [])
                        if whitelist is list and len(whitelist) > 0: # @TODO datatype validation
                            currentCommand += "CONSTRAINT " + column_name + "_whitelist CHECK (" + column_name + " IN ("
                            for item in whitelist:
                                if item is None: break # do NOT deal with null values.
                                currentCommand += "\'" + str(item) + "\',"
                            
                            # strip trailing comma & add closing brackets
                            currentCommand = currentCommand[:-1] + ")),"
                        # comments
                        if columnInfo.get("comments", False):
                            currentCommand += column_name + "_comments text,"
                        # @TODO foreign keys
                        # @TODO defaults
                        
                    # add in ID column
                    currentCommand += "id SERIAL PRIMARY KEY"
                    
                    currentCommand += ")"
                    
                    # try to execute the command
                    cur.execute(currentCommand)
                    # print(currentCommand)
    
    print("Finished creating tables.")