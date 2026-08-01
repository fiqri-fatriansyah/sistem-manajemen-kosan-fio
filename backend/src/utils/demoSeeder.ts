import Room from '../models/Room';
import Customer from '../models/Customer';
import RentalTransaction from '../models/RentalTransaction';

export const generateAdvancedSeed = async () => {
  console.log('Generating Advanced Demo Data...');

  // 1. Rooms
  const rooms = [
    { tipeKamar: 'Tipe VIP (AC + Kamar Mandi Dalam)', fasilitas: 'AC, WiFi, Water Heater, Kasur Queen', price: 2500000, totalStock: 10, availableStock: 6, cleaningStock: 2, maintenanceStock: 2, conditions: { 'Sangat Baik': 8, 'Baik': 2, 'Rusak Ringan': 0 }, imageUrl: '/img/kosan_background.jpg' },
    { tipeKamar: 'Tipe A (AC)', fasilitas: 'AC, WiFi, Kamar Mandi Dalam, Kasur Single', price: 1800000, totalStock: 15, availableStock: 10, cleaningStock: 3, maintenanceStock: 2, conditions: { 'Sangat Baik': 10, 'Baik': 5, 'Rusak Ringan': 0 }, imageUrl: '/img/kosan_background.jpg' },
    { tipeKamar: 'Tipe B (Non-AC)', fasilitas: 'Kipas Angin, WiFi, Kamar Mandi Dalam', price: 1200000, totalStock: 15, availableStock: 12, cleaningStock: 2, maintenanceStock: 1, conditions: { 'Sangat Baik': 10, 'Baik': 3, 'Rusak Ringan': 2 }, imageUrl: '/img/kosan_background.jpg' },
    { tipeKamar: 'Tipe Ekonomi', fasilitas: 'Kamar Mandi Luar, Kipas Angin, Kasur Busa', price: 800000, totalStock: 20, availableStock: 18, cleaningStock: 2, maintenanceStock: 0, conditions: { 'Sangat Baik': 15, 'Baik': 3, 'Rusak Ringan': 2 }, imageUrl: '/img/kosan_background.jpg' },
    { tipeKamar: 'Tipe Eksklusif (Harian)', fasilitas: 'AC, TV, WiFi, Water Heater, Breakfast', price: 250000, totalStock: 5, availableStock: 3, cleaningStock: 1, maintenanceStock: 1, conditions: { 'Sangat Baik': 4, 'Baik': 1, 'Rusak Ringan': 0 }, imageUrl: '/img/kosan_background.jpg' },
  ];
  
  const insertedRooms = await Room.insertMany(rooms);

  // 2. Customers
  const customers = [
    { name: 'Siti Aminah', telephone: '081234567890', address: 'Jl. Merdeka No. 1, Jakarta', email: 'siti@example.com' },
    { name: 'Budi Santoso', telephone: '085678901234', address: 'Komp. Polri No. 5B', email: 'budi_s@example.com' },
    { name: 'Rina Wijaya', telephone: '082123123123', address: 'Apartemen Sudirman Lt 15', email: 'rina.w@example.com' },
    { name: 'Dewi Lestari', telephone: '081987654321', address: '', email: 'dewi.l@example.com' }, 
    { name: 'Agus Pratama', telephone: '087812345678', address: 'Jl. Kenangan No. 99', email: '' }, 
    { name: 'Maya Sari', telephone: '081112223334', address: 'Perumahan Elit Blok A1', email: 'maya.s@example.com' },
    { name: 'Putri Nurhaliza', telephone: '085544332211', address: '', email: '' }, // Completely empty optionals
    { name: 'Bagas Firmansyah', telephone: '089988776655', address: '', email: '' }  // Completely empty optionals
  ];

  const insertedCustomers = await Customer.insertMany(customers);

  // 3. Rentals (Variations in Dates, Prices, Payments, and Statuses)
  const rentals = [];
  const now = new Date();

  // 3a. Generate Historical Rentals (Completed & Cancelled)
  // We want to skew the data: some customers are highly loyal, some rooms are extremely popular.
  for (let i = 0; i < 40; i++) {
    let kIndex = 0;
    let cIndex = 0;
    
    // Weighted distribution for Room (Room 0 and 2 are very popular)
    const kRand = Math.random();
    if (kRand < 0.4) kIndex = 0;
    else if (kRand < 0.7) kIndex = 2;
    else if (kRand < 0.8) kIndex = 1;
    else if (kRand < 0.9) kIndex = 3;
    else kIndex = 4;

    // Weighted distribution for Customer (Customer 0 and 1 are extremely loyal)
    const cRand = Math.random();
    if (cRand < 0.35) cIndex = 0; // 35% chance
    else if (cRand < 0.6) cIndex = 1; // 25% chance
    else if (cRand < 0.75) cIndex = 2; 
    else if (cRand < 0.85) cIndex = 3;
    else if (cRand < 0.9) cIndex = 4;
    else if (cRand < 0.95) cIndex = 5;
    else cIndex = i % 2 === 0 ? 6 : 7; // Minimal usage for completely empty customers

    const k = insertedRooms[kIndex];
    const c = insertedCustomers[cIndex];
    
    // Spread dates over the last 11 months
    const monthOffset = i % 12; 
    const rentDate = new Date(now.getFullYear(), now.getMonth() - monthOffset, Math.floor(Math.random() * 28) + 1);
    const returnDate = new Date(rentDate.getTime() + (30 * 24 * 60 * 60 * 1000)); // 30 days later (1 month rent)
    
    // Payment variation (Historical)
    const depositAmount = k.price;
    const isPartial = i % 3 === 0;
    const payments = [];
    
    if (isPartial) {
      payments.push({ amount: depositAmount / 2, date: rentDate, receiptId: `RCPT-${Math.random().toString(36).substring(2, 9).toUpperCase()}` });
      payments.push({ amount: depositAmount / 2, date: new Date(rentDate.getTime() + 86400000), receiptId: `RCPT-${Math.random().toString(36).substring(2, 9).toUpperCase()}` });
    } else {
      payments.push({ amount: depositAmount, date: rentDate, receiptId: `RCPT-${Math.random().toString(36).substring(2, 9).toUpperCase()}` });
    }

    const isCancelled = i % 10 === 0; // 10% cancelled
    const penalty = (!isCancelled && i % 4 === 0) ? 50000 : 0;
    const amountToPay = isCancelled ? 0 : depositAmount + penalty;

    rentals.push({
      transactionId: `TRX-${Math.random().toString(36).substring(2, 9).toUpperCase()}`,
      customerId: c._id,
      roomId: k._id,
      rentalStartTime: rentDate,
      expectedReturnDate: returnDate,
      rentalEndTime: isCancelled ? rentDate : returnDate,
      depositAmount: isCancelled ? 0 : depositAmount,
      depositPaid: !isCancelled,
      payments: isCancelled ? [] : payments,
      status: isCancelled ? 'Cancelled' : 'Completed',
      penaltyCost: penalty,
      amountToPay: amountToPay,
      returnCondition: isCancelled ? '' : 'Baik',
      roomDestination: isCancelled ? '' : 'Etalase'
    });
  }

  // 3b. Generate Currently Active, Booked, and Ready Rentals
  // Active - Full Deposit
  rentals.push({
    transactionId: `TRX-${Math.random().toString(36).substring(2, 9).toUpperCase()}`,
    customerId: insertedCustomers[0]._id,
    roomId: insertedRooms[1]._id,
    rentalStartTime: new Date(now.getTime() - 15 * 86400000), // Rented 15 days ago
    expectedReturnDate: new Date(now.getTime() + 15 * 86400000), // Due in 15 days (1 month term)
    depositAmount: insertedRooms[1].price,
    depositPaid: true,
    payments: [{ amount: insertedRooms[1].price, date: new Date(now.getTime() - 1 * 86400000), receiptId: `RCPT-${Math.random().toString(36).substring(2, 9).toUpperCase()}` }],
    status: 'Active'
  });

  // Booked - Partial Deposit
  rentals.push({
    transactionId: `TRX-${Math.random().toString(36).substring(2, 9).toUpperCase()}`,
    customerId: insertedCustomers[2]._id,
    roomId: insertedRooms[3]._id,
    rentalStartTime: new Date(now.getTime() + 2 * 86400000), // Check in 2 days
    expectedReturnDate: new Date(now.getTime() + 32 * 86400000), // 30 days later
    depositAmount: insertedRooms[3].price,
    depositPaid: false,
    payments: [{ amount: insertedRooms[3].price / 2, date: now, receiptId: `RCPT-${Math.random().toString(36).substring(2, 9).toUpperCase()}` }],
    status: 'Booked'
  });

  // Active - LATE (Past expected return date)
  rentals.push({
    transactionId: `TRX-${Math.random().toString(36).substring(2, 9).toUpperCase()}`,
    customerId: insertedCustomers[5]._id,
    roomId: insertedRooms[2]._id,
    rentalStartTime: new Date(now.getTime() - 35 * 86400000), // Rented 35 days ago
    expectedReturnDate: new Date(now.getTime() - 5 * 86400000), // Due 5 days ago (Overdue)
    depositAmount: insertedRooms[2].price,
    depositPaid: true,
    payments: [{ amount: insertedRooms[2].price, date: new Date(now.getTime() - 5 * 86400000), receiptId: `RCPT-${Math.random().toString(36).substring(2, 9).toUpperCase()}` }],
    status: 'Active'
  });

  // Booked - Unpaid Deposit
  rentals.push({
    transactionId: `TRX-${Math.random().toString(36).substring(2, 9).toUpperCase()}`,
    customerId: insertedCustomers[1]._id,
    roomId: insertedRooms[4]._id,
    rentalStartTime: new Date(now.getTime() + 2 * 86400000), // To be picked up in 2 days
    expectedReturnDate: new Date(now.getTime() + 5 * 86400000),
    depositAmount: insertedRooms[4].price,
    depositPaid: false,
    payments: [],
    status: 'Booked'
  });

  // Ready - Prepared for pickup today
  rentals.push({
    transactionId: `TRX-${Math.random().toString(36).substring(2, 9).toUpperCase()}`,
    customerId: insertedCustomers[3]._id,
    roomId: insertedRooms[0]._id,
    rentalStartTime: now, // Pick up today
    expectedReturnDate: new Date(now.getTime() + 3 * 86400000),
    depositAmount: insertedRooms[0].price,
    depositPaid: true,
    payments: [{ amount: insertedRooms[0].price, date: now, receiptId: `RCPT-${Math.random().toString(36).substring(2, 9).toUpperCase()}` }],
    status: 'Ready'
  });

  // Active - Paid partially but has finished payment
  rentals.push({
    transactionId: `TRX-${Math.random().toString(36).substring(2, 9).toUpperCase()}`,
    customerId: insertedCustomers[4]._id,
    roomId: insertedRooms[2]._id,
    rentalStartTime: new Date(now.getTime() - 2 * 86400000),
    expectedReturnDate: new Date(now.getTime() + 1 * 86400000),
    depositAmount: insertedRooms[2].price,
    depositPaid: true,
    payments: [
      { amount: insertedRooms[2].price / 2, date: new Date(now.getTime() - 4 * 86400000), receiptId: `RCPT-${Math.random().toString(36).substring(2, 9).toUpperCase()}` },
      { amount: insertedRooms[2].price / 2, date: new Date(now.getTime() - 2 * 86400000), receiptId: `RCPT-${Math.random().toString(36).substring(2, 9).toUpperCase()}` }
    ],
    status: 'Active'
  });

  await RentalTransaction.insertMany(rentals);
  console.log('Advanced Demo Data Successfully Seeded!');
};
