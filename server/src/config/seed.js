import 'dotenv/config';
import { fileURLToPath } from 'url';

import { connectDB, closeDB } from './db.js';
import User from '../models/User.js';
import Vehicle from '../models/Vehicle.js';
import Driver from '../models/Driver.js';
import Trip from '../models/Trip.js';
import FuelLog from '../models/FuelLog.js';
import MaintenanceLog from '../models/MaintenanceLog.js';
import Expense from '../models/Expense.js';

const daysFromNow = (d) => { const dt = new Date(); dt.setDate(dt.getDate() + d); return dt; };
const daysAgo = (d) => { const dt = new Date(); dt.setDate(dt.getDate() - d); return dt; };

// Idempotent on first server start: only seeds when the DB has no users.
export async function seedIfEmpty() {
  const count = await User.countDocuments();
  if (count > 0) {
    console.log('• Seed skipped (data already present)');
    return;
  }
  await seed();
}

export async function seed() {
  console.log('• Seeding demo data…');
  await Promise.all([
    User.deleteMany({}),
    Vehicle.deleteMany({}),
    Driver.deleteMany({}),
    Trip.deleteMany({}),
    FuelLog.deleteMany({}),
    MaintenanceLog.deleteMany({}),
    Expense.deleteMany({}),
  ]);

  await User.create([
    { name: 'Aria Manager', email: 'manager@transitops.dev', password: 'password123', role: 'Fleet Manager' },
    { name: 'Dan Driver', email: 'driver@transitops.dev', password: 'password123', role: 'Driver' },
    { name: 'Sara Safety', email: 'safety@transitops.dev', password: 'password123', role: 'Safety Officer' },
    { name: 'Fiona Finance', email: 'finance@transitops.dev', password: 'password123', role: 'Financial Analyst' },
  ]);

  const vehicles = await Vehicle.create([
    { registrationNumber: 'VAN-01', name: 'City Van 01', type: 'Van', region: 'North', maxLoadCapacityKg: 500, odometerKm: 42000, acquisitionCost: 25000 },
    { registrationNumber: 'TRK-02', name: 'Hauler 02', type: 'Truck', region: 'South', maxLoadCapacityKg: 8000, odometerKm: 210000, acquisitionCost: 120000 },
    { registrationNumber: 'BIK-03', name: 'Courier Bike 03', type: 'Bike', region: 'Central', maxLoadCapacityKg: 50, odometerKm: 18000, acquisitionCost: 4000 },
    { registrationNumber: 'VAN-04', name: 'City Van 04', type: 'Van', region: 'East', maxLoadCapacityKg: 750, odometerKm: 95000, acquisitionCost: 28000 },
    { registrationNumber: 'TRK-05', name: 'Hauler 05', type: 'Truck', region: 'West', maxLoadCapacityKg: 12000, odometerKm: 310000, acquisitionCost: 140000 },
  ]);

  const drivers = await Driver.create([
    // Carla's license expires soon — drives the expiring-license reminder.
    { name: 'Alex Rivera', licenseNumber: 'DL-1001', licenseCategory: 'LMV', licenseExpiryDate: daysFromNow(365), contactNumber: '555-0101', safetyScore: 92 },
    { name: 'Bo Kim', licenseNumber: 'DL-1002', licenseCategory: 'HMV', licenseExpiryDate: daysFromNow(730), contactNumber: '555-0102', safetyScore: 88 },
    { name: 'Carla Nunez', licenseNumber: 'DL-1003', licenseCategory: 'LMV', licenseExpiryDate: daysFromNow(10), contactNumber: '555-0103', safetyScore: 95 },
    { name: 'Devi Patel', licenseNumber: 'DL-1004', licenseCategory: 'HMV', licenseExpiryDate: daysFromNow(400), contactNumber: '555-0104', safetyScore: 79 },
    { name: 'Ethan Cole', licenseNumber: 'DL-1005', licenseCategory: 'LMV', licenseExpiryDate: daysFromNow(200), contactNumber: '555-0105', safetyScore: 84 },
  ]);

  // Completed trips so the Dashboard, ROI, and Fuel Efficiency reports are
  // non-empty on first launch. Vehicles/drivers stay Available (freed on close).
  const trips = [
    { v: 0, d: 0, source: 'Depot A', destination: 'Warehouse 7', cargo: 450, planned: 120, actual: 128, fuel: 14, rev: 1800, odo: 42128, ago: 1 },
    { v: 1, d: 1, source: 'Port', destination: 'Distribution Center', cargo: 6000, planned: 340, actual: 352, fuel: 95, rev: 12500, odo: 210352, ago: 5 },
    { v: 3, d: 2, source: 'Hub East', destination: 'Retail Park', cargo: 600, planned: 60, actual: 62, fuel: 8, rev: 900, odo: 95062, ago: 2 },
  ];
  for (const t of trips) {
    await Trip.create({
      vehicle: vehicles[t.v]._id,
      driver: drivers[t.d]._id,
      source: t.source,
      destination: t.destination,
      cargoWeightKg: t.cargo,
      plannedDistanceKm: t.planned,
      actualDistanceKm: t.actual,
      fuelConsumedL: t.fuel,
      revenue: t.rev,
      finalOdometerKm: t.odo,
      status: 'Completed',
      dispatchedAt: daysAgo(t.ago + 1),
      completedAt: daysAgo(t.ago),
    });
    await FuelLog.create({
      vehicle: vehicles[t.v]._id,
      liters: t.fuel,
      cost: Number((t.fuel * 1.6).toFixed(2)),
      filledAt: daysAgo(t.ago),
    });
  }

  // One open maintenance log puts a vehicle In Shop so it leaves the dispatch
  // pool immediately on first load.
  await MaintenanceLog.create({
    vehicle: vehicles[2]._id,
    type: 'Tire',
    description: 'Rear tire replacement',
    cost: 220,
    status: 'Open',
    openedAt: daysAgo(3),
  });
  await Vehicle.updateOne({ _id: vehicles[2]._id }, { status: 'In Shop' });

  console.log('✓ Seeded: 4 users, 5 vehicles, 5 drivers, 3 completed trips, 1 open maintenance log');
}

// Run directly via: npm run seed  (node src/config/seed.js)
const isMain = process.argv[1] && fileURLToPath(import.meta.url) === fileURLToPath(`file://${process.argv[1]}`);
if (isMain) {
  const uri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/transitops';
  connectDB(uri)
    .then(seed)
    .then(closeDB)
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('Seed failed:', err);
      process.exit(1);
    });
}
