require('dotenv').config();
const express = require('express');
// const twilio = require('twilio'); // Commented out

const app = express();
const port = process.env.PORT || 8080;

// Middleware to parse incoming requests with urlencoded payloads
app.use(express.urlencoded({ extended: false }));

/* // Commented out Twilio Webhook Endpoint
app.post('/whatsapp', (req, res) => {
    console.log('Received POST request on /whatsapp');
    try {
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
    } catch (error) {
        console.error('Error in /whatsapp handler:', error);
        res.status(500).send('Internal Server Error');
    }
});
*/

// Basic root route for testing
app.get('/', (req, res) => {
    res.send('WhatsApp Chatbot is running!');
});

const server = app.listen(port, () => {
    console.log(`Server listening on port ${port}`);
});

server.on('error', (error) => {
    console.error('Server error:', error);
    process.exit(1);
});

// Basic Error Handling Middleware
app.use((err, req, res, next) => {
    console.error('Unhandled error:', err);
    res.status(500).send('Something broke!');
}); 