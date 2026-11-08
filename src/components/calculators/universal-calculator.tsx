"use client";

import * as React from "react";
import {
  X, Percent, Plus, Minus, Divide, Asterisk, Equal,
  Pin, PinOff, Copy, Trash2, History,
  Lightbulb, Share2,
} from "lucide-react";
import { evaluate, formatNumber, type AngleMode } from "@/lib/math-engine";
import { explain } from "@/lib/explanation-engine";
import { useCalc } from "@/lib/calculators-store-bridge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type Mode = "basic" | "scientific" | "programmer" | "fraction" | "statistics" | "graphing";

export function UniversalCalculator() {
  const { addHistory, openShare } = useCalc();
  const [expr, setExpr] = React.useState("");
  const [mode, setMode] = React.useState<Mode>("basic");
  const [angle, setAngle] = React.useState<AngleMode>("deg");
  const [programmerBase, setProgrammerBase] = React.useState<"bin" | "oct" | "dec" | "hex">("dec");
  const [showHistory, setShowHistory] = React.useState(true);
  const [showExplain, setShowExplain] = React.useState(false);

  const result = React.useMemo(() => evaluate(expr, angle), [expr, angle]);
  const explanation = React.useMemo(() => showExplain ? explain(expr, angle) : null, [expr, angle, showExplain]);

  // Auto-commit to history when expression is "complete"
  const lastCommitted = React.useRef<string>("");
  React.useEffect(() => {
    if (result.ok && expr && /[+\-*/^%]/.test(expr) && /\d/.test(expr) && expr !== lastCommitted.current) {
      const timeout = setTimeout(() => {
        addHistory({ expr, result: formatNumber(result.value), mode });
        lastCommitted.current = expr;
      }, 1500);
      return () => clearTimeout(timeout);
    }
  }, [expr, result, mode, addHistory]);

  const insert = (s: string) => setExpr(prev => prev + s);
  const backspace = () => setExpr(prev => prev.slice(0, -1));
  const clearAll = () => { setExpr(""); lastCommitted.current = ""; };
  const equals = () => {
    if (result.ok && expr) {
      addHistory({ expr, result: formatNumber(result.value), mode });
      lastCommitted.current = expr;
      toast.success(`Result: ${formatNumber(result.value)}`);
      navigator.clipboard?.writeText(formatNumber(result.value)).catch(() => {});
    }
  };

  // Keyboard support (USP 9)
  React.useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable)) return;

      const k = e.key;
      if (/^[0-9.]$/.test(k)) { e.preventDefault(); insert(k); }
      else if (k === "+" || k === "-" || k === "*" || k === "/") { e.preventDefault(); insert(k); }
      else if (k === "^") { e.preventDefault(); insert("^"); }
      else if (k === "%") { e.preventDefault(); insert("%"); }
      else if (k === "(" || k === ")") { e.preventDefault(); insert(k); }
      else if (k === "Enter" || k === "=") { e.preventDefault(); equals(); }
      else if (k === "Backspace") { e.preventDefault(); backspace(); }
      else if (k === "Escape") { e.preventDefault(); clearAll(); }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [expr, result, mode]);

  const shareCalc = () => {
    if (expr && result.ok) {
      openShare({ expr, result: formatNumber(result.value) });
    }
  };

  return (
    <div className="space-y-4">
      {/* Mode selector */}
      <div className="flex flex-wrap items-center gap-2">
        <Tabs value={mode} onValueChange={(v) => setMode(v as Mode)}>
          <TabsList className="h-9 flex-wrap overflow-x-auto max-w-full">
            <TabsTrigger value="basic" className="text-xs">Basic</TabsTrigger>
            <TabsTrigger value="scientific" className="text-xs">Scientific</TabsTrigger>
            <TabsTrigger value="programmer" className="text-xs">Programmer</TabsTrigger>
            <TabsTrigger value="fraction" className="text-xs">Fraction</TabsTrigger>
            <TabsTrigger value="statistics" className="text-xs">Statistics</TabsTrigger>
            <TabsTrigger value="graphing" className="text-xs">Graphing</TabsTrigger>
          </TabsList>
        </Tabs>
        <div className="ml-auto flex gap-1">
          <Button variant={showHistory ? "default" : "ghost"} size="sm" className="h-9" onClick={() => setShowHistory(!showHistory)}>
            <History className="size-4" /> History
          </Button>
          <Button variant={showExplain ? "default" : "ghost"} size="sm" className="h-9" onClick={() => setShowExplain(!showExplain)}>
            <Lightbulb className="size-4" /> Explain
          </Button>
        </div>
      </div>

      <div className={cn("grid gap-4", showHistory ? "lg:grid-cols-[1fr_320px]" : "grid-cols-1")}>
        {/* Calculator */}
        <div className="space-y-4">
          {/* Display */}
          <div
            className="rounded-2xl bg-card border border-border p-5 sm:p-6 shadow-sm min-h-[140px] flex flex-col justify-end"
            tabIndex={0}
            role="textbox"
            aria-label="Calculator display"
          >
            <div className="text-right">
              <div className="text-muted-foreground text-sm font-mono break-all min-h-[1.25rem]">
                {expr || <span className="opacity-50">0</span>}
              </div>
              <div className={cn(
                "font-bold font-mono break-all transition-all",
                "text-3xl sm:text-4xl mt-1",
                !result.ok && expr && "text-destructive text-base font-normal",
                !expr && "text-muted-foreground/50",
              )}>
                {result.ok ? formatNumber(result.value) : (expr ? result.error : "0")}
              </div>
            </div>
            <div className="flex items-center justify-between mt-3 pt-3 border-t border-border/50">
              <div className="flex gap-2 items-center">
                {mode === "scientific" && (
                  <Button variant="ghost" size="sm" className="h-7 text-xs px-2" onClick={() => setAngle(a => a === "deg" ? "rad" : "deg")}>
                    {angle.toUpperCase()}
                  </Button>
                )}
                {mode === "programmer" && (
                  <Tabs value={programmerBase} onValueChange={(v) => setProgrammerBase(v as typeof programmerBase)}>
                    <TabsList className="h-7">
                      <TabsTrigger value="bin" className="text-[10px] px-2">BIN</TabsTrigger>
                      <TabsTrigger value="oct" className="text-[10px] px-2">OCT</TabsTrigger>
                      <TabsTrigger value="dec" className="text-[10px] px-2">DEC</TabsTrigger>
                      <TabsTrigger value="hex" className="text-[10px] px-2">HEX</TabsTrigger>
                    </TabsList>
                  </Tabs>
                )}
              </div>
              <div className="flex gap-1">
                <Button variant="ghost" size="sm" className="h-7" onClick={() => navigator.clipboard?.writeText(formatNumber(result.value)).then(() => toast.success("Copied"))}>
                  <Copy className="size-3.5" /> Copy
                </Button>
                <Button variant="ghost" size="sm" className="h-7" onClick={shareCalc} disabled={!result.ok}>
                  <Share2 className="size-3.5" /> Share
                </Button>
              </div>
            </div>
          </div>

          {/* Programmer base preview */}
          {mode === "programmer" && result.ok && Number.isInteger(result.value) && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <BasePreview label="BIN" value={Math.round(result.value).toString(2)} />
              <BasePreview label="OCT" value={Math.round(result.value).toString(8)} />
              <BasePreview label="DEC" value={Math.round(result.value).toString(10)} />
              <BasePreview label="HEX" value={Math.round(result.value).toString(16).toUpperCase()} />
            </div>
          )}

          {/* Explanation panel (USP 4) */}
          {showExplain && explanation && (
            <div className="rounded-2xl bg-accent/30 border border-border p-4">
              <div className="flex items-center gap-2 mb-3">
                <Lightbulb className="size-4 text-primary" />
                <h4 className="font-semibold text-sm">Step-by-step explanation</h4>
              </div>
              <ol className="space-y-1.5 text-sm">
                {explanation.steps.map((s, i) => (
                  <li key={i} className="flex gap-2">
                    <span className="text-muted-foreground font-mono text-xs shrink-0 w-5">{i + 1}.</span>
                    <span><span className="text-muted-foreground">{s.description}: </span><span className="font-mono font-medium">{s.expression}</span></span>
                  </li>
                ))}
              </ol>
            </div>
          )}
          {showExplain && !explanation && (
            <div className="rounded-2xl bg-muted/40 border border-border p-4 text-sm text-muted-foreground text-center">
              Enter an expression to see a step-by-step explanation.
            </div>
          )}

          {/* Keypad */}
          <Keypad
            mode={mode}
            onInsert={insert}
            onBackspace={backspace}
            onClear={clearAll}
            onEquals={equals}
            onAngleToggle={() => setAngle(a => a === "deg" ? "rad" : "deg")}
            angle={angle}
          />
        </div>

        {/* History panel (USP 3) */}
        {showHistory && <HistoryPanel />}
      </div>
    </div>
  );
}

