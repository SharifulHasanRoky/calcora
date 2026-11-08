"use client";

import { CalcoraWordmark } from "@/components/calcora-logo";
import { useCalc, CATEGORY_META, type CalcCategory } from "@/lib/calculators-store-bridge";
import { Github, Twitter, Mail } from "lucide-react";

export function Footer() {
  const { setView, openCalc } = useCalc();
  const cats = Object.keys(CATEGORY_META) as CalcCategory[];

  return (
    <footer className="mt-auto border-t border-border bg-card/40">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 py-10">
        <div className="grid gap-8 md:grid-cols-4">
          <div className="md:col-span-1">
            <CalcoraWordmark />
            <p className="mt-3 text-sm text-muted-foreground max-w-xs">
              Every calculation. One beautiful experience. Free, private, and lightning-fast.
            </p>
            <div className="flex gap-2 mt-4">
              <a href="#" className="size-8 grid place-items-center rounded-lg border border-border hover:bg-muted" aria-label="GitHub"><Github className="size-4" /></a>
              <a href="#" className="size-8 grid place-items-center rounded-lg border border-border hover:bg-muted" aria-label="Twitter"><Twitter className="size-4" /></a>
              <a href="#" className="size-8 grid place-items-center rounded-lg border border-border hover:bg-muted" aria-label="Email"><Mail className="size-4" /></a>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold mb-3">Categories</h3>
            <ul className="space-y-2 text-sm">
              {cats.slice(0, 6).map(c => (
                <li key={c}>
                  <button onClick={() => setView("directory")} className="text-muted-foreground hover:text-primary capitalize">
                    {CATEGORY_META[c].name}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold mb-3">Popular</h3>
            <ul className="space-y-2 text-sm">
              {["universal", "bmi", "tax-us", "loan", "percentage", "compound-interest"].map(id => (
                <li key={id}>
                  <button
                    onClick={() => openCalc(id)}
                    className="text-muted-foreground hover:text-primary"
                  >
                    {id === "universal" ? "Universal Calculator" :
                     id === "tax-us" ? "US Income Tax" :
                     id.charAt(0).toUpperCase() + id.slice(1).replace(/-/g, " ")}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold mb-3">Company</h3>
            <ul className="space-y-2 text-sm">
              <li><button onClick={() => setView("about")} className="text-muted-foreground hover:text-primary">About</button></li>
              <li><button onClick={() => setView("privacy")} className="text-muted-foreground hover:text-primary">Privacy Policy</button></li>
              <li><button onClick={() => setView("terms")} className="text-muted-foreground hover:text-primary">Terms of Service</button></li>
              <li><button onClick={() => setView("about")} className="text-muted-foreground hover:text-primary">Disclaimer</button></li>
            </ul>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-border flex flex-col sm:flex-row justify-between gap-3 text-xs text-muted-foreground">
          <p>© {new Date().getFullYear()} CALCORA. All calculations are estimates for informational purposes only.</p>
          <p>Built with privacy first. No account required.</p>
        </div>
      </div>
    </footer>
  );
}
