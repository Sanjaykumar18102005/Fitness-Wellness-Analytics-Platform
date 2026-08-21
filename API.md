# API Reference — Fitness Club Membership & Wellness Analytics Platform

## Authentication & Authorization
All authenticated routes require a JWT token in the HTTP Header:
`Authorization: Bearer <JWT_TOKEN>`

### User Roles & Permissions (RBAC)
- **Member**: Access own profile, browse/book trainer slots, view own bookings, submit health assessment, log biometrics.
- **Trainer**: Configure availability slots, view assigned bookings, cancel assigned bookings.
- **Health Consultant**: Access risk-flag review queue, review flagged member health records.
- **Administrator**: Unrestricted access (manage all members, run renewal reminder job, add availability, review queue).

---

## 1. Authentication Module (`/api/auth`)

### 1.1 Register User
- **Method**: `POST`
- **Path**: `/api/auth/register`
- **Request Body**:
```json
{
  "email": "john.member@fitclub.com",
  "password": "Password123!",
  "name": "John Doe",
  "role": "member",
  "membership_plan_id": 1
}
```
- **Response (201 Created)**:
```json
{
  "user": {
    "id": 1,
    "email": "john.member@fitclub.com",
    "name": "John Doe",
    "role": "member",
    "membership_plan_id": 1,
    "membership_expiry": "2026-09-20T10:00:00.000Z"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6..."
}
```

### 1.2 User Login
- **Method**: `POST`
- **Path**: `/api/auth/login`
- **Request Body**:
```json
{
  "email": "john.member@fitclub.com",
  "password": "Password123!"
}
```
- **Response (200 OK)**:
```json
{
  "user": {
    "id": 1,
    "email": "john.member@fitclub.com",
    "name": "John Doe",
    "role": "member"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6..."
}
```

### 1.3 Get Current User Profile
- **Method**: `GET`
- **Path**: `/api/auth/profile`
- **Headers**: `Authorization: Bearer <TOKEN>`
- **Response (200 OK)**:
```json
{
  "id": 1,
  "email": "john.member@fitclub.com",
  "name": "John Doe",
  "role": "member",
  "membership_plan_id": 1,
  "health_flagged": false
}
```

---

## 2. Membership Module (`/api/membership`)

### 2.1 Get Membership Plans
- **Method**: `GET`
- **Path**: `/api/membership/plans`
- **Response (200 OK)**:
```json
[
  {
    "id": 1,
    "name": "Basic Tier",
    "price": 29.99,
    "duration_days": 30,
    "features": "Access to gym floor and standard locker rooms"
  }
]
```

### 2.2 Enroll in Plan
- **Method**: `POST`
- **Path**: `/api/membership/enroll`
- **Headers**: `Authorization: Bearer <TOKEN>`
- **Request Body**: `{ "planId": 2 }`
- **Response (200 OK)**:
```json
{
  "message": "Enrolled in Premium Tier successfully",
  "membership_expiry": "2026-09-20T10:00:00.000Z"
}
```

### 2.3 Run Automated Renewal Reminders Job (Admin)
- **Method**: `POST`
- **Path**: `/api/membership/reminders/run`
- **Headers**: `Authorization: Bearer <ADMIN_TOKEN>`
- **Response (200 OK)**:
```json
{
  "processedCount": 1,
  "notifiedMembers": [
    { "id": 1, "email": "expiring.member@fitclub.com" }
  ]
}
```

---

## 3. Scheduling Module (`/api/scheduling`)

### 3.1 Add Trainer Availability
- **Method**: `POST`
- **Path**: `/api/scheduling/availability`
- **Headers**: `Authorization: Bearer <TRAINER_OR_ADMIN_TOKEN>`
- **Request Body**:
```json
{
  "startTime": "2026-09-01T10:00:00Z",
  "endTime": "2026-09-01T11:00:00Z"
}
```
- **Response (201 Created)**:
```json
{
  "id": 5,
  "trainer_id": 3,
  "start_time": "2026-09-01T10:00:00.000Z",
  "end_time": "2026-09-01T11:00:00.000Z",
  "is_booked": false
}
```

