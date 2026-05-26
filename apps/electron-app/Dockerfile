FROM node:lts AS runner

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    wine64 \
    && rm -rf /var/lib/apt/lists/*

COPY apps/electron-app/entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh
