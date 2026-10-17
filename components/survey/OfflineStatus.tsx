"use client";

import { Wifi, WifiOff } from "lucide-react";
import { useOnlineStatus } from "@/lib/offline/useOnlineStatus";

export default function OfflineStatus() {
  const isOnline = useOnlineStatus();

  if (isOnline) {
    return (
      <div className="flex items-center gap-2 rounded-full bg-green-50 px-3 py-1.5 text-sm font-medium text-green-700">
        <Wifi className="h-4 w-4" />
        Online
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 rounded-full bg-red-50 px-3 py-1.5 text-sm font-medium text-red-700">
      <WifiOff className="h-4 w-4" />
      Offline
    </div>
  );
}