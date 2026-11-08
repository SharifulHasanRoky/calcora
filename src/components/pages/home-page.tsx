"use client";

import * as React from "react";
import { Search, Sparkles, Zap, Shield, Cpu, Heart, ArrowRight, Star, Clock } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { UniversalCalculator } from "@/components/calculators/universal-calculator";
import { CalculatorCard, CategoryCard } from "@/components/calculator-card";
import {
  useCalc, CALCULATORS, CALC_BY_ID, CATEGORY_META, POPULAR_IDS,
  searchCalculators, type CalcCategory,
} from "@/lib/calculators-store-bridge";
import {
  Accordion, AccordionContent, AccordionItem, AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Popover, PopoverContent, PopoverTrigger,
} from "@/components/ui/popover";

export function HomePage() {
  const { openCalc, recent, favorites, setView } = useCalc();
  const [query, setQuery] = React.useState("");
  const [searchOpen, setSearchOpen] = React.useState(false);
  const searchResults = React.useMemo(() => searchCalculators(query), [query]);

  const popular = POPULAR_IDS.map(id => CALC_BY_ID[id]).filter(Boolean);
  const cats = Object.keys(CATEGORY_META) as CalcCategory[];
  const recentCalcs = recent.map(id => CALC_BY_ID[id]).filter(Boolean);
  const favCalcs = favorites.map(id => CALC_BY_ID[id]).filter(Boolean);

  const whyFeatures = [
    { icon: Zap, title: "Instant calculations", desc: "Results update live as you type. No Calculate button needed." },
    { icon: Cpu, title: "Accurate math engine", desc: "A real expression parser — never uses unsafe eval(). Handles precedence, fractions, trig, and constants." },
    { icon: Shield, title: "Privacy-first", desc: "Your calculations stay on your device. No account, no tracking of inputs." },
    { icon: Star, title: "No registration", desc: "Every calculator is free. History, favorites, and recent are saved locally." },
    { icon: Heart, title: "Mobile-first", desc: "Designed for touch with large keys and a responsive layout." },
    { icon: Sparkles, title: "Explain my calculation", desc: "See the formula and step-by-step working behind every result." },
  ];

  const faqs = [
    { q: "Is CALCORA free to use?", a: "Yes. Every calculator is free and requires no account. History, favorites, and recent calculators are stored locally in your browser." },
    { q: "Does CALCORA work offline?", a: "Yes — CALCORA is a Progressive Web App. After your first visit, supported calculators work offline and your history remains available." },
    { q: "Are the calculations accurate?", a: "CALCORA uses a custom expression parser (tokenizer → shunting-yard → evaluator) — never JavaScript eval(). Tax and health formulas are sourced from official references and clearly dated." },
    { q: "Do you store my calculations?", a: "No. Your calculation history lives in your browser's local storage and is never transmitted to our servers unless you explicitly share a calculation." },
    { q: "Can I use my keyboard?", a: "Absolutely. Numbers, +, -, *, /, %, ^, parentheses, Enter (=), Backspace, and Escape (clear) all work in the universal calculator." },
    { q: "Are tax and health results official advice?", a: "No. Tax and health calculators provide estimates for informational purposes only. Always consult a qualified professional for official advice." },
  ];

  return (
    <div className="space-y-16 sm:space-y-20">
      {/* HERO */}
      <section className="relative">
        <div className="absolute inset-0 -z-10 overflow-hidden">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] rounded-full bg-primary/10 blur-3xl" />
        </div>
        <div className="text-center max-w-3xl mx-auto pt-6 sm:pt-12">
          <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs font-medium text-muted-foreground mb-5">
            <Sparkles className="size-3.5 text-primary" />
            70+ calculators · No sign-up · Works offline
          </div>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight text-balance">
            Every Calculation.{" "}
            <span className="bg-gradient-to-r from-primary to-violet-500 bg-clip-text text-transparent">
              One Beautiful Experience.
            </span>
          </h1>
          <p className="mt-5 text-lg text-muted-foreground text-balance max-w-2xl mx-auto">
            From everyday math to taxes, health, finance, and advanced scientific calculations.
            Get accurate answers instantly — with step-by-step explanations.
          </p>

          {/* Big search */}
          <div className="mt-7 max-w-xl mx-auto">
            <Popover open={searchOpen && query.length > 0} onOpenChange={setSearchOpen}>
              <PopoverTrigger asChild>
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-5 text-muted-foreground" />
                  <Input
                    value={query}
                    onChange={(e) => { setQuery(e.target.value); setSearchOpen(true); }}
                    placeholder="Search 70+ calculators — try 'mortgage', 'BMI', 'tax US'…"
                    className="pl-12 h-14 rounded-2xl text-base shadow-sm"
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && searchResults[0]) {
                        openCalc(searchResults[0].id);
                        setQuery("");
                        setSearchOpen(false);
                      }
                    }}
                  />
                </div>
              </PopoverTrigger>
              <PopoverContent className="p-0 w-[--radix-popover-trigger-width] max-w-xl" align="center">
                <div className="max-h-80 overflow-y-auto py-2">
                  {searchResults.length === 0 ? (
                    <div className="px-4 py-6 text-center text-sm text-muted-foreground">
                      No calculators found for "{query}"
                    </div>
                  ) : searchResults.map(r => (
                    <button
                      key={r.id}
                      onClick={() => { openCalc(r.id); setQuery(""); setSearchOpen(false); }}
                      className="w-full text-left px-4 py-2.5 hover:bg-accent/50 flex items-start gap-3"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="font-medium text-sm truncate">{r.name}</div>
                        <div className="text-xs text-muted-foreground truncate">{r.description}</div>
                      </div>
                      <ArrowRight className="size-4 text-muted-foreground shrink-0 mt-1" />
                    </button>
                  ))}
                </div>
              </PopoverContent>
            </Popover>
          </div>

          {/* Popular shortcuts */}
          <div className="mt-5 flex flex-wrap justify-center gap-2">
            {["Percentage", "BMI", "Income Tax", "Age", "Loan", "Scientific"].map(name => {
              const map: Record<string, string> = {
                "Percentage": "percentage", "BMI": "bmi", "Income Tax": "tax-us",
                "Age": "age", "Loan": "loan", "Scientific": "scientific",
              };
              return (
                <button
                  key={name}
                  onClick={() => openCalc(map[name])}
                  className="px-3 py-1.5 rounded-full border border-border bg-card text-sm hover:border-primary/40 hover:bg-accent/30 transition-colors"
                >
                  {name}
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* FEATURED CALCULATOR */}
      <section>
        <div className="flex items-end justify-between mb-5">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Universal Calculator</h2>
            <p className="text-muted-foreground mt-1 text-sm">Basic, scientific, programmer, fraction, statistics, graphing — all in one workspace.</p>
          </div>
        </div>
        <div className="rounded-3xl border border-border bg-background p-3 sm:p-5 shadow-sm">
          <UniversalCalculator />
        </div>
      </section>

      {/* POPULAR CALCULATORS */}
      <section>
        <div className="flex items-end justify-between mb-5">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Popular calculators</h2>
            <p className="text-muted-foreground mt-1 text-sm">The most-used CALCORA tools.</p>
          </div>
          <Button variant="ghost" size="sm" onClick={() => setView("directory")}>
            View all <ArrowRight className="size-4" />
          </Button>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {popular.map(c => <CalculatorCard key={c.id} calc={c} />)}
        </div>
      </section>

      {/* CATEGORIES */}
      <section>
        <div className="mb-5">
          <h2 className="text-2xl font-bold tracking-tight">Browse by category</h2>
          <p className="text-muted-foreground mt-1 text-sm">Ten organized categories. Every calculator works the same way.</p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          {cats.map(c => <CategoryCard key={c} category={c} />)}
        </div>
      </section>

      {/* RECENT + FAVORITES */}
      {(recentCalcs.length > 0 || favCalcs.length > 0) && (
        <section>
          <div className="mb-5">
            <h2 className="text-2xl font-bold tracking-tight">Your workspace</h2>
            <p className="text-muted-foreground mt-1 text-sm">Recently used and favorited calculators — saved on this device.</p>
          </div>
          <div className="grid gap-6 md:grid-cols-2">
            {recentCalcs.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold mb-3 flex items-center gap-2 text-muted-foreground">
                  <Clock className="size-4" /> Recently used
                </h3>
                <div className="grid gap-3 sm:grid-cols-2">
                  {recentCalcs.slice(0, 4).map(c => <CalculatorCard key={c.id} calc={c} compact />)}
                </div>
              </div>
            )}
            {favCalcs.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold mb-3 flex items-center gap-2 text-muted-foreground">
                  <Star className="size-4 fill-warning text-warning" /> Favorites
                </h3>
                <div className="grid gap-3 sm:grid-cols-2">
                  {favCalcs.slice(0, 4).map(c => <CalculatorCard key={c.id} calc={c} compact />)}
                </div>
              </div>
            )}
          </div>
        </section>
      )}

      {/* WHY CALCORA */}
      <section>
        <div className="text-center max-w-2xl mx-auto mb-8">
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">Why CALCORA?</h2>
          <p className="text-muted-foreground mt-2">Built like a premium product, not a cluttered ad farm.</p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {whyFeatures.map(f => {
            const Icon = f.icon;
            return (
              <div key={f.title} className="rounded-2xl border border-border bg-card p-5">
                <div className="size-10 rounded-xl bg-primary/10 text-primary grid place-items-center mb-3">
                  <Icon className="size-5" />
                </div>
                <h3 className="font-semibold">{f.title}</h3>
                <p className="text-sm text-muted-foreground mt-1">{f.desc}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* FAQ */}
      <section>
        <div className="text-center max-w-2xl mx-auto mb-6">
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">Frequently asked questions</h2>
        </div>
        <div className="max-w-2xl mx-auto">
          <Accordion type="single" collapsible className="rounded-2xl border border-border bg-card px-4">
            {faqs.map((f, i) => (
              <AccordionItem key={i} value={`item-${i}`} className={i === faqs.length - 1 ? "border-b-0" : ""}>
                <AccordionTrigger className="text-left font-medium">{f.q}</AccordionTrigger>
                <AccordionContent className="text-muted-foreground">{f.a}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>
    </div>
  );
}
