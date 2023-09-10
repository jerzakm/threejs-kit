import { defineConfig } from "vite";
import dts from "vite-plugin-dts";

export default defineConfig({
  build: {
    lib: {
      entry: "./src/index.ts",
      name: "Materials",
      formats: ["es"],
      fileName: "materials",
    },
  },
  plugins: [
    dts({
      insertTypesEntry: true,
    }),
  ],
});