function BasePreview({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border bg-card p-2.5">
      <div className="text-[10px] font-semibold text-muted-foreground">{label}</div>
      <div className="font-mono text-xs break-all line-clamp-2">{value}</div>
    </div>
  );
}

type KeyVariant = "default" | "primary" | "accent" | "ghost" | "danger";

function Key({ label, onClick, variant = "default", className = "", ariaLabel }: {
  label: React.ReactNode;
  onClick: () => void;
  variant?: KeyVariant;
  className?: string;
  ariaLabel?: string;
}) {
  const styles: Record<KeyVariant, string> = {
    default: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
    primary: "bg-primary text-primary-foreground hover:bg-primary/90",
    accent: "bg-accent text-accent-foreground hover:bg-accent/80",
    ghost: "bg-transparent border border-border hover:bg-muted",
    danger: "bg-destructive/10 text-destructive hover:bg-destructive/20",
  };
  return (
    <button
      onClick={onClick}
      aria-label={ariaLabel || (typeof label === "string" ? label : undefined)}
      className={cn("calc-key h-14 sm:h-16 text-base sm:text-lg flex items-center justify-center", styles[variant], className)}
    >
      {label}
    </button>
  );
}

function Keypad({
  mode, onInsert, onBackspace, onClear, onEquals, onAngleToggle, angle,
}: {
  mode: Mode;
  onInsert: (s: string) => void;
  onBackspace: () => void;
  onClear: () => void;
  onEquals: () => void;
  onAngleToggle: () => void;
  angle: AngleMode;
}) {
  const sci = mode === "scientific" || mode === "fraction" || mode === "statistics" || mode === "graphing";

  return (
    <div className="space-y-2">
      {sci && (
        <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
          <Key label="sin" onClick={() => onInsert("sin(")} variant="ghost" />
          <Key label="cos" onClick={() => onInsert("cos(")} variant="ghost" />
          <Key label="tan" onClick={() => onInsert("tan(")} variant="ghost" />
          <Key label="ln" onClick={() => onInsert("ln(")} variant="ghost" />
          <Key label="log" onClick={() => onInsert("log(")} variant="ghost" />
          <Key label="√" onClick={() => onInsert("sqrt(")} variant="ghost" ariaLabel="square root" />
          <Key label={angle === "deg" ? "DEG" : "RAD"} onClick={onAngleToggle} variant="ghost" />
          <Key label="π" onClick={() => onInsert("pi")} variant="ghost" ariaLabel="pi" />
          <Key label="e" onClick={() => onInsert("e")} variant="ghost" ariaLabel="euler" />
          <Key label="xʸ" onClick={() => onInsert("^")} variant="ghost" ariaLabel="power" />
          <Key label="x²" onClick={() => onInsert("^2")} variant="ghost" ariaLabel="square" />
          <Key label="n!" onClick={() => onInsert("fact(")} variant="ghost" ariaLabel="factorial" />
          <Key label="(" onClick={() => onInsert("(")} variant="ghost" />
          <Key label=")" onClick={() => onInsert(")")} variant="ghost" />
          <Key label="1/x" onClick={() => onInsert("1/")} variant="ghost" />
          <Key label="exp" onClick={() => onInsert("exp(")} variant="ghost" />
          <Key label="abs" onClick={() => onInsert("abs(")} variant="ghost" />
          <Key label="mod" onClick={() => onInsert(" mod ")} variant="ghost" />
        </div>
      )}
      <div className="grid grid-cols-4 gap-2">
        <Key label="AC" onClick={onClear} variant="danger" ariaLabel="all clear" />
        <Key label="(" onClick={() => onInsert("(")} variant="ghost" />
        <Key label=")" onClick={() => onInsert(")")} variant="ghost" />
        <Key label="⌫" onClick={onBackspace} variant="ghost" ariaLabel="backspace" />

        <Key label="7" onClick={() => onInsert("7")} />
        <Key label="8" onClick={() => onInsert("8")} />
        <Key label="9" onClick={() => onInsert("9")} />
        <Key label="÷" onClick={() => onInsert("/")} variant="accent" ariaLabel="divide" />

        <Key label="4" onClick={() => onInsert("4")} />
        <Key label="5" onClick={() => onInsert("5")} />
        <Key label="6" onClick={() => onInsert("6")} />
        <Key label="×" onClick={() => onInsert("*")} variant="accent" ariaLabel="multiply" />

        <Key label="1" onClick={() => onInsert("1")} />
        <Key label="2" onClick={() => onInsert("2")} />
        <Key label="3" onClick={() => onInsert("3")} />
        <Key label="−" onClick={() => onInsert("-")} variant="accent" ariaLabel="minus" />

        <Key label="0" onClick={() => onInsert("0")} />
        <Key label="." onClick={() => onInsert(".")} />
        <Key label="%" onClick={() => onInsert("%")} />
        <Key label="=" onClick={onEquals} variant="primary" ariaLabel="equals" />
        <Key label="+" onClick={() => onInsert("+")} variant="accent" className="col-span-4 sm:col-span-1 h-12" ariaLabel="plus" />
      </div>
    </div>
  );
}

