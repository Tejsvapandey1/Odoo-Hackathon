import mongoose from 'mongoose';

const fuelSchema = new mongoose.Schema(
  {
    vehicle: { type: mongoose.Schema.Types.ObjectId, ref: 'Vehicle', required: true, index: true },
    trip: { type: mongoose.Schema.Types.ObjectId, ref: 'Trip' },
    liters: { type: Number, required: true, min: 0 },
    cost: { type: Number, required: true, min: 0 },
    filledAt: { type: Date, default: () => new Date(), index: true },
  },
  { timestamps: true }
);

export default mongoose.model('FuelLog', fuelSchema);
