import mongoose, { Schema, Document } from 'mongoose';

export interface IRoom extends Document {
  roomNumber: string;
  roomTypeId: mongoose.Types.ObjectId | string;
  features: string[];
  status: 'Available' | 'Occupied' | 'Cleaning' | 'Maintenance';
  priceMonthly?: number;
  priceDaily?: number;
  imageUrl?: string;
}

const RoomSchema: Schema = new Schema({
  roomNumber: { type: String, required: true, unique: true },
  roomTypeId: { type: Schema.Types.ObjectId, ref: 'RoomType', required: true },
  features: [{ type: String }],
  status: { type: String, enum: ['Available', 'Occupied', 'Cleaning', 'Maintenance'], default: 'Available' },
  priceMonthly: { type: Number },
  priceDaily: { type: Number },
  imageUrl: { type: String }
}, { timestamps: true });

export default mongoose.models.Room || mongoose.model<IRoom>('Room', RoomSchema);
