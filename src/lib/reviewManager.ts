// src/lib/reviewManager.ts
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as StoreReview from 'expo-store-review';
import { showInterstitialAd } from './adService';

type EventKey = 'viewBathroom' | 'addBathroom' | 'markUsed';

interface Rule {
  threshold: number;
  storageCountKey: string;
  storageShownKey: string;
}

const RULES: Record<EventKey, Rule> = {
  viewBathroom: {
    threshold: 3,
    storageCountKey: '@@review_count_viewBathroom',
    storageShownKey: '@@review_shown_viewBathroom',
  },
  addBathroom: {
    threshold: 1,
    storageCountKey: '@@review_count_addBathroom',
    storageShownKey: '@@review_shown_addBathroom',
  },
  markUsed: {
    threshold: 5,
    storageCountKey: '@@review_count_markUsed',
    storageShownKey: '@@review_shown_markUsed',
  },
};

/** Safely ask for review if available */
async function askForReview() {
  if (await StoreReview.isAvailableAsync()) {
    await StoreReview.requestReview();
  }
}

/**
 * Call this whenever one of your key events happens.
 * If the user is a premium subscriber, nothing happens.
 * Otherwise, it:
 *  - bumps the counter for that event
 *  - once ≥ threshold, shows review prompt exactly once
 *  - every subsequent 3rd time (after threshold) it fires an interstitial ad
 */
export async function recordEvent(
  key: EventKey,
  isPremium: boolean
): Promise<void> {
  if (isPremium) {
    // premium users get neither review nor ads
    return;
  }

  const { threshold, storageCountKey, storageShownKey } = RULES[key];

  // 1) increment counter
  const raw = await AsyncStorage.getItem(storageCountKey);
  const count = (parseInt(raw || '0', 10) || 0) + 1;
  await AsyncStorage.setItem(storageCountKey, String(count));

  // 2) if we've already shown the review prompt once, show an interstitial every 3rd event
  const shown = await AsyncStorage.getItem(storageShownKey);
  if (shown === 'true') {
    if (count > threshold && count % 3 === 0) {
      showInterstitialAd();
    }
    return;
  }

  // 3) otherwise if threshold just reached, prompt review and mark it shown
  if (count >= threshold) {
    await askForReview();
    await AsyncStorage.setItem(storageShownKey, 'true');
  }
}
