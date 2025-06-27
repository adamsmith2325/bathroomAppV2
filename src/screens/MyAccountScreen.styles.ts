import { Theme } from '../design/theme';

export const styles = {
  container: (theme: Theme) => ({
    flex: 1,
    backgroundColor: theme.colors.background,
    alignItems: 'center' as const,      // center horizontally
    justifyContent: 'center' as const,  // center vertically
  }),
  profileCard: {
    alignItems: 'center' as const,
    marginBottom: 16,
  },
  toggleRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    marginBottom: 16,
  },
};
