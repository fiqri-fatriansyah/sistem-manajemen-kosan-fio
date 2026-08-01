import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { generateAdvancedSeed } from './demoSeeder';

dotenv.config();

const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/room-Fio';

const run = async () => {
  await mongoose.connect(uri);
  console.log('Connected to DB');
  await generateAdvancedSeed();
  await mongoose.disconnect();
  console.log('Disconnected');
};

run().catch(console.error);