### 3.2 Browse Open Availability Slots
- **Method**: `GET`
- **Path**: `/api/scheduling/availability`
- **Headers**: `Authorization: Bearer <TOKEN>`
- **Response (200 OK)**:
```json
[
  {
    "id": 5,
    "trainer_id": 3,
    "trainer_name": "Alex Rivera",
    "start_time": "2026-09-01T10:00:00.000Z",
    "end_time": "2026-09-01T11:00:00.000Z",
    "is_booked": false
  }
]
```

### 3.3 Book Session Slot (Atomic Lock)
- **Method**: `POST`
- **Path**: `/api/scheduling/book`
- **Headers**: `Authorization: Bearer <MEMBER_TOKEN>`
- **Request Body**: `{ "availabilityId": 5 }`
- **Response (201 Created)**:
```json
{
  "id": 10,
  "member_id": 1,
  "trainer_id": 3,
  "availability_id": 5,
  "start_time": "2026-09-01T10:00:00.000Z",
  "status": "confirmed"
}
```
- **Response on Conflict (409 Conflict)**:
```json
{
  "error": "Slot no longer available"
}
```

---

## 4. Health & Progress Module (`/api/health`)

### 4.1 Onboarding Health Assessment
- **Method**: `POST`
- **Path**: `/api/health/assessment`
- **Headers**: `Authorization: Bearer <MEMBER_TOKEN>`
- **Request Body**:
```json
{
  "medical_history": "Mild asthma, no prior cardiac conditions",
  "fitness_goals": "Increase core strength",
  "emergency_contact": "Jane Doe (555-0199)"
}
```
- **Response (201 Created)**:
```json
{
  "id": 1,
  "member_id": 1,
  "fitness_goals": "Increase core strength",
  "emergency_contact": "Jane Doe (555-0199)",
  "medical_history": "[ENCRYPTED_AT_REST]",
  "risk_flagged": false
}
```

### 4.2 Log Workout & Biometric Data
- **Method**: `POST`
- **Path**: `/api/health/metrics`
- **Headers**: `Authorization: Bearer <MEMBER_TOKEN>`
- **Request Body**:
```json
{
  "metric_type": "biometrics",
  "systolic_bp": 145,
  "diastolic_bp": 92,
  "heart_rate": 84,
  "weight_kg": 75.5
}
```
- **Response (201 Created)**:
```json
{
  "id": 3,
  "member_id": 1,
  "systolic_bp": 145,
  "diastolic_bp": 92,
  "risk_flagged": true,
  "risk_reasons": "High Systolic BP: 145 mmHg (Threshold: >140); High Diastolic BP: 92 mmHg (Threshold: >90)"
}
```

### 4.3 Consultant Risk Review Queue
- **Method**: `GET`
- **Path**: `/api/health/review-queue`
- **Headers**: `Authorization: Bearer <CONSULTANT_OR_ADMIN_TOKEN>`
- **Response (200 OK)**:
```json
[
  {
    "id": 1,
    "member_id": 1,
    "member_name": "John Doe",
    "source": "metric",
    "risk_reason": "High Systolic BP: 145 mmHg (Threshold: >140)",
    "status": "pending"
  }
]
```

---

## 5. Notification Module (`/api/notifications`)

### 5.1 View My Notifications Log
- **Method**: `GET`
- **Path**: `/api/notifications/my-notifications`
- **Headers**: `Authorization: Bearer <TOKEN>`
- **Response (200 OK)**:
```json
[
  {
    "id": 1,
    "type": "session_reminder",
    "payload": { "bookingId": 10, "startTime": "2026-09-01T10:00:00.000Z" },
    "status": "sent"
  }
]
```
