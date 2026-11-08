"use client";

import * as React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Field, ResultStat } from "@/components/calc-page-shell";
import { toast } from "sonner";
import { Dices, RefreshCw, Plus, Minus, RotateCcw, Copy } from "lucide-react";
import { cn } from "@/lib/utils";

export function RandomTools({ calcId }: { calcId: string }) {
  switch (calcId) {
    case "random-number": return <RandomNumber />;
    case "dice-roller": return <DiceRoller />;
    case "coin-flip": return <CoinFlip />;
    case "tally-counter": return <TallyCounter />;
    default: return null;
  }
}

function RandomNumber() {
  const [min, setMin] = React.useState("1");
  const [max, setMax] = React.useState("100");
  const [count, setCount] = React.useState("1");
  const [allowDecimal, setAllowDecimal] = React.useState(false);
  const [unique, setUnique] = React.useState(false);
  const [results, setResults] = React.useState<number[]>([]);

  const generate = () => {
    const lo = parseFloat(min);
    const hi = parseFloat(max);
    const n = Math.max(1, Math.min(1000, parseInt(count) || 1));
    if (isNaN(lo) || isNaN(hi) || lo >= hi) {
      toast.error("Min must be less than max");
      return;
    }
    const out: number[] = [];
    if (unique) {
      const pool: number[] = [];
      const step = allowDecimal ? 0.01 : 1;
      for (let v = lo; v <= hi; v += step) {
        pool.push(allowDecimal ? Math.round(v * 100) / 100 : Math.floor(v));
      }
      if (n > pool.length) {
        toast.error(`Cannot generate ${n} unique numbers from a range of ${pool.length}`);
        return;
      }
      for (let i = pool.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [pool[i], pool[j]] = [pool[j], pool[i]];
      }
      out.push(...pool.slice(0, n));
    } else {
      for (let i = 0; i < n; i++) {
        if (allowDecimal) {
          out.push(Math.round((lo + Math.random() * (hi - lo)) * 100) / 100);
        } else {
          out.push(Math.floor(lo + Math.random() * (hi - lo + 1)));
        }
      }
    }
    setResults(out);
  };

  return (
    <div className="space-y-4">
      <div className="grid sm:grid-cols-3 gap-4">
        <Field label="Minimum"><Input type="number" value={min} onChange={e => setMin(e.target.value)} /></Field>
        <Field label="Maximum"><Input type="number" value={max} onChange={e => setMax(e.target.value)} /></Field>
        <Field label="How many"><Input type="number" value={count} onChange={e => setCount(e.target.value)} min="1" max="1000" /></Field>
      </div>
      <div className="flex flex-wrap gap-4">
        <label className="flex items-center gap-2 text-sm cursor-pointer">
          <input type="checkbox" checked={allowDecimal} onChange={e => setAllowDecimal(e.target.checked)} className="size-4" />
          Allow decimals
        </label>
        <label className="flex items-center gap-2 text-sm cursor-pointer">
          <input type="checkbox" checked={unique} onChange={e => setUnique(e.target.checked)} className="size-4" />
          Unique values (no repeats)
        </label>
      </div>
      <Button onClick={generate} size="lg" className="w-full">
        <RefreshCw className="size-5" /> Generate
      </Button>
      {results.length > 0 && (
        <>
          <ResultStat
            label={results.length === 1 ? "Random number" : `${results.length} random numbers`}
            value={results.join(", ")}
            accent="primary"
          />
          <Button variant="outline" onClick={() => { navigator.clipboard?.writeText(results.join(", ")); toast.success("Copied"); }}>
            <Copy className="size-4" /> Copy
          </Button>
        </>
      )}
      <div className="rounded-xl bg-muted/30 border border-border p-4 text-sm text-muted-foreground">
        Uses <code>Math.random()</code> for generation. Suitable for casual use, games, and raffles — not for cryptographic purposes.
      </div>
    </div>
  );
}

