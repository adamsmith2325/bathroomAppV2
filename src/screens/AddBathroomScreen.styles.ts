// src/screens/AddBathroomScreen.styles.ts
import { StyleSheet, TextStyle, ViewStyle } from 'react-native'

export interface Styles {
  container: ViewStyle
  mapContainer: ViewStyle
  form: ViewStyle
  input: TextStyle
  buttonContainer: ViewStyle
}

export default StyleSheet.create<Styles>({
  container: {
    flex: 1,
  },
  mapContainer: {
    flex: 1,
  },
  form: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    backgroundColor: 'transparent', // ThemedView parent will apply correct bg
  },
  input: {
    height: 44,
    borderWidth: 1,
    borderRadius: 8,
    marginBottom: 12,
    paddingHorizontal: 12,
  },
  buttonContainer: {
    marginTop: 8,
  },
})
