import mongoose from 'mongoose';
import Event from '../src/models/Event';

const seedHolidays = async () => {
  try {
    await mongoose.connect('mongodb://localhost:27017/room-Fio');
    
    const holidays = [
      { name: 'Tahun Baru Masehi', date: new Date('2026-01-01'), description: 'Libur Nasional' },
      { name: 'Hari Raya Idul Fitri', date: new Date('2026-03-20'), description: 'Libur Nasional - Estimasi' },
      { name: 'Hari Raya Idul Adha', date: new Date('2026-05-27'), description: 'Libur Nasional - Estimasi' },
      { name: 'Hari Kemerdekaan RI', date: new Date('2026-08-17'), description: 'Libur Nasional' },
      { name: 'Hari Raya Natal', date: new Date('2026-12-25'), description: 'Libur Nasional' }
    ];

    await Event.deleteMany({});
    await Event.insertMany(holidays);
    console.log('Seeded Indonesian holidays successfully!');
  } catch (err) {
    console.error(err);
  } finally {
    mongoose.disconnect();
  }
};

seedHolidays();
