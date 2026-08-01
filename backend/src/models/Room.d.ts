import mongoose, { Document } from 'mongoose';
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
declare const _default: mongoose.Model<IKebaya, {}, {}, {}, Document<unknown, {}, IKebaya, {}, mongoose.DefaultSchemaOptions> & IKebaya & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
} & {
    id: string;
}, any, IKebaya>;
export default _default;
//# sourceMappingURL=Room.d.ts.map