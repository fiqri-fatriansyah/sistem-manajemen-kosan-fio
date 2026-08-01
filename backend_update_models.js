const fs = require('fs');
const path = require('path');

const modelsDir = 'D:\\sistem-manajemen-kosan-fio\\backend\\src\\models';

// 1. FeatureTag.ts
const featureTagContent = import mongoose, { Schema, Document } from 'mongoose';

export interface IFeatureTag extends Document {
  name: string;
}

const FeatureTagSchema: Schema = new Schema({
  name: { type: String, required: true, unique: true }
}, { timestamps: true });

export default mongoose.models.FeatureTag || mongoose.model<IFeatureTag>('FeatureTag', FeatureTagSchema);
;
fs.writeFileSync(path.join(modelsDir, 'FeatureTag.ts'), featureTagContent);

// 2. RoomType.ts
const roomTypeContent = import mongoose, { Schema, Document } from 'mongoose';

export interface IRoomType extends Document {
  name: string;
  features: string[];
  price: number;
  imageUrl?: string;
}

const RoomTypeSchema: Schema = new Schema({
  name: { type: String, required: true },
  features: [{ type: String }],
  price: { type: Number, required: true },
  imageUrl: { type: String }
}, { timestamps: true });

export default mongoose.models.RoomType || mongoose.model<IRoomType>('RoomType', RoomTypeSchema);
;
fs.writeFileSync(path.join(modelsDir, 'RoomType.ts'), roomTypeContent);

// 3. Room.ts (Individual Room)
const roomContent = import mongoose, { Schema, Document } from 'mongoose';

export interface IRoom extends Document {
  roomNumber: string;
  roomTypeId: mongoose.Types.ObjectId | string;
  features: string[];
  status: 'Available' | 'Occupied' | 'Cleaning' | 'Maintenance';
  imageUrl?: string;
}

const RoomSchema: Schema = new Schema({
  roomNumber: { type: String, required: true, unique: true },
  roomTypeId: { type: Schema.Types.ObjectId, ref: 'RoomType', required: true },
  features: [{ type: String }],
  status: { type: String, enum: ['Available', 'Occupied', 'Cleaning', 'Maintenance'], default: 'Available' },
  imageUrl: { type: String }
}, { timestamps: true });

export default mongoose.models.Room || mongoose.model<IRoom>('Room', RoomSchema);
;
fs.writeFileSync(path.join(modelsDir, 'Room.ts'), roomContent);

// 4. RentalTransaction.ts
const rentalTxContent = import mongoose, { Schema, Document } from 'mongoose';

export interface IRentalTransaction extends Document {
  transactionId: string;
  customerIds: (mongoose.Types.ObjectId | string)[];
  roomId: mongoose.Types.ObjectId | string;
  rentalType: 'One-Time' | 'Long-Stay';
  rentalStartTime: Date;
  expectedReturnDate?: Date; // Only used for One-Time
  paymentReminderDate?: number; // Only used for Long-Stay (1-31)
  paidUntil?: Date; // Tracks advance payments for Long-Stay
  rentalEndTime?: Date;
  status: 'Booked' | 'Active' | 'Completed' | 'Cancelled';
  amountToPay?: number;
  depositAmount: number;
  depositPaid: boolean;
  payments: Array<{
    amount: number;
    date: Date;
    receiptId: string;
  }>;
}

const RentalTransactionSchema: Schema = new Schema({
  transactionId: { type: String, required: true, unique: true },
  customerIds: [{ type: Schema.Types.ObjectId, ref: 'Customer', required: true }],
  roomId: { type: Schema.Types.ObjectId, ref: 'Room', required: true },
  rentalType: { type: String, enum: ['One-Time', 'Long-Stay'], required: true },
  rentalStartTime: { type: Date, required: true, default: Date.now },
  expectedReturnDate: { type: Date },
  paymentReminderDate: { type: Number, min: 1, max: 31 },
  paidUntil: { type: Date },
  rentalEndTime: { type: Date },
  status: { type: String, enum: ['Booked', 'Active', 'Completed', 'Cancelled'], default: 'Booked' },
  amountToPay: { type: Number },
  depositAmount: { type: Number, default: 0 },
  depositPaid: { type: Boolean, default: false },
  payments: [{
    amount: { type: Number, required: true },
    date: { type: Date, default: Date.now },
    receiptId: { type: String, required: true }
  }]
}, { timestamps: true });

export default mongoose.models.RentalTransaction || mongoose.model<IRentalTransaction>('RentalTransaction', RentalTransactionSchema);
;
fs.writeFileSync(path.join(modelsDir, 'RentalTransaction.ts'), rentalTxContent);

console.log('Backend models updated.');
