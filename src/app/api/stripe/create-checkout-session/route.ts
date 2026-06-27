import { NextResponse } from "next/server";
import Stripe from "stripe";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const stripeSecretKey = process.env.STRIPE_SECRET_KEY || "";
const stripePriceId =
  process.env.STRIPE_PRICE_ID || "price_1Tn36yA4nDuDd6rIJOMNQkXS";
const appUrl =
  process.env.NEXT_PUBLIC_APP_URL || "https://www.appointeazebooking.com";

export async function POST() {
  try {
    if (!stripeSecretKey) {
      return NextResponse.json(
        {
          error: "Missing STRIPE_SECRET_KEY in Vercel environment variables.",
        },
        { status: 500 }
      );
    }

    if (!stripeSecretKey.startsWith("sk_live_")) {
      return NextResponse.json(
        {
          error:
            "STRIPE_SECRET_KEY exists, but it does not start with sk_live_. Check the Vercel value.",
        },
        { status: 500 }
      );
    }

    if (!stripePriceId) {
      return NextResponse.json(
        {
          error: "Missing STRIPE_PRICE_ID in Vercel environment variables.",
        },
        { status: 500 }
      );
    }

    if (!stripePriceId.startsWith("price_")) {
      return NextResponse.json(
        {
          error:
            "STRIPE_PRICE_ID exists, but it does not start with price_. Check the Vercel value.",
        },
        { status: 500 }
      );
    }

    const stripe = new Stripe(stripeSecretKey);

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
  } catch (error: any) {
    console.error("Stripe checkout error:", error);

    return NextResponse.json(
      {
        error:
          error?.message ||
          "Could not create Stripe Checkout session. Check Vercel function logs.",
      },
      { status: 500 }
    );
  }
}