import mongoose from 'mongoose';

export const TRIP_STATUS = ['Draft', 'Dispatched', 'Completed', 'Cancelled'];

const tripSchema = new mongoose.Schema(
  {
    source: { type: String, required: true, trim: true },
    destination: { type: String, required: true, trim: true },
    vehicle: { type: mongoose.Schema.Types.ObjectId, ref: 'Vehicle', required: true, index: true },
    driver: { type: mongoose.Schema.Types.ObjectId, ref: 'Driver', required: true, index: true },
    cargoWeightKg: { type: Number, required: true, min: 1 },
    plannedDistanceKm: { type: Number, required: true, min: 0 },
    actualDistanceKm: { type: Number, default: 0, min: 0 },
    fuelConsumedL: { type: Number, default: 0, min: 0 },
    revenue: { type: Number, default: 0, min: 0 },
    finalOdometerKm: { type: Number },
    status: { type: String, enum: TRIP_STATUS, default: 'Draft', index: true },
    dispatchedAt: { type: Date },
    completedAt: { type: Date },
    cancelledAt: { type: Date },
  },
  { timestamps: true }
);

// Rule 5: cargo weight must not exceed vehicle capacity.
tripSchema.pre('validate', async function enforceCapacity(next) {
  try {
    if (this.isModified('cargoWeightKg') || this.isModified('vehicle')) {
      const Vehicle = mongoose.model('Vehicle');
      const v = await Vehicle.findById(this.vehicle).lean();
      if (v && this.cargoWeightKg > v.maxLoadCapacityKg) {
        return next(
          new Error(
            `Cargo ${this.cargoWeightKg}kg exceeds ${v.name} capacity ${v.maxLoadCapacityKg}kg`
          )
        );
      }
    }
    next();
  } catch (err) {
    next(err);
  }
});

export default mongoose.model('Trip', tripSchema);
