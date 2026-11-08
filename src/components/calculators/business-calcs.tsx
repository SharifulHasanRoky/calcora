"use client";

import * as React from "react";
import { Copy } from "lucide-react";
import { Field, ResultStat, money, num } from "@/components/calc-page-shell";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { parseNumber, formatNumber } from "@/lib/math-engine";
import { toast } from "sonner";

/* ------------------------------------------------------------------ */
/* Shared bits                                                          */
/* ------------------------------------------------------------------ */

const CURRENCIES = ["USD", "EUR", "GBP", "INR", "BDT", "AUD", "CAD", "SGD"] as const;
const CURRENCY_SYMBOLS: Record<string, string> = {
  USD: "$",
  EUR: "€",
  GBP: "£",
  INR: "₹",
  BDT: "৳",
  AUD: "A$",
  CAD: "C$",
  SGD: "S$",
};

function CurrencySelect({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <Field label="Currency">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm"
      >
        {CURRENCIES.map((c) => (
          <option key={c} value={c}>
            {c} {CURRENCY_SYMBOLS[c]}
          </option>
        ))}
      </select>
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
        className="absolute top-2 right-2 size-7 text-muted-foreground hover:text-foreground"
        onClick={() => {
          navigator.clipboard?.writeText(displayValue);
          toast.success(`${label} copied`);
        }}
        aria-label={`Copy ${label}`}
      >
        <Copy className="size-3.5" />
      </Button>
      <ResultStat
        label={label}
        value={displayValue}
        accent={accent}
        sublabel={sublabel}
      />
    </div>
  );
}

/** Adaptive percentage formatter: integers render without decimals. */
function pct(n: number): string {
  if (!Number.isFinite(n)) return "—";
  const isInt = Math.abs(n - Math.round(n)) < 1e-9;
  return `${isInt ? n.toFixed(0) : n.toFixed(2)}%`;
}

/* ------------------------------------------------------------------ */
/* 1. Profit Calculator                                                */
/* ------------------------------------------------------------------ */

