const mongoose = require('./backend/node_modules/mongoose');
require('dotenv').config({path: './backend/.env'});

mongoose.connect(process.env.MONGODB_URI).then(async () => {
  const RentalTransaction = mongoose.model('RentalTransaction', new mongoose.Schema({}, {strict: false}));
  const Customer = mongoose.model('Customer', new mongoose.Schema({}, {strict: false}));
  const Room = mongoose.model('Room', new mongoose.Schema({}, {strict: false}));

  const resCust = await Customer.deleteMany({ name: { $in: ['E2E Tester', 'Edge Case Tester', 'T'] } });
  const resKeb = await Room.deleteMany({ tipeKamar: { $in: ['Test Room E2E', 'Edge Case Room', 'T'] } });
  
  const allRentals = await RentalTransaction.find();
  const validRooms = await Room.find().distinct('_id');
  const validKebayaIds = validRooms.map(id => id.toString());
  
  let deletedRentals = 0;
  for (let r of allRentals) {
    if (!r.kebayaId || !validKebayaIds.includes(r.kebayaId.toString())) {
      await RentalTransaction.findByIdAndDelete(r._id);
      deletedRentals++;
    }
  }

  console.log('Deleted Customers:', resCust.deletedCount);
  console.log('Deleted Rooms:', resKeb.deletedCount);
  console.log('Deleted Orphaned Rentals:', deletedRentals);
  process.exit(0);
});
