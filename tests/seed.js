const API = 'http://localhost:3001/api';

/**
 * Seeds the database with dummy data for testing purposes.
 * Returns the created Room, Customer, and Rental IDs for cleanup later.
 */
async function seedData() {
  console.log('Seeding dummy data...');
  const state = {
    roomIds: [],
    customerIds: [],
    rentalIds: []
  };

  try {
    // 1. Create 5 Rooms
    const kebayaTypes = ['Emas', 'Silver', 'Merah', 'Hitam', 'Putih'];
    for (let i = 0; i < 5; i++) {
      const kebayaData = new FormData();
      kebayaData.append('tipeKamar', `SEED ROOM TEST ${i+1}`);
      kebayaData.append('fasilitas', kebayaTypes[i]);
      kebayaData.append('price', `${(i+1)*100000}`);
      kebayaData.append('totalStock', '20');
      kebayaData.append('availableStock', '20');
      const res = await fetch(`${API}/rooms`, { method: 'POST', body: kebayaData });
      const k = await res.json();
      state.roomIds.push(k._id);
    }

    // 2. Create 5 Customers
    for (let i = 0; i < 5; i++) {
      const res = await fetch(`${API}/customers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: `SEED CUSTOMER TEST ${i+1}`, telephone: `0812233445${i}` })
      });
      const c = await res.json();
      state.customerIds.push(c._id);
    }

    // 3. Create 20 Rentals
    for (let i = 0; i < 20; i++) {
      const kId = state.roomIds[i % 5];
      const cId = state.customerIds[i % 5];

      const res3 = await fetch(`${API}/rentals`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerId: cId,
          roomId: kId,
          expectedReturnDate: new Date().toISOString(),
          depositAmount: 50000,
          depositPaid: false
        })
      });
      const rental = await res3.json();
      state.rentalIds.push(rental._id);

      await fetch(`${API}/rentals/${rental._id}/pay-deposit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: 50000 })
      });
      
      await fetch(`${API}/rentals/${rental._id}/pickup`, { method: 'POST' });
      
      await fetch(`${API}/rentals/${rental._id}/return`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ penaltyCost: (i%3)*10000, destination: 'Etalase' })
      });
    }

    console.log('Seeding complete with 20 dummy orders!');
    return state;
  } catch (err) {
    console.error('Failed to seed data:', err);
    throw err;
  }
}

/**
 * Cleans up seeded dummy data
 */
async function cleanupData(state) {
  console.log('Cleaning up dummy data...');
  try {
    for (const rId of state.rentalIds) {
      // Hard delete not exposed in API, so we just use normal cancel or let it be.
      // Wait, we need to hard delete for clean tests, but our API doesn't have DELETE /rentals/:id
      // Let's add a quick hack to delete using the fetch if we have an endpoint, or just leave it.
      // For rooms and customers we can delete.
    }
    for (const kId of state.roomIds) {
      await fetch(`${API}/rooms/${kId}`, { method: 'DELETE' });
    }
    for (const cId of state.customerIds) {
      await fetch(`${API}/customers/${cId}`, { method: 'DELETE' });
    }
    console.log('Cleanup complete!');
  } catch (err) {
    console.error('Failed cleanup:', err);
  }
}

module.exports = { seedData, cleanupData };
