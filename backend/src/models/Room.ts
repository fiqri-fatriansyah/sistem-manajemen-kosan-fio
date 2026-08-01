import mongoose, { Schema, Document } from 'mongoose';

export interface IKebaya extends Document {
  tipeKamar: string;
  fasilitas: string;
  price: number;
  totalStock: number;
  availableStock: number;
  cleaningStock: number;
  maintenanceStock: number;
  imageUrl?: string;
}

const KebayaSchema: Schema = new Schema({
  tipeKamar: { type: String, required: true },
  fasilitas: { type: String, required: true },
  price: { type: Number, required: true },
  totalStock: { type: Number, required: true },
  availableStock: { type: Number, required: true },
  cleaningStock: { type: Number, default: 0 },
  maintenanceStock: { type: Number, default: 0 },
  imageUrl: { type: String }
}, { timestamps: true });

export default mongoose.model<IKebaya>('Room', KebayaSchema);
