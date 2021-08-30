FROM node:14 AS builder

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

FROM node:14-alpine

WORKDIR /opt/app

RUN apk add --no-cache \
  make \
  musl \
  tini

COPY docker/context/entrypoint.sh /usr/local/sbin/entrypoint
RUN chmod +x /usr/local/sbin/entrypoint

COPY --from=builder /code/dist ./dist
COPY --from=builder /code/node_modules ./node_modules
COPY --from=builder /code/package*.json ./

ENTRYPOINT [ "/usr/local/sbin/entrypoint" ]

EXPOSE 3000

ENV BASE64_ENCODED_KEYCLOAK_ADMIN_PASSWORD= \
  BASE64_ENCODED_KEYCLOAK_ADMIN_USERNAME= \
  DEBUG=0 \
  KEYCLOAK_ADMIN_PASSWORD= \
  KEYCLOAK_ADMIN_USERNAME=admin \
  KEYCLOAK_BASE_URL=http://keycloak:8080 \
  KEYCLOAK_REALM=master \
  SWAGGER=0
