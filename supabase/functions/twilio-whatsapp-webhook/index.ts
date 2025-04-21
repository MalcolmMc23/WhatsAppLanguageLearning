// Import the Twilio helper library using Node compatibility
// Note: You might need to ensure your Supabase project has Node compatibility enabled
// or potentially use a Deno-specific Twilio helper if available/needed.
// The official twilio-node library often works. Ensure it's listed in your *root* package.json
// as Supabase Functions can sometimes access parent node_modules.
// If deployment fails, you might need to explicitly add it to supabase/functions/package.json
import twilio from 'npm:twilio';

// Import serve for handling requests if not using Deno's native server
// Supabase Edge Functions provide a standard Request/Response interface
// based on the Fetch API standard.

console.log("Function twilio-whatsapp-webhook starting up.");

// Define CORS headers for preflight and actual requests
const corsHeaders = {
  'Access-Control-Allow-Origin': '*', // Or specify allowed origins
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS', // Allow POST and OPTIONS for preflight
};


Deno.serve(async (req: Request) => {
  // Handle OPTIONS request for CORS preflight
  if (req.method === 'OPTIONS') {
    console.log("Handling OPTIONS request");
    return new Response('ok', { headers: corsHeaders });
  }

  console.log(`Handling ${req.method} request`);

  if (req.method !== 'POST') {
    console.error(`Method ${req.method} not allowed.`);
    return new Response("Method Not Allowed", { status: 405, headers: corsHeaders });
  }

  try {
    // Twilio sends data as application/x-www-form-urlencoded
    const formData = await req.formData();
    const body = Object.fromEntries(formData.entries());

    const incomingMsg = (body.Body as string || '').toLowerCase().trim();
    const fromNumber = body.From as string; // e.g., 'whatsapp:+14155238886'

    console.log(`Received message from ${fromNumber}: ${incomingMsg}`);

    // Create a TwiML response
    const twiml = new twilio.twiml.MessagingResponse();

    // --- Add your chatbot logic here ---
    // Example: Simple echo response
    twiml.message(`You said: ${incomingMsg}`);
    // -----------------------------------


    // Return the TwiML as an XML response
    return new Response(twiml.toString(), {
      headers: {
        ...corsHeaders, // Include CORS headers in the actual response
        'Content-Type': 'text/xml',
      },
      status: 200,
    });

  } catch (error) {
    console.error('Error processing request:', error);
    return new Response('Internal Server Error', {
        headers: corsHeaders, // Include CORS headers even on error
        status: 500
    });
  }
});

console.log(`Function twilio-whatsapp-webhook ready.`);

// Note: Environment variables (TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN)
// are generally NOT needed for simply *replying* with TwiML,
// but would be needed if this function initiated outbound messages using client.messages.create().
// You would access them via Deno.env.get("YOUR_VAR_NAME") after setting them
// in the Supabase dashboard or via the CLI. 