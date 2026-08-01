const mongoose = require('./node_modules/mongoose');

mongoose.connect('mongodb://localhost:27017/room-Fio').then(async () => {
  const db = mongoose.connection.db;
  const rentalsColl = db.collection('rentaltransactions');
  const custColl = db.collection('customers');
  const kebayaColl = db.collection('rooms');

  // Find the bad customers
  const badCusts = await custColl.find({ name: { $in: ['E2E Tester', 'Edge Case Tester', 'T'] } }).toArray();
  const badCustIds = badCusts.map(c => c._id);
  
  // Also just find ALL rentals with Customer E2E Tester or null room
  const allRentals = await rentalsColl.find().toArray();
  const allRooms = await kebayaColl.find().toArray();
  const validKebayaIds = allRooms.map(k => k._id.toString());
  
  let deletedCount = 0;
  for (let r of allRentals) {
    if (!r.kebayaId || !validKebayaIds.includes(r.kebayaId.toString()) || badCustIds.some(id => id.toString() === r.customerId.toString())) {
      await rentalsColl.deleteOne({ _id: r._id });
      deletedCount++;
    }
  }

  // Then delete the bad customers and rooms
  const cRes = await custColl.deleteMany({ name: { $in: ['E2E Tester', 'Edge Case Tester', 'T'] } });
  const kRes = await kebayaColl.deleteMany({ tipeKamar: { $in: ['Test Room E2E', 'Edge Case Room', 'T'] } });

  console.log('Deleted orphaned rentals:', deletedCount);
  console.log('Deleted customers:', cRes.deletedCount);
  console.log('Deleted rooms:', kRes.deletedCount);
  process.exit(0);
});
