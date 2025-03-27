const express = require('express');
const router = express.Router();
const Invoice = require('../models/Invoice');
const Customer = require('../models/Customer');

// Create new invoice
router.post('/', async (req, res) => {
    try {
        const {
            invoiceNumber,
            dateOfIssue,
            billFrom,
            billTo,
            items,
            notes,
            subTotal,
            cgstRate,
            sgstRate,
            discountRate,
            discountAmount,
            total,
            currency
        } = req.body;

        // Create invoice
        const invoice = await Invoice.create({
            invoiceNumber,
            dateOfIssue,
            enterprise: req.enterprise.id,
            billFrom,
            billTo,
            items,
            notes,
            subTotal,
            cgstRate,
            sgstRate,
            discountRate,
            discountAmount,
            total,
            currency
        });

        // Find or create customer
        let customer = await Customer.findOne({
            enterprise: req.enterprise.id,
            phone: billTo.phone
        });

        if (!customer) {
            customer = await Customer.create({
                enterprise: req.enterprise.id,
                name: billTo.name,
                phone: billTo.phone,
                email: billTo.email,
                address: billTo.address
            });
        }

        // Update customer stats
        customer.invoices.push(invoice._id);
        await customer.updateStats(total);

        res.status(201).json({
            success: true,
            invoice
        });
    } catch (error) {
        console.error('Invoice creation error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Get all invoices for an enterprise
router.get('/', async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const status = req.query.status;
        const startDate = req.query.startDate;
        const endDate = req.query.endDate;

        let query = { enterprise: req.enterprise.id };

        // Add filters if provided
        if (status) query.status = status;
        if (startDate && endDate) {
            query.dateOfIssue = {
                $gte: new Date(startDate),
                $lte: new Date(endDate)
            };
        }

        const invoices = await Invoice.find(query)
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(limit);

        const total = await Invoice.countDocuments(query);

        res.json({
            invoices,
            page,
            pages: Math.ceil(total / limit),
            total
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get single invoice
router.get('/:id', async (req, res) => {
    try {
        const invoice = await Invoice.findOne({
            _id: req.params.id,
            enterprise: req.enterprise.id
        });

        if (!invoice) {
            return res.status(404).json({ error: "Invoice not found" });
        }

        res.json(invoice);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Update invoice status
router.patch('/:id/status', async (req, res) => {
    try {
        const { status } = req.body;
        const invoice = await Invoice.findOne({
            _id: req.params.id,
            enterprise: req.enterprise.id
        });

        if (!invoice) {
            return res.status(404).json({ error: "Invoice not found" });
        }

        invoice.status = status;
        await invoice.save();

        res.json({
            success: true,
            invoice
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Update WhatsApp sent status
router.patch('/:id/whatsapp', async (req, res) => {
    try {
        const invoice = await Invoice.findOne({
            _id: req.params.id,
            enterprise: req.enterprise.id
        });

        if (!invoice) {
            return res.status(404).json({ error: "Invoice not found" });
        }

        invoice.whatsappSent = true;
        invoice.whatsappSentAt = new Date();
        await invoice.save();

        res.json({
            success: true,
            invoice
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get invoice statistics
router.get('/stats/summary', async (req, res) => {
    try {
        const stats = await Invoice.aggregate([
            { $match: { enterprise: req.enterprise.id } },
            {
                $group: {
                    _id: null,
                    totalInvoices: { $sum: 1 },
                    totalAmount: { $sum: "$total" },
                    averageAmount: { $avg: "$total" }
                }
            }
        ]);

        const monthlyStats = await Invoice.aggregate([
            { $match: { enterprise: req.enterprise.id } },
            {
                $group: {
                    _id: {
                        year: { $year: "$createdAt" },
                        month: { $month: "$createdAt" }
                    },
                    count: { $sum: 1 },
                    total: { $sum: "$total" }
                }
            },
            { $sort: { "_id.year": -1, "_id.month": -1 } },
            { $limit: 12 }
        ]);

        res.json({
            summary: stats[0] || {
                totalInvoices: 0,
                totalAmount: 0,
                averageAmount: 0
            },
            monthly: monthlyStats
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;