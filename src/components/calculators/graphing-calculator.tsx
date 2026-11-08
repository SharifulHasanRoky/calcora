"use client";

import * as React from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Plus, X, ZoomIn, ZoomOut, Crosshair } from "lucide-react";
import { evaluate } from "@/lib/math-engine";
import { toast } from "sonner";

interface FnDef {
  id: string;
  expr: string; // expression in terms of x
  color: string;
}

const COLORS = ["#635BFF", "#16A34A", "#EF4444", "#F59E0B", "#06B6D4", "#8B5CF6"];

export function GraphingCalculator() {
  const [fns, setFns] = React.useState<FnDef[]>([
    { id: "f1", expr: "sin(x)", color: COLORS[0] },
    { id: "f2", expr: "x^2 / 10", color: COLORS[1] },
  ]);
  const [xRange, setXRange] = React.useState(20); // -xRange..+xRange
  const [yRange, setYRange] = React.useState(10);
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const containerRef = React.useRef<HTMLDivElement>(null);
  const [size, setSize] = React.useState({ w: 600, h: 400 });

  React.useEffect(() => {
    const update = () => {
      if (containerRef.current) {
        const w = containerRef.current.clientWidth;
        setSize({ w, h: Math.max(320, Math.min(500, w * 0.6)) });
      }
    };
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  React.useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = size.w * dpr;
    canvas.height = size.h * dpr;
    canvas.style.width = `${size.w}px`;
    canvas.style.height = `${size.h}px`;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.scale(dpr, dpr);

    // Background
    const isDark = document.documentElement.classList.contains("dark");
    const bg = isDark ? "#0F1525" : "#FFFFFF";
    const fg = isDark ? "#F1F5F9" : "#111827";
    const grid = isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)";
    const axis = isDark ? "rgba(255,255,255,0.3)" : "rgba(0,0,0,0.3)";

    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, size.w, size.h);

    const xMin = -xRange, xMax = xRange;
    const yMin = -yRange, yMax = yRange;
    const toPx = (x: number, y: number) => ({
      px: ((x - xMin) / (xMax - xMin)) * size.w,
      py: size.h - ((y - yMin) / (yMax - yMin)) * size.h,
    });

    // Grid
    ctx.strokeStyle = grid;
    ctx.lineWidth = 1;
    ctx.beginPath();
    const xStep = xRange <= 5 ? 1 : xRange <= 20 ? 2 : 5;
    const yStep = yRange <= 5 ? 1 : yRange <= 20 ? 2 : 5;
    for (let x = Math.ceil(xMin / xStep) * xStep; x <= xMax; x += xStep) {
      const { px } = toPx(x, 0);
      ctx.moveTo(px, 0); ctx.lineTo(px, size.h);
    }
    for (let y = Math.ceil(yMin / yStep) * yStep; y <= yMax; y += yStep) {
      const { py } = toPx(0, y);
      ctx.moveTo(0, py); ctx.lineTo(size.w, py);
    }
    ctx.stroke();

    // Axes
    ctx.strokeStyle = axis;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    const { px: x0px, py: y0px } = toPx(0, 0);
    ctx.moveTo(0, y0px); ctx.lineTo(size.w, y0px);
    ctx.moveTo(x0px, 0); ctx.lineTo(x0px, size.h);
    ctx.stroke();

    // Axis labels
    ctx.fillStyle = isDark ? "#94A3B8" : "#64748B";
    ctx.font = "10px ui-monospace, monospace";
    ctx.textAlign = "center";
    for (let x = Math.ceil(xMin / xStep) * xStep; x <= xMax; x += xStep) {
      if (x === 0) continue;
      const { px } = toPx(x, 0);
      ctx.fillText(String(x), px, Math.min(size.h - 4, y0px + 12));
    }
    ctx.textAlign = "right";
    for (let y = Math.ceil(yMin / yStep) * yStep; y <= yMax; y += yStep) {
      if (y === 0) continue;
      const { py } = toPx(0, y);
      ctx.fillText(String(y), Math.min(size.w - 4, x0px - 4), py + 3);
    }

    // Plot each function
    for (const f of fns) {
      if (!f.expr.trim()) continue;
      ctx.strokeStyle = f.color;
      ctx.lineWidth = 2;
      ctx.beginPath();
      let prevValid = false;
      const samples = size.w * 2;
      for (let i = 0; i <= samples; i++) {
        const x = xMin + (i / samples) * (xMax - xMin);
        const r = evaluate(f.expr.replace(/x/g, `(${x})`), "rad");
        if (!r.ok || !Number.isFinite(r.value)) { prevValid = false; continue; }
        const { px, py } = toPx(x, r.value);
        // Skip wildly out-of-range values (asymptotes)
        if (py < -size.h || py > 2 * size.h) { prevValid = false; continue; }
        if (!prevValid) ctx.moveTo(px, py); else ctx.lineTo(px, py);
        prevValid = true;
      }
      ctx.stroke();
    }
  }, [fns, xRange, yRange, size]);

  const addFn = () => {
    const n = fns.length;
    setFns(prev => [...prev, { id: `f${Date.now()}`, expr: "", color: COLORS[n % COLORS.length] }]);
  };
  const updateFn = (id: string, expr: string) =>
    setFns(prev => prev.map(f => f.id === id ? { ...f, expr } : f));
  const removeFn = (id: string) => setFns(prev => prev.filter(f => f.id !== id));

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-border bg-accent/20 p-4 text-sm text-muted-foreground">
        Plot one or more functions of <code className="font-mono text-foreground">x</code>. Use <code className="font-mono text-foreground">sin(x)</code>, <code className="font-mono text-foreground">x^2</code>, <code className="font-mono text-foreground">sqrt(x)</code>, <code className="font-mono text-foreground">log(x)</code>, <code className="font-mono text-foreground">pi</code>, <code className="font-mono text-foreground">e</code>, etc. Trig uses radians.
      </div>

      <div className="grid lg:grid-cols-[1fr_280px] gap-4">
        <div ref={containerRef} className="rounded-2xl border border-border bg-card overflow-hidden">
          <canvas ref={canvasRef} className="block" />
        </div>

        <div className="space-y-3">
          <div className="space-y-2">
            <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Functions</div>
            {fns.map(f => (
              <div key={f.id} className="flex items-center gap-2">
                <div className="size-4 rounded-full shrink-0" style={{ background: f.color }} />
                <Input
                  value={f.expr}
                  onChange={(e) => updateFn(f.id, e.target.value)}
                  className="h-8 font-mono text-sm"
                  placeholder="e.g. sin(x)"
                />
                <Button variant="ghost" size="icon" className="size-8 shrink-0" onClick={() => removeFn(f.id)}>
                  <X className="size-3.5" />
                </Button>
              </div>
            ))}
            <Button variant="outline" size="sm" onClick={addFn} className="w-full border-dashed">
              <Plus className="size-3.5" /> Add function
            </Button>
          </div>

          <div className="space-y-2 pt-2 border-t border-border">
            <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">View</div>
            <label className="flex items-center justify-between gap-2 text-sm">
              <span>X range (±)</span>
              <Input
                type="number"
                value={xRange}
                onChange={(e) => setXRange(Math.max(1, parseFloat(e.target.value) || 1))}
                className="w-20 h-8"
              />
            </label>
            <label className="flex items-center justify-between gap-2 text-sm">
              <span>Y range (±)</span>
              <Input
                type="number"
                value={yRange}
                onChange={(e) => setYRange(Math.max(1, parseFloat(e.target.value) || 1))}
                className="w-20 h-8"
              />
            </label>
            <div className="flex gap-1">
              <Button variant="outline" size="sm" className="flex-1" onClick={() => { setXRange(xRange / 1.5); setYRange(yRange / 1.5); }}>
                <ZoomIn className="size-3.5" /> Zoom in
              </Button>
              <Button variant="outline" size="sm" className="flex-1" onClick={() => { setXRange(xRange * 1.5); setYRange(yRange * 1.5); }}>
                <ZoomOut className="size-3.5" /> Zoom out
              </Button>
            </div>
            <Button variant="outline" size="sm" className="w-full" onClick={() => { setXRange(20); setYRange(10); toast.success("View reset"); }}>
              <Crosshair className="size-3.5" /> Reset view
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
