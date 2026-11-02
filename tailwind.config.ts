import type { Config } from "tailwindcss";

const pkGreen = {
  50: "#F2F9F4", 100: "#E8F4EC", 200: "#CFE8D8", 300: "#A3D4B5", 400: "#5FB383",
  500: "#1F8E4F", 600: "#0B6B2E", 700: "#05501F", 800: "#004A1F", 900: "#003A18", 950: "#00240F",
};
const pkRed = {
  50: "#FDECEC", 100: "#FBD9DA", 200: "#F5B0B3", 300: "#EE8086", 400: "#E44A52",
  500: "#DC2A31", 600: "#D71920", 700: "#B3141B", 800: "#8E1016", 900: "#6E0D11", 950: "#3F0709",
};
const neutral = {
  50: "#F7F8FA", 100: "#F1F2F6", 200: "#E7E9EE", 300: "#DDE1E8", 400: "#9AA3B2",
  500: "#5B6475", 600: "#4B5565", 700: "#3A4354", 800: "#283141", 900: "#0A0A0A", 950: "#0A0A0A",
};

export default {
  darkMode: ["class"],
  content: ["./client/index.html", "./client/src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Geist", "Noto Nastaliq Urdu", "system-ui", "-apple-system", "Segoe UI", "sans-serif"],
        heading: ["Geist", "Noto Nastaliq Urdu", "system-ui", "sans-serif"],
        mono: ["Geist Mono", "ui-monospace", "SFMono-Regular", "Menlo", "monospace"],
        arabic: ["Noto Nastaliq Urdu", "Geist", "sans-serif"],
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      colors: {
        // PakistanYP redesign: the whole app speaks Pakistan flag palette. Legacy
        // blue/indigo/purple/teal utilities resolve to Pakistan green, pink/rose to
        // Pakistani red, and gray/slate to the brand neutrals (gray-900 = ink).
        green: pkGreen,
        blue: pkGreen,
        indigo: pkGreen,
        violet: pkGreen,
        purple: pkGreen,
        sky: pkGreen,
        cyan: pkGreen,
        teal: pkGreen,
        red: pkRed,
        rose: pkRed,
        pink: pkRed,
        fuchsia: pkRed,
        gray: neutral,
        slate: neutral,
        zinc: neutral,
        brand: {
          green: "#0B6B2E",
          "green-dark": "#05501F",
          "green-tint": "#E8F4EC",
          "green-wash": "#F2F9F4",
          red: "#D71920",
          "red-dark": "#B3141B",
          ink: "#0A0A0A",
          page: "#FAF8F3",
          footer: "#F3F1EC",
          gold: "#F59E0B",
          muted: "#5B6475",
          body: "#3A4354",
          line: "#E7E9EE",
        },
        background: "var(--background)",
        foreground: "var(--foreground)",
        card: {
          DEFAULT: "var(--card)",
          foreground: "var(--card-foreground)",
        },
        popover: {
          DEFAULT: "var(--popover)",
          foreground: "var(--popover-foreground)",
        },
        primary: {
          DEFAULT: "var(--primary)",
          foreground: "var(--primary-foreground)",
        },
        secondary: {
          DEFAULT: "var(--secondary)",
          foreground: "var(--secondary-foreground)",
        },
        muted: {
          DEFAULT: "var(--muted)",
          foreground: "var(--muted-foreground)",
        },
        accent: {
          DEFAULT: "var(--accent)",
          foreground: "var(--accent-foreground)",
        },
        destructive: {
          DEFAULT: "var(--destructive)",
          foreground: "var(--destructive-foreground)",
        },
        border: "var(--border)",
        input: "var(--input)",
        ring: "var(--ring)",
        chart: {
          "1": "var(--chart-1)",
          "2": "var(--chart-2)",
          "3": "var(--chart-3)",
          "4": "var(--chart-4)",
          "5": "var(--chart-5)",
        },
        pk: {
          navy: "var(--pk-navy)",
          "navy-light": "var(--pk-navy-light)",
          "navy-dark": "var(--pk-navy-dark)",
          gold: "var(--pk-gold)",
          "gold-light": "var(--pk-gold-light)",
          "gold-dark": "var(--pk-gold-dark)",
          teal: "var(--pk-teal)",
          "teal-light": "var(--pk-teal-light)",
          "teal-dark": "var(--pk-teal-dark)",
          cream: "var(--pk-cream)",
          sand: "var(--pk-sand)",
          desert: "var(--pk-desert)",
          pearl: "var(--pk-pearl)",
          "light-gold": "var(--pk-light-gold)",
          charcoal: "var(--pk-charcoal)",
        },
        sidebar: {
          DEFAULT: "var(--sidebar-background)",
          foreground: "var(--sidebar-foreground)",
          primary: "var(--sidebar-primary)",
          "primary-foreground": "var(--sidebar-primary-foreground)",
          accent: "var(--sidebar-accent)",
          "accent-foreground": "var(--sidebar-accent-foreground)",
          border: "var(--sidebar-border)",
          ring: "var(--sidebar-ring)",
        },
      },
      keyframes: {
        "accordion-down": {
          from: {
            height: "0",
          },
          to: {
            height: "var(--radix-accordion-content-height)",
          },
        },
        "accordion-up": {
          from: {
            height: "var(--radix-accordion-content-height)",
          },
          to: {
            height: "0",
          },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate"), require("@tailwindcss/typography")],
} satisfies Config;
