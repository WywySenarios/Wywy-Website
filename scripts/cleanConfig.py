# read current config
astroConfig = open("astro.config.mjs", "r")
output = astroConfig.read()

# store current config for later reinstatement
astroConfig = open("scripts\\TEMPORARY_CLONE_astro.config.mjs", "w+")
astroConfig.write(output)
astroConfig.close()

# find default config
astroConfig = open("scripts\\default", "r")
output = astroConfig.read()

# push default config
astroConfig = open("astro.config.mjs", "w")
astroConfig.write(output)
astroConfig.close()