// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - TanStack devtools (dev-only, first), tanstackStart, viteReact, tailwindcss, tsConfigPaths,
//     nitro (build-only using cloudflare as a default target), VITE_* env injection, @ path alias,
//     React/TanStack dedupe, error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... }, etc... }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";

// Configure Nitro to target Vercel so TanStack Start server functions are emitted in a
// Vercel-compatible build output. We keep the existing `server.entry` override and
// add the Nitro preset both under `tanstackStart` and at the top-level to be resilient
// to how the wrapper merges configuration.
export default defineConfig({
  tanstackStart: {
    // Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
    // nitro/vite builds from this
    server: { entry: "server" },
    // Request Nitro to build with the Vercel preset so the output matches Vercel's
    // Serverless / Build Output API expectations.
    nitro: {
      preset: "vercel",
    },
  },
  // Some wrappers merge top-level Nitro config; include it here as well for safety.
  nitro: {
    preset: "vercel",
  },
});
