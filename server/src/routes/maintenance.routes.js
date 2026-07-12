import { Router } from 'express';
import MaintenanceLog from '../models/MaintenanceLog.js';
import { auth, requireRole } from '../middleware/auth-rbac.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { validateBody } from '../middleware/validate.js';
import { openMaintenance, closeMaintenance } from '../services/maintenanceFlow.js';

const router = Router();
router.use(auth);

router.get('/', asyncHandler(async (req, res) => {
  const filter = {};
  if (req.query.status) filter.status = req.query.status;
  res.json(
    await MaintenanceLog.find(filter)
      .populate('vehicle', 'name registrationNumber status')
      .sort({ createdAt: -1 })
  );
}));

router.post(
  '/',
  requireRole('Fleet Manager'),
  validateBody({
    vehicle: { required: true, type: 'string' },
    type: { required: true, type: 'string' },
    cost: { required: true, type: 'number', min: 0 },
    description: { type: 'string' },
  }),
  asyncHandler(async (req, res) => {
    const log = await openMaintenance(req.body);
    res.status(201).json(await log.populate('vehicle', 'name registrationNumber status'));
  })
);

router.post('/:id/close', requireRole('Fleet Manager'), asyncHandler(async (req, res) => {
  const log = await closeMaintenance(req.params.id);
  res.json(await log.populate('vehicle', 'name registrationNumber status'));
}));

export default router;
