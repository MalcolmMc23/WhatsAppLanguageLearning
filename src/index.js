require('dotenv').config(); // Re-enabled

// Added: Check if API key is loaded
if (!process.env.ANTHROPIC_API_KEY) {
    console.error('ERROR: ANTHROPIC_API_KEY environment variable not found!');
    console.log('Ensure you have a .env file in the project root with ANTHROPIC_API_KEY=your_key');
} else {
    console.log('Anthropic API Key loaded successfully (first few chars):', process.env.ANTHROPIC_API_KEY.substring(0, 5) + '...'); // Log only a few chars for security
}

const express = require('express');
const twilio = require('twilio'); // Re-enabled
const Anthropic = require('@anthropic-ai/sdk'); // Added

const app = express();
const port = process.env.PORT || 8080;

// Added: Initialize Anthropic Client
const anthropic = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
});

// Middleware to parse incoming requests with urlencoded payloads
app.use(express.urlencoded({ extended: false }));

// Re-enabled Twilio Webhook Endpoint
// Modified to be async to await Anthropic response
app.post('/whatsapp', async (req, res) => { // Made async
    console.log('Received POST request on /whatsapp');
    const twiml = new twilio.twiml.MessagingResponse(); // Moved up
    try {
        const incomingMsg = req.body.Body.toLowerCase().trim();
        const fromNumber = req.body.From; // WhatsApp number like 'whatsapp:+14155238886'

        console.log(`Received message from ${fromNumber}: ${incomingMsg}`);

        // --- Call Anthropic API ---
        const claudeResponse = await anthropic.messages.create({
            model: "claude-3-opus-20240229", // Or choose another model
            max_tokens: 1024,
            messages: [{ role: "user", content: incomingMsg }],
        });

        console.log('Anthropic API Response:', claudeResponse);

        // Extract the text content from the response
        const replyText = claudeResponse.content && claudeResponse.content[0] && claudeResponse.content[0].text
            ? claudeResponse.content[0].text
            : "Sorry, I couldn't process that."; // Fallback message

        twiml.message(replyText);
        // -----------------------------------

        res.writeHead(200, { 'Content-Type': 'text/xml' });
        res.end(twiml.toString());
    } catch (error) {
        console.error('Error in /whatsapp handler:', error);
        // Send an error message back via Twilio if possible
        if (error instanceof Anthropic.APIError) {
            console.error('Anthropic API Error:', error.status, error.name, error.headers);
            twiml.message(`Sorry, there was an issue contacting the AI assistant (${error.status}).`);
        } else {
            twiml.message('An internal error occurred.');
        }
        // Still attempt to send the TwiML response even if there's an error
        res.writeHead(200, { 'Content-Type': 'text/xml' });
        res.end(twiml.toString());
    }
});

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