import mongoose, { Document } from 'mongoose';
export interface IAuditLog extends Document {
    action: 'CREATE' | 'UPDATE' | 'DELETE' | 'RENT' | 'RETURN' | 'CANCEL';
    entity: 'Customer' | 'Room' | 'Rental' | 'Config';
    details: string;
    timestamp: Date;
}
declare const _default: mongoose.Model<any, {}, {}, {}, any, any, any> | mongoose.Model<IAuditLog, {}, {}, {}, Document<unknown, {}, IAuditLog, {}, mongoose.DefaultSchemaOptions> & IAuditLog & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
} & {
    id: string;
}, any, IAuditLog>;
export default _default;
//# sourceMappingURL=AuditLog.d.ts.map