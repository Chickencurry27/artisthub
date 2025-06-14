import { type NextRequest, NextResponse } from "next/server"
import Stripe from "stripe"

const stripe = new Stripe(
  process.env.STRIPE_SECRET_KEY ||
    "sk_test_51RY4OzRXZuRhWYZh5QAO6kjF6VU1UOo9TOXyc0uppt7BNyPrVk28kNR3qaXaVuDopIhaX9b9amcFjF28lmRlgovQ00PxooG1ct",
  {
    apiVersion: "2024-06-20",
  },
)

export async function POST(request: NextRequest) {
  try {
    const { priceId, userId, userEmail } = await request.json()

    if (!priceId || !userId || !userEmail) {
      return NextResponse.json({ error: "Missing required parameters" }, { status: 400 })
    }

    // Validate that the priceId is one of our expected values
    const validPriceIds = ["price_pro_29_eur", "price_enterprise_49_95_eur"]
    if (!validPriceIds.includes(priceId)) {
      return NextResponse.json({ error: "Invalid price ID" }, { status: 400 })
    }

    // Create or retrieve customer
    let customer
    try {
      const customers = await stripe.customers.list({
        email: userEmail,
        limit: 1,
      })

      if (customers.data.length > 0) {
        customer = customers.data[0]
      } else {
        customer = await stripe.customers.create({
          email: userEmail,
          metadata: {
            userId: userId,
          },
        })
      }
    } catch (error) {
      console.error("Error creating/retrieving customer:", error)
      return NextResponse.json({ error: "Failed to create customer" }, { status: 500 })
    }

    // Get the origin URL with fallback
    const origin = request.headers.get("origin") || request.headers.get("host") || "http://localhost:3000"
    const baseUrl = origin.startsWith("http") ? origin : `https://${origin}`

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customer.id,
      payment_method_types: ["card"],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: "subscription",
      success_url: `${baseUrl}/profile?success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/profile?canceled=true`,
      metadata: {
        userId: userId,
        priceId: priceId,
      },
    })

    return NextResponse.json({ sessionId: session.id })
  } catch (error) {
    console.error("Error creating checkout session:", error)
    return NextResponse.json(
      {
        error: "Failed to create checkout session",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
