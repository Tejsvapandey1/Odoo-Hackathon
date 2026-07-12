import { Router } from 'express';
import Trip from '../models/Trip.js';
import { auth, requireRole } from '../middleware/auth-rbac.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { validateBody } from '../middleware/validate.js';
import { dispatchTrip, completeTrip, cancelTrip } from '../services/tripStateMachine.js';

const router = Router();
router.use(auth);

function populate() {
  return [
    { path: 'vehicle', select: 'name registrationNumber type region' },
    { path: 'driver', select: 'name licenseNumber status' },
  ];
}

router.get('/', asyncHandler(async (req, res) => {
  const filter = {};
  if (req.query.status) filter.status = req.query.status;
  res.json(await Trip.find(filter).populate(populate()).sort({ createdAt: -1 }));
}));

router.post(
  '/',
  requireRole('Fleet Manager'),
  validateBody({
    source: { required: true, type: 'string' },
    destination: { required: true, type: 'string' },
    vehicle: { required: true, type: 'string' },
    driver: { required: true, type: 'string' },
    cargoWeightKg: { required: true, type: 'number', min: 1 },
    plannedDistanceKm: { required: true, type: 'number', min: 0 },
  }),
  asyncHandler(async (req, res) => {
    const trip = await Trip.create(req.body);
    res.status(201).json(await trip.populate(populate()));
  })
);

router.get('/:id', asyncHandler(async (req, res) => {
  const trip = await Trip.findById(req.params.id).populate(populate());
  if (!trip) return res.status(404).json({ error: 'Trip not found' });
  res.json(trip);
}));

router.post('/:id/dispatch', requireRole('Fleet Manager'), asyncHandler(async (req, res) => {
  const trip = await dispatchTrip(req.params.id);
  res.json(await trip.populate(populate()));
}));

router.post(
  '/:id/complete',
  requireRole('Fleet Manager'),
  validateBody({
    actualDistanceKm: { type: 'number', min: 0 },
    fuelConsumedL: { type: 'number', min: 0 },
    revenue: { type: 'number', min: 0 },
    finalOdometerKm: { type: 'number', min: 0 },
  }),
  asyncHandler(async (req, res) => {
    const trip = await completeTrip(req.params.id, req.body);
    res.json(await trip.populate(populate()));
  })
);

router.post('/:id/cancel', requireRole('Fleet Manager'), asyncHandler(async (req, res) => {
  const trip = await cancelTrip(req.params.id);
  res.json(await trip.populate(populate()));
}));

export default router;
