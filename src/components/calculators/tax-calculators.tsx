"use client";

import * as React from "react";
import { Field, ResultStat, money, num } from "@/components/calc-page-shell";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { parseNumber, formatNumber } from "@/lib/math-engine";
import { toast } from "sonner";
import { Copy } from "lucide-react";

// ============================================================
// Shared helpers
// ============================================================

interface Bracket {
  min: number;
  max: number; // Infinity for the top bracket
  rate: number;
}

interface BracketRow {
  range: string;
  rate: number;
  taxable: number;
  tax: number;
}

function calcProgressive(
  taxableIncome: number,
  brackets: Bracket[],
  fmtMoney: (n: number) => string,
): { total: number; rows: BracketRow[] } {
  const rows: BracketRow[] = brackets.map((b) => {
    const upper = Math.min(Math.max(0, taxableIncome), b.max);
    const taxable = Math.max(0, upper - b.min);
    const tax = taxable * b.rate;
    const range =
      b.max === Infinity
        ? `${fmtMoney(b.min)} and above`
        : `${fmtMoney(b.min)} – ${fmtMoney(b.max)}`;
    return { range, rate: b.rate, taxable, tax };
  });
  const total = rows.reduce((s, r) => s + r.tax, 0);
  return { total, rows };
}

function pct(n: number): string {
  if (!Number.isFinite(n)) return "—";
  const v = n * 100;
  return `${v.toFixed(v % 1 === 0 ? 0 : 2)}%`;
}

function fmtRate(r: number): string {
  const v = r * 100;
  return `${v.toFixed(v % 1 === 0 ? 0 : 2)}%`;
}

