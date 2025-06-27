// supabase/functions/create-checkout-session/index.ts
import { serve } from "https://deno.land/std@0.181.0/http/server.ts";
import Stripe from "npm:stripe";

const rawUrl = Deno.env.get('PUBLIC_URL') || ''
// if it’s missing “http”, prefix it
const baseUrl =
  rawUrl.startsWith('http://') || rawUrl.startsWith('https://')
    ? rawUrl
    : `https://${rawUrl}`

const stripeSecret = Deno.env.get('STRIPE_SECRET_KEY')!
const stripe = new Stripe(stripeSecret, { apiVersion: '2022-11-15' })

serve(async (req) => {
  try {
    const { priceId } = await req.json()
    if (!priceId)
      return new Response(
        JSON.stringify({ error: 'Missing priceId in body' }),
        { status: 400 }
      )

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${baseUrl}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/cancel`,
    })

    return new Response(
      JSON.stringify({ url: session.url }),
      { headers: { 'Content-Type': 'application/json' } }
    )
  } catch (err) {
    console.error('🔥 create-checkout-session error:', err)
    return new Response(
      JSON.stringify({ error: (err as Error).message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
})
