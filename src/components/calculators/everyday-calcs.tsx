"use client";

import * as React from "react";
import { Copy, Plus, Trash2 } from "lucide-react";
import { Field, ResultStat, money, num } from "@/components/calc-page-shell";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { parseNumber, formatNumber } from "@/lib/math-engine";
import { toast } from "sonner";

/* ------------------------------------------------------------------ */
/* Shared bits                                                          */
/* ------------------------------------------------------------------ */

const CURRENCIES = ["USD", "EUR", "GBP", "INR", "BDT", "AUD", "CAD", "SGD"] as const;

function CurrencySelect({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <Field label="Currency">
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Select currency" />
        </SelectTrigger>
        <SelectContent>
          {CURRENCIES.map((c) => (
            <SelectItem key={c} value={c}>
              {c}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </Field>
  );
}

function FormulaBox({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-xl bg-muted/30 border border-border p-4 text-sm text-muted-foreground">
      <strong className="text-foreground">Formula:</strong> {children}
    </div>
  );
}

function CopyableStat({
  label,
  displayValue,
  accent,
  sublabel,
}: {
  label: string;
  displayValue: string;
  accent?: "primary" | "success" | "warning" | "default";
  sublabel?: string;
}) {
  return (
    <div className="relative">
      <Button
        variant="ghost"
        size="icon"
        className="absolute top-2 right-2 size-7 text-muted-foreground hover:text-foreground z-10"
        onClick={() => {
          navigator.clipboard?.writeText(displayValue);
          toast.success(`${label} copied`);
        }}
        aria-label={`Copy ${label}`}
      >
        <Copy className="size-3.5" />
      </Button>
      <ResultStat label={label} value={displayValue} accent={accent} sublabel={sublabel} />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* 1. Tip Calculator                                                    */
/* ------------------------------------------------------------------ */

const TIP_PRESETS = [10, 15, 18, 20, 25];

function TipCalc() {
  const [currency, setCurrency] = React.useState<string>("USD");
  const [bill, setBill] = React.useState("85.00");
  const [tipPct, setTipPct] = React.useState("18");
  const [people, setPeople] = React.useState("1");

  const calc = React.useMemo(() => {
    const b = parseNumber(bill);
    const t = parseNumber(tipPct);
    const p = Math.max(1, Math.round(parseNumber(people)));
    const tip = (b * t) / 100;
    const total = b + tip;
    const perPerson = total / p;
    return { b, t, p, tip, total, perPerson };
  }, [bill, tipPct, people]);

  return (
    <div className="space-y-6">
      <div className="grid sm:grid-cols-2 gap-4">
        <CurrencySelect value={currency} onChange={setCurrency} />
        <Field label="Bill amount">
          <Input
            value={bill}
            onChange={(e) => setBill(e.target.value)}
            inputMode="decimal"
            placeholder="0.00"
          />
        </Field>
        <Field label="Number of people">
          <Input
            value={people}
            onChange={(e) => setPeople(e.target.value)}
            inputMode="numeric"
            placeholder="1"
          />
        </Field>
        <Field label="Tip percentage" hint="Or pick a preset below">
          <Input
            value={tipPct}
            onChange={(e) => setTipPct(e.target.value)}
            inputMode="decimal"
            placeholder="18"
          />
        </Field>
      </div>

      <div className="flex flex-wrap gap-2">
        {TIP_PRESETS.map((p) => (
          <Button
            key={p}
            type="button"
            variant={calc.t === p ? "default" : "outline"}
            size="sm"
            onClick={() => setTipPct(String(p))}
          >
            {p}%
          </Button>
        ))}
      </div>

      <div className="grid sm:grid-cols-3 gap-4">
        <ResultStat label="Tip Amount" value={money(calc.tip, currency)} accent="default" />
        <ResultStat label="Total Bill" value={money(calc.total, currency)} accent="default" />
        <CopyableStat
          label="Per Person"
          displayValue={money(calc.perPerson, currency)}
          accent="primary"
          sublabel={`Split between ${calc.p} ${calc.p === 1 ? "person" : "people"}`}
        />
      </div>

      <FormulaBox>
        Tip = Bill × (Tip% ÷ 100), Total = Bill + Tip, Per Person = Total ÷ People. Here:{" "}
        {money(calc.b, currency)} × {calc.t}% = {money(calc.tip, currency)}, total{" "}
        {money(calc.total, currency)}, divided by {calc.p} = {money(calc.perPerson, currency)}.
      </FormulaBox>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* 2. Split Bill Calculator                                             */
/* ------------------------------------------------------------------ */

function SplitBillCalc() {
  const [currency, setCurrency] = React.useState<string>("USD");
  const [total, setTotal] = React.useState("120.00");
  const [people, setPeople] = React.useState("4");
  const [tipPct, setTipPct] = React.useState("15");
  const [taxPct, setTaxPct] = React.useState("8.5");

  const calc = React.useMemo(() => {
    const subtotal = parseNumber(total);
    const p = Math.max(1, Math.round(parseNumber(people)));
    const t = parseNumber(tipPct);
    const x = parseNumber(taxPct);
    const tax = (subtotal * x) / 100;
    const tip = (subtotal * t) / 100;
    const grand = subtotal + tax + tip;
    const per = grand / p;
    return { subtotal, p, t, x, tax, tip, grand, per };
  }, [total, people, tipPct, taxPct]);

  const breakdown = [
    { label: "Subtotal", value: money(calc.subtotal, currency) },
    { label: `Tax (${calc.x}%)`, value: money(calc.tax, currency) },
    { label: `Tip (${calc.t}%)`, value: money(calc.tip, currency) },
    { label: "Total", value: money(calc.grand, currency), strong: true },
    { label: "Per Person", value: money(calc.per, currency), strong: true },
  ];

  return (
    <div className="space-y-6">
      <div className="grid sm:grid-cols-2 gap-4">
        <CurrencySelect value={currency} onChange={setCurrency} />
        <Field label="Total bill (subtotal)">
          <Input
            value={total}
            onChange={(e) => setTotal(e.target.value)}
            inputMode="decimal"
            placeholder="0.00"
          />
        </Field>
        <Field label="Number of people">
          <Input
            value={people}
            onChange={(e) => setPeople(e.target.value)}
            inputMode="numeric"
            placeholder="1"
          />
        </Field>
        <Field label="Tip (%)" hint="Optional">
          <Input
            value={tipPct}
            onChange={(e) => setTipPct(e.target.value)}
            inputMode="decimal"
            placeholder="0"
          />
        </Field>
        <Field label="Tax (%)" hint="Optional">
          <Input
            value={taxPct}
            onChange={(e) => setTaxPct(e.target.value)}
            inputMode="decimal"
            placeholder="0"
          />
        </Field>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <CopyableStat
          label="Each Person Pays"
          displayValue={money(calc.per, currency)}
          accent="primary"
          sublabel={`Split between ${calc.p} ${calc.p === 1 ? "person" : "people"}`}
        />
        <ResultStat
          label="Total (incl. tax & tip)"
          value={money(calc.grand, currency)}
          accent="default"
        />
      </div>

      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="px-4 py-2 border-b border-border bg-muted/30 text-sm font-semibold">
          Breakdown
        </div>
        <div className="divide-y divide-border">
          {breakdown.map((row) => (
            <div
              key={row.label}
              className="flex items-center justify-between px-4 py-2.5 text-sm"
            >
              <span className={row.strong ? "font-semibold text-foreground" : "text-muted-foreground"}>
                {row.label}
              </span>
              <span
                className={`font-mono ${row.strong ? "font-bold text-foreground" : "text-foreground"}`}
              >
                {row.value}
              </span>
            </div>
          ))}
        </div>
      </div>

      <FormulaBox>
        Total = Subtotal + (Subtotal × Tax%) + (Subtotal × Tip%). Each Person = Total ÷ People. Here:{" "}
        {money(calc.subtotal, currency)} + {money(calc.tax, currency)} (tax) +{" "}
        {money(calc.tip, currency)} (tip) = {money(calc.grand, currency)}, ÷ {calc.p} ={" "}
        {money(calc.per, currency)} per person.
      </FormulaBox>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* 3. Unit Price Calculator                                             */
/* ------------------------------------------------------------------ */

const UNITS = ["each", "kg", "g", "lb", "oz", "L", "mL", "gal"] as const;
type Unit = (typeof UNITS)[number];

// Conversion factor to a base unit per category.
// Mass base = 1 kg, Volume base = 1 L, Count base = 1 each.
const UNIT_FACTOR: Record<Unit, { factor: number; base: "kg" | "L" | "each" }> = {
  each: { factor: 1, base: "each" },
  kg: { factor: 1, base: "kg" },
  g: { factor: 0.001, base: "kg" },
  lb: { factor: 0.45359237, base: "kg" },
  oz: { factor: 0.0283495231, base: "kg" },
  L: { factor: 1, base: "L" },
  mL: { factor: 0.001, base: "L" },
  gal: { factor: 3.785411784, base: "L" },
};

interface ProductInput {
  price: string;
  qty: string;
  unit: Unit;
}

function UnitPriceCalc() {
  const [currency, setCurrency] = React.useState<string>("USD");
  const [nameA, setNameA] = React.useState("Product A");
  const [nameB, setNameB] = React.useState("Product B");
  const [a, setA] = React.useState<ProductInput>({ price: "5.99", qty: "500", unit: "g" });
  const [b, setB] = React.useState<ProductInput>({ price: "8.49", qty: "1", unit: "kg" });

  const calc = React.useMemo(() => {
    const priceA = parseNumber(a.price);
    const qtyA = parseNumber(a.qty);
    const priceB = parseNumber(b.price);
    const qtyB = parseNumber(b.qty);
    const baseQtyA = qtyA * UNIT_FACTOR[a.unit].factor;
    const baseQtyB = qtyB * UNIT_FACTOR[b.unit].factor;
    const perUnitA = baseQtyA > 0 ? priceA / baseQtyA : Infinity;
    const perUnitB = baseQtyB > 0 ? priceB / baseQtyB : Infinity;
    const sameCategory = UNIT_FACTOR[a.unit].base === UNIT_FACTOR[b.unit].base;
    const base = UNIT_FACTOR[a.unit].base;
    const comparable = sameCategory && Number.isFinite(perUnitA) && Number.isFinite(perUnitB);
    const cheaper: "A" | "B" | null = comparable ? (perUnitA <= perUnitB ? "A" : "B") : null;
    const savings =
      comparable && cheaper
        ? Math.abs(perUnitA - perUnitB) * Math.max(baseQtyA, baseQtyB)
        : 0;
    return {
      priceA,
      qtyA,
      priceB,
      qtyB,
      baseQtyA,
      baseQtyB,
      perUnitA,
      perUnitB,
      sameCategory,
      base,
      comparable,
      cheaper,
      savings,
    };
  }, [a, b]);

  const verdict =
    calc.comparable && calc.cheaper
      ? calc.cheaper === "A"
        ? `${nameA || "Product A"} is the better value`
        : `${nameB || "Product B"} is the better value`
      : !calc.sameCategory
        ? "Different unit categories — cannot directly compare."
        : "Enter valid price and quantity for both products.";

  return (
    <div className="space-y-6">
      <div className="grid sm:grid-cols-2 gap-4">
        <CurrencySelect value={currency} onChange={setCurrency} />
        <div className="hidden sm:block" />
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        {/* Product A */}
        <div className="rounded-xl border border-border bg-card p-4 space-y-3">
          <Field label="Product A name">
            <Input value={nameA} onChange={(e) => setNameA(e.target.value)} placeholder="Product A" />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Price">
              <Input
                value={a.price}
                onChange={(e) => setA((p) => ({ ...p, price: e.target.value }))}
                inputMode="decimal"
              />
            </Field>
            <Field label="Quantity">
              <Input
                value={a.qty}
                onChange={(e) => setA((p) => ({ ...p, qty: e.target.value }))}
                inputMode="decimal"
              />
            </Field>
          </div>
          <Field label="Unit">
            <Select value={a.unit} onValueChange={(v) => setA((p) => ({ ...p, unit: v as Unit }))}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {UNITS.map((u) => (
                  <SelectItem key={u} value={u}>
                    {u}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
        </div>

        {/* Product B */}
        <div className="rounded-xl border border-border bg-card p-4 space-y-3">
          <Field label="Product B name">
            <Input value={nameB} onChange={(e) => setNameB(e.target.value)} placeholder="Product B" />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Price">
              <Input
                value={b.price}
                onChange={(e) => setB((p) => ({ ...p, price: e.target.value }))}
                inputMode="decimal"
              />
            </Field>
            <Field label="Quantity">
              <Input
                value={b.qty}
                onChange={(e) => setB((p) => ({ ...p, qty: e.target.value }))}
                inputMode="decimal"
              />
            </Field>
          </div>
          <Field label="Unit">
            <Select value={b.unit} onValueChange={(v) => setB((p) => ({ ...p, unit: v as Unit }))}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {UNITS.map((u) => (
                  <SelectItem key={u} value={u}>
                    {u}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <ResultStat
          label={`${nameA || "Product A"} — price per ${calc.base}`}
          value={Number.isFinite(calc.perUnitA) ? money(calc.perUnitA, currency) : "—"}
          accent={calc.cheaper === "A" ? "success" : "default"}
          sublabel={`${money(calc.priceA, currency)} ÷ ${num(calc.baseQtyA, 3)} ${calc.base}`}
        />
        <ResultStat
          label={`${nameB || "Product B"} — price per ${calc.base}`}
          value={Number.isFinite(calc.perUnitB) ? money(calc.perUnitB, currency) : "—"}
          accent={calc.cheaper === "B" ? "success" : "default"}
          sublabel={`${money(calc.priceB, currency)} ÷ ${num(calc.baseQtyB, 3)} ${calc.base}`}
        />
      </div>

      <div className="rounded-xl border border-border bg-card p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            Verdict
          </div>
          <div className="text-base font-semibold text-foreground mt-1">{verdict}</div>
        </div>
        {calc.comparable && calc.savings > 0 && (
          <div className="text-sm text-muted-foreground">
            Save up to{" "}
            <span className="font-mono font-semibold text-foreground">
              {money(calc.savings, currency)}
            </span>{" "}
            per {calc.base} of larger quantity
          </div>
        )}
      </div>

      <FormulaBox>
        Price per unit = Price ÷ (Quantity × Unit Factor). Mass units convert to kilograms (kg),
        volume units to liters (L), and counts stay as "each". Only products in the same unit
        category can be directly compared.
      </FormulaBox>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* 4. Savings Goal Calculator                                           */
/* ------------------------------------------------------------------ */

function SavingsGoalCalc() {
  const [currency, setCurrency] = React.useState<string>("USD");
  const [target, setTarget] = React.useState("20000");
  const [current, setCurrent] = React.useState("5000");
  const [monthly, setMonthly] = React.useState("400");
  const [rate, setRate] = React.useState("4.5");

  const calc = React.useMemo(() => {
    const goal = parseNumber(target);
    const start = parseNumber(current);
    const pmt = parseNumber(monthly);
    const annual = parseNumber(rate) / 100;
    const r = annual / 12;

    // Solve FV(t) = start*(1+r)^t + pmt * (((1+r)^t - 1)/r) >= goal for smallest integer t.
    let months = Infinity;
    if (start >= goal && goal > 0) {
      months = 0;
    } else if (goal <= 0) {
      months = 0;
    } else if (pmt <= 0 && r <= 0) {
      months = start >= goal ? 0 : Infinity;
    } else if (r === 0) {
      months = pmt > 0 ? Math.ceil((goal - start) / pmt) : Infinity;
    } else {
      // Iterate monthly up to 1200 months (100 years).
      let balance = start;
      let t = 0;
      const MAX = 1200;
      while (balance < goal && t < MAX) {
        balance = balance * (1 + r) + pmt;
        t += 1;
      }
      months = balance >= goal ? t : Infinity;
    }

    const reachable = Number.isFinite(months);
    const years = reachable ? Math.floor(months / 12) : 0;
    const remMonths = reachable ? months % 12 : 0;
    const totalContributions = start + pmt * (reachable ? months : 0);
    const finalBalance = reachable
      ? start * Math.pow(1 + r, months) +
        (r === 0 ? pmt * months : pmt * ((Math.pow(1 + r, months) - 1) / r))
      : 0;
    const interestEarned = finalBalance - totalContributions;

    return {
      goal,
      start,
      pmt,
      r,
      months,
      reachable,
      years,
      remMonths,
      totalContributions,
      finalBalance,
      interestEarned,
    };
  }, [target, current, monthly, rate]);

  const monthsDisplay = calc.reachable ? formatNumber(calc.months) : "Never (increase contributions or rate)";

  return (
    <div className="space-y-6">
      <div className="grid sm:grid-cols-2 gap-4">
        <CurrencySelect value={currency} onChange={setCurrency} />
        <Field label="Target amount">
          <Input
            value={target}
            onChange={(e) => setTarget(e.target.value)}
            inputMode="decimal"
            placeholder="0.00"
          />
        </Field>
        <Field label="Current savings">
          <Input
            value={current}
            onChange={(e) => setCurrent(e.target.value)}
            inputMode="decimal"
            placeholder="0.00"
          />
        </Field>
        <Field label="Monthly contribution">
          <Input
            value={monthly}
            onChange={(e) => setMonthly(e.target.value)}
            inputMode="decimal"
            placeholder="0.00"
          />
        </Field>
        <Field label="Annual interest rate (%)">
          <Input
            value={rate}
            onChange={(e) => setRate(e.target.value)}
            inputMode="decimal"
            placeholder="0.00"
          />
        </Field>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <CopyableStat
          label="Months to Goal"
          displayValue={monthsDisplay}
          accent="primary"
          sublabel={
            calc.reachable
              ? `${calc.years} yr ${calc.remMonths} mo`
              : "Goal not reachable with current inputs"
          }
        />
        <ResultStat
          label="Total Contributions"
          value={money(calc.totalContributions, currency)}
          accent="default"
          sublabel={`Starting ${money(calc.start, currency)} + ${money(calc.pmt, currency)}/mo`}
        />
        <ResultStat
          label="Interest Earned"
          value={money(calc.interestEarned, currency)}
          accent="success"
          sublabel={`At ${parseNumber(rate)}% APY, compounded monthly`}
        />
        <ResultStat
          label="Projected Balance at Goal"
          value={money(calc.finalBalance, currency)}
          accent="default"
          sublabel={`Target: ${money(calc.goal, currency)}`}
        />
      </div>

      <FormulaBox>
        Each month: Balance = Balance × (1 + r/12) + Contribution, where r is the annual rate.
        Months to Goal is the smallest month count where the projected balance first meets or
        exceeds your target. Interest Earned = Final Balance − Total Contributions.
      </FormulaBox>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* 5. Subscription Cost Calculator                                      */
/* ------------------------------------------------------------------ */

interface SubRow {
  id: string;
  name: string;
  cost: string;
}

let SUB_ID = 0;
function nextSubId() {
  SUB_ID += 1;
  return `sub-${SUB_ID}`;
}

function SubscriptionCalc() {
  const [currency, setCurrency] = React.useState<string>("USD");
  const [rows, setRows] = React.useState<SubRow[]>([
    { id: nextSubId(), name: "Netflix", cost: "15.49" },
    { id: nextSubId(), name: "Spotify", cost: "9.99" },
  ]);

  const calc = React.useMemo(() => {
    const parsed = rows.map((r) => ({
      ...r,
      amount: parseNumber(r.cost),
    }));
    const monthly = parsed.reduce((s, r) => s + r.amount, 0);
    const annual = monthly * 12;
    const fiveYear = monthly * 60;
    const tenYear = monthly * 120;
    return { parsed, monthly, annual, fiveYear, tenYear };
  }, [rows]);

  const addRow = () => {
    setRows((rs) => [...rs, { id: nextSubId(), name: "", cost: "" }]);
  };
  const removeRow = (id: string) => {
    setRows((rs) => rs.filter((r) => r.id !== id));
  };
  const updateRow = (id: string, field: keyof Omit<SubRow, "id">, value: string) => {
    setRows((rs) => rs.map((r) => (r.id === id ? { ...r, [field]: value } : r)));
  };

  return (
    <div className="space-y-6">
      <div className="grid sm:grid-cols-2 gap-4">
        <CurrencySelect value={currency} onChange={setCurrency} />
        <div className="flex items-end">
          <Button variant="outline" size="sm" onClick={addRow} className="w-full sm:w-auto">
            <Plus className="size-4" /> Add subscription
          </Button>
        </div>
      </div>

      <div className="space-y-2">
        <div className="hidden sm:grid grid-cols-[1fr_10rem_2.5rem] gap-3 px-1 text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
          <div>Subscription name</div>
          <div>Monthly cost</div>
          <div />
        </div>
        {rows.map((row) => (
          <div
            key={row.id}
            className="grid grid-cols-[1fr_10rem_2.5rem] gap-3 items-center"
          >
            <Input
              value={row.name}
              onChange={(e) => updateRow(row.id, "name", e.target.value)}
              placeholder="Subscription name"
            />
            <Input
              value={row.cost}
              onChange={(e) => updateRow(row.id, "cost", e.target.value)}
              inputMode="decimal"
              placeholder="0.00"
            />
            <Button
              variant="ghost"
              size="icon"
              className="text-muted-foreground hover:text-destructive"
              onClick={() => removeRow(row.id)}
              aria-label="Remove subscription"
              disabled={rows.length <= 1}
            >
              <Trash2 className="size-4" />
            </Button>
          </div>
        ))}
        {rows.length === 0 && (
          <div className="rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
            No subscriptions yet. Click "Add subscription" to start tracking.
          </div>
        )}
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <CopyableStat
          label="Monthly Total"
          displayValue={money(calc.monthly, currency)}
          accent="primary"
          sublabel={`${rows.length} ${rows.length === 1 ? "subscription" : "subscriptions"}`}
        />
        <ResultStat label="Annual Total" value={money(calc.annual, currency)} accent="default" />
        <ResultStat label="5-Year Total" value={money(calc.fiveYear, currency)} accent="warning" />
        <ResultStat label="10-Year Total" value={money(calc.tenYear, currency)} accent="warning" />
      </div>

      {rows.length > 0 && (
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <div className="px-4 py-2 border-b border-border bg-muted/30 text-sm font-semibold">
            Per-subscription annual cost
          </div>
          <div className="divide-y divide-border">
            {calc.parsed.map((r) => (
              <div
                key={r.id}
                className="flex items-center justify-between px-4 py-2.5 text-sm"
              >
                <span className="text-foreground truncate pr-2">
                  {r.name || "Untitled subscription"}
                </span>
                <span className="font-mono text-muted-foreground shrink-0">
                  {money(r.amount * 12, currency)}/yr
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      <FormulaBox>
        Monthly Total = sum of all monthly costs. Annual = Monthly × 12. 5-Year = Monthly × 60.
        10-Year = Monthly × 120. These figures ignore price changes, taxes, and inflation over
        time — they are simple projections of the current monthly cost.
      </FormulaBox>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Router                                                               */
/* ------------------------------------------------------------------ */

export function EverydayCalcs({ calcId }: { calcId: string }) {
  switch (calcId) {
    case "tip":
      return <TipCalc />;
    case "split-bill":
      return <SplitBillCalc />;
    case "unit-price":
      return <UnitPriceCalc />;
    case "savings-goal":
      return <SavingsGoalCalc />;
    case "subscription":
      return <SubscriptionCalc />;
    default:
      return null;
  }
}
