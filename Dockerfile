FROM node:16.6.2

LABEL maintainer="Christian Schäfer <lonelessart@gmail.com> (@lonelesscodes)"

RUN apt update \
    && apt install -y \
        build-essential \
        # Install node-canvas dependencies, to build on unsupported system
        libcairo2-dev \
        libpango1.0-dev \
        libjpeg-dev \
        libgif-dev \
        librsvg2-dev \
        ffmpeg

RUN mkdir -p /app
WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build || true

VOLUME /app/data
VOLUME /app/logs

ENV NODE_ENV=production
ENV NODE_ICU_DATA=/app/node_modules/full-icu
CMD [ "node", "dist/index.js" ]

HEALTHCHECK --start-period=5m --interval=30s --timeout=10s CMD npm run health
# https://docs.docker.com/engine/reference/builder/#healthcheck
