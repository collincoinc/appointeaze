import { NextResponse } from "next/server";
import Stripe from "stripe";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const stripeSecretKey = process.env.STRIPE_SECRET_KEY || "";
const stripePriceId =
  process.env.STRIPE_PRICE_ID || "price_1Tn36yA4nDuDd6rIJOMNQkXS";
const appUrl =
  process.env.NEXT_PUBLIC_APP_URL || "https://www.appointeazebooking.com";

const stripe = new Stripe(stripeSecretKey);

export async function POST() {
  try {
    if (!stripeSecretKey) {
      return NextResponse.json(
        { error: "Missing STRIPE_SECRET_KEY." },
        { status: 500 }
      );
    }

    if (!stripePriceId) {
      return NextResponse.json(
        { error: "Missing STRIPE_PRICE_ID." },
        { status: 500 }
      );
    }

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      line_items: [
        {
          price: stripePriceId,
          quantity: 1,
        },
      ],
      subscription_data: {
        trial_period_days: 14,
        metadata: {
          product: "AppointEaze",
          plan: "Launch plan",
        },
      },
      payment_method_collection: "always",
      allow_promotion_codes: true,
      billing_address_collection: "auto",
      customer_creation: "always",
      success_url: `${appUrl}/signup/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}/?checkout=cancelled`,
      metadata: {
        product: "AppointEaze",
        plan: "Launch plan",
      },
    });

    return NextResponse.json({
      url: session.url,
    });
  } catch (error) {
    console.error("Stripe checkout error:", error);

    return NextResponse.json(
      {
        error: "Could not create Stripe Checkout session.",
      },
      { status: 500 }
    );
  }
}