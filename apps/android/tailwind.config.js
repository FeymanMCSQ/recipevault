/** @type {import('tailwindcss').Config} */
module.exports = {
    // NOTE: Update this to include the paths to all of your component files.
    content: ["./App.{js,jsx,ts,tsx}", "./src/**/*.{js,jsx,ts,tsx}"],
    presets: [require("nativewind/preset")],
    theme: {
        extend: {
            colors: {
                ivory: '#F9F7F2',
                charcoal: {
                    DEFAULT: '#2A2A2A',
                    muted: '#6B7280',
                },
                wine: '#6C2E2E',
                parchment: '#E2DCD2',
            },
        },
    },
    plugins: [],
}
