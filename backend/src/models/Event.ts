import mongoose, { Schema, Document } from 'mongoose';

export interface IEvent extends Document {
  name: string;
  date: Date;
  description?: string;
  recurring: 'none' | 'weekly' | 'monthly' | 'yearly';
  isPublicHoliday: boolean;
  isHijriah: boolean;
}

const EventSchema: Schema = new Schema({
  name: { type: String, required: true },
  date: { type: Date, required: true },
  description: { type: String },
  recurring: { type: String, enum: ['none', 'weekly', 'monthly', 'yearly'], default: 'none' },
  isPublicHoliday: { type: Boolean, default: false },
  isHijriah: { type: Boolean, default: false }
}, { timestamps: true });

export default mongoose.model<IEvent>('Event', EventSchema);
