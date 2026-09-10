


# AssistLink Server

This is the backend server for AssistLink — a full-stack web application that manages assistive device requests for patients, care centers, engineers, and administrators.

## Tech Stack

- **Node.js** — runtime environment
- **Express.js** — web framework for building the API
- **PostgreSQL** — relational database (connected via `pg`)
- **dotenv** — loads environment variables from `.env`
- **cors** — allows the React frontend to communicate with the server
- **morgan** — logs HTTP requests during development
- **bcrypt** — hashes user passwords before storing them

## Getting Started

### 1. Install dependencies
```bash
npm install
```

### 2. Create a PostgreSQL database

Open pgAdmin or psql and create a new database:

```bash
psql -U postgres -c "CREATE DATABASE assistlink_db"
```

Then apply the schema (creates tables and inserts sample data):

```bash
psql -U postgres -d assistlink_db -f schema.sql
```

### 3. Create a `.env` file in the root folder

```
DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@localhost:5432/assistlink_db
PORT=5000
```

### 4. Start the server

```bash
npm start
```

The server will run on **http://localhost:5000**

## Project Structure

```
assistlink-server/
│
├── db/
│   └── db.js               # PostgreSQL connection
├── middleware/
│   └── auth.js             # Role-based auth (adminAuth, careCenterAuth, engineerAuth)
├── routes/
│   ├── auth.js             # Signup & Login
│   ├── users.js            # User CRUD
│   ├── requests.js         # Request CRUD, status, measurements
│   ├── carecenters.js      # Care center CRUD
│   └── engineers.js        # Engineer CRUD
├── schema.sql              # Database schema + sample data
├── server.js               # Main Express server
└── .env                    # Environment variables
```

---

# API Endpoints

The API runs on **http://localhost:5000**

---

## Auth Routes

Base URL: `/api/auth`

| Method | Endpoint   | Description              |
|--------|------------|--------------------------|
| POST   | `/signup`  | Register a new user      |
| POST   | `/login`   | Login and get user info  |

### POST `/api/auth/signup`

**Request Body:**
```json
{
  "name": "Sarah Johnson",
  "email": "sarah@email.com",
  "password": "password123",
  "phone": "+254 712 345 678",
  "dateOfBirth": "1985-03-14",
  "role": "patient",
  "careCenterId": 1
}
```

**Response:**
```json
{
  "message": "User created successfully",
  "user": {
    "id": 12,
    "name": "Sarah Johnson",
    "email": "sarah@email.com",
    "phone": "+254 712 345 678",
    "role": "patient",
    "status": "active",
    "care_center_id": 1
  }
}
```

### POST `/api/auth/login`

**Request Body:**
```json
{
  "email": "sarah@email.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "message": "Login successful",
  "user": {
    "id": 12,
    "name": "Sarah Johnson",
    "email": "sarah@email.com",
    "role": "patient",
    "careCenterId": 1,
    "careCenterName": "Metropolitan Rehab Center",
    "careCenterLocation": "Nairobi"
  }
}
```

---

## User Routes

Base URL: `/api/users`

**Admin routes require header:** `x-role: admin`

| Method | Endpoint      | Description                  | Auth   |
|--------|---------------|------------------------------|--------|
| GET    | `/`           | Get all users                | admin  |
| GET    | `/patients`   | Get all patients             | none   |
| GET    | `/:id`        | Get user by ID               | none   |
| PUT    | `/:id`        | Update user                  | admin  |
| DELETE | `/:id`        | Delete user                  | admin  |

### GET `/api/users`

**Headers:** `x-role: admin`

**Response:**
```json
[
  {
    "id": 1,
    "name": "Admin User",
    "email": "admin@assistlink.com",
    "role": "admin",
    "status": "active"
  }
]
```

### GET `/api/users/patients`

**Response:**
```json
[
  {
    "id": 8,
    "name": "Sarah Johnson",
    "email": "sarah.johnson@email.com",
    "phone": "+254 712 345 678",
    "role": "patient",
    "status": "active",
    "care_center_id": 1
  }
]
```

### PUT `/api/users/:id`

