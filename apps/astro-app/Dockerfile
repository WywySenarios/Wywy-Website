FROM node:lts AS runtime

WORKDIR /apps/astro-app

# install packages
COPY ./apps/astro-app/package*.json ./
RUN npm install
RUN npm run astro build

# copy global config
COPY ./config.yml ./../../

ENV HOST=0.0.0.0
ENV PORT=4321
EXPOSE 4321