import mongoose from 'mongoose';
import Vehicle from '../models/Vehicle.js';
import Driver from '../models/Driver.js';
import Trip from '../models/Trip.js';
import MaintenanceLog from '../models/MaintenanceLog.js';
import FuelLog from '../models/FuelLog.js';
import Expense from '../models/Expense.js';

function vehicleMatch(filters = {}) {
  const match = {};
  if (filters.type) match.type = filters.type;
  if (filters.status) match.status = filters.status;
  if (filters.region) match.region = filters.region;
  return match;
}

// Live dashboard counts. Fleet Utilization % = On Trip / (On Trip + Available) * 100.
export async function getDashboardKPIs(filters = {}) {
  const match = vehicleMatch(filters);
  const [activeVehicles, availableVehicles, inShopVehicles, activeTrips, pendingTrips, driversOnDuty] =
    await Promise.all([
      Vehicle.countDocuments({ ...match, status: 'On Trip' }),
      Vehicle.countDocuments({ ...match, status: 'Available' }),
      Vehicle.countDocuments({ ...match, status: 'In Shop' }),
      Trip.countDocuments({ status: 'Dispatched' }),
      Trip.countDocuments({ status: 'Draft' }),
      Driver.countDocuments({ status: 'On Trip' }),
    ]);

  const denom = activeVehicles + availableVehicles;
  return {
    activeVehicles,
    availableVehicles,
    inShopVehicles,
    activeTrips,
    pendingTrips,
    driversOnDuty,
    fleetUtilization: denom > 0 ? Number(((activeVehicles / denom) * 100).toFixed(2)) : 0,
  };
}

// Fuel efficiency per completed trip: actualDistanceKm / fuelConsumedL.
export async function getFuelEfficiency() {
  return Trip.aggregate([
    { $match: { status: 'Completed', fuelConsumedL: { $gt: 0 } } },
    { $lookup: { from: 'vehicles', localField: 'vehicle', foreignField: '_id', as: 'v' } },
    { $unwind: { path: '$v', preserveNullAndEmptyArrays: true } },
    {
      $project: {
        _id: 1,
        vehicleId: '$v._id',
        vehicleName: '$v.name',
        actualDistanceKm: 1,
        fuelConsumedL: 1,
        kmPerLiter: { $divide: ['$actualDistanceKm', '$fuelConsumedL'] },
      },
    },
  ]);
}

async function costsByVehicle() {
  const [fuel, maint, expense] = await Promise.all([
    FuelLog.aggregate([
      { $group: { _id: '$vehicle', cost: { $sum: '$cost' }, liters: { $sum: '$liters' } } },
    ]),
    MaintenanceLog.aggregate([{ $group: { _id: '$vehicle', cost: { $sum: '$cost' } } }]),
    Expense.aggregate([{ $group: { _id: '$vehicle', cost: { $sum: '$amount' } } }]),
  ]);

  const map = new Map();
  const ensure = (id) => {
    const key = String(id);
    if (!map.has(key)) {
      map.set(key, {
        vehicleId: key,
        vehicleName: null,
        fuelCost: 0,
        maintenanceCost: 0,
        expenseCost: 0,
        fuelLiters: 0,
      });
    }
    return map.get(key);
  };
  fuel.forEach((r) => {
    const e = ensure(r._id);
    e.fuelCost = r.cost || 0;
    e.fuelLiters = r.liters || 0;
  });
  maint.forEach((r) => {
    ensure(r._id).maintenanceCost = r.cost || 0;
  });
  expense.forEach((r) => {
    ensure(r._id).expenseCost = r.cost || 0;
  });
  return map;
}

async function attachVehicleNames(map) {
  const ids = [...map.keys()].map((id) => new mongoose.Types.ObjectId(id));
  const vehicles = ids.length ? await Vehicle.find({ _id: { $in: ids } }).lean() : [];
  vehicles.forEach((v) => {
    const row = map.get(String(v._id));
    if (row) row.vehicleName = v.name;
  });
  return ids;
}

// Operational cost per vehicle = fuel + maintenance + expenses.
export async function getOperationalCost() {
  const map = await costsByVehicle();
  await attachVehicleNames(map);
  return [...map.values()]
    .map((r) => ({
      ...r,
      operationalCost: Number((r.fuelCost + r.maintenanceCost + r.expenseCost).toFixed(2)),
    }))
    .sort((a, b) => b.operationalCost - a.operationalCost);
}

// Vehicle ROI = (revenue - (maintenance + fuel)) / acquisitionCost * 100.
// Matches the spec formula verbatim (no depreciation, financing, or wages).
export async function getRoi() {
  const map = await costsByVehicle();
  const ids = await attachVehicleNames(map);

  let revenueRows = [];
  if (ids.length) {
    revenueRows = await Trip.aggregate([
      { $match: { status: 'Completed', vehicle: { $in: ids } } },
      { $group: { _id: '$vehicle', revenue: { $sum: '$revenue' }, trips: { $sum: 1 } } },
    ]);
  }
  const revMap = new Map(revenueRows.map((r) => [String(r._id), r]));

  const vehicles = ids.length ? await Vehicle.find({ _id: { $in: ids } }).lean() : [];
  return vehicles
    .map((v) => {
      const c = map.get(String(v._id)) || {};
      const revenue = revMap.get(String(v._id))?.revenue || 0;
      const trips = revMap.get(String(v._id))?.trips || 0;
      const totalCost = (c.fuelCost || 0) + (c.maintenanceCost || 0);
      const roi = v.acquisitionCost > 0
        ? Number((((revenue - totalCost) / v.acquisitionCost) * 100).toFixed(2))
        : 0;
      return {
        vehicleId: v._id,
        vehicleName: v.name,
        registrationNumber: v.registrationNumber,
        acquisitionCost: v.acquisitionCost,
        revenue,
        fuelCost: c.fuelCost || 0,
        maintenanceCost: c.maintenanceCost || 0,
        expenseCost: c.expenseCost || 0,
        trips,
        roi,
      };
    })
    .sort((a, b) => b.roi - a.roi);
}

// Quick counts used to drive badge numbers on the dashboard charts.
export async function getTripTrend() {
  return Trip.aggregate([
    { $match: { status: 'Completed' } },
    {
      $group: {
        _id: { $dateToString: { format: '%Y-%m-%d', date: '$completedAt' } },
        trips: { $sum: 1 },
      },
    },
    { $sort: { _id: 1 } },
    { $limit: 14 },
  ]);
}
