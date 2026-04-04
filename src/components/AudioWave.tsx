import { useEffect, useRef } from "react";

export const AudioWave = ({ active, barCount = 40 }: { active: boolean; barCount?: number }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const frameRef = useRef<number>(0);
  const timeRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const W = canvas.width;
    const H = canvas.height;

    const draw = () => {
      timeRef.current += 0.04;
      ctx.clearRect(0, 0, W, H);
      const barW = W / barCount;

      for (let i = 0; i < barCount; i++) {
        const x = i * barW;
        const centerDist = Math.abs(i - barCount / 2) / (barCount / 2);
        const wave1 = Math.sin(timeRef.current * 3 + i * 0.3) * 0.5 + 0.5;
        const wave2 = Math.sin(timeRef.current * 2.2 + i * 0.5) * 0.5 + 0.5;
        const wave3 = Math.sin(timeRef.current * 4 + i * 0.15) * 0.3 + 0.7;
        const envelope = active ? (1 - centerDist * 0.6) : 0.08;
        const h = Math.max(3, (wave1 * 0.4 + wave2 * 0.35 + wave3 * 0.25) * H * 0.8 * envelope);

        const gradient = ctx.createLinearGradient(x, H / 2 - h / 2, x, H / 2 + h / 2);
        gradient.addColorStop(0, active ? "rgba(255,145,20,0.9)" : "rgba(255,145,20,0.2)");
        gradient.addColorStop(0.5, active ? "rgba(255,200,90,1)" : "rgba(255,200,90,0.3)");
        gradient.addColorStop(1, active ? "rgba(255,145,20,0.9)" : "rgba(255,145,20,0.2)");

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.roundRect(x + 1.5, H / 2 - h / 2, barW - 3, h, 2);
        ctx.fill();
      }
      frameRef.current = requestAnimationFrame(draw);
    };

    draw();
    return () => cancelAnimationFrame(frameRef.current);
  }, [active, barCount]);

  return <canvas ref={canvasRef} width={600} height={80} style={{ width: "100%", height: 80, borderRadius: 12 }} />;
};
