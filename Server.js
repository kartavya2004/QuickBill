const express = require("express");
const cors = require("cors");
const twilio = require("twilio");
require("dotenv").config();

const app = express();
app.use(cors());
app.use(express.json());

// In-memory store for enterprises and customers
const enterprises = [];
const customers = [];

// Load Twilio credentials from environment variables
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const client = twilio(accountSid, authToken);

// Registration endpoint
app.post("/api/register", (req, res) => {
  const { enterpriseName, phone, email, address, password } = req.body;

  if (!enterpriseName || !phone || !email || !address || !password) {
    return res.status(400).json({ error: "All fields are required" });
  }

  const existingEnterprise = enterprises.find(ent => ent.email === email);
  if (existingEnterprise) {
    return res.status(400).json({ error: "Email already registered" });
  }

  const enterprise = {
    id: Date.now().toString(),
    enterpriseName,
    phone,
    email,
    address,
    password,
    createdAt: new Date().toISOString()
  };

  enterprises.push(enterprise);

  const { password: _, ...enterpriseWithoutPassword } = enterprise;
  res.status(201).json({
    success: "Enterprise registered successfully",
    enterprise: enterpriseWithoutPassword
  });
});

// Login endpoint
app.post("/api/login", (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required" });
  }

  const enterprise = enterprises.find(ent => ent.email === email);
  
  if (!enterprise || enterprise.password !== password) {
    return res.status(401).json({ error: "Invalid email or password" });
  }

  const { password: _, ...enterpriseWithoutPassword } = enterprise;
  res.json({
    success: "Login successful",
    enterprise: enterpriseWithoutPassword
  });
});

// Add customer transaction
app.post("/api/customers", (req, res) => {
  const { enterpriseEmail, customerName, customerPhone, itemPurchased, price, invoiceNumber } = req.body;

  if (!enterpriseEmail || !customerName || !customerPhone || !itemPurchased || !price) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  const customer = {
    id: Date.now().toString(),
    enterpriseEmail,
    customerName,
    customerPhone,
    itemPurchased,
    price,
    invoiceNumber,
    transactionDate: new Date().toISOString()
  };

  customers.push(customer);
  res.status(201).json({ success: "Customer transaction added successfully", customer });
});

// Get customer transactions for an enterprise
app.get("/api/customers/:enterpriseEmail", (req, res) => {
  const { enterpriseEmail } = req.params;
  const enterpriseCustomers = customers.filter(customer => customer.enterpriseEmail === enterpriseEmail);
  res.json(enterpriseCustomers);
});

// Existing WhatsApp sending endpoint
app.post("/send-whatsapp", async (req, res) => {
  const { phoneNumber, pdfUrl, invoiceNumber, billTo } = req.body;

  if (!phoneNumber || !pdfUrl || !invoiceNumber || !billTo) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  try {
    const message = await client.messages.create({
        from: "whatsapp:+14155238886",
        to: `whatsapp:${phoneNumber}`,
        template: 'invoice',  // Use your actual Twilio template name
        template_parameters: {
            '1': pdfUrl,         // PDF link (for Media URL)
            '2': billTo,         // Customer Name
            '3': invoiceNumber   // Invoice Number
        }
    });
    try {
      const message = await client.messages.create({
          from: "whatsapp:+14155238886",
          to: `whatsapp:${phoneNumber}`,
          template: 'invoice1',  // Use your actual Twilio template name
          template_parameters: {
              '1': invoice_1.pdf,         // PDF link (for Media URL)
              '2': billTo,         // Customer Name
              '3': invoiceNumber   // Invoice Number
          }
      });
  
      console.log("Message sent:", message.sid);
  } catch (error) {
      console.error("Error sending message:", error);
  }

    // Store customer transaction after successful WhatsApp send
    const enterpriseEmail = req.body.enterpriseEmail;
    if (enterpriseEmail) {
      const customer = {
        id: Date.now().toString(),
        enterpriseEmail,
        customerName: billTo,
        customerPhone: phoneNumber,
        invoiceNumber,
        transactionDate: new Date().toISOString()
      };
      customers.push(customer);
    }

    res.json({ success: "Invoice sent via WhatsApp!", messageSid: message.sid });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
