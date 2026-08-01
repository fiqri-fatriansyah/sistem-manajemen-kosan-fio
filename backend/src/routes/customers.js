"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const Customer_1 = __importDefault(require("../models/Customer"));
const AuditLog_1 = __importDefault(require("../models/AuditLog"));
const router = (0, express_1.Router)();
// Create or Reactivate customer
router.post('/', async (req, res) => {
    try {
        const { name, telephone, address, email } = req.body;
        // Check if exists
        let existing = await Customer_1.default.findOne({ name, telephone });
        if (existing) {
            if (!existing.isActive) {
                existing.isActive = true;
                existing.address = address || existing.address;
                existing.email = email || existing.email;
                await existing.save();
                await AuditLog_1.default.create({
                    action: 'UPDATE',
                    entity: 'Customer',
                    details: `Reactivated previously deleted customer: ${name} (${telephone})`
                });
                return res.json(existing);
            }
            return res.status(400).json({ error: 'Customer already exists and is active.' });
        }
        const customer = new Customer_1.default({ name, telephone, address, email });
        await customer.save();
        await AuditLog_1.default.create({
            action: 'CREATE',
            entity: 'Customer',
            details: `Created new customer: ${name} (${telephone})`
        });
        res.status(201).json(customer);
    }
    catch (err) {
        res.status(400).json({ error: err.message });
    }
});
// Get all ACTIVE customers
router.get('/', async (req, res) => {
    try {
        const customers = await Customer_1.default.find({ isActive: true });
        res.json(customers);
    }
    catch (err) {
        res.status(500).json({ error: err.message });
    }
});
// Update customer
router.put('/:id', async (req, res) => {
    try {
        const customer = await Customer_1.default.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!customer)
            return res.status(404).json({ error: 'Customer not found' });
        await AuditLog_1.default.create({
            action: 'UPDATE',
            entity: 'Customer',
            details: `Updated customer data: ${customer.name}`
        });
        res.json(customer);
    }
    catch (err) {
        res.status(400).json({ error: err.message });
    }
});
// Soft Delete customer
router.delete('/:id', async (req, res) => {
    try {
        const customer = await Customer_1.default.findById(req.params.id);
        if (!customer)
            return res.status(404).json({ error: 'Customer not found' });
        customer.isActive = false;
        await customer.save();
        await AuditLog_1.default.create({
            action: 'DELETE',
            entity: 'Customer',
            details: `Soft-deleted customer: ${customer.name} (${customer.telephone})`
        });
        res.json({ message: 'Customer soft-deleted successfully' });
    }
    catch (err) {
        res.status(500).json({ error: err.message });
    }
});
exports.default = router;
//# sourceMappingURL=customers.js.map