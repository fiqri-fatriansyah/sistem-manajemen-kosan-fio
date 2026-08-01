import mongoose, { Schema, Document } from 'mongoose';

export interface IRentalTransaction extends Document {
  transactionId: string;
  customerId: mongoose.Types.ObjectId | string;
  kebayaId: mongoose.Types.ObjectId | string;
  rentalStartTime: Date;
  expectedReturnDate: Date;
  rentalEndTime?: Date;
  status: 'Booked' | 'Ready' | 'Active' | 'Completed' | 'Cancelled';
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
  customerId: { type: Schema.Types.ObjectId, ref: 'Customer', required: true },
  kebayaId: { type: Schema.Types.ObjectId, ref: 'Room', required: true },
  rentalStartTime: { type: Date, required: true, default: Date.now },
  expectedReturnDate: { type: Date, required: true },
  rentalEndTime: { type: Date },
  status: { type: String, enum: ['Booked', 'Ready', 'Active', 'Completed', 'Cancelled'], default: 'Booked' },
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
