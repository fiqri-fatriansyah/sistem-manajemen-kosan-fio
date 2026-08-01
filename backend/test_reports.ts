import fetch from 'node-fetch';
import fs from 'fs';
import mongoose from 'mongoose';
import RentalTransaction from './src/models/RentalTransaction';
// No import from index to avoid EADDRINUSE

const testReports = async () => {
  let transactionId = null;
  try {
    const res = await fetch('http://localhost:3001/api/rentals');
    const rentals = await res.json();
    if (rentals && rentals.length > 0) {
      transactionId = rentals[0].transactionId;
    }
  } catch (err) {
    console.error('Failed to fetch rentals from API', err);
  }

  if (!transactionId) {
    console.log('WARNING: No rentals found in database! Some receipt tests might fail.');
  } else {
    console.log(`Found transaction ID to test receipt: ${transactionId}`);
  }

  const endpoints = [
    { name: 'Renting Report (PDF)', url: 'http://localhost:3001/api/reports/renting?format=pdf' },
    { name: 'Renting Report (Word)', url: 'http://localhost:3001/api/reports/renting?format=word' },
    { name: 'Renting Report (Excel)', url: 'http://localhost:3001/api/reports/renting' },
    { name: 'Financial Report (PDF)', url: 'http://localhost:3001/api/reports/financial?format=pdf' },
    { name: 'Financial Report (Word)', url: 'http://localhost:3001/api/reports/financial?format=word' },
    { name: 'Financial Report (Excel)', url: 'http://localhost:3001/api/reports/financial' }
  ];

  if (transactionId) {
    endpoints.push({ name: 'Payment Receipt (PDF)', url: `http://localhost:3001/api/receipts/Payment/${transactionId}` });
  }

  for (const ep of endpoints) {
    console.log(`\nTesting: ${ep.name}`);
    console.log(`URL: ${ep.url}`);
    
    try {
      const res = await fetch(ep.url);
      console.log(`Status: ${res.status} ${res.statusText}`);
      
      if (!res.ok) {
        const text = await res.text();
        console.error(`ERROR Response: ${text}`);
      } else {
        const buffer = await res.buffer();
        console.log(`Success! File size: ${buffer.length} bytes`);
        if (buffer.length === 0) {
          console.error(`ERROR: File is empty (0 bytes)!`);
        }
      }
    } catch (err) {
      console.error(`Fetch failed: ${err}`);
    }
  }

  console.log('\n--- REPORT TESTING COMPLETED ---');
  process.exit(0);
};

testReports().catch(err => {
  console.error(err);
  process.exit(1);
});
