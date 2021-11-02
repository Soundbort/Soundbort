# Build stage
FROM node:16.13.0-slim

LABEL maintainer="Christian Schäfer <lonelessart@gmail.com> (@lonelesscodes)"

RUN apt update \
    && apt install -y \
        build-essential \
        # Needed to build sodium
        libtool \
        # Install node-canvas dependencies, to build on unsupported system
        libcairo2-dev \
        libpango1.0-dev \
        libjpeg-dev \
        libgif-dev \
        librsvg2-dev \
        curl \
        ffmpeg

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

# remove build dependencies
RUN npm install --production \
 && npm cache clean --force

EXPOSE 8080

VOLUME /app/data
VOLUME /app/logs

ENV NODE_ENV=production
CMD [ "node", "dist/index.js" ]

HEALTHCHECK --start-period=5m --interval=30s --timeout=10s CMD npm run health
# https://docs.docker.com/engine/reference/builder/#healthcheck
