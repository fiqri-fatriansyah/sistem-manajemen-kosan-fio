import mongoose, { Schema, Document } from 'mongoose';

export interface IRoomType extends Document {
  name: string;
  features: string[];
  price: number; // Bulanan
  priceDaily: number; // Harian
  imageUrl?: string;
}

const RoomTypeSchema: Schema = new Schema({
  name: { type: String, required: true, unique: true },
  features: [{ type: String }],
  price: { type: Number, required: true },
  priceDaily: { type: Number, required: true, default: 0 },
  imageUrl: { type: String }
}, { timestamps: true });

export default mongoose.models.RoomType || mongoose.model<IRoomType>('RoomType', RoomTypeSchema);
