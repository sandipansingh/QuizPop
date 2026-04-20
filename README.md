# QuizPop

A production-ready, full-stack quiz platform for solo practice and real-time multiplayer competition.

## Overview

QuizPop is a monorepo application that lets players answer quizzes individually or compete in live multiplayer rooms.
It combines a React client, Node.js API server, PostgreSQL persistence, Redis caching, and Socket.IO real-time events.

Key capabilities:

- Solo and multiplayer quiz modes
- Adaptive question delivery by category and difficulty
- Rating-based progression and leaderboard ranking
- Redis-backed performance optimizations
- JWT-based authentication and secure profile/avatar flows

## Features

### Game Modes

- Solo quiz flow for focused practice
- Multiplayer room flow for competitive gameplay

### Adaptive Question System

- Dynamic question retrieval with difficulty and category filters
- Question history awareness to reduce repetition

### Ranking and Leaderboard

- Rating progression per quiz outcomes
- Paginated leaderboard endpoint with metadata

### Real-time Gameplay

- Socket.IO room state synchronization
- Live multiplayer events and score progression

### Performance

- Redis caching for quiz pools, leaderboard snapshots, and user profiles
- Rate limiting for API hardening and abuse mitigation

### Authentication

- Access + refresh token flow
- Secure cookie handling for refresh token lifecycle
- Protected routes with auth middleware

## Architecture

QuizPop follows a workspace-based monorepo layout:

- apps/client: React + Vite SPA
- apps/server: Express + Socket.IO API server
- apps/server/prisma: schema and seed data

```mermaid
flowchart LR
    classDef client fill:#E6F6FF,stroke:#0077B6,color:#023047,stroke-width:2px
    classDef server fill:#FFF4E6,stroke:#FB8500,color:#7A3E00,stroke-width:2px
    classDef data fill:#E8F8EC,stroke:#2A9D8F,color:#0E4D45,stroke-width:2px

    C[React Client<br/>Vite + Zustand + Router]:::client
    S[Node.js Server<br/>Express + Socket.IO]:::server
    P[(PostgreSQL)]:::data
    R[(Redis)]:::data

    C -->|HTTPS + WebSocket| S
    S -->|Prisma| P
    S -->|Cache + Rate Limit| R
```

## 🛠️ Tech Stack

[![Tech Stack](https://skillicons.dev/icons?i=react,vite,nodejs,express,postgres,redis,docker,git,github,npm&perline=10)](https://skillicons.dev)

![Socket.IO](https://img.shields.io/badge/Socket.IO-010101?style=for-the-badge&logo=socketdotio&logoColor=white)
![Prisma](https://img.shields.io/badge/Prisma-2D3748?style=for-the-badge&logo=prisma&logoColor=white)
![Zustand](https://img.shields.io/badge/Zustand-4C3A2A?style=for-the-badge&logo=react&logoColor=white)
![JWT](https://img.shields.io/badge/JWT-000000?style=for-the-badge&logo=jsonwebtokens&logoColor=white)
![MinIO](https://img.shields.io/badge/MinIO-C72E49?style=for-the-badge&logo=minio&logoColor=white)

## Getting Started

### Prerequisites

- Node.js 18+
- npm 9+
- PostgreSQL 15+
- Redis 7+

### Installation

1. Clone repository.
2. Install workspace dependencies.
3. Configure environment variables.
4. Run database migration and seed.
5. Start client and server.

```bash
git clone https://github.com/yourusername/quiz-app.git
cd quiz-app
npm install

# server env
cp apps/server/.env.example apps/server/.env

# optional client env file
cp apps/client/.env.example apps/client/.env

# prisma lifecycle
npm run prisma:generate
npm run prisma:migrate
npm run prisma:seed

# run both apps in dev
npm run dev
```

## Environment Configuration

### Server

Required baseline variables:

```env
DATABASE_URL=postgresql://postgres:password@localhost:5432/quizpop?schema=public
REDIS_URL=redis://localhost:6379
JWT_SECRET=replace-with-a-strong-secret-at-least-32-characters
```

Commonly used production/server variables:

```env
NODE_ENV=development
PORT=4000
JWT_REFRESH_SECRET=replace-with-a-second-strong-secret
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
CORS_ORIGIN=http://localhost:5173
SOCKET_CORS_ORIGIN=http://localhost:5173
```

### Client

```env
VITE_API_BASE_URL=http://localhost:4000/api
VITE_SOCKET_URL=http://localhost:4000
```

## Running the App

### Development

```bash
npm run dev
```

Or run each app separately:

```bash
npm run dev:server
npm run dev:client
```

### Production

```bash
npm run build
npm run start
```

Containerized option:

```bash
docker-compose -f compose.prod.yaml up -d
```

## API Authentication and Docs

For API authentication details and interactive endpoint documentation, open the API docs page at /docs on the running server.

## Version

v1.0.0 - First stable release.

## License

Distributed under the MIT License. See LICENSE for more information.

---

Built with ❤️ by sandipansingh.
