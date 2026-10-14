# ── Stage 1: Build ────────────────────────────────────────────────────────────
FROM eclipse-temurin:21-jdk AS builder
WORKDIR /app

# Copy maven wrapper + pom first (layer cache)
COPY backend/mvnw backend/mvnw.cmd ./
COPY backend/.mvn .mvn
COPY backend/pom.xml .

RUN chmod +x mvnw

# Download dependencies (cached unless pom.xml changes)
RUN ./mvnw dependency:go-offline -B

# Copy source and build
COPY backend/src src
RUN ./mvnw clean package -DskipTests -B

# ── Stage 2: Run ──────────────────────────────────────────────────────────────
FROM eclipse-temurin:21-jre
WORKDIR /app

COPY --from=builder /app/target/*.jar app.jar

EXPOSE 8080

ENTRYPOINT ["java", "-jar", "app.jar"]
