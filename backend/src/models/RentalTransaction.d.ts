import mongoose, { Document } from 'mongoose';
export interface IRentalTransaction extends Document {
    transactionId: string;
    customerId: mongoose.Types.ObjectId | string;
    roomId: mongoose.Types.ObjectId | string;
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
declare const _default: mongoose.Model<any, {}, {}, {}, any, any, any> | mongoose.Model<IRentalTransaction, {}, {}, {}, Document<unknown, {}, IRentalTransaction, {}, mongoose.DefaultSchemaOptions> & IRentalTransaction & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
} & {
    id: string;
}, any, IRentalTransaction>;
export default _default;
//# sourceMappingURL=RentalTransaction.d.ts.map