// src/screens/MapScreen.styles.ts
import { StyleSheet, TextStyle, ViewStyle } from 'react-native'

export interface Styles {
  container: ViewStyle
  keyboardAvoiding: ViewStyle
  scrollContainer: ViewStyle
  map: ViewStyle
  loadingText: TextStyle
  modalOverlay: ViewStyle
  adContainer: ViewStyle
  modalContainer: (padding: number) => ViewStyle
  card: (radius: number, padding: number) => ViewStyle
  headerText: (
    fontSize: number,
    fontWeight: TextStyle['fontWeight'],
    color: string
  ) => TextStyle
  subText: (
    fontSize: number,
    fontWeight: TextStyle['fontWeight'],
    color: string,
    marginTop?: number
  ) => TextStyle
  commentListContainer: ViewStyle
  commentText: (
    fontSize: number,
    fontWeight: TextStyle['fontWeight'],
    color: string
  ) => TextStyle
  commentInput: (borderColor: string, textColor: string) => TextStyle
  buttonSpacing: ViewStyle
  closeText: (
    fontSize: number,
    fontWeight: TextStyle['fontWeight'],
    color: string
  ) => TextStyle
}

const staticStyles = StyleSheet.create({
    // take up full screen
  keyboardAvoiding: {
    flex: 1,
  },
  // let inner content grow and center when no keyboard
  scrollContainer: {
    flexGrow: 1,
  },
  container: { flex: 1 },
  map: { flex: 1 },
  loadingText: { flex: 1, textAlign: 'center', marginTop: 100 },
  modalOverlay: { ...StyleSheet.absoluteFillObject, justifyContent: 'flex-end' },
  commentListContainer: { maxHeight: 200, marginBottom: 16 },
  buttonSpacing: { marginTop: 12 },
  adContainer: {
    position: 'absolute',
    bottom: 0,
    width: '100%',
    alignItems: 'center',
    paddingBottom: 8,
  },
})

const styles: Styles = {
  // static
  adContainer: staticStyles.adContainer,
  container: staticStyles.container,
  map: staticStyles.map,
  loadingText: staticStyles.loadingText,
  modalOverlay: staticStyles.modalOverlay,
  commentListContainer: staticStyles.commentListContainer,
  buttonSpacing: staticStyles.buttonSpacing,
  keyboardAvoiding: staticStyles.keyboardAvoiding,
  scrollContainer: staticStyles.scrollContainer,

  // dynamic
  modalContainer: (padding) => ({
    flex: 1,
    padding,
    paddingTop: 20,
  }),
  card: (radius, padding) => ({
    borderRadius: radius,
    padding,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  }),
  headerText: (fontSize, fontWeight, color) => ({
    fontSize,
    fontWeight,
    color,
    marginBottom: 12,
  }),
  subText: (fontSize, fontWeight, color, marginTop = 0) => ({
    fontSize,
    fontWeight,
    color,
    marginTop,
  }),
  commentText: (fontSize, fontWeight, color) => ({
    fontSize,
    fontWeight,
    color,
    marginVertical: 4,
  }),
  commentInput: (borderColor, textColor) => ({
    borderWidth: 1,
    borderColor,
    color: textColor,
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  }),
  closeText: (fontSize, fontWeight, color) => ({
    textAlign: 'center',
    fontSize,
    fontWeight,
    color,
    marginTop: 20,
  }),

}

export default styles
