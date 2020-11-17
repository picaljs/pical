

ARG BASE_IMAGE=node:14-alpine
ARG OVERLAY_VERSION=v2.1.0.2

FROM $BASE_IMAGE as builder

ARG OVERLAY_VERSION
WORKDIR /app

COPY src  /app/src
COPY package.json tsconfig.json /app/

RUN npm install && \
    npm run build

FROM $BASE_IMAGE

ARG OVERLAY_VERSION
ARG OVERLAY_ARCH
ARG TARGETARCH

LABEL org.opencontainers.image.created https://github.com/picaljs/pical
LABEL org.opencontainers.image.source https://github.com/picaljs/pical
LABEL org.opencontainers.image.authors "Joshua Avalon"
LABEL org.opencontainers.image.url https://github.com/picaljs/pical
LABEL org.opencontainers.image.documentation https://github.com/picaljs/pical

WORKDIR /app

ENV NODE_ENV="production"
ENV PICAL_LOCAL_BASE_DIR="/data"
ENV PICAL_UNSAFE_PLAIN
ENV PICAL_PORT

# (Optional) Use S3 Storage
ENV PICAL_S3_END_POINT
ENV PICAL_S3_USE_SSL
ENV PICAL_S3_PORT
ENV PICAL_S3_ACCESS_KEY
ENV PICAL_S3_SECRET_KEY
ENV PICAL_S3_BUCKET

COPY --from=builder /app/lib /app/lib
COPY package.json /app/
COPY docker/root/ /

RUN apk add --no-cache bash
SHELL ["/bin/bash", "-c"]

RUN apk add --no-cache --virtual=build-dependencies curl tar && \
    if [[ "$TARGETARCH" == arm* ]]; then OVERLAY_ARCH=arm; else OVERLAY_ARCH="$TARGETARCH"; fi && \
    curl -L "https://github.com/just-containers/s6-overlay/releases/download/${OVERLAY_VERSION}/s6-overlay-${OVERLAY_ARCH}.tar.gz" | tar xz -C / && \
    apk del --purge build-dependencies

RUN npm install --production && \
    chmod +x /app/pical.sh

RUN apk add --no-cache shadow && \
    useradd -u 1001 -U -d /config -s /bin/false pical && \
    usermod -G users pical

ENTRYPOINT ["/init"]
CMD []
