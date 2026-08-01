import mongoose, { Schema, Document } from 'mongoose';

export interface IConfig extends Document {
  penaltyType: string;
  penaltyCost: number;
  enableWhatsAppBot: boolean;
  waLinkType: string;
  waKwitansiType: string;
  appName: string;
  appDescription: string;
  appLogoUrl: string;
  appFaviconUrl: string;
  baseFontSize: number;
  overdueGracePeriodDays: number;
  msgTemplateBooked: string;
  msgTemplateOverdue: string;
  msgTemplateReminder: string;
  msgTemplateEviction: string;
}

const ConfigSchema: Schema = new Schema({
  appName: { type: String, default: 'Sistem Manajemen Kosan Fio' },
  appDescription: { type: String, default: 'Platform manajemen kosan terbaik.' },
  appLogoUrl: { type: String, default: '' },
  appFaviconUrl: { type: String, default: '' },
  penaltyType: { type: String, enum: ['Fixed', 'Percentage'], default: 'Fixed' },
  penaltyCost: { type: Number, default: 50000 },
  enableWhatsAppBot: { type: Boolean, default: false },
  waLinkType: { type: String, enum: ['App', 'Web'], default: 'App' },
  waKwitansiType: { type: String, enum: ['Text', 'Link'], default: 'Text' },
  overdueGracePeriodDays: { type: Number, default: 3 },
  baseFontSize: { type: Number, default: 18 },
  msgTemplateBooked: { type: String, default: 'Halo {{nama}},\n\nKami mengingatkan bahwa Anda memiliki booking untuk kamar {{kamar}} yang belum lunas/DP. Mohon segera diselesaikan sebesar Rp {{nominal}}.\n\nTerima kasih.' },
  msgTemplateOverdue: { type: String, default: 'Halo {{nama}},\n\nKami mengingatkan bahwa tagihan sewa kamar {{kamar}} Anda telah melewati batas waktu (jatuh tempo pada {{tanggal}}). Mohon segera melunasi tunggakan sebesar Rp {{nominal}}.\n\nTerima kasih.' },
  msgTemplateOverstay: { type: String, default: 'Halo {{nama}},\n\nKami mengingatkan bahwa masa sewa kamar {{kamar}} Anda telah habis pada {{tanggal}}.\nMohon segera konfirmasi perpanjangan sewa atau silakan check-out.\n\nTerima kasih.' },
  msgTemplateReminder: { type: String, default: 'Halo {{nama}},\n\nKami mengingatkan bahwa tagihan sewa kamar {{kamar}} Anda akan jatuh tempo pada {{tanggal}}.\nMohon persiapkan pembayaran Anda atau silakan konfirmasi jika ingin check-out.\n\nTerima kasih.' },
  msgTemplateEviction: { type: String, default: 'Halo {{nama}},\n\nKami menginformasikan bahwa masa sewa Anda di kamar {{kamar}} telah berakhir dan melewati batas waktu toleransi.\nMohon kesediaannya untuk segera mengosongkan kamar, atau hubungi kami untuk mendiskusikan lebih lanjut.\n\nTerima kasih atas kerja samanya.' }
});

export default mongoose.models.Config || mongoose.model<IConfig>('Config', ConfigSchema);
