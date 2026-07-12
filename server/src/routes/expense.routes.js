import { Router } from 'express';
import Expense from '../models/Expense.js';
import { EXPENSE_CATEGORIES } from '../models/Expense.js';
import Vehicle from '../models/Vehicle.js';
import { auth, requireRole } from '../middleware/auth-rbac.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { validateBody } from '../middleware/validate.js';

const router = Router();
router.use(auth);

router.get('/', asyncHandler(async (req, res) => {
  const filter = {};
  if (req.query.vehicle) filter.vehicle = req.query.vehicle;
  res.json(
    await Expense.find(filter)
      .populate('vehicle', 'name registrationNumber')
      .sort({ incurredAt: -1 })
  );
}));

router.post(
  '/',
  requireRole('Fleet Manager', 'Driver'),
  validateBody({
    vehicle: { required: true, type: 'string' },
    category: { required: true, type: 'string', enum: EXPENSE_CATEGORIES },
    amount: { required: true, type: 'number', min: 0 },
    description: { type: 'string' },
  }),
  asyncHandler(async (req, res) => {
    const vehicle = await Vehicle.findById(req.body.vehicle).lean();
    if (!vehicle) return res.status(404).json({ error: 'Vehicle not found' });

    const expense = await Expense.create(req.body);
    res.status(201).json(await expense.populate('vehicle', 'name registrationNumber'));
  })
);

export default router;
