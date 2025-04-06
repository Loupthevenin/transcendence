FROM node:23-bookworm

RUN apt update -y && apt upgrade -y && apt install -y \
        tini \
        openssl \
        && apt clean

ARG SSL_KEY_PATH
ARG SSL_CERT_PATH
ARG DOMAIN_NAME

RUN mkdir -p $(dirname "${SSL_KEY_PATH}") $(dirname "${SSL_CERT_PATH}")
RUN openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
        -keyout ${SSL_KEY_PATH} \
        -out ${SSL_CERT_PATH} \
        -subj "/C=FR/ST=Paris/L=Paris/O=42/OU=student/CN=${DOMAIN_NAME}"

RUN mkdir -p /var/app
COPY ./app/ /var/app

WORKDIR /var/app

RUN npm install
RUN npm run build

EXPOSE $PORT

ENTRYPOINT ["tini", "--"]

CMD ["node", "dist/server/app.js"]