const DICE_TYPES = [
  { name: "d4", sides: 4 },
  { name: "d6", sides: 6 },
  { name: "d8", sides: 8 },
  { name: "d10", sides: 10 },
  { name: "d12", sides: 12 },
  { name: "d20", sides: 20 },
  { name: "d100", sides: 100 },
];

function DiceRoller() {
  const [diceType, setDiceType] = React.useState(20);
  const [count, setCount] = React.useState(2);
  const [rolls, setRolls] = React.useState<number[]>([]);
  const [history, setHistory] = React.useState<{ type: number; rolls: number[]; total: number }[]>([]);

  const roll = () => {
    const newRolls: number[] = [];
    for (let i = 0; i < count; i++) {
      newRolls.push(1 + Math.floor(Math.random() * diceType));
    }
    setRolls(newRolls);
    setHistory(prev => [{ type: diceType, rolls: newRolls, total: newRolls.reduce((a, b) => a + b, 0) }, ...prev].slice(0, 8));
  };

  const total = rolls.reduce((a, b) => a + b, 0);

  return (
    <div className="space-y-4">
      <div>
        <Label className="text-sm font-medium">Dice type</Label>
        <div className="grid grid-cols-4 sm:grid-cols-7 gap-2 mt-2">
          {DICE_TYPES.map(d => (
            <button
              key={d.name}
              onClick={() => setDiceType(d.sides)}
              className={cn(
                "py-3 rounded-xl border font-semibold text-sm transition-colors",
                diceType === d.sides ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card hover:bg-accent",
              )}
            >
              {d.name}
            </button>
          ))}
        </div>
      </div>
      <Field label={`Number of dice (1–20)`}>
        <Input type="number" min="1" max="20" value={count} onChange={e => setCount(Math.max(1, Math.min(20, parseInt(e.target.value) || 1)))} />
      </Field>
      <Button onClick={roll} size="lg" className="w-full">
        <Dices className="size-5" /> Roll {count}d{diceType}
      </Button>

      {rolls.length > 0 && (
        <div className="rounded-2xl border border-border bg-card p-5">
          <div className="text-xs text-muted-foreground uppercase tracking-wider mb-3">Results</div>
          <div className="flex flex-wrap gap-2 justify-center mb-3">
            {rolls.map((r, i) => (
              <div key={i} className="size-14 rounded-xl bg-primary/10 text-primary grid place-items-center font-bold text-xl font-mono">
                {r}
              </div>
            ))}
          </div>
          <div className="text-center text-sm text-muted-foreground">
            Total: <span className="font-bold text-foreground text-lg">{total}</span>
            {rolls.length > 1 && <> · Average: {(total / rolls.length).toFixed(1)}</>}
          </div>
        </div>
      )}

      {history.length > 0 && (
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <div className="px-4 py-2.5 border-b border-border font-semibold text-sm">History</div>
          <div className="max-h-48 overflow-y-auto">
            {history.map((h, i) => (
              <div key={i} className="px-4 py-2 border-b border-border/50 text-sm flex justify-between">
                <span className="font-mono text-muted-foreground">{h.rolls.length}d{h.type}</span>
                <span className="font-mono">{h.rolls.join(", ")}</span>
                <span className="font-mono font-bold">{h.total}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function CoinFlip() {
  const [result, setResult] = React.useState<"heads" | "tails" | null>(null);
  const [flipping, setFlipping] = React.useState(false);
  const [stats, setStats] = React.useState({ heads: 0, tails: 0 });
  const [streak, setStreak] = React.useState({ side: null as "heads" | "tails" | null, count: 0 });
  const [bestStreak, setBestStreak] = React.useState(0);

  const flip = () => {
    setFlipping(true);
    setTimeout(() => {
      const r = Math.random() < 0.5 ? "heads" : "tails";
      setResult(r);
      setStats(prev => ({ ...prev, [r]: prev[r] + 1 }));
      setStreak(prev => {
        const newCount = prev.side === r ? prev.count + 1 : 1;
        if (newCount > bestStreak) setBestStreak(newCount);
        return { side: r, count: newCount };
      });
      setFlipping(false);
    }, 400);
  };

  const reset = () => {
    setResult(null);
    setStats({ heads: 0, tails: 0 });
    setStreak({ side: null, count: 0 });
    setBestStreak(0);
  };

  const total = stats.heads + stats.tails;

  return (
    <div className="space-y-4">
      <div className="flex flex-col items-center py-6">
        <button
          onClick={flip}
          disabled={flipping}
          className={cn(
            "size-32 rounded-full grid place-items-center text-2xl font-bold transition-all duration-300 shadow-lg",
            flipping ? "animate-spin scale-95" : "hover:scale-105",
            result === "heads" ? "bg-primary text-primary-foreground" : result === "tails" ? "bg-accent text-accent-foreground" : "bg-card border-2 border-primary text-primary",
          )}
        >
          {flipping ? "…" : result ? result.toUpperCase() : "FLIP"}
        </button>
        <p className="text-sm text-muted-foreground mt-4">Tap the coin to flip</p>
      </div>

      {total > 0 && (
        <>
          <div className="grid grid-cols-2 gap-3">
            <ResultStat label="Heads" value={stats.heads} accent="primary" />
            <ResultStat label="Tails" value={stats.tails} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl border border-border bg-card p-3 text-center">
              <div className="text-xs text-muted-foreground uppercase tracking-wider">Current streak</div>
              <div className="text-lg font-bold mt-1">{streak.count} {streak.side}</div>
            </div>
            <div className="rounded-xl border border-border bg-card p-3 text-center">
              <div className="text-xs text-muted-foreground uppercase tracking-wider">Best streak</div>
              <div className="text-lg font-bold mt-1">{bestStreak}</div>
            </div>
          </div>
          <Button variant="outline" onClick={reset} className="w-full">
            <RotateCcw className="size-4" /> Reset stats
          </Button>
        </>
      )}
    </div>
  );
}

function TallyCounter() {
  const [count, setCount] = React.useState(0);
  const [step, setStep] = React.useState(1);
  const [label, setLabel] = React.useState("Counter");
  const [history, setHistory] = React.useState<number[]>([0]);

  const increment = () => {
    const next = count + step;
    setCount(next);
    setHistory(prev => [...prev, next].slice(-50));
  };
  const decrement = () => {
    const next = count - step;
    setCount(next);
    setHistory(prev => [...prev, next].slice(-50));
  };
  const reset = () => {
    setCount(0);
    setHistory([0]);
  };
  const undo = () => {
    if (history.length > 1) {
      const newHistory = history.slice(0, -1);
      setHistory(newHistory);
      setCount(newHistory[newHistory.length - 1]);
    }
  };

  return (
    <div className="space-y-4">
      <Field label="Counter name">
        <Input value={label} onChange={e => setLabel(e.target.value)} />
      </Field>
      <Field label="Step (increment size)">
        <Input type="number" value={step} onChange={e => setStep(parseInt(e.target.value) || 1)} />
      </Field>

      <div className="rounded-2xl border border-border bg-card p-8 text-center">
        <div className="text-xs text-muted-foreground uppercase tracking-wider">{label}</div>
        <div className="text-7xl font-bold font-mono mt-2 text-primary tabular-nums">{count}</div>
      </div>

      <div className="grid grid-cols-3 gap-2">
        <Button variant="outline" size="lg" onClick={decrement} className="h-16 text-2xl">
          <Minus className="size-6" />
        </Button>
        <Button variant="outline" size="lg" onClick={undo} className="h-16">
          <RotateCcw className="size-5" />
        </Button>
        <Button size="lg" onClick={increment} className="h-16 text-2xl bg-primary">
          <Plus className="size-6" />
        </Button>
      </div>
      <Button variant="ghost" onClick={reset} className="w-full text-destructive">
        <RotateCcw className="size-4" /> Reset to zero
      </Button>

      <div className="rounded-xl bg-muted/30 border border-border p-4 text-sm text-muted-foreground">
        Tap + to add the step, − to subtract. Undo reverts the last change. The count is kept in memory until you reset or leave the page.
      </div>
    </div>
  );
}
