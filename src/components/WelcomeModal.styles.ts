// src/components/WelcomeModal.styles.ts
import { StyleSheet } from 'react-native'

export default StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    // centre the card vertically & horizontally:
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: {
    backgroundColor: '#1E293B',    // or theme.surface
    padding: 24,
    borderRadius: 16,
    // make it responsive instead of hard-coding:
    width: '90%',
    maxWidth: 400,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFF',
    // allow wrapping if it's too long:
    flexShrink: 1,
    textAlign: 'center',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 16,
    color: '#CBD5E1',
    textAlign: 'center',
    marginBottom: 16,
  },
    button: {
    alignSelf: 'stretch',
},
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginHorizontal: 4,
  },
    slide: {
    justifyContent: 'center',
    paddingHorizontal: 10,
  },
})
