import { Dimensions, StyleSheet } from 'react-native'

const { width } = Dimensions.get('window')

export default StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  keyboardAvoiding: {
    width: '100%',
    alignItems: 'center',
  },
  container: {
    width: width * 0.9,
    borderRadius: 16,
    overflow: 'hidden',
  },
  contentContainer: {
    paddingVertical: 24,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  slides: {
    marginBottom: 16,
    // Make sure your slides themselves size correctly
    alignItems: 'center',
  },
  pagination: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  paginationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#4b5563', // inactive
    marginHorizontal: 4,
  },
  paginationDotActive: {
    backgroundColor: '#2dd4bf', // active
  },
  actionBtn: {
    width: '60%',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 12,
  },
  actionBtnText: {
    fontWeight: '600',
  },
  closeBtn: {
    marginTop: 8,
    paddingVertical: 6,
  },
})
