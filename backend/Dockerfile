FROM node:23-bookworm
LABEL project="transcendence"

RUN apt update -y && apt upgrade -y && apt install -y \
    tini \
    openssl \
    && apt clean

RUN mkdir -p /var/www/html/

COPY ./node.sh /var/

WORKDIR /var/app

EXPOSE 3000

ENTRYPOINT ["tini", "--"]

CMD ["/var/node.sh"]
