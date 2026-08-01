import mongoose, { Schema, Document } from 'mongoose';

export interface IConfig extends Document {
  penaltyType: string;
  penaltyCost: number;
  enableWhatsAppBot: boolean;
  waLinkType: string;
  waKwitansiType: string;
  baseFontSize: number;
}

const ConfigSchema: Schema = new Schema({
  penaltyType: { type: String, enum: ['Fixed', 'Percentage'], default: 'Fixed' },
  penaltyCost: { type: Number, default: 50000 },
  enableWhatsAppBot: { type: Boolean, default: false },
  waLinkType: { type: String, enum: ['App', 'Web'], default: 'App' },
  waKwitansiType: { type: String, enum: ['Text', 'Link'], default: 'Text' },
  baseFontSize: { type: Number, default: 18 }
});

export default mongoose.models.Config || mongoose.model<IConfig>('Config', ConfigSchema);
