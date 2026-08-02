const mongoose = require('../backend/node_modules/mongoose');
require('../backend/node_modules/dotenv').config({ path: './backend/.env' });

async function runSuite() {
  console.log('--- STARTING KOSAN FIO TEST SUITE ---');
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
    // 1. SETUP: Create Room Type, Room, and Customer
    console.log('\n--- SETUP PHASE ---');
    
    // Create Room Type
    const uniqueSuffix = Date.now().toString();
    const typeData = new FormData();
    typeData.append('name', 'Test Suite Type ' + uniqueSuffix);
    typeData.append('price', '1500000');
    typeData.append('priceDaily', '150000');
    
    const res1 = await fetch(`${API}/rooms/types`, { method: 'POST', body: typeData });
    const res1Text = await res1.text();
    if (!res1.ok) {
      console.error('Room Type Creation failed:', res1Text);
    }
    assert(res1.ok, 'Room Type created successfully');
    const roomType = JSON.parse(res1Text);
    assert(roomType.name.includes('Test Suite Type'), 'Room Type data matches');

    // Create Room
    const roomData = new FormData();
    roomData.append('roomNumber', 'TEST-' + uniqueSuffix);
    roomData.append('roomTypeId', roomType._id);
    roomData.append('status', 'Available');
    
    const res2 = await fetch(`${API}/rooms`, { method: 'POST', body: roomData });
    assert(res2.ok, 'Room created successfully');
    const room = await res2.json();
    assert(room.roomNumber.includes('TEST-'), 'Room number matches');

    // Create Customer
    const res3 = await fetch(`${API}/customers`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Suite Tester ' + uniqueSuffix, telephone: '08123456789' })
    });
    assert(res3.ok, 'Customer created successfully');
    const customer = await res3.json();

    // 2. LONG-STAY FLOW: DP, Lunas, Check-in, End-stay
    console.log('\n--- E2E LONG-STAY FLOW ---');
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);

    const res4 = await fetch(`${API}/rentals`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customerIds: [customer._id],
        roomId: room._id,
        rentalType: 'Long-Stay',
        rentalStartTime: tomorrow.toISOString(),
        initialPayment: 500000
      })
    });
    assert(res4.ok, 'Long-Stay rental created successfully');
    const rental = await res4.json();
    assert(rental.uiStatus === 'Booked', 'Initial long-stay status is Booked');
    assert(rental.currentStatusText.includes('DP Parsial'), 'Status text reflects partial DP');
    
    // Verify room is still available despite booking (future date)
    const res5 = await fetch(`${API}/rooms`);
    const allRooms = await res5.json();
    const checkedRoom = allRooms.find(r => r._id === room._id);
    assert(checkedRoom.status === 'Available', 'Room remains Available for future bookings');

    // Pay remaining DP (Rp 1.000.000)
    const res6 = await fetch(`${API}/rentals/${rental._id}/pay`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount: 1000000 })
    });
    assert(res6.ok, 'Final DP paid successfully');
    const paidRental = await res6.json();
    assert(paidRental.currentStatusText.includes('Lunas'), 'Rental status reflects Lunas DP');

    // Check-in (Manual check-in is required in the backend logic when date arrives, or forced)
    const res7 = await fetch(`${API}/rentals/${rental._id}/check-in`, { method: 'POST' });
    assert(res7.ok, 'Check-in processed successfully');
    const activeRental = await res7.json();
    assert(activeRental.uiStatus === 'Active', 'Rental is now Active');

    // End Stay
    const res8 = await fetch(`${API}/rentals/${rental._id}/end-stay`, { method: 'POST' });
    assert(res8.ok, 'End-stay processed successfully');
    const endedRental = await res8.json();
    assert(endedRental.status === 'Completed', 'Rental status transitioned to Completed');

    // 3. EDGE CASES: Overlap Protection & Harian Overpay
    console.log('\n--- EDGE CASES ---');
    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);
    const nextMonth = new Date();
    nextMonth.setDate(nextMonth.getDate() + 37);

    // Create No-DP Future Booking
    const res9 = await fetch(`${API}/rentals`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customerIds: [customer._id],
        roomId: room._id,
        rentalType: 'Long-Stay',
        rentalStartTime: nextWeek.toISOString(),
        initialPayment: 0
      })
    });
    assert(res9.ok, 'No-DP future booking created');
    const noDpRental = await res9.json();

    // Create Overlapping DP Booking (should auto-cancel the No-DP one)
    const res10 = await fetch(`${API}/rentals`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customerIds: [customer._id],
        roomId: room._id,
        rentalType: 'Long-Stay',
        rentalStartTime: nextWeek.toISOString(),
        initialPayment: 1500000
      })
    });
    assert(res10.ok, 'DP booking created over a No-DP booking successfully');
    const dpRental = await res10.json();
    
    // Check if No-DP is cancelled
    const res11 = await fetch(`${API}/rentals/`);
    const allRentals = await res11.json();
    const cancelledNoDp = allRentals.find(r => r._id === noDpRental._id);
    assert(cancelledNoDp.status === 'Cancelled', 'No-DP booking was auto-cancelled by a paid booking');

    // Attempt to overwrite the DP booking
    const res12 = await fetch(`${API}/rentals`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customerIds: [customer._id],
        roomId: room._id,
        rentalType: 'Long-Stay',
        rentalStartTime: nextWeek.toISOString(),
        initialPayment: 2000000
      })
    });
    assert(res12.status === 400, 'Attempting to overwrite a DP booking is rejected');

    // Clean up DP booking
    await fetch(`${API}/rentals/${dpRental._id}/cancel`, { method: 'POST' });

    // Harian Overpay
    const res13 = await fetch(`${API}/rentals`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customerIds: [customer._id],
        roomId: room._id,
        rentalType: 'One-Time',
        rentalStartTime: new Date().toISOString(),
        expectedReturnDate: tomorrow.toISOString(), // 1 day
        initialPayment: 500000 // Price is 150000, so this is overpay
      })
    });
    assert(res13.status === 400, 'Harian overpayment is properly blocked by the API');

    // 4. DASHBOARD METRICS
    console.log('\n--- DASHBOARD METRICS ---');
    const res14 = await fetch(`${API}/dashboard/stats`);
    assert(res14.ok, 'Dashboard stats retrieved');
    const stats = await res14.json();
    assert(stats.metrics.totalPendapatanBulanIni !== undefined, 'Dashboard returns totalPendapatanBulanIni');
    assert(stats.metrics.kamarKosong !== undefined, 'Dashboard returns kamarKosong');
    assert(stats.metrics.tingkatHunian !== undefined, 'Dashboard returns tingkatHunian');

    // MONGODB NATIVE CLEANUP
    console.log('\n--- CLEANING UP TEST DATA ---');
    await mongoose.connect(process.env.MONGODB_URI);
    const db = mongoose.connection.db;
    
    await db.collection('rentaltransactions').deleteMany({ customerIds: customer._id });
    await db.collection('customers').deleteOne({ _id: new mongoose.Types.ObjectId(customer._id) });
    await db.collection('rooms').deleteOne({ _id: new mongoose.Types.ObjectId(room._id) });
    await db.collection('roomtypes').deleteOne({ _id: new mongoose.Types.ObjectId(roomType._id) });
    
    await mongoose.connection.close();
    console.log('✅ PASS: Database test data wiped cleanly.');
    
  } catch (err) {
    console.error('❌ FATAL ERROR IN TESTS:', err);
    failures++;
  }

  console.log('\n--- TEST RUN COMPLETE ---');
  if (failures > 0) {
    console.error(`💥 ${failures} tests failed.`);
    process.exit(1);
  } else {
    console.log('✨ All tests passed successfully!');
    process.exit(0);
  }
}

runSuite();
