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

## ✅ Comprehensive Testing Suite

Profytron includes a complete testing infrastructure covering 13 categories:

### Test Coverage
- **Unit Tests**: Authentication, Trading Calculations, Utilities (Jest)
- **Integration Tests**: API endpoints, Database interactions, Auth flows (Supertest)
- **E2E Tests**: Complete user journeys from signup to trading (Playwright-ready)
- **Stripe Testing**: Payment processing, Webhooks, Subscriptions, Refunds
- **API Testing**: cURL automation script + Postman collection (20+ endpoints)
- **Environment Validation**: .env configuration checks, security constraints
- **Performance Testing**: k6 load testing templates, Lighthouse frontend metrics
- **Security Testing**: JWT validation, SQL injection prevention, XSS checks, Rate limiting
- **Logging & Monitoring**: Sentry integration, Winston logging, Health checks
- **Error Handling**: Graceful degradation, Invalid request handling, Service resilience
- **Cross-Device Testing**: Responsive design validation across viewports

### Running Tests
```bash
# All unit + integration tests (NestJS)
pnpm --filter api test

# Specific test suite
pnpm --filter api test auth.service.spec.ts
pnpm --filter api test trading.service.spec.ts
pnpm --filter api test stripe.webhook.spec.ts

# API automation (cURL)
./api-tests.sh

# Environment validation
pnpm --filter api test env.validation.spec.ts

# Watch mode for TDD
pnpm --filter api test --watch
```

### Test Files Location
- **Unit Tests**: `apps/api/src/modules/{module}/*.spec.ts`
- **Integration Tests**: `apps/api/test/api.integration.spec.ts`
- **E2E Tests**: `apps/api/test/e2e.user-journey.spec.ts`
- **Automation**: `/api-tests.sh`, `/Profytron_API_Tests.postman_collection.json`
- **Documentation**: `/TESTING_GUIDE.md` (6,000+ words with setup instructions)

### Critical Tests (MUST PASS)
1. **Trading Calculations** - P&L, Sharpe ratio, max drawdown, position sizing
2. **Stripe Webhooks** - Payment success/failure, subscription management, idempotency
3. **Authentication** - Registration, email verification, JWT tokens, password hashing
4. **API Integration** - All protected endpoints, error responses, rate limiting
5. **Environment Validation** - No test keys in production, all required vars present

See [TESTING_GUIDE.md](./TESTING_GUIDE.md) for comprehensive setup and test scenarios.

## 📄 License
Private and Confidential. Internal Use Only.
