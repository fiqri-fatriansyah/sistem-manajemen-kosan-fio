import mongoose from 'mongoose';
import RentalTransaction from './src/models/RentalTransaction';
import Room from './src/models/Room';
import RoomType from './src/models/RoomType';
import Customer from './src/models/Customer';
import { connectDB } from './src/index';
import { getDemoState } from './src/utils/demoState';

const testPayments = async () => {
  await connectDB();
  
  // cleanup first
  await Room.deleteMany({ roomNumber: { $in: ['T1', 'T2', 'T3', 'T4', 'T5'] } });
  await RoomType.deleteMany({ name: 'Test Type' });
  await Customer.deleteMany({ name: 'Test Cust' });
  
  const rt = await RoomType.create({ name: 'Test Type', features: [], price: 1000000, priceDaily: 300000 });
  const cust = await Customer.create({ name: 'Test Cust', telephone: '0812' });

  console.log('\n--- 1. NO PAYMENT (LONG-STAY) ---');
  const room1 = await Room.create({ roomNumber: 'T1', roomTypeId: rt._id, features: [], status: 'Available' });
  let res1 = await fetch('http://localhost:3001/api/rentals', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ customerIds: [cust._id], roomId: room1._id, rentalType: 'Long-Stay', rentalStartTime: new Date(), initialPayment: 0 })
  });
  let rent1 = await res1.json();
  console.log(`Expected: Status=Booked, PaidUntil=undefined, DepositPaid=false`);
  console.log(`Actual:   Status=${rent1.status}, PaidUntil=${rent1.paidUntil}, DepositPaid=${rent1.depositPaid}`);

  console.log('\n--- 2. PARTIAL PAYMENT (LONG-STAY) ---');
  const room2 = await Room.create({ roomNumber: 'T2', roomTypeId: rt._id, features: [], status: 'Available' });
  let res2 = await fetch('http://localhost:3001/api/rentals', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ customerIds: [cust._id], roomId: room2._id, rentalType: 'Long-Stay', rentalStartTime: new Date(), initialPayment: 400000 })
  });
  let rent2 = await res2.json();
  console.log(`Initial Expected: Status=Booked, PaidUntil=undefined, DepositPaid=false`);
  console.log(`Initial Actual:   Status=${rent2.status}, PaidUntil=${rent2.paidUntil}, DepositPaid=${rent2.depositPaid}`);
  
  let pay2 = await fetch(`http://localhost:3001/api/rentals/${rent2._id}/pay`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ amount: 600000 })
  });
  rent2 = await pay2.json();
  console.log(`After 600k Expected: Status=Active, PaidUntil=+1 Month, DepositPaid=true`);
  console.log(`After 600k Actual:   Status=${rent2.status}, PaidUntil=${rent2.paidUntil}, DepositPaid=${rent2.depositPaid}`);

  console.log('\n--- 3. CORRECT PAYMENT (LONG-STAY) ---');
  const room3 = await Room.create({ roomNumber: 'T3', roomTypeId: rt._id, features: [], status: 'Available' });
  let res3 = await fetch('http://localhost:3001/api/rentals', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ customerIds: [cust._id], roomId: room3._id, rentalType: 'Long-Stay', rentalStartTime: new Date(), initialPayment: 1000000 })
  });
  let rent3 = await res3.json();
  console.log(`Expected: Status=Active, PaidUntil=+1 Month, DepositPaid=true`);
  console.log(`Actual:   Status=${rent3.status}, PaidUntil=${rent3.paidUntil}, DepositPaid=${rent3.depositPaid}`);

  console.log('\n--- 4. ADVANCED PAYMENT (LONG-STAY, 3 MONTHS) ---');
  const room4 = await Room.create({ roomNumber: 'T4', roomTypeId: rt._id, features: [], status: 'Available' });
  let res4 = await fetch('http://localhost:3001/api/rentals', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ customerIds: [cust._id], roomId: room4._id, rentalType: 'Long-Stay', rentalStartTime: new Date(), initialPayment: 3000000 })
  });
  let rent4 = await res4.json();
  console.log(`Expected: Status=Active, PaidUntil=+3 Months, DepositPaid=true`);
  console.log(`Actual:   Status=${rent4.status}, PaidUntil=${rent4.paidUntil}, DepositPaid=${rent4.depositPaid}`);

  console.log('\n--- 5. ONE-TIME PARTIAL DP ---');
  const room5 = await Room.create({ roomNumber: 'T5', roomTypeId: rt._id, features: [], status: 'Available' });
  let future = new Date(); future.setDate(future.getDate() + 3);
  let res5 = await fetch('http://localhost:3001/api/rentals', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ customerIds: [cust._id], roomId: room5._id, rentalType: 'One-Time', rentalStartTime: new Date(), expectedReturnDate: future, initialPayment: 200000 })
  });
  let rent5 = await res5.json();
  console.log(`Expected: Status=Booked, DepositPaid=false`);
  console.log(`Actual:   Status=${rent5.status}, DepositPaid=${rent5.depositPaid}`);
  
  let pay5 = await fetch(`http://localhost:3001/api/rentals/${rent5._id}/pay`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ amount: 700000 })
  });
  rent5 = await pay5.json();
  console.log(`After 700k Expected: Status=Active, DepositPaid=true`);
  console.log(`After 700k Actual:   Status=${rent5.status}, DepositPaid=${rent5.depositPaid}`);

  await mongoose.disconnect();
};

testPayments().then(() => {
  console.log('--- ALL TESTS COMPLETED ---');
  process.exit(0);
}).catch(err => {
  console.error(err);
  process.exit(1);
});
