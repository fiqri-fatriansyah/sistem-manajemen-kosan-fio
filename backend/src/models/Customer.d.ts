import mongoose, { Document } from 'mongoose';
export interface ICustomer extends Document {
    name: string;
    telephone: string;
    address?: string;
    email?: string;
    isActive: boolean;
}
declare const _default: mongoose.Model<any, {}, {}, {}, any, any, any> | mongoose.Model<ICustomer, {}, {}, {}, Document<unknown, {}, ICustomer, {}, mongoose.DefaultSchemaOptions> & ICustomer & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
} & {
    id: string;
}, any, ICustomer>;
export default _default;
//# sourceMappingURL=Customer.d.ts.map