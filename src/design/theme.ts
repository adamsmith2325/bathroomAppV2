// theme.ts
export type Theme = {
  colors: {
    primary: string;
    accent: string;
    background: string;
    surface: string;
    text: string;
    textSecondary: string;
    success: string;
    warning: string;
    error: string;
    onPrimary: string;
    border: string;
  };
  spacing: {
    xs: number;
    sm: number;
    md: number;
    lg: number;
    xl: number;
  };
  borderRadius: {
    sm: number;
    md: number;
    lg: number;
  };
  typography: {
    header: { fontSize: number; fontWeight: string };
    body: { fontSize: number; fontWeight: string };
    small: { fontSize: number; fontWeight: string };
  };
  shadows: { sm: string; md: string; lg: string };
};

export const lightTheme: Theme = {
  colors: {
    primary: '#4fd1c5',
    accent: '#68d391',
    background: '#f9fafb',
    surface: '#ffffff',
    text: '#111827',
    textSecondary: '#6b7280',
    success: '#34d399',
    warning: '#fbbf24',
    error: '#f87171',
    onPrimary: '#ffffff',
    border: '#e5e7eb',
  },
  spacing: { xs: 4, sm: 8, md: 16, lg: 24, xl: 32 },
  borderRadius: { sm: 8, md: 16, lg: 24 },
  typography: {
    header: { fontSize: 28, fontWeight: '700' },
    body: { fontSize: 18, fontWeight: '400' },
    small: { fontSize: 14, fontWeight: '300' },
  },
  shadows: {
    sm: '0px 1px 2px rgba(0,0,0,0.05)',
    md: '0px 4px 6px rgba(0,0,0,0.1)',
    lg: '0px 10px 15px rgba(0,0,0,0.1)',
  },
};

export const darkTheme: Theme = {
  ...lightTheme,
  colors: {
    ...lightTheme.colors,
    background: '#111827',
    surface: '#1f2937',
    text: '#f9fafb',
    textSecondary: '#9ca3af',
    onPrimary: '#111827',
    border: '#374151',
  },
};
