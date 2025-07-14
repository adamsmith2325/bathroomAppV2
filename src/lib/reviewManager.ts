// src/lib/reviewManager.ts
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as StoreReview from 'expo-store-review';

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
 * It will:
 *  - bump the counter for that event
 *  - if counter >= threshold && not shown yet → fire review prompt once
 */
export async function recordEvent(key: EventKey) {
  const { threshold, storageCountKey, storageShownKey } = RULES[key];

  // 1) increment counter
  const raw = await AsyncStorage.getItem(storageCountKey);
  const count = (parseInt(raw || '0', 10) || 0) + 1;
  await AsyncStorage.setItem(storageCountKey, String(count));

  // 2) bail if we've already shown for this key
  const shown = await AsyncStorage.getItem(storageShownKey);
  if (shown === 'true') return;

  // 3) if threshold reached, prompt & mark shown
  if (count >= threshold) {
    await askForReview();
    await AsyncStorage.setItem(storageShownKey, 'true');
  }
}
