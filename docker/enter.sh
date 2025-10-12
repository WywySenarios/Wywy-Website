#!/bin/bash
TARGET="docker-astro-app"
VOLUMES="../apps/astro-app:/apps/astro-app"

sudo docker run -it --rm $VOLUMES -p 4321:4321 -p 2523:2523 $TARGET /bin/sh