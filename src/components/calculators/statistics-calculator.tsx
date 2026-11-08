"use client";

import * as React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { parseNumber } from "@/lib/math-engine";

export function StatisticsCalculator() {
  const [input, setInput] = React.useState("12, 15, 14, 19, 22, 18, 14, 15, 17, 20");

  const numbers = React.useMemo(() => {
    return input
      .split(/[\s,;]+/)
      .map(s => s.trim())
      .filter(Boolean)
      .map(s => parseFloat(s))
      .filter(n => !isNaN(n));
  }, [input]);

  const stats = React.useMemo(() => {
    if (numbers.length === 0) return null;
    const sorted = [...numbers].sort((a, b) => a - b);
    const n = sorted.length;
    const sum = sorted.reduce((a, b) => a + b, 0);
    const mean = sum / n;
    const min = sorted[0];
    const max = sorted[n - 1];
    const range = max - min;
    // Median
    const median = n % 2 === 0
      ? (sorted[n / 2 - 1] + sorted[n / 2]) / 2
      : sorted[Math.floor(n / 2)];
    // Mode
    const counts = new Map<number, number>();
    sorted.forEach(v => counts.set(v, (counts.get(v) || 0) + 1));
    const maxCount = Math.max(...counts.values());
    const mode = maxCount === 1 ? null : [...counts.entries()].filter(([, c]) => c === maxCount).map(([v]) => v);
    // Quartiles
    const q = (p: number) => {
      const idx = p * (n - 1);
      const lo = Math.floor(idx);
      const hi = Math.ceil(idx);
      if (lo === hi) return sorted[lo];
      return sorted[lo] * (hi - idx) + sorted[hi] * (idx - lo);
    };
    const q1 = q(0.25);
    const q3 = q(0.75);
    const iqr = q3 - q1;
    // Variance & stddev (both population and sample)
    const variancePop = sorted.reduce((a, b) => a + (b - mean) ** 2, 0) / n;
    const varianceSample = n > 1 ? sorted.reduce((a, b) => a + (b - mean) ** 2, 0) / (n - 1) : 0;
    const stddevPop = Math.sqrt(variancePop);
    const stddevSample = Math.sqrt(varianceSample);

    return {
      n, sum, mean, median, mode, min, max, range,
      q1, q3, iqr,
      variancePop, varianceSample, stddevPop, stddevSample,
    };
  }, [numbers]);

  const fmt = (n: number | number[] | null, d = 4) => {
    if (n === null) return "No mode";
    if (Array.isArray(n)) return n.length === 1 ? n[0].toFixed(d).replace(/\.?0+$/, "") : n.map(v => v.toFixed(d).replace(/\.?0+$/, "")).join(", ");
    return n.toFixed(d).replace(/\.?0+$/, "");
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="stats-input">Data set (comma or space separated)</Label>
        <Input
          id="stats-input"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          className="font-mono"
          placeholder="e.g. 12, 15, 14, 19, 22"
        />
        <p className="text-xs text-muted-foreground">{numbers.length} value(s) parsed</p>
      </div>

      {stats ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          <Stat label="Count (n)" value={String(stats.n)} />
          <Stat label="Sum" value={fmt(stats.sum)} />
          <Stat label="Mean" value={fmt(stats.mean)} />
          <Stat label="Median" value={fmt(stats.median)} />
          <Stat label="Mode" value={fmt(stats.mode)} />
          <Stat label="Min" value={fmt(stats.min)} />
          <Stat label="Max" value={fmt(stats.max)} />
          <Stat label="Range" value={fmt(stats.range)} />
          <Stat label="Q1 (25%)" value={fmt(stats.q1)} />
          <Stat label="Q3 (75%)" value={fmt(stats.q3)} />
          <Stat label="IQR" value={fmt(stats.iqr)} />
          <Stat label="σ (population)" value={fmt(stats.stddevPop)} />
          <Stat label="s (sample)" value={fmt(stats.stddevSample)} />
          <Stat label="σ² (population)" value={fmt(stats.variancePop)} />
          <Stat label="s² (sample)" value={fmt(stats.varianceSample)} />
        </div>
      ) : (
        <div className="text-center py-10 text-muted-foreground text-sm">Enter some numbers to see statistics.</div>
      )}

      <div className="rounded-xl bg-muted/30 border border-border p-4 text-sm text-muted-foreground">
        <p><strong className="text-foreground">Formulas:</strong> Mean = Σx / n · Median = middle value (or average of two middle values) · Variance (population) = Σ(x − x̄)² / n · Variance (sample) = Σ(x − x̄)² / (n − 1) · Standard deviation = √variance.</p>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border bg-card p-3">
      <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">{label}</div>
      <div className="text-base font-bold font-mono mt-0.5 break-all">{value}</div>
    </div>
  );
}
