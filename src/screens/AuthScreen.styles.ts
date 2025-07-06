import { ImageStyle, StyleSheet, TextStyle, ViewStyle } from 'react-native'

export interface Styles {
  container: ViewStyle
  logo: ImageStyle
  title: TextStyle
  card: ViewStyle
  input: TextStyle
  toggleText: TextStyle
  errorText: TextStyle
  buttonContainer: ViewStyle
}

const styles = StyleSheet.create<Styles>({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  logo: {
    width: 120,
    height: 120,
    marginBottom: 24,
    resizeMode: 'contain',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 16,
  },
  card: {
    width: '100%',
    maxWidth: 400,
    padding: 24,
    borderRadius: 16,
    // shadows
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  input: {
    height: 48,
    borderWidth: 1,
    borderRadius: 8,
    marginBottom: 16,
    paddingHorizontal: 16,
  },
  buttonContainer: {
    marginTop: 8,
  },
  toggleText: {
    marginTop: 16,
    textAlign: 'center',
  },
  errorText: {
    marginBottom: 12,
    textAlign: 'center',
  },
})

export default styles
