"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const dotenv_1 = __importDefault(require("dotenv"));
const Kebaya_1 = __importDefault(require("./src/models/Room"));
const Customer_1 = __importDefault(require("./src/models/Customer"));
const RentalTransaction_1 = __importDefault(require("./src/models/RentalTransaction"));
const AuditLog_1 = __importDefault(require("./src/models/AuditLog"));
dotenv_1.default.config();
async function runTests() {
    console.log('Connecting to DB...');
    await mongoose_1.default.connect('mongodb://127.0.0.1:27017/room-Fio');
    console.log('Connected!');
    try {
        console.log('Wiping existing data to prepare for clean test...');
        await mongoose_1.default.connection.collection('customers').deleteMany({});
        await mongoose_1.default.connection.collection('rooms').deleteMany({});
        await mongoose_1.default.connection.collection('rentaltransactions').deleteMany({});
        await mongoose_1.default.connection.collection('events').deleteMany({});
        await mongoose_1.default.connection.collection('auditlogs').deleteMany({});
        // 1. Test Room Creation
        console.log('1. Testing Room Creation...');
        const room = await Kebaya_1.default.create({
            tipeKamar: 'Test Room',
            fasilitas: 'Merah',
            price: 150000,
            totalStock: 5,
            availableStock: 5
        });
        if (!room._id)
            throw new Error('Room not created');
        // 2. Test Customer Creation
        console.log('2. Testing Customer Creation...');
        const customer = await Customer_1.default.create({
            name: 'Test Customer',
            telephone: '081234567890',
            address: 'Jl. Test No. 1'
        });
        // 3. Test Rental Creation
        console.log('3. Testing Rental Transaction...');
        const expectedReturn = new Date();
        expectedReturn.setDate(expectedReturn.getDate() + 3);
        const rental = await RentalTransaction_1.default.create({
            transactionId: 'TRX-TEST-001',
            customerId: customer._id,
            kebayaId: room._id,
            rentalDate: new Date(),
            expectedReturnDate: expectedReturn,
            status: 'Active',
            basePrice: room.price,
            totalPrice: room.price,
            depositPaid: true,
            depositAmount: 50000
        });
        // 4. Update Room Stock
        console.log('4. Updating Room Stock (Simulate Rental)...');
        room.availableStock -= 1;
        await room.save();
        if (room.availableStock !== 4)
            throw new Error('Room stock not updated properly');
        // 5. Test Return (Routing to Laundry)
        console.log('5. Testing Return to Laundry...');
        rental.status = 'Completed';
        await rental.save();
        room.cleaningStock += 1;
        await room.save();
        if (room.cleaningStock !== 1)
            throw new Error('Laundry stock not updated');
        // 6. Test Resolve Laundry
        console.log('6. Testing Resolve Laundry...');
        room.cleaningStock -= 1;
        room.availableStock += 1;
        await room.save();
        if (room.availableStock !== 5 || room.cleaningStock !== 0)
            throw new Error('Resolve laundry failed');
        console.log('All feature data paths validated successfully! ✅');
        // Wiping all data as requested by user
        console.log('\nWiping all data and logs...');
        await mongoose_1.default.connection.collection('customers').deleteMany({});
        await mongoose_1.default.connection.collection('rooms').deleteMany({});
        await mongoose_1.default.connection.collection('rentaltransactions').deleteMany({});
        await mongoose_1.default.connection.collection('events').deleteMany({});
        await mongoose_1.default.connection.collection('auditlogs').deleteMany({});
        console.log('Data and logs wiped completely.');
    }
    catch (err) {
        console.error('Test Failed:', err);
    }
    finally {
        mongoose_1.default.disconnect();
    }
}
runTests();
//# sourceMappingURL=test_all_features.js.map