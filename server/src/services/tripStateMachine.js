import mongoose from 'mongoose';
import Trip from '../models/Trip.js';
import Vehicle from '../models/Vehicle.js';
import Driver from '../models/Driver.js';

function fail(message, status) {
  const err = new Error(message);
  err.status = status;
  return err;
}

function licenseActive(expiry) {
  if (!expiry) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return new Date(expiry) >= today;
}

// Draft -> Dispatched. Enforces rules R2..R5 inside a transaction so the
// trip + vehicle + driver flip together or not at all.
export async function dispatchTrip(tripId) {
  const session = await mongoose.startSession();
  try {
    let result;
    await session.withTransaction(async () => {
      const trip = await Trip.findById(tripId).session(session);
      if (!trip) throw fail('Trip not found', 404);
      if (trip.status !== 'Draft') {
        throw fail(`Trip is ${trip.status}; only Draft trips can be dispatched`, 409);
      }

      const vehicle = await Vehicle.findById(trip.vehicle).session(session);
      if (!vehicle) throw fail('Vehicle not found', 404);
      if (vehicle.status !== 'Available') {
        throw fail(`Vehicle ${vehicle.name} is ${vehicle.status}; must be Available to dispatch (R2/R4)`, 409);
      }

      const driver = await Driver.findById(trip.driver).session(session);
      if (!driver) throw fail('Driver not found', 404);
      if (driver.status !== 'Available') {
        throw fail(`Driver ${driver.name} is ${driver.status}; must be Available to dispatch (R4)`, 409);
      }
      if (!licenseActive(driver.licenseExpiryDate)) {
        throw fail(`Driver ${driver.name}'s license has expired (R3)`, 409);
      }

      // R5 (cargo <= capacity) is enforced by the Trip pre-validate hook on
      // create; defence-in-depth re-check here.
      if (trip.cargoWeightKg > vehicle.maxLoadCapacityKg) {
        throw fail(`Cargo ${trip.cargoWeightKg}kg exceeds vehicle capacity ${vehicle.maxLoadCapacityKg}kg (R5)`, 409);
      }

      trip.status = 'Dispatched';
      trip.dispatchedAt = new Date();
      await trip.save({ session });

      vehicle.status = 'On Trip';
      await vehicle.save({ session });

      driver.status = 'On Trip';
      await driver.save({ session });

      result = trip;
    });
    return result;
  } finally {
    session.endSession();
  }
}

// Dispatched -> Completed. Free the vehicle and driver back to Available,
// and roll the odometer forward if a final reading is supplied.
export async function completeTrip(tripId, payload = {}) {
  const { actualDistanceKm, fuelConsumedL, revenue, finalOdometerKm } = payload;
  const session = await mongoose.startSession();
  try {
    let result;
    await session.withTransaction(async () => {
      const trip = await Trip.findById(tripId).session(session);
      if (!trip) throw fail('Trip not found', 404);
      if (trip.status !== 'Dispatched') {
        throw fail(`Trip is ${trip.status}; only Dispatched trips can be completed`, 409);
      }

      if (actualDistanceKm !== undefined && actualDistanceKm < 0) {
        throw fail('actualDistanceKm must be >= 0', 400);
      }
      if (fuelConsumedL !== undefined && fuelConsumedL < 0) {
        throw fail('fuelConsumedL must be >= 0', 400);
      }
      if (revenue !== undefined && revenue < 0) {
        throw fail('revenue must be >= 0', 400);
      }

      trip.status = 'Completed';
      trip.completedAt = new Date();
      if (actualDistanceKm !== undefined) trip.actualDistanceKm = actualDistanceKm;
      if (fuelConsumedL !== undefined) trip.fuelConsumedL = fuelConsumedL;
      if (revenue !== undefined) trip.revenue = revenue;
      if (finalOdometerKm !== undefined) trip.finalOdometerKm = finalOdometerKm;
      await trip.save({ session });

      const vehicle = await Vehicle.findById(trip.vehicle).session(session);
      if (vehicle) {
        if (finalOdometerKm !== undefined && finalOdometerKm < vehicle.odometerKm) {
          throw fail(
            `finalOdometerKm ${finalOdometerKm} cannot be lower than current odometer ${vehicle.odometerKm}`,
            409
          );
        }
        if (finalOdometerKm !== undefined && finalOdometerKm > vehicle.odometerKm) {
          vehicle.odometerKm = finalOdometerKm;
        }
        if (vehicle.status === 'On Trip') {
          vehicle.status = 'Available';
          await vehicle.save({ session });
        }
      }
      const driver = await Driver.findById(trip.driver).session(session);
      if (driver && driver.status === 'On Trip') {
        driver.status = 'Available';
        await driver.save({ session });
      }
      result = trip;
    });
    return result;
  } finally {
    session.endSession();
  }
}

// Draft|Dispatched -> Cancelled. Only frees resources if the trip was live.
export async function cancelTrip(tripId) {
  const session = await mongoose.startSession();
  try {
    let result;
    await session.withTransaction(async () => {
      const trip = await Trip.findById(tripId).session(session);
      if (!trip) throw fail('Trip not found', 404);
      if (!['Draft', 'Dispatched'].includes(trip.status)) {
        throw fail(`Trip is ${trip.status}; cannot cancel`, 409);
      }
      const wasLive = trip.status === 'Dispatched';
      trip.status = 'Cancelled';
      trip.cancelledAt = new Date();
      await trip.save({ session });

      if (wasLive) {
        const vehicle = await Vehicle.findById(trip.vehicle).session(session);
        if (vehicle && vehicle.status === 'On Trip') {
          vehicle.status = 'Available';
          await vehicle.save({ session });
        }
        const driver = await Driver.findById(trip.driver).session(session);
        if (driver && driver.status === 'On Trip') {
          driver.status = 'Available';
          await driver.save({ session });
        }
      }
      result = trip;
    });
    return result;
  } finally {
    session.endSession();
  }
}
