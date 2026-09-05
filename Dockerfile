# syntax=docker/dockerfile:1

########################
# Stage 1: dựng nội dung (cùng logic với webapp/scripts/dev.sh)
########################
FROM debian:bookworm-slim AS builder

WORKDIR /repo
COPY sources/ sources/
COPY webapp/  webapp/

RUN webapp/scripts/build-content.sh webapp/content \
 && rm -rf webapp/scripts webapp/package.json webapp/README.md

########################
# Stage 2: serve bằng nginx
########################
FROM nginx:alpine
COPY --from=builder /repo/webapp /usr/share/nginx/html
RUN sed -i '/^pid /d' /etc/nginx/nginx.conf && \
    sed -i '1i pid /tmp/nginx.pid;' /etc/nginx/nginx.conf
EXPOSE 80
