import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["esm", "cjs"],
  dts: true,
  outExtension({ format }) {
    if (format === "esm") return { js: ".mjs" };
    return { js: ".js" };
  },
});
