# QuickBill - Invoice Generator with WhatsApp Integration

QuickBill is a modern invoice generation system with WhatsApp sharing capabilities, supporting both personal WhatsApp API and Twilio's WhatsApp Business API.

## Prerequisites

- Node.js (v14 or higher)
- npm (v6 or higher)
- AWS S3 bucket for invoice storage
- WhatsApp API credentials (personal API or Twilio)

## Setup Instructions

1. **Clone the repository**
```bash
git clone https://github.com/kartavya2004/QuickBill.git
cd QuickBill
```

2. **Install dependencies**
```bash
npm run install-all
```

3. **Configure Environment Variables**
   
   Create a `.env` file in the root directory using `.env.example` as a template:
```bash
cp .env.example .env
```

   Configure the following variables in `.env`:
   - Server Configuration:
     ```
     PORT=5000
     ```
   - WhatsApp API Selection:
     ```
     USE_PERSONAL_WHATSAPP=false  # Set to true for personal API, false for Twilio
     ```
   - Twilio Configuration (if using Twilio):
     ```
     TWILIO_ACCOUNT_SID=your_twilio_account_sid
     TWILIO_AUTH_TOKEN=your_twilio_auth_token
     ```
   - AWS S3 Configuration:
     ```
     REACT_APP_AWS_ACCESS_KEY_ID=your_aws_access_key_id
     REACT_APP_AWS_SECRET_ACCESS_KEY=your_aws_secret_access_key
     REACT_APP_AWS_REGION=your_aws_region
     REACT_APP_AWS_BUCKET_NAME=your_bucket_name
     ```

4. **Configure WhatsApp API**

   If using personal WhatsApp API, update `whatsapp-api-personal.config.json`:
   ```json
   {
     "apiEndpoint": "YOUR_PERSONAL_WHATSAPP_API_ENDPOINT",
     "apiKey": "YOUR_PERSONAL_WHATSAPP_API_KEY",
     "sender": "YOUR_PERSONAL_WHATSAPP_NUMBER"
   }
   ```

5. **Start the Application**

   Development mode (runs both frontend and backend):
   ```bash
   npm run dev
   ```

   Or run separately:
   - Backend only: `npm run server` (runs on port 5000)
   - Frontend only: `npm start` (runs on port 3000)

## Features

- Generate professional invoices
- Share invoices via WhatsApp
- Store invoices in AWS S3
- Support for both personal WhatsApp API and Twilio
- Real-time invoice generation and sharing
- Professional PDF generation
- Customizable message templates

## Common Issues and Solutions

1. **Port Already in Use**
   ```bash
   Error: Port 5000 is already in use
   ```
   Solution: Kill the process using port 5000:
   ```bash
   sudo lsof -i :5000
   kill -9 <PID>
   ```

2. **AWS S3 Upload Errors**
   - Ensure your AWS credentials are correctly set in .env
   - Verify the S3 bucket exists and has proper permissions
   - Check if the bucket policy allows public read access for invoice sharing

3. **WhatsApp API Errors**
   - Verify your WhatsApp API credentials
   - Ensure the recipient phone number is in the correct format (with country code)
   - Check if the WhatsApp template messages are approved (for Twilio)

4. **PDF Generation Issues**
   - Ensure all required fonts are available
   - Check if the invoice content is properly formatted
   - Verify html2canvas and jsPDF are working correctly

## Development Notes

- Backend runs on port 5000
- Frontend runs on port 3000
- Uses nodemon for automatic server restart during development
- Concurrently package runs both frontend and backend simultaneously
- AWS SDK is configured for S3 file uploads
- Supports both development and production environments

## Security Considerations

1. Environment Variables:
   - Never commit .env file
   - Keep API keys and credentials secure
   - Use appropriate access permissions for AWS IAM users

2. AWS S3:
   - Configure CORS properly for your S3 bucket
   - Use appropriate bucket policies
   - Consider using pre-signed URLs for enhanced security

3. WhatsApp API:
   - Keep API keys secure
   - Use approved message templates
   - Follow WhatsApp Business Policy guidelines

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a new Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.