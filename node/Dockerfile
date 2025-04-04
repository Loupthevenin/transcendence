FROM node:23-bookworm

RUN apt update -y && apt upgrade -y && apt install -y \
		tini \
        openssl\
        && apt clean

RUN mkdir -p /etc/node/ssl && \
        openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
        -keyout /etc/node/ssl/key.key \
        -out /etc/node/ssl/key.crt \
        -subj "/C=FR/ST=Paris/L=Paris/O=42/OU=ltheveni/CN=ltheveni.42.fr"

RUN mkdir -p /var/app

COPY ./app/ /var/app

WORKDIR /var/app

RUN npm install

EXPOSE $PORT

ENTRYPOINT ["tini", "--"]

CMD ["node", "app.js"]