// Currency formatters — use money() for ISO currencies that Intl handles
// with the proper symbol; custom for BDT/MYR/AED which display as code.
function fmtBDT(n: number): string {
  if (!Number.isFinite(n)) return "—";
  return `৳ ${n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}
function fmtMYR(n: number): string {
  if (!Number.isFinite(n)) return "—";
  return `RM ${n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}
function fmtAED(n: number): string {
  if (!Number.isFinite(n)) return "—";
  return `AED ${n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

const fmtUSD = (n: number) => money(n, "USD");
const fmtGBP = (n: number) => money(n, "GBP");
const fmtEUR = (n: number) => money(n, "EUR");
const fmtCAD = (n: number) => money(n, "CAD");
const fmtAUD = (n: number) => money(n, "AUD");
const fmtINR = (n: number) => money(n, "INR");
const fmtSGD = (n: number) => money(n, "SGD");

function AccuracyNote({ year, source }: { year: string; source: string }) {
  return (
    <div className="rounded-xl bg-muted/30 border border-border p-4 text-xs text-muted-foreground">
      <strong className="text-foreground">Accuracy note:</strong> Tax rules are based on official sources for the listed tax year. This is an estimate for informational purposes only — actual tax depends on deductions, credits, and circumstances not captured here. Always consult a tax professional or the official tax authority for filing.
      <div className="mt-2"><strong>Last verified:</strong> {year}. <strong>Source:</strong> {source}.</div>
    </div>
  );
}

function BracketTable({
  rows,
  fmtMoney,
  title = "Tax by bracket",
}: {
  rows: BracketRow[];
  fmtMoney: (n: number) => string;
  title?: string;
}) {
  const total = rows.reduce((s, r) => s + r.tax, 0);
  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <div className="px-4 py-2 border-b border-border bg-muted/30 text-sm font-semibold">
        {title}
      </div>
      <div className="grid grid-cols-[1fr_4rem_8rem] gap-3 px-4 py-2 bg-muted/20 text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
        <div>Bracket Range</div>
        <div className="text-right">Rate</div>
        <div className="text-right">Tax</div>
      </div>
      <div className="max-h-80 overflow-y-auto">
        {rows.map((r, i) => (
          <div
            key={i}
            className={`grid grid-cols-[1fr_4rem_8rem] gap-3 px-4 py-1.5 text-sm border-t border-border/60 ${
              r.taxable > 0 ? "" : "opacity-50"
            }`}
          >
            <div className="font-mono text-xs leading-6">{r.range}</div>
            <div className="text-right font-mono">{fmtRate(r.rate)}</div>
            <div className="text-right font-mono">{fmtMoney(r.tax)}</div>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-[1fr_4rem_8rem] gap-3 px-4 py-2 bg-muted/30 text-sm font-semibold border-t-2 border-border">
        <div>Total tax</div>
        <div />
        <div className="text-right font-mono">{fmtMoney(total)}</div>
      </div>
    </div>
  );
}

function CopyButton({ text, label = "Copy" }: { text: string; label?: string }) {
  return (
    <Button
      variant="outline"
      size="sm"
      onClick={() => {
        if (navigator.clipboard) {
          navigator.clipboard.writeText(text).then(
            () => toast.success("Copied to clipboard"),
            () => toast.error("Copy failed"),
          );
        }
      }}
    >
      <Copy className="size-3.5 mr-1.5" /> {label}
    </Button>
  );
}

/** Labeled wrapper that's safe to use with Select (Field uses a <label>, which
 * can interfere with button-based triggers). */
function SelectField({
  label,
  children,
  hint,
}: {
  label: string;
  children: React.ReactNode;
  hint?: string;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-sm font-medium text-foreground">{label}</Label>
      {children}
      {hint && <span className="text-xs text-muted-foreground block">{hint}</span>}
    </div>
  );
}

// ============================================================
// 1. tax-us — US Federal Income Tax (2024)
// ============================================================

const US_BRACKETS: Record<
  "single" | "mfj" | "hoh",
  { brackets: Bracket[]; stdDeduction: number }
> = {
  single: {
    stdDeduction: 14600,
    brackets: [
      { min: 0, max: 11600, rate: 0.10 },
      { min: 11600, max: 47150, rate: 0.12 },
      { min: 47150, max: 100525, rate: 0.22 },
      { min: 100525, max: 191950, rate: 0.24 },
      { min: 191950, max: 243725, rate: 0.32 },
      { min: 243725, max: 609350, rate: 0.35 },
      { min: 609350, max: Infinity, rate: 0.37 },
    ],
  },
  mfj: {
    stdDeduction: 29200,
    brackets: [
      { min: 0, max: 23200, rate: 0.10 },
      { min: 23200, max: 94300, rate: 0.12 },
      { min: 94300, max: 201050, rate: 0.22 },
      { min: 201050, max: 383900, rate: 0.24 },
      { min: 383900, max: 487450, rate: 0.32 },
      { min: 487450, max: 731200, rate: 0.35 },
      { min: 731200, max: Infinity, rate: 0.37 },
    ],
  },
  hoh: {
    stdDeduction: 21900,
    brackets: [
      { min: 0, max: 16550, rate: 0.10 },
      { min: 16550, max: 63100, rate: 0.12 },
      { min: 63100, max: 100500, rate: 0.22 },
      { min: 100500, max: 191950, rate: 0.24 },
      { min: 191950, max: 243700, rate: 0.32 },
      { min: 243700, max: 609350, rate: 0.35 },
      { min: 609350, max: Infinity, rate: 0.37 },
    ],
  },
};

function TaxUS() {
  const [incomeA, setIncomeA] = React.useState("75000");
  const [incomeB, setIncomeB] = React.useState("120000");
  const [status, setStatus] = React.useState<"single" | "mfj" | "hoh">("single");
  const [compare, setCompare] = React.useState(false);

  const compute = React.useCallback(
    (incomeStr: string) => {
      const gross = Math.max(0, parseNumber(incomeStr));
      const cfg = US_BRACKETS[status];
      const taxable = Math.max(0, gross - cfg.stdDeduction);
      const { total, rows } = calcProgressive(taxable, cfg.brackets, fmtUSD);
      const net = gross - total;
      const eff = gross > 0 ? total / gross : 0;
      const marginal =
        taxable <= 0 ? 0 : cfg.brackets.find((b) => taxable <= b.max)?.rate ?? 0.37;
      return { gross, taxable, total, net, eff, marginal, rows };
    },
    [status],
  );

  const a = compute(incomeA);
  const b = compute(incomeB);
  const diff = b.total - a.total;

  const statusLabel = { single: "Single", mfj: "Married Filing Jointly", hoh: "Head of Household" }[status];

  const summary = compare
    ? `US Federal Tax 2024 (${statusLabel}) — Income A ${fmtUSD(a.gross)}: tax ${fmtUSD(a.total)} (eff ${pct(a.eff)}). Income B ${fmtUSD(b.gross)}: tax ${fmtUSD(b.total)} (eff ${pct(b.eff)}). Difference: ${fmtUSD(diff)}.`
    : `US Federal Tax 2024 (${statusLabel}) — Gross ${fmtUSD(a.gross)}, taxable ${fmtUSD(a.taxable)}, federal tax ${fmtUSD(a.total)} (effective ${pct(a.eff)}, marginal ${fmtRate(a.marginal)}), net ${fmtUSD(a.net)}.`;

  return (
    <div className="space-y-4">
      <div className="grid sm:grid-cols-2 gap-4">
        <Field label="Gross annual income (USD)" hint="Includes wages, salaries, tips, etc.">
          <Input
            value={incomeA}
            onChange={(e) => setIncomeA(e.target.value)}
            inputMode="decimal"
            className="font-mono"
          />
        </Field>
        <SelectField label="Filing status" hint="Affects brackets and standard deduction">
          <Select value={status} onValueChange={(v) => setStatus(v as typeof status)}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="single">Single</SelectItem>
              <SelectItem value="mfj">Married Filing Jointly</SelectItem>
              <SelectItem value="hoh">Head of Household</SelectItem>
            </SelectContent>
          </Select>
        </SelectField>
      </div>

      <div className="flex items-center gap-2">
        <Button
          variant={compare ? "default" : "outline"}
          size="sm"
          onClick={() => setCompare((c) => !c)}
        >
          {compare ? "Comparison mode: ON" : "Enable comparison mode"}
        </Button>
        <CopyButton text={summary} label="Copy summary" />
      </div>

      {compare ? (
        <div className="grid md:grid-cols-2 gap-4">
          <ComparisonColumn title="Income A" income={incomeA} onIncome={setIncomeA} result={a} />
          <ComparisonColumn title="Income B" income={incomeB} onIncome={setIncomeB} result={b} />
          <div className="md:col-span-2 rounded-2xl border border-primary/30 bg-primary/5 p-4">
            <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Difference (B − A)
            </div>
            <div className="text-2xl font-bold font-mono mt-1">
              {fmtUSD(diff)} {diff >= 0 ? "more" : "less"} tax
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              Extra gross: {fmtUSD(b.gross - a.gross)} · Extra net: {fmtUSD(b.net - a.net)}
            </div>
          </div>
        </div>
      ) : (
        <>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <ResultStat label="Taxable income" value={fmtUSD(a.taxable)} accent="default" />
            <ResultStat label="Federal tax" value={fmtUSD(a.total)} accent="primary"
              sublabel={`Effective ${pct(a.eff)}`} />
            <ResultStat label="Marginal rate" value={fmtRate(a.marginal)} accent="warning" />
            <ResultStat label="Net income" value={fmtUSD(a.net)} accent="success" />
          </div>
          <BracketTable rows={a.rows} fmtMoney={fmtUSD} />
        </>
      )}

      <AccuracyNote year="2024 tax year" source="IRS Rev. Proc. 2023-34" />
    </div>
  );

  function ComparisonColumn({
    title,
    income,
    onIncome,
    result,
  }: {
    title: string;
    income: string;
    onIncome: (v: string) => void;
    result: ReturnType<typeof compute>;
  }) {
    return (
      <div className="space-y-3 rounded-2xl border border-border bg-card p-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-sm">{title}</h3>
          <span className="text-xs text-muted-foreground">{statusLabel}</span>
        </div>
        <Input
          value={income}
          onChange={(e) => onIncome(e.target.value)}
          inputMode="decimal"
          className="font-mono"
        />
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div>
            <div className="text-xs text-muted-foreground">Taxable</div>
            <div className="font-mono font-semibold">{fmtUSD(result.taxable)}</div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground">Federal tax</div>
            <div className="font-mono font-semibold">{fmtUSD(result.total)}</div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground">Effective</div>
            <div className="font-mono font-semibold">{pct(result.eff)}</div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground">Marginal</div>
            <div className="font-mono font-semibold">{fmtRate(result.marginal)}</div>
          </div>
          <div className="col-span-2">
            <div className="text-xs text-muted-foreground">Net income</div>
            <div className="font-mono font-semibold text-base">{fmtUSD(result.net)}</div>
          </div>
        </div>
      </div>
    );
  }
}

// ============================================================
// 2. tax-uk — UK Income Tax + NI (2024/25)
// ============================================================

function TaxUK() {
  const [income, setIncome] = React.useState("45000");

  const calc = React.useMemo(() => {
    const gross = Math.max(0, parseNumber(income));
    // Personal allowance tapers by £1 for every £2 over £100,000
    let pa = 12570;
    if (gross > 100000) {
      pa = Math.max(0, 12570 - Math.floor((gross - 100000) / 2));
    }
    // Taxable income after PA
    const taxable = Math.max(0, gross - pa);

    // Brackets use absolute thresholds (12,570 / 50,270 / 125,140) but the PA
    // taper means the 0% band shrinks. To keep things simple and consistent
    // with HMRC's online calculator, we apply the brackets to the taxable
    // income starting from the (tapered) PA threshold.
    const basicBand = Math.max(0, 50270 - pa);
    const higherBand = Math.max(0, 125140 - 50270);

    const basicPortion = Math.min(taxable, basicBand);
    const higherPortion = Math.min(Math.max(0, taxable - basicBand), higherBand);
    const additionalPortion = Math.max(0, taxable - basicBand - higherBand);

    const incomeTax = basicPortion * 0.20 + higherPortion * 0.40 + additionalPortion * 0.45;

    // National Insurance (Class 1, employee, 2024/25): 8% on £12,570–£50,270,
    // 2% above £50,270.
    const niBase = Math.max(0, Math.min(gross, 50270) - 12570);
    const niHigher = Math.max(0, gross - 50270);
    const ni = niBase * 0.08 + niHigher * 0.02;

    const totalTax = incomeTax + ni;
    const net = gross - totalTax;
    const eff = gross > 0 ? totalTax / gross : 0;

    const rows: BracketRow[] = [
      {
        range: `${fmtGBP(pa)} – ${fmtGBP(pa + basicBand)}`,
        rate: 0.20,
        taxable: basicPortion,
        tax: basicPortion * 0.20,
      },
      {
        range: `${fmtGBP(pa + basicBand)} – ${fmtGBP(125140)}`,
        rate: 0.40,
        taxable: higherPortion,
        tax: higherPortion * 0.40,
      },
      {
        range: `${fmtGBP(125140)} and above`,
        rate: 0.45,
        taxable: additionalPortion,
        tax: additionalPortion * 0.45,
      },
    ];

    return {
      gross,
      pa,
      taxable,
      incomeTax,
      ni,
      totalTax,
      net,
      eff,
      rows,
    };
  }, [income]);

  const summary = `UK Income Tax + NI 2024/25 — Gross ${fmtGBP(calc.gross)}, personal allowance ${fmtGBP(calc.pa)}, income tax ${fmtGBP(calc.incomeTax)}, NI ${fmtGBP(calc.ni)}, total tax ${fmtGBP(calc.totalTax)} (effective ${pct(calc.eff)}), net ${fmtGBP(calc.net)}.`;

  return (
    <div className="space-y-4">
      <div className="grid sm:grid-cols-2 gap-4">
        <Field label="Gross annual income (GBP)" hint="Salary before tax">
          <Input
            value={income}
            onChange={(e) => setIncome(e.target.value)}
            inputMode="decimal"
            className="font-mono"
          />
        </Field>
        <div className="flex items-end">
          <CopyButton text={summary} label="Copy summary" />
        </div>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <ResultStat label="Income tax" value={fmtGBP(calc.incomeTax)} accent="default" />
        <ResultStat label="National Insurance" value={fmtGBP(calc.ni)} accent="default" />
        <ResultStat label="Total tax" value={fmtGBP(calc.totalTax)} accent="primary"
          sublabel={`Effective ${pct(calc.eff)}`} />
        <ResultStat label="Net income" value={fmtGBP(calc.net)} accent="success" />
      </div>

      <BracketTable rows={calc.rows} fmtMoney={fmtGBP} title="Income tax by band" />

      <div className="rounded-xl bg-muted/30 border border-border p-4 text-xs text-muted-foreground">
        Personal allowance: <strong className="text-foreground font-mono">{fmtGBP(calc.pa)}</strong> ({calc.pa < 12570 ? "tapered above £100,000" : "full"}). Taxable income: <strong className="text-foreground font-mono">{fmtGBP(calc.taxable)}</strong>. NI main rate dropped to 8% from January 2024; 2% applies above the upper earnings limit (£50,270).
      </div>

      <AccuracyNote year="2024/25 tax year" source="HMRC" />
    </div>
  );
}

// ============================================================
// 3. tax-ca — Canada Federal + Ontario Provincial (2024)
// ============================================================

const CA_FEDERAL_BRACKETS: Bracket[] = [
  { min: 0, max: 55867, rate: 0.15 },
  { min: 55867, max: 111733, rate: 0.205 },
  { min: 111733, max: 173205, rate: 0.26 },
  { min: 173205, max: 246752, rate: 0.29 },
  { min: 246752, max: Infinity, rate: 0.33 },
];

const CA_ONTARIO_BRACKETS: Bracket[] = [
  { min: 0, max: 51446, rate: 0.0505 },
  { min: 51446, max: 102894, rate: 0.0915 },
  { min: 102894, max: 150000, rate: 0.1116 },
  { min: 150000, max: 220000, rate: 0.1216 },
  { min: 220000, max: Infinity, rate: 0.1316 },
];

const CA_FEDERAL_BPA = 15705; // Basic personal amount (federal)
const CA_ONTARIO_BPA = 12399; // Basic personal amount (Ontario)

function TaxCA() {
  const [income, setIncome] = React.useState("80000");

  const calc = React.useMemo(() => {
    const gross = Math.max(0, parseNumber(income));
    const fed = calcProgressive(gross, CA_FEDERAL_BRACKETS, fmtCAD);
    const ont = calcProgressive(gross, CA_ONTARIO_BRACKETS, fmtCAD);
    // Non-refundable tax credits for the basic personal amounts
    const fedCredit = CA_FEDERAL_BPA * 0.15; // 15% is the lowest federal rate
    const ontCredit = CA_ONTARIO_BPA * 0.0505; // 5.05% is the lowest Ontario rate
    const fedTax = Math.max(0, fed.total - fedCredit);
    const ontTax = Math.max(0, ont.total - ontCredit);
    const totalTax = fedTax + ontTax;
    const net = gross - totalTax;
    const eff = gross > 0 ? totalTax / gross : 0;
    return { gross, fedTax, ontTax, totalTax, net, eff, fedRows: fed.rows, ontRows: ont.rows };
  }, [income]);

  const summary = `Canada (Federal + Ontario) 2024 — Gross ${fmtCAD(calc.gross)}, federal tax ${fmtCAD(calc.fedTax)}, Ontario tax ${fmtCAD(calc.ontTax)}, total ${fmtCAD(calc.totalTax)} (effective ${pct(calc.eff)}), net ${fmtCAD(calc.net)}.`;

  return (
    <div className="space-y-4">
      <div className="grid sm:grid-cols-2 gap-4">
        <Field label="Gross annual income (CAD)" hint="Ontario resident assumed">
          <Input
            value={income}
            onChange={(e) => setIncome(e.target.value)}
            inputMode="decimal"
            className="font-mono"
          />
        </Field>
        <div className="flex items-end">
          <CopyButton text={summary} label="Copy summary" />
        </div>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <ResultStat label="Federal tax" value={fmtCAD(calc.fedTax)} accent="default"
          sublabel="After BPA credit" />
        <ResultStat label="Ontario tax" value={fmtCAD(calc.ontTax)} accent="default"
          sublabel="After BPA credit" />
        <ResultStat label="Total tax" value={fmtCAD(calc.totalTax)} accent="primary"
          sublabel={`Effective ${pct(calc.eff)}`} />
        <ResultStat label="Net income" value={fmtCAD(calc.net)} accent="success" />
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <BracketTable rows={calc.fedRows} fmtMoney={fmtCAD} title="Federal brackets" />
        <BracketTable rows={calc.ontRows} fmtMoney={fmtCAD} title="Ontario brackets" />
      </div>

      <div className="rounded-xl bg-muted/30 border border-border p-4 text-xs text-muted-foreground">
        Federal basic personal amount: <strong className="text-foreground font-mono">{fmtCAD(CA_FEDERAL_BPA)}</strong> (credit = {fmtCAD(CA_FEDERAL_BPA * 0.15)}). Ontario BPA: <strong className="text-foreground font-mono">{fmtCAD(CA_ONTARIO_BPA)}</strong> (credit = {fmtCAD(CA_ONTARIO_BPA * 0.0505)}). CPP/EI contributions not included.
      </div>

      <AccuracyNote year="2024 tax year" source="CRA (Canada Revenue Agency)" />
    </div>
  );
}

// ============================================================
// 4. tax-au — Australia Income Tax + Medicare Levy (2024/25)
// ============================================================

const AU_BRACKETS: Bracket[] = [
  { min: 0, max: 18200, rate: 0.0 },
  { min: 18200, max: 45000, rate: 0.16 },
  { min: 45000, max: 135000, rate: 0.30 },
  { min: 135000, max: 190000, rate: 0.37 },
  { min: 190000, max: Infinity, rate: 0.45 },
];

function TaxAU() {
  const [income, setIncome] = React.useState("80000");

  const calc = React.useMemo(() => {
    const gross = Math.max(0, parseNumber(income));
    const { total: incomeTax, rows } = calcProgressive(gross, AU_BRACKETS, fmtAUD);
    // Medicare levy: 2% of taxable income, single threshold $24,276
    const medicare = gross > 24276 ? gross * 0.02 : 0;
    const totalTax = incomeTax + medicare;
    const net = gross - totalTax;
    const eff = gross > 0 ? totalTax / gross : 0;
    return { gross, incomeTax, medicare, totalTax, net, eff, rows };
  }, [income]);

  const summary = `Australia 2024/25 — Gross ${fmtAUD(calc.gross)}, income tax ${fmtAUD(calc.incomeTax)}, Medicare levy ${fmtAUD(calc.medicare)}, total ${fmtAUD(calc.totalTax)} (effective ${pct(calc.eff)}), net ${fmtAUD(calc.net)}.`;

  return (
    <div className="space-y-4">
      <div className="grid sm:grid-cols-2 gap-4">
        <Field label="Taxable income (AUD)" hint="Resident individual">
          <Input
            value={income}
            onChange={(e) => setIncome(e.target.value)}
            inputMode="decimal"
            className="font-mono"
          />
        </Field>
        <div className="flex items-end">
          <CopyButton text={summary} label="Copy summary" />
        </div>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <ResultStat label="Income tax" value={fmtAUD(calc.incomeTax)} accent="default" />
        <ResultStat label="Medicare levy" value={fmtAUD(calc.medicare)} accent="default"
          sublabel="2% of taxable income" />
        <ResultStat label="Total tax" value={fmtAUD(calc.totalTax)} accent="primary"
          sublabel={`Effective ${pct(calc.eff)}`} />
        <ResultStat label="Net income" value={fmtAUD(calc.net)} accent="success" />
      </div>

      <BracketTable rows={calc.rows} fmtMoney={fmtAUD} />

      <div className="rounded-xl bg-muted/30 border border-border p-4 text-xs text-muted-foreground">
        Medicare levy threshold (single): <strong className="text-foreground font-mono">{fmtAUD(24276)}</strong>. Below this, no levy applies. Low-income offsets and the Medicare Levy Surcharge (MLS) are not modelled here.
      </div>

      <AccuracyNote year="2024-25 financial year" source="ATO (Australian Taxation Office)" />
    </div>
  );
}

// ============================================================
// 5. tax-bd — Bangladesh Personal Income Tax (FY 2024-25)
// ============================================================

const BD_BRACKETS: Bracket[] = [
  { min: 0, max: 350000, rate: 0.0 },
  { min: 350000, max: 450000, rate: 0.05 },
  { min: 450000, max: 1100000, rate: 0.10 },
  { min: 1100000, max: 1600000, rate: 0.15 },
  { min: 1600000, max: 3200000, rate: 0.20 },
  { min: 3200000, max: Infinity, rate: 0.25 },
];

function TaxBD() {
  const [income, setIncome] = React.useState("600000");

  const calc = React.useMemo(() => {
    const gross = Math.max(0, parseNumber(income));
    const { total, rows } = calcProgressive(gross, BD_BRACKETS, fmtBDT);
    const net = gross - total;
    const eff = gross > 0 ? total / gross : 0;
    const marginal =
      gross <= 0
        ? 0
        : BD_BRACKETS.find((b) => gross <= b.max)?.rate ?? 0.25;
    return { gross, total, net, eff, marginal, rows };
  }, [income]);

  const summary = `Bangladesh FY 2024-25 — Gross ${fmtBDT(calc.gross)}, tax ${fmtBDT(calc.total)} (effective ${pct(calc.eff)}, marginal ${fmtRate(calc.marginal)}), net ${fmtBDT(calc.net)}.`;

  return (
    <div className="space-y-4">
      <div className="grid sm:grid-cols-2 gap-4">
        <Field label="Total income (BDT)" hint="General (non-female, non-senior) taxpayer">
          <Input
            value={income}
            onChange={(e) => setIncome(e.target.value)}
            inputMode="decimal"
            className="font-mono"
          />
        </Field>
        <div className="flex items-end">
          <CopyButton text={summary} label="Copy summary" />
        </div>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <ResultStat label="Total income" value={fmtBDT(calc.gross)} accent="default" />
        <ResultStat label="Tax payable" value={fmtBDT(calc.total)} accent="primary"
          sublabel={`Effective ${pct(calc.eff)}`} />
        <ResultStat label="Marginal rate" value={fmtRate(calc.marginal)} accent="warning" />
        <ResultStat label="Net income" value={fmtBDT(calc.net)} accent="success" />
      </div>

      <BracketTable rows={calc.rows} fmtMoney={fmtBDT} />

      <AccuracyNote year="FY 2024-25" source="NBR Bangladesh (National Board of Revenue)" />
    </div>
  );
}

// ============================================================
// 6. tax-in — India Old vs New Regime (FY 2024-25)
// ============================================================

const IN_NEW_BRACKETS: Bracket[] = [
  { min: 0, max: 300000, rate: 0.0 },
  { min: 300000, max: 700000, rate: 0.05 },
  { min: 700000, max: 1000000, rate: 0.10 },
  { min: 1000000, max: 1200000, rate: 0.15 },
  { min: 1200000, max: 1500000, rate: 0.20 },
  { min: 1500000, max: Infinity, rate: 0.30 },
];

const IN_OLD_BRACKETS: Bracket[] = [
  { min: 0, max: 250000, rate: 0.0 },
  { min: 250000, max: 500000, rate: 0.05 },
  { min: 500000, max: 1000000, rate: 0.20 },
  { min: 1000000, max: Infinity, rate: 0.30 },
];

const IN_NEW_STD_DED = 75000;
const IN_OLD_STD_DED = 50000;

function TaxIN() {
  const [income, setIncome] = React.useState("1000000");

  const calc = React.useMemo(() => {
    const gross = Math.max(0, parseNumber(income));
    const newTaxable = Math.max(0, gross - IN_NEW_STD_DED);
    const oldTaxable = Math.max(0, gross - IN_OLD_STD_DED);
    const newCalc = calcProgressive(newTaxable, IN_NEW_BRACKETS, fmtINR);
    const oldCalc = calcProgressive(oldTaxable, IN_OLD_BRACKETS, fmtINR);
    const diff = newCalc.total - oldCalc.total;
    const recommend = diff <= 0 ? "new" : "old";
    const bestTotal = Math.min(newCalc.total, oldCalc.total);
    const net = gross - bestTotal;
    const eff = gross > 0 ? bestTotal / gross : 0;
    return {
      gross,
      newTaxable,
      oldTaxable,
      newTotal: newCalc.total,
      oldTotal: oldCalc.total,
      newRows: newCalc.rows,
      oldRows: oldCalc.rows,
      diff,
      recommend,
      bestTotal,
      net,
      eff,
    };
  }, [income]);

  const summary = `India FY 2024-25 — Gross ${fmtINR(calc.gross)}. New regime: tax ${fmtINR(calc.newTotal)}. Old regime: tax ${fmtINR(calc.oldTotal)}. Recommended: ${calc.recommend.toUpperCase()} regime. Difference: ${fmtINR(Math.abs(calc.diff))}.`;

  return (
    <div className="space-y-4">
      <div className="grid sm:grid-cols-2 gap-4">
        <Field label="Gross annual income (INR)" hint="Before any deductions">
          <Input
            value={income}
            onChange={(e) => setIncome(e.target.value)}
            inputMode="decimal"
            className="font-mono"
          />
        </Field>
        <div className="flex items-end">
          <CopyButton text={summary} label="Copy summary" />
        </div>
      </div>

      <div className="rounded-2xl border border-primary/30 bg-primary/5 p-4">
        <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
          Recommended regime
        </div>
        <div className="text-xl font-bold mt-1">
          {calc.recommend === "new" ? "New Regime" : "Old Regime"} — tax {fmtINR(calc.bestTotal)}
        </div>
        <div className="text-xs text-muted-foreground mt-1">
          Saves {fmtINR(Math.abs(calc.diff))} vs the other regime. Effective rate {pct(calc.eff)}. Net income {fmtINR(calc.net)}.
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <ResultStat label="New regime tax" value={fmtINR(calc.newTotal)} accent="primary"
              sublabel={`Taxable ${fmtINR(calc.newTaxable)}`} />
            <ResultStat label="Net (new)" value={fmtINR(calc.gross - calc.newTotal)} accent="success" />
          </div>
          <BracketTable rows={calc.newRows} fmtMoney={fmtINR} title="New regime brackets" />
        </div>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <ResultStat label="Old regime tax" value={fmtINR(calc.oldTotal)} accent="primary"
              sublabel={`Taxable ${fmtINR(calc.oldTaxable)}`} />
            <ResultStat label="Net (old)" value={fmtINR(calc.gross - calc.oldTotal)} accent="success" />
          </div>
          <BracketTable rows={calc.oldRows} fmtMoney={fmtINR} title="Old regime brackets" />
        </div>
      </div>

      <div className="rounded-xl bg-muted/30 border border-border p-4 text-xs text-muted-foreground">
        Standard deduction: ₹75,000 (new regime), ₹50,000 (old regime). The 4% Health & Education Cess and surcharge are not applied in this simplified model. Old regime typically allows additional deductions (80C, 80D, HRA, etc.) not captured here.
      </div>

      <AccuracyNote year="FY 2024-25 (AY 2025-26)" source="Income Tax Department of India" />
    </div>
  );
}

// ============================================================
// 7. tax-my — Malaysia Income Tax (YA 2024)
// ============================================================

const MY_BRACKETS: Bracket[] = [
  { min: 0, max: 5000, rate: 0.0 },
  { min: 5000, max: 20000, rate: 0.01 },
  { min: 20000, max: 35000, rate: 0.03 },
  { min: 35000, max: 50000, rate: 0.06 },
  { min: 50000, max: 70000, rate: 0.11 },
  { min: 70000, max: 100000, rate: 0.19 },
  { min: 100000, max: 250000, rate: 0.25 },
  { min: 250000, max: 400000, rate: 0.26 },
  { min: 400000, max: Infinity, rate: 0.28 },
];

const MY_PERSONAL_RELIEF = 9000;

function TaxMY() {
  const [income, setIncome] = React.useState("60000");

  const calc = React.useMemo(() => {
    const gross = Math.max(0, parseNumber(income));
    const chargeable = Math.max(0, gross - MY_PERSONAL_RELIEF);
    const { total, rows } = calcProgressive(chargeable, MY_BRACKETS, fmtMYR);
    const net = gross - total;
    const eff = gross > 0 ? total / gross : 0;
    return { gross, chargeable, total, net, eff, rows };
  }, [income]);

  const summary = `Malaysia YA 2024 — Gross ${fmtMYR(calc.gross)}, chargeable income ${fmtMYR(calc.chargeable)} (after RM 9,000 relief), tax ${fmtMYR(calc.total)} (effective ${pct(calc.eff)}), net ${fmtMYR(calc.net)}.`;

  return (
    <div className="space-y-4">
      <div className="grid sm:grid-cols-2 gap-4">
        <Field label="Gross annual income (MYR)" hint="Resident individual">
          <Input
            value={income}
            onChange={(e) => setIncome(e.target.value)}
            inputMode="decimal"
            className="font-mono"
          />
        </Field>
        <div className="flex items-end">
          <CopyButton text={summary} label="Copy summary" />
        </div>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <ResultStat label="Gross income" value={fmtMYR(calc.gross)} accent="default" />
        <ResultStat label="Chargeable income" value={fmtMYR(calc.chargeable)} accent="default"
          sublabel="After RM 9,000 relief" />
        <ResultStat label="Tax payable" value={fmtMYR(calc.total)} accent="primary"
          sublabel={`Effective ${pct(calc.eff)}`} />
        <ResultStat label="Net income" value={fmtMYR(calc.net)} accent="success" />
      </div>

      <BracketTable rows={calc.rows} fmtMoney={fmtMYR} />

      <AccuracyNote year="YA 2024 (Year of Assessment)" source="LHDN / IRBM (Inland Revenue Board of Malaysia)" />
    </div>
  );
}

// ============================================================
// 8. tax-ae — UAE VAT + Corporate Tax (2024)
// ============================================================

function TaxAE() {
  const [mode, setMode] = React.useState<"vat" | "corporate">("vat");
  const [amount, setAmount] = React.useState("1000");
  const [vatDir, setVatDir] = React.useState<"add" | "remove">("add");

  const calc = React.useMemo(() => {
    const amt = parseNumber(amount);
    if (mode === "vat") {
      if (vatDir === "add") {
        const net = amt;
        const vat = amt * 0.05;
        const gross = amt + vat;
        return { net, vat, gross, tax: vat, label: "VAT (5%)" };
      } else {
        const gross = amt;
        const net = amt / 1.05;
        const vat = gross - net;
        return { net, vat, gross, tax: vat, label: "VAT (5%)" };
      }
    } else {
      // Corporate: 0% on first 375,000, 9% above
      const profit = amt;
      const exempt = Math.min(profit, 375000);
      const taxable = Math.max(0, profit - 375000);
      const tax = taxable * 0.09;
      const net = profit - tax;
      return { net, vat: 0, gross: profit, tax, exempt, label: "Corporate tax (9% above AED 375,000)" };
    }
  }, [mode, amount, vatDir]);

  const summary =
    mode === "vat"
      ? `UAE VAT 2024 — ${vatDir === "add" ? "Add VAT" : "Remove VAT"}: amount ${fmtAED(parseNumber(amount))}, VAT ${fmtAED(calc.vat)}, ${vatDir === "add" ? "gross" : "net"} ${fmtAED(vatDir === "add" ? calc.gross : calc.net)}.`
      : `UAE Corporate Tax 2024 — Net profit ${fmtAED(parseNumber(amount))}, exempt ${fmtAED(calc.exempt ?? 0)}, corporate tax ${fmtAED(calc.tax)}, after-tax ${fmtAED(calc.net)}.`;

  return (
    <div className="space-y-4">
      <div className="rounded-xl bg-muted/30 border border-border p-4 text-sm text-muted-foreground">
        UAE has no personal income tax. This calculator covers <strong className="text-foreground">VAT (5%)</strong> and <strong className="text-foreground">Corporate Tax (9% on profits &gt; AED 375,000)</strong>.
      </div>

      <Tabs value={mode} onValueChange={(v) => setMode(v as typeof mode)}>
        <TabsList>
          <TabsTrigger value="vat">VAT (5%)</TabsTrigger>
          <TabsTrigger value="corporate">Corporate Tax (9%)</TabsTrigger>
        </TabsList>

        <TabsContent value="vat" className="space-y-4 mt-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <Field label={vatDir === "add" ? "Net amount (excl. VAT)" : "Gross amount (incl. VAT)"}>
              <Input
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                inputMode="decimal"
                className="font-mono"
              />
            </Field>
            <SelectField label="Direction">
              <Select value={vatDir} onValueChange={(v) => setVatDir(v as typeof vatDir)}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="add">Add VAT (net → gross)</SelectItem>
                  <SelectItem value="remove">Remove VAT (gross → net)</SelectItem>
                </SelectContent>
              </Select>
            </SelectField>
          </div>
          <div className="grid sm:grid-cols-3 gap-3">
            <ResultStat label="Net amount" value={fmtAED(calc.net)} accent="default" />
            <ResultStat label="VAT (5%)" value={fmtAED(calc.vat)} accent="primary" />
            <ResultStat label="Gross amount" value={fmtAED(calc.gross)} accent="success" />
          </div>
        </TabsContent>

        <TabsContent value="corporate" className="space-y-4 mt-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="Net profit (AED)" hint="Taxable profit before corporate tax">
              <Input
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                inputMode="decimal"
                className="font-mono"
              />
            </Field>
            <div className="flex items-end">
              <CopyButton text={summary} label="Copy summary" />
            </div>
          </div>
          <div className="grid sm:grid-cols-3 gap-3">
            <ResultStat label="Taxable above AED 375K" value={fmtAED(Math.max(0, parseNumber(amount) - 375000))} accent="default" />
            <ResultStat label="Corporate tax (9%)" value={fmtAED(calc.tax)} accent="primary" />
            <ResultStat label="After-tax profit" value={fmtAED(calc.net)} accent="success" />
          </div>
          <div className="rounded-xl bg-muted/30 border border-border p-4 text-xs text-muted-foreground">
            0% rate applies to the first <strong className="text-foreground font-mono">AED 375,000</strong> of taxable profit. 9% applies to the portion above. Some free-zone entities may qualify for 0% under qualifying conditions.
          </div>
        </TabsContent>
      </Tabs>

      <div className="flex justify-end">
        <CopyButton text={summary} label="Copy summary" />
      </div>

      <AccuracyNote year="2024" source="UAE FTA (Federal Tax Authority)" />
    </div>
  );
}

// ============================================================
// 9. tax-sg — Singapore Income Tax (YA 2024)
// ============================================================

const SG_BRACKETS: Bracket[] = [
  { min: 0, max: 20000, rate: 0.0 },
  { min: 20000, max: 30000, rate: 0.02 },
  { min: 30000, max: 40000, rate: 0.035 },
  { min: 40000, max: 80000, rate: 0.07 },
  { min: 80000, max: 120000, rate: 0.115 },
  { min: 120000, max: 160000, rate: 0.15 },
  { min: 160000, max: 200000, rate: 0.18 },
  { min: 200000, max: 240000, rate: 0.19 },
  { min: 240000, max: 280000, rate: 0.195 },
  { min: 280000, max: 320000, rate: 0.20 },
  { min: 320000, max: 500000, rate: 0.22 },
  { min: 500000, max: 1000000, rate: 0.23 },
  { min: 1000000, max: Infinity, rate: 0.24 },
];

const SG_PERSONAL_RELIEF = 1000;

function TaxSG() {
  const [income, setIncome] = React.useState("60000");

  const calc = React.useMemo(() => {
    const gross = Math.max(0, parseNumber(income));
    const chargeable = Math.max(0, gross - SG_PERSONAL_RELIEF);
    const { total, rows } = calcProgressive(chargeable, SG_BRACKETS, fmtSGD);
    const net = gross - total;
    const eff = gross > 0 ? total / gross : 0;
    return { gross, chargeable, total, net, eff, rows };
  }, [income]);

  const summary = `Singapore YA 2024 — Gross ${fmtSGD(calc.gross)}, chargeable income ${fmtSGD(calc.chargeable)} (after S$1,000 relief), tax ${fmtSGD(calc.total)} (effective ${pct(calc.eff)}), net ${fmtSGD(calc.net)}.`;

  return (
    <div className="space-y-4">
      <div className="grid sm:grid-cols-2 gap-4">
        <Field label="Gross annual income (SGD)" hint="Resident individual">
          <Input
            value={income}
            onChange={(e) => setIncome(e.target.value)}
            inputMode="decimal"
            className="font-mono"
          />
        </Field>
        <div className="flex items-end">
          <CopyButton text={summary} label="Copy summary" />
        </div>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <ResultStat label="Gross income" value={fmtSGD(calc.gross)} accent="default" />
        <ResultStat label="Chargeable income" value={fmtSGD(calc.chargeable)} accent="default"
          sublabel="After S$1,000 relief" />
        <ResultStat label="Tax payable" value={fmtSGD(calc.total)} accent="primary"
          sublabel={`Effective ${pct(calc.eff)}`} />
        <ResultStat label="Net income" value={fmtSGD(calc.net)} accent="success" />
      </div>

      <BracketTable rows={calc.rows} fmtMoney={fmtSGD} />

      <div className="rounded-xl bg-muted/30 border border-border p-4 text-xs text-muted-foreground">
        Personal relief default S$1,000 shown for illustration; in practice, residents can claim many reliefs (CPF, earned income, spouse, child, etc.). CPF contributions and the S$1,000 default relief are the only deductions modelled here.
      </div>

      <AccuracyNote year="YA 2024 (Year of Assessment)" source="IRAS (Inland Revenue Authority of Singapore)" />
    </div>
  );
}

// ============================================================
// 10. tax-de — Germany Income Tax (2024)
// ============================================================

function computeGermanTax(income: number): number {
  // 2024 formula for single taxpayers (basic table).
  if (income <= 11604) return 0;
  if (income <= 17005) {
    const y = (income - 11604) / 10000;
    return Math.floor((932.30 * y + 1400) * y);
  }
  if (income <= 66760) {
    const z = (income - 17005) / 10000;
    return Math.floor((176.64 * z + 2397) * z + 1015.13);
  }
  if (income <= 277825) {
    return Math.floor(0.42 * income - 10911.92);
  }
  return Math.floor(0.45 * income - 19246.67);
}

function TaxDE() {
  const [income, setIncome] = React.useState("50000");
  const [church, setChurch] = React.useState<"none" | "8" | "9">("none");

  const calc = React.useMemo(() => {
    const gross = Math.max(0, parseNumber(income));
    const incomeTax = computeGermanTax(gross);
    // Solidarity surcharge: 5.5% of income tax only if income tax > €18,130
    const soli = incomeTax > 18130 ? incomeTax * 0.055 : 0;
    // Church tax: 8% or 9% of income tax
    const churchRate = church === "9" ? 0.09 : church === "8" ? 0.08 : 0;
    const churchTax = incomeTax * churchRate;
    const totalTax = incomeTax + soli + churchTax;
    const net = gross - totalTax;
    const eff = gross > 0 ? totalTax / gross : 0;

    // Determine the zone for display
    let zone = "Below basic allowance (€11,604)";
    if (gross > 277825) zone = "Zone 4 (top rate, 45%)";
    else if (gross > 66760) zone = "Zone 3 (42%)";
    else if (gross > 17005) zone = "Zone 2 (progressive 24–42%)";
    else if (gross > 11604) zone = "Zone 1 (progressive 14–24%)";

    return { gross, incomeTax, soli, churchTax, totalTax, net, eff, zone };
  }, [income, church]);

  const summary = `Germany 2024 — Gross ${fmtEUR(calc.gross)}, income tax ${fmtEUR(calc.incomeTax)}, solidarity ${fmtEUR(calc.soli)}, church tax ${fmtEUR(calc.churchTax)} (${church}), total ${fmtEUR(calc.totalTax)} (effective ${pct(calc.eff)}), net ${fmtEUR(calc.net)}.`;

  return (
    <div className="space-y-4">
      <div className="grid sm:grid-cols-3 gap-4">
        <Field label="Taxable income (EUR)" hint="Single taxpayer, no children">
          <Input
            value={income}
            onChange={(e) => setIncome(e.target.value)}
            inputMode="decimal"
            className="font-mono"
          />
        </Field>
        <SelectField label="Church tax" hint="9% in Bavaria/BW, 8% elsewhere">
          <Select value={church} onValueChange={(v) => setChurch(v as typeof church)}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">None</SelectItem>
              <SelectItem value="8">8% (most states)</SelectItem>
              <SelectItem value="9">9% (Bavaria, Baden-Württemberg)</SelectItem>
            </SelectContent>
          </Select>
        </SelectField>
        <div className="flex items-end">
          <CopyButton text={summary} label="Copy summary" />
        </div>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <ResultStat label="Income tax" value={fmtEUR(calc.incomeTax)} accent="default"
          sublabel={calc.zone} />
        <ResultStat label="Solidarity surcharge" value={fmtEUR(calc.soli)} accent="default"
          sublabel="5.5% of tax (if > €18,130)" />
        <ResultStat label="Church tax" value={fmtEUR(calc.churchTax)} accent="default"
          sublabel={church === "none" ? "Not applied" : `${church}% of income tax`} />
        <ResultStat label="Net income" value={fmtEUR(calc.net)} accent="success"
          sublabel={`Effective ${pct(calc.eff)}`} />
      </div>

      <div className="rounded-2xl border border-border bg-card p-5">
        <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
          Total tax
        </div>
        <div className="text-3xl font-bold font-mono">{fmtEUR(calc.totalTax)}</div>
        <div className="text-xs text-muted-foreground mt-1">
          Income tax + solidarity + church tax. Effective rate {pct(calc.eff)}.
        </div>
      </div>

      <div className="rounded-xl bg-muted/30 border border-border p-4 text-xs text-muted-foreground">
        <strong className="text-foreground">2024 German tax formula (single):</strong> Grundfreibetrag (basic allowance) €11,604. Zone 1 (€11,605–17,005): <span className="font-mono">tax = (932.30·y + 1,400)·y</span>, y = (income − 11,604) / 10,000. Zone 2 (€17,006–66,760): <span className="font-mono">tax = (176.64·z + 2,397)·z + 1,015.13</span>, z = (income − 17,005) / 10,000. Zone 3 (€66,761–277,825): <span className="font-mono">tax = 0.42·income − 10,911.92</span>. Zone 4 (above): <span className="font-mono">tax = 0.45·income − 19,246.67</span>. Solidarity surcharge 5.5% of income tax if income tax &gt; €18,130 (single).
      </div>

      <AccuracyNote year="2024 (Steuerjahr 2024)" source="BMF (Bundesministerium der Finanzen)" />
    </div>
  );
}

// ============================================================
// 11. vat — VAT Calculator
// ============================================================

function VAT() {
  const [amount, setAmount] = React.useState("100");
  const [rate, setRate] = React.useState("20");
  const [dir, setDir] = React.useState<"add" | "remove">("add");

  const calc = React.useMemo(() => {
    const amt = parseNumber(amount);
    const r = parseNumber(rate) / 100;
    if (dir === "add") {
      const net = amt;
      const vat = amt * r;
      const gross = amt + vat;
      return { net, vat, gross };
    } else {
      const gross = amt;
      const net = amt / (1 + r);
      const vat = gross - net;
      return { net, vat, gross };
    }
  }, [amount, rate, dir]);

  const summary = `VAT (${rate}%) — ${dir === "add" ? "Add" : "Remove"}: net ${fmtUSD(calc.net)}, VAT ${fmtUSD(calc.vat)}, gross ${fmtUSD(calc.gross)}.`;

  return (
    <div className="space-y-4">
      <div className="grid sm:grid-cols-3 gap-4">
        <Field label={dir === "add" ? "Net amount" : "Gross amount"}>
          <Input
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            inputMode="decimal"
            className="font-mono"
          />
        </Field>
        <Field label="VAT rate (%)">
          <Input
            value={rate}
            onChange={(e) => setRate(e.target.value)}
            inputMode="decimal"
            className="font-mono"
          />
        </Field>
        <SelectField label="Direction">
          <Select value={dir} onValueChange={(v) => setDir(v as typeof dir)}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="add">Add VAT (net → gross)</SelectItem>
              <SelectItem value="remove">Remove VAT (gross → net)</SelectItem>
            </SelectContent>
          </Select>
        </SelectField>
      </div>

      <div className="flex justify-end">
        <CopyButton text={summary} label="Copy summary" />
      </div>

      <div className="grid sm:grid-cols-3 gap-3">
        <ResultStat label="Net amount" value={fmtUSD(calc.net)} accent="default" />
        <ResultStat label={`VAT (${rate}%)`} value={fmtUSD(calc.vat)} accent="primary" />
        <ResultStat label="Gross amount" value={fmtUSD(calc.gross)} accent="success" />
      </div>

      <AccuracyNote year="2024" source="Generic VAT calculation; rates vary by country (UK 20%, EU standard 19–25%)" />
    </div>
  );
}

// ============================================================
// 12. gst — GST Calculator (India 18% / Australia 10%)
// ============================================================

function GST() {
  const [country, setCountry] = React.useState<"in" | "au">("in");
  const [amount, setAmount] = React.useState("100");
  const [rate, setRate] = React.useState("18");
  const [dir, setDir] = React.useState<"add" | "remove">("add");

  // When country changes, update default rate
  React.useEffect(() => {
    if (country === "in") setRate("18");
    else setRate("10");
  }, [country]);

  const fmt = country === "in" ? fmtINR : fmtAUD;
  const curr = country === "in" ? "INR" : "AUD";

  const calc = React.useMemo(() => {
    const amt = parseNumber(amount);
    const r = parseNumber(rate) / 100;
    if (dir === "add") {
      const net = amt;
      const gst = amt * r;
      const gross = amt + gst;
      return { net, gst, gross };
    } else {
      const gross = amt;
      const net = amt / (1 + r);
      const gst = gross - net;
      return { net, gst, gross };
    }
  }, [amount, rate, dir]);

  const summary = `GST ${country.toUpperCase()} (${rate}%) — ${dir === "add" ? "Add" : "Remove"}: net ${fmt(calc.net)}, GST ${fmt(calc.gst)}, gross ${fmt(calc.gross)}.`;

  return (
    <div className="space-y-4">
      <div className="grid sm:grid-cols-4 gap-4">
        <SelectField label="Country">
          <Select value={country} onValueChange={(v) => setCountry(v as typeof country)}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="in">India (default 18%)</SelectItem>
              <SelectItem value="au">Australia (default 10%)</SelectItem>
            </SelectContent>
          </Select>
        </SelectField>
        <Field label={dir === "add" ? `Net amount (${curr})` : `Gross amount (${curr})`}>
          <Input
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            inputMode="decimal"
            className="font-mono"
          />
        </Field>
        <Field label="GST rate (%)">
          <Input
            value={rate}
            onChange={(e) => setRate(e.target.value)}
            inputMode="decimal"
            className="font-mono"
          />
        </Field>
        <SelectField label="Direction">
          <Select value={dir} onValueChange={(v) => setDir(v as typeof dir)}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="add">Add GST (net → gross)</SelectItem>
              <SelectItem value="remove">Remove GST (gross → net)</SelectItem>
            </SelectContent>
          </Select>
        </SelectField>
      </div>

      <div className="flex justify-end">
        <CopyButton text={summary} label="Copy summary" />
      </div>

      <div className="grid sm:grid-cols-3 gap-3">
        <ResultStat label="Net amount" value={fmt(calc.net)} accent="default" />
        <ResultStat label={`GST (${rate}%)`} value={fmt(calc.gst)} accent="primary" />
        <ResultStat label="Gross amount" value={fmt(calc.gross)} accent="success" />
      </div>

      <div className="rounded-xl bg-muted/30 border border-border p-4 text-xs text-muted-foreground">
        India GST standard rate is 18% (with 5%, 12%, 28% slabs for various goods/services). Australia GST is a flat 10% on most supplies.
      </div>

      <AccuracyNote year="2024" source="GST Council of India / ATO (Australia)" />
    </div>
  );
}

// ============================================================
// 13. sales-tax — US Sales Tax
// ============================================================

const US_STATES: { code: string; name: string; rate: number }[] = [
  { code: "CA", name: "California", rate: 7.25 },
  { code: "TX", name: "Texas", rate: 6.25 },
  { code: "NY", name: "New York", rate: 4.0 },
  { code: "FL", name: "Florida", rate: 6.0 },
  { code: "WA", name: "Washington", rate: 6.5 },
  { code: "IL", name: "Illinois", rate: 6.25 },
  { code: "PA", name: "Pennsylvania", rate: 6.0 },
  { code: "GA", name: "Georgia", rate: 4.0 },
  { code: "NC", name: "North Carolina", rate: 4.75 },
  { code: "MA", name: "Massachusetts", rate: 6.25 },
  { code: "OR", name: "Oregon (no state sales tax)", rate: 0.0 },
  { code: "MT", name: "Montana (no state sales tax)", rate: 0.0 },
  { code: "NH", name: "New Hampshire (no state sales tax)", rate: 0.0 },
  { code: "DE", name: "Delaware (no state sales tax)", rate: 0.0 },
];

function SalesTax() {
  const [amount, setAmount] = React.useState("100");
  const [stateCode, setStateCode] = React.useState("CA");

  const state = US_STATES.find((s) => s.code === stateCode) ?? US_STATES[0];

  const calc = React.useMemo(() => {
    const subtotal = parseNumber(amount);
    const taxRate = state.rate / 100;
    const tax = subtotal * taxRate;
    const total = subtotal + tax;
    return { subtotal, tax, total, taxRate };
  }, [amount, state]);

  const summary = `US Sales Tax (${state.name}, ${state.rate}%) — Subtotal ${fmtUSD(calc.subtotal)}, tax ${fmtUSD(calc.tax)}, total ${fmtUSD(calc.total)}.`;

  return (
    <div className="space-y-4">
      <div className="grid sm:grid-cols-2 gap-4">
        <Field label="Pre-tax amount (USD)">
          <Input
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            inputMode="decimal"
            className="font-mono"
          />
        </Field>
        <SelectField label="State" hint="State-level base rate only (local add-ons excluded)">
          <Select value={stateCode} onValueChange={setStateCode}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {US_STATES.map((s) => (
                <SelectItem key={s.code} value={s.code}>
                  {s.name} — {s.rate}%
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </SelectField>
      </div>

      <div className="flex justify-end">
        <CopyButton text={summary} label="Copy summary" />
      </div>

      <div className="grid sm:grid-cols-3 gap-3">
        <ResultStat label="Subtotal" value={fmtUSD(calc.subtotal)} accent="default" />
        <ResultStat label={`Sales tax (${state.rate}%)`} value={fmtUSD(calc.tax)} accent="primary" />
        <ResultStat label="Total" value={fmtUSD(calc.total)} accent="success" />
      </div>

      <div className="rounded-xl bg-muted/30 border border-border p-4 text-xs text-muted-foreground">
        Rates shown are base state-level rates for 2024. Most states allow local (county/city/district) add-ons of 0.5–3% on top — California's combined average is ~8.8%, New York City ~8.875%, Chicago IL ~10.25%. The calculator uses only the state base rate.
      </div>

      <AccuracyNote year="2024" source="State Departments of Revenue (base rates)" />
    </div>
  );
}

// ============================================================
// 14. capital-gains — US Capital Gains Tax
// ============================================================

function CapitalGains() {
  const [purchase, setPurchase] = React.useState("10000");
  const [sale, setSale] = React.useState("15000");
  const [period, setPeriod] = React.useState<"short" | "long">("long");
  const [income, setIncome] = React.useState("75000");
  const [stRate, setStRate] = React.useState("24"); // short-term ordinary rate input

  const calc = React.useMemo(() => {
    const p = parseNumber(purchase);
    const s = parseNumber(sale);
    const gain = s - p;
    const inc = parseNumber(income);
    let taxRate = 0;
    let bracketLabel = "";

    if (gain <= 0) {
      taxRate = 0;
      bracketLabel = "Loss — no tax";
    } else if (period === "short") {
      taxRate = parseNumber(stRate) / 100;
      bracketLabel = `Short-term, ordinary rate (${stRate}%)`;
    } else {
      // Long-term brackets (2024 single)
      if (inc <= 47025) {
        taxRate = 0;
        bracketLabel = "0% bracket (income ≤ $47,025)";
      } else if (inc <= 518900) {
        taxRate = 0.15;
        bracketLabel = "15% bracket ($47,026 – $518,900)";
      } else {
        taxRate = 0.20;
        bracketLabel = "20% bracket (above $518,900)";
      }
    }

    const tax = Math.max(0, gain) * taxRate;
    const netGain = gain - tax;
    return { gain, taxRate, bracketLabel, tax, netGain };
  }, [purchase, sale, period, income, stRate]);

  const summary = `US Capital Gains — Purchase ${fmtUSD(parseNumber(purchase))}, sale ${fmtUSD(parseNumber(sale))}, ${period === "short" ? "short-term" : "long-term"} gain ${fmtUSD(calc.gain)}, tax ${fmtUSD(calc.tax)} (${fmtRate(calc.taxRate)}), net gain ${fmtUSD(calc.netGain)}.`;

  return (
    <div className="space-y-4">
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Field label="Purchase price (USD)">
          <Input
            value={purchase}
            onChange={(e) => setPurchase(e.target.value)}
            inputMode="decimal"
            className="font-mono"
          />
        </Field>
        <Field label="Sale price (USD)">
          <Input
            value={sale}
            onChange={(e) => setSale(e.target.value)}
            inputMode="decimal"
            className="font-mono"
          />
        </Field>
        <SelectField label="Holding period">
          <Select value={period} onValueChange={(v) => setPeriod(v as typeof period)}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="short">Short-term (&lt; 1 year)</SelectItem>
              <SelectItem value="long">Long-term (≥ 1 year)</SelectItem>
            </SelectContent>
          </Select>
        </SelectField>
        {period === "short" ? (
          <Field label="Ordinary rate (%)" hint="Approximate marginal ordinary rate">
            <Input
              value={stRate}
              onChange={(e) => setStRate(e.target.value)}
              inputMode="decimal"
              className="font-mono"
            />
          </Field>
        ) : (
          <Field label="Other taxable income (USD)" hint="Determines long-term bracket">
            <Input
              value={income}
              onChange={(e) => setIncome(e.target.value)}
              inputMode="decimal"
              className="font-mono"
            />
          </Field>
        )}
      </div>

      <div className="flex justify-end">
        <CopyButton text={summary} label="Copy summary" />
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <ResultStat label="Capital gain" value={fmtUSD(calc.gain)} accent={calc.gain >= 0 ? "default" : "warning"}
          sublabel={calc.gain < 0 ? "Capital loss" : undefined} />
        <ResultStat label="Tax rate" value={fmtRate(calc.taxRate)} accent="warning"
          sublabel={calc.bracketLabel} />
        <ResultStat label="Tax owed" value={fmtUSD(calc.tax)} accent="primary" />
        <ResultStat label="Net gain" value={fmtUSD(calc.netGain)} accent="success" />
      </div>

      <div className="rounded-xl bg-muted/30 border border-border p-4 text-xs text-muted-foreground">
        <strong className="text-foreground">Long-term brackets (2024 single):</strong> 0% if income ≤ $47,025; 15% if $47,026–$518,900; 20% above $518,900. Short-term gains are taxed as ordinary income at your marginal rate. The 3.8% Net Investment Income Tax (NIIT) for high earners is not modelled here. Losses can offset up to $3,000 of ordinary income per year (excess carries forward).
      </div>

      <AccuracyNote year="2024 tax year" source="IRS Pub. 544 (Sales and Other Dispositions of Assets)" />
    </div>
  );
}

// ============================================================
// Main switch
// ============================================================

export function TaxCalculators({ calcId }: { calcId: string }) {
  switch (calcId) {
    case "tax-us":
      return <TaxUS />;
    case "tax-uk":
      return <TaxUK />;
    case "tax-ca":
      return <TaxCA />;
    case "tax-au":
      return <TaxAU />;
    case "tax-bd":
      return <TaxBD />;
    case "tax-in":
      return <TaxIN />;
    case "tax-my":
      return <TaxMY />;
    case "tax-ae":
      return <TaxAE />;
    case "tax-sg":
      return <TaxSG />;
    case "tax-de":
      return <TaxDE />;
    case "vat":
      return <VAT />;
    case "gst":
      return <GST />;
    case "sales-tax":
      return <SalesTax />;
    case "capital-gains":
      return <CapitalGains />;
    default:
      return null;
  }
}
