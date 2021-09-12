# Build stage
FROM node:16.6.2 as builder

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
        librsvg2-dev

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

# remove build dependencies
RUN npm install --production

# Runtime stage
FROM node:16.6.2-slim

WORKDIR /app

COPY --from=builder /app/ /app/

EXPOSE 8080

VOLUME /app/data
VOLUME /app/logs

ENV NODE_ENV=production
CMD [ "node", "dist/index.js" ]

HEALTHCHECK --start-period=5m --interval=30s --timeout=10s CMD npm run health
# https://docs.docker.com/engine/reference/builder/#healthcheck
