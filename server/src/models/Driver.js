import mongoose from 'mongoose';

export const DRIVER_STATUS = ['Available', 'On Trip', 'Off Duty', 'Suspended'];

const driverSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    licenseNumber: { type: String, required: true, unique: true, trim: true },
    licenseCategory: { type: String, required: true, trim: true }, // LMV, HMV...
    licenseExpiryDate: { type: Date, required: true, index: true },
    contactNumber: { type: String, required: true, trim: true },
    safetyScore: { type: Number, default: 100, min: 0, max: 100 },
    status: { type: String, enum: DRIVER_STATUS, default: 'Available', index: true },
  },
  { timestamps: true }
);

export default mongoose.model('Driver', driverSchema);
