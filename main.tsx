import React from "react";
import { createRoot } from "react-dom/client";
import "@fontsource-variable/geist";
import "@fontsource-variable/geist-mono";
import "katex/dist/katex.min.css";
import "./app/globals.css";
import App from "./app/page";

console.log("[main] Synthetic TDA frontend starting");
console.log("[main] env:", { DEV: import.meta.env.DEV, VITE_API_URL: import.meta.env.VITE_API_URL });

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

console.log("[main] React root mounted");

// HMR accept — Vite handles this automatically via the React plugin,
// but this explicit handler logs when modules hot-reload so you can see it.
if (import.meta.hot) {
  import.meta.hot.on("vite:beforeUpdate", (payload) => {
    console.log("[HMR] updating:", payload.updates.map((u: any) => u.path).join(", "));
  });
  import.meta.hot.on("vite:afterUpdate", () => {
    console.log("[HMR] update applied");
  });
  import.meta.hot.on("vite:error", (err) => {
    console.error("[HMR] error:", err);
  });
}
