Got the PDF content — it's a hackathon spec for "TransitOps", a transport operations platform. Let me follow the deep-research skill flow properly.

Good, I have plenty of factual background. Step 1 is done. Moving to Step 2.

Wait — Step 2 said "do not write any intermediate file." Let me remove that.

Step 2 judgment is in working context. Moving to Step 3.

Step 3 analysis is in working context. Moving to Step 4 — I have strong background from Step 1. Let me read the Step 4 prompt, then run a few targeted verification searches.

Step 4 research is complete. All 11 items handled (verified or carried into writing with reason). Moving to Step 5.

Now drafting the README in working context. Let me first lay out the structure, then write the file.

All headings checked, draft is solid. Writing the final README file.

Now running the Write-Time Audit Protocol. Let me extract all headings and check them.

Audit found a few issues. Let me fix them:

All audit checks pass. Let me clean up the workspace and finalize.

Done. Here's the deep research and the README, all in one file:

<deliver-assets>
<media type="md" src="commit-id-418912541716637" caption="TransitOps — implementation research + README" name="final_turn_001.md" />
</deliver-assets>

---

# TransitOps — Smart Transport Operations Platform

A full-stack web platform that digitizes the complete lifecycle of a logistics
fleet — vehicle registry, driver roster, dispatch, maintenance, fuel, and expense
tracking — for small and mid-size operators that still run on spreadsheets.

This document is both the project README and the end-to-end implementation
plan. A solo developer or a small team can use it as the single source of
truth to build the system inside an 8-hour hackathon window.

## Overview

TransitOps replaces ad-hoc spreadsheets and paper logbooks with one centralized
dashboard where a Fleet Manager sees the live state of every vehicle, a Driver
sees the trips assigned to them, a Safety Officer tracks license validity and
safety scores, and a Financial Analyst reviews operational cost and ROI per
vehicle. The system enforces ten mandatory business rules at the database and
API layer, so status transitions (Dispatched → On Trip → Available) cannot be
circumvented through a forgotten UI check.

The architecture is a classic three-tier monolith optimized for speed of
delivery: React + Vite on the front, Express + Mongoose in the middle, MongoDB
at the back. Everything runs in one local `npm run dev` — no Docker, no
microservices, no message broker.

## Features

The system ships in four functional blocks. The first covers identity, the
next three cover operations, tracking, and insight.

**Identity.** Email-and-password login with bcrypt-hashed credentials and
JWT sessions. Role-Based Access Control for four roles — Fleet Manager,
Driver, Safety Officer, Financial Analyst — wired through middleware so
that every route declares its allowed roles explicitly.

**Operations.** Vehicle Registry, Driver Management, Trip lifecycle, and
Maintenance. Each entity has its own status enum and CRUD surface, and
the trip and maintenance workflows are wired to the vehicle and driver
statuses so that no operator can leave a record in an inconsistent state.

**Tracking.** Fuel logs (liters, cost, date) and other expenses (tolls,
parking, miscellaneous). Per-vehicle aggregation is computed at query
time, so a single source of truth is preserved.

**Insight.** Reports for Fuel Efficiency, Fleet Utilization, Operational
Cost, and Vehicle ROI. KPI Dashboard with filter by vehicle type, status,
and region. CSV export of any report. Bonus: charts via Recharts, dark
mode, search and sort on every list, email reminders for expiring
licenses.

## Tech Stack

The stack is chosen so that every layer is installed from a single `package.json`
and started with `npm run dev`. The choices are validated against the spec's
eight-hour window and the four-role RBAC requirement.

