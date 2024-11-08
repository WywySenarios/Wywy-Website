# Astro Starter Kit: Basics

```sh
npm create astro@latest -- --template basics
```

[![Open in StackBlitz](https://developer.stackblitz.com/img/open_in_stackblitz.svg)](https://stackblitz.com/github/withastro/astro/tree/latest/examples/basics)
[![Open with CodeSandbox](https://assets.codesandbox.io/github/button-edit-lime.svg)](https://codesandbox.io/p/sandbox/github/withastro/astro/tree/latest/examples/basics)
[![Open in GitHub Codespaces](https://github.com/codespaces/badge.svg)](https://codespaces.new/withastro/astro?devcontainer_path=.devcontainer/basics/devcontainer.json)

> 🧑‍🚀 **Seasoned astronaut?** Delete this file. Have fun!

![just-the-basics](https://github.com/withastro/astro/assets/2244813/a0a5533c-a856-4198-8470-2d67b1d7c554)

## 🚀 Project Structure

Inside of your Astro project, you'll see the following folders and files:

```text
/
├── public/
│   └── favicon.svg
├── src/
│   ├── components/
│   │   └── Card.astro
│   ├── layouts/
│   │   └── Layout.astro
│   └── pages/
│       └── index.astro
└── package.json
```

Astro looks for `.astro` or `.md` files in the `src/pages/` directory. Each page is exposed as a route based on its file name.

There's nothing special about `src/components/`, but that's where we like to put any Astro/React/Vue/Svelte/Preact components.

Any static assets, like images, can be placed in the `public/` directory.

## 🧞 Commands

All commands are run from the root of the project, from a terminal:

| Command                   | Action                                           |
| :------------------------ | :----------------------------------------------- |
| `npm install`             | Installs dependencies                            |
| `npm run dev`             | Starts local dev server at `localhost:4321`      |
| `npm run build`           | Build your production site to `./dist/`          |
| `npm run preview`         | Preview your build locally, before deploying     |
| `npm run astro ...`       | Run CLI commands like `astro add`, `astro check` |
| `npm run astro -- --help` | Get help using the Astro CLI                     |

## 👀 Want to learn more?

Feel free to check [our documentation](https://docs.astro.build) or jump into our [Discord server](https://astro.build/chat).


# Wywy's Website!!!

This is a framework for my personal website! Unforutnately, user friendliness is a secondary consideration when I am making this project.

## SETUP SERVER:
Note: npm REQUIRES execution policy to be set to "RemoteSigned" or a policy that is less strict than "RemoteSigned"

How to install node js on Windows: https://learn.microsoft.com/en-us/windows/dev-environment/javascript/nodejs-on-windows

Run the following command in the respective folder to install node packages:
npm install express cors body-parser ua-parser fs child_process

Install the python "google" package & verify your credentials. Read https://developers.google.com/sheets/api/quickstart/python

Make sure to put your credentials inside the root directory in a file called "credentials.json".

NOTE: runGetDaily.bat is automatically configured to run using a virtual environment. Change it if you need to use another installation of python.

Change the filepaths of "config\filepaths.cfg" to reflect the respective locations you are going to use. (absolute paths have not been tested)

## Why I used google sheets
Google Sheets is particularily annoying when it comes to processing data---it's super clunky to use complex formulas on a couple arrays of numbers inside the google sheet, and it eventually gets SUPER DUPER LAGGY when you're trying to process thousands of data points.

However, Google Sheets is super good at one thing---making it easy to input data. Yes, I made the server run around my lifestyle. I love it :P