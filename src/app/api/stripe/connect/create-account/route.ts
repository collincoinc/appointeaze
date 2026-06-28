import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "");

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey);
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey);

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization") || "";
    const token = authHeader.replace("Bearer ", "").trim();

    if (!token) {
      return NextResponse.json(
        { error: "Missing login token." },
        { status: 401 }
      );
    }

    const { data: userData, error: userError } =
      await supabaseAuth.auth.getUser(token);

    if (userError || !userData.user) {
      return NextResponse.json(
        { error: "Invalid login session." },
        { status: 401 }
      );
    }

    const body = await request.json();
    const businessId = String(body.businessId || "");

    if (!businessId) {
      return NextResponse.json(
        { error: "Missing business ID." },
        { status: 400 }
      );
    }

    const { data: business, error: businessError } = await supabaseAdmin
      .from("businesses")
      .select(
        "id, name, email, owner_email, owner_id, stripe_connected_account_id"
      )
      .eq("id", businessId)
      .eq("owner_id", userData.user.id)
      .maybeSingle();

    if (businessError || !business) {
      return NextResponse.json(
        { error: "Business not found for this owner." },
        { status: 404 }
      );
    }

    let connectedAccountId = business.stripe_connected_account_id as
      | string
      | null;

    if (!connectedAccountId) {
      const account = await stripe.accounts.create({
        type: "express",
        email:
          business.email ||
          business.owner_email ||
          userData.user.email ||
          undefined,
        business_profile: {
          name: business.name || "AppointEaze Business",
        },
        capabilities: {
          card_payments: { requested: true },
          transfers: { requested: true },
        },
      });

      connectedAccountId = account.id;

      const { error: updateError } = await supabaseAdmin
        .from("businesses")
        .update({
          stripe_connected_account_id: connectedAccountId,
          stripe_connect_last_checked_at: new Date().toISOString(),
        })
        .eq("id", business.id)
        .eq("owner_id", userData.user.id);

      if (updateError) {
        return NextResponse.json(
          { error: updateError.message || "Could not save Stripe account." },
          { status: 500 }
        );
      }
    }

    const appUrl =
      process.env.NEXT_PUBLIC_APP_URL || "https://www.appointeazebooking.com";

    const accountLink = await stripe.accountLinks.create({
      account: connectedAccountId,
      refresh_url: `${appUrl}/dashboard/stripe?stripe_connect=refresh&business_id=${encodeURIComponent(
        business.id
      )}`,
      return_url: `${appUrl}/dashboard/stripe?stripe_connect=return&business_id=${encodeURIComponent(
        business.id
      )}`,
      type: "account_onboarding",
    });

    return NextResponse.json({
      url: accountLink.url,
      accountId: connectedAccountId,
    });
  } catch (error: any) {
    console.error("Stripe Connect create-account error:", error);

    return NextResponse.json(
      {
        error:
          error?.message ||
          "Could not start Stripe Connect onboarding. Check server logs.",
      },
      { status: 500 }
    );
  }
}