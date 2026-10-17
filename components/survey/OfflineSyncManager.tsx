"use client";

import { useEffect, useRef } from "react";
import { syncAllOfflineSurveys } from "@/lib/offline/syncSurvey";
import { syncOfflineMedia } from "@/lib/offline/syncMedia";

export default function OfflineSyncManager() {
  const syncing = useRef(false);

  useEffect(() => {
    let mounted = true;

    async function syncEverything() {
      if (!mounted || !navigator.onLine || syncing.current) {
        return;
      }

      syncing.current = true;

      try {
        // Survey records are synchronized before media so the
        // parent survey exists before photo/voice rows are inserted.
        await syncAllOfflineSurveys();
        await syncOfflineMedia();
      } catch (error) {
        console.error("Offline sync failed:", error);
      } finally {
        syncing.current = false;
      }
    }

    function registerServiceWorker() {
      if ("serviceWorker" in navigator) {
        navigator.serviceWorker.register("/sw.js").catch((error) => {
          console.error("Service worker registration failed:", error);
        });
      }
    }

    registerServiceWorker();
    syncEverything();

    const handleOnline = () => {
      syncEverything();
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        syncEverything();
      }
    };

    window.addEventListener("online", handleOnline);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    const interval = window.setInterval(syncEverything, 30_000);

    return () => {
      mounted = false;
      window.removeEventListener("online", handleOnline);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.clearInterval(interval);
    };
  }, []);

  return null;
}
