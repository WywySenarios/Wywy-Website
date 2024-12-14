# read current config
astroConfig = open("astro.config.mjs", "r")
output = astroConfig.read()

# find default config
astroConfig = open("scripts\\default", "r")
output = astroConfig.read()

# push default config
astroConfig = open("astro.config.mjs", "w")
astroConfig.write(output)
astroConfig.close()