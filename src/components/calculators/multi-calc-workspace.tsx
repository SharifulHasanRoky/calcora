"use client";

import * as React from "react";
import { Plus, X, Copy, ArrowDownUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { evaluate, formatNumber } from "@/lib/math-engine";
import { useCalc } from "@/lib/calculators-store-bridge";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface Row {
  id: string;
  label: string;
  expr: string;
}

export function MultiCalcWorkspace() {
  const { addHistory } = useCalc();
  const [rows, setRows] = React.useState<Row[]>([
    { id: "r1", label: "Calculation A", expr: "250 * 15%" },
    { id: "r2", label: "Calculation B", expr: "500 * 20%" },
    { id: "r3", label: "Calculation C", expr: "750 * 25%" },
  ]);

  const results = rows.map(r => ({ ...r, result: evaluate(r.expr) }));
  const validResults = results.filter(r => r.result.ok);
  const total = validResults.reduce((sum, r) => sum + r.result.value, 0);
  const avg = validResults.length ? total / validResults.length : 0;

  const updateRow = (id: string, patch: Partial<Row>) =>
    setRows(prev => prev.map(r => r.id === id ? { ...r, ...patch } : r));
  const addRow = () => {
    const n = rows.length + 1;
    const letter = String.fromCharCode(64 + n); // A, B, C…
    setRows(prev => [...prev, { id: `r${Date.now()}`, label: `Calculation ${letter}`, expr: "" }]);
  };
  const removeRow = (id: string) => setRows(prev => prev.filter(r => r.id !== id));

  const copyAll = () => {
    const text = results.map(r => `${r.label}: ${r.expr} = ${r.result.ok ? formatNumber(r.result.value) : "—"}`).join("\n");
    navigator.clipboard?.writeText(text).then(() => toast.success("All calculations copied"));
  };

  const commitAll = () => {
    validResults.forEach(r => addHistory({ expr: r.expr, result: formatNumber(r.result.value), mode: "multi-calc" }));
    toast.success(`${validResults.length} calculations saved to history`);
  };

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-border bg-accent/20 p-4 text-sm text-muted-foreground">
        Run multiple calculations side by side. Each row updates live. Compare, copy individual or combined results, and save all to history.
      </div>

      <div className="space-y-2">
        {results.map((r, idx) => (
          <div
            key={r.id}
            className="grid grid-cols-[auto_1fr_1fr_auto] gap-2 items-center rounded-xl border border-border bg-card p-2"
          >
            <div className="size-8 rounded-lg bg-primary/10 text-primary grid place-items-center font-bold text-sm shrink-0">
              {String.fromCharCode(65 + idx)}
            </div>
            <Input
              value={r.label}
              onChange={(e) => updateRow(r.id, { label: e.target.value })}
              className="h-9 text-sm border-transparent bg-muted/40"
              placeholder="Label"
            />
            <div className="flex items-center gap-2">
              <Input
                value={r.expr}
                onChange={(e) => updateRow(r.id, { expr: e.target.value })}
                className="h-9 font-mono text-sm"
                placeholder="e.g. 250 * 15%"
              />
              <div className={cn(
                "min-w-[120px] text-right font-mono font-bold text-sm px-2",
                r.result.ok ? "text-foreground" : "text-destructive text-xs",
              )}>
                {r.result.ok ? formatNumber(r.result.value) : (r.expr ? r.result.error : "—")}
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="size-8 shrink-0 text-muted-foreground hover:text-destructive"
              onClick={() => removeRow(r.id)}
              aria-label="Remove row"
            >
              <X className="size-4" />
            </Button>
          </div>
        ))}
      </div>

      <Button variant="outline" onClick={addRow} className="w-full border-dashed">
        <Plus className="size-4" /> Add calculation row
      </Button>

      {/* Summary */}
      {validResults.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <SummaryStat label="Valid rows" value={String(validResults.length)} />
          <SummaryStat label="Sum" value={formatNumber(total)} />
          <SummaryStat label="Average" value={formatNumber(avg)} />
          <SummaryStat label="Max" value={formatNumber(Math.max(...validResults.map(r => r.result.value)))} />
        </div>
      )}

      <div className="flex gap-2">
        <Button variant="outline" onClick={copyAll} disabled={validResults.length === 0}>
          <Copy className="size-4" /> Copy all
        </Button>
        <Button onClick={commitAll} disabled={validResults.length === 0}>
          Save all to history
        </Button>
      </div>
    </div>
  );
}

function SummaryStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border bg-card p-3">
      <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">{label}</div>
      <div className="text-lg font-bold font-mono mt-0.5 break-all">{value}</div>
    </div>
  );
}
