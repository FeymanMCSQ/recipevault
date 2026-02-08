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
                // Culinary Palette
                ivory: "#F3EFE7",
                parchment: "#E8E1D6",
                charcoal: "#1E1E1C",
                "charcoal-muted": "#4B463F",
                wine: "#6C2E2E",
                olive: "#5A6146",
                // Muted/Utility overrides
                gray: {
                    50: "#F9F8F6",
                    100: "#F3EFE7", // ivory
                    200: "#E8E1D6", // parchment
                    300: "#D6CFC4",
                    400: "#B8B0A5",
                    500: "#9A9288",
                    600: "#7D766C",
                    700: "#4B463F", // charcoal-muted
                    800: "#36322E",
                    900: "#1E1E1C", // charcoal
                },
                emerald: {
                    // Override emerald to be less "startup green", more natural
                    50: "#F2F5F1",
                    100: "#E1E8DE",
                    500: "#5A6146", // olive-ish
                    600: "#4B5239",
                    700: "#3C422D",
                }
            },
            fontFamily: {
                serif: ["Playfair Display", "Georgia", "serif"],
                sans: ["Inter", "system-ui", "sans-serif"],
            },
            boxShadow: {
                card: "0 2px 8px -2px rgba(30, 30, 28, 0.08)",
                "card-hover": "0 4px 12px -2px rgba(30, 30, 28, 0.12)",
            }
        },
    },
    plugins: [
        require('@tailwindcss/typography'),
    ],
};
export default config;