| Layer            | Technology                       | Why this, in one line                              |
| ---------------- | -------------------------------- | -------------------------------------------------- |
| Frontend         | React 18 + Vite                  | Fastest dev loop for an 8-hour build [1]           |
| Styling          | Tailwind CSS                     | Utility classes; no custom CSS to write            |
| Routing          | React Router v6                  | Standard SPA routing                               |
| Server state     | TanStack Query (React Query)     | Cache, retries, and invalidation in one hook [2]   |
| Charts           | Recharts                         | Declarative, composable, ships with React          |
| Icons            | lucide-react                     | Tree-shakable SVG icons                            |
| Backend          | Node.js + Express                | Smallest possible API surface                      |
| Auth             | jsonwebtoken + bcryptjs          | Standard JWT + password hashing pattern [3]        |
| ODM              | Mongoose                         | Schemas, enums, and middleware for state machines [4] |
| Validation       | express-validator or Joi         | Reject bad payloads before they touch the DB       |
| CSV export       | json2csv                         | Mongoose docs → CSV in three lines [5]             |
| Database         | MongoDB (local or Atlas)         | Schemaless, fast to spin up, fits the entities     |
| File uploads     | multer (bonus)                   | Vehicle document upload, off the main path        |

The choice of MERN is corroborated by similar fleet-management MERN
implementations that shipped in comparable time windows [1][6].

## Architecture

```
┌──────────────────────────────────────────────────────────────────┐
│  Browser (React + Vite)                                          │
│  Pages: Login · Dashboard · Vehicles · Drivers · Trips · Maint.  │
│  Components: KPI cards · Recharts · TanStack Tables · Forms      │
└────────────────────────────┬─────────────────────────────────────┘
                             │  fetch (JSON) + Authorization: Bearer <jwt>
                             ▼
┌──────────────────────────────────────────────────────────────────┐
│  Express API (Node.js)                                           │
│  Middleware: cors · auth · requireRole · validate                │
│  Routes: /api/auth · /api/vehicles · /api/drivers · /api/trips  │
│          /api/maintenance · /api/fuel · /api/expenses · /reports │
│  Services: trip state machine · kpi aggregator · csv export      │
└────────────────────────────┬─────────────────────────────────────┘
                             │  Mongoose (ODM)
                             ▼
┌──────────────────────────────────────────────────────────────────┐
│  MongoDB                                                          │
│  Collections: users · vehicles · drivers · trips ·               │
│               maintenancelogs · fuellogs · expenses               │
└──────────────────────────────────────────────────────────────────┘
```

The monolith is the right shape for an 8-hour build. A service-per-entity
split adds deployment and network overhead that buys nothing at this scale;
the spec's mandatory business rules are easier to enforce when one transaction
can update Trip, Vehicle, and Driver atomically [7].

## Folder Structure

```
transitops/
├── server/
│   ├── src/
│   │   ├── index.js                # express bootstrap, cors, json
│   │   ├── config/
│   │   │   ├── db.js               # mongoose connection
│   │   │   └── seed.js             # demo data (4 users, 5 vehicles, 5 drivers)
│   │   ├── models/
│   │   │   ├── User.js
│   │   │   ├── Vehicle.js
│   │   │   ├── Driver.js
│   │   │   ├── Trip.js
│   │   │   ├── MaintenanceLog.js
│   │   │   ├── FuelLog.js
│   │   │   └── Expense.js
│   │   ├── middleware/
│   │   │   ├── auth.js             # verify JWT
│   │   │   └── rbac.js             # requireRole('Fleet Manager', ...)
│   │   ├── services/
│   │   │   ├── tripStateMachine.js # dispatch / complete / cancel logic
│   │   │   ├── maintenanceFlow.js  # open / close + status propagation
│   │   │   └── kpi.js              # dashboard aggregations
│   │   ├── routes/
│   │   │   ├── auth.routes.js
│   │   │   ├── vehicle.routes.js
│   │   │   ├── driver.routes.js
│   │   │   ├── trip.routes.js
│   │   │   ├── maintenance.routes.js
│   │   │   ├── fuel.routes.js
│   │   │   ├── expense.routes.js
│   │   │   └── reports.routes.js   # CSV export, KPI JSON
│   │   └── utils/
│   │       └── csv.js              # json2csv wrapper
│   ├── package.json
│   └── .env
└── client/
    ├── src/
    │   ├── main.jsx
    │   ├── App.jsx                 # router + auth context
    │   ├── api/
    │   │   └── client.js           # axios instance with bearer token
    │   ├── components/
    │   │   ├── Layout.jsx
    │   │   ├── Sidebar.jsx
    │   │   ├── KpiCard.jsx
    │   │   ├── DataTable.jsx
    │   │   ├── StatusBadge.jsx
    │   │   └── ModalForm.jsx
    │   ├── pages/
    │   │   ├── Login.jsx
    │   │   ├── Dashboard.jsx
    │   │   ├── Vehicles.jsx
    │   │   ├── Drivers.jsx
    │   │   ├── Trips.jsx
    │   │   ├── Maintenance.jsx
    │   │   ├── Fuel.jsx
    │   │   ├── Expenses.jsx
    │   │   └── Reports.jsx
    │   └── hooks/
    │       └── useAuth.js
    ├── index.html
    ├── tailwind.config.js
    ├── vite.config.js
    └── package.json
```

