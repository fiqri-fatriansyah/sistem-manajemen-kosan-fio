import mongoose from 'mongoose';
import RentalTransaction from './src/models/RentalTransaction';
import Room from './src/models/Room';
import RoomType from './src/models/RoomType';
import Customer from './src/models/Customer';
import { connectDB } from './src/index';

const testPayments = async () => {
  await connectDB();
  
  // Create dummy data
  const rt = await RoomType.create({ name: 'Test Type', features: [], price: 1000000 });
  const room = await Room.create({ roomNumber: 'T1', roomTypeId: rt._id, features: [], status: 'Available' });
  const cust = await Customer.create({ name: 'Test Cust', telephone: '0812' });

  console.log('--- TEST 1: LONG-STAY PARTIAL PAYMENT ---');
  // Scenario: Rental starts today, price 1,000,000. Customer pays 400,000.
  let res = await fetch('http://localhost:3001/api/rentals', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      customerIds: [cust._id],
      roomId: room._id,
      rentalType: 'Long-Stay',
      rentalStartTime: new Date(),
      initialPayment: 400000
    })
  });
  let rental = await res.json();
  console.log('Created Long-Stay Partial (400k):', rental.status, '| Paid Until:', rental.paidUntil);
  
  // Pay another 600,000 to complete the month
  let res2 = await fetch(`http://localhost:3001/api/rentals/${rental._id}/pay`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ amount: 600000 })
  });
  rental = await res2.json();
  console.log('Paid 600k more. Status:', rental.status, '| Paid Until:', rental.paidUntil);

  console.log('\n--- TEST 2: ONE-TIME PARTIAL PAYMENT ---');
  // Scenario: Rental 3 days, expected 300,000. Customer pays 100,000.
  const r3 = await Room.create({ roomNumber: 'T2', roomTypeId: rt._id, features: [], status: 'Available' });
  const future = new Date(); future.setDate(future.getDate() + 3);
  let res3 = await fetch('http://localhost:3001/api/rentals', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      customerIds: [cust._id],
      roomId: r3._id,
      rentalType: 'One-Time',
      rentalStartTime: new Date(),
      expectedReturnDate: future,
      initialPayment: 100000
    })
  });
  let rental2 = await res3.json();
  console.log('Created One-Time Partial (100k DP). Status:', rental2.status, 'Deposit Paid:', rental2.depositPaid);

  let res4 = await fetch(`http://localhost:3001/api/rentals/${rental2._id}/pay`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ amount: 900000 }) // Complete the 1M
  });
  rental2 = await res4.json();
  console.log('Paid 900k more. Status:', rental2.status, 'Deposit Paid:', rental2.depositPaid);

  await mongoose.disconnect();
};

testPayments().catch(console.error);
