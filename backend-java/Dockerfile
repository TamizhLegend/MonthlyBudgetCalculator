# syntax=docker/dockerfile:1

# ---- Build ----
FROM eclipse-temurin:17-jdk-jammy AS build
WORKDIR /workspace

COPY gradlew settings.gradle build.gradle gradle.properties ./
COPY gradle ./gradle
RUN chmod +x gradlew \
  && ./gradlew --no-daemon dependencies > /dev/null 2>&1 || true

COPY src ./src
RUN ./gradlew bootJar --no-daemon -x test \
  && cp build/libs/*.jar /workspace/app.jar

# ---- Runtime ----
FROM eclipse-temurin:17-jre-jammy AS runtime
WORKDIR /app

RUN groupadd --system spring \
  && useradd --system --gid spring --home-dir /app --shell /usr/sbin/nologin spring

COPY --from=build /workspace/app.jar /app/app.jar
RUN chown spring:spring /app/app.jar

USER spring:spring

# Render injects PORT; Spring maps it via application.yml (${PORT:...})
ENV JAVA_OPTS="-XX:+UseContainerSupport -XX:MaxRAMPercentage=75.0"
EXPOSE 8080

ENTRYPOINT ["sh", "-c", "exec java $JAVA_OPTS -jar /app/app.jar"]
