// src/components/WelcomeModal.styles.ts
import { Dimensions, Platform, StyleSheet } from 'react-native';

const { width, height } = Dimensions.get('window');

export default StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)', // semi-opaque backdrop
    justifyContent: 'center',            // vertical center
    alignItems: 'center',                // horizontal center
    paddingHorizontal: 16,               // safe side padding
    // on iOS the notch is larger, so push the card down a bit
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
  },

  card: {
    width: width - 32,                   // leave side margins
    maxHeight: height - 120,             // leave room at top & bottom
    backgroundColor: '#fff',             // will get overwritten by theme
    borderRadius: 16,
    overflow: 'hidden',                  // clip the dots & buttons
  },

  content: {
    padding: 24,                         // inner padding all around
  },

  title: {
    fontSize: 24,
    fontWeight: '600',
    marginBottom: 12,
  },

  description: {
    fontSize: 16,
    lineHeight: 22,
    marginBottom: 20,
  },

  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 12,
  },

  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#888',            // inactive dot
    marginHorizontal: 4,
  },

  activeDot: {
    backgroundColor: '#fff',            // active dot
  },

  button: {
    alignSelf: 'center',
    marginBottom: 16,
  },
});
