import { StyleSheet, ViewStyle } from 'react-native'

interface Styles {
  container: ViewStyle
  container2: ViewStyle
  loading: ViewStyle
  card: ViewStyle
  cardLeft: ViewStyle
  cardBody: ViewStyle
  cardRight: ViewStyle
  emptyContainer: ViewStyle
}

const styles = StyleSheet.create<Styles>({
  container: {
    flex: 1,
  },
    container2: {
    flex: 0,
    padding: 20,
    marginHorizontal: 16,
    marginVertical: 8,
  },
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 8,
    // elevation/shadow can be added inline via theme if desired
  },
  cardLeft: {
    width: 32,
    alignItems: 'center',
  },
  cardBody: {
    flex: 1,
    marginLeft: 12,
  },
  cardRight: {
    width: 32,
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
})

export default styles
