# Sistem Inventarisasi Kosan Fio

## Overview
This system is designed to manage the inventory and rentals of "Kosan Fio".
It is built using the MEVN stack (MongoDB, Express.js, Vue 3 / Nuxt 4, Node.js) with TypeScript.

## Architecture
- **Backend:** Express.js + TypeScript, using MongoDB and Mongoose. Language used in schema and endpoints: English. Includes `multer` for image uploads, `pdfkit` for generating receipts/reports, `nodemailer` for email, and `exceljs`/`docx` for exporting data.
- **Frontend:** Nuxt 4 + Vue 3 + TypeScript. Language used in UI: Indonesian.

## Documentation
- This file provides an up-to-date overview of the architecture, database schema, and endpoints.

### Database Schemas (MongoDB / Mongoose)
- **Room**: `tipeKamar` (String), `fasilitas` (String), `price` (Number), `totalStock` (Number), `availableStock` (Number), `imageUrl` (String).
- **Customer**: `name` (String), `telephone` (String), `address` (String), `email` (String), `isActive` (Boolean - for soft delete).
- **RentalTransaction**: `transactionId` (String), `customerId` (ObjectId), `kebayaId` (ObjectId), `rentalStartTime` (Date), `expectedReturnDate` (Date), `rentalEndTime` (Date), `amountToPay` (Number), `depositAmount` (Number), `depositPaid` (Boolean), `status` (String: 'Active' | 'Completed' | 'Cancelled').
- **AuditLog**: `timestamp` (Date), `action` (String), `entity` (String), `details` (String).
- **Config**: `penaltyType` (String), `penaltyCost` (Number).

### Key API Endpoints
- **Room**: `GET /api/rooms`, `POST /api/rooms` (with image), `PUT /api/rooms/:id`, `DELETE /api/rooms/:id`
- **Customer**: `GET /api/customers`, `POST /api/customers`, `PUT /api/customers/:id`, `DELETE /api/customers/:id` (soft-delete)
- **Rental**: 
  - `GET /api/rentals`: List active and historical rentals.
  - `POST /api/rentals`: Rent a room (handles deposit, Kwitansi Deposit PDF generation).
  - `POST /api/rentals/:id/return`: Return a room (calculates penalties based on Config, generates Kwitansi Lunas).
  - `POST /api/rentals/:id/cancel`: Cancel an active rental.
  - `POST /api/rentals/:id/email-receipt`: Email receipt to customer.
- **Audit & Config**:
  - `GET /api/audit`: List audit logs.
  - `GET /api/audit/export/pdf`: Export audit logs to PDF.
  - `POST /api/config/wipe`: Factory reset via MASTER_PIN.
- **Reports & Dashboard**:
  - `GET /api/dashboard/stats`: Get dashboard statistics (Top Rooms, Top Customers).
  - `GET /api/reports/renting`: Export rental reports (Excel, Word, PDF).
  - `GET /api/reports/financial`: Export financial reports (Excel, Word, PDF).

### Frontend Architecture (Nuxt 4 / Vue 3)
- **CSS**: Vanilla CSS in `assets/css/main.css` implementing an elegant, high-contrast, large-font design for accessibility, with a Batik watermark background.
- **Layouts**: `layouts/default.vue` provides the main Sidebar and routing wrapper.
- **Pages**:
  - `/` (Utama / Landing): Quick Rent with integrated forms, Top 5 lists, Due Rentals table.
  - `/dasbor` (Dasbor): Comprehensive charts and metrics.
  - `/inventaris` (Inventaris): Searchable catalog with Edit/Delete and Stock adjustments.
  - `/penyewaan` (Penyewaan): Separated Active/Historical tabs with TRX Search, PDF printing, and Email buttons.
  - `/pelanggan` (Pelanggan): Customer list with Active Rental display and Soft-Delete capabilities.
  - `/audit` (Audit & Log): Immutable view of system actions and PDF export.
  - `/pengaturan` (Pengaturan): Global penalty configuration and Danger Zone (Factory Reset with MASTER_PIN).
- **Composables**: `useApi.ts` serves as the global fetch wrapper to call the Express backend.
