# AGENTS.md — Wywy-Website (Astro frontend)

## This repo is part of a multi-service control system

All commands run from `/etc/Wywy-Website-Control/`, NOT from inside this repo. See [`docs/wywy-website-control.mdx`](../../../etc/Wywy-Website-Control/docs/wywy-website-control.mdx) for control commands.

## Service documentation

See [`internal/services/website.mdx`](../../../etc/Wywy-Website-Control/internal/services/website.mdx) for architecture, commands, config YAML, path aliases, content collections, and schema context. Docker container details at [`internal/services/website/containers/`](../../../etc/Wywy-Website-Control/internal/services/website/containers/).

## Language conventions

When writing code, ALWAYS check the applicable language convention files in [`internal/conventions/languages/`](../../../etc/Wywy-Website-Control/internal/conventions/languages/):
- [`_shared.mdx`](../../../etc/Wywy-Website-Control/internal/conventions/languages/_shared.mdx) — applies to all languages
- [`typescript.mdx`](../../../etc/Wywy-Website-Control/internal/conventions/languages/typescript.mdx)
- [`tailwind.mdx`](../../../etc/Wywy-Website-Control/internal/conventions/languages/tailwind.mdx)
