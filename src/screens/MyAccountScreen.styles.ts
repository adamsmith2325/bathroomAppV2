// src/screens/MyAccountScreen.styles.ts
import { ImageStyle, StyleSheet, TextStyle, ViewStyle } from 'react-native'

interface Styles {
  container: ViewStyle
  loading: ViewStyle
  avatarBase: ImageStyle
  avatarPlaceholder: ViewStyle
  headerBase: TextStyle
  field: ViewStyle
  inputBase: TextStyle
}

export default StyleSheet.create<Styles>({
  // center everything vertically + standard padding:
  container: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
  },
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarBase: {
    alignSelf: 'center',
  },
  avatarPlaceholder: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignSelf: 'center',
  },
  headerBase: {
    textAlign: 'center',
    // you can also add a bit of bottom margin here if you like:
    marginBottom: 24,
  },
  // more vertical space between each field
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginVertical: 16, // increased from 8/16
  },
  inputBase: {
    height: 40,
    borderWidth: 1,
  },
})
