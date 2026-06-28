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
      .select("id, owner_id, stripe_connected_account_id")
      .eq("id", businessId)
      .eq("owner_id", userData.user.id)
      .maybeSingle();

    if (businessError || !business) {
      return NextResponse.json(
        { error: "Business not found for this owner." },
        { status: 404 }
      );
    }

    if (!business.stripe_connected_account_id) {
      return NextResponse.json({
        connected: false,
        onboardingComplete: false,
        chargesEnabled: false,
        payoutsEnabled: false,
        detailsSubmitted: false,
      });
    }

    const account = await stripe.accounts.retrieve(
      business.stripe_connected_account_id
    );

    const onboardingComplete =
      Boolean(account.details_submitted) &&
      Boolean(account.charges_enabled) &&
      Boolean(account.payouts_enabled);

    const updatePayload = {
      stripe_connect_onboarding_complete: onboardingComplete,
      stripe_charges_enabled: Boolean(account.charges_enabled),
      stripe_payouts_enabled: Boolean(account.payouts_enabled),
      stripe_connect_details_submitted: Boolean(account.details_submitted),
      stripe_connect_last_checked_at: new Date().toISOString(),
    };

    await supabaseAdmin
      .from("businesses")
      .update(updatePayload)
      .eq("id", business.id)
      .eq("owner_id", userData.user.id);

    return NextResponse.json({
      connected: true,
      onboardingComplete,
      chargesEnabled: Boolean(account.charges_enabled),
      payoutsEnabled: Boolean(account.payouts_enabled),
      detailsSubmitted: Boolean(account.details_submitted),
      accountId: account.id,
    });
  } catch (error: any) {
    console.error("Stripe Connect status error:", error);

    return NextResponse.json(
      {
        error:
          error?.message ||
          "Could not check Stripe Connect status. Check server logs.",
      },
      { status: 500 }
    );
  }
}