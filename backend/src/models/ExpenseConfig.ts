import mongoose, { Schema, Document } from 'mongoose';

export interface IExpenseConfig extends Document {
  name: string;
  amount: number;
  frequency: 'Manual' | 'Harian' | 'Mingguan' | 'Bulanan';
  timingType: 'Duration' | 'Fixed';
  duration: number; // e.g. per X days/weeks/months (used if Duration)
  fixedDay: number; // e.g. 1-31 (used if Fixed)
  description: string;
}

const ExpenseConfigSchema: Schema = new Schema({
  name: { type: String, required: true },
  amount: { type: Number, required: true },
  frequency: { type: String, enum: ['Manual', 'Harian', 'Mingguan', 'Bulanan'], default: 'Manual' },
  timingType: { type: String, enum: ['Duration', 'Fixed'], default: 'Duration' },
  duration: { type: Number, default: 1 },
  fixedDay: { type: Number, default: 1 },
  description: { type: String, default: '' }
}, { timestamps: true });

export default mongoose.model<IExpenseConfig>('ExpenseConfig', ExpenseConfigSchema);
