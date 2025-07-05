// src/screens/FavoritesScreen.styles.ts
import { TextStyle, ViewStyle } from 'react-native';

export interface Styles {
  /** Container that wraps the entire screen */
  container: (padding: number) => ViewStyle;
  /** Style for each favorite item text */
  itemText: (margin: number) => TextStyle;
}

const styles: Styles = {
  container: (spacing) => ({
    flex: 1,
    padding: spacing,
  }),
  itemText: (margin) => ({
    fontSize: 16,
    marginBottom: margin,
  }),
};

export default styles;
