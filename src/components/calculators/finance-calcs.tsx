"use client";

import * as React from "react";
import { Copy, Download } from "lucide-react";
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
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { parseNumber } from "@/lib/math-engine";
import { toast } from "sonner";

/* ------------------------------------------------------------------ */
/* Shared bits                                                          */
/* ------------------------------------------------------------------ */

const CURRENCIES = ["USD", "EUR", "GBP", "INR", "BDT", "AUD", "CAD", "SGD"] as const;
type Currency = (typeof CURRENCIES)[number];

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
        className="absolute top-2 right-2 size-7 text-muted-foreground hover:text-foreground"
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

function CopyRowButton({ value, label = "Result" }: { value: string; label?: string }) {
  return (
    <Button
      variant="outline"
      size="sm"
      onClick={() => {
        navigator.clipboard?.writeText(value);
        toast.success(`${label} copied`);
      }}
    >
      <Copy className="size-3.5" /> Copy
    </Button>
  );
}

/** PMT — standard amortizing payment. r = periodic rate, n = total periods. */
function pmt(principal: number, r: number, n: number): number {
  if (n <= 0) return 0;
  if (r === 0) return principal / n;
  return (principal * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
}

/** Future value of a present sum with periodic compounding. */
function fvLumpSum(pv: number, r: number, n: number, t: number): number {
  if (n <= 0) return pv;
  return pv * Math.pow(1 + r / n, n * t);
}

/** Future value of an ordinary annuity (end-of-period contributions). */
function fvAnnuity(pmt: number, r: number, n: number, t: number): number {
  if (n <= 0) return 0;
  const periods = n * t;
  const rate = r / n;
  if (rate === 0) return pmt * periods;
  return pmt * ((Math.pow(1 + rate, periods) - 1) / rate);
}

/* ------------------------------------------------------------------ */
/* 1. Loan                                                              */
/* ------------------------------------------------------------------ */

function LoanCalc() {
  const [currency, setCurrency] = React.useState<string>("USD");
  const [principal, setPrincipal] = React.useState("250000");
  const [rate, setRate] = React.useState("6.5");
  const [term, setTerm] = React.useState("30");

  const calc = React.useMemo(() => {
    const P = parseNumber(principal);
    const annualRate = parseNumber(rate) / 100;
    const years = parseNumber(term);
    const n = Math.max(1, Math.round(years * 12));
    const r = annualRate / 12;
    const monthly = pmt(P, r, n);
    const totalPaid = monthly * n;
    const totalInterest = totalPaid - P;

    const rows: { month: number; payment: number; principal: number; interest: number; balance: number }[] = [];
    let balance = P;
    const limit = Math.min(12, n);
    for (let i = 1; i <= limit; i++) {
      const interestPart = balance * r;
      const principalPart = monthly - interestPart;
      balance -= principalPart;
      rows.push({
        month: i,
        payment: monthly,
        principal: principalPart,
        interest: interestPart,
        balance: Math.max(0, balance),
      });
    }
    return { P, monthly, totalPaid, totalInterest, n, rows };
  }, [principal, rate, term]);

  return (
    <div className="space-y-6">
      <div className="grid sm:grid-cols-2 gap-4">
        <CurrencySelect value={currency} onChange={setCurrency} />
        <div className="hidden sm:block" />
        <Field label="Principal">
          <Input value={principal} onChange={(e) => setPrincipal(e.target.value)} inputMode="decimal" />
        </Field>
        <Field label="Annual interest rate (%)">
          <Input value={rate} onChange={(e) => setRate(e.target.value)} inputMode="decimal" />
        </Field>
        <Field label="Term (years)">
          <Input value={term} onChange={(e) => setTerm(e.target.value)} inputMode="decimal" />
        </Field>
        <div className="text-xs text-muted-foreground self-end pb-2">
          {calc.n} monthly payments
        </div>
      </div>

      <div className="grid sm:grid-cols-3 gap-4">
        <CopyableStat label="Monthly Payment" displayValue={money(calc.monthly, currency)} accent="primary" />
        <ResultStat label="Total Paid" value={money(calc.totalPaid, currency)} accent="default" />
        <ResultStat label="Total Interest" value={money(calc.totalInterest, currency)} accent="warning" />
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold">Amortization preview (first 12 months)</h3>
          <CopyRowButton
            label="Amortization table"
            value={
              "Month,Payment,Principal,Interest,Balance\n" +
              calc.rows
                .map(
                  (r) =>
                    `${r.month},${money(r.payment, currency)},${money(r.principal, currency)},${money(
                      r.interest,
                      currency
                    )},${money(r.balance, currency)}`
                )
                .join("\n")
            }
          />
        </div>
        <div className="rounded-xl border border-border overflow-hidden">
          <div className="max-h-72 overflow-y-auto">
            <div className="grid grid-cols-5 gap-2 px-3 py-2 bg-muted/40 text-xs font-semibold text-muted-foreground uppercase tracking-wide sticky top-0">
              <div>Month</div>
              <div className="text-right">Payment</div>
              <div className="text-right">Principal</div>
              <div className="text-right">Interest</div>
              <div className="text-right">Balance</div>
            </div>
            {calc.rows.map((r) => (
              <div
                key={r.month}
                className="grid grid-cols-5 gap-2 px-3 py-2 text-sm font-mono border-t border-border/60"
              >
                <div>{r.month}</div>
                <div className="text-right">{money(r.payment, currency)}</div>
                <div className="text-right">{money(r.principal, currency)}</div>
                <div className="text-right text-muted-foreground">{money(r.interest, currency)}</div>
                <div className="text-right">{money(r.balance, currency)}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <FormulaBox>
        M = P · r(1+r)<sup>n</sup> / ((1+r)<sup>n</sup> − 1), where r = annual rate ÷ 12 and n = years × 12. Total
        interest = M·n − P.
      </FormulaBox>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* 2. Mortgage                                                          */
/* ------------------------------------------------------------------ */

function MortgageCalc() {
  const [currency, setCurrency] = React.useState<string>("USD");
  const [homePrice, setHomePrice] = React.useState("400000");
  const [downPayment, setDownPayment] = React.useState("80000");
  const [rate, setRate] = React.useState("6.8");
  const [term, setTerm] = React.useState("30");
  const [propertyTaxRate, setPropertyTaxRate] = React.useState("1.1");
  const [homeInsurance, setHomeInsurance] = React.useState("1400");
  const [pmiRate, setPmiRate] = React.useState("0.5");

  const calc = React.useMemo(() => {
    const price = parseNumber(homePrice);
    const down = parseNumber(downPayment);
    const principal = Math.max(0, price - down);
    const annualRate = parseNumber(rate) / 100;
    const years = parseNumber(term);
    const n = Math.max(1, Math.round(years * 12));
    const r = annualRate / 12;

    const pi = pmt(principal, r, n); // principal + interest
    const monthlyPropTax = (parseNumber(propertyTaxRate) / 100 * price) / 12;
    const monthlyIns = parseNumber(homeInsurance) / 12;
    const downPct = price > 0 ? down / price : 0;
    const needsPmi = downPct < 0.2;
    const monthlyPmi = needsPmi ? (parseNumber(pmiRate) / 100 * principal) / 12 : 0;

    const totalMonthly = pi + monthlyPropTax + monthlyIns + monthlyPmi;
    const totalPaid = totalMonthly * n;
    const totalInterest = pi * n - principal;

    return {
      principal,
      pi,
      monthlyPropTax,
      monthlyIns,
      monthlyPmi,
      needsPmi,
      downPct,
      totalMonthly,
      totalPaid,
      totalInterest,
      n,
    };
  }, [homePrice, downPayment, rate, term, propertyTaxRate, homeInsurance, pmiRate]);

  return (
    <div className="space-y-6">
      <div className="grid sm:grid-cols-2 gap-4">
        <CurrencySelect value={currency} onChange={setCurrency} />
        <div className="hidden sm:block" />
        <Field label="Home price">
          <Input value={homePrice} onChange={(e) => setHomePrice(e.target.value)} inputMode="decimal" />
        </Field>
        <Field label="Down payment">
          <Input value={downPayment} onChange={(e) => setDownPayment(e.target.value)} inputMode="decimal" />
        </Field>
        <Field label="Interest rate (%)" hint={`Down payment: ${num(calc.downPct * 100, 1)}% of price`}>
          <Input value={rate} onChange={(e) => setRate(e.target.value)} inputMode="decimal" />
        </Field>
        <Field label="Term (years)">
          <Input value={term} onChange={(e) => setTerm(e.target.value)} inputMode="decimal" />
        </Field>
        <Field label="Property tax (% / year)">
          <Input value={propertyTaxRate} onChange={(e) => setPropertyTaxRate(e.target.value)} inputMode="decimal" />
        </Field>
        <Field label="Home insurance ($ / year)">
          <Input value={homeInsurance} onChange={(e) => setHomeInsurance(e.target.value)} inputMode="decimal" />
        </Field>
        <Field
          label="PMI (% / year)"
          hint={calc.needsPmi ? "Applies — down payment under 20%" : "Not required — down payment is 20% or more"}
        >
          <Input value={pmiRate} onChange={(e) => setPmiRate(e.target.value)} inputMode="decimal" />
        </Field>
        <Field label="Loan principal">
          <Input value={money(calc.principal, currency)} readOnly className="bg-muted/40 font-mono" />
        </Field>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <CopyableStat label="Total Monthly Payment" displayValue={money(calc.totalMonthly, currency)} accent="primary" />
        <ResultStat label="Loan Principal" value={money(calc.principal, currency)} accent="default" />
      </div>

      <div className="rounded-2xl border border-border bg-card p-5">
        <h3 className="text-sm font-semibold mb-3">Monthly breakdown</h3>
        <div className="space-y-2 text-sm">
          <BreakdownRow label="Principal & interest" value={money(calc.pi, currency)} />
          <BreakdownRow label="Property tax" value={money(calc.monthlyPropTax, currency)} />
          <BreakdownRow label="Home insurance" value={money(calc.monthlyIns, currency)} />
          <BreakdownRow
            label="PMI"
            value={calc.needsPmi ? money(calc.monthlyPmi, currency) : "— (not required)"}
          />
          <div className="border-t border-border pt-2 mt-2 flex items-center justify-between">
            <span className="font-semibold">Total monthly</span>
            <span className="font-mono font-semibold">{money(calc.totalMonthly, currency)}</span>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3 mt-4 pt-4 border-t border-border">
          <div>
            <div className="text-xs text-muted-foreground uppercase tracking-wide">Total of payments</div>
            <div className="font-mono font-semibold mt-1">{money(calc.totalPaid, currency)}</div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground uppercase tracking-wide">Total interest</div>
            <div className="font-mono font-semibold mt-1">{money(calc.totalInterest, currency)}</div>
          </div>
        </div>
      </div>

      <FormulaBox>
        P&amp;I uses the standard PMT formula on (home price − down payment). Add monthly property tax (price × tax% ÷
        12), insurance (annual ÷ 12), and PMI (principal × pmi% ÷ 12) when down payment &lt; 20%.
      </FormulaBox>
    </div>
  );
}

function BreakdownRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-mono">{value}</span>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* 3. EMI                                                               */
/* ------------------------------------------------------------------ */

function EmiCalc() {
  const [currency, setCurrency] = React.useState<string>("USD");
  const [principal, setPrincipal] = React.useState("500000");
  const [rate, setRate] = React.useState("9.5");
  const [tenure, setTenure] = React.useState("60");

  const calc = React.useMemo(() => {
    const P = parseNumber(principal);
    const annualRate = parseNumber(rate) / 100;
    const n = Math.max(1, Math.round(parseNumber(tenure)));
    const r = annualRate / 12;
    const emi = pmt(P, r, n);
    const total = emi * n;
    const interest = total - P;
    return { P, emi, total, interest, n };
  }, [principal, rate, tenure]);

  return (
    <div className="space-y-6">
      <div className="grid sm:grid-cols-2 gap-4">
        <CurrencySelect value={currency} onChange={setCurrency} />
        <div className="hidden sm:block" />
        <Field label="Principal">
          <Input value={principal} onChange={(e) => setPrincipal(e.target.value)} inputMode="decimal" />
        </Field>
        <Field label="Annual interest rate (%)">
          <Input value={rate} onChange={(e) => setRate(e.target.value)} inputMode="decimal" />
        </Field>
        <Field label="Tenure (months)">
          <Input value={tenure} onChange={(e) => setTenure(e.target.value)} inputMode="decimal" />
        </Field>
        <div className="text-xs text-muted-foreground self-end pb-2">{calc.n} monthly installments</div>
      </div>

      <div className="grid sm:grid-cols-3 gap-4">
        <CopyableStat label="Monthly EMI" displayValue={money(calc.emi, currency)} accent="primary" />
        <ResultStat label="Total Interest" value={money(calc.interest, currency)} accent="warning" />
        <ResultStat label="Total Payment" value={money(calc.total, currency)} accent="default" />
      </div>

      <FormulaBox>
        EMI = P · r(1+r)<sup>n</sup> / ((1+r)<sup>n</sup> − 1), where r = annual rate ÷ 12 and n = tenure in months.
      </FormulaBox>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* 4. Compound Interest                                                 */
/* ------------------------------------------------------------------ */

const COMPOUND_FREQ: Record<string, number> = {
  annually: 1,
  semiannually: 2,
  quarterly: 4,
  monthly: 12,
  daily: 365,
};

function CompoundInterestCalc() {
  const [currency, setCurrency] = React.useState<string>("USD");
  const [principal, setPrincipal] = React.useState("10000");
  const [rate, setRate] = React.useState("7");
  const [freq, setFreq] = React.useState("monthly");
  const [years, setYears] = React.useState("10");
  const [monthlyContribution, setMonthlyContribution] = React.useState("250");

  const calc = React.useMemo(() => {
    const P = parseNumber(principal);
    const r = parseNumber(rate) / 100;
    const t = parseNumber(years);
    const n = COMPOUND_FREQ[freq] ?? 12;
    const monthlyPmt = parseNumber(monthlyContribution);
    // Convert monthly contribution to per-period contribution matching compounding frequency
    const pmtPerPeriod = (monthlyPmt * 12) / n;

    const fvPrincipal = fvLumpSum(P, r, n, t);
    const fvContrib = fvAnnuity(pmtPerPeriod, r, n, t);
    const amount = fvPrincipal + fvContrib;
    const totalContributions = P + monthlyPmt * 12 * t;
    const interestEarned = amount - totalContributions;

    return { P, amount, totalContributions, interestEarned };
  }, [principal, rate, freq, years, monthlyContribution]);

  return (
    <div className="space-y-6">
      <div className="grid sm:grid-cols-2 gap-4">
        <CurrencySelect value={currency} onChange={setCurrency} />
        <div className="hidden sm:block" />
        <Field label="Principal">
          <Input value={principal} onChange={(e) => setPrincipal(e.target.value)} inputMode="decimal" />
        </Field>
        <Field label="Annual interest rate (%)">
          <Input value={rate} onChange={(e) => setRate(e.target.value)} inputMode="decimal" />
        </Field>
        <Field label="Compounding frequency">
          <Select value={freq} onValueChange={setFreq}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="annually">Annually</SelectItem>
              <SelectItem value="semiannually">Semi-annually</SelectItem>
              <SelectItem value="quarterly">Quarterly</SelectItem>
              <SelectItem value="monthly">Monthly</SelectItem>
              <SelectItem value="daily">Daily</SelectItem>
            </SelectContent>
          </Select>
        </Field>
        <Field label="Time (years)">
          <Input value={years} onChange={(e) => setYears(e.target.value)} inputMode="decimal" />
        </Field>
        <Field label="Monthly contribution (optional)">
          <Input value={monthlyContribution} onChange={(e) => setMonthlyContribution(e.target.value)} inputMode="decimal" />
        </Field>
      </div>

      <div className="grid sm:grid-cols-3 gap-4">
        <CopyableStat label="Final Amount" displayValue={money(calc.amount, currency)} accent="primary" />
        <ResultStat label="Total Contributions" value={money(calc.totalContributions, currency)} accent="default" />
        <ResultStat label="Interest Earned" value={money(calc.interestEarned, currency)} accent="success" />
      </div>

      <FormulaBox>
        A = P(1 + r/n)<sup>nt</sup> + PMT · [((1 + r/n)<sup>nt</sup> − 1) / (r/n)], where PMT is the contribution per
        compounding period (monthly contribution × 12 ÷ n).
      </FormulaBox>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* 5. Simple Interest                                                   */
/* ------------------------------------------------------------------ */

function SimpleInterestCalc() {
  const [currency, setCurrency] = React.useState<string>("USD");
  const [principal, setPrincipal] = React.useState("10000");
  const [rate, setRate] = React.useState("6");
  const [years, setYears] = React.useState("5");

  const calc = React.useMemo(() => {
    const P = parseNumber(principal);
    const R = parseNumber(rate);
    const T = parseNumber(years);
    const interest = (P * R * T) / 100;
    const total = P + interest;
    return { P, interest, total };
  }, [principal, rate, years]);

  return (
    <div className="space-y-6">
      <div className="grid sm:grid-cols-2 gap-4">
        <CurrencySelect value={currency} onChange={setCurrency} />
        <div className="hidden sm:block" />
        <Field label="Principal">
          <Input value={principal} onChange={(e) => setPrincipal(e.target.value)} inputMode="decimal" />
        </Field>
        <Field label="Annual interest rate (%)">
          <Input value={rate} onChange={(e) => setRate(e.target.value)} inputMode="decimal" />
        </Field>
        <Field label="Time (years)">
          <Input value={years} onChange={(e) => setYears(e.target.value)} inputMode="decimal" />
        </Field>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <CopyableStat label="Interest" displayValue={money(calc.interest, currency)} accent="success" />
        <ResultStat label="Total Amount" value={money(calc.total, currency)} accent="primary" />
      </div>

      <FormulaBox>SI = P · R · T ÷ 100, and Total = P + SI.</FormulaBox>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* 6. Savings                                                           */
/* ------------------------------------------------------------------ */

function SavingsCalc() {
  const [currency, setCurrency] = React.useState<string>("USD");
  const [initial, setInitial] = React.useState("5000");
  const [monthly, setMonthly] = React.useState("400");
  const [rate, setRate] = React.useState("5");
  const [years, setYears] = React.useState("20");

  const calc = React.useMemo(() => {
    const P = parseNumber(initial);
    const pmtVal = parseNumber(monthly);
    const r = parseNumber(rate) / 100;
    const t = parseNumber(years);
    // Monthly compounding
    const fvPrincipal = fvLumpSum(P, r, 12, t);
    const fvContrib = fvAnnuity(pmtVal, r, 12, t);
    const balance = fvPrincipal + fvContrib;
    const totalContributions = P + pmtVal * 12 * t;
    const interest = balance - totalContributions;
    return { balance, totalContributions, interest };
  }, [initial, monthly, rate, years]);

  return (
    <div className="space-y-6">
      <div className="grid sm:grid-cols-2 gap-4">
        <CurrencySelect value={currency} onChange={setCurrency} />
        <div className="hidden sm:block" />
        <Field label="Initial deposit">
          <Input value={initial} onChange={(e) => setInitial(e.target.value)} inputMode="decimal" />
        </Field>
        <Field label="Monthly contribution">
          <Input value={monthly} onChange={(e) => setMonthly(e.target.value)} inputMode="decimal" />
        </Field>
        <Field label="Annual rate (%)">
          <Input value={rate} onChange={(e) => setRate(e.target.value)} inputMode="decimal" />
        </Field>
        <Field label="Years">
          <Input value={years} onChange={(e) => setYears(e.target.value)} inputMode="decimal" />
        </Field>
      </div>

      <div className="grid sm:grid-cols-3 gap-4">
        <CopyableStat label="Final Balance" displayValue={money(calc.balance, currency)} accent="primary" />
        <ResultStat label="Total Contributions" value={money(calc.totalContributions, currency)} accent="default" />
        <ResultStat label="Interest Earned" value={money(calc.interest, currency)} accent="success" />
      </div>

      <FormulaBox>
        Monthly compounding: FV = P(1 + r/12)<sup>12t</sup> + PMT · [((1 + r/12)<sup>12t</sup> − 1) / (r/12)].
      </FormulaBox>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* 7. Investment                                                        */
/* ------------------------------------------------------------------ */

function InvestmentCalc() {
  const [currency, setCurrency] = React.useState<string>("USD");
  const [initial, setInitial] = React.useState("10000");
  const [monthly, setMonthly] = React.useState("500");
  const [rate, setRate] = React.useState("8");
  const [years, setYears] = React.useState("25");

  const calc = React.useMemo(() => {
    const P = parseNumber(initial);
    const pmtVal = parseNumber(monthly);
    const r = parseNumber(rate) / 100;
    const t = parseNumber(years);
    const fvPrincipal = fvLumpSum(P, r, 12, t);
    const fvContrib = fvAnnuity(pmtVal, r, 12, t);
    const futureValue = fvPrincipal + fvContrib;
    const invested = P + pmtVal * 12 * t;
    const growth = futureValue - invested;
    return { futureValue, invested, growth };
  }, [initial, monthly, rate, years]);

  return (
    <div className="space-y-6">
      <div className="grid sm:grid-cols-2 gap-4">
        <CurrencySelect value={currency} onChange={setCurrency} />
        <div className="hidden sm:block" />
        <Field label="Initial investment">
          <Input value={initial} onChange={(e) => setInitial(e.target.value)} inputMode="decimal" />
        </Field>
        <Field label="Monthly contribution">
          <Input value={monthly} onChange={(e) => setMonthly(e.target.value)} inputMode="decimal" />
        </Field>
        <Field label="Expected annual return (%)">
          <Input value={rate} onChange={(e) => setRate(e.target.value)} inputMode="decimal" />
        </Field>
        <Field label="Time horizon (years)">
          <Input value={years} onChange={(e) => setYears(e.target.value)} inputMode="decimal" />
        </Field>
      </div>

      <div className="grid sm:grid-cols-3 gap-4">
        <CopyableStat label="Future Value" displayValue={money(calc.futureValue, currency)} accent="primary" />
        <ResultStat label="Total Invested" value={money(calc.invested, currency)} accent="default" />
        <ResultStat label="Growth" value={money(calc.growth, currency)} accent="success" />
      </div>

      <FormulaBox>
        FV = P(1 + r/12)<sup>12t</sup> + PMT · [((1 + r/12)<sup>12t</sup> − 1) / (r/12)]. Growth = FV − (P + PMT · 12 ·
        t).
      </FormulaBox>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* 8. ROI                                                               */
/* ------------------------------------------------------------------ */

function RoiCalc() {
  const [currency, setCurrency] = React.useState<string>("USD");
  const [initial, setInitial] = React.useState("10000");
  const [final, setFinal] = React.useState("15000");

  const calc = React.useMemo(() => {
    const inv = parseNumber(initial);
    const end = parseNumber(final);
    const gain = end - inv;
    const roi = inv !== 0 ? (gain / inv) * 100 : 0;
    return { inv, end, gain, roi };
  }, [initial, final]);

  return (
    <div className="space-y-6">
      <div className="grid sm:grid-cols-2 gap-4">
        <CurrencySelect value={currency} onChange={setCurrency} />
        <div className="hidden sm:block" />
        <Field label="Initial investment">
          <Input value={initial} onChange={(e) => setInitial(e.target.value)} inputMode="decimal" />
        </Field>
        <Field label="Final value">
          <Input value={final} onChange={(e) => setFinal(e.target.value)} inputMode="decimal" />
        </Field>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <CopyableStat
          label="ROI"
          displayValue={`${calc.roi >= 0 ? "" : ""}${num(calc.roi, 2)}%`}
          accent={calc.roi >= 0 ? "success" : "warning"}
          sublabel={calc.gain >= 0 ? "Profit" : "Loss"}
        />
        <ResultStat
          label="Absolute Gain"
          value={money(calc.gain, currency)}
          accent={calc.gain >= 0 ? "primary" : "warning"}
        />
      </div>

      <FormulaBox>ROI = (Final − Initial) / Initial × 100.</FormulaBox>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* 9. CAGR                                                              */
/* ------------------------------------------------------------------ */

function CagrCalc() {
  const [initial, setInitial] = React.useState("10000");
  const [final, setFinal] = React.useState("25000");
  const [years, setYears] = React.useState("8");

  const calc = React.useMemo(() => {
    const init = parseNumber(initial);
    const end = parseNumber(final);
    const t = parseNumber(years);
    const cagr = init > 0 && t > 0 ? Math.pow(end / init, 1 / t) - 1 : 0;
    const totalReturn = init > 0 ? ((end - init) / init) * 100 : 0;
    return { init, end, t, cagr: cagr * 100, totalReturn };
  }, [initial, final, years]);

  return (
    <div className="space-y-6">
      <div className="grid sm:grid-cols-3 gap-4">
        <Field label="Initial value">
          <Input value={initial} onChange={(e) => setInitial(e.target.value)} inputMode="decimal" />
        </Field>
        <Field label="Final value">
          <Input value={final} onChange={(e) => setFinal(e.target.value)} inputMode="decimal" />
        </Field>
        <Field label="Years">
          <Input value={years} onChange={(e) => setYears(e.target.value)} inputMode="decimal" />
        </Field>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <CopyableStat label="CAGR" displayValue={`${num(calc.cagr, 2)}%`} accent="primary" />
        <ResultStat label="Total Return" value={`${num(calc.totalReturn, 2)}%`} accent="default" />
      </div>

      <FormulaBox>
        CAGR = (Final / Initial)<sup>1/years</sup> − 1. Represents the constant annual growth rate that takes the
        initial value to the final value over the period.
      </FormulaBox>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* 10. Profit Margin                                                   */
/* ------------------------------------------------------------------ */

function ProfitMarginCalc() {
  const [currency, setCurrency] = React.useState<string>("USD");
  const [revenue, setRevenue] = React.useState("100000");
  const [cogs, setCogs] = React.useState("60000");
  const [opex, setOpex] = React.useState("20000");

  const calc = React.useMemo(() => {
    const rev = parseNumber(revenue);
    const cost = parseNumber(cogs);
    const operating = parseNumber(opex);
    const grossProfit = rev - cost;
    const grossMargin = rev > 0 ? (grossProfit / rev) * 100 : 0;
    const operatingProfit = grossProfit - operating;
    const operatingMargin = rev > 0 ? (operatingProfit / rev) * 100 : 0;
    const netProfit = operatingProfit;
    const netMargin = rev > 0 ? (netProfit / rev) * 100 : 0;
    return { rev, cost, operating, grossProfit, grossMargin, operatingProfit, operatingMargin, netProfit, netMargin };
  }, [revenue, cogs, opex]);

  return (
    <div className="space-y-6">
      <div className="grid sm:grid-cols-2 gap-4">
        <CurrencySelect value={currency} onChange={setCurrency} />
        <div className="hidden sm:block" />
        <Field label="Revenue">
          <Input value={revenue} onChange={(e) => setRevenue(e.target.value)} inputMode="decimal" />
        </Field>
        <Field label="Cost / COGS">
          <Input value={cogs} onChange={(e) => setCogs(e.target.value)} inputMode="decimal" />
        </Field>
        <Field label="Operating expenses (optional)">
          <Input value={opex} onChange={(e) => setOpex(e.target.value)} inputMode="decimal" />
        </Field>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <CopyableStat label="Gross Profit" displayValue={money(calc.grossProfit, currency)} accent="primary" sublabel={`${num(calc.grossMargin, 2)}% margin`} />
        <ResultStat label="Gross Margin" value={`${num(calc.grossMargin, 2)}%`} accent="default" />
      </div>

      {parseNumber(opex) > 0 && (
        <div className="grid sm:grid-cols-2 gap-4">
          <ResultStat
            label="Operating Profit"
            value={money(calc.operatingProfit, currency)}
            accent={calc.operatingProfit >= 0 ? "success" : "warning"}
            sublabel={`${num(calc.operatingMargin, 2)}% margin`}
          />
          <ResultStat label="Operating Margin" value={`${num(calc.operatingMargin, 2)}%`} accent="default" />
        </div>
      )}

      <FormulaBox>
        Gross profit = Revenue − COGS. Gross margin (%) = Gross profit ÷ Revenue × 100. Operating profit = Gross profit
        − Operating expenses.
      </FormulaBox>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* 11. Markup                                                          */
/* ------------------------------------------------------------------ */

function MarkupCalc() {
  const [currency, setCurrency] = React.useState<string>("USD");
  const [cost, setCost] = React.useState("80");
  const [markup, setMarkup] = React.useState("25");

  const calc = React.useMemo(() => {
    const c = parseNumber(cost);
    const m = parseNumber(markup);
    const selling = c * (1 + m / 100);
    const profit = selling - c;
    const margin = selling > 0 ? (profit / selling) * 100 : 0;
    return { c, m, selling, profit, margin };
  }, [cost, markup]);

  return (
    <div className="space-y-6">
      <div className="grid sm:grid-cols-2 gap-4">
        <CurrencySelect value={currency} onChange={setCurrency} />
        <div className="hidden sm:block" />
        <Field label="Cost">
          <Input value={cost} onChange={(e) => setCost(e.target.value)} inputMode="decimal" />
        </Field>
        <Field label="Markup (%)">
          <Input value={markup} onChange={(e) => setMarkup(e.target.value)} inputMode="decimal" />
        </Field>
      </div>

      <div className="grid sm:grid-cols-3 gap-4">
        <CopyableStat label="Selling Price" displayValue={money(calc.selling, currency)} accent="primary" />
        <ResultStat label="Profit" value={money(calc.profit, currency)} accent="success" />
        <ResultStat label="Margin" value={`${num(calc.margin, 2)}%`} accent="default" />
      </div>

      <FormulaBox>
        Selling price = Cost × (1 + Markup/100). Profit = Selling price − Cost. Margin (%) = Profit ÷ Selling price ×
        100.
      </FormulaBox>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* 12. Discount                                                        */
/* ------------------------------------------------------------------ */

function DiscountCalc() {
  const [currency, setCurrency] = React.useState<string>("USD");
  const [mode, setMode] = React.useState<"forward" | "reverse">("forward");
  const [original, setOriginal] = React.useState("120");
  const [discount, setDiscount] = React.useState("20");
  const [finalPrice, setFinalPrice] = React.useState("96");

  const forward = React.useMemo(() => {
    const orig = parseNumber(original);
    const pct = parseNumber(discount);
    const discountAmount = (orig * pct) / 100;
    const final = orig - discountAmount;
    return { orig, pct, discountAmount, final };
  }, [original, discount]);

  const reverse = React.useMemo(() => {
    const final = parseNumber(finalPrice);
    const pct = parseNumber(discount);
    const orig = pct < 100 ? final / (1 - pct / 100) : final;
    const discountAmount = orig - final;
    return { orig, pct, discountAmount, final };
  }, [finalPrice, discount]);

  return (
    <div className="space-y-6">
      <div className="grid sm:grid-cols-2 gap-4">
        <CurrencySelect value={currency} onChange={setCurrency} />
        <Field label="Mode">
          <Select value={mode} onValueChange={(v) => setMode(v as "forward" | "reverse")}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="forward">Original → Final (apply discount)</SelectItem>
              <SelectItem value="reverse">Final → Original (reverse discount)</SelectItem>
            </SelectContent>
          </Select>
        </Field>
      </div>

      {mode === "forward" ? (
        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="Original price">
            <Input value={original} onChange={(e) => setOriginal(e.target.value)} inputMode="decimal" />
          </Field>
          <Field label="Discount (%)">
            <Input value={discount} onChange={(e) => setDiscount(e.target.value)} inputMode="decimal" />
          </Field>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="Final price (after discount)">
            <Input value={finalPrice} onChange={(e) => setFinalPrice(e.target.value)} inputMode="decimal" />
          </Field>
          <Field label="Discount (%)">
            <Input value={discount} onChange={(e) => setDiscount(e.target.value)} inputMode="decimal" />
          </Field>
        </div>
      )}

      {mode === "forward" ? (
        <div className="grid sm:grid-cols-3 gap-4">
          <CopyableStat label="Final Price" displayValue={money(forward.final, currency)} accent="primary" />
          <ResultStat label="You Save" value={money(forward.discountAmount, currency)} accent="success" />
          <ResultStat label="Discount Amount" value={money(forward.discountAmount, currency)} accent="default" />
        </div>
      ) : (
        <div className="grid sm:grid-cols-3 gap-4">
          <CopyableStat label="Original Price" displayValue={money(reverse.orig, currency)} accent="primary" />
          <ResultStat label="Discount Amount" value={money(reverse.discountAmount, currency)} accent="warning" />
          <ResultStat label="Final Price" value={money(reverse.final, currency)} accent="default" />
        </div>
      )}

      <FormulaBox>
        Forward: Final = Original × (1 − Discount/100). Reverse: Original = Final ÷ (1 − Discount/100). Savings =
        Original − Final.
      </FormulaBox>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* 13. Future Value                                                    */
/* ------------------------------------------------------------------ */

function FutureValueCalc() {
  const [currency, setCurrency] = React.useState<string>("USD");
  const [pv, setPv] = React.useState("10000");
  const [rate, setRate] = React.useState("7");
  const [years, setYears] = React.useState("15");
  const [freq, setFreq] = React.useState("monthly");

  const calc = React.useMemo(() => {
    const P = parseNumber(pv);
    const r = parseNumber(rate) / 100;
    const t = parseNumber(years);
    const n = COMPOUND_FREQ[freq] ?? 12;
    const fv = fvLumpSum(P, r, n, t);
    const interest = fv - P;
    return { fv, interest };
  }, [pv, rate, years, freq]);

  return (
    <div className="space-y-6">
      <div className="grid sm:grid-cols-2 gap-4">
        <CurrencySelect value={currency} onChange={setCurrency} />
        <div className="hidden sm:block" />
        <Field label="Present value">
          <Input value={pv} onChange={(e) => setPv(e.target.value)} inputMode="decimal" />
        </Field>
        <Field label="Annual rate (%)">
          <Input value={rate} onChange={(e) => setRate(e.target.value)} inputMode="decimal" />
        </Field>
        <Field label="Years">
          <Input value={years} onChange={(e) => setYears(e.target.value)} inputMode="decimal" />
        </Field>
        <Field label="Compounding frequency">
          <Select value={freq} onValueChange={setFreq}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="annually">Annually</SelectItem>
              <SelectItem value="semiannually">Semi-annually</SelectItem>
              <SelectItem value="quarterly">Quarterly</SelectItem>
              <SelectItem value="monthly">Monthly</SelectItem>
              <SelectItem value="daily">Daily</SelectItem>
            </SelectContent>
          </Select>
        </Field>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <CopyableStat label="Future Value" displayValue={money(calc.fv, currency)} accent="primary" />
        <ResultStat label="Interest Earned" value={money(calc.interest, currency)} accent="success" />
      </div>

      <FormulaBox>FV = PV × (1 + r/n)<sup>nt</sup>, where n is the compounding frequency per year.</FormulaBox>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* 14. Present Value                                                   */
/* ------------------------------------------------------------------ */

function PresentValueCalc() {
  const [currency, setCurrency] = React.useState<string>("USD");
  const [fv, setFv] = React.useState("25000");
  const [rate, setRate] = React.useState("5");
  const [years, setYears] = React.useState("10");

  const calc = React.useMemo(() => {
    const F = parseNumber(fv);
    const r = parseNumber(rate) / 100;
    const t = parseNumber(years);
    const pv = r > 0 ? F / Math.pow(1 + r, t) : F;
    const interest = F - pv;
    return { pv, interest, F };
  }, [fv, rate, years]);

  return (
    <div className="space-y-6">
      <div className="grid sm:grid-cols-2 gap-4">
        <CurrencySelect value={currency} onChange={setCurrency} />
        <div className="hidden sm:block" />
        <Field label="Future value">
          <Input value={fv} onChange={(e) => setFv(e.target.value)} inputMode="decimal" />
        </Field>
        <Field label="Annual discount rate (%)">
          <Input value={rate} onChange={(e) => setRate(e.target.value)} inputMode="decimal" />
        </Field>
        <Field label="Years">
          <Input value={years} onChange={(e) => setYears(e.target.value)} inputMode="decimal" />
        </Field>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <CopyableStat label="Present Value" displayValue={money(calc.pv, currency)} accent="primary" />
        <ResultStat label="Discount (Interest)" value={money(calc.interest, currency)} accent="warning" />
      </div>

      <FormulaBox>PV = FV / (1 + r)<sup>n</sup>, where r is the annual discount rate and n is the number of years.</FormulaBox>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* 15. Break-Even                                                      */
/* ------------------------------------------------------------------ */

function BreakEvenCalc() {
  const [currency, setCurrency] = React.useState<string>("USD");
  const [fixed, setFixed] = React.useState("50000");
  const [pricePerUnit, setPricePerUnit] = React.useState("25");
  const [variablePerUnit, setVariablePerUnit] = React.useState("10");

  const calc = React.useMemo(() => {
    const f = parseNumber(fixed);
    const p = parseNumber(pricePerUnit);
    const v = parseNumber(variablePerUnit);
    const contribution = p - v;
    const units = contribution > 0 ? f / contribution : 0;
    const revenue = units * p;
    const contributionMargin = p > 0 ? (contribution / p) * 100 : 0;
    return { f, p, v, contribution, units, revenue, contributionMargin };
  }, [fixed, pricePerUnit, variablePerUnit]);

  return (
    <div className="space-y-6">
      <div className="grid sm:grid-cols-2 gap-4">
        <CurrencySelect value={currency} onChange={setCurrency} />
        <div className="hidden sm:block" />
        <Field label="Fixed costs">
          <Input value={fixed} onChange={(e) => setFixed(e.target.value)} inputMode="decimal" />
        </Field>
        <Field label="Price per unit">
          <Input value={pricePerUnit} onChange={(e) => setPricePerUnit(e.target.value)} inputMode="decimal" />
        </Field>
        <Field label="Variable cost per unit">
          <Input value={variablePerUnit} onChange={(e) => setVariablePerUnit(e.target.value)} inputMode="decimal" />
        </Field>
        <Field label="Contribution margin per unit">
          <Input value={money(calc.contribution, currency)} readOnly className="bg-muted/40 font-mono" />
        </Field>
      </div>

      <div className="grid sm:grid-cols-3 gap-4">
        <CopyableStat label="Break-Even Units" displayValue={num(calc.units, 0)} accent="primary" sublabel={`Revenue: ${money(calc.revenue, currency)}`} />
        <ResultStat label="Break-Even Revenue" value={money(calc.revenue, currency)} accent="default" />
        <ResultStat label="Contribution Margin" value={`${num(calc.contributionMargin, 1)}%`} accent="default" />
      </div>

      {calc.contribution <= 0 && (
        <div className="rounded-xl border border-warning/40 bg-warning/5 p-4 text-sm text-foreground">
          Price per unit must be greater than variable cost per unit to reach break-even. Currently your contribution
          margin per unit is {money(calc.contribution, currency)}.
        </div>
      )}

      <FormulaBox>
        Break-even units = Fixed costs ÷ (Price per unit − Variable cost per unit). Break-even revenue = Break-even
        units × Price per unit.
      </FormulaBox>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* 16. Salary                                                          */
/* ------------------------------------------------------------------ */

function SalaryCalc() {
  const [currency, setCurrency] = React.useState<string>("USD");
  const [hourly, setHourly] = React.useState("25");
  const [hoursPerWeek, setHoursPerWeek] = React.useState("40");
  const [annual, setAnnual] = React.useState("60000");
  const [annualHoursPerWeek, setAnnualHoursPerWeek] = React.useState("40");

  const hourlyCalc = React.useMemo(() => {
    const h = parseNumber(hourly);
    const hpw = parseNumber(hoursPerWeek);
    const weekly = h * hpw;
    const daily = h * 8;
    const annualSalary = weekly * 52;
    const monthly = annualSalary / 12;
    return { h, daily, weekly, monthly, annual: annualSalary };
  }, [hourly, hoursPerWeek]);

  const annualCalc = React.useMemo(() => {
    const a = parseNumber(annual);
    const hpw = parseNumber(annualHoursPerWeek);
    const weekly = a / 52;
    const monthly = a / 12;
    const hourlyRate = hpw > 0 ? weekly / hpw : 0;
    const daily = hourlyRate * 8;
    return { a, weekly, monthly, hourly: hourlyRate, daily };
  }, [annual, annualHoursPerWeek]);

  return (
    <div className="space-y-6">
      <Tabs defaultValue="hourly">
        <TabsList>
          <TabsTrigger value="hourly">Hourly → Salary</TabsTrigger>
          <TabsTrigger value="annual">Annual → Hourly</TabsTrigger>
        </TabsList>

        <TabsContent value="hourly" className="space-y-6 mt-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <CurrencySelect value={currency} onChange={setCurrency} />
            <div className="hidden sm:block" />
            <Field label="Hourly rate">
              <Input value={hourly} onChange={(e) => setHourly(e.target.value)} inputMode="decimal" />
            </Field>
            <Field label="Hours per week">
              <Input value={hoursPerWeek} onChange={(e) => setHoursPerWeek(e.target.value)} inputMode="decimal" />
            </Field>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <CopyableStat label="Hourly" displayValue={money(hourlyCalc.h, currency)} accent="default" />
            <ResultStat label="Daily (8h)" value={money(hourlyCalc.daily, currency)} accent="default" />
            <ResultStat label="Weekly" value={money(hourlyCalc.weekly, currency)} accent="default" />
            <ResultStat label="Monthly" value={money(hourlyCalc.monthly, currency)} accent="default" />
            <CopyableStat label="Annual" displayValue={money(hourlyCalc.annual, currency)} accent="primary" sublabel="52 weeks" />
          </div>
        </TabsContent>

        <TabsContent value="annual" className="space-y-6 mt-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <CurrencySelect value={currency} onChange={setCurrency} />
            <div className="hidden sm:block" />
            <Field label="Annual salary">
              <Input value={annual} onChange={(e) => setAnnual(e.target.value)} inputMode="decimal" />
            </Field>
            <Field label="Hours per week">
              <Input value={annualHoursPerWeek} onChange={(e) => setAnnualHoursPerWeek(e.target.value)} inputMode="decimal" />
            </Field>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <CopyableStat label="Hourly Rate" displayValue={money(annualCalc.hourly, currency)} accent="primary" />
            <ResultStat label="Daily (8h)" value={money(annualCalc.daily, currency)} accent="default" />
            <ResultStat label="Weekly" value={money(annualCalc.weekly, currency)} accent="default" />
            <ResultStat label="Monthly" value={money(annualCalc.monthly, currency)} accent="default" />
            <ResultStat label="Annual" value={money(annualCalc.a, currency)} accent="default" />
          </div>
        </TabsContent>
      </Tabs>

      <FormulaBox>
        Annual = Hourly × Hours/week × 52. Monthly = Annual ÷ 12. Daily = Hourly × 8. Reverse: Hourly = Annual ÷ 52 ÷
        Hours/week.
      </FormulaBox>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* 17. Retirement                                                      */
/* ------------------------------------------------------------------ */

function RetirementCalc() {
  const [currency, setCurrency] = React.useState<string>("USD");
  const [currentAge, setCurrentAge] = React.useState("30");
  const [retireAge, setRetireAge] = React.useState("65");
  const [currentSavings, setCurrentSavings] = React.useState("25000");
  const [monthly, setMonthly] = React.useState("500");
  const [rate, setRate] = React.useState("7");

  const calc = React.useMemo(() => {
    const ageNow = parseNumber(currentAge);
    const ageRetire = parseNumber(retireAge);
    const years = Math.max(0, ageRetire - ageNow);
    const months = years * 12;
    const P = parseNumber(currentSavings);
    const pmtVal = parseNumber(monthly);
    const r = parseNumber(rate) / 100;

    const fvPrincipal = fvLumpSum(P, r, 12, years);
    const fvContrib = fvAnnuity(pmtVal, r, 12, years);
    const corpus = fvPrincipal + fvContrib;
    const totalContributions = P + pmtVal * months;
    const growth = corpus - totalContributions;
    return { years, months, corpus, totalContributions, growth };
  }, [currentAge, retireAge, currentSavings, monthly, rate]);

  return (
    <div className="space-y-6">
      <div className="grid sm:grid-cols-2 gap-4">
        <CurrencySelect value={currency} onChange={setCurrency} />
        <div className="hidden sm:block" />
        <Field label="Current age">
          <Input value={currentAge} onChange={(e) => setCurrentAge(e.target.value)} inputMode="decimal" />
        </Field>
        <Field label="Retirement age">
          <Input value={retireAge} onChange={(e) => setRetireAge(e.target.value)} inputMode="decimal" />
        </Field>
        <Field label="Current savings">
          <Input value={currentSavings} onChange={(e) => setCurrentSavings(e.target.value)} inputMode="decimal" />
        </Field>
        <Field label="Monthly contribution">
          <Input value={monthly} onChange={(e) => setMonthly(e.target.value)} inputMode="decimal" />
        </Field>
        <Field label="Expected annual return (%)">
          <Input value={rate} onChange={(e) => setRate(e.target.value)} inputMode="decimal" />
        </Field>
        <div className="text-xs text-muted-foreground self-end pb-2">
          {calc.years} years · {num(calc.months, 0)} monthly contributions
        </div>
      </div>

      <div className="grid sm:grid-cols-3 gap-4">
        <CopyableStat
          label="Projected Corpus"
          displayValue={money(calc.corpus, currency)}
          accent="primary"
          sublabel={`at retirement`}
        />
        <ResultStat label="Total Contributions" value={money(calc.totalContributions, currency)} accent="default" />
        <ResultStat label="Growth" value={money(calc.growth, currency)} accent="success" />
      </div>

      <FormulaBox>
        FV = P(1 + r/12)<sup>12t</sup> + PMT · [((1 + r/12)<sup>12t</sup> − 1) / (r/12)], where t = retirement age −
        current age.
      </FormulaBox>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* 18. Net Worth                                                       */
/* ------------------------------------------------------------------ */

function NetWorthCalc() {
  const [currency, setCurrency] = React.useState<string>("USD");
  const [cash, setCash] = React.useState("15000");
  const [investments, setInvestments] = React.useState("85000");
  const [realEstate, setRealEstate] = React.useState("320000");
  const [vehicles, setVehicles] = React.useState("22000");
  const [otherAssets, setOtherAssets] = React.useState("8000");

  const [mortgage, setMortgage] = React.useState("220000");
  const [loans, setLoans] = React.useState("18000");
  const [creditCards, setCreditCards] = React.useState("3500");
  const [otherLiab, setOtherLiab] = React.useState("2000");

  const calc = React.useMemo(() => {
    const assets =
      parseNumber(cash) +
      parseNumber(investments) +
      parseNumber(realEstate) +
      parseNumber(vehicles) +
      parseNumber(otherAssets);
    const liabilities =
      parseNumber(mortgage) + parseNumber(loans) + parseNumber(creditCards) + parseNumber(otherLiab);
    const net = assets - liabilities;
    return { assets, liabilities, net };
  }, [cash, investments, realEstate, vehicles, otherAssets, mortgage, loans, creditCards, otherLiab]);

  const exportNetWorth = () => {
    const lines = [
      `Net Worth Summary (${currency})`,
      ``,
      `Assets`,
      `  Cash: ${money(parseNumber(cash), currency)}`,
      `  Investments: ${money(parseNumber(investments), currency)}`,
      `  Real estate: ${money(parseNumber(realEstate), currency)}`,
      `  Vehicles: ${money(parseNumber(vehicles), currency)}`,
      `  Other: ${money(parseNumber(otherAssets), currency)}`,
      `  Total assets: ${money(calc.assets, currency)}`,
      ``,
      `Liabilities`,
      `  Mortgage: ${money(parseNumber(mortgage), currency)}`,
      `  Loans: ${money(parseNumber(loans), currency)}`,
      `  Credit cards: ${money(parseNumber(creditCards), currency)}`,
      `  Other: ${money(parseNumber(otherLiab), currency)}`,
      `  Total liabilities: ${money(calc.liabilities, currency)}`,
      ``,
      `Net worth: ${money(calc.net, currency)}`,
    ];
    navigator.clipboard?.writeText(lines.join("\n"));
    toast.success("Net worth summary copied");
  };

  return (
    <div className="space-y-6">
      <div className="grid sm:grid-cols-2 gap-4 items-start">
        <CurrencySelect value={currency} onChange={setCurrency} />
        <div className="flex justify-end">
          <Button variant="outline" size="sm" onClick={exportNetWorth}>
            <Download className="size-3.5" /> Export summary
          </Button>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="space-y-4">
          <h3 className="text-sm font-semibold">Assets</h3>
          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="Cash &amp; bank">
              <Input value={cash} onChange={(e) => setCash(e.target.value)} inputMode="decimal" />
            </Field>
            <Field label="Investments">
              <Input value={investments} onChange={(e) => setInvestments(e.target.value)} inputMode="decimal" />
            </Field>
            <Field label="Real estate">
              <Input value={realEstate} onChange={(e) => setRealEstate(e.target.value)} inputMode="decimal" />
            </Field>
            <Field label="Vehicles">
              <Input value={vehicles} onChange={(e) => setVehicles(e.target.value)} inputMode="decimal" />
            </Field>
            <Field label="Other assets">
              <Input value={otherAssets} onChange={(e) => setOtherAssets(e.target.value)} inputMode="decimal" />
            </Field>
          </div>
          <ResultStat label="Total Assets" value={money(calc.assets, currency)} accent="success" />
        </div>

        <div className="space-y-4">
          <h3 className="text-sm font-semibold">Liabilities</h3>
          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="Mortgage">
              <Input value={mortgage} onChange={(e) => setMortgage(e.target.value)} inputMode="decimal" />
            </Field>
            <Field label="Loans">
              <Input value={loans} onChange={(e) => setLoans(e.target.value)} inputMode="decimal" />
            </Field>
            <Field label="Credit cards">
              <Input value={creditCards} onChange={(e) => setCreditCards(e.target.value)} inputMode="decimal" />
            </Field>
            <Field label="Other liabilities">
              <Input value={otherLiab} onChange={(e) => setOtherLiab(e.target.value)} inputMode="decimal" />
            </Field>
          </div>
          <ResultStat label="Total Liabilities" value={money(calc.liabilities, currency)} accent="warning" />
        </div>
      </div>

      <CopyableStat
        label="Net Worth"
        displayValue={money(calc.net, currency)}
        accent={calc.net >= 0 ? "primary" : "warning"}
        sublabel={calc.net >= 0 ? "Positive net worth" : "Negative net worth"}
      />

      <FormulaBox>Net Worth = Total Assets − Total Liabilities.</FormulaBox>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Main switch                                                          */
/* ------------------------------------------------------------------ */

export function FinanceCalcs({ calcId }: { calcId: string }) {
  switch (calcId) {
    case "loan":
      return <LoanCalc />;
    case "mortgage":
      return <MortgageCalc />;
    case "emi":
      return <EmiCalc />;
    case "compound-interest":
      return <CompoundInterestCalc />;
    case "simple-interest":
      return <SimpleInterestCalc />;
    case "savings":
      return <SavingsCalc />;
    case "investment":
      return <InvestmentCalc />;
    case "roi":
      return <RoiCalc />;
    case "cagr":
      return <CagrCalc />;
    case "profit-margin":
      return <ProfitMarginCalc />;
    case "markup":
      return <MarkupCalc />;
    case "discount":
      return <DiscountCalc />;
    case "future-value":
      return <FutureValueCalc />;
    case "present-value":
      return <PresentValueCalc />;
    case "break-even":
      return <BreakEvenCalc />;
    case "salary":
      return <SalaryCalc />;
    case "retirement":
      return <RetirementCalc />;
    case "net-worth":
      return <NetWorthCalc />;
    default:
      return null;
  }
}
