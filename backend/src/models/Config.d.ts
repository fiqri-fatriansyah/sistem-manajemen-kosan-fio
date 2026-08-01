import mongoose, { Document } from 'mongoose';
export interface IConfig extends Document {
    penaltyType: string;
    penaltyCost: number;
    enableWhatsAppBot: boolean;
    waLinkType: string;
    waKwitansiType: string;
    baseFontSize: number;
}
declare const _default: mongoose.Model<any, {}, {}, {}, any, any, any> | mongoose.Model<IConfig, {}, {}, {}, Document<unknown, {}, IConfig, {}, mongoose.DefaultSchemaOptions> & IConfig & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
} & {
    id: string;
}, any, IConfig>;
export default _default;
//# sourceMappingURL=Config.d.ts.map