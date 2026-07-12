import { Router } from 'express';
import Vehicle from '../models/Vehicle.js';
import { VEHICLE_STATUS } from '../models/Vehicle.js';
import { auth, requireRole } from '../middleware/auth-rbac.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { validateBody } from '../middleware/validate.js';

const router = Router();
router.use(auth);

function buildFilter({ type, status, region, q }) {
  const filter = {};
  if (type) filter.type = type;
  if (status) filter.status = status;
  if (region) filter.region = region;
  if (q) filter.$or = [
    { name: { $regex: q, $options: 'i' } },
    { registrationNumber: { $regex: q, $options: 'i' } },
  ];
  return filter;
}

router.get('/', asyncHandler(async (req, res) => {
  res.json(await Vehicle.find(buildFilter(req.query)).sort({ createdAt: -1 }));
}));

router.get('/available', asyncHandler(async (_req, res) => {
  res.json(await Vehicle.find({ status: 'Available' }).sort({ name: 1 }));
}));

router.post(
  '/',
  requireRole('Fleet Manager'),
  validateBody({
    registrationNumber: { required: true, type: 'string' },
    name: { required: true, type: 'string' },
    type: { required: true, type: 'string' },
    maxLoadCapacityKg: { required: true, type: 'number', min: 1 },
    acquisitionCost: { required: true, type: 'number', min: 0 },
    region: { type: 'string' },
    odometerKm: { type: 'number' },
  }),
  asyncHandler(async (req, res) => {
    res.status(201).json(await Vehicle.create(req.body));
  })
);

router.get('/:id', asyncHandler(async (req, res) => {
  const v = await Vehicle.findById(req.params.id);
  if (!v) return res.status(404).json({ error: 'Vehicle not found' });
  res.json(v);
}));

router.put('/:id', requireRole('Fleet Manager'), asyncHandler(async (req, res) => {
  const current = await Vehicle.findById(req.params.id);
  if (!current) return res.status(404).json({ error: 'Vehicle not found' });
  if (current.status === 'Retired') {
    return res.status(409).json({ error: 'Retired vehicles cannot be edited' });
  }

  const v = await Vehicle.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });
  res.json(v);
}));

// Soft delete -> Retired. A Retired vehicle never re-enters the dispatch pool.
router.delete('/:id', requireRole('Fleet Manager'), asyncHandler(async (req, res) => {
  const existing = await Vehicle.findById(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Vehicle not found' });
  if (existing.status === 'On Trip') {
    return res.status(409).json({ error: 'Cannot retire a vehicle while it is On Trip' });
  }
  if (existing.status === 'Retired') {
    return res.status(409).json({ error: 'Vehicle is already retired' });
  }

  const v = await Vehicle.findByIdAndUpdate(
    req.params.id,
    { status: 'Retired', retiredAt: new Date() },
    { new: true }
  );
  res.json(v);
}));

export { VEHICLE_STATUS };
export default router;
