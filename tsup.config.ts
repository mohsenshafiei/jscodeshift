import { defineConfig } from "tsup";

export default defineConfig({
  entry: {
    bin: "bin/jscodeshift.ts",
    Worker: "src/Worker.ts",
  },
  format: "cjs",
  sourcemap: true,
  clean: true,
  esbuildOptions(options, context) {
    options.platform = "node";
  },
});
