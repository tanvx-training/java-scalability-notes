# syntax=docker/dockerfile:1
# Build: docker build --build-arg SERVICE=catalog --build-arg APP_VERSION=2.0 -t shop/catalog:2.0 labs/cka/app
# Test:  docker build --target test --progress=plain labs/cka/app
FROM maven:3-eclipse-temurin-25 AS src
WORKDIR /src
COPY pom.xml .
COPY common/pom.xml common/
COPY gateway/pom.xml gateway/
COPY catalog/pom.xml catalog/
COPY order/pom.xml order/
COPY common/src common/src
COPY gateway/src gateway/src
COPY catalog/src catalog/src
COPY order/src order/src

FROM src AS test
RUN --mount=type=cache,target=/root/.m2 mvn -B test

FROM src AS build
RUN --mount=type=cache,target=/root/.m2 mvn -B -q -DskipTests package

FROM eclipse-temurin:25-jre AS runtime
ARG SERVICE
ARG APP_VERSION=1.0
ENV APP_VERSION=${APP_VERSION}
RUN useradd --system --uid 10001 --no-create-home app
COPY --from=build /src/${SERVICE}/target/${SERVICE}.jar /app/app.jar
USER 10001
EXPOSE 8080
ENTRYPOINT ["sh", "-c", "exec java -XX:MaxRAMPercentage=75 $JAVA_OPTS -jar /app/app.jar"]
