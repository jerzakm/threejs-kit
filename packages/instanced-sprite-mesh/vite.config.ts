import { defineConfig } from "vite";
import dts from "vite-plugin-dts";

export default defineConfig({
  build: {
    lib: {
      entry: "./src/index.ts",
      name: "InstancedSpriteMesh",
      formats: ["es"],
      fileName: "index",
    },
  },
  plugins: [
    dts({
      insertTypesEntry: true,
    }),
  ],
});
