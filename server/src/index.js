import 'dotenv/config';
import express from 'express';
import cors from 'cors';

import { connectDB } from './config/db.js';
import { seedIfEmpty } from './config/seed.js';
import authRoutes from './routes/auth.routes.js';
import vehicleRoutes from './routes/vehicle.routes.js';
import driverRoutes from './routes/driver.routes.js';
import tripRoutes from './routes/trip.routes.js';
import maintenanceRoutes from './routes/maintenance.routes.js';
import fuelRoutes from './routes/fuel.routes.js';
import expenseRoutes from './routes/expense.routes.js';
import reportRoutes from './routes/reports.routes.js';
import { notFound, errorHandler } from './middleware/error.js';

const app = express();

app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:5173' }));
app.use(express.json());

app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

app.use('/api/auth', authRoutes);
app.use('/api/vehicles', vehicleRoutes);
app.use('/api/drivers', driverRoutes);
app.use('/api/trips', tripRoutes);
app.use('/api/maintenance', maintenanceRoutes);
app.use('/api/fuel', fuelRoutes);
app.use('/api/expenses', expenseRoutes);
app.use('/api/reports', reportRoutes);

app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 4000;
const uri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/transitops';

try {
  await connectDB(uri);
  if (process.env.SEED_ON_START === 'true') {
    await seedIfEmpty();
  }
} catch (err) {
  console.error('✗ MongoDB connection failed:', err.message);
  console.error('  Start a local MongoDB or set MONGO_URI to a MongoDB Atlas connection string.');
  process.exit(1);
}

app.listen(PORT, () => {
  console.log(`✓ TransitOps API running on http://localhost:${PORT}`);
});

export default app;
