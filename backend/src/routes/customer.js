"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const Customer_1 = __importDefault(require("../models/Customer"));
const router = (0, express_1.Router)();
// Create Customer
router.post('/', async (req, res) => {
    try {
        const customer = new Customer_1.default(req.body);
        await customer.save();
        res.status(201).json(customer);
    }
    catch (err) {
        res.status(400).json({ error: err.message });
    }
});
// Get all Customers
router.get('/', async (req, res) => {
    try {
        const customers = await Customer_1.default.find();
        res.json(customers);
    }
    catch (err) {
        res.status(500).json({ error: err.message });
    }
});
exports.default = router;
//# sourceMappingURL=customer.js.map