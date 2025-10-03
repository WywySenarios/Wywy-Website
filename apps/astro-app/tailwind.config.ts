import { type Config } from "tailwindcss";
import fontFamily from "tailwindcss/defaultTheme";

const config: Config = {
  content: [
    "./src/**/*.{ts,tsx,js,jsx,astro,mdx}", // adjust to your project
  ],
  theme: {
    // extend: {
    //   fontFamily: {
    //     sans: ["var(--font-sans)", ...fontFamily.sans],
    //   },
    // },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;
