import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    setupFiles: ["./vitest.setup.ts"],
    // CI-only retry: real spring physics + vi.waitFor timing windows
    // intermittently drop 1-4 tests under CI load. Local runs stay strict
    // (no retry) so a real regression fails on the first try.
    retry: process.env.CI ? 1 : 0,
  },
});
