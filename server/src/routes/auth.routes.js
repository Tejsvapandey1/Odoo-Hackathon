import { Router } from 'express';
import User, { ROLES } from '../models/User.js';
import { auth, signToken } from '../middleware/auth.js';
import { requireRole } from '../middleware/rbac.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { validateBody } from '../middleware/validate.js';

const router = Router();

router.post(
  '/register',
  auth,
  requireRole('Fleet Manager'),
  validateBody({
    name: { required: true, type: 'string' },
    email: { required: true, type: 'string' },
    password: { required: true, type: 'string' },
    role: { required: true, type: 'string', enum: ROLES },
  }),
  asyncHandler(async (req, res) => {
    const user = await User.create(req.body);
    res.status(201).json(user);
  })
);

router.post(
  '/login',
  validateBody({
    email: { required: true, type: 'string' },
    password: { required: true, type: 'string' },
  }),
  asyncHandler(async (req, res) => {
    const user = await User.findOne({ email: req.body.email.toLowerCase() }).select('+password');
    if (!user || !(await user.comparePassword(req.body.password))) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    const token = signToken(user);
    res.json({ token, user });
  })
);

router.get(
  '/me',
  auth,
  asyncHandler(async (req, res) => {
    const user = await User.findById(req.user.sub);
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  })
);

export default router;
