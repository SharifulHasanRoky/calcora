"use client";

import * as React from "react";
import {
  Calculator, Star, type LucideIcon,
  Sigma, Landmark, ReceiptText, HeartPulse, Briefcase, Megaphone,
  CalendarDays, ArrowLeftRight, Wrench, Coffee, Clock,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { type CalcMeta, type CalcCategory, CATEGORY_META, useCalc } from "@/lib/calculators-store-bridge";

const ICONS: Record<string, LucideIcon> = {
  Sigma, Landmark, ReceiptText, HeartPulse, Briefcase, Megaphone,
  CalendarDays, ArrowLeftRight, Wrench, Coffee, Calculator, Star, Clock,
};

export function CalculatorCard({ calc, compact = false }: { calc: CalcMeta; compact?: boolean }) {
  const { openCalc, favorites, toggleFavorite } = useCalc();
  const fav = favorites.includes(calc.id);
  const cat = CATEGORY_META[calc.category];
  const Icon = ICONS[cat?.icon] ?? Calculator;

  return (
    <div
      className={cn(
        "group relative rounded-2xl border border-border bg-card hover:shadow-md hover:border-primary/40 transition-all cursor-pointer overflow-hidden",
        compact ? "p-4" : "p-5",
      )}
      onClick={() => openCalc(calc.id)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); openCalc(calc.id); } }}
    >
      <div className="flex items-start gap-3">
        <div
          className="size-10 rounded-xl grid place-items-center shrink-0 transition-transform group-hover:scale-105"
          style={{ background: `color-mix(in srgb, ${cat.color} 14%, transparent)`, color: cat.color }}
        >
          <Icon className="size-5" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-semibold text-sm leading-tight">{calc.name}</h3>
            <button
              onClick={(e) => { e.stopPropagation(); toggleFavorite(calc.id); }}
              className="shrink-0 p-1 rounded-md hover:bg-muted"
              aria-label={fav ? "Remove from favorites" : "Add to favorites"}
            >
              <Star className={cn("size-4", fav ? "fill-warning text-warning" : "text-muted-foreground")} />
            </button>
          </div>
          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{calc.description}</p>
          {calc.country && (
            <span className="inline-block mt-2 text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-accent text-accent-foreground">
              {calc.country}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

export function CategoryCard({ category }: { category: CalcCategory }) {
  const { setView } = useCalc();
  const meta = CATEGORY_META[category];
  const Icon = ICONS[meta.icon] ?? Calculator;

  return (
    <button
      onClick={() => setView("directory")}
      className="group text-left rounded-2xl border border-border bg-card hover:border-primary/40 hover:shadow-md transition-all p-5"
    >
      <div
        className="size-12 rounded-2xl grid place-items-center mb-3 transition-transform group-hover:scale-105"
        style={{ background: `color-mix(in srgb, ${meta.color} 14%, transparent)`, color: meta.color }}
      >
        <Icon className="size-6" />
      </div>
      <h3 className="font-semibold">{meta.name}</h3>
      <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{meta.description}</p>
    </button>
  );
}
