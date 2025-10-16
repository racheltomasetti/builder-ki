/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        // Flexoki semantic colors
        "flexoki-bg": "var(--bg)",
        "flexoki-bg-2": "var(--bg-2)",
        "flexoki-tx": "var(--tx)",
        "flexoki-tx-2": "var(--tx-2)",
        "flexoki-tx-3": "var(--tx-3)",
        "flexoki-ui": "var(--ui)",
        "flexoki-ui-2": "var(--ui-2)",
        "flexoki-ui-3": "var(--ui-3)",
        "flexoki-accent": "var(--accent)",
        "flexoki-accent-2": "var(--accent-2)",
      },
    },
  },
  plugins: [],
};
