const express = require('express');
const router = express.Router();
const Customer = require('../models/Customer');
const Invoice = require('../models/Invoice');

// Get all customers for an enterprise
router.get('/', async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const search = req.query.search;

        let query = { enterprise: req.enterprise.id };

        // Add search functionality
        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { phone: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } }
            ];
        }

        const customers = await Customer.find(query)
            .sort({ lastInvoiceDate: -1 })
            .skip((page - 1) * limit)
            .limit(limit);

        const total = await Customer.countDocuments(query);

        res.json({
            customers,
            page,
            pages: Math.ceil(total / limit),
            total
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get customer details with invoice history
router.get('/:id', async (req, res) => {
    try {
        const customer = await Customer.findOne({
            _id: req.params.id,
            enterprise: req.enterprise.id
        });

        if (!customer) {
            return res.status(404).json({ error: "Customer not found" });
        }

        // Get customer's invoices
        const invoices = await Invoice.find({
            _id: { $in: customer.invoices }
        }).sort({ dateOfIssue: -1 });

        res.json({
            customer,
            invoices
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Update customer details
router.put('/:id', async (req, res) => {
    try {
        const { name, email, phone, address, notes } = req.body;
        const customer = await Customer.findOne({
            _id: req.params.id,
            enterprise: req.enterprise.id
        });

        if (!customer) {
            return res.status(404).json({ error: "Customer not found" });
        }

        customer.name = name || customer.name;
        customer.email = email || customer.email;
        customer.phone = phone || customer.phone;
        customer.address = address || customer.address;
        customer.notes = notes || customer.notes;

        await customer.save();

        res.json({
            success: true,
            customer
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get customer statistics
router.get('/stats/summary', async (req, res) => {
    try {
        const stats = await Customer.aggregate([
            { $match: { enterprise: req.enterprise.id } },
            {
                $group: {
                    _id: null,
                    totalCustomers: { $sum: 1 },
                    totalAmount: { $sum: "$totalAmount" },
                    averageInvoiceAmount: { $avg: "$totalAmount" }
                }
            }
        ]);

        // Get top customers by total amount
        const topCustomers = await Customer.find({ enterprise: req.enterprise.id })
            .sort({ totalAmount: -1 })
            .limit(5);

        // Get recent customers
        const recentCustomers = await Customer.find({ enterprise: req.enterprise.id })
            .sort({ createdAt: -1 })
            .limit(5);

        res.json({
            summary: stats[0] || {
                totalCustomers: 0,
                totalAmount: 0,
                averageInvoiceAmount: 0
            },
            topCustomers,
            recentCustomers
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Mark customer as inactive
router.patch('/:id/status', async (req, res) => {
    try {
        const { status } = req.body;
        const customer = await Customer.findOne({
            _id: req.params.id,
            enterprise: req.enterprise.id
        });

        if (!customer) {
            return res.status(404).json({ error: "Customer not found" });
        }

        customer.status = status;
        await customer.save();

        res.json({
            success: true,
            customer
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;