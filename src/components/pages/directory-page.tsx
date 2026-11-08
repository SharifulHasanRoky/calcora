"use client";

import * as React from "react";
import { Search, Star } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { CalculatorCard } from "@/components/calculator-card";
import {
  useCalc, CALCULATORS, CATEGORY_META, searchCalculators, type CalcCategory,
} from "@/lib/calculators-store-bridge";
import {
  Sigma, Landmark, ReceiptText, HeartPulse, Briefcase, Megaphone,
  CalendarDays, ArrowLeftRight, Wrench, Coffee, Calculator, type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

const ICONS: Record<string, LucideIcon> = {
  Sigma, Landmark, ReceiptText, HeartPulse, Briefcase, Megaphone,
  CalendarDays, ArrowLeftRight, Wrench, Coffee, Calculator,
};

export function DirectoryPage() {
  const { favorites } = useCalc();
  const [query, setQuery] = React.useState("");
  const [activeCat, setActiveCat] = React.useState<CalcCategory | "all" | "favorites">("all");

  const filtered = React.useMemo(() => {
    let list = CALCULATORS;
    if (activeCat === "favorites") list = list.filter(c => favorites.includes(c.id));
    else if (activeCat !== "all") list = list.filter(c => c.category === activeCat);
    if (query.trim()) {
      const q = query.toLowerCase();
      list = list.filter(c => {
        const h = (c.name + " " + c.description + " " + c.keywords.join(" ")).toLowerCase();
        return h.includes(q);
      });
    }
    return list;
  }, [query, activeCat, favorites]);

  const cats = Object.keys(CATEGORY_META) as CalcCategory[];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">All Calculators</h1>
        <p className="text-muted-foreground mt-1.5">{CALCULATORS.length} calculators across {cats.length} categories — all free, no sign-up.</p>
      </div>

      <div className="relative max-w-xl">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search calculators by name, keyword, or description…"
          className="pl-9 h-11"
        />
      </div>

      <div className="flex flex-wrap gap-2">
        <CatChip active={activeCat === "all"} onClick={() => setActiveCat("all")}>All</CatChip>
        {favorites.length > 0 && (
          <CatChip active={activeCat === "favorites"} onClick={() => setActiveCat("favorites")}>
            <Star className="size-3.5 fill-warning text-warning" /> Favorites ({favorites.length})
          </CatChip>
        )}
        {cats.map(c => {
          const Icon = ICONS[CATEGORY_META[c].icon] ?? Calculator;
          return (
            <CatChip key={c} active={activeCat === c} onClick={() => setActiveCat(c)}>
              <Icon className="size-3.5" style={{ color: CATEGORY_META[c].color }} />
              {CATEGORY_META[c].name}
            </CatChip>
          );
        })}
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <Calculator className="size-12 mx-auto mb-3 opacity-30" />
          <p>No calculators match your search.</p>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map(c => <CalculatorCard key={c.id} calc={c} />)}
        </div>
      )}
    </div>
  );
}

function CatChip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium border transition-colors",
        active ? "bg-primary text-primary-foreground border-primary" : "bg-card border-border text-muted-foreground hover:text-foreground hover:border-primary/40",
      )}
    >
      {children}
    </button>
  );
}
