import { storage } from "./storage";
import { createMonobankService } from "./monobank";

const GRACE_PERIOD_DAYS = 2;

export async function checkSubscriptionStatuses(): Promise<void> {
  console.log("[Billing Scheduler] Checking Monobank subscription statuses...");
  
  const monobank = createMonobankService();
  if (!monobank) {
    console.log("[Billing Scheduler] Monobank not configured, skipping");
    return;
  }

  try {
    const activeSubscriptions = await storage.getActiveMonobankSubscriptions();
    console.log(`[Billing Scheduler] Found ${activeSubscriptions.length} active Monobank subscriptions to check`);

    for (const subscription of activeSubscriptions) {
      if (!subscription.monoSubscriptionId) continue;
      
      try {
        const status = await monobank.getSubscriptionStatus(subscription.monoSubscriptionId);
        console.log(`[Billing Scheduler] Subscription ${subscription.id} Monobank status: ${status.status}`);
        
        if (status.status === 'cancelled' || status.status === 'expired') {
          await handleSubscriptionFailure(subscription);
        }
      } catch (error: any) {
        console.error(`[Billing Scheduler] Error checking subscription ${subscription.id}:`, error.message);
      }
    }
  } catch (error) {
    console.error("[Billing Scheduler] Error checking subscription statuses:", error);
  }
}

async function handleSubscriptionFailure(subscription: any): Promise<void> {
  const now = new Date();
  
  if (subscription.status === 'active') {
    const graceUntil = new Date(now.getTime() + GRACE_PERIOD_DAYS * 24 * 60 * 60 * 1000);
    
    await storage.updateSubscription(subscription.id, {
      status: 'past_due',
      billingGraceUntil: graceUntil,
      lastBillingError: 'Monobank subscription payment failed or was cancelled',
      billingRetryCount: (subscription.billingRetryCount || 0) + 1,
    });
    
    console.log(`[Billing Scheduler] Subscription ${subscription.id} moved to past_due, grace period until ${graceUntil.toISOString()}`);
  }
}

export async function checkGracePeriodExpired(): Promise<void> {
  console.log("[Billing Scheduler] Checking expired grace periods...");

  try {
    const expiredSubscriptions = await storage.getExpiredGracePeriodSubscriptions();
    console.log(`[Billing Scheduler] Found ${expiredSubscriptions.length} expired grace periods`);

    for (const subscription of expiredSubscriptions) {
      console.log(`[Billing Scheduler] Downgrading subscription ${subscription.id} - grace period expired`);
      
      const freePlan = await storage.getDefaultFreePlan();
      if (freePlan) {
        await storage.updateSubscription(subscription.id, {
          planId: freePlan.id,
          status: 'active',
          billingRetryCount: 0,
          billingGraceUntil: null,
          lastBillingError: null,
          monoSubscriptionId: null,
        });
        console.log(`[Billing Scheduler] Downgraded subscription ${subscription.id} to free plan`);
      } else {
        await storage.updateSubscription(subscription.id, {
          status: 'expired',
        });
      }
    }
  } catch (error) {
    console.error("[Billing Scheduler] Error checking grace periods:", error);
  }
}

export function startBillingScheduler(): void {
  console.log("[Billing Scheduler] Starting billing scheduler...");
  
  setTimeout(() => {
    checkSubscriptionStatuses();
    checkGracePeriodExpired();
  }, 10000);

  setInterval(() => {
    checkSubscriptionStatuses();
  }, 60 * 60 * 1000);

  setInterval(() => {
    checkGracePeriodExpired();
  }, 6 * 60 * 60 * 1000);

  console.log("[Billing Scheduler] Scheduler started - subscription check every hour, grace period check every 6 hours");
}
