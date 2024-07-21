import type { Config } from "tailwindcss";
import plugin from "tailwindcss/plugin";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "gradient-conic":
          "conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))",
      },
      scrollbar: {
        'track': 'bg-transparent shadow-inner',
        'thumb': 'bg-black',
      },
      boxShadow: {
        'inset-custom': 'inset 0 0 70px 50px black',
      },
    },
  },
  plugins: [
    plugin(function({ addUtilities }) {
      const newUtilities = {
        '.scrollbar-track': {
          '-webkit-box-shadow': 'inset 0 0 6px rgba(0, 0, 0, 0.3)',
          'background-color': 'transparent',
        },
        '.scrollbar': {
          'width': '6px',
          'background-color': 'transparent',
        },
        '.scrollbar-thumb': {
          'background-color': '#000000',
        },
      };

      addUtilities(newUtilities);
    }),
  ],
};




export default config;
