import mongoose from 'mongoose';

export const EXPENSE_CATEGORIES = ['Toll', 'Parking', 'Misc'];

const expenseSchema = new mongoose.Schema(
  {
    vehicle: { type: mongoose.Schema.Types.ObjectId, ref: 'Vehicle', required: true, index: true },
    category: { type: String, enum: EXPENSE_CATEGORIES, required: true },
    amount: { type: Number, required: true, min: 0 },
    description: { type: String, trim: true },
    incurredAt: { type: Date, default: () => new Date(), index: true },
  },
  { timestamps: true }
);

export default mongoose.model('Expense', expenseSchema);
