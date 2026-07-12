import { Router } from 'express';
import FuelLog from '../models/FuelLog.js';
import Vehicle from '../models/Vehicle.js';
import Trip from '../models/Trip.js';
import { auth, requireRole } from '../middleware/auth-rbac.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { validateBody } from '../middleware/validate.js';

const router = Router();
router.use(auth);

router.get('/', asyncHandler(async (req, res) => {
  const filter = {};
  if (req.query.vehicle) filter.vehicle = req.query.vehicle;
  res.json(
    await FuelLog.find(filter)
      .populate('vehicle', 'name registrationNumber')
      .populate('trip', 'source destination')
      .sort({ filledAt: -1 })
  );
}));

router.post(
  '/',
  requireRole('Fleet Manager', 'Driver'),
  validateBody({
    vehicle: { required: true, type: 'string' },
    liters: { required: true, type: 'number', min: 0 },
    cost: { required: true, type: 'number', min: 0 },
    trip: { type: 'string' },
  }),
  asyncHandler(async (req, res) => {
    const vehicle = await Vehicle.findById(req.body.vehicle).lean();
    if (!vehicle) return res.status(404).json({ error: 'Vehicle not found' });

    if (req.body.trip) {
      const trip = await Trip.findById(req.body.trip).lean();
      if (!trip) return res.status(404).json({ error: 'Trip not found' });
      if (String(trip.vehicle) !== req.body.vehicle) {
        return res.status(409).json({ error: 'Trip does not belong to the selected vehicle' });
      }
    }

    const log = await FuelLog.create(req.body);
    res
      .status(201)
      .json(
        await log.populate([
          { path: 'vehicle', select: 'name registrationNumber' },
          { path: 'trip', select: 'source destination' },
        ])
      );
  })
);

export default router;
