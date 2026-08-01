import { calculateRentalFinancials } from './src/routes/rentals';

const test = () => {
  const rental = {
    rentalType: 'Long-Stay',
    status: 'Booked',
    rentalStartTime: new Date('2026-08-01T00:00:00Z'),
    paidUntil: new Date('2026-08-01T00:00:00Z'),
    payments: [
      { amount: 400000 }
    ],
    roomId: {
      roomTypeId: { price: 1000000 }
    },
    toObject: () => rental
  };
  
  console.log("INITIAL:", calculateRentalFinancials(rental));
  
  rental.payments.push({ amount: 600000 });
  console.log("AFTER 600k:", calculateRentalFinancials(rental));
};
test();
