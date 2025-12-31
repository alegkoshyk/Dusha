import { storage } from "./storage";
import { createMonobankService } from "./monobank";

const GRACE_PERIOD_DAYS = 2;
const MAX_RETRY_ATTEMPTS = 1;

interface BillingResult {
  success: boolean;
  error?: string;
  invoiceId?: string;
  pageUrl?: string;
}

export async function processRecurringBilling(): Promise<void> {
  console.log("[Billing Scheduler] Starting recurring billing check...");
  
  const monobank = createMonobankService();
  if (!monobank) {
    console.log("[Billing Scheduler] Monobank not configured, skipping");
    return;
  }

  try {
    const dueSubscriptions = await storage.getSubscriptionsDueForBilling();
    console.log(`[Billing Scheduler] Found ${dueSubscriptions.length} subscriptions due for billing`);

    for (const subscription of dueSubscriptions) {
      await processSubscriptionBilling(subscription, monobank);
    }
  } catch (error) {
    console.error("[Billing Scheduler] Error processing recurring billing:", error);
  }
}

async function processSubscriptionBilling(
  subscription: any,
  monobank: ReturnType<typeof createMonobankService>
): Promise<BillingResult> {
  if (!monobank) {
    return { success: false, error: "Monobank not configured" };
  }

  console.log(`[Billing Scheduler] Processing subscription ${subscription.id} for user ${subscription.userId}`);

  try {
    const plan = await storage.getSubscriptionPlan(subscription.planId);
    if (!plan) {
      console.error(`[Billing Scheduler] Plan ${subscription.planId} not found`);
      return { success: false, error: "Plan not found" };
    }

    if (plan.priceMonthly === 0) {
      console.log(`[Billing Scheduler] Free plan, skipping billing`);
      return { success: true };
    }

    const user = await storage.getUser(subscription.userId);
    if (!user) {
      console.error(`[Billing Scheduler] User ${subscription.userId} not found`);
      return { success: false, error: "User not found" };
    }

    const amount = subscription.billingPeriod === "yearly" 
      ? plan.priceYearly 
      : plan.priceMonthly;

    if (!amount) {
      console.log(`[Billing Scheduler] No price for billing period ${subscription.billingPeriod}`);
      return { success: false, error: "No price configured" };
    }

    const baseUrl = process.env.REPLIT_DOMAINS?.split(",")[0] || "localhost:5000";
    const protocol = baseUrl.includes("localhost") ? "http" : "https";

    const reference = `SUB-${subscription.id}-${Date.now()}`;
    const description = `Продовження підписки "${plan.displayName}" (${subscription.billingPeriod === "yearly" ? "рік" : "місяць"})`;

    const invoice = await monobank.createInvoice({
      amount,
      reference,
      destination: description,
      redirectUrl: `${protocol}://${baseUrl}/profile?tab=subscription&billing=success`,
      webhookUrl: `${protocol}://${baseUrl}/api/payments/webhook`,
      validity: 86400 * 2,
    });

    await storage.createPaymentHistory({
      userId: subscription.userId,
      subscriptionId: subscription.id,
      planId: plan.id,
      amount,
      currency: plan.currency,
      status: "pending",
      paymentMethod: "monobank",
      description,
      billingPeriod: subscription.billingPeriod,
      monoInvoiceId: invoice.invoiceId,
      monoPageUrl: invoice.pageUrl,
      monoReference: reference,
      metadata: { autoRecurring: true, subscriptionId: subscription.id },
    });

    await storage.updateSubscriptionBillingAttempt(subscription.id, {
      lastBillingAttempt: new Date(),
      billingRetryCount: (subscription.billingRetryCount || 0) + 1,
    });

    console.log(`[Billing Scheduler] Created invoice ${invoice.invoiceId} for subscription ${subscription.id}`);
    
    return { 
      success: true, 
      invoiceId: invoice.invoiceId,
      pageUrl: invoice.pageUrl
    };

  } catch (error: any) {
    console.error(`[Billing Scheduler] Error billing subscription ${subscription.id}:`, error);
    
    const retryCount = (subscription.billingRetryCount || 0) + 1;
    const now = new Date();
    
    let graceUntil = subscription.billingGraceUntil;
    if (!graceUntil && retryCount >= MAX_RETRY_ATTEMPTS) {
      graceUntil = new Date(now.getTime() + GRACE_PERIOD_DAYS * 24 * 60 * 60 * 1000);
    }

    await storage.updateSubscriptionBillingAttempt(subscription.id, {
      lastBillingAttempt: now,
      lastBillingError: error.message || "Unknown error",
      billingRetryCount: retryCount,
      billingGraceUntil: graceUntil,
      status: graceUntil ? "past_due" : subscription.status,
    });

    return { success: false, error: error.message };
  }
}

export async function checkGracePeriodExpired(): Promise<void> {
  console.log("[Billing Scheduler] Checking expired grace periods...");

  try {
    const expiredSubscriptions = await storage.getExpiredGracePeriodSubscriptions();
    console.log(`[Billing Scheduler] Found ${expiredSubscriptions.length} expired grace periods`);

    for (const subscription of expiredSubscriptions) {
      console.log(`[Billing Scheduler] Suspending subscription ${subscription.id} - grace period expired`);
      
      await storage.updateSubscription(subscription.id, {
        status: "expired",
      });

      const freePlan = await storage.getDefaultFreePlan();
      if (freePlan) {
        await storage.updateSubscription(subscription.id, {
          planId: freePlan.id,
          status: "active",
          billingRetryCount: 0,
          billingGraceUntil: null,
          lastBillingError: null,
        });
        console.log(`[Billing Scheduler] Downgraded subscription ${subscription.id} to free plan`);
      }
    }
  } catch (error) {
    console.error("[Billing Scheduler] Error checking grace periods:", error);
  }
}

export function startBillingScheduler(): void {
  console.log("[Billing Scheduler] Starting billing scheduler...");
  
  processRecurringBilling();
  checkGracePeriodExpired();

  setInterval(() => {
    processRecurringBilling();
  }, 60 * 60 * 1000);

  setInterval(() => {
    checkGracePeriodExpired();
  }, 6 * 60 * 60 * 1000);

  console.log("[Billing Scheduler] Scheduler started - billing check every hour, grace period check every 6 hours");
}
