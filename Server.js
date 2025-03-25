const express = require("express");
const cors = require("cors");
const twilio = require("twilio");
require("dotenv").config(); // To use environment variables

const app = express();
app.use(cors());
app.use(express.json());

// Load Twilio credentials from environment variables
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const client = twilio(accountSid, authToken);

app.post("/send-whatsapp", async (req, res) => {
  const { phoneNumber, pdfUrl, invoiceNumber, billTo } = req.body;

  if (!phoneNumber || !pdfUrl || !invoiceNumber || !billTo) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  try {
    const message = await client.messages.create({
      from: "whatsapp:+14155238886", // Twilio sandbox number
      to: `whatsapp:${phoneNumber}`,
      body: `Hi ${billTo}, your invoice (ID: ${invoiceNumber}) is ready. View it here: ${pdfUrl}`,
    });

    res.json({ success: "Invoice sent via WhatsApp!", messageSid: message.sid });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
