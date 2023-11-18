const colors = require('tailwindcss/colors');
const starlightPlugin = require('@astrojs/starlight-tailwind');

// Generated color palettes
const accent = { 200: '#dcc78c', 600: '#836800', 900: '#3f3000', 950: '#2d2200' };
const gray = { 100: '#f6f6f6', 200: '#eeeded', 300: '#c2c2c1', 400: '#8c8b8b', 500: '#585857', 700: '#383838', 800: '#272726', 900: '#181818' };

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
  theme: {
    extend: {
      colors: { accent, gray }
    },
  },
  plugins: [starlightPlugin()],
};

