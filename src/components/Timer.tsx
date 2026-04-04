import { useState, useEffect } from "react";

export const Timer = ({ isRunning, startTime }: { isRunning: boolean; startTime: number | null }) => {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (!isRunning || !startTime) return;
    const interval = setInterval(() => setElapsed(Date.now() - startTime), 200);
    return () => clearInterval(interval);
  }, [isRunning, startTime]);

  const totalSec = Math.floor(elapsed / 1000);
  const h = String(Math.floor(totalSec / 3600)).padStart(2, "0");
  const m = String(Math.floor((totalSec % 3600) / 60)).padStart(2, "0");
  const s = String(totalSec % 60).padStart(2, "0");

  return <span>{h}:{m}:{s}</span>;
};