function ProfitCalc() {
  const [currency, setCurrency] = React.useState("USD");
  const [revenue, setRevenue] = React.useState("50000");
  const [cost, setCost] = React.useState("30000");

  const calc = React.useMemo(() => {
    const r = parseNumber(revenue);
    const c = parseNumber(cost);
    const gross = r - c;
    const margin = r > 0 ? (gross / r) * 100 : 0;
    return { revenue: r, cost: c, gross, margin };
  }, [revenue, cost]);

  return (
    <div className="space-y-6">
      <div className="grid sm:grid-cols-2 gap-4">
        <CurrencySelect value={currency} onChange={setCurrency} />
        <div className="hidden sm:block" />
        <Field label="Total Revenue">
          <Input
            value={revenue}
            onChange={(e) => setRevenue(e.target.value)}
            inputMode="decimal"
          />
        </Field>
        <Field label="Total Cost (COGS + Opex)">
          <Input
            value={cost}
            onChange={(e) => setCost(e.target.value)}
            inputMode="decimal"
          />
        </Field>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <CopyableStat
          label="Gross Profit"
          displayValue={money(calc.gross, currency)}
          accent={calc.gross >= 0 ? "primary" : "warning"}
          sublabel={calc.gross >= 0 ? "Operating profitably" : "Operating at a loss"}
        />
        <ResultStat
          label="Profit Margin"
          value={pct(calc.margin)}
          accent={calc.margin >= 0 ? "success" : "warning"}
          sublabel="Profit as a share of revenue"
        />
      </div>

      <FormulaBox>
        Gross Profit = Revenue − Cost · Profit Margin (%) = (Gross Profit / Revenue) × 100
      </FormulaBox>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* 2. Business Valuation                                               */
/* ------------------------------------------------------------------ */

function BusinessValuationCalc() {
  const [currency, setCurrency] = React.useState("USD");
  const [earnings, setEarnings] = React.useState("250000");
  const [multiple, setMultiple] = React.useState("3.5");

  const calc = React.useMemo(() => {
    const e = parseNumber(earnings);
    const m = parseNumber(multiple);
    const mid = e * m;
    const low = e * m * 0.75;
    const high = e * m * 1.25;
    return { earnings: e, multiple: m, low, mid, high };
  }, [earnings, multiple]);

  return (
    <div className="space-y-6">
      <div className="grid sm:grid-cols-2 gap-4">
        <CurrencySelect value={currency} onChange={setCurrency} />
        <div className="hidden sm:block" />
        <Field label="Annual Earnings (EBITDA)">
          <Input
            value={earnings}
            onChange={(e) => setEarnings(e.target.value)}
            inputMode="decimal"
          />
        </Field>
        <Field label="Industry Multiple" hint="Typical range: 2x – 6x depending on sector">
          <Input
            value={multiple}
            onChange={(e) => setMultiple(e.target.value)}
            inputMode="decimal"
          />
        </Field>
      </div>

      <div className="grid sm:grid-cols-3 gap-4">
        <ResultStat
          label="Low (0.75×)"
          value={money(calc.low, currency)}
          accent="default"
          sublabel="Conservative estimate"
        />
        <CopyableStat
          label="Mid (1.0×)"
          displayValue={money(calc.mid, currency)}
          accent="primary"
          sublabel="Base valuation"
        />
        <ResultStat
          label="High (1.25×)"
          value={money(calc.high, currency)}
          accent="success"
          sublabel="Optimistic estimate"
        />
      </div>

      <FormulaBox>
        Valuation = Annual Earnings × Industry Multiple. Low / Mid / High apply 0.75×, 1.0×, and
        1.25× to the multiple for a defensible valuation range.
      </FormulaBox>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* 3. Inventory Turnover                                               */
/* ------------------------------------------------------------------ */

function InventoryTurnoverCalc() {
  const [cogs, setCogs] = React.useState("400000");
  const [avgInventory, setAvgInventory] = React.useState("80000");

  const calc = React.useMemo(() => {
    const c = parseNumber(cogs);
    const inv = parseNumber(avgInventory);
    const turnover = inv > 0 ? c / inv : 0;
    const days = turnover > 0 ? 365 / turnover : 0;
    return { cogs: c, avgInventory: inv, turnover, days };
  }, [cogs, avgInventory]);

  return (
    <div className="space-y-6">
      <div className="grid sm:grid-cols-2 gap-4">
        <Field label="Cost of Goods Sold (COGS)">
          <Input
            value={cogs}
            onChange={(e) => setCogs(e.target.value)}
            inputMode="decimal"
          />
        </Field>
        <Field label="Average Inventory" hint="(Beginning + Ending) / 2">
          <Input
            value={avgInventory}
            onChange={(e) => setAvgInventory(e.target.value)}
            inputMode="decimal"
          />
        </Field>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <CopyableStat
          label="Inventory Turnover"
          displayValue={`${formatNumber(calc.turnover, 2)}x`}
          accent="primary"
          sublabel="Times inventory is sold per year"
        />
        <ResultStat
          label="Days in Inventory"
          value={`${formatNumber(calc.days, 1)} days`}
          accent="default"
          sublabel="Average days to sell through stock"
        />
      </div>

      <FormulaBox>
        Inventory Turnover = COGS / Average Inventory · Days in Inventory = 365 / Inventory Turnover
      </FormulaBox>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* 4. Shipping Cost Calculator                                         */
/* ------------------------------------------------------------------ */

function ShippingCalc() {
  const [currency, setCurrency] = React.useState("USD");
  const [mode, setMode] = React.useState<"per-item" | "weight">("per-item");

  const [totalCost, setTotalCost] = React.useState("120");
  const [numItems, setNumItems] = React.useState("40");
  const [totalWeight, setTotalWeight] = React.useState("20");
  const [itemWeight, setItemWeight] = React.useState("2");

  const calc = React.useMemo(() => {
    const cost = parseNumber(totalCost);
    if (mode === "per-item") {
      const items = parseNumber(numItems);
      const perItem = items > 0 ? cost / items : 0;
      return { perItem, share: 1, items };
    }
    const tw = parseNumber(totalWeight);
    const iw = parseNumber(itemWeight);
    const share = tw > 0 ? iw / tw : 0;
    const perItem = cost * share;
    return { perItem, share, items: tw };
  }, [mode, totalCost, numItems, totalWeight, itemWeight]);

  return (
    <div className="space-y-6">
      <div className="grid sm:grid-cols-2 gap-4">
        <CurrencySelect value={currency} onChange={setCurrency} />
        <div className="space-y-1.5">
          <Label>Calculation Mode</Label>
          <div className="flex gap-2">
            <Button
              type="button"
              variant={mode === "per-item" ? "default" : "outline"}
              size="sm"
              className="flex-1"
              onClick={() => setMode("per-item")}
            >
              Per Item
            </Button>
            <Button
              type="button"
              variant={mode === "weight" ? "default" : "outline"}
              size="sm"
              className="flex-1"
              onClick={() => setMode("weight")}
            >
              Weight-Based
            </Button>
          </div>
        </div>
        <Field label="Total Shipping Cost">
          <Input
            value={totalCost}
            onChange={(e) => setTotalCost(e.target.value)}
            inputMode="decimal"
          />
        </Field>
        {mode === "per-item" ? (
          <Field label="Number of Items">
            <Input
              value={numItems}
              onChange={(e) => setNumItems(e.target.value)}
              inputMode="decimal"
            />
          </Field>
        ) : (
          <>
            <Field label="Total Weight (kg)">
              <Input
                value={totalWeight}
                onChange={(e) => setTotalWeight(e.target.value)}
                inputMode="decimal"
              />
            </Field>
            <Field label="Item Weight (kg)">
              <Input
                value={itemWeight}
                onChange={(e) => setItemWeight(e.target.value)}
                inputMode="decimal"
              />
            </Field>
          </>
        )}
      </div>

      <CopyableStat
        label="Per-Item Shipping Cost"
        displayValue={money(calc.perItem, currency)}
        accent="primary"
        sublabel={
          mode === "per-item"
            ? `Split equally across ${num(calc.items, 0)} items`
            : `Item is ${formatNumber(calc.share * 100, 1)}% of total weight`
        }
      />

      <FormulaBox>
        {mode === "per-item"
          ? "Per-Item Cost = Total Shipping Cost / Number of Items"
          : "Per-Item Cost = (Item Weight / Total Weight) × Total Shipping Cost"}
      </FormulaBox>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* 5. CPM (Cost per Mille)                                             */
/* ------------------------------------------------------------------ */

function CPMCalc() {
  const [currency, setCurrency] = React.useState("USD");
  const [cost, setCost] = React.useState("5000");
  const [impressions, setImpressions] = React.useState("500000");

  const calc = React.useMemo(() => {
    const c = parseNumber(cost);
    const imp = parseNumber(impressions);
    const cpm = imp > 0 ? (c / imp) * 1000 : 0;
    const perImpression = imp > 0 ? c / imp : 0;
    return { cost: c, impressions: imp, cpm, perImpression };
  }, [cost, impressions]);

  return (
    <div className="space-y-6">
      <div className="grid sm:grid-cols-2 gap-4">
        <CurrencySelect value={currency} onChange={setCurrency} />
        <div className="hidden sm:block" />
        <Field label="Total Ad Cost">
          <Input
            value={cost}
            onChange={(e) => setCost(e.target.value)}
            inputMode="decimal"
          />
        </Field>
        <Field label="Total Impressions">
          <Input
            value={impressions}
            onChange={(e) => setImpressions(e.target.value)}
            inputMode="decimal"
          />
        </Field>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <CopyableStat
          label="CPM"
          displayValue={money(calc.cpm, currency)}
          accent="primary"
          sublabel="Cost per 1,000 impressions"
        />
        <ResultStat
          label="Cost per Impression"
          value={money(calc.perImpression, currency)}
          accent="default"
          sublabel={`Across ${num(calc.impressions, 0)} impressions`}
        />
      </div>

      <FormulaBox>CPM = (Total Cost / Impressions) × 1000</FormulaBox>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* 6. CPC (Cost per Click)                                             */
/* ------------------------------------------------------------------ */

function CPCCalc() {
  const [currency, setCurrency] = React.useState("USD");
  const [cost, setCost] = React.useState("2000");
  const [clicks, setClicks] = React.useState("8000");

  const calc = React.useMemo(() => {
    const c = parseNumber(cost);
    const clk = parseNumber(clicks);
    const cpc = clk > 0 ? c / clk : 0;
    return { cost: c, clicks: clk, cpc };
  }, [cost, clicks]);

  return (
    <div className="space-y-6">
      <div className="grid sm:grid-cols-2 gap-4">
        <CurrencySelect value={currency} onChange={setCurrency} />
        <div className="hidden sm:block" />
        <Field label="Total Ad Cost">
          <Input
            value={cost}
            onChange={(e) => setCost(e.target.value)}
            inputMode="decimal"
          />
        </Field>
        <Field label="Total Clicks">
          <Input
            value={clicks}
            onChange={(e) => setClicks(e.target.value)}
            inputMode="decimal"
          />
        </Field>
      </div>

      <CopyableStat
        label="CPC"
        displayValue={money(calc.cpc, currency)}
        accent="primary"
        sublabel={`Average cost across ${num(calc.clicks, 0)} clicks`}
      />

      <FormulaBox>CPC = Total Cost / Clicks</FormulaBox>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* 7. CTR (Click-Through Rate)                                         */
/* ------------------------------------------------------------------ */

function CTRCalc() {
  const [impressions, setImpressions] = React.useState("50000");
  const [clicks, setClicks] = React.useState("1500");

  const calc = React.useMemo(() => {
    const imp = parseNumber(impressions);
    const clk = parseNumber(clicks);
    const ctr = imp > 0 ? (clk / imp) * 100 : 0;
    const per1k = imp > 0 ? (clk / imp) * 1000 : 0;
    return { impressions: imp, clicks: clk, ctr, per1k };
  }, [impressions, clicks]);

  return (
    <div className="space-y-6">
      <div className="grid sm:grid-cols-2 gap-4">
        <Field label="Total Impressions">
          <Input
            value={impressions}
            onChange={(e) => setImpressions(e.target.value)}
            inputMode="decimal"
          />
        </Field>
        <Field label="Total Clicks">
          <Input
            value={clicks}
            onChange={(e) => setClicks(e.target.value)}
            inputMode="decimal"
          />
        </Field>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <CopyableStat
          label="CTR"
          displayValue={pct(calc.ctr)}
          accent="primary"
          sublabel="Clicks as a share of impressions"
        />
        <ResultStat
          label="Clicks per 1,000 Impressions"
          value={formatNumber(calc.per1k, 2)}
          accent="default"
          sublabel="Normalized cross-channel benchmark"
        />
      </div>

      <FormulaBox>CTR (%) = (Clicks / Impressions) × 100</FormulaBox>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* 8. CPA (Cost per Acquisition)                                       */
/* ------------------------------------------------------------------ */

function CPACalc() {
  const [currency, setCurrency] = React.useState("USD");
  const [cost, setCost] = React.useState("3000");
  const [conversions, setConversions] = React.useState("120");

  const calc = React.useMemo(() => {
    const c = parseNumber(cost);
    const conv = parseNumber(conversions);
    const cpa = conv > 0 ? c / conv : 0;
    return { cost: c, conversions: conv, cpa };
  }, [cost, conversions]);

  return (
    <div className="space-y-6">
      <div className="grid sm:grid-cols-2 gap-4">
        <CurrencySelect value={currency} onChange={setCurrency} />
        <div className="hidden sm:block" />
        <Field label="Total Campaign Cost">
          <Input
            value={cost}
            onChange={(e) => setCost(e.target.value)}
            inputMode="decimal"
          />
        </Field>
        <Field label="Total Conversions">
          <Input
            value={conversions}
            onChange={(e) => setConversions(e.target.value)}
            inputMode="decimal"
          />
        </Field>
      </div>

      <CopyableStat
        label="CPA"
        displayValue={money(calc.cpa, currency)}
        accent="primary"
        sublabel={`Cost to acquire one of ${num(calc.conversions, 0)} conversions`}
      />

      <FormulaBox>CPA = Total Cost / Conversions</FormulaBox>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* 9. ROAS (Return on Ad Spend)                                        */
/* ------------------------------------------------------------------ */

function ROASCalc() {
  const [currency, setCurrency] = React.useState("USD");
  const [spend, setSpend] = React.useState("5000");
  const [revenue, setRevenue] = React.useState("22500");

  const calc = React.useMemo(() => {
    const s = parseNumber(spend);
    const r = parseNumber(revenue);
    const roas = s > 0 ? r / s : 0;
    const roasPct = roas * 100;
    const profit = r - s;
    return { spend: s, revenue: r, roas, roasPct, profit };
  }, [spend, revenue]);

  const isProfitable = calc.roas >= 1;

  return (
    <div className="space-y-6">
      <div className="grid sm:grid-cols-2 gap-4">
        <CurrencySelect value={currency} onChange={setCurrency} />
        <div className="hidden sm:block" />
        <Field label="Ad Spend">
          <Input
            value={spend}
            onChange={(e) => setSpend(e.target.value)}
            inputMode="decimal"
          />
        </Field>
        <Field label="Revenue from Ads">
          <Input
            value={revenue}
            onChange={(e) => setRevenue(e.target.value)}
            inputMode="decimal"
          />
        </Field>
      </div>

      <div className="grid sm:grid-cols-3 gap-4">
        <CopyableStat
          label="ROAS"
          displayValue={`${formatNumber(calc.roas, 2)}x`}
          accent={isProfitable ? "success" : "warning"}
          sublabel={isProfitable ? "Profitable campaign" : "Below break-even (1.0x)"}
        />
        <ResultStat
          label="ROAS (%)"
          value={pct(calc.roasPct)}
          accent="default"
          sublabel="Return expressed as a percentage"
        />
        <ResultStat
          label="Net Ad Profit"
          value={money(calc.profit, currency)}
          accent={calc.profit >= 0 ? "success" : "warning"}
          sublabel="Revenue minus ad spend"
        />
      </div>

      <FormulaBox>
        ROAS = Revenue from Ads / Ad Spend · ROAS (%) = ROAS × 100
      </FormulaBox>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* 10. Conversion Rate                                                 */
/* ------------------------------------------------------------------ */

function ConversionRateCalc() {
  const [visitors, setVisitors] = React.useState("20000");
  const [conversions, setConversions] = React.useState("600");

  const calc = React.useMemo(() => {
    const v = parseNumber(visitors);
    const conv = parseNumber(conversions);
    const rate = v > 0 ? (conv / v) * 100 : 0;
    const per10k = v > 0 ? (conv / v) * 10000 : 0;
    return { visitors: v, conversions: conv, rate, per10k };
  }, [visitors, conversions]);

  return (
    <div className="space-y-6">
      <div className="grid sm:grid-cols-2 gap-4">
        <Field label="Total Visitors">
          <Input
            value={visitors}
            onChange={(e) => setVisitors(e.target.value)}
            inputMode="decimal"
          />
        </Field>
        <Field label="Total Conversions">
          <Input
            value={conversions}
            onChange={(e) => setConversions(e.target.value)}
            inputMode="decimal"
          />
        </Field>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <CopyableStat
          label="Conversion Rate"
          displayValue={pct(calc.rate)}
          accent="primary"
          sublabel="Conversions as a share of visitors"
        />
        <ResultStat
          label="Conversions per 10,000 Visitors"
          value={formatNumber(calc.per10k, 1)}
          accent="default"
          sublabel="Normalized benchmark"
        />
      </div>

      <FormulaBox>Conversion Rate (%) = (Conversions / Visitors) × 100</FormulaBox>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* 11. CAC (Customer Acquisition Cost)                                 */
/* ------------------------------------------------------------------ */

function CACCalc() {
  const [currency, setCurrency] = React.useState("USD");
  const [spend, setSpend] = React.useState("15000");
  const [newCustomers, setNewCustomers] = React.useState("300");

  const calc = React.useMemo(() => {
    const s = parseNumber(spend);
    const nc = parseNumber(newCustomers);
    const cac = nc > 0 ? s / nc : 0;
    return { spend: s, newCustomers: nc, cac };
  }, [spend, newCustomers]);

  return (
    <div className="space-y-6">
      <div className="grid sm:grid-cols-2 gap-4">
        <CurrencySelect value={currency} onChange={setCurrency} />
        <div className="hidden sm:block" />
        <Field label="Sales & Marketing Spend">
          <Input
            value={spend}
            onChange={(e) => setSpend(e.target.value)}
            inputMode="decimal"
          />
        </Field>
        <Field label="New Customers Acquired">
          <Input
            value={newCustomers}
            onChange={(e) => setNewCustomers(e.target.value)}
            inputMode="decimal"
          />
        </Field>
      </div>

      <CopyableStat
        label="CAC"
        displayValue={money(calc.cac, currency)}
        accent="primary"
        sublabel={`Cost to acquire one of ${num(calc.newCustomers, 0)} customers`}
      />

      <FormulaBox>
        CAC = Total Sales & Marketing Spend / New Customers Acquired
      </FormulaBox>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* 12. LTV (Customer Lifetime Value)                                   */
/* ------------------------------------------------------------------ */

function LTVCalc() {
  const [currency, setCurrency] = React.useState("USD");
  const [arpu, setArpu] = React.useState("50");
  const [margin, setMargin] = React.useState("70");
  const [lifespan, setLifespan] = React.useState("24");
  const [cac, setCac] = React.useState("");

  const calc = React.useMemo(() => {
    const a = parseNumber(arpu);
    const m = parseNumber(margin) / 100;
    const l = parseNumber(lifespan);
    const ltv = a * m * l;
    const cacVal = parseNumber(cac);
    const ratioVal = cacVal > 0 ? ltv / cacVal : 0;
    return { arpu: a, margin: m, lifespan: l, ltv, cac: cacVal, ratio: ratioVal };
  }, [arpu, margin, lifespan, cac]);

  const healthy = calc.ratio >= 3;

  return (
    <div className="space-y-6">
      <div className="grid sm:grid-cols-2 gap-4">
        <CurrencySelect value={currency} onChange={setCurrency} />
        <div className="hidden sm:block" />
        <Field label="ARPU (monthly revenue per user)">
          <Input
            value={arpu}
            onChange={(e) => setArpu(e.target.value)}
            inputMode="decimal"
          />
        </Field>
        <Field label="Gross Margin (%)">
          <Input
            value={margin}
            onChange={(e) => setMargin(e.target.value)}
            inputMode="decimal"
          />
        </Field>
        <Field label="Avg Customer Lifespan (months)">
          <Input
            value={lifespan}
            onChange={(e) => setLifespan(e.target.value)}
            inputMode="decimal"
          />
        </Field>
        <Field label="CAC (optional)" hint="Enter to compute the LTV:CAC ratio">
          <Input
            value={cac}
            onChange={(e) => setCac(e.target.value)}
            inputMode="decimal"
            placeholder="e.g. 40"
          />
        </Field>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <CopyableStat
          label="Customer LTV"
          displayValue={money(calc.ltv, currency)}
          accent="primary"
          sublabel="Total gross profit per customer"
        />
        {calc.cac > 0 ? (
          <CopyableStat
            label="LTV:CAC Ratio"
            displayValue={`${formatNumber(calc.ratio, 2)}:1`}
            accent={healthy ? "success" : "warning"}
            sublabel={healthy ? "Healthy (≥ 3:1)" : "Below the healthy 3:1 threshold"}
          />
        ) : (
          <ResultStat
            label="LTV:CAC Ratio"
            value="—"
            accent="default"
            sublabel="Enter CAC to compute"
          />
        )}
      </div>

      <FormulaBox>
        LTV = ARPU × Gross Margin × Avg Customer Lifespan · LTV:CAC = LTV / CAC
      </FormulaBox>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Main switch                                                          */
/* ------------------------------------------------------------------ */

export function BusinessCalcs({ calcId }: { calcId: string }) {
  switch (calcId) {
    case "profit":
      return <ProfitCalc />;
    case "business-valuation":
      return <BusinessValuationCalc />;
    case "inventory-turnover":
      return <InventoryTurnoverCalc />;
    case "shipping":
      return <ShippingCalc />;
    case "cpm":
      return <CPMCalc />;
    case "cpc":
      return <CPCCalc />;
    case "ctr":
      return <CTRCalc />;
    case "cpa":
      return <CPACalc />;
    case "roas":
      return <ROASCalc />;
    case "conversion-rate":
      return <ConversionRateCalc />;
    case "cac":
      return <CACCalc />;
    case "ltv":
      return <LTVCalc />;
    default:
      return null;
  }
}
