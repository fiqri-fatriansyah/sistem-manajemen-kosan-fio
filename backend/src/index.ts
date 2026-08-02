import express, { Express, Request, Response } from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import mongoose from 'mongoose';

dotenv.config();

const app: Express = express();
const port = process.env.PORT || 3011;

// Middleware
app.use(cors());
app.use(express.json());

import path from 'path';
import kebayaRoutes from './routes/room';
import customerRoutes from './routes/customer';
import rentalRoutes from './routes/rentals';
import eventRoutes from './routes/event';
import dashboardRoutes from './routes/dashboard';
import reportsRoutes from './routes/reports';
import receiptsRoutes from './routes/receipts';
import configRoutes from './routes/config';
import auditRoutes from './routes/audit';

import expensesRoutes from './routes/expenses';
import { startCronJobs } from './cron';

// Static files for uploads
const uploadPath = path.join(__dirname, '../public/uploads');
console.log('UPLOADS_PATH resolving to:', uploadPath);
app.use('/uploads', express.static(uploadPath));

app.use('/api/rooms', kebayaRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/rentals', rentalRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/reports', reportsRoutes);
app.use('/api/receipts', receiptsRoutes);
app.use('/api/config', configRoutes);
app.use('/api/audit', auditRoutes);

app.use('/api/expenses', expensesRoutes);

startCronJobs();

// Database Connection
import { getDemoState } from './utils/demoState';

export const baseMongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/room-Fio';
export const demoMongoURI = 'mongodb://localhost:27017/inventaris-room-demo';

export const connectDB = async () => {
  const isDemo = getDemoState();
  const uri = isDemo ? demoMongoURI : baseMongoURI;
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }
  await mongoose.connect(uri);
  console.log(`Connected to MongoDB (${isDemo ? 'DEMO MODE' : 'REAL'})`);
};

connectDB().catch((err) => console.error('Failed to connect to MongoDB:', err));

// Basic Route
app.get('/', (req: Request, res: Response) => {
  res.send('Kosan Fio API is running');
});

app.listen(port, () => {
  console.log(`[server]: Server is running at http://localhost:${port}`);
});
