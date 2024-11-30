astroConfig = open("astro.config.mjs", "r")

output = astroConfig.read()
output = output.replace("import node from '@astrojs/node';", "\n")
output = output.replace("import react from '@astrojs/react';", "\n")
output = output.replace("import tailwind from '@astrojs/tailwind';", "\n")
output = output.replace("integrations: [react(), tailwind({applyBaseStyles: false})]", "//integrations: [react(), tailwind({applyBaseStyles: false})]")

astroConfig = open("astro.config.mjs", "w")
astroConfig.close()
print("Succesfully cleaned config.")