import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: "2024-06-20" });
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(req: NextRequest) {
  const body = await req.text();
  const sig = req.headers.get("stripe-signature")!;

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  const supabase = await createServerSupabaseClient();

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      const userId = session.metadata?.userId;
      const plan = session.metadata?.plan;
      if (userId && plan) {
        await supabase.from("subscriptions").upsert({
          user_id: userId,
          plan,
          status: "active",
          stripe_subscription_id: session.subscription as string,
          current_period_end: null,
        }, { onConflict: "user_id" });
      }
      break;
    }
    case "customer.subscription.updated": {
      const sub = event.data.object as Stripe.Subscription;
      const customerId = sub.customer as string;
      const { data: userRow } = await supabase.from("users").select("id").eq("stripe_customer_id", customerId).single();
      if (userRow) {
        await supabase.from("subscriptions").update({
          status: sub.status === "active" ? "active" : sub.status === "past_due" ? "past_due" : "canceled",
          current_period_end: new Date(sub.current_period_end * 1000).toISOString(),
        }).eq("user_id", userRow.id);
      }
      break;
    }
    case "customer.subscription.deleted": {
      const sub = event.data.object as Stripe.Subscription;
      const customerId = sub.customer as string;
      const { data: userRow } = await supabase.from("users").select("id").eq("stripe_customer_id", customerId).single();
      if (userRow) {
        await supabase.from("subscriptions").update({ status: "canceled", plan: "free" }).eq("user_id", userRow.id);
      }
      break;
    }
  }

  return NextResponse.json({ received: true });
}
