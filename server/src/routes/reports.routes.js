import { Router } from 'express';
import Vehicle from '../models/Vehicle.js';
import Driver from '../models/Driver.js';
import Trip from '../models/Trip.js';
import FuelLog from '../models/FuelLog.js';
import { auth, requireRole } from '../middleware/auth-rbac.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { sendCSV } from '../utils/csv.js';
import {
  getDashboardKPIs,
  getFuelEfficiency,
  getOperationalCost,
  getRoi,
  getTripTrend,
} from '../services/kpi.js';

const router = Router();
router.use(auth);

function reportFilters(query) {
  const { type, status, region } = query;
  return { ...(type && { type }), ...(status && { status }), ...(region && { region }) };
}

router.get('/dashboard', asyncHandler(async (req, res) => {
  const kpis = await getDashboardKPIs(reportFilters(req.query));
  res.json(kpis);
}));

router.get('/fuel-efficiency', asyncHandler(async (_req, res) => {
  res.json(await getFuelEfficiency());
}));

router.get('/trip-trend', asyncHandler(async (_req, res) => {
  res.json(await getTripTrend());
}));

router.get(
  '/operational-cost',
  requireRole('Fleet Manager', 'Financial Analyst'),
  asyncHandler(async (_req, res) => {
    res.json(await getOperationalCost());
  })
);

router.get(
  '/roi',
  requireRole('Fleet Manager', 'Financial Analyst'),
  asyncHandler(async (_req, res) => {
    res.json(await getRoi());
  })
);

// CSV export. ?type=vehicles|drivers|trips|operational|roi|fuel
router.get('/export.csv', asyncHandler(async (req, res) => {
  const type = req.query.type || 'vehicles';
  switch (type) {
    case 'vehicles': {
      const rows = await Vehicle.find().lean().sort({ name: 1 });
      return sendCSV(res, 'vehicles.csv', rows, [
        { key: 'registrationNumber', label: 'Registration' },
        { key: 'name', label: 'Name' },
        { key: 'type', label: 'Type' },
        { key: 'region', label: 'Region' },
        { key: 'maxLoadCapacityKg', label: 'Capacity (kg)' },
        { key: 'odometerKm', label: 'Odometer (km)' },
        { key: 'status', label: 'Status' },
      ]);
    }
    case 'drivers': {
      const rows = await Driver.find().lean().sort({ name: 1 });
      return sendCSV(res, 'drivers.csv', rows, [
        { key: 'name', label: 'Name' },
        { key: 'licenseNumber', label: 'License' },
        { key: 'licenseCategory', label: 'Category' },
        { key: 'licenseExpiryDate', label: 'License Expiry' },
        { key: 'safetyScore', label: 'Safety Score' },
        { key: 'status', label: 'Status' },
      ]);
    }
    case 'trips': {
      const rows = await Trip.find().populate('vehicle driver').lean().sort({ createdAt: -1 });
      const flat = rows.map((r) => ({
        ...r,
        vehicle: r.vehicle?.name,
        driver: r.driver?.name,
        _id: r._id?.toString(),
      }));
      return sendCSV(res, 'trips.csv', flat, [
        { key: 'source', label: 'Source' },
        { key: 'destination', label: 'Destination' },
        { key: 'vehicle', label: 'Vehicle' },
        { key: 'driver', label: 'Driver' },
        { key: 'cargoWeightKg', label: 'Cargo (kg)' },
        { key: 'plannedDistanceKm', label: 'Planned (km)' },
        { key: 'actualDistanceKm', label: 'Actual (km)' },
        { key: 'fuelConsumedL', label: 'Fuel (L)' },
        { key: 'revenue', label: 'Revenue' },
        { key: 'status', label: 'Status' },
      ]);
    }
    case 'operational': {
      const rows = await getOperationalCost();
      return sendCSV(res, 'operational-cost.csv', rows, [
        { key: 'vehicleName', label: 'Vehicle' },
        { key: 'fuelCost', label: 'Fuel Cost' },
        { key: 'maintenanceCost', label: 'Maintenance Cost' },
        { key: 'expenseCost', label: 'Other Expenses' },
        { key: 'operationalCost', label: 'Total Operational Cost' },
      ]);
    }
    case 'roi': {
      const rows = await getRoi();
      return sendCSV(res, 'vehicle-roi.csv', rows, [
        { key: 'vehicleName', label: 'Vehicle' },
        { key: 'registrationNumber', label: 'Registration' },
        { key: 'acquisitionCost', label: 'Acquisition Cost' },
        { key: 'revenue', label: 'Revenue' },
        { key: 'fuelCost', label: 'Fuel Cost' },
        { key: 'maintenanceCost', label: 'Maintenance Cost' },
        { key: 'roi', label: 'ROI %' },
      ]);
    }
    case 'fuel': {
      const rows = await FuelLog.find()
        .populate('vehicle', 'name registrationNumber')
        .populate('trip', 'source destination')
        .lean()
        .sort({ filledAt: -1 });
      const flat = rows.map((r) => ({
        vehicle: r.vehicle?.name,
        registrationNumber: r.vehicle?.registrationNumber,
        tripRoute: r.trip ? `${r.trip.source} -> ${r.trip.destination}` : '',
        liters: r.liters,
        cost: r.cost,
        filledAt: r.filledAt,
      }));
      return sendCSV(res, 'fuel-logs.csv', flat, [
        { key: 'vehicle', label: 'Vehicle' },
        { key: 'registrationNumber', label: 'Registration' },
        { key: 'tripRoute', label: 'Trip Route' },
        { key: 'liters', label: 'Liters' },
        { key: 'cost', label: 'Cost' },
        { key: 'filledAt', label: 'Filled At' },
      ]);
    }
    default:
      return res.status(400).json({ error: `Unknown export type: ${type}` });
  }
}));

export default router;
