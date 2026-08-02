import mongoose from 'mongoose';
import RoomType from '../models/RoomType';
import Room from '../models/Room';
import Customer from '../models/Customer';
import RentalTransaction from '../models/RentalTransaction';
import crypto from 'crypto';

const baseMongoURI = 'mongodb://localhost:27017/kosan-fio';

const run = async () => {
  await mongoose.connect(baseMongoURI);
  console.log('Connected to PROD DB. Wiping old data...');
  
  await RoomType.deleteMany({});
  await Room.deleteMany({});
  await Customer.deleteMany({});
  await RentalTransaction.deleteMany({});
  
  console.log('Creating Room Types...');
  const kostType = await RoomType.create({ name: 'KOST', description: 'Kamar Kost', facilities: ['Kasur', 'Lemari', 'Kipas'], price: 600000 });
  const kiosType = await RoomType.create({ name: 'KIOS', description: 'Kios Usaha', facilities: ['Rolling Door', 'Kamar Mandi Dalam'], price: 1000000 });

  console.log('Creating Rooms and Customers...');
  
  const kostData = [
    { room: 'F.1', cust: 'Budi', tgl: 8, rent: 900000, paid: true },
    { room: 'F4', cust: 'adek budi', tgl: 3, rent: 600000, paid: true },
    { room: 'F4A', cust: 'Hernan', tgl: 1, rent: 600000, paid: true },
    { room: 'F5', cust: null, tgl: null, rent: null, paid: false },
    { room: 'F5A', cust: 'selfie', tgl: 10, rent: 575000, paid: true },
    { room: 'F6', cust: null, tgl: null, rent: null, paid: false },
    { room: 'F6A', cust: 'adel', tgl: 26, rent: 575000, paid: false },
    { room: 'F7', cust: 'New', tgl: 14, rent: 600000, paid: false },
    { room: 'F7A', cust: null, tgl: null, rent: null, paid: false },
    { room: 'F8', cust: 'kamila guru', tgl: 10, rent: 575000, paid: true },
    { room: 'F8A', cust: 'eni guru', tgl: 10, rent: 575000, paid: true },
    { room: 'F9', cust: 'Ali', tgl: 18, rent: 625000, paid: true },
    { room: 'F9A', cust: 'Dwi', tgl: 7, rent: 600000, paid: true },
  ];

  const currentYear = 2026;
  const currentMonth = 6; // July is 0-indexed month 6 in JS Date

  for (const d of kostData) {
    const room = await Room.create({
      roomNumber: d.room,
      roomTypeId: kostType._id,
      status: d.cust ? 'Occupied' : 'Available',
      notes: ''
    });

    if (d.cust) {
      const cust = await Customer.create({
        name: d.cust,
        idCardNumber: `MIG-${crypto.randomUUID().slice(0, 8)}`,
        telephone: '08000000000',
        emergencyContact: ''
      });

      // If paid=true, they paid for July, so their next due is August.
      // If paid=false, they didn't pay for July, so their due is July.
      const paidUntil = new Date(currentYear, d.paid ? currentMonth + 1 : currentMonth, d.tgl!);

      // Set start time to 1 month before paidUntil so they show up as active
      const startTime = new Date(paidUntil);
      startTime.setMonth(startTime.getMonth() - 1);

      await RentalTransaction.create({
        transactionId: `TRX-${crypto.randomUUID().slice(0, 8).toUpperCase()}`,
        customerIds: [cust._id],
        roomId: room._id,
        rentalType: 'Long-Stay',
        rentalStartTime: startTime,
        paymentReminderDate: d.tgl,
        paidUntil: paidUntil,
        status: 'Active',
        depositAmount: 0,
        depositPaid: false,
        payments: d.paid ? [{
          amount: d.rent,
          date: new Date(currentYear, currentMonth, Math.min(d.tgl!, 28)),
          receiptId: `REC-${crypto.randomUUID().slice(0, 8).toUpperCase()}`
        }] : []
      });
    }
  }

  const kiosData = [
    { room: 'Kios 03', cust: 'Wawan', tgl: 9, start: new Date(2026, 6, 9), end: new Date(2026, 7, 9) }, // Assume 1 month if not specified, but paid July. Wait, paid=true so 09 Aug.
    { room: 'Kios 02', cust: 'Budi Sembako', tgl: 7, start: new Date(2026, 6, 7), end: new Date(2026, 9, 7) }, // 07 Juli - 07 Okt
    { room: 'Kios 10-11', cust: 'Budi Listrik', tgl: 20, start: new Date(2026, 5, 20), end: new Date(2026, 8, 20) }, // 20 Juni - 20 Sept
    { room: 'Kios 12', cust: 'Hafid JNE', tgl: 10, start: new Date(2026, 4, 10), end: new Date(2026, 7, 10) }, // 10 Mei - 10 Aug
  ];

  for (const d of kiosData) {
    const room = await Room.create({
      roomNumber: d.room,
      roomTypeId: kiosType._id,
      status: 'Occupied',
      notes: ''
    });

    const cust = await Customer.create({
      name: d.cust,
      idCardNumber: `MIG-${crypto.randomUUID().slice(0, 8)}`,
      telephone: '08000000000',
      emergencyContact: ''
    });

    // They are all marked ✅ in the prompt.
    // Which means they are paid until 'end' date.
    // Rent is 1,000,000 per month.
    // Calculate months between start and end.
    const months = (d.end.getFullYear() - d.start.getFullYear()) * 12 + (d.end.getMonth() - d.start.getMonth());
    const totalRent = months * 1000000;

    await RentalTransaction.create({
      transactionId: `TRX-${crypto.randomUUID().slice(0, 8).toUpperCase()}`,
      customerIds: [cust._id],
      roomId: room._id,
      rentalType: 'Long-Stay',
      rentalStartTime: d.start,
      paymentReminderDate: d.tgl,
      paidUntil: d.end,
      status: 'Active',
      depositAmount: 0,
      depositPaid: false,
      payments: [{
        amount: totalRent,
        date: d.start, // Paid on start date
        receiptId: `REC-${crypto.randomUUID().slice(0, 8).toUpperCase()}`
      }]
    });
  }

  console.log('Migration Complete.');
  process.exit(0);
};

run().catch(err => {
  console.error(err);
  process.exit(1);
});
