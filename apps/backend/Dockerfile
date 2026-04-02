# ─────────────────────────────────────────────────────────────────
# Stage 1: Build
# Uses a full JDK + Maven image to compile the project and package it.
# ─────────────────────────────────────────────────────────────────
FROM maven:3.9.6-eclipse-temurin-21 AS builder

WORKDIR /app

# Copy pom.xml first and download dependencies (layer cache optimization)
COPY pom.xml .
RUN mvn dependency:go-offline -B

# Copy source code and build the fat JAR
COPY src ./src
RUN mvn package -DskipTests -B

# ─────────────────────────────────────────────────────────────────
# Stage 2: Runtime
# Uses a slim JRE image — no build tools, minimal attack surface.
# ─────────────────────────────────────────────────────────────────
FROM eclipse-temurin:21-jre-alpine AS runtime

# Create a non-root user for security
RUN addgroup -S yugoda && adduser -S yugoda -G yugoda

WORKDIR /app

# Copy the fat JAR from the builder stage
COPY --from=builder /app/target/yugoda-backend-*.jar app.jar

# Create data dir and set ownership before declaring VOLUME
# (Docker initialises named volumes from image content at first mount)
RUN mkdir -p /app/data && chown -R yugoda:yugoda /app

# Declare volume mount point AFTER ownership is set
VOLUME ["/app/data"]

USER yugoda

# Default environment variables (override via docker run -e or docker-compose)
ENV SERVER_PORT=4000
ENV DB_PATH=/app/data/yugoda.db
ENV IYZICO_API_KEY=dummy
ENV IYZICO_SECRET_KEY=dummy
ENV IYZICO_BASE_URL=https://sandbox-api.iyzipay.com
ENV APP_URL=http://localhost:4000

EXPOSE 4000

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
    CMD wget -qO- http://localhost:4000/health || exit 1

ENTRYPOINT ["java", "-jar", "app.jar"]
