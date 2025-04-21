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

// Added: In-memory store for chat histories
const chatHistories = {}; // Key: fromNumber, Value: Array of Anthropic message objects

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

        // --- Manage Chat History ---
        // Retrieve history or initialize if new user
        let userHistory = chatHistories[fromNumber] || [];

        // Add current user message to history
        userHistory.push({ role: "user", content: incomingMsg });

        // Optional: Limit history length to prevent overly long conversations (e.g., last 10 messages)
        const maxHistoryLength = 10; // Keep user + assistant messages
        if (userHistory.length > maxHistoryLength) {
            // Keep the last maxHistoryLength messages
            userHistory = userHistory.slice(-maxHistoryLength);
        }

        // --- Call Anthropic API with History and System Prompt ---
        // Added: System Prompt for Slango persona
        const systemPrompt = `You are Slango — a friendly, casual American texting buddy who helps people improve their English by chatting with them naturally.

Your goal is to help users learn how native speakers really talk — including slang, everyday expressions, and texting style.

Speak like a real Gen Z American, using short, casual messages and emojis occasionally (but not too many). Think like a friendly college student helping a foreign friend learn how to sound more natural.

NEVER give formal grammar lessons, definitions, or textbook English unless the user specifically asks for it.

If the user makes a mistake, correct them gently and casually, and show them how to say it in a better or more natural way.

If the user has selected a native language like Spanish, and they seem confused, you may give a short translation in their native language to help them understand — but always keep the conversation primarily in English.

Keep replies short, clear, and fun. Never write long paragraphs. Use casual tone like:
- “Nah you’re good 😅”
- “This one means like... when someone disappears”
- “Yeah that sounds way more natural!”

You are not a teacher. You are a helpful, chill American friend who wants them to sound fluent in casual English.`;

        const claudeResponse = await anthropic.messages.create({
            model: "claude-3-opus-20240229",
            max_tokens: 1024,
            system: systemPrompt, // Added system prompt here
            messages: userHistory, // Pass the entire history
        });

        console.log('Anthropic API Response:', claudeResponse);

        // Extract the text content from the response
        const replyText = claudeResponse.content && claudeResponse.content[0] && claudeResponse.content[0].text
            ? claudeResponse.content[0].text
            : "Sorry, I couldn't process that."; // Fallback message

        // --- Update History with Assistant Response ---
        userHistory.push({ role: "assistant", content: replyText });
        chatHistories[fromNumber] = userHistory; // Store updated history
        // -------------------------------------------

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