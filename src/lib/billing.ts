// src/lib/billing.ts
import {
    Subscription,
    getSubscriptions,
    initConnection,
    requestSubscription
} from 'react-native-iap';

const SUBSCRIPTION_IDS = ['adFreeSubBathroomInApp']; // ← your actual product IDs

/**
 * Initialize the IAP module. Call this once on app start.
 */
export async function initIAP(): Promise<void> {
  try {
    const result = await initConnection();
    console.log('IAP initialized', result);
  } catch (err) {
    console.error('Failed to init IAP', err);
  }
}

/**
 * Fetch subscription plans (SKUs) from the store.
 */
export async function fetchPlans(): Promise<Subscription[]> {
  try {
    const subscriptions: Subscription[] = await getSubscriptions({
      skus: SUBSCRIPTION_IDS,
    });
    console.log('Available subscriptions:', subscriptions);
    return subscriptions;
  } catch (err) {
    console.error('Error fetching subscriptions', err);
    return [];
  }
}

/**
 * Request purchase of a subscription.
 * @param sku the subscription ID to purchase
 */
export async function purchasePremium(sku: string): Promise<void> {
  try {
    // Note: requestSubscription expects an object with `sku`
    await requestSubscription({ sku });
    console.log('Subscription requested for', sku);
  } catch (err) {
    console.error('Error requesting subscription', err);
    throw err;
  }
}
