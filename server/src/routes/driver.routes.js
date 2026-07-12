import { Router } from 'express';
import Driver from '../models/Driver.js';
import { auth, requireRole } from '../middleware/auth-rbac.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { validateBody } from '../middleware/validate.js';

const router = Router();
router.use(auth);

function buildFilter({ status, q }) {
  const filter = {};
  if (status) filter.status = status;
  if (q) filter.$or = [
    { name: { $regex: q, $options: 'i' } },
    { licenseNumber: { $regex: q, $options: 'i' } },
  ];
  return filter;
}

router.get('/', asyncHandler(async (req, res) => {
  res.json(await Driver.find(buildFilter(req.query)).sort({ createdAt: -1 }));
}));

// R2/R3: only Available drivers with a still-valid license are dispatchable.
router.get('/available', asyncHandler(async (_req, res) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  res.json(
    await Driver.find({ status: 'Available', licenseExpiryDate: { $gte: today } }).sort({ name: 1 })
  );
}));

router.post(
  '/',
  requireRole('Fleet Manager', 'Safety Officer'),
  validateBody({
    name: { required: true, type: 'string' },
    licenseNumber: { required: true, type: 'string' },
    licenseCategory: { required: true, type: 'string' },
    licenseExpiryDate: { required: true, type: 'string' }, // ISO date
    contactNumber: { required: true, type: 'string' },
    safetyScore: { type: 'number' },
  }),
  asyncHandler(async (req, res) => {
    res.status(201).json(await Driver.create(req.body));
  })
);

router.get('/:id', asyncHandler(async (req, res) => {
  const d = await Driver.findById(req.params.id);
  if (!d) return res.status(404).json({ error: 'Driver not found' });
  res.json(d);
}));

router.put('/:id', requireRole('Fleet Manager', 'Safety Officer'), asyncHandler(async (req, res) => {
  const current = await Driver.findById(req.params.id);
  if (!current) return res.status(404).json({ error: 'Driver not found' });
  if (current.status === 'On Trip' && req.body.status && req.body.status !== 'On Trip') {
    return res.status(409).json({ error: 'Cannot manually change status for a driver who is On Trip' });
  }

  const d = await Driver.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });
  res.json(d);
}));

export default router;
