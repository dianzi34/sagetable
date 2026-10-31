import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        paper: "var(--paper, #ffffff)",
        ink: "var(--ink, #232323)",
        muted: "var(--muted, #6b6b6b)",
        line: "var(--line, #e6e6e6)",
        grid: "var(--grid, #eef0f3)",
        table: "var(--table, #f2efea)",
        "table-edge": "var(--table-edge, #e0dbd3)",
        leg: "var(--leg, #d8d2c9)",
        slip: "var(--slip, #fffdf6)",
        blue: {
          action: "var(--blue, #2d5be3)",
        },
        danger: "var(--danger, #b3362c)",
      },
      fontFamily: {
        heading: ["Bricolage Grotesque", "Figtree", "sans-serif"],
        sans: ["Figtree", "system-ui", "-apple-system", "sans-serif"],
        serif: ["Literata", "Georgia", "serif"],
      },
      borderRadius: {
        card: "255px 18px 225px 18px / 18px 225px 18px 255px",
        slip: "4px 12px 10px 4px",
      },
    },
  },
  plugins: [],
};

export default config;
