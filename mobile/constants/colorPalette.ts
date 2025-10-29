// Color palette based on design/COLOR-SCHEME.md
// Each color has two variants for light and dark themes

export interface ColorPaletteItem {
  id: string;
  name: string;
  hex: string;
  lightTheme: string; // CSS class name for light theme
  darkTheme: string; // CSS class name for dark theme
}

export const COLOR_PALETTE: ColorPaletteItem[] = [
  // 600 series (darker shades)
  {
    id: "red-600",
    name: "Red",
    hex: "#AF3029",
    lightTheme: "re",
    darkTheme: "re-2",
  },
  {
    id: "orange-600",
    name: "Orange",
    hex: "#BC5215",
    lightTheme: "or",
    darkTheme: "or-2",
  },
  {
    id: "yellow-600",
    name: "Yellow",
    hex: "#AD8301",
    lightTheme: "ye",
    darkTheme: "ye-2",
  },
  {
    id: "green-600",
    name: "Green",
    hex: "#66800B",
    lightTheme: "gr",
    darkTheme: "gr-2",
  },
  {
    id: "cyan-600",
    name: "Cyan",
    hex: "#24837B",
    lightTheme: "cy",
    darkTheme: "cy-2",
  },
  {
    id: "blue-600",
    name: "Blue",
    hex: "#205EA6",
    lightTheme: "bl",
    darkTheme: "bl-2",
  },
  {
    id: "purple-600",
    name: "Purple",
    hex: "#5E409D",
    lightTheme: "pu",
    darkTheme: "pu-2",
  },
  {
    id: "magenta-600",
    name: "Magenta",
    hex: "#A02F6F",
    lightTheme: "ma",
    darkTheme: "ma-2",
  },
  // 400 series (lighter shades)
  {
    id: "red-400",
    name: "Light Red",
    hex: "#D14D41",
    lightTheme: "re-2",
    darkTheme: "re",
  },
  {
    id: "orange-400",
    name: "Light Orange",
    hex: "#DA702C",
    lightTheme: "or-2",
    darkTheme: "or",
  },
  {
    id: "yellow-400",
    name: "Light Yellow",
    hex: "#D0A215",
    lightTheme: "ye-2",
    darkTheme: "ye",
  },
  {
    id: "green-400",
    name: "Light Green",
    hex: "#879A39",
    lightTheme: "gr-2",
    darkTheme: "gr",
  },
  {
    id: "cyan-400",
    name: "Light Cyan",
    hex: "#3AA99F",
    lightTheme: "cy-2",
    darkTheme: "cy",
  },
  {
    id: "blue-400",
    name: "Light Blue",
    hex: "#4385BE",
    lightTheme: "bl-2",
    darkTheme: "bl",
  },
  {
    id: "purple-400",
    name: "Light Purple",
    hex: "#8B7EC8",
    lightTheme: "pu-2",
    darkTheme: "pu",
  },
  {
    id: "magenta-400",
    name: "Light Magenta",
    hex: "#CE5D97",
    lightTheme: "ma-2",
    darkTheme: "ma",
  },
];

// Helper function to get color by theme
export const getColorForTheme = (
  colorId: string,
  isDark: boolean
): string => {
  const color = COLOR_PALETTE.find((c) => c.id === colorId);
  if (!color) return "#AF3029"; // Default to red-600
  return color.hex;
};
