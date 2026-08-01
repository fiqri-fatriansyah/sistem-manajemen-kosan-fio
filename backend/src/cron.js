"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.fetchPublicHolidays = exports.startCronJobs = void 0;
const node_cron_1 = __importDefault(require("node-cron"));
const nodemailer_1 = __importDefault(require("nodemailer"));
const RentalTransaction_1 = __importDefault(require("./models/RentalTransaction"));
const Room_1 = __importDefault(require("./models/Room"));
const Customer_1 = __importDefault(require("./models/Customer"));
const Event_1 = __importDefault(require("./models/Event"));
const Config_1 = __importDefault(require("./models/Config"));
const whatsapp_1 = require("./whatsapp");
// Setup Ethereal Testing Email
let transporter;
nodemailer_1.default.createTestAccount((err, account) => {
    if (err) {
        console.error('Failed to create a testing account. ' + err.message);
        return;
    }
    transporter = nodemailer_1.default.createTransport({
        host: account.smtp.host,
        port: account.smtp.port,
        secure: account.smtp.secure,
        auth: {
            user: account.user,
            pass: account.pass
        }
    });
    console.log(`[Cron] Ethereal Email Ready. User: ${account.user}`);
});
const startCronJobs = () => {
    // Run every day at 08:00 AM
    node_cron_1.default.schedule('0 8 * * *', async () => {
        console.log('[Cron] Running daily late rental check...');
        try {
            const today = new Date();
            const tomorrow = new Date();
            tomorrow.setDate(tomorrow.getDate() + 1);
            const lateRentals = await RentalTransaction_1.default.find({
                status: 'Active',
                expectedReturnDate: { $lt: today }
            }).populate('customerId roomId');
            const rentalsDueTomorrow = await RentalTransaction_1.default.find({
                status: 'Active',
                expectedReturnDate: { $gte: new Date(tomorrow.setHours(0, 0, 0, 0)), $lt: new Date(tomorrow.setHours(23, 59, 59, 999)) }
            }).populate('customerId roomId');
            if (lateRentals.length === 0 && rentalsDueTomorrow.length === 0) {
                console.log('[Cron] No late or upcoming rentals found today.');
                return;
            }
            let emailText = `Warning! There are ${lateRentals.length} late room rentals today:\n\n`;
            lateRentals.forEach(r => {
                const c = r.customerId;
                const k = r.roomId;
                emailText += `- Customer: ${c.name} (${c.telephone})\n  Room: ${k.tipeKamar} (${k.fasilitas})\n  Expected Return: ${new Date(r.expectedReturnDate).toLocaleDateString()}\n\n`;
            });
            const info = await transporter.sendMail({
                from: '"Sistem Kosan Fio" <system@kebayalinda.local>',
                to: 'owner@kebayalinda.local',
                subject: '⚠️ Daily Report: Late Room Rentals',
                text: emailText
            });
            console.log('[Cron] Email sent successfully! Preview URL: %s', nodemailer_1.default.getTestMessageUrl(info));
            const config = await Config_1.default.findOne();
            if (config?.enableWhatsAppBot && (0, whatsapp_1.getWhatsAppStatus)().isReady) {
                for (const rental of rentalsDueTomorrow) {
                    const c = rental.customerId;
                    if (c && c.telephone) {
                        const msg = `Halo Kak ${c.name}, mengingatkan bahwa penyewaan room Anda jatuh tempo besok (${tomorrow.toLocaleDateString('id-ID', { day: 'numeric', month: 'long' })}). Mohon dikembalikan tepat waktu ya! Terima kasih, Kosan Fio.`;
                        await (0, whatsapp_1.sendWhatsAppMessage)(c.telephone, msg);
                    }
                }
            }
        }
        catch (err) {
            console.error('[Cron] Error running daily check:', err);
        }
    });
    // Run on January 1st every year
    node_cron_1.default.schedule('0 0 1 1 *', () => {
        (0, exports.fetchPublicHolidays)(new Date().getFullYear());
    });
    console.log('[Cron] Cron jobs initialized (0 8 * * *), (0 0 1 1 *).');
    // Fetch holidays on boot
    (0, exports.fetchPublicHolidays)(new Date().getFullYear());
};
exports.startCronJobs = startCronJobs;
const fetchPublicHolidays = async (year) => {
    console.log(`[Cron] Fetching public holidays for ${year}...`);
    try {
        let holidays = [];
        try {
            // Use AbortController for fetch timeout so it doesn't hang forever
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 5000);
            const res = await fetch(`https://api-harilibur.vercel.app/api?year=${year}`, { signal: controller.signal });
            clearTimeout(timeoutId);
            if (!res.ok)
                throw new Error('API Error');
            holidays = await res.json();
        }
        catch (fetchErr) {
            console.log(`[Cron] External API failed or timed out. Using reliable offline fallback for ${year}.`);
            holidays = [
                { holiday_date: `${year}-01-01`, holiday_name: 'Tahun Baru Masehi', is_national_holiday: true },
                { holiday_date: `${year}-03-20`, holiday_name: 'Idul Fitri (Estimasi)', is_national_holiday: true },
                { holiday_date: `${year}-05-01`, holiday_name: 'Hari Buruh Internasional', is_national_holiday: true },
                { holiday_date: `${year}-05-27`, holiday_name: 'Idul Adha (Estimasi)', is_national_holiday: true },
                { holiday_date: `${year}-06-01`, holiday_name: 'Hari Lahir Pancasila', is_national_holiday: true },
                { holiday_date: `${year}-08-17`, holiday_name: 'Hari Kemerdekaan Republik Indonesia', is_national_holiday: true },
                { holiday_date: `${year}-12-25`, holiday_name: 'Hari Raya Natal', is_national_holiday: true }
            ];
        }
        if (!holidays || !Array.isArray(holidays))
            return;
        const fixedMasehi = ['Tahun Baru Masehi', 'Hari Buruh Internasional', 'Hari Lahir Pancasila', 'Hari Kemerdekaan Republik Indonesia', 'Hari Raya Natal'];
        await Event_1.default.deleteMany({ isHijriah: true, date: { $gte: new Date(`${year}-01-01`), $lte: new Date(`${year}-12-31T23:59:59.999Z`) } });
        for (const h of holidays) {
            if (h.is_national_holiday) {
                const hDate = new Date(h.holiday_date);
                if (fixedMasehi.includes(h.holiday_name)) {
                    const existing = await Event_1.default.findOne({ name: h.holiday_name, isPublicHoliday: true });
                    if (!existing) {
                        await Event_1.default.create({
                            name: h.holiday_name,
                            date: hDate,
                            description: 'Libur Nasional',
                            recurring: 'yearly',
                            isPublicHoliday: true,
                            isHijriah: false
                        });
                    }
                }
                else {
                    // Check if it already exists for this exact shifting year to prevent duplicates on multiple boots
                    const existingShift = await Event_1.default.findOne({ name: h.holiday_name, isPublicHoliday: true, isHijriah: true, date: hDate });
                    if (!existingShift) {
                        await Event_1.default.create({
                            name: h.holiday_name,
                            date: hDate,
                            description: 'Libur Nasional',
                            recurring: 'none',
                            isPublicHoliday: true,
                            isHijriah: true
                        });
                    }
                }
            }
        }
        console.log(`[Cron] Successfully synced public holidays for ${year}.`);
    }
    catch (err) {
        console.log(`[Cron] Failed to fetch public holidays (silent fail)`);
    }
};
exports.fetchPublicHolidays = fetchPublicHolidays;
//# sourceMappingURL=cron.js.map