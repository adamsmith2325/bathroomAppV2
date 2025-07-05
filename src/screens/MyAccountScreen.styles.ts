// src/screens/MyAccountScreen.styles.ts
import { ImageStyle, StyleSheet, TextStyle, ViewStyle } from 'react-native'

export interface Styles {
  loading: ViewStyle
  input: TextStyle
  avatarPlaceholder: ViewStyle

  // dynamic:
  container: (padding: number) => ViewStyle
  header: (fontSize: number, fontWeight: TextStyle['fontWeight']) => TextStyle
  avatar: (size: number) => ImageStyle
}

const staticStyles = StyleSheet.create({
  loading: {
    flex: 1,
    justifyContent: 'center',
  },
  input: {
    fontSize: 16,
    marginVertical: 8,
    borderWidth: 1,
  },
  avatarPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginBottom: 16,
  },
})

const styles: Styles = {
  // static
  loading: staticStyles.loading,
  input: staticStyles.input,
  avatarPlaceholder: staticStyles.avatarPlaceholder,

  // dynamic
  container: (padding) => ({
    flex: 1,
    padding,
  }),
  header: (fontSize, fontWeight) => ({
    fontSize,
    fontWeight,
    marginVertical: 16,
  }),
  avatar: (size) => ({
    width: size * 2,
    height: size * 2,
    borderRadius: size,
    marginBottom: size,
  }),
}

export default styles
