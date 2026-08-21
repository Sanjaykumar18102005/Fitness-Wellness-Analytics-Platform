# Fitness Club Membership & Wellness Analytics Platform (Sprint 1 MVP)

A centralized backend platform (with an interactive API-testable web frontend) for fitness clubs to manage memberships, trainer scheduling, health onboarding assessments, biometric logging, and risk analytics.

---

## 🌟 Key Architecture & Features

### 1. Membership Module
- **JWT-Based Authentication & Passwords**: Secure bcrypt hashing and JSON Web Tokens.
- **Role-Based Access Control (RBAC)**: Enforces access for `member`, `trainer`, `consultant`, and `admin` roles.
- **Membership Tiers & Renewal Reminders**: Automated job that identifies members expiring within 7 days and dispatches non-duplicate renewal alerts.

### 2. Scheduling Module (Atomic Lock & Conflict Prevention)
- **Trainer Availability Calendars**: Trainers and Admins configure available slots.
- **Double-Booking Conflict Prevention**: Uses PostgreSQL atomic row locks (`FOR UPDATE`) and state checks so that when two members attempt to book the same slot concurrently, **only the first succeeds (201 Created)** and the **second is rejected with 409 Conflict** ("Slot no longer available").
- **Booking Management**: Members and trainers view and cancel their bookings.

### 3. Health & Progress Module
- **Onboarding Assessment**: Validates required fields (`medical_history`, `fitness_goals`, `emergency_contact`) and encrypts medical history at rest using AES-256.
- **Biometric & Workout Validation**: Validates plausible numeric ranges (rejects negative weight, invalid heart rates, etc.).
- **Configurable Risk Thresholds**: Automatically flags records if Systolic BP > 140, Diastolic BP > 90, Heart Rate out of bounds, or risk keywords exist in health assessments.
- **Consultant Review Queue**: Dedicated queue restricted to `consultant` and `admin` roles to review flagged members.

### 4. Notification Module
- **Async Event-Driven Architecture**: Decouples notifications (`booking.created`, `membership.renewal_due`, `health.risk_flagged`) via an internal `EventEmitter` and Redis Pub/Sub.
- **Non-Blocking Reliability**: Notification delays or failures **never** block or delay synchronous HTTP requests (<2s latency).

---

## 📁 Project Structure

```
Fitness-Wellness-Analytics-Platform/
├── src/
│   ├── config/          # Database (Postgres/In-Memory), Redis, Risk Thresholds
│   ├── controllers/     # Auth, Membership, Scheduling, Health, Notifications
│   ├── middleware/      # JWT Authentication & RBAC role checkers
│   ├── routes/          # Express API route gateways
│   ├── services/        # Business logic, Event Emitter, Notification Dispatcher
│   ├── public/          # Sleek glassmorphic Web UI dashboard for testing
│   └── server.js        # Express app entry point
├── tests/
│   ├── unit/            # Unit tests (Membership renewal, Scheduling conflict, Health validation)
│   └── integration/     # Full end-to-end integration test suite
├── scripts/
│   ├── migrate.js       # Database schema migrations
│   └── seed.js          # Sample seed data for demo testing
├── API.md               # API Reference & Endpoint Specification
├── Dockerfile           # Multi-stage container definition (non-root node user)
├── docker-compose.yml   # App + Postgres 16 + Redis 7 composition
├── .env.example         # Environment template
└── README.md            # System documentation
```

---

## 🚀 Getting Started

### Option 1: Run via Docker Compose (Recommended)

1. Clone the repository:
   ```bash
   git clone <REPO_URL>
   cd Fitness-Wellness-Analytics-Platform
   ```

2. Start the stack (App, PostgreSQL 16, Redis 7):
   ```bash
   docker compose up --build
   ```

3. Run migrations and seed sample data inside container:
   ```bash
   docker compose exec app npm run seed
   ```

4. Run the full unit and integration test suite inside container:
   ```bash
   docker compose exec app npm test
   ```

5. Open the Web Dashboard in your browser:
   `http://localhost:3000`

---

### Option 2: Local Standalone Execution (Node.js)

1. Install dependencies:
   ```bash
   npm install
   ```

2. Copy environment file:
   ```bash
   cp .env.example .env
   ```

3. Run unit & integration tests:
   ```bash
   npm test
   ```

4. Start dev server:
   ```bash
   npm run dev
   ```

---

## 🧪 Smoke-Test cURL Commands

### 1. Register a Member
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "smoke.member@fitclub.com",
    "password": "Password123!",
    "name": "Smoke Tester",
    "role": "member"
  }'
```

### 2. Login & Save JWT Token
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john.member@fitclub.com",
    "password": "Password123!"
  }'
```

### 3. Fetch Membership Plans
```bash
curl -X GET http://localhost:3000/api/membership/plans
```

### 4. Browse Open Trainer Availability Slots
```bash
curl -X GET http://localhost:3000/api/scheduling/availability \
  -H "Authorization: Bearer <TOKEN>"
```

### 5. Book Trainer Slot (Atomic Conflict Check)
```bash
curl -X POST http://localhost:3000/api/scheduling/book \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <TOKEN>" \
  -d '{ "availabilityId": 1 }'
```

### 6. Submit Onboarding Health Assessment
```bash
curl -X POST http://localhost:3000/api/health/assessment \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <TOKEN>" \
  -d '{
    "medical_history": "Mild hypertension, no surgeries",
    "fitness_goals": "Lower blood pressure",
    "emergency_contact": "Jane 555-0199"
  }'
```

### 7. Log Biometrics (Trigger Risk Threshold Flag)
```bash
curl -X POST http://localhost:3000/api/health/metrics \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <TOKEN>" \
  -d '{
    "systolic_bp": 145,
    "diastolic_bp": 92,
    "heart_rate": 85,
    "weight_kg": 74
  }'
```

### 8. View Consultant Risk Review Queue (Consultant / Admin Only)
```bash
curl -X GET http://localhost:3000/api/health/review-queue \
  -H "Authorization: Bearer <CONSULTANT_TOKEN>"
```

### 9. View Async Notifications Log
```bash
curl -X GET http://localhost:3000/api/notifications/my-notifications \
  -H "Authorization: Bearer <TOKEN>"
```

---

## 🌿 Gitflow Workflow

This repository strictly adheres to Gitflow branching:
- `main`: Production release branch.
- `develop`: Integration branch.
- `feature/*`: Scoped feature development (`feature/membership-auth`, `feature/trainer-scheduling`, `feature/health-progress`, `feature/notification-service`).

Conventional commit messages are enforced across all commits.
