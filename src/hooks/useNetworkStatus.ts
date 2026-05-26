"use client";

import { useEffect, useState } from "react";

export function useNetworkStatus() {
  const [isOnline, setIsOnline] = useState(true);
  const [isSlow, setIsSlow] = useState(false);

  useEffect(() => {
    const updateOnline = () => setIsOnline(navigator.onLine);

    const connection = (
      navigator as Navigator & {
        connection?: {
          effectiveType?: string;
          addEventListener?: (type: string, listener: () => void) => void;
          removeEventListener?: (type: string, listener: () => void) => void;
        };
      }
    ).connection;

    const updateSlow = () => {
      const type = connection?.effectiveType;
      setIsSlow(type === "slow-2g" || type === "2g" || type === "3g");
    };

    updateOnline();
    updateSlow();

    window.addEventListener("online", updateOnline);
    window.addEventListener("offline", updateOnline);
    connection?.addEventListener?.("change", updateSlow);

    return () => {
      window.removeEventListener("online", updateOnline);
      window.removeEventListener("offline", updateOnline);
      connection?.removeEventListener?.("change", updateSlow);
    };
  }, []);

  return { isOnline, isSlow };
}
