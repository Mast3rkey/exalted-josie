import Stripe from "stripe";
import { NextResponse } from "next/server";
import { issueDownloadToken } from "../../../lib/downloadTokens";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-12-15.clover",
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const session_id = body?.session_id as string | undefined;

    if (!session_id) {
      return NextResponse.json({ error: "Missing session_id" }, { status: 400 });
    }

    const session = await stripe.checkout.sessions.retrieve(session_id, {
      expand: ["line_items"],
    });

    if (session.payment_status !== "paid") {
      return NextResponse.json({ error: "Payment not confirmed" }, { status: 403 });
    }

    // Optional but recommended: confirm the exact price purchased
    const expectedPriceId = process.env.STRIPE_PRICE_ID;
    const lineItem = session.line_items?.data?.[0];
    const paidPriceId = (lineItem?.price?.id ?? null) as string | null;

    if (expectedPriceId && (!paidPriceId || paidPriceId !== expectedPriceId)) {
      return NextResponse.json({ error: "Invalid purchase item" }, { status: 403 });
    }

    const token = await issueDownloadToken({
      stripeSessionId: session.id,
      customerEmail: session.customer_details?.email ?? null,
      hoursValid: 72,
      maxDownloads: 3,
    });

    return NextResponse.json({ token });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Token creation failed" }, { status: 500 });
  }
}
