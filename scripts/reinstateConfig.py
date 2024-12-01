import os

# read original code
astroConfig = open("scripts\\TEMPORARY_CLONE_astro.config.mjs", "r")
output = astroConfig.read()

# reinstate original code
astroConfig = open("astro.config.mjs", "w")
astroConfig.write(output)
astroConfig.close()

# remove copy of original once the original has been reinstated.
os.remove("scripts\\TEMPORARY_CLONE_astro.config.mjs")