import { Router, Request, Response } from 'express';
import Customer from '../models/Customer';

const router = Router();

// Create Customer
router.post('/', async (req: Request, res: Response) => {
  try {
    const customer = new Customer(req.body);
    await customer.save();
    res.status(201).json(customer);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// Get all Customers
router.get('/', async (req: Request, res: Response) => {
  try {
    const customers = await Customer.find();
    res.json(customers);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
