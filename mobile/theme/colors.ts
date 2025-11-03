// Flexoki Color Scheme for React Native
// Based on https://stephango.com/flexoki

export const FlexokiColors = {
  // Base colors
  black: '#100f0f',
  paper: '#fffcf0',

  // Base scale
  base: {
    50: '#f2f0e5',
    100: '#e6e4d9',
    150: '#dad8ce',
    200: '#cecdc3',
    300: '#b7b5ac',
    400: '#9f9d96',
    500: '#878580',
    600: '#6f6e69',
    700: '#575653',
    800: '#403e3c',
    850: '#343331',
    900: '#282726',
    950: '#1c1b1a',
  },

  // Accent colors
  red: {
    600: '#af3029',
    500: '#d14d41',
  },
  orange: {
    600: '#bc5215',
    500: '#da702c',
  },
  yellow: {
    600: '#ad8301',
    500: '#d0a215',
  },
  green: {
    600: '#66800b',
    500: '#879a39',
  },
  cyan: {
    600: '#24837b',
    500: '#3aa99f',
  },
  blue: {
    600: '#205ea6',
    500: '#4385be',
  },
  purple: {
    600: '#5e409d',
    500: '#8b7ec8',
  },
  magenta: {
    600: '#a02f6f',
    500: '#ce5d97',
  },
}

// Semantic color mappings for light and dark themes
export const LightTheme = {
  bg: FlexokiColors.paper,
  bg2: FlexokiColors.base[50],
  tx: FlexokiColors.black,
  tx2: FlexokiColors.base[600],
  tx3: FlexokiColors.base[300],
  ui: FlexokiColors.base[100],
  ui2: FlexokiColors.base[150],
  ui3: FlexokiColors.base[200],
  accent: '#af3029',
  accent2: '#3aa99f', 
}

export const DarkTheme = {
  bg: FlexokiColors.black,
  bg2: FlexokiColors.base[950],
  tx: FlexokiColors.base[200],
  tx2: FlexokiColors.base[500],
  tx3: FlexokiColors.base[700],
  ui: FlexokiColors.base[900],
  ui2: FlexokiColors.base[850],
  ui3: FlexokiColors.base[800],
  accent: '#af3029',
  accent2: '#24837b'
}

// Hook to get current theme colors based on color scheme
export const useThemeColors = (isDark: boolean) => {
  return isDark ? DarkTheme : LightTheme
}