**Headers:** `x-role: admin`

**Request Body:**
```json
{
  "name": "Sarah Johnson",
  "email": "sarah@email.com",
  "phone": "+254 700 000 000",
  "status": "active"
}
```

### DELETE `/api/users/:id`

**Headers:** `x-role: admin`

No request body needed.

---

## Request Routes

Base URL: `/api/requests`

| Method | Endpoint                     | Description                       | Auth        |
|--------|------------------------------|-----------------------------------|-------------|
| GET    | `/`                          | Get all requests                  | none        |
| GET    | `/patient/:patientId`        | Get requests by patient           | none        |
| GET    | `/engineer/:userId`          | Get requests by engineer          | none        |
| GET    | `/:id`                       | Get request by ID                 | none        |
| POST   | `/`                          | Create new request                | none        |
| PUT    | `/:id/status`                | Update request status             | care center |
| POST   | `/:id/measurements`          | Add measurements to request       | none        |

### POST `/api/requests`

**Request Body:**
```json
{
  "patientId": 8,
  "careCenterId": 1,
  "deviceType": "Prosthetic Limb",
  "reason": "New Device",
  "affectedArea": "Left leg, below knee",
  "notes": "Patient lost leg in an accident."
}
```

### PUT `/api/requests/:id/status`

**Headers:** `x-role: care-center`

**Request Body:**
```json
{
  "status": "Approved",
  "engineerId": 3
}
```

Or to reject:
```json
{
  "status": "Rejected"
}
```

### POST `/api/requests/:id/measurements`

**Request Body:**
```json
{
  "height": 165,
  "weight": 72,
  "limbLength": 45,
  "circumference": 38,
  "additionalNotes": "Patient prefers lightweight materials"
}
```

---

## Care Center Routes

Base URL: `/api/carecenters`

**Admin routes require header:** `x-role: admin`

| Method | Endpoint   | Description                | Auth   |
|--------|------------|----------------------------|--------|
| GET    | `/`        | Get all care centers       | none   |
| GET    | `/:id`     | Get care center by ID      | none   |
| POST   | `/`        | Create care center         | admin  |
| PUT    | `/:id`     | Update care center         | admin  |
| DELETE | `/:id`     | Delete care center         | admin  |

### POST `/api/carecenters`

**Headers:** `x-role: admin`

**Request Body:**
```json
{
  "name": "Metropolitan Rehab Center",
  "location": "Nairobi",
  "phone": "+254 20 123 4567",
  "email": "info@metropolitanrehab.ke",
  "address": "123 Main St",
  "description": "Rehabilitation & Prosthetics"
}
```

### PUT `/api/carecenters/:id`

**Headers:** `x-role: admin`

**Request Body:**
```json
{
  "name": "Metropolitan Rehab Center",
  "location": "Nairobi",
  "phone": "+254 20 123 4567",
  "description": "Updated description"
}
```

### DELETE `/api/carecenters/:id`

**Headers:** `x-role: admin`

No request body needed.

---

## Engineer Routes

Base URL: `/api/engineers`

**Admin routes require header:** `x-role: admin`

| Method | Endpoint   | Description                | Auth   |
|--------|------------|----------------------------|--------|
| GET    | `/`        | Get all engineers          | none   |
| GET    | `/:id`     | Get engineer by ID         | none   |
| POST   | `/`        | Create engineer            | admin  |
| PUT    | `/:id`     | Update engineer            | admin  |
| DELETE | `/:id`     | Delete engineer            | admin  |

### POST `/api/engineers`

**Headers:** `x-role: admin`

**Request Body:**
```json
{
  "userId": 5,
  "specialization": "Prosthetics",
  "status": "active"
}
```

### PUT `/api/engineers/:id`

**Headers:** `x-role: admin`

**Request Body:**
```json
{
  "specialization": "Orthotics",
  "status": "active"
}
```

### DELETE `/api/engineers/:id`

**Headers:** `x-role: admin`

No request body needed.

---

## Author

Yasmein Abaza — HTU Special Topics in Computer Science 1 — 2025-2026
