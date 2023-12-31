FROM registry.gitlab.com/bitspur/rock8s/images/node:18.18.2-3.18 as builder

WORKDIR /code

RUN curl -Lo /usr/bin/yq https://github.com/mikefarah/yq/releases/download/v4.25.1/yq_linux_amd64 && \
    chmod +x /usr/bin/yq

COPY package.json .yarnrc.yml yarn.lock *.mk default.env mkpm.json mkpm Mkpmfile ./
COPY .mkpm/cache.tar.gz .mkpm/
COPY .yarn .yarn
COPY .git .git
RUN cp default.env .env && yarn
COPY . .
RUN yarn nest build --webpack
RUN yarn workspaces focus --production
RUN mkdir -p /tmp/app && \
    mv dist \
    node_modules \
    package.json \
    .env /tmp/app

FROM node:18.18.2-alpine

WORKDIR /opt/app

COPY --from=builder /tmp/app ./
COPY docker/entrypoint.sh /usr/local/sbin/entrypoint
RUN chmod +x /usr/local/sbin/entrypoint

ENTRYPOINT [ "/usr/local/sbin/entrypoint" ]

EXPOSE 3100
EXPOSE 3000

ENV CONTAINER=1 \
    DEBUG=0 \
    KEYCLOAK_ADMIN_PASSWORD= \
    KEYCLOAK_BASE_URL=http://keycloak:8080 \
    KEYCLOAK_CLIENT_ID= \
    KEYCLOAK_CLIENT_SECRET= \
    LOG_FILE_NAME= \
    LOG_LEVELS=error,warn,log \
    METRICS_PORT=3100 \
    OTEL_EXPORTER_JAEGER_ENDPOINT= \
    PORT=3000 \
    SWAGGER=0
