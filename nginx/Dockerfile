FROM debian:bullseye

RUN apt-get update -y --fix-missing
RUN apt-get install -y --fix-missing nginx openssl
RUN rm -rf /var/lib/apt/lists/*

ARG SSL_KEY_PATH
ARG SSL_CERT_PATH
ARG DOMAIN_NAME

RUN mkdir -p $(dirname "${SSL_KEY_PATH}") $(dirname "${SSL_CERT_PATH}")
RUN openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
    -keyout ${SSL_KEY_PATH} \
    -out ${SSL_CERT_PATH} \
    -subj "/C=FR/ST=Paris/L=Paris/O=42/OU=student/CN=${DOMAIN_NAME}"

COPY ./conf/nginx.conf /etc/nginx/nginx.conf

RUN sed -i "s|SSL_KEY_PATH|${SSL_KEY_PATH}|g" /etc/nginx/nginx.conf && \
    sed -i "s|SSL_CERT_PATH|${SSL_CERT_PATH}|g" /etc/nginx/nginx.conf && \
    sed -i "s|DOMAIN_NAME|${DOMAIN_NAME}|g" /etc/nginx/nginx.conf

EXPOSE 443 8080

CMD [ "nginx", "-g", "daemon off;" ]