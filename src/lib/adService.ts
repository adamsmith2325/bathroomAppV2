// src/lib/adService.ts
import {
    AdEventType,
    InterstitialAd,
    TestIds,
} from 'react-native-google-mobile-ads';

const unitId = __DEV__
  ? TestIds.INTERSTITIAL
  : 'ca-app-pub-5901242452853695/5702555640'; // ← replace YYY with your real interstitial unit ID

// create one singleton interstitial
const interstitial = InterstitialAd.createForAdRequest(unitId, {
  requestNonPersonalizedAdsOnly: false,
});

let isLoaded = false;

// listen for events
interstitial.addAdEventListener(AdEventType.LOADED, () => {
  isLoaded = true;
});
interstitial.addAdEventListener(AdEventType.CLOSED, () => {
  isLoaded = false;
  interstitial.load();  // preload next
});

// kick off initial load
interstitial.load();

/**
 * Call this whenever you want to show an interstitial.
 */
export function showInterstitialAd() {
  if (isLoaded) {
    interstitial.show();
  } else {
    // not loaded yet, try loading again for next time
    interstitial.load();
  }
}
