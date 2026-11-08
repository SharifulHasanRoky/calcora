"use client";

import * as React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { parseNumber } from "@/lib/math-engine";
import { toast } from "sonner";

function gcd(a: number, b: number): number {
  a = Math.abs(Math.round(a)); b = Math.abs(Math.round(b));
  while (b) { [a, b] = [b, a % b]; }
  return a;
}

export function FractionCalculator() {
  const [aNum, setANum] = React.useState("1");
  const [aDen, setADen] = React.useState("2");
  const [bNum, setBNum] = React.useState("3");
  const [bDen, setBDen] = React.useState("4");
  const [op, setOp] = React.useState<"+" | "-" | "*" | "/">("+");
  const [simplifyInput, setSimplifyInput] = React.useState("8 / 12");

  const aN = parseNumber(aNum), aD = parseNumber(aDen);
  const bN = parseNumber(bNum), bD = parseNumber(bDen);

  const compute = (n1: number, d1: number, n2: number, d2: number, operator: string): { ok: true; num: number; den: number } | { ok: false; error: string } => {
    if (d1 === 0 || d2 === 0) return { ok: false, error: "Denominator cannot be zero" };
    let rn: number, rd: number;
    switch (operator) {
      case "+": rn = n1 * d2 + n2 * d1; rd = d1 * d2; break;
      case "-": rn = n1 * d2 - n2 * d1; rd = d1 * d2; break;
      case "*": rn = n1 * n2; rd = d1 * d2; break;
      case "/": if (n2 === 0) return { ok: false, error: "Division by zero" }; rn = n1 * d2; rd = d1 * n2; break;
      default: return { ok: false, error: "Unknown operator" };
    }
    const g = gcd(rn, rd) || 1;
    const sign = (rn < 0) !== (rd < 0) ? -1 : 1;
    return { ok: true, num: sign * Math.abs(rn) / g, den: Math.abs(rd) / g };
  };

  const result = compute(aN, aD, bN, bD, op);
  const decimal = result.ok ? result.num / result.den : NaN;

  // Simplify input parsing: "8 / 12" or "8/12" or "0.75"
  const simplifyResult = React.useMemo(() => {
    const m = simplifyInput.match(/(-?\d+(?:\.\d+)?)\s*\/\s*(-?\d+(?:\.\d+)?)/);
    if (m) {
      const n = parseFloat(m[1]);
      const d = parseFloat(m[2]);
      if (d === 0) return { ok: false as const, error: "Denominator is zero" };
      // Convert to integer fraction
      const decimals = Math.max((m[1].split(".")[1]?.length || 0), (m[2].split(".")[1]?.length || 0));
      const factor = Math.pow(10, decimals);
      const ni = Math.round(n * factor);
      const di = Math.round(d * factor);
      const g = gcd(ni, di) || 1;
      const sign = (ni < 0) !== (di < 0) ? -1 : 1;
      return { ok: true as const, num: sign * Math.abs(ni) / g, den: Math.abs(di) / g, decimal: n / d };
    }
    // Try decimal → fraction
    const dec = parseFloat(simplifyInput);
    if (!isNaN(dec)) {
      let n = dec;
      let neg = n < 0; n = Math.abs(n);
      let num = Math.round(n * 1e10);
      let den = 1e10;
      const g = gcd(num, den) || 1;
      return { ok: true as const, num: (neg ? -1 : 1) * num / g, den: den / g, decimal: dec };
    }
    return { ok: false as const, error: "Enter a fraction like 8/12 or a decimal like 0.75" };
  }, [simplifyInput]);

  return (
    <div className="space-y-4">
      <Tabs defaultValue="arithmetic">
        <TabsList>
          <TabsTrigger value="arithmetic">Fraction arithmetic</TabsTrigger>
          <TabsTrigger value="simplify">Simplify / convert</TabsTrigger>
        </TabsList>

        <TabsContent value="arithmetic" className="space-y-4 mt-4">
          <div className="grid grid-cols-[1fr_auto_1fr] gap-3 items-center">
            <FractionInput num={aNum} den={aDen} onNum={setANum} onDen={setADen} label="Fraction A" />
            <div className="flex flex-col gap-1">
              {(["+", "-", "*", "/"] as const).map(o => (
                <Button
                  key={o}
                  variant={op === o ? "default" : "outline"}
                  size="sm"
                  className="h-9 w-10"
                  onClick={() => setOp(o)}
                >{o}</Button>
              ))}
            </div>
            <FractionInput num={bNum} den={bDen} onNum={setBNum} onDen={setBDen} label="Fraction B" />
          </div>

          <div className="rounded-2xl border border-border bg-card p-5 text-center">
            <div className="text-xs text-muted-foreground uppercase tracking-wider mb-2">Result</div>
            {result.ok ? (
              <>
                <div className="text-3xl font-bold font-mono">
                  <span className="inline-flex flex-col items-center align-middle">
                    <span>{result.num}</span>
                    <span className="border-t border-foreground w-full my-1" />
                    <span>{result.den}</span>
                  </span>
                </div>
                <div className="text-sm text-muted-foreground mt-2 font-mono">= {decimal.toFixed(6).replace(/\.?0+$/, "")}</div>
              </>
            ) : (
              <div className="text-destructive">{result.error}</div>
            )}
          </div>

          <div className="rounded-xl bg-muted/30 border border-border p-4 text-sm text-muted-foreground">
            <p><strong className="text-foreground">Method:</strong> a/b ± c/d = (a·d ± c·b) / (b·d), then simplify by dividing numerator and denominator by their GCD.</p>
          </div>
        </TabsContent>

        <TabsContent value="simplify" className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="simplify-input">Enter a fraction (8/12) or a decimal (0.75)</Label>
            <Input
              id="simplify-input"
              value={simplifyInput}
              onChange={(e) => setSimplifyInput(e.target.value)}
              className="font-mono"
              placeholder="8 / 12"
            />
          </div>
          {"ok" in simplifyResult && simplifyResult.ok ? (
            <div className="rounded-2xl border border-border bg-card p-5 text-center">
              <div className="text-xs text-muted-foreground uppercase tracking-wider mb-2">Simplified</div>
              <div className="text-3xl font-bold font-mono">
                <span className="inline-flex flex-col items-center align-middle">
                  <span>{simplifyResult.num}</span>
                  <span className="border-t border-foreground w-full my-1" />
                  <span>{simplifyResult.den}</span>
                </span>
              </div>
              <div className="text-sm text-muted-foreground mt-2 font-mono">= {simplifyResult.decimal.toFixed(6).replace(/\.?0+$/, "")}</div>
              <Button variant="outline" size="sm" className="mt-3" onClick={() => { navigator.clipboard?.writeText(`${simplifyResult.num}/${simplifyResult.den}`); toast.success("Copied"); }}>
                Copy
              </Button>
            </div>
          ) : (
            <div className="rounded-2xl border border-border bg-card p-5 text-center text-destructive text-sm">
              {"error" in simplifyResult ? simplifyResult.error : "Invalid input"}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function FractionInput({
  num, den, onNum, onDen, label,
}: { num: string; den: string; onNum: (v: string) => void; onDen: (v: string) => void; label: string }) {
  return (
    <div className="space-y-1">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      <div className="inline-flex flex-col items-center w-full">
        <Input value={num} onChange={(e) => onNum(e.target.value)} className="text-center font-mono h-10" />
        <div className="border-t border-foreground w-full my-1" />
        <Input value={den} onChange={(e) => onDen(e.target.value)} className="text-center font-mono h-10" />
      </div>
    </div>
  );
}