The split is one server folder and one client folder at the repo root, each
with its own `package.json`. A single `npm install` in each gets the project
running.

## Database Schema

The spec calls out seven entity names: Users, Roles, Vehicles, Drivers, Trips,
Maintenance Logs, Fuel Logs, Expenses. Roles are modeled as an enum on the
User (four values), which keeps the join trivial and matches the role-based
middleware pattern [3].

### User and Role Models

```js
// models/User.js
import mongoose from 'mongoose';

const ROLES = ['Fleet Manager', 'Driver', 'Safety Officer', 'Financial Analyst'];

const userSchema = new mongoose.Schema(
  {
    name:     { type: String, required: true, trim: true },
    email:    { type: String, required: true, unique: true, lowercase: true },
    password: { type: String, required: true, minlength: 8 }, // bcrypt hash
    role:     { type: String, required: true, enum: ROLES },
  },
  { timestamps: true }
);
```

`password` is stored as a bcrypt hash only. The salt rounds are set to 10 in
`User.create` so that the stored value is never reversible [3].

### Vehicle and Driver Models

```js
// models/Vehicle.js
import mongoose from 'mongoose';

const VEHICLE_STATUS = ['Available', 'On Trip', 'In Shop', 'Retired'];

const vehicleSchema = new mongoose.Schema(
  {
    registrationNumber: { type: String, required: true, unique: true, trim: true },
    name:               { type: String, required: true },
    type:               { type: String, required: true }, // e.g. Van, Truck, Bike
    region:             { type: String, default: 'Unassigned' },
    maxLoadCapacityKg:  { type: Number, required: true, min: 1 },
    odometerKm:         { type: Number, default: 0, min: 0 },
    acquisitionCost:    { type: Number, required: true, min: 0 },
    status:             { type: String, enum: VEHICLE_STATUS, default: 'Available', index: true },
    retiredAt:          { type: Date },
  },
  { timestamps: true }
);

// models/Driver.js
import mongoose from 'mongoose';

const DRIVER_STATUS = ['Available', 'On Trip', 'Off Duty', 'Suspended'];

const driverSchema = new mongoose.Schema(
  {
    name:              { type: String, required: true },
    licenseNumber:     { type: String, required: true, unique: true },
    licenseCategory:   { type: String, required: true }, // e.g. LMV, HMV
    licenseExpiryDate: { type: Date, required: true, index: true },
    contactNumber:     { type: String, required: true },
    safetyScore:       { type: Number, default: 100, min: 0, max: 100 },
    status:            { type: String, enum: DRIVER_STATUS, default: 'Available', index: true },
  },
  { timestamps: true }
);
```

Indexes on `status` and `licenseExpiryDate` make the dispatch dropdowns and
the expiring-license reminder query fast even with a few thousand records [4].

### Trip State Machine

