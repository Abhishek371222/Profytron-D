# Profytron - Institutional-Grade Strategy Orchestration

Profytron is a high-performance, full-stack trading strategy builder and execution platform. It features a modern "Dark Luxury" aesthetic, real-time backtesting, and a node-based strategy architecture.

## 🚀 Architecture Overview

This project is a **turborepo monorepo** using `pnpm` for package management and `turbo` for build orchestration.

### 📦 Project Structure

- **`apps/web`**: Next.js 15 dashboard with hardware-inspired Terminal UI, Framer Motion animations, and Recharts telemetry.
- **`apps/api`**: NestJS backend providing the REST/WebSocket infrastructure, Prisma ORM, and Strategy execution logic.
- **`services/ai`**: Python-based AI service for strategy optimization and natural language strategy generation.
- **`services/backtest`**: High-performance Python backtesting engine for sub-millisecond strategy validation.
- **`packages/types`**: Shared TypeScript definitions and API interfaces used across the monorepo.

## 🛠️ Tech Stack

- **Frontend**: Next.js, Tailwind CSS, Lucide React, Framer Motion, Recharts, React Query.
- **Backend**: NestJS, PostgreSQL (Prisma), Redis, Supabase (Auth/Storage).
- **Languages**: TypeScript, Python.
- **Infrastructure**: Docker, Turbo, pnpm.

## 🏁 Getting Started

### 1. Prerequisites
- [PNPM](https://pnpm.io/installation) (v10+)
- [Docker & Docker Compose](https://docs.docker.com/get-docker/)
- [PostgreSQL](https://www.postgresql.org/download/)

### 2. Environment Setup
Create environment files from the provided templates:
```bash
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env.local
```
*Modify the `.env` files with your local database and provider credentials.*

### 3. Installation & Database
```bash
pnpm install
pnpm db:migrate
pnpm db:seed
```

### 4. Running the Stack
```bash
# Start all services (Web, API, AI, Backtest)
pnpm dev:full

# Start Core only (Web & API)
pnpm dev:all
```

## 🧠 Strategies Module

The Strategies module is the core of the Profytron platform, supporting the entire lifecycle of a trading node:

- **Builder**: A sophisticated visual engine for defining strategy parameters, conditions, and risk profiles.
- **Backtest Preview**: Real-time validation of unsaved strategy configurations against historical or mock data via the Python backtesting microservice.
- **Activation Modal**: A unified deployment flow for initializing, configuring, and starting strategy nodes.
- **Strategy Library**: Institutional-grade tracking of saved strategies with detailed performance metrics and node management.

## 📄 License
Private and Confidential. Internal Use Only.
