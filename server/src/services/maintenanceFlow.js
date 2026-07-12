import mongoose from 'mongoose';
import MaintenanceLog from '../models/MaintenanceLog.js';
import Vehicle from '../models/Vehicle.js';

function fail(message, status) {
  const err = new Error(message);
  err.status = status;
  return err;
}

// Open a maintenance log -> vehicle flips to In Shop (drops out of the
// dispatch pool automatically because /available filters on status).
export async function openMaintenance({ vehicle: vehicleId, type, description, cost }) {
  const session = await mongoose.startSession();
  try {
    let created;
    await session.withTransaction(async () => {
      const vehicle = await Vehicle.findById(vehicleId).session(session);
      if (!vehicle) throw fail('Vehicle not found', 404);
      if (vehicle.status === 'Retired') {
        throw fail('Cannot open maintenance on a Retired vehicle', 409);
      }
      if (vehicle.status === 'On Trip') {
        throw fail('Cannot open maintenance while vehicle is On Trip', 409);
      }

      const existingOpenLog = await MaintenanceLog.exists({
        vehicle: vehicleId,
        status: 'Open',
      }).session(session);
      if (existingOpenLog) {
        throw fail('Vehicle already has an open maintenance log', 409);
      }

      [created] = await MaintenanceLog.create(
        [{ vehicle: vehicleId, type, description, cost, status: 'Open' }],
        { session }
      );
      if (vehicle.status !== 'In Shop') {
        vehicle.status = 'In Shop';
        await vehicle.save({ session });
      }
    });
    return created;
  } finally {
    session.endSession();
  }
}

// Close a log -> vehicle returns to Available only if no other Open logs
// remain AND the vehicle is not Retired.
export async function closeMaintenance(logId) {
  const session = await mongoose.startSession();
  try {
    let updated;
    await session.withTransaction(async () => {
      const log = await MaintenanceLog.findById(logId).session(session);
      if (!log) throw fail('Maintenance log not found', 404);
      if (log.status === 'Closed') throw fail('Log already closed', 409);

      log.status = 'Closed';
      log.closedAt = new Date();
      await log.save({ session });

      const openStill = await MaintenanceLog.exists({
        vehicle: log.vehicle,
        status: 'Open',
      }).session(session);
      if (!openStill) {
        const vehicle = await Vehicle.findById(log.vehicle).session(session);
        if (vehicle && vehicle.status !== 'Retired') {
          vehicle.status = 'Available';
          await vehicle.save({ session });
        }
      }
      updated = log;
    });
    return updated;
  } finally {
    session.endSession();
  }
}