```js
// models/Trip.js
import mongoose from 'mongoose';

const TRIP_STATUS = ['Draft', 'Dispatched', 'Completed', 'Cancelled'];

const tripSchema = new mongoose.Schema(
  {
    source:           { type: String, required: true },
    destination:      { type: String, required: true },
    vehicle:          { type: String, required: true, ref: 'Vehicle' },
    driver:           { type: String, required: true, ref: 'Driver' },
    cargoWeightKg:    { type: Number, required: true, min: 1 },
    plannedDistanceKm:{ type: Number, required: true, min: 0 },
    actualDistanceKm: { type: Number, default: 0, min: 0 },
    fuelConsumedL:    { type: Number, default: 0, min: 0 },
    revenue:          { type: Number, default: 0, min: 0 },
    finalOdometerKm:  { type: Number },
    status:           { type: String, enum: TRIP_STATUS, default: 'Draft', index: true },
    dispatchedAt:     { type: Date },
    completedAt:      { type: Date },
    cancelledAt:      { type: Date },
  },
  { timestamps: true }
);

// Pre-save: cargo weight must not exceed vehicle capacity (Rule 5)
tripSchema.pre('validate', async function (next) {
  if (this.isModified('cargoWeightKg') || this.isModified('vehicle')) {
    const v = await mongoose.model('Vehicle').findById(this.vehicle).lean();
    if (v && this.cargoWeightKg > v.maxLoadCapacityKg) {
      return next(new Error(`Cargo ${this.cargoWeightKg}kg exceeds ${v.name} capacity ${v.maxLoadCapacityKg}kg`));
    }
  }
  next();
});
```

The pre-validate hook enforces the load-capacity rule at the model layer so
it cannot be bypassed by any route, seed script, or future API consumer [4].

### Maintenance, Fuel, and Expense Models

```js
// models/MaintenanceLog.js
const maintenanceSchema = new mongoose.Schema(
  {
    vehicle:    { type: String, ref: 'Vehicle', required: true, index: true },
    type:       { type: String, required: true }, // Oil Change, Tire, Repair
    description:{ type: String },
    cost:       { type: Number, required: true, min: 0 },
    status:     { type: String, enum: ['Open', 'Closed'], default: 'Open', index: true },
    openedAt:   { type: Date, default: Date.now },
    closedAt:   { type: Date },
  },
  { timestamps: true }
);

// models/FuelLog.js
const fuelSchema = new mongoose.Schema(
  {
    vehicle:    { type: String, ref: 'Vehicle', required: true, index: true },
    trip:       { type: String, ref: 'Trip' },
    liters:     { type: Number, required: true, min: 0 },
    cost:       { type: Number, required: true, min: 0 },
    filledAt:   { type: Date, default: Date.now, index: true },
  },
  { timestamps: true }
);

// models/Expense.js
const expenseSchema = new mongoose.Schema(
  {
    vehicle:     { type: String, ref: 'Vehicle', required: true, index: true },
    category:    { type: String, enum: ['Toll', 'Parking', 'Misc'], required: true },
    amount:      { type: Number, required: true, min: 0 },
    description: { type: String },
    incurredAt:  { type: Date, default: Date.now, index: true },
  },
  { timestamps: true }
);
```

The schema mirrors the spec's "Expected Database Entities" list exactly and
nothing more. Adding fields later (driver name, vehicle name) is fine for
display but kept denormalized off the schema to avoid drift.

## Business Rules

The spec lists ten mandatory rules. They are implemented in two places: the
mongoose schema layer (format, range, uniqueness) and the route handlers
(state transitions, referential checks) [4][7]. The status transitions form a
small state machine, summarized here.

### Vehicle and Driver Selection

| Rule | Source spec | Where enforced                                    |
| ---- | ----------- | ------------------------------------------------- |
| R1   | Unique registration number        | `Vehicle.registrationNumber` unique index |
| R2   | Retired or In Shop vehicles never appear in dispatch | `GET /api/vehicles/available` filters `status: 'Available'` |
| R3   | Drivers with expired license or Suspended cannot be assigned | `dispatchTrip` pre-check; query also filters `status: 'Available', licenseExpiryDate: { $gte: today }` |
| R4   | Driver or vehicle already On Trip cannot be reassigned | Same dispatch pre-check; `findOne` on active trip |
| R5   | Cargo weight ≤ vehicle capacity   | `Trip.pre('validate')` hook |

### Trip Lifecycle Transitions

| From       | To          | Side effects on Vehicle and Driver                          |
| ---------- | ----------- | ------------------------------------------------------------ |
| Draft      | Dispatched  | vehicle → On Trip, driver → On Trip                          |
| Dispatched | Completed   | vehicle → Available, driver → Available                      |
| Dispatched | Cancelled   | vehicle → Available, driver → Available                      |
| Draft      | Cancelled   | no side effects                                              |

