const mongoose = require('mongoose');

const invoiceItemSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    description: String,
    quantity: {
        type: Number,
        required: true,
        min: 1
    },
    price: {
        type: Number,
        required: true,
        min: 0
    }
});

const invoiceSchema = new mongoose.Schema({
    invoiceNumber: {
        type: String,
        required: true
    },
    dateOfIssue: {
        type: Date,
        required: true
    },
    enterprise: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Enterprise',
        required: true
    },
    billFrom: {
        name: String,
        email: String,
        phone: String,
        address: String
    },
    billTo: {
        name: String,
        email: String,
        phone: String,
        address: String
    },
    items: [invoiceItemSchema],
    notes: String,
    subTotal: {
        type: Number,
        required: true
    },
    cgstRate: {
        type: Number,
        default: 0
    },
    sgstRate: {
        type: Number,
        default: 0
    },
    discountRate: {
        type: Number,
        default: 0
    },
    discountAmount: {
        type: Number,
        default: 0
    },
    total: {
        type: Number,
        required: true
    },
    currency: {
        type: String,
        default: '₹'
    },
    status: {
        type: String,
        enum: ['draft', 'sent', 'paid', 'cancelled'],
        default: 'draft'
    },
    pdfUrl: String,
    whatsappSent: {
        type: Boolean,
        default: false
    },
    whatsappSentAt: Date
}, {
    timestamps: true
});

// Add index for faster queries
invoiceSchema.index({ enterprise: 1, invoiceNumber: 1 });
invoiceSchema.index({ 'billTo.phone': 1 });
invoiceSchema.index({ status: 1 });
invoiceSchema.index({ createdAt: -1 });

const Invoice = mongoose.model('Invoice', invoiceSchema);

module.exports = Invoice;