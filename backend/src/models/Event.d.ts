import mongoose, { Document } from 'mongoose';
export interface IEvent extends Document {
    name: string;
    date: Date;
    description?: string;
    recurring: 'none' | 'weekly' | 'monthly' | 'yearly';
    isPublicHoliday: boolean;
    isHijriah: boolean;
}
declare const _default: mongoose.Model<IEvent, {}, {}, {}, Document<unknown, {}, IEvent, {}, mongoose.DefaultSchemaOptions> & IEvent & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
} & {
    id: string;
}, any, IEvent>;
export default _default;
//# sourceMappingURL=Event.d.ts.map