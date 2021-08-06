FROM node:16.5.0

LABEL maintainer="Christian Schäfer <lonelessart@gmail.com> (@lonelesscodes)"

RUN apt update \
    && apt upgrade -y \
    && apt install -y \
        build-essential \
        # Install node-canvas dependencies, to build on unsupported system
        libcairo2-dev \
        libpango1.0-dev \
        libjpeg-dev \
        libgif-dev \
        librsvg2-dev \
        ffmpeg

RUN mkdir -p /app/node_modules && chown -R node:node /app
WORKDIR /app

COPY package*.json ./

USER node
RUN npm install

COPY --chown=node:node . .
RUN npm run build || true

VOLUME /app/data

ENV NODE_ENV=production
ENV NODE_ICU_DATA=/app/node_modules/full-icu
CMD [ "node", "--unhandled-rejections=strict", "dist/index.js" ]

HEALTHCHECK --start-period=5m --interval=30s --timeout=10s CMD npm run health
# https://docs.docker.com/engine/reference/builder/#healthcheck
