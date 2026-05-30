FROM node:lts

ARG USER_ID
ARG CACHE_URL
ARG DATABASE_URL
ARG MAIN_URL

WORKDIR /apps/pipeline

RUN groupadd -g 2523 Wywy-Website && \
    useradd -g Wywy-Website -u ${USER_ID} -m -d /apps/pipeline wywy

COPY apps/pipeline/package.json /apps/pipeline/package.json
RUN npm install

USER wywy

ENV CACHE_URL=${CACHE_URL}
ENV DATABASE_URL=${DATABASE_URL}
ENV MAIN_URL=${MAIN_URL}

CMD ["npx", "vitest", "run"]
