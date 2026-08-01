import { Router, Request, Response } from 'express';
import Customer from '../models/Customer';
import AuditLog from '../models/AuditLog';

const router = Router();

// Create or Reactivate customer
router.post('/', async (req: Request, res: Response) => {
  try {
    const { name, telephone, address, email } = req.body;
    
    // Check if exists
    let existing = await Customer.findOne({ name, telephone });
    if (existing) {
      if (!existing.isActive) {
        existing.isActive = true;
        existing.address = address || existing.address;
        existing.email = email || existing.email;
        await existing.save();

        await AuditLog.create({
          action: 'UPDATE',
          entity: 'Customer',
          details: `Reactivated previously deleted customer: ${name} (${telephone})`
        });
        return res.json(existing);
      }
      return res.status(400).json({ error: 'Customer already exists and is active.' });
    }

    const customer = new Customer({ name, telephone, address, email });
    await customer.save();

    await AuditLog.create({
      action: 'CREATE',
      entity: 'Customer',
      details: `Created new customer: ${name} (${telephone})`
    });

    res.status(201).json(customer);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// Get all ACTIVE customers
router.get('/', async (req: Request, res: Response) => {
  try {
    const customers = await Customer.find({ isActive: true });
    res.json(customers);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Update customer
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const customer = await Customer.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!customer) return res.status(404).json({ error: 'Customer not found' });
    
    await AuditLog.create({
      action: 'UPDATE',
      entity: 'Customer',
      details: `Updated customer data: ${customer.name}`
    });

    res.json(customer);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// Soft Delete customer
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const customer = await Customer.findById(req.params.id);
    if (!customer) return res.status(404).json({ error: 'Customer not found' });
    
    customer.isActive = false;
    await customer.save();

    await AuditLog.create({
      action: 'DELETE',
      entity: 'Customer',
      details: `Soft-deleted customer: ${customer.name} (${customer.telephone})`
    });

    res.json({ message: 'Customer soft-deleted successfully' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
