# FROM debian:bookworm AS build

# Remove both the sources file and the debian.list file duplicates
# RUN rm -f /etc/apt/sources.list.d/debian.list /etc/apt/sources.list.d/debian.sources
# add repository entry & install
# RUN echo "deb http://deb.debian.org/debian/ bookworm main contrib non-free" > /etc/apt/sources.list.d/debian.list
#RUN apt-get update && apt-get install -y lftp
# RUN apt-get update
# RUN apt-get install curl -y

FROM postgres:18 AS db

USER root

RUN apt-get update
RUN apt-get install curl -y

COPY --chown=postgres:postgres apps/postgres/backup.sh .
# COPY --from=build /usr/bin/lftp /usr/bin/lftp
# COPY --from=build /usr/bin/curl /usr/bin/curl

RUN chmod +x backup.sh

# USER postgres