function HistoryPanel() {
  const { history, removeHistory, pinHistory, clearHistory } = useCalc();
  const [activeId, setActiveId] = React.useState<string | null>(null);

  if (history.length === 0) {
    return (
      <div className="rounded-2xl border border-border bg-card p-5 text-center">
        <History className="size-8 mx-auto text-muted-foreground/50 mb-2" />
        <p className="text-sm text-muted-foreground">No history yet</p>
        <p className="text-xs text-muted-foreground/70 mt-1">Your calculations will appear here, stored locally on your device.</p>
      </div>
    );
  }

  const sorted = [...history].sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0) || b.ts - a.ts);

  return (
    <div className="rounded-2xl border border-border bg-card overflow-hidden flex flex-col max-h-[600px]">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <h3 className="font-semibold text-sm flex items-center gap-2"><History className="size-4" /> History</h3>
        <Button variant="ghost" size="sm" className="h-7 text-xs text-destructive" onClick={clearHistory}>
          <Trash2 className="size-3.5" /> Clear
        </Button>
      </div>
      <div className="overflow-y-auto flex-1">
        {sorted.map(h => (
          <div
            key={h.id}
            className="group px-4 py-2.5 border-b border-border/50 hover:bg-accent/30 transition-colors"
            onMouseEnter={() => setActiveId(h.id)}
            onMouseLeave={() => setActiveId(null)}
          >
            <div className="flex items-start gap-2">
              <button
                onClick={() => pinHistory(h.id, !h.pinned)}
                className="mt-0.5 p-1 rounded hover:bg-muted shrink-0"
                aria-label={h.pinned ? "Unpin" : "Pin"}
              >
                {h.pinned ? <Pin className="size-3.5 text-primary fill-primary" /> : <PinOff className="size-3.5 text-muted-foreground" />}
              </button>
              <div className="min-w-0 flex-1">
                <div className="text-xs text-muted-foreground font-mono break-all">{h.expr}</div>
                <div className="text-base font-semibold font-mono break-all">= {h.result}</div>
                <div className="text-[10px] text-muted-foreground/70 mt-0.5">
                  {new Date(h.ts).toLocaleString(undefined, { hour: "2-digit", minute: "2-digit", month: "short", day: "numeric" })}
                  {h.mode && <span className="ml-2 capitalize">· {h.mode}</span>}
                </div>
              </div>
              <div className={cn("flex flex-col gap-0.5 transition-opacity", activeId === h.id ? "opacity-100" : "opacity-0")}>
                <button
                  onClick={() => { navigator.clipboard?.writeText(h.result); toast.success("Result copied"); }}
                  className="p-1 rounded hover:bg-muted"
                  aria-label="Copy result"
                ><Copy className="size-3.5" /></button>
                <button
                  onClick={() => removeHistory(h.id)}
                  className="p-1 rounded hover:bg-muted text-destructive"
                  aria-label="Delete"
                ><X className="size-3.5" /></button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
