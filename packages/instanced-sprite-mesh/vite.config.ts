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
    rollupOptions: {
      external: ["three"],
    },
  },
  plugins: [
    dts({
      insertTypesEntry: true,
    }),
  ],
});
