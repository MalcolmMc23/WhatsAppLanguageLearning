require('dotenv').config();
const express = require('express');
const twilio = require('twilio');

const app = express();
const port = process.env.PORT || 8080;

// Middleware to parse incoming requests with urlencoded payloads
app.use(express.urlencoded({ extended: false }));

// Twilio WhatsApp Webhook Endpoint
app.post('/whatsapp', (req, res) => {
    const twiml = new twilio.twiml.MessagingResponse();
    const incomingMsg = req.body.Body.toLowerCase().trim();
    const fromNumber = req.body.From; // WhatsApp number like 'whatsapp:+14155238886'

    console.log(`Received message from ${fromNumber}: ${incomingMsg}`);

    // --- Add your chatbot logic here ---
    // Example: Simple echo response
    twiml.message(`You said: ${incomingMsg}`);
    // -----------------------------------

    res.writeHead(200, { 'Content-Type': 'text/xml' });
    res.end(twiml.toString());
});

// Basic root route for testing
app.get('/', (req, res) => {
    res.send('WhatsApp Chatbot is running!');
});

app.listen(port, () => {
    console.log(`Server listening on port ${port}`);
}); 