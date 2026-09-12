# System Architecture Document

## 1. High-Level Architecture
The system follows a standard 3-tier architecture designed for mobile-first consumption, scalability, and offline capabilities.

### 1.1. Presentation Layer (Frontend)
- **Framework:** Flutter or React Native (Cross-platform iOS/Android).
- **State Management:** Provider/Riverpod (Flutter) or Redux/Zustand (React).
- **Local Storage:** SQLite / Hive for offline-first support. Critical for finance apps so users can log expenses without an internet connection. Background sync handles server updates.

### 1.2. Application Layer (Backend API)
- **Environment:** Node.js with Express or NestJS.
- **Architecture:** RESTful API.
- **Authentication:** JWT (JSON Web Tokens) with refresh token rotation.
- **Hosting:** AWS EC2 or Render/Heroku for MVP.

### 1.3. Data Layer (Database)
- **Database:** PostgreSQL (Relational database is mandatory for financial ledgers to ensure ACID compliance).
- **ORM:** Prisma or TypeORM for type-safe database queries.

## 2. Key Architectural Decisions

### 2.1. Offline-First Synchronization
Transactions logged offline will be saved locally with a `sync_status = false`. A background worker will listen for network connectivity and push batched transactions to the backend, resolving conflicts based on `updated_at` timestamps.

### 2.2. The 60/40 Rule Engine
The calculation for alerts should be handled on the backend to maintain a single source of truth, but aggressively cached on the frontend (e.g., via Redis or local state) to ensure instant UI feedback when an expense is logged.
