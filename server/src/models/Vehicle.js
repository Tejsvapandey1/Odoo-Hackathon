import mongoose from 'mongoose';

export const VEHICLE_STATUS = ['Available', 'On Trip', 'In Shop', 'Retired'];

const vehicleSchema = new mongoose.Schema(
  {
    registrationNumber: { type: String, required: true, unique: true, trim: true, uppercase: true },
    name: { type: String, required: true, trim: true },
    type: { type: String, required: true, trim: true }, // Van, Truck, Bike...
    region: { type: String, default: 'Unassigned', trim: true },
    maxLoadCapacityKg: { type: Number, required: true, min: 1 },
    odometerKm: { type: Number, default: 0, min: 0 },
    acquisitionCost: { type: Number, required: true, min: 0 },
    status: { type: String, enum: VEHICLE_STATUS, default: 'Available', index: true },
    retiredAt: { type: Date },
  },
  { timestamps: true }
);

export default mongoose.model('Vehicle', vehicleSchema);
