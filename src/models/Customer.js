const mongoose = require('mongoose');

const customerSchema = new mongoose.Schema({
    enterprise: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Enterprise',
        required: true
    },
    name: {
        type: String,
        required: [true, 'Customer name is required']
    },
    email: {
        type: String,
        lowercase: true,
        trim: true
    },
    phone: {
        type: String,
        required: [true, 'Phone number is required']
    },
    address: String,
    totalInvoices: {
        type: Number,
        default: 0
    },
    totalAmount: {
        type: Number,
        default: 0
    },
    lastInvoiceDate: Date,
    invoices: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Invoice'
    }],
    notes: String,
    status: {
        type: String,
        enum: ['active', 'inactive'],
        default: 'active'
    }
}, {
    timestamps: true
});

// Add indexes for faster queries
customerSchema.index({ enterprise: 1, phone: 1 });
customerSchema.index({ enterprise: 1, email: 1 });
customerSchema.index({ enterprise: 1, name: 1 });

// Update customer stats when a new invoice is added
customerSchema.methods.updateStats = async function(invoiceAmount) {
    this.totalInvoices += 1;
    this.totalAmount += invoiceAmount;
    this.lastInvoiceDate = new Date();
    await this.save();
};

const Customer = mongoose.model('Customer', customerSchema);

module.exports = Customer;