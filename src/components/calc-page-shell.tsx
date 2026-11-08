"use client";

import * as React from "react";
import { ChevronRight, Home, Star, Share2 } from "lucide-react";
import { useCalc, CATEGORY_META, CALC_BY_ID } from "@/lib/calculators-store-bridge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface CalcPageShellProps {
  calcId: string;
  children: React.ReactNode;
  /** Optional formula display below the calculator */
  formula?: React.ReactNode;
  /** Optional worked example */
  example?: React.ReactNode;
  /** Optional FAQ items */
  faq?: { q: string; a: string }[];
  /** Optional disclaimer */
  disclaimer?: string;
  /** Right-side actions */
  actions?: React.ReactNode;
}

export function CalcPageShell({
  calcId, children, formula, example, faq, disclaimer, actions,
}: CalcPageShellProps) {
  const { goHome, setView, favorites, toggleFavorite } = useCalc();
  const calc = CALC_BY_ID[calcId];
  if (!calc) return null;
  const cat = CATEGORY_META[calc.category];
  const fav = favorites.includes(calcId);

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1 text-sm text-muted-foreground" aria-label="Breadcrumb">
        <button onClick={goHome} className="hover:text-foreground flex items-center gap-1">
          <Home className="size-3.5" /> Home
        </button>
        <ChevronRight className="size-3.5" />
        <button onClick={() => setView("directory")} className="hover:text-foreground">{cat.name}</button>
        <ChevronRight className="size-3.5" />
        <span className="text-foreground font-medium truncate">{calc.name}</span>
      </nav>

      {/* Title row */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">{calc.name}</h1>
          <p className="text-muted-foreground mt-1.5 max-w-2xl">{calc.description}</p>
        </div>
        <div className="flex gap-1 shrink-0">
          <Button
            variant="ghost"
            size="icon"
            className="rounded-lg"
            onClick={() => toggleFavorite(calcId)}
            aria-label={fav ? "Remove from favorites" : "Add to favorites"}
          >
            <Star className={cn("size-5", fav && "fill-warning text-warning")} />
          </Button>
          {actions}
        </div>
      </div>

      {/* Calculator body */}
      <div>{children}</div>

      {/* Formula */}
      {formula && (
        <section className="rounded-2xl border border-border bg-card p-5">
          <h2 className="font-semibold mb-3">Formula</h2>
          <div className="text-sm text-muted-foreground">{formula}</div>
        </section>
      )}

      {/* Example */}
      {example && (
        <section className="rounded-2xl border border-border bg-card p-5">
          <h2 className="font-semibold mb-3">Worked example</h2>
          <div className="text-sm text-muted-foreground">{example}</div>
        </section>
      )}

      {/* FAQ */}
      {faq && faq.length > 0 && (
        <section className="rounded-2xl border border-border bg-card p-5">
          <h2 className="font-semibold mb-4">Frequently asked questions</h2>
          <div className="space-y-4">
            {faq.map((item, i) => (
              <div key={i}>
                <h3 className="font-medium text-sm mb-1">{item.q}</h3>
                <p className="text-sm text-muted-foreground">{item.a}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Disclaimer */}
      {disclaimer && (
        <section className="rounded-xl bg-muted/40 border border-border p-4 text-xs text-muted-foreground">
          <strong className="text-foreground">Disclaimer:</strong> {disclaimer}
        </section>
      )}
    </div>
  );
}

/** A reusable labeled input row. */
export function Field({
  label, children, hint,
}: { label: string; children: React.ReactNode; hint?: string }) {
  return (
    <label className="block space-y-1.5">
      <span className="text-sm font-medium text-foreground">{label}</span>
      {children}
      {hint && <span className="text-xs text-muted-foreground block">{hint}</span>}
    </label>
  );
}

/** A reusable result stat card. */
export function ResultStat({
  label, value, sublabel, accent,
}: { label: string; value: React.ReactNode; sublabel?: string; accent?: "primary" | "success" | "warning" | "default" }) {
  const colors = {
    primary: "border-primary/30 bg-primary/5",
    success: "border-success/30 bg-success/5",
    warning: "border-warning/30 bg-warning/5",
    default: "border-border bg-card",
  }[accent || "default"];
  return (
    <div className={cn("rounded-2xl border p-4", colors)}>
      <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{label}</div>
      <div className="text-2xl font-bold font-mono mt-1 break-all">{value}</div>
      {sublabel && <div className="text-xs text-muted-foreground mt-1">{sublabel}</div>}
    </div>
  );
}

/** Format currency safely. */
export function money(n: number, currency = "USD"): string {
  if (!Number.isFinite(n)) return "—";
  try {
    return new Intl.NumberFormat("en-US", { style: "currency", currency, maximumFractionDigits: 2 }).format(n);
  } catch {
    return n.toFixed(2);
  }
}

export function num(n: number, digits = 2): string {
  if (!Number.isFinite(n)) return "—";
  return n.toLocaleString("en-US", { maximumFractionDigits: digits });
}
