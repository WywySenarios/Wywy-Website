FROM python:3.14.0-slim-bookworm
WORKDIR /apps/create_tables

COPY ./apps/create_tables .
COPY ./config.yml /

RUN pip install psycopg2-binary
RUN pip install --no-cache-dir PyYAML

CMD ["python3", "create_tables.py"]