"use client";

import * as React from "react";
import { Field, ResultStat, money, num } from "@/components/calc-page-shell";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { parseNumber, formatNumber } from "@/lib/math-engine";
import { toast } from "sonner";
import { Copy } from "lucide-react";

function FormulaBox({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-xl bg-muted/30 border border-border p-4 text-sm text-muted-foreground">
      {children}
    </div>
  );
}

export function FinanceCalcsExtra({ calcId }: { calcId: string }) {
  switch (calcId) {
    case "sip": return <SIPCalc />;
    case "fd": return <FDCalc />;
    case "salary-hourly": return <SalaryHourlyCalc />;
    default: return null;
  }
}

/**
 * SIP (Systematic Investment Plan) Calculator.
 * Future value of a monthly investment with compound interest.
 * M = P × ({[1 + i]^n − 1} / i) × (1 + i)
 * where P = monthly investment, i = monthly rate (annual/12/100), n = number of months.
 */
function SIPCalc() {
  const [monthly, setMonthly] = React.useState("10000");
  const [rate, setRate] = React.useState("12");
  const [years, setYears] = React.useState("10");
  const [currency, setCurrency] = React.useState("INR");

  const P = parseNumber(monthly);
  const annualRate = parseNumber(rate);
  const n = parseNumber(years) * 12; // months
  const i = annualRate / 12 / 100;

  const futureValue = i === 0
    ? P * n
    : P * ((Math.pow(1 + i, n) - 1) / i) * (1 + i);
  const totalInvested = P * n;
  const gains = futureValue - totalInvested;

  // Year-by-year breakdown
  const breakdown: { year: number; invested: number; value: number }[] = [];
  let cumInvested = 0;
  let cumValue = 0;
  const numYears = Math.floor(parseNumber(years));
  for (let y = 1; y <= numYears; y++) {
    cumInvested += P * 12;
    const monthsThisFar = y * 12;
    cumValue = i === 0 ? P * monthsThisFar : P * ((Math.pow(1 + i, monthsThisFar) - 1) / i) * (1 + i);
    breakdown.push({ year: y, invested: cumInvested, value: cumValue });
  }

  return (
    <div className="space-y-4">
      <div className="grid sm:grid-cols-2 gap-4">
        <Field label="Monthly investment">
          <Input value={monthly} onChange={e => setMonthly(e.target.value)} inputMode="decimal" />
        </Field>
        <Field label="Expected annual return (%)">
          <Input value={rate} onChange={e => setRate(e.target.value)} inputMode="decimal" />
        </Field>
        <Field label="Time period (years)">
          <Input value={years} onChange={e => setYears(e.target.value)} inputMode="decimal" />
        </Field>
        <Field label="Currency">
          <Select value={currency} onValueChange={setCurrency}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {["INR","USD","EUR","GBP","BDT","AUD","CAD","SGD"].map(c => (
                <SelectItem key={c} value={c}>{c}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
      </div>

      <div className="grid sm:grid-cols-3 gap-3">
        <ResultStat label="Invested amount" value={money(totalInvested, currency)} />
        <ResultStat label="Estimated returns" value={money(gains, currency)} accent="success" />
        <ResultStat label="Total value" value={money(futureValue, currency)} accent="primary" />
      </div>

      {breakdown.length > 0 && (
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <div className="px-4 py-2.5 border-b border-border font-semibold text-sm">Year-by-year growth</div>
          <div className="max-h-60 overflow-y-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/30 sticky top-0">
                <tr>
                  <th className="text-left px-4 py-2 font-medium">Year</th>
                  <th className="text-right px-4 py-2 font-medium">Invested</th>
                  <th className="text-right px-4 py-2 font-medium">Value</th>
                  <th className="text-right px-4 py-2 font-medium">Gains</th>
                </tr>
              </thead>
              <tbody>
                {breakdown.map(b => (
                  <tr key={b.year} className="border-t border-border/50">
                    <td className="px-4 py-2">{b.year}</td>
                    <td className="px-4 py-2 text-right font-mono">{money(b.invested, currency)}</td>
                    <td className="px-4 py-2 text-right font-mono font-medium">{money(b.value, currency)}</td>
                    <td className="px-4 py-2 text-right font-mono text-success">{money(b.value - b.invested, currency)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <FormulaBox>
        <strong className="text-foreground">Formula:</strong> M = P × ({`[1 + i]^n − 1`} ÷ i) × (1 + i), where P = monthly investment, i = monthly rate (annual ÷ 12 ÷ 100), n = total months. This is the future value of an annuity due (investing at the start of each month).
      </FormulaBox>
    </div>
  );
}

/**
 * FD (Fixed Deposit) Calculator.
 * A = P × (1 + r/n)^(n×t)
 */
function FDCalc() {
  const [principal, setPrincipal] = React.useState("100000");
  const [rate, setRate] = React.useState("6.5");
  const [years, setYears] = React.useState("5");
  const [compounding, setCompounding] = React.useState<"monthly" | "quarterly" | "half-yearly" | "yearly">("quarterly");
  const [currency, setCurrency] = React.useState("INR");

  const P = parseNumber(principal);
  const r = parseNumber(rate) / 100;
  const t = parseNumber(years);
  const n = { monthly: 12, quarterly: 4, "half-yearly": 2, yearly: 1 }[compounding];

  const maturity = P * Math.pow(1 + r / n, n * t);
  const interest = maturity - P;

  return (
    <div className="space-y-4">
      <div className="grid sm:grid-cols-2 gap-4">
        <Field label="Principal (deposit amount)">
          <Input value={principal} onChange={e => setPrincipal(e.target.value)} inputMode="decimal" />
        </Field>
        <Field label="Interest rate (% per year)">
          <Input value={rate} onChange={e => setRate(e.target.value)} inputMode="decimal" />
        </Field>
        <Field label="Time period (years)">
          <Input value={years} onChange={e => setYears(e.target.value)} inputMode="decimal" />
        </Field>
        <Field label="Compounding frequency">
          <Select value={compounding} onValueChange={(v) => setCompounding(v as typeof compounding)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="monthly">Monthly</SelectItem>
              <SelectItem value="quarterly">Quarterly</SelectItem>
              <SelectItem value="half-yearly">Half-yearly</SelectItem>
              <SelectItem value="yearly">Yearly</SelectItem>
            </SelectContent>
          </Select>
        </Field>
        <Field label="Currency">
          <Select value={currency} onValueChange={setCurrency}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {["INR","USD","EUR","GBP","BDT","AUD","CAD","SGD"].map(c => (
                <SelectItem key={c} value={c}>{c}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
      </div>

      <div className="grid sm:grid-cols-3 gap-3">
        <ResultStat label="Principal" value={money(P, currency)} />
        <ResultStat label="Interest earned" value={money(interest, currency)} accent="success" />
        <ResultStat label="Maturity value" value={money(maturity, currency)} accent="primary" />
      </div>

      <FormulaBox>
        <strong className="text-foreground">Formula:</strong> A = P × (1 + r/n)^(n×t), where P = principal, r = annual rate (as decimal), n = compounding periods per year, t = years. FD interest is typically compounded quarterly in India.
      </FormulaBox>
    </div>
  );
}

/**
 * Salary to Hourly Calculator.
 */
function SalaryHourlyCalc() {
  const [annual, setAnnual] = React.useState("60000");
  const [hoursPerWeek, setHoursPerWeek] = React.useState("40");
  const [weeksPerYear, setWeeksPerYear] = React.useState("52");
  const [currency, setCurrency] = React.useState("USD");

  const a = parseNumber(annual);
  const hpw = parseNumber(hoursPerWeek);
  const wpy = parseNumber(weeksPerYear);
  const totalHours = hpw * wpy;

  const hourly = totalHours > 0 ? a / totalHours : 0;
  const daily = hpw > 0 ? a / (wpy * (hpw / 8)) : 0; // 8-hour day
  const weekly = a / wpy;
  const monthly = a / 12;

  return (
    <div className="space-y-4">
      <div className="grid sm:grid-cols-2 gap-4">
        <Field label="Annual salary">
          <Input value={annual} onChange={e => setAnnual(e.target.value)} inputMode="decimal" />
        </Field>
        <Field label="Currency">
          <Select value={currency} onValueChange={setCurrency}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {["USD","EUR","GBP","INR","BDT","AUD","CAD","SGD"].map(c => (
                <SelectItem key={c} value={c}>{c}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
        <Field label="Hours per week">
          <Input value={hoursPerWeek} onChange={e => setHoursPerWeek(e.target.value)} inputMode="decimal" />
        </Field>
        <Field label="Weeks per year (52 = no vacation)">
          <Input value={weeksPerYear} onChange={e => setWeeksPerYear(e.target.value)} inputMode="decimal" />
        </Field>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <ResultStat label="Hourly" value={money(hourly, currency)} accent="primary" />
        <ResultStat label="Daily (8h)" value={money(hourly * 8, currency)} />
        <ResultStat label="Weekly" value={money(weekly, currency)} />
        <ResultStat label="Monthly" value={money(monthly, currency)} />
      </div>

      <FormulaBox>
        <strong className="text-foreground">Formula:</strong> Hourly = Annual ÷ (hours/week × weeks/year). Daily = Hourly × 8. Weekly = Annual ÷ weeks/year. Monthly = Annual ÷ 12.
      </FormulaBox>
    </div>
  );
}