The side effects are applied inside a Mongoose transaction so that a partial
failure (network blip, validation error mid-loop) does not leave the system
in an inconsistent state [7].

### Maintenance Workflow

| Action       | Side effect on Vehicle                                          |
| ------------ | --------------------------------------------------------------- |
| Create log   | vehicle → In Shop (rules out the dispatch pool automatically)   |
| Close log    | vehicle → Available, unless status is already Retired           |

Both transitions are implemented as `findOneAndUpdate` with a filter on
`status: { $ne: 'Retired' }` on close, so a Retired vehicle stays Retired
even if its last maintenance log is closed late [7].

## API Surface

All routes return JSON. Authenticated routes require
`Authorization: Bearer <jwt>`. Role-restricted routes are noted.

```
POST   /api/auth/register                 create seed user (Fleet Manager only)
POST   /api/auth/login                    returns JWT
GET    /api/auth/me                       current user

GET    /api/vehicles                      list, supports ?type=&status=&region=
GET    /api/vehicles/available            list of Available only
POST   /api/vehicles                      Fleet Manager
GET    /api/vehicles/:id
PUT    /api/vehicles/:id                  Fleet Manager
DELETE /api/vehicles/:id                  Fleet Manager (soft-delete via Retired)

GET    /api/drivers                       list, supports ?status=&q=
GET    /api/drivers/available
POST   /api/drivers                       Fleet Manager, Safety Officer
GET    /api/drivers/:id
PUT    /api/drivers/:id                   Fleet Manager, Safety Officer

GET    /api/trips                         list, supports ?status=
POST   /api/trips                         create Draft
POST   /api/trips/:id/dispatch            Fleet Manager — applies R2..R5
POST   /api/trips/:id/complete            Fleet Manager — final odometer, fuel
POST   /api/trips/:id/cancel              Fleet Manager

GET    /api/maintenance                   list
POST   /api/maintenance                   Fleet Manager — vehicle → In Shop
POST   /api/maintenance/:id/close         Fleet Manager — vehicle → Available

POST   /api/fuel                          add fuel log
POST   /api/expenses                      add expense

GET    /api/reports/dashboard             JSON KPIs
GET    /api/reports/operational-cost      JSON, grouped by vehicle
GET    /api/reports/roi                   JSON, per vehicle
GET    /api/reports/export.csv?type=...   CSV download via json2csv
```

The CSV download uses `res.attachment(filename).send(csv)` so the browser
triggers a save dialog instead of rendering the response inline [5].

## KPI and Report Formulas

The spec gives Vehicle ROI explicitly; the others are standard fleet metrics
that follow industry convention [8][9][10]. All numbers are computed at query
time, not stored, so a single source of truth is preserved.

| KPI                 | Formula                                                                  |
| ------------------- | ------------------------------------------------------------------------ |
| Active Vehicles     | count of vehicles with status `On Trip`                                  |
| Available Vehicles  | count of vehicles with status `Available`                                |
| Vehicles in Maintenance | count of vehicles with status `In Shop`                              |
| Active Trips        | count of trips with status `Dispatched`                                  |
| Pending Trips       | count of trips with status `Draft`                                       |
| Drivers On Duty     | count of drivers with status `On Trip`                                   |
| Fleet Utilization % | `Active Vehicles / (Active + Available) × 100` [8]                       |
| Fuel Efficiency     | `actualDistanceKm / fuelConsumedL` for completed trips [9]              |
| Operational Cost    | `sum(fuel.cost) + sum(maintenance.cost)` per vehicle                    |
| Vehicle ROI         | `(revenue − (maintenance + fuel)) / acquisitionCost`  *(spec formula)*  |

The Vehicle ROI is the spec's exact formula, not a textbook ROI. It
intentionally ignores depreciation, financing, and driver wages; the spec
calls for this simplified ratio and the implementation should match it
verbatim [10].

## Authentication and RBAC

Auth follows the standard JWT + bcrypt pattern: the password is hashed in a
`User.pre('save')` hook, the login route compares the hash, and on success
returns a signed JWT whose payload includes the user's role [3].

