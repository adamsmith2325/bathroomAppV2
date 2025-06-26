// supabase/functions/create-checkout-session/index.ts
import { serve } from "https://deno.land/std@0.181.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js";
import Stripe from "npm:stripe";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY")!, {
  apiVersion: "2022-11-15",
});
const supabaseAdmin = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

serve(async (req) => {
  try {
    const { user_id } = await req.json();

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: [
        { price: "price_XXXXXXXXXXXXXXXX", quantity: 1 }, // ← your Price ID
      ],
      metadata: { user_id },
      // Deep-link back into your app’s Account tab
      success_url: `bathroomappv2://account?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url:  `bathroomappv2://account`,
    });

    return new Response(JSON.stringify({ url: session.url }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err: any) {
    console.error("create-checkout-session error", err);
    return new Response(err.message, { status: 400 });
  }
});
