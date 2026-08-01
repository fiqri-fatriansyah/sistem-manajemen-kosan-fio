const fs = require('fs');
const mongoose = require('../backend/node_modules/mongoose');
require('../backend/node_modules/dotenv').config({ path: './backend/.env' });

async function runTests() {
  console.log('--- STARTING E2E TESTS ---');
  let failures = 0;
  
  const assert = (condition, msg) => {
    if (!condition) {
      console.error('❌ FAIL:', msg);
      failures++;
    } else {
      console.log('✅ PASS:', msg);
    }
  };

  const API = 'http://localhost:3001/api';

  try {
    // 1. Room CRUD
    const kebayaData = new FormData();
    kebayaData.append('tipeKamar', 'Test Room E2E');
    kebayaData.append('fasilitas', 'Merah');
    kebayaData.append('price', '150000');
    kebayaData.append('totalStock', '5');
    kebayaData.append('availableStock', '5');

    const res1 = await fetch(`${API}/rooms`, { method: 'POST', body: kebayaData });
    assert(res1.ok, 'Room created successfully');
    const room = await res1.json();
    assert(room.tipeKamar === 'Test Room E2E', 'Room data matches');

    // 2. Customer CRUD
    const res2 = await fetch(`${API}/customers`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'E2E Tester', telephone: '08123456789' })
    });
    assert(res2.ok, 'Customer created successfully');
    const customer = await res2.json();

    // 3. Rental Lifecycle
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);

    const res3 = await fetch(`${API}/rentals`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customerId: customer._id,
        roomId: room._id,
        expectedReturnDate: tomorrow.toISOString(),
        depositAmount: 50000,
        depositPaid: false
      })
    });
    assert(res3.ok, 'Rental created successfully');
    const rental = await res3.json();
    assert(rental.status === 'Booked', 'Initial rental status is Booked');

    // Partial Pay Deposit (Rp 20.000)
    const res4a = await fetch(`${API}/rentals/${rental._id}/pay-deposit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount: 20000 })
    });
    assert(res4a.ok, 'Partial deposit paid successfully');
    const partialRental = await res4a.json();
    assert(partialRental.depositPaid === false, 'Deposit is still marked unpaid after partial payment');
    assert(partialRental.status === 'Booked', 'Rental status remains Booked after partial payment');

    // Final Pay Deposit (Rp 130.000) to make it 150000
    const res4 = await fetch(`${API}/rentals/${rental._id}/pay-deposit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount: 130000 })
    });
    assert(res4.ok, 'Final deposit paid successfully');
    const paidRental = await res4.json();
    assert(paidRental.depositPaid === true, 'Deposit is marked paid');
    assert(paidRental.status === 'Ready', 'Rental status transitioned to Ready');

    // Pickup
    const res5 = await fetch(`${API}/rentals/${rental._id}/pickup`, { method: 'POST' });
    assert(res5.ok, 'Pickup processed successfully');
    const pickedRental = await res5.json();
    assert(pickedRental.status === 'Active', 'Rental status transitioned to Active');

    // Verify Room Stock after Pickup
    const res6 = await fetch(`${API}/rooms`);
    const allRooms = await res6.json();
    const updatedKebaya = allRooms.find(k => k._id === room._id);
    assert(updatedKebaya.availableStock === 4, 'Room available stock dropped by 1 after pickup');

    // Return
    const res7 = await fetch(`${API}/rentals/${rental._id}/return`, { method: 'POST' });
    assert(res7.ok, 'Return processed successfully');
    
    // Verify Room Stock after Return
    const res8 = await fetch(`${API}/rooms`);
    const allRooms2 = await res8.json();
    const finalKebaya = allRooms2.find(k => k._id === room._id);
    assert(finalKebaya.availableStock === 5, 'Room available stock restored after return');

    // 4. Laundry Transfer
    const res9 = await fetch(`${API}/rooms/${room._id}/transfer-stock`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ from: 'available', to: 'laundry', amount: 2 })
    });
    assert(res9.ok, 'Transferred 2 stock to laundry');
    const transferRes = await res9.json();
    assert(transferRes.availableStock === 3 && transferRes.cleaningStock === 2, 'Stock maths correct for laundry transfer');

    // 5. PDF generation check
    const res10 = await fetch(`${API}/receipts/Deposit/${rental.transactionId}`);
    assert(res10.ok, 'PDF generation endpoint returned OK');
    const pdfBuf = await res10.arrayBuffer();
    assert(pdfBuf.byteLength > 1000, 'PDF buffer contains data');

    // MONGODB NATIVE CLEANUP (since no DELETE endpoints exist for safety)
    console.log('--- CLEANING UP TEST DATA ---');
    await mongoose.connect(process.env.MONGODB_URI);
    const db = mongoose.connection.db;
    await db.collection('rentaltransactions').deleteOne({ _id: new mongoose.Types.ObjectId(rental._id) });
    await db.collection('customers').deleteOne({ _id: new mongoose.Types.ObjectId(customer._id) });
    await db.collection('rooms').deleteOne({ _id: new mongoose.Types.ObjectId(room._id) });
    await mongoose.connection.close();
    console.log('✅ PASS: Database test data wiped cleanly.');
    
  } catch (err) {
    console.error('❌ FATAL ERROR IN TESTS:', err);
    failures++;
  }

  console.log('--- TEST RUN COMPLETE ---');
  if (failures > 0) {
    console.error(`💥 ${failures} tests failed.`);
    process.exit(1);
  } else {
    console.log('✨ All tests passed successfully!');
    process.exit(0);
  }
}

runTests();
