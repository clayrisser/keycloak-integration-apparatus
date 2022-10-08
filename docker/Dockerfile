FROM node:16-bullseye AS builder

WORKDIR /code

RUN apt-get update && apt-get install -y \
  build-essential \
  git \
  git-lfs \
  make \
  python

COPY .yarn .yarn
COPY .git .git
COPY .mkpm/.bootstrap.mk .mkpm/.cache.tar.gz .mkpm/
COPY package.json yarn.lock .yarnrc* *.mk Makefile .gitattributes ./
RUN make -s +install
COPY . .
RUN make -s +build

FROM node:16-bullseye

WORKDIR /opt/app

RUN apt-get update && apt-get install -y \
  tini && \
  rm -rf /var/lib/apt/lists/*

COPY docker/entrypoint.sh /usr/local/sbin/entrypoint
RUN chmod +x /usr/local/sbin/entrypoint

COPY --from=builder /code/.env /code/package.json ./
COPY --from=builder /code/dist ./dist
COPY --from=builder /code/node_modules ./node_modules

ENTRYPOINT [ "/sbin/tini", "--", "/usr/local/sbin/entrypoint" ]

EXPOSE 3000

ENV DEBUG=0 \
  SWAGGER=0
