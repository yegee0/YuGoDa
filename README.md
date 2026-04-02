# YuGoDa

A food delivery platform where customers order surprise food bags from restaurants, managed by drivers and admins.

**Roles:** Customer · Restaurant / Store · Driver · Admin


---

## Quick Start (Docker)

> **Requires:** [Docker Desktop](https://www.docker.com/products/docker-desktop/)

**1. Copy the environment file**

```bash
cp .env.example .env
```

**2. Fill in your keys** (see [Environment Variables](#environment-variables) below)

**3. Start everything**

```bash
docker compose up --build
```

| Service  | URL                   |
|----------|-----------------------|
| Frontend | http://localhost:3000 |
| Backend  | http://localhost:4000 |

To stop:

```bash
docker compose down
```

---

## Environment Variables

Copy `.env.example` to `.env` and fill in the values.

| Variable | Required | Description |
|---|---|---|
| `GEMINI_API_KEY` | Yes | Google Gemini AI key — get one at [aistudio.google.com](https://aistudio.google.com) |
| `VITE_GOOGLE_MAPS_API_KEY` | Optional | Google Maps API key |
| `VITE_GOOGLE_MAPS_MAP_ID` | Optional | Google Maps style ID |
| `IYZICO_API_KEY` | Optional | iyzico payment key (defaults to sandbox dummy) |
| `IYZICO_SECRET_KEY` | Optional | iyzico payment secret (defaults to sandbox dummy) |
| `FIREBASE_PROJECT_ID` | Optional | Firebase project ID (defaults to `yugoda-5b36a`) |
| `FIREBASE_SERVICE_ACCOUNT_PATH` | Optional | Path to Firebase service account JSON for full token verification |

Firebase client keys are already set in `apps/frontend/.env.local` and baked into the bundle at build time.

---

## Project Structure

```
YuGoDa/
├── docker-compose.yml
├── .env.example
├── requirements.txt
│
└── apps/
    ├── backend/                      # Spring Boot API (Java 21, port 4000)
    │   ├── Dockerfile
    │   ├── pom.xml
    │   ├── firebase/                 # Firebase config templates & schema
    │   └── src/main/
    │       ├── java/yugoda/
    │       │   ├── controller/       # REST endpoints
    │       │   ├── service/          # Business logic
    │       │   ├── repository/       # Database access (Spring Data JPA)
    │       │   ├── model/            # JPA entities
    │       │   ├── config/           # CORS, Firebase setup
    │       │   ├── security/         # JWT auth filter
    │       │   └── payment/          # iyzico integration
    │       └── resources/
    │           └── application.properties
    │
    └── frontend/                     # React + Vite app (TypeScript, port 3000)
        ├── Dockerfile
        ├── package.json
        └── src/
            ├── app/                  # Entry point, routing, layouts, global store
            ├── pages/                # Full-page views (one per route)
            ├── components/           # Reusable UI components
            ├── hooks/                # Custom React hooks
            ├── lib/                  # API client, Firebase, i18n
            └── types/                # Shared TypeScript types
```

---

## Development (Without Docker)

### Backend

```bash
cd apps/backend
mvn spring-boot:run
```

### Frontend

```bash
cd apps/frontend
npm install
npm run dev
```

---

## Tech Stack

| Layer    | Technology |
|----------|-----------|
| Frontend | React 19, TypeScript, Vite, TailwindCSS, Zustand |
| Backend  | Spring Boot 3.2, Java 21, Spring Data JPA |
| Database | SQLite (persisted via Docker volume) |
| Auth     | Firebase Authentication (3 projects: customer / partner / admin) |
| Payment  | iyzico |
| Maps     | Google Maps, Leaflet |
| AI       | Google Gemini |
