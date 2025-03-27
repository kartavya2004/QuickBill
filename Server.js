const express = require("express");
const cors = require("cors");
const axios = require("axios");
require("dotenv").config();

const connectDB = require('./src/config/db'); // Import database connection
const initializeDB = require('./src/config/initDB');

// Import routes
const enterpriseRoutes = require('./src/routes/enterpriseRoutes');
const invoiceRoutes = require('./src/routes/invoiceRoutes');
const customerRoutes = require('./src/routes/customerRoutes');

// Import middleware
const { protect } = require('./src/middleware/auth');

const app = express();

// Connect to MongoDB and initialize data
const setupDatabase = async () => {
    try {
        await connectDB();
        console.log('MongoDB connected successfully');
        
        // Check if initialization is needed
        if (process.env.INIT_DB === 'true') {
            await initializeDB();
            console.log('Database initialized with sample data');
        }
    } catch (error) {
        console.error('Database setup error:', error);
        process.exit(1);
    }
};

setupDatabase();

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Initialize Twilio client if credentials are provided
let twilioClient = null;
if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_ACCOUNT_SID.startsWith('AC')) {
    const twilio = require("twilio");
    twilioClient = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
    console.log('Twilio client initialized');
} else {
    console.log('Twilio credentials not configured or invalid');
}

// API Routes
app.use('/api/enterprises', enterpriseRoutes);
app.use('/api/invoices', protect, invoiceRoutes);
app.use('/api/customers', protect, customerRoutes);

// Database initialization endpoint (protected, use with caution)
const initDB = require('./src/config/initDB');
app.post('/api/init-db', async (req, res) => {
    try {
        await initializeDB();
        res.json({ message: 'Database initialized successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// WhatsApp messaging endpoint
app.post("/send-whatsapp", protect, async (req, res) => {
    const { phoneNumber, pdfUrl,invoiceNumber, billTo, businessName, amount } = req.body;

    if (!phoneNumber || !pdfUrl || !invoiceNumber || !billTo) {
        return res.status(400).json({ error: "Missing required fields" });
    }

    try {
        let messageSid;
        const usePersonalApi = process.env.USE_PERSONAL_WHATSAPP === "true";

        // Format message
        const messageText = `Dear ${billTo},\n\nThank you for your business! Here is your invoice #${invoiceNumber} for ${amount}.\n\nBest regards,\n${businessName}`;

        if (usePersonalApi) {
            try {
                const personalWhatsAppConfig = require("./whatsapp-api-personal.config.json");
                
                const messagePayload = {
                    apiKey: personalWhatsAppConfig.apiKey,
                    sender: personalWhatsAppConfig.sender,
                    recipient: phoneNumber,
                    message: messageText,
                    document: typeof pdfUrl === 'string' && pdfUrl.startsWith('data:application/pdf;base64,')
                        ? {
                            data: pdfUrl.split(',')[1],
                            filename: `invoice_${invoiceNumber}.pdf`
                        }
                        : { link: pdfUrl }
                };

                const response = await axios.post(personalWhatsAppConfig.apiEndpoint, messagePayload, {
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${personalWhatsAppConfig.apiKey}`
                    }
                });

                messageSid = response.data.messageId || response.data.id;
                console.log("Message sent using personal WhatsApp API:", messageSid);
            } catch (error) {
                console.error("Error sending message via personal WhatsApp API:", error);
                throw new Error(`Failed to send message via personal WhatsApp API: ${error.message}`);
            }
        } else {
            if (!twilioClient) {
                throw new Error("Twilio not configured. Please configure Twilio or use personal WhatsApp API.");
            }

            const messageOptions = {
                from: "whatsapp:+14155238886",
                to: `whatsapp:${phoneNumber}`,
                body: messageText
            };

            if (!pdfUrl.startsWith('data:')) {
                messageOptions.mediaUrl = [pdfUrl];
            }

            const message = await twilioClient.messages.create(messageOptions);
            messageSid = message.sid;
            console.log("Message sent using Twilio:", messageSid);
        }

        // Update invoice status in database
        if (req.enterprise) {
            const Invoice = require('./src/models/Invoice');
            await Invoice.findOneAndUpdate(
                { invoiceNumber, enterprise: req.enterprise._id },
                { 
                    whatsappSent: true,
                    whatsappSentAt: new Date(),
                    status: 'sent'
                }
            );
        }

        res.json({ 
            success: "Invoice sent via WhatsApp!", 
            messageSid,
            provider: usePersonalApi ? "personal" : "twilio"
        });
    } catch (error) {
        console.error("WhatsApp sending error:", error);
        res.status(500).json({ 
            error: "Failed to send WhatsApp message", 
            details: error.message 
        });
    }
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Something went wrong!' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`MongoDB: ${process.env.MONGODB_URI || 'mongodb://localhost:27017/quickbill'}`);
});
