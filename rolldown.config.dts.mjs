import { defineConfig } from "rolldown";
import { dts } from "rolldown-plugin-dts";

export default defineConfig({
  input: { bundle: "src/main.ts" },
  plugins: [
    dts({
      tsconfig: "tsconfig.json",
      emitDtsOnly: true,
    }),
  ],
  output: {
    dir: "dist",
    format: "es",
  },
});
