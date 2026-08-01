"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const Event_1 = __importDefault(require("../src/models/Event"));
const seedHolidays = async () => {
    try {
        await mongoose_1.default.connect('mongodb://localhost:27017/room-Fio');
        const holidays = [
            { name: 'Tahun Baru Masehi', date: new Date('2026-01-01'), description: 'Libur Nasional' },
            { name: 'Hari Raya Idul Fitri', date: new Date('2026-03-20'), description: 'Libur Nasional - Estimasi' },
            { name: 'Hari Raya Idul Adha', date: new Date('2026-05-27'), description: 'Libur Nasional - Estimasi' },
            { name: 'Hari Kemerdekaan RI', date: new Date('2026-08-17'), description: 'Libur Nasional' },
            { name: 'Hari Raya Natal', date: new Date('2026-12-25'), description: 'Libur Nasional' }
        ];
        await Event_1.default.deleteMany({});
        await Event_1.default.insertMany(holidays);
        console.log('Seeded Indonesian holidays successfully!');
    }
    catch (err) {
        console.error(err);
    }
    finally {
        mongoose_1.default.disconnect();
    }
};
seedHolidays();
//# sourceMappingURL=seed.js.map