export const theme = {
  colors: {
    primary: '#3A7A10',
    secondary: '#D4AF37',
    accent: '#3A70B1',
    text: '#333333',
    textLight: '#666666',
    background: '#F8F8F8',
    backgroundLight: '#F0F0F0',
    white: '#FFFFFF',
    border: '#E5E5EA',
    shadow: '#000000',
    success: '#4CAF50',
    error: '#FF3B30',
    errorLight: '#FFEBEE',
    warning: '#FF9500',
    info: '#3A70B1',
    disabled: '#CCCCCC',
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
  },
  borderRadius: {
    sm: 4,
    md: 8,
    lg: 12,
    xl: 20,
    round: 9999,
  },
};

export type Theme = typeof theme;