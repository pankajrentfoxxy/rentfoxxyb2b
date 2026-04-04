"use client";

import { useEffect, useState } from "react";

export function BidCountdown({ expiresAt }: { expiresAt: string }) {
  const [left, setLeft] = useState("");

  useEffect(() => {
    const end = new Date(expiresAt).getTime();
    const tick = () => {
      const ms = end - Date.now();
      if (ms <= 0) {
        setLeft("Expired");
        return;
      }
      const h = Math.floor(ms / 3600000);
      const m = Math.floor((ms % 3600000) / 60000);
      const s = Math.floor((ms % 60000) / 1000);
      setLeft(`${h}h ${m}m ${s}s`);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [expiresAt]);

  return <span className="font-mono text-sm font-semibold text-orange-700">{left}</span>;
}
