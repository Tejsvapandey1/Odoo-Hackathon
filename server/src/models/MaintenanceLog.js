import mongoose from 'mongoose';

export const MAINTENANCE_STATUS = ['Open', 'Closed'];
export const MAINTENANCE_TYPES = ['Oil Change', 'Tire', 'Repair', 'Inspection', 'Other'];

const maintenanceSchema = new mongoose.Schema(
  {
    vehicle: { type: mongoose.Schema.Types.ObjectId, ref: 'Vehicle', required: true, index: true },
    type: { type: String, required: true, enum: MAINTENANCE_TYPES },
    description: { type: String, trim: true },
    cost: { type: Number, required: true, min: 0 },
    status: { type: String, enum: MAINTENANCE_STATUS, default: 'Open', index: true },
    openedAt: { type: Date, default: () => new Date() },
    closedAt: { type: Date },
  },
  { timestamps: true }
);

export default mongoose.model('MaintenanceLog', maintenanceSchema);
