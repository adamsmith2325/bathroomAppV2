// supabase/functions/create-checkout-session/index.ts
import { serve } from "https://deno.land/std@0.181.0/http/server.ts";
import Stripe from "npm:stripe";

serve(async (req) => {
  const { priceId } = await req.json()
  const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, { apiVersion: '2022-11-15' })

  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    payment_method_types: ['card'],
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${Deno.env.get('APP_URL')}/success`,
    cancel_url: `${Deno.env.get('APP_URL')}/cancel`,
  })

  return new Response(JSON.stringify({ url: session.url }), {
    headers: { 'Content-Type': 'application/json' },
  })
})

