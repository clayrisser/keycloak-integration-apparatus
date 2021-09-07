FROM node:14.17.6-bullseye AS builder

WORKDIR /code

RUN apt-get update && apt-get install -y \
  build-essential \
  make \
  python

COPY package*.json *.mk Makefile /code/
RUN make -s +install

COPY . .
RUN make -s env && \
  make -s +generate +build

RUN make -s +build

RUN pwd && ls -a

FROM node:14-alpine

WORKDIR /opt/app

RUN apk add --no-cache \
  tini

COPY docker/context/entrypoint.sh /usr/local/sbin/entrypoint
RUN chmod +x /usr/local/sbin/entrypoint

COPY --from=builder /code/.env /code/package*.json ./
COPY --from=builder /code/dist ./dist
COPY --from=builder /code/node_modules ./node_modules

ENTRYPOINT [ "/sbin/tini", "--", "/usr/local/sbin/entrypoint" ]

EXPOSE 3000

ENV DEBUG=0 \
  SWAGGER=0