```js
// middleware/auth.js
import jwt from 'jsonwebtoken';
export const auth = (req, res, next) => {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'No token' });
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    return next();
  } catch {
    return res.status(401).json({ error: 'Invalid token' });
  }
};

// middleware/rbac.js
export const requireRole = (...allowed) => (req, res, next) => {
  if (!req.user) return res.status(401).json({ error: 'Unauthenticated' });
  if (!allowed.includes(req.user.role)) {
    return res.status(403).json({ error: 'Forbidden' });
  }
  return next();
};
```

Route examples:

```js
router.post('/vehicles',     auth, requireRole('Fleet Manager'), createVehicle);
router.post('/maintenance',  auth, requireRole('Fleet Manager'), openMaintenance);
router.post('/fuel',         auth, requireRole('Fleet Manager', 'Driver'), logFuel);
router.get ('/reports/roi',  auth, requireRole('Fleet Manager', 'Financial Analyst'), getRoi);
```

The four roles and the default mapping are:

| Role               | Default access                                            |
| ------------------ | --------------------------------------------------------- |
| Fleet Manager      | Full CRUD on vehicles, drivers, trips, maintenance       |
| Driver             | Read own trips, log fuel and expenses                     |
| Safety Officer     | Read/write drivers and license information                |
| Financial Analyst  | Read-only on reports and operational cost                 |

## Getting Started

### Prerequisites

- Node.js 18 or later
- MongoDB 6 running locally, or a free MongoDB Atlas connection string
- npm 9 or later (yarn or pnpm also work)

### Environment Variables

Create `server/.env`:

```
PORT=4000
MONGO_URI=mongodb://127.0.0.1:27017/transitops
JWT_SECRET=change-me-to-a-long-random-string
JWT_EXPIRES_IN=8h
```

Create `client/.env`:

```
VITE_API_URL=http://localhost:4000
```

### Backend Bootstrap

```bash
cd server
npm install
npm run dev
# seeds demo data on first start
```

The seed script inserts four users (one per role), five vehicles, five
drivers, and a few completed trips so the dashboard is not empty on
day one.

### Frontend Bootstrap

```bash
cd client
npm install
npm run dev
# opens http://localhost:5173
```

### Seed Data

| Login email             | Role               | Password    |
| ----------------------- | ------------------ | ----------- |
| manager@transitops.dev  | Fleet Manager      | password123 |
| driver@transitops.dev   | Driver             | password123 |
| safety@transitops.dev   | Safety Officer     | password123 |
| finance@transitops.dev  | Financial Analyst  | password123 |

Change every password in production.

## 8-Hour Build Plan

The timeline is tight; the table below is the realistic minimum for a solo
developer familiar with MERN. Cut features in this order if you fall
behind: CSV export → charts → dark mode → email reminders.

| Hour | Block                | Deliverable                                                |
| ---- | -------------------- | ---------------------------------------------------------- |
| 0–1  | Bootstrap            | Repo split, Vite + Express scaffolds, MongoDB connected    |
| 1–2  | Auth                 | Register, login, JWT, RBAC middleware, four seed users     |
| 3    | Vehicle Registry     | CRUD, unique registration, status enum, status badge UI    |
| 4    | Driver Management    | CRUD, license expiry, status enum, filter by status        |
| 5    | Trip lifecycle       | Draft, dispatch (Rules 2–5), complete, cancel              |
| 6    | Maintenance + Fuel   | Open/close maintenance with auto In Shop; fuel + expenses  |
| 7    | Dashboard + Reports  | KPI cards, Recharts, CSV export, ROI formula               |
| 8    | Polish               | Dark mode, search/sort, README, demo script, deploy         |

The 8-Hour block assumes the developer has built at least one MERN CRUD app
before. First-time MERN teams should drop CSV export, charts, and email
reminders to land the core on time.

## Demo Script for Judges

Follow the spec's own nine-step example workflow [11]. Every step is a
click; nothing is a curl. The point is to show that the system enforces the
rules without anyone touching the database.

1. Log in as `manager@transitops.dev`.
2. Open Vehicles and register `Van-05`, maximum capacity 500 kg, status
   Available.
3. Open Drivers and register `Alex` with a valid license that expires in
   one year.
