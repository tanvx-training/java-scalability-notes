# syntax=docker/dockerfile:1

########################
# Stage 1: build nội dung (giống logic dev.sh)
########################
FROM debian:bookworm-slim AS builder

WORKDIR /repo
COPY . .

RUN webapp/build-content.sh webapp/content

########################
# Stage 2: serve bằng nginx
########################
FROM nginx:alpine
COPY --from=builder /repo/webapp /usr/share/nginx/html
RUN sed -i '/^pid /d' /etc/nginx/nginx.conf && \
    sed -i '1i pid /tmp/nginx.pid;' /etc/nginx/nginx.conf
EXPOSE 80
