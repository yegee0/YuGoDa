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
# Uses a glibc-based JRE image (NOT alpine/musl) — required by
# ONNX Runtime's native libraries (com.microsoft.onnxruntime).
# ─────────────────────────────────────────────────────────────────
FROM eclipse-temurin:21-jre AS runtime

# curl for HEALTHCHECK (Debian-based image doesn't include wget by default)
RUN apt-get update \
    && apt-get install -y --no-install-recommends curl \
    && rm -rf /var/lib/apt/lists/*

# Create a non-root user for security
RUN groupadd -r yugoda && useradd -r -g yugoda yugoda

WORKDIR /app

# Copy the fat JAR from the builder stage
COPY --from=builder /app/target/yugoda-backend-*.jar app.jar

RUN chown -R yugoda:yugoda /app

USER yugoda

# Default environment variables (override via docker run -e or docker-compose)
ENV SERVER_PORT=4000
ENV DB_HOST=localhost
ENV DB_PORT=5432
ENV DB_NAME=yugoda
ENV DB_USERNAME=postgres
ENV DB_PASSWORD=postgres

EXPOSE 4000

# Health check (Cloud Run also performs its own startup probe; this is for local docker)
HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 \
    CMD curl -fs http://localhost:4000/health || exit 1

ENTRYPOINT ["java", "-jar", "app.jar"]
