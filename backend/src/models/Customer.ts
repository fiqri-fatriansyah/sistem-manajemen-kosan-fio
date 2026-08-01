import mongoose, { Schema, Document } from 'mongoose';

export interface ICustomer extends Document {
  name: string;
  telephone: string;
  address?: string;
  email?: string;
  isActive: boolean;
}

const CustomerSchema: Schema = new Schema({
  name: { type: String, required: true },
  telephone: { type: String, required: true },
  address: { type: String },
  email: { type: String },
  isActive: { type: Boolean, default: true }
});

export default mongoose.models.Customer || mongoose.model<ICustomer>('Customer', CustomerSchema);
