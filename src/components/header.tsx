"use client";

import * as React from "react";
import { useTheme } from "next-themes";
import {
  Search, Star, Menu, X, Moon, Sun, Home, Grid3x3, Calculator,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Popover, PopoverContent, PopoverTrigger,
} from "@/components/ui/popover";
import { CalcoraWordmark } from "@/components/calcora-logo";
import { useCalc, searchCalculators, CALCULATORS } from "@/lib/calculators-store-bridge";
import { cn } from "@/lib/utils";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger,
} from "@/components/ui/sheet";

export function Header() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => setMounted(true), []);
  const { openCalc, goHome, setView, activeView, favorites, setSidebarOpen } = useCalc();
  const [query, setQuery] = React.useState("");
  const [open, setOpen] = React.useState(false);
  const results = React.useMemo(() => searchCalculators(query), [query]);

  const navItems: { label: string; view: "home" | "directory" }[] = [
    { label: "Home", view: "home" },
    { label: "All Calculators", view: "directory" },
  ];

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/60 glass">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-3 px-4 sm:px-6">
        <button
          className="md:hidden -ml-1 p-2 rounded-lg hover:bg-muted"
          onClick={() => setSidebarOpen(true)}
          aria-label="Open menu"
        >
          <Menu className="size-5" />
        </button>

        <button onClick={goHome} className="shrink-0 hover:opacity-80 transition-opacity">
          <CalcoraWordmark />
        </button>

        <nav className="hidden md:flex items-center gap-1 ml-4">
          {navItems.map(n => (
            <button
              key={n.view}
              onClick={() => setView(n.view)}
              className={cn(
                "px-3 py-1.5 text-sm font-medium rounded-lg transition-colors",
                activeView === n.view
                  ? "bg-accent text-accent-foreground"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted",
              )}
            >
              {n.label}
            </button>
          ))}
        </nav>

        <div className="flex-1 max-w-md mx-auto hidden sm:block">
          <Popover open={open && query.length > 0} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <Input
                  value={query}
                  onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
                  placeholder="Search calculators… (try 'loan', 'BMI', 'tax US')"
                  className="pl-9 h-10 rounded-xl bg-muted/50 border-transparent focus-visible:bg-background"
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && results[0]) {
                      openCalc(results[0].id);
                      setQuery("");
                      setOpen(false);
                    }
                    if (e.key === "Escape") { setOpen(false); setQuery(""); }
                  }}
                />
              </div>
            </PopoverTrigger>
            <PopoverContent className="p-0 w-[--radix-popover-trigger-width] max-w-[520px]" align="start">
              <div className="max-h-80 overflow-y-auto py-2">
                {results.length === 0 ? (
                  <div className="px-4 py-6 text-center text-sm text-muted-foreground">
                    No calculators found for "{query}"
                  </div>
                ) : (
                  results.map(r => (
                    <button
                      key={r.id}
                      onClick={() => { openCalc(r.id); setQuery(""); setOpen(false); }}
                      className="w-full text-left px-4 py-2.5 hover:bg-accent/50 flex items-start gap-3 transition-colors"
                    >
                      <Calculator className="size-4 mt-0.5 text-primary shrink-0" />
                      <div className="min-w-0">
                        <div className="font-medium text-sm truncate">{r.name}</div>
                        <div className="text-xs text-muted-foreground truncate">{r.description}</div>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </PopoverContent>
          </Popover>
        </div>

        <div className="flex items-center gap-1 ml-auto">
          <Button
            variant="ghost"
            size="icon"
            className="rounded-lg"
            onClick={() => setView("directory")}
            aria-label="Browse all calculators"
            title="All calculators"
          >
            <Grid3x3 className="size-5" />
          </Button>
          {favorites.length > 0 && (
            <Button
              variant="ghost"
              size="icon"
              className="rounded-lg relative"
              onClick={() => setView("directory")}
              aria-label="Favorites"
              title="Your favorites"
            >
              <Star className="size-5 fill-warning text-warning" />
              <span className="absolute -top-0.5 -right-0.5 size-4 rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center">
                {favorites.length}
              </span>
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="rounded-lg"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            aria-label="Toggle theme"
            title="Toggle dark/light"
          >
            {mounted && theme === "dark" ? <Sun className="size-5" /> : <Moon className="size-5" />}
          </Button>
        </div>
      </div>

      {/* Mobile search */}
      <div className="sm:hidden px-4 pb-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
            placeholder="Search calculators…"
            className="pl-9 h-10 rounded-xl bg-muted/50 border-transparent"
            onKeyDown={(e) => {
              if (e.key === "Enter" && results[0]) { openCalc(results[0].id); setQuery(""); setOpen(false); }
            }}
          />
          {open && query && (
            <div className="absolute z-50 top-11 left-0 right-0 bg-popover border border-border rounded-xl shadow-lg max-h-72 overflow-y-auto">
              {results.length === 0 ? (
                <div className="px-4 py-4 text-sm text-muted-foreground">No results</div>
              ) : results.map(r => (
                <button
                  key={r.id}
                  onClick={() => { openCalc(r.id); setQuery(""); setOpen(false); }}
                  className="w-full text-left px-4 py-2.5 hover:bg-accent/50 flex items-start gap-3"
                >
                  <Calculator className="size-4 mt-0.5 text-primary shrink-0" />
                  <div className="min-w-0">
                    <div className="font-medium text-sm truncate">{r.name}</div>
                    <div className="text-xs text-muted-foreground truncate">{r.description}</div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

export function MobileSidebar() {
  const { sidebarOpen, setSidebarOpen, openCalc, setView, goHome, activeCalcId } = useCalc();
  const categories = Array.from(new Set(CALCULATORS.map(c => c.category)));

  return (
    <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
      <SheetContent side="left" className="w-[300px] sm:w-[340px] p-0">
        <SheetHeader className="px-5 py-4 border-b border-border">
          <SheetTitle className="text-left">
            <CalcoraWordmark />
          </SheetTitle>
        </SheetHeader>
        <div className="overflow-y-auto h-[calc(100vh-4rem)]">
          <div className="p-3">
            <button
              onClick={() => setView("home")}
              className="w-full text-left px-3 py-2 rounded-lg hover:bg-accent text-sm font-medium flex items-center gap-2"
            >
              <Home className="size-4" /> Home
            </button>
            <button
              onClick={() => setView("directory")}
              className="w-full text-left px-3 py-2 rounded-lg hover:bg-accent text-sm font-medium flex items-center gap-2"
            >
              <Grid3x3 className="size-4" /> All Calculators
            </button>
          </div>
          <div className="px-3 pb-6">
            <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground px-3 mb-2">
              Categories
            </div>
            {categories.map(cat => (
              <div key={cat} className="mb-1">
                <button
                  onClick={() => setView("directory")}
                  className="w-full text-left px-3 py-2 rounded-lg hover:bg-accent text-sm capitalize"
                >
                  {cat}
                </button>
              </div>
            ))}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
