"use client";

import { useEffect } from "react";

export default function PWARegister() {
  useEffect(() => {
    if (
      typeof window !== "undefined" &&
      "serviceWorker" in navigator &&
      window.workbox !== undefined
    ) {
      const wb = window.workbox;

      const promptNewVersionAvailable = () => {
        // eslint-disable-next-line no-console
        console.log(
          `A new version of Expense Tracker is available. Please refresh the page to update.`
        );
        // You can show a notification to the user here
        if (confirm("A new version is available. Refresh to update?")) {
          window.location.reload();
        }
      };

      wb.addEventListener("controlling", () => {
        window.location.reload();
      });

      wb.addEventListener("waiting", promptNewVersionAvailable);

      // never forget to call register as auto register is turned off in next.config.js
      wb.register();
    } else if (
      typeof window !== "undefined" &&
      "serviceWorker" in navigator
    ) {
      // Fallback for manual service worker registration
      navigator.serviceWorker
        .register("/sw.js")
        .then((registration) => {
          console.log("Service Worker registered successfully:", registration);
        })
        .catch((error) => {
          console.log("Service Worker registration failed:", error);
        });
    }
  }, []);

  return null;
}