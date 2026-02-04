FROM node:lts AS runtime

WORKDIR /apps/astro-app

# copy the entrypoint
COPY apps/astro-app/entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

ENV HOST=0.0.0.0
ENV PORT=4321
EXPOSE 4321