4. Open Trips and create a new trip with `Van-05`, `Alex`, cargo 450 kg,
   planned distance 120 km. Note that the system accepts 450 ≤ 500.
5. Open the same trip and click **Dispatch**. Verify that both `Van-05`
   and `Alex` now show status **On Trip** in their respective tables.
6. Open the trip, enter the final odometer and fuel consumed, and click
   **Complete**. Verify that both `Van-05` and `Alex` are back to
   **Available**.
7. Try to create a trip with cargo 600 kg against `Van-05` (500 kg). The
   system rejects it with a load-capacity error.
8. Open Maintenance and create an Oil Change log against `Van-05`. The
   vehicle flips to **In Shop** and disappears from the dispatch dropdown.
9. Open the Dashboard. Active Vehicles, Available Vehicles, and Fleet
   Utilization are updated, and the operational cost card reflects the
   fuel cost from the completed trip.

The script covers seven of the ten mandatory rules in under five minutes
and ends on the dashboard, which is where the judges' eyes land.

## Bonus Features

These are not in the 8-hour critical path but are quick to layer on once
the core is stable.

- Charts on the dashboard (bar: trips per day, line: fuel efficiency trend)
  using Recharts
- PDF export of the Vehicle ROI report using `pdfkit` or `puppeteer`
- Email reminders for expiring licenses using `nodemailer` and a daily
  `node-cron` job
- Vehicle document management: insurance papers, registration, photos,
  stored on disk and served back via a static route
- Search, filter, and sort on every list page using TanStack Table
- Dark mode by toggling a `dark` class on `<html>` and adding `dark:`
  variants in Tailwind

## Roadmap

The architecture leaves room for four classes of follow-up work, all
explicitly out of scope for the 8-hour build.

**Real-time operations.** Live GPS and telematics ingestion through MQTT
and Redis, constraint-based route optimization with traffic and weather
APIs, and WebSocket-pushed live map and ETAs. These all require a
streaming backbone and lie beyond the MERN monolith [12].

**Predictive analytics.** A predictive-maintenance module driven by
vehicle telemetry time series, plus utilization forecasting per vehicle.
The current reporting layer is descriptive; this layer would be
prescriptive.

**Multi-tenant and mobile.** Hard tenant isolation across logistics
companies, a dedicated mobile driver app on React Native or Flutter
with an offline cache, and ERP integration for payroll, billing, and
procurement.

**Data platform swap.** Migration to PostgreSQL with PostGIS for
richer geospatial queries, especially if real-time location becomes a
core requirement [12].

## References

1. NxtWave — "Real-Time Fleet Management System" (MERN reference build):
   https://hackmd.io/@NxtwaveNIAT/H1Tn2Jsbll
2. TanStack Query — server-state caching for React:
   https://tanstack.com/query/latest
3. freeCodeCamp — "How to Implement Role-Based Access Control in a Node.js
   REST API with JWT": https://www.freecodecamp.org/news/role-based-access-control-nodejs-rest-api-jwt/
4. Mongoose docs — Middleware and Validation:
   https://mongoosejs.com/docs/middleware.html
5. Stack Overflow — "How to export csv nodejs" (json2csv pattern):
   https://stackoverflow.com/questions/18306013/how-to-export-csv-nodejs
6. TheFleetFly — MERN fleet management showcase:
   https://www.linkedin.com/posts/aakashkumar19_project-showcase-thefleetfly-fleet-activity-7408532295319511042-Hnvt
7. Mongoose docs — Transactions:
   https://mongoosejs.com/docs/transactions.html
8. SkyBitz — "How To Calculate & Improve Fleet Utilization":
   https://www.skybitz.com/resources/articles/fleet-utilization
9. GoMotive — Fleet asset utilization formula:
   https://gomotive.com/blog/fleet-asset-utilization-guide/
10. Agile Fleet — "How to Calculate Fleet Management ROI":
    https://www.agilefleet.com/blog/how-to-calculate-fleet-management-roi
11. TransitOps spec — "Example Workflow" (steps 1–9):
    attached PDF, Section 5
12. Microsoft Fabric — "Fleet management reference architecture":
    https://learn.microsoft.com/en-us/fabric/real-time-intelligence/architectures/fleet-management

