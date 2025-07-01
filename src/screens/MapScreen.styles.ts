import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  map: {
    flex: 1,
  },
  loadingText: {
    flex: 1,
    textAlign: 'center',
    textAlignVertical: 'center',
  },
    adContainer: {
    position: 'absolute',
    bottom: 0,
    width: '100%',
    alignItems: 'center',
    // on narrow screens FULL_BANNER is 468×60; on phones it'll auto-scale
    paddingBottom: 8,
  }
});
