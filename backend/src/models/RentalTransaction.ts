import mongoose, { Schema, Document } from 'mongoose';

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
  cancellationReason?: string;
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
  cancellationReason: { type: String },
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
