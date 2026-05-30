FROM node:lts AS base

ARG USER_ID

WORKDIR /apps/pipeline

RUN groupadd -g 2523 Wywy-Website && \
    useradd -g Wywy-Website -u ${USER_ID} -m -d /apps/pipeline wywy

RUN mkdir -p /tmp/.npm && chown -R ${USER_ID}:2523 /tmp/.npm

COPY apps/pipeline/package.json /apps/pipeline/package.json
RUN npm install
RUN chown -R wywy:Wywy-Website /apps/pipeline/node_modules

ENV npm_config_cache=/tmp/.npm

FROM base AS test

COPY --chown=wywy:Wywy-Website apps/pipeline /apps/pipeline

USER wywy

CMD ["npx", "vitest", "run"]
