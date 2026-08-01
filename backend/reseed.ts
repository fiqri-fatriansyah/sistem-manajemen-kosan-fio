import mongoose from 'mongoose';
import { connectDB } from './src/index';
import { generateAdvancedSeed } from './src/utils/demoSeeder';

const run = async () => {
  await connectDB();
  console.log('--- Wiping and Seeding ---');
  await generateAdvancedSeed();
  
  console.log('Kosan Demo Data Successfully Seeded!\n');
  process.exit(0);
  
  await mongoose.disconnect();
};

run().catch(console.error);
