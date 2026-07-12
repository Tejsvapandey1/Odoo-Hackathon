# TransitOps

TransitOps is a fleet operations platform for small and mid-size transport teams. It covers vehicle registry, driver management, trip dispatch, maintenance, fuel logs, expense tracking, and reporting.

This repo currently contains the backend API. The frontend is still planned, but the backend is already structured around that full product flow.

## Status

- Backend: implemented
- Database: MongoDB with Mongoose
- Auth: JWT + role-based access control
- Frontend: not added yet

## Backend Features

- User authentication with hashed passwords
- Four roles: `Fleet Manager`, `Driver`, `Safety Officer`, `Financial Analyst`
- Vehicle CRUD with soft-retire flow
- Driver CRUD with license-expiry tracking
- Trip lifecycle: `Draft -> Dispatched -> Completed/Cancelled`
- Maintenance workflow with automatic vehicle status updates
- Fuel and expense logging
- KPI and report endpoints
- CSV export for reports
- Seed script with demo users and sample operational data

## Business Rules Enforced

- Vehicle registration numbers must be unique
- Only `Available` vehicles appear in dispatch options
- Drivers with expired licenses cannot be dispatched
- Vehicles and drivers already on a trip cannot be reassigned
- Cargo weight cannot exceed vehicle capacity
- Completing a trip frees the vehicle and driver back to `Available`
- Maintenance puts a vehicle into `In Shop`
- A vehicle cannot open maintenance while already on a trip
- A vehicle cannot have multiple open maintenance logs
- Retired vehicles cannot be edited or dispatched again

## Tech Stack

- Node.js
- Express
- MongoDB
- Mongoose
- JSON Web Tokens
- bcryptjs

## Project Structure

```text
odoo-hack/
├── README.MD
└── server/
    ├── package.json
    ├── package-lock.json
    ├── .env.example
    ├── .gitignore
    └── src/
        ├── index.js
        ├── config/
        │   ├── db.js
        │   └── seed.js
        ├── middleware/
        │   ├── auth.js
        │   ├── auth-rbac.js
        │   ├── error.js
        │   ├── rbac.js
        │   └── validate.js
        ├── models/
        │   ├── User.js
        │   ├── Vehicle.js
        │   ├── Driver.js
        │   ├── Trip.js
        │   ├── MaintenanceLog.js
        │   ├── FuelLog.js
        │   └── Expense.js
        ├── routes/
        │   ├── auth.routes.js
        │   ├── vehicle.routes.js
        │   ├── driver.routes.js
        │   ├── trip.routes.js
        │   ├── maintenance.routes.js
        │   ├── fuel.routes.js
        │   ├── expense.routes.js
        │   └── reports.routes.js
        ├── services/
        │   ├── tripStateMachine.js
        │   ├── maintenanceFlow.js
        │   └── kpi.js
        └── utils/
            ├── asyncHandler.js
            └── csv.js
```

## Roles

### Fleet Manager

- Full vehicle access
- Full trip access
- Maintenance control
- Reports access
- Can register new users through the API

### Driver

- Can log fuel
- Can log expenses

### Safety Officer

- Can create and update driver records

### Financial Analyst

- Can access financial reports

## Main API Routes

### Auth

- `POST /api/auth/login`
- `POST /api/auth/register`
- `GET /api/auth/me`

### Vehicles

- `GET /api/vehicles`
- `GET /api/vehicles/available`
- `POST /api/vehicles`
- `GET /api/vehicles/:id`
- `PUT /api/vehicles/:id`
- `DELETE /api/vehicles/:id`

### Drivers

- `GET /api/drivers`
- `GET /api/drivers/available`
- `POST /api/drivers`
- `GET /api/drivers/:id`
- `PUT /api/drivers/:id`

### Trips

- `GET /api/trips`
- `POST /api/trips`
- `GET /api/trips/:id`
- `POST /api/trips/:id/dispatch`
- `POST /api/trips/:id/complete`
- `POST /api/trips/:id/cancel`

### Maintenance

- `GET /api/maintenance`
- `POST /api/maintenance`
- `POST /api/maintenance/:id/close`

### Fuel and Expenses

- `GET /api/fuel`
- `POST /api/fuel`
- `GET /api/expenses`
- `POST /api/expenses`

### Reports

- `GET /api/reports/dashboard`
- `GET /api/reports/fuel-efficiency`
- `GET /api/reports/trip-trend`
- `GET /api/reports/operational-cost`
- `GET /api/reports/roi`
- `GET /api/reports/export.csv?type=vehicles`
- `GET /api/reports/export.csv?type=drivers`
- `GET /api/reports/export.csv?type=trips`
- `GET /api/reports/export.csv?type=operational`
- `GET /api/reports/export.csv?type=roi`
- `GET /api/reports/export.csv?type=fuel`

## Setup

### 1. Install dependencies

```bash
cd server
npm install
```

### 2. Create environment file

Copy `.env.example` to `.env` inside `server/`.

Example:

```env
PORT=4000
MONGO_URI=mongodb://127.0.0.1:27017/transitops
JWT_SECRET=change-me-to-a-long-random-string
JWT_EXPIRES_IN=8h
CLIENT_URL=http://localhost:5173
SEED_ON_START=true
```

### 3. Start MongoDB

Run a local MongoDB instance or provide a MongoDB Atlas connection string in `MONGO_URI`.

### 4. Start the backend

```bash
cd server
npm run dev
```

The API starts on `http://localhost:4000` by default.

## Seed Data

If `SEED_ON_START=true`, the server seeds demo data the first time the database is empty.

Demo accounts:

| Email | Role | Password |
| --- | --- | --- |
| `manager@transitops.dev` | Fleet Manager | `password123` |
| `driver@transitops.dev` | Driver | `password123` |
| `safety@transitops.dev` | Safety Officer | `password123` |
| `finance@transitops.dev` | Financial Analyst | `password123` |

You can also run the seed manually:

```bash
cd server
npm run seed
```

## Current Backend Notes

- The server uses MongoDB transactions in trip and maintenance flows
- Input validation is handled at the route boundary, with schema validation in Mongoose
- CSV export is implemented without an extra CSV package
- There is no automated test suite yet

## Next Planned Work

- Build the React frontend
- Add protected UI flows for each role
- Add dashboards and charts on top of existing report endpoints
- Add tests for trip lifecycle and maintenance state transitions
- Add deployment config

## Development Notes

- Entry point: [server/src/index.js](/home/tejsva/Desktop/coding/odoo-hack/server/src/index.js:1)
- Seed script: [server/src/config/seed.js](/home/tejsva/Desktop/coding/odoo-hack/server/src/config/seed.js:1)
- Trip lifecycle logic: [server/src/services/tripStateMachine.js](/home/tejsva/Desktop/coding/odoo-hack/server/src/services/tripStateMachine.js:1)
- Maintenance flow: [server/src/services/maintenanceFlow.js](/home/tejsva/Desktop/coding/odoo-hack/server/src/services/maintenanceFlow.js:1)
- Reporting logic: [server/src/services/kpi.js](/home/tejsva/Desktop/coding/odoo-hack/server/src/services/kpi.js:1)
