# AGENTS.md — Wywy-Website (Astro frontend)

## This repo is part of a multi-service control system

All commands run from `/etc/Wywy-Website-Control/`, NOT from inside this repo. See [`docs/wywy-website-control.mdx`](/etc/Wywy-Website-Control/docs/wywy-website-control.mdx) for control commands.

## Implementation plans

Plans live in the control repo: [`internal/implementation-plans/`](/etc/Wywy-Website-Control/internal/implementation-plans/)

## Service documentation

See [`internal/services/website.mdx`](/etc/Wywy-Website-Control/internal/services/website.mdx) for architecture, commands, config YAML, path aliases, content collections, and schema context. Docker container details at [`internal/services/website/containers/`](/etc/Wywy-Website-Control/internal/services/website/containers/).

## Dependencies

Prefer using existing dependencies over adding new ones. Before adding a new package, check `package.json` for something that already does what you need. Add only when there is no reasonable existing alternative.

## Git workflow

After making changes, stage them with `git add` for the next commit.

## Language conventions

When writing code, ALWAYS check the applicable language convention files in [`internal/conventions/languages/`](/etc/Wywy-Website-Control/internal/conventions/languages/):

- [`_shared.mdx`](/etc/Wywy-Website-Control/internal/conventions/languages/_shared.mdx) — applies to all languages
- [`typescript.mdx`](/etc/Wywy-Website-Control/internal/conventions/languages/typescript.mdx)
- [`tailwind.mdx`](/etc/Wywy-Website-Control/internal/conventions/languages/tailwind.mdx)
