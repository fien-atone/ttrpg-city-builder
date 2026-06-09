import { useCallback, useEffect, useRef } from 'react';
import type { SimResult } from '../domain/types';
import { COLORS } from '../lib/ui';
import { useI18n } from '../i18n/I18nContext';

interface Props {
  sim: SimResult;
  selectedYear: number;
}

export function ChartView({ sim, selectedYear }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { fmt } = useI18n();

  const draw = useCallback(() => {
    const cv = canvasRef.current;
    if (!cv) return;
    const ctx = cv.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const w = cv.clientWidth;
    const h = cv.clientHeight;
    if (w === 0 || h === 0) return;
    cv.width = w * dpr;
    cv.height = h * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);

    const P = sim.points;
    if (P.length === 0) return;
    const pad = { l: 52, r: 12, t: 14, b: 24 };
    const maxVal =
      Math.max(...P.map((p) => Math.max(p.population, p.capacity))) * 1.05 || 1;
    const X = (year: number) => pad.l + (year / sim.years) * (w - pad.l - pad.r);
    const Y = (v: number) => h - pad.b - (v / maxVal) * (h - pad.t - pad.b);

    // grid + Y labels
    ctx.strokeStyle = '#2a313b';
    ctx.fillStyle = COLORS.muted;
    ctx.font = '10px sans-serif';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 4; i++) {
      const v = (maxVal * i) / 4;
      const yy = Y(v);
      ctx.beginPath();
      ctx.moveTo(pad.l, yy);
      ctx.lineTo(w - pad.r, yy);
      ctx.stroke();
      ctx.fillText(fmt(v), 6, yy + 3);
    }
    const step = Math.max(10, Math.round(sim.years / 10 / 10) * 10);
    for (let g = 0; g <= sim.years; g += step) {
      ctx.fillText(String(g), X(g) - 4, h - 8);
    }

    // capacity (dashed)
    ctx.strokeStyle = COLORS.line;
    ctx.setLineDash([4, 4]);
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    P.forEach((p, i) =>
      i ? ctx.lineTo(X(p.year), Y(p.capacity)) : ctx.moveTo(X(p.year), Y(p.capacity)),
    );
    ctx.stroke();
    ctx.setLineDash([]);

    // population line + fill
    ctx.strokeStyle = COLORS.accent;
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    P.forEach((p, i) =>
      i ? ctx.lineTo(X(p.year), Y(p.population)) : ctx.moveTo(X(p.year), Y(p.population)),
    );
    ctx.stroke();
    ctx.lineTo(X(sim.years), Y(0));
    ctx.lineTo(X(0), Y(0));
    ctx.closePath();
    ctx.fillStyle = 'rgba(224,164,88,.10)';
    ctx.fill();

    // shocks
    sim.events.forEach((e) => {
      const p = P[Math.min(e.year, P.length - 1)];
      if (!p) return;
      ctx.fillStyle = COLORS.bad;
      ctx.beginPath();
      ctx.arc(X(e.year), Y(p.population), 3.2, 0, Math.PI * 2);
      ctx.fill();
    });

    // selected-year cursor
    const sy = Math.min(selectedYear, P.length - 1);
    const sp = P[sy];
    ctx.strokeStyle = COLORS.accent2;
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(X(sp.year), pad.t);
    ctx.lineTo(X(sp.year), h - pad.b);
    ctx.stroke();
    ctx.fillStyle = COLORS.accent2;
    ctx.beginPath();
    ctx.arc(X(sp.year), Y(sp.population), 4.5, 0, Math.PI * 2);
    ctx.fill();
  }, [sim, selectedYear, fmt]);

  useEffect(() => {
    draw();
  }, [draw]);

  useEffect(() => {
    const cv = canvasRef.current;
    if (!cv) return;
    const ro = new ResizeObserver(() => draw());
    ro.observe(cv);
    return () => ro.disconnect();
  }, [draw]);

  return <canvas ref={canvasRef} className="chart" />;
}
