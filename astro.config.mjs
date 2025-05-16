// @ts-check
import { defineConfig } from "astro/config";
import tailwindcss from "@tailwindcss/vite";

import mailObfuscation from "astro-mail-obfuscation";

// https://astro.build/config
export default defineConfig({
  site: "https://andrewlau624.github.io",
  base: "",

  vite: {
    plugins: [tailwindcss()],
  },

  server: { host: true, port: 3000 },
  integrations: [mailObfuscation()]
});