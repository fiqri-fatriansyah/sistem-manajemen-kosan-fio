import mongoose from 'mongoose';
import RoomType from '../models/RoomType';
import Room from '../models/Room';
import Customer from '../models/Customer';
import RentalTransaction from '../models/RentalTransaction';
import FeatureTag from '../models/FeatureTag';

export const generateAdvancedSeed = async () => {
  console.log('Generating Kosan Demo Data...');

  // Clear existing
  await RoomType.deleteMany({});
  await Room.deleteMany({});
  await Customer.deleteMany({});
  await RentalTransaction.deleteMany({});
  await FeatureTag.deleteMany({});

  // 1. Feature Tags
  const featureNames = [
    'AC', 'Kamar Mandi Dalam', 'Kipas Angin', 'Water Heater', 'WiFi', 
    'Kasur Queen', 'Kasur Single', 'Kasur Busa', 'TV', 'Breakfast', 
    'Kamar Mandi Luar', 'Kulkas Mini', 'Balkon'
  ];
  await FeatureTag.insertMany(featureNames.map(name => ({ name })));

  // 2. Room Types
  const roomTypes = [
    { name: 'Tipe VIP', features: ['AC', 'Kamar Mandi Dalam', 'WiFi', 'Water Heater', 'Kasur Queen', 'TV'], price: 2500000, priceDaily: 200000, imageUrl: '/uploads/rooms/type_vip_1785572165962.jpg' },
    { name: 'Tipe A', features: ['AC', 'Kamar Mandi Dalam', 'WiFi', 'Kasur Single'], price: 1800000, priceDaily: 150000, imageUrl: '/uploads/rooms/type_standard_1785572174935.jpg' },
    { name: 'Tipe B', features: ['Kipas Angin', 'Kamar Mandi Dalam', 'WiFi'], price: 1200000, priceDaily: 100000, imageUrl: '/uploads/rooms/type_economy_1785572184072.jpg' },
    { name: 'Tipe Kapsul', features: ['AC', 'Kamar Mandi Luar', 'WiFi', 'Kasur Single'], price: 900000, priceDaily: 75000, imageUrl: '/uploads/rooms/type_capsule_1785572202974.jpg' },
    { name: 'Tipe Family', features: ['AC', 'Kamar Mandi Dalam', 'WiFi', 'Water Heater', 'Kasur Queen', 'Breakfast'], price: 3500000, priceDaily: 300000, imageUrl: '/uploads/rooms/type_family_1785572193665.jpg' },
  ];
  const insertedRoomTypes = await RoomType.insertMany(roomTypes);

  // 3. Individual Rooms
  const roomImages = [
    '/uploads/rooms/room_1_1785572223534.jpg', '/uploads/rooms/room_2_1785572233049.jpg',
    '/uploads/rooms/room_3_1785572243220.jpg', '/uploads/rooms/room_4_1785572253659.jpg',
    '/uploads/rooms/room_5_1785572263959.jpg', '/uploads/rooms/room_6_1785572273875.jpg'
  ];
  
  const roomsToInsert = [];
  let roomCounter = 1;

  for (const rt of insertedRoomTypes) {
    // Generate 4 to 7 rooms per type
    const numRooms = Math.floor(Math.random() * 4) + 4;
    for (let i = 0; i < numRooms; i++) {
       const roomFeatures = [...rt.features];
       if (Math.random() > 0.7) roomFeatures.push('Kulkas Mini');
       if (Math.random() > 0.85) roomFeatures.push('Balkon');
       
       // Keep some rooms available, others for seeding active rentals
       const status = 'Available'; 
       
       const specificPriceMonthly = Math.random() > 0.8 ? rt.price + 200000 : undefined;
       const specificPriceDaily = specificPriceMonthly ? rt.priceDaily + 20000 : undefined;

       roomsToInsert.push({
         roomNumber: `${rt.name.split(' ')[1] || 'Room'}-${roomCounter++}`,
         roomTypeId: rt._id,
         features: roomFeatures,
         status: status,
         priceMonthly: specificPriceMonthly,
         priceDaily: specificPriceDaily,
         imageUrl: roomImages[Math.floor(Math.random() * roomImages.length)]
       });
    }
  }
  const insertedRooms = await Room.insertMany(roomsToInsert);

  // 4. Customers
  const customers = [
    { name: 'Siti Aminah', telephone: '081234567890', address: 'Jl. Merdeka No. 1' },
    { name: 'Budi Santoso', telephone: '085678901234', address: 'Komp. Polri No. 5B' },
    { name: 'Rina Wijaya', telephone: '082123123123', address: 'Apartemen Sudirman Lt 15' },
    { name: 'Dewi Lestari', telephone: '081987654321', address: '' }, 
    { name: 'Agus Pratama', telephone: '087812345678', address: 'Jl. Kenangan No. 99' }, 
    { name: 'Maya Sari', telephone: '081112223334', address: 'Perumahan Elit Blok A1' },
    { name: 'Putri Nurhaliza', telephone: '085544332211', address: '' },
    { name: 'Bagas Firmansyah', telephone: '089988776655', address: '' },
    { name: 'Joko Anwar', telephone: '081212341234', address: '' },
    { name: 'Sri Mulyani', telephone: '085656785678', address: '' },
    { name: 'Andi Saputra', telephone: '082233445566', address: '' }
  ];
  const insertedCustomers = await Customer.insertMany(customers);

  // 5. Rentals
  const rentals = [];
  const now = new Date();
  
  // Keep track of which rooms are occupied so we don't double book Active ones
  const occupiedRoomIds = new Set();
  
  // Helper to pick random available room
  const pickRoom = () => {
    let r = insertedRooms[Math.floor(Math.random() * insertedRooms.length)];
    while(occupiedRoomIds.has(r._id.toString())) {
      r = insertedRooms[Math.floor(Math.random() * insertedRooms.length)];
    }
    return r;
  };

  // 5a. Active Long-Stay (Normal, Multi-tenant, and Advance Paid)
  for (let i = 0; i < 6; i++) {
    const room = pickRoom();
    occupiedRoomIds.add(room._id.toString());
    const rt = insertedRoomTypes.find(t => t._id.toString() === room.roomTypeId.toString());
    
    // 20% chance of multi-tenant
    const tenantIds = [insertedCustomers[i]._id];
    if (Math.random() > 0.8) {
      tenantIds.push(insertedCustomers[(i + 1) % insertedCustomers.length]._id);
    }

    // Rentals started between 1 and 6 months ago
    const monthsAgo = Math.floor(Math.random() * 6) + 1;
    const start = new Date(now.getFullYear(), now.getMonth() - monthsAgo, Math.floor(Math.random() * 28) + 1);
    
    // Decide if they paid exactly up to date, or in advance
    // For example, if they started 2 months ago, they should have paid 2 times minimum.
    // Maybe they paid 4 times (2 months in advance).
    const monthsPaid = monthsAgo + (Math.random() > 0.7 ? 2 : 0); // Sometimes paid in advance
    const paidUntil = new Date(start.getFullYear(), start.getMonth() + monthsPaid, start.getDate());
    
    // Generate payments array
    const payments = [];
    for (let m = 0; m < monthsPaid; m++) {
      payments.push({
        amount: rt.price,
        date: new Date(start.getFullYear(), start.getMonth() + m, start.getDate()),
        receiptId: `RCPT-${Math.random().toString(36).substring(2, 9).toUpperCase()}`
      });
    }

    rentals.push({
      transactionId: `TRX-${Math.random().toString(36).substring(2, 9).toUpperCase()}`,
      customerIds: tenantIds,
      roomId: room._id,
      rentalType: 'Long-Stay',
      rentalStartTime: start,
      paymentReminderDate: start.getDate(),
      paidUntil: paidUntil,
      status: 'Active',
      depositAmount: rt.price, // 1 month deposit
      depositPaid: true,
      payments: payments
    });
    
    // Dynamic status handles room occupancy
  }

  // 5b. Active One-Time (Harian/Mingguan)
  for (let i = 0; i < 3; i++) {
    const room = pickRoom();
    occupiedRoomIds.add(room._id.toString());
    const rt = insertedRoomTypes.find(t => t._id.toString() === room.roomTypeId.toString());
    
    const start = new Date(now.getTime() - (Math.floor(Math.random() * 5) * 86400000));
    const end = new Date(start.getTime() + (Math.floor(Math.random() * 7) + 2) * 86400000); // 2-9 days stay
    
    // Price for one-time is based on priceDaily
    const days = Math.ceil((end.getTime() - start.getTime()) / 86400000);
    const amount = (rt.priceDaily || 100000) * days;

    rentals.push({
      transactionId: `TRX-${Math.random().toString(36).substring(2, 9).toUpperCase()}`,
      customerIds: [insertedCustomers[i + 5]._id],
      roomId: room._id,
      rentalType: 'One-Time',
      rentalStartTime: start,
      expectedReturnDate: end,
      status: 'Active',
      depositAmount: 500000,
      depositPaid: true,
      payments: [{
        amount: amount + 500000,
        date: start,
        receiptId: `RCPT-${Math.random().toString(36).substring(2, 9).toUpperCase()}`
      }]
    });
    // Dynamic status handles room occupancy
  }

  // 5b_1. GUARANTEED EDGE CASES
  // Overdue Long-Stay (Tunggakan)
  const roomOverdue = pickRoom(); occupiedRoomIds.add(roomOverdue._id.toString());
  const rtOverdue = insertedRoomTypes.find(t => t._id.toString() === roomOverdue.roomTypeId.toString());
  const startOverdue = new Date(now.getFullYear(), now.getMonth() - 2, 10);
  const paidUntilOverdue = new Date(now.getFullYear(), now.getMonth() - 1, 10); // Paid until last month (Overdue)
  
  rentals.push({
    transactionId: `TRX-${Math.random().toString(36).substring(2, 9).toUpperCase()}`,
    customerIds: [insertedCustomers[2]._id],
    roomId: roomOverdue._id,
    rentalType: 'Long-Stay',
    rentalStartTime: startOverdue,
    paymentReminderDate: 10,
    paidUntil: paidUntilOverdue,
    status: 'Active',
    depositAmount: rtOverdue?.price || 0,
    depositPaid: true,
    payments: [{ amount: rtOverdue?.price || 0, date: startOverdue, receiptId: 'RCPT-OV1' }]
  });
  // Dynamic status handles room occupancy

  // Overstay One-Time (Harian/Mingguan)
  const roomOverstay = pickRoom(); occupiedRoomIds.add(roomOverstay._id.toString());
  const rtOverstay = insertedRoomTypes.find(t => t._id.toString() === roomOverstay.roomTypeId.toString());
  const startOverstay = new Date(now.getTime() - (10 * 86400000));
  const endOverstay = new Date(startOverstay.getTime() + (3 * 86400000)); // Expected return was 7 days ago
  
  rentals.push({
    transactionId: `TRX-${Math.random().toString(36).substring(2, 9).toUpperCase()}`,
    customerIds: [insertedCustomers[3]._id],
    roomId: roomOverstay._id,
    rentalType: 'One-Time',
    rentalStartTime: startOverstay,
    expectedReturnDate: endOverstay,
    status: 'Active',
    depositAmount: 500000,
    depositPaid: true,
    payments: [{ amount: 650000, date: startOverstay, receiptId: 'RCPT-OS1' }]
  });
  // Dynamic status handles room occupancy

  // Unfinished Down Payment (Belum DP)
  const roomNoDp = pickRoom(); occupiedRoomIds.add(roomNoDp._id.toString());
  const rtNoDp = insertedRoomTypes.find(t => t._id.toString() === roomNoDp.roomTypeId.toString());
  
  rentals.push({
    transactionId: `TRX-${Math.random().toString(36).substring(2, 9).toUpperCase()}`,
    customerIds: [insertedCustomers[4]._id],
    roomId: roomNoDp._id,
    rentalType: 'Long-Stay',
    rentalStartTime: now,
    paymentReminderDate: now.getDate(),
    paidUntil: now, // Will be overridden or tracked upon DP
    status: 'Booked', // Status is Booked until DP is paid
    depositAmount: rtNoDp?.price || 0,
    depositPaid: false, // NOT PAID
    payments: []
  });
  // Dynamic status handles room occupancy

  // 5b_2. FUTURE BOOKINGS (Timeline Edge Cases)
  
  // Future Booking (One-Time)
  const roomFutureOneTime = pickRoom(); occupiedRoomIds.add(roomFutureOneTime._id.toString());
  const rtFuture1 = insertedRoomTypes.find(t => t._id.toString() === roomFutureOneTime.roomTypeId.toString());
  const futureStart1 = new Date(now.getTime() + (10 * 86400000)); // 10 days from now
  const futureEnd1 = new Date(futureStart1.getTime() + (5 * 86400000)); // 5 days stay
  
  rentals.push({
    transactionId: `TRX-${Math.random().toString(36).substring(2, 9).toUpperCase()}`,
    customerIds: [insertedCustomers[5]._id],
    roomId: roomFutureOneTime._id,
    rentalType: 'One-Time',
    rentalStartTime: futureStart1,
    expectedReturnDate: futureEnd1,
    status: 'Booked', // Paid full, but still booked because not checked in yet
    depositAmount: 500000,
    depositPaid: true,
    payments: [{ amount: (rtFuture1?.priceDaily || 100000) * 5 + 500000, date: now, receiptId: 'RCPT-FUT1' }]
  });

  // Future Booking (Long-Stay) - Partial DP
  const roomFutureLongStay = pickRoom(); occupiedRoomIds.add(roomFutureLongStay._id.toString());
  const rtFuture2 = insertedRoomTypes.find(t => t._id.toString() === roomFutureLongStay.roomTypeId.toString());
  const futureStart2 = new Date(now.getTime() + (20 * 86400000)); // 20 days from now
  
  rentals.push({
    transactionId: `TRX-${Math.random().toString(36).substring(2, 9).toUpperCase()}`,
    customerIds: [insertedCustomers[6]._id],
    roomId: roomFutureLongStay._id,
    rentalType: 'Long-Stay',
    rentalStartTime: futureStart2,
    paymentReminderDate: futureStart2.getDate(),
    paidUntil: futureStart2, // Not active yet
    status: 'Booked',
    depositAmount: rtFuture2?.price || 0,
    depositPaid: false,
    payments: [{ amount: 500000, date: now, receiptId: 'RCPT-FUT2' }] // Only paid DP
  });

  // Future Booking (One-Time) - NO DP AT ALL
  const roomFutureNoDp = pickRoom(); occupiedRoomIds.add(roomFutureNoDp._id.toString());
  const rtFuture3 = insertedRoomTypes.find(t => t._id.toString() === roomFutureNoDp.roomTypeId.toString());
  const futureStart3 = new Date(now.getTime() + (12 * 86400000)); // 12 days from now
  const futureEnd3 = new Date(futureStart3.getTime() + (3 * 86400000)); // 3 days stay
  
  rentals.push({
    transactionId: `TRX-${Math.random().toString(36).substring(2, 9).toUpperCase()}`,
    customerIds: [insertedCustomers[7]._id],
    roomId: roomFutureNoDp._id,
    rentalType: 'One-Time',
    rentalStartTime: futureStart3,
    expectedReturnDate: futureEnd3,
    status: 'Booked', // Not checked in, NO DP
    depositAmount: 0,
    depositPaid: false,
    payments: [] // NO PAYMENT!
  });
  
  // 5c. CHECK-IN SYSTEM & PENAGIHAN EDGE CASES (Guaranteed 1 each)
  
  // 1. "Today/Paid" (Check-In candidate) -> Start today, Paid partial DP
  const roomTodayPaid = pickRoom(); occupiedRoomIds.add(roomTodayPaid._id.toString());
  rentals.push({
    transactionId: `TRX-${Math.random().toString(36).substring(2, 9).toUpperCase()}`,
    customerIds: [insertedCustomers[8]._id],
    roomId: roomTodayPaid._id,
    rentalType: 'Long-Stay',
    rentalStartTime: now,
    paymentReminderDate: now.getDate(),
    paidUntil: new Date(now.getFullYear(), now.getMonth() + 1, now.getDate()),
    status: 'Booked',
    depositAmount: 1500000,
    depositPaid: false,
    payments: [{ amount: 500000, date: now, receiptId: 'RCPT-TDP1' }]
  });

  // 2. "Today/Unpaid" (Check-In candidate) -> Start today, Unpaid
  const roomTodayUnpaid = pickRoom(); occupiedRoomIds.add(roomTodayUnpaid._id.toString());
  rentals.push({
    transactionId: `TRX-${Math.random().toString(36).substring(2, 9).toUpperCase()}`,
    customerIds: [insertedCustomers[9]._id],
    roomId: roomTodayUnpaid._id,
    rentalType: 'One-Time',
    rentalStartTime: now,
    expectedReturnDate: new Date(now.getTime() + (3 * 86400000)),
    status: 'Booked',
    depositAmount: 0,
    depositPaid: false,
    payments: []
  });

  // 3. "Active/Unpaid" (Penagihan candidate) -> Active, completely unpaid
  const roomActiveUnpaid = pickRoom(); occupiedRoomIds.add(roomActiveUnpaid._id.toString());
  rentals.push({
    transactionId: `TRX-${Math.random().toString(36).substring(2, 9).toUpperCase()}`,
    customerIds: [insertedCustomers[10]._id],
    roomId: roomActiveUnpaid._id,
    rentalType: 'Long-Stay',
    rentalStartTime: new Date(now.getFullYear(), now.getMonth() - 1, now.getDate()),
    paymentReminderDate: now.getDate(),
    paidUntil: new Date(now.getFullYear(), now.getMonth() - 1, now.getDate()),
    status: 'Active',
    depositAmount: 0,
    depositPaid: false,
    payments: []
  });

  // 6. Completed Rentals (Past History);

  // 5c. One customer renting multiple rooms
  const richCustomer = insertedCustomers[insertedCustomers.length - 1]; // Andi
  const room1 = pickRoom(); occupiedRoomIds.add(room1._id.toString());
  const room2 = pickRoom(); occupiedRoomIds.add(room2._id.toString());
  const rt1 = insertedRoomTypes.find(t => t._id.toString() === room1.roomTypeId.toString());
  const rt2 = insertedRoomTypes.find(t => t._id.toString() === room2.roomTypeId.toString());
  
  [ {r: room1, rt: rt1}, {r: room2, rt: rt2} ].forEach(({r, rt}) => {
    const start = new Date(now.getFullYear(), now.getMonth(), 5);
    const paidUntil = new Date(now.getFullYear(), now.getMonth() + 1, 5);
    rentals.push({
      transactionId: `TRX-${Math.random().toString(36).substring(2, 9).toUpperCase()}`,
      customerIds: [richCustomer._id],
      roomId: r._id,
      rentalType: 'Long-Stay',
      rentalStartTime: start,
      paymentReminderDate: 5,
      paidUntil: paidUntil,
      status: 'Active',
      depositAmount: rt.price,
      depositPaid: true,
      payments: [{
        amount: rt.price,
        date: start,
        receiptId: `RCPT-${Math.random().toString(36).substring(2, 9).toUpperCase()}`
      }]
    });
  });
  // Dynamic status handles room occupancy

  // 5d. Historical (Completed/Cancelled)
  for (let i = 0; i < 15; i++) {
    const room = insertedRooms[Math.floor(Math.random() * insertedRooms.length)];
    const rt = insertedRoomTypes.find(t => t._id.toString() === room.roomTypeId.toString());
    const c = insertedCustomers[Math.floor(Math.random() * insertedCustomers.length)];
    
    const isCancelled = i % 5 === 0;
    const isLongStay = i % 2 === 0;
    const start = new Date(now.getTime() - (Math.floor(Math.random() * 100) + 30) * 86400000);
    
    const rentObj: any = {
      transactionId: `TRX-${Math.random().toString(36).substring(2, 9).toUpperCase()}`,
      customerIds: [c._id],
      roomId: room._id,
      rentalType: isLongStay ? 'Long-Stay' : 'One-Time',
      rentalStartTime: start,
      status: isCancelled ? 'Cancelled' : 'Completed',
      depositAmount: rt.price,
      depositPaid: !isCancelled,
      payments: []
    };

    if (!isCancelled) {
      const durationDays = isLongStay ? 90 : 5; // 3 months or 5 days
      const end = new Date(start.getTime() + (durationDays * 86400000));
      rentObj.rentalEndTime = end;
      
      if (isLongStay) {
        rentObj.paidUntil = end;
        rentObj.paymentReminderDate = start.getDate();
        rentObj.payments.push({ amount: rt.price * 3, date: start, receiptId: `RCPT-${Math.random().toString(36).substring(2, 9).toUpperCase()}` });
      } else {
        rentObj.expectedReturnDate = end;
        rentObj.payments.push({ amount: rt.price, date: start, receiptId: `RCPT-${Math.random().toString(36).substring(2, 9).toUpperCase()}` });
      }
    }
    
    rentals.push(rentObj);
  }

  // Randomly set some available rooms to Maintenance/Cleaning
  for (let room of insertedRooms) {
    if (!occupiedRoomIds.has(room._id.toString())) {
       const rand = Math.random();
       if (rand < 0.1) await Room.findByIdAndUpdate(room._id, { status: 'Cleaning' });
       else if (rand < 0.2) await Room.findByIdAndUpdate(room._id, { status: 'Maintenance' });
    }
  }

  await RentalTransaction.insertMany(rentals);
  console.log('Kosan Demo Data Successfully Seeded!');
};
