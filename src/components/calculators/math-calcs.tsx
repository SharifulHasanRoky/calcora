"use client";

import * as React from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { formatNumber, parseNumber, evaluate } from "@/lib/math-engine";
import { toast } from "sonner";
import { Copy } from "lucide-react";
import { Field, ResultStat } from "@/components/calc-page-shell";

/* ------------------------------------------------------------------ */
/* Shared helpers                                                      */
/* ------------------------------------------------------------------ */

/** Greatest common divisor via the Euclidean algorithm. */
function gcd(a: number, b: number): number {
  a = Math.abs(Math.round(a));
  b = Math.abs(Math.round(b));
  while (b) {
    [a, b] = [b, a % b];
  }
  return a;
}

/** Least common multiple. Returns 0 if either argument is 0. */
function lcm(a: number, b: number): number {
  if (a === 0 || b === 0) return 0;
  return Math.abs(Math.round(a) * Math.round(b)) / gcd(a, b);
}

/** Prime factorization of a positive integer. Returns [] for n < 2. */
function primeFactors(n: number): number[] {
  if (n < 2) return [];
  const factors: number[] = [];
  let x = n;
  while (x % 2 === 0) {
    factors.push(2);
    x = x / 2;
  }
  for (let i = 3; i * i <= x; i += 2) {
    while (x % i === 0) {
      factors.push(i);
      x = x / i;
    }
  }
  if (x > 1) factors.push(x);
  return factors;
}

/** Group a flat list of prime factors into "p^e" notation. */
function formatFactorization(factors: number[]): string {
  if (factors.length === 0) return "";
  const map = new Map<number, number>();
  for (const f of factors) map.set(f, (map.get(f) || 0) + 1);
  return Array.from(map.entries())
    .map(([p, e]) => (e === 1 ? `${p}` : `${p}^${e}`))
    .join(" × ");
}

/** Split a comma/space separated string into numbers. */
function parseList(input: string): number[] {
  return input
    .split(/[\s,;]+/)
    .map((s) => s.trim())
    .filter(Boolean)
    .map((s) => parseNumber(s))
    .filter((n) => Number.isFinite(n));
}

/** Muted formula box shown at the bottom of every calculator. */
function Formula({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-xl bg-muted/30 border border-border p-4 text-sm text-muted-foreground leading-relaxed">
      <strong className="text-foreground">Formula:</strong> {children}
    </div>
  );
}

/** A result stat card with a copy-to-clipboard button in the top-right. */
function CopyableResult({
  label,
  value,
  sublabel,
  accent,
  copyText,
}: {
  label: string;
  value: React.ReactNode;
  sublabel?: string;
  accent?: "primary" | "success" | "warning" | "default";
  copyText?: string;
}) {
  const text = copyText ?? (typeof value === "string" ? value : String(value ?? ""));
  return (
    <div className="relative">
      <ResultStat label={label} value={value} sublabel={sublabel} accent={accent} />
      <Button
        variant="ghost"
        size="icon"
        className="absolute top-2 right-2 h-7 w-7 text-muted-foreground hover:text-foreground"
        aria-label="Copy result"
        onClick={() => {
          if (!text) return;
          navigator.clipboard
            .writeText(text)
            .then(() => toast.success("Result copied to clipboard"))
            .catch(() => toast.error("Could not copy to clipboard"));
        }}
      >
        <Copy className="size-3.5" />
      </Button>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* 1. Percentage                                                       */
/* ------------------------------------------------------------------ */

function PercentageCalc() {
  const [mode, setMode] = React.useState<"of" | "isWhat">("of");
  const [percent, setPercent] = React.useState("15");
  const [value, setValue] = React.useState("250");
  const [part, setPart] = React.useState("37.5");
  const [whole, setWhole] = React.useState("250");

  const p = parseNumber(percent);
  const v = parseNumber(value);
  const ofResult = (p / 100) * v;

  const partN = parseNumber(part);
  const wholeN = parseNumber(whole);
  const isWhatPct = wholeN !== 0 ? (partN / wholeN) * 100 : 0;

  return (
    <div className="space-y-4">
      <Tabs value={mode} onValueChange={(m) => setMode(m as "of" | "isWhat")}>
        <TabsList>
          <TabsTrigger value="of">X% of Y</TabsTrigger>
          <TabsTrigger value="isWhat">X is what % of Y</TabsTrigger>
        </TabsList>

        <TabsContent value="of" className="space-y-4 mt-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="Percentage (%)">
              <Input
                value={percent}
                onChange={(e) => setPercent(e.target.value)}
                inputMode="decimal"
              />
            </Field>
            <Field label="Value (Y)">
              <Input
                value={value}
                onChange={(e) => setValue(e.target.value)}
                inputMode="decimal"
              />
            </Field>
          </div>
          <CopyableResult
            label={`${percent}% of ${value}`}
            value={formatNumber(ofResult)}
            accent="primary"
            copyText={formatNumber(ofResult)}
          />
          <Formula>
            result = (percent ÷ 100) × value = ({percent} ÷ 100) × {value} ={" "}
            {formatNumber(ofResult)}
          </Formula>
        </TabsContent>

        <TabsContent value="isWhat" className="space-y-4 mt-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="Part (X)">
              <Input
                value={part}
                onChange={(e) => setPart(e.target.value)}
                inputMode="decimal"
              />
            </Field>
            <Field label="Whole (Y)">
              <Input
                value={whole}
                onChange={(e) => setWhole(e.target.value)}
                inputMode="decimal"
              />
            </Field>
          </div>
          <CopyableResult
            label={`${part} is what percent of ${whole}`}
            value={`${formatNumber(isWhatPct)}%`}
            accent="primary"
            copyText={`${formatNumber(isWhatPct)}%`}
          />
          <Formula>
            percent = (part ÷ whole) × 100 = ({part} ÷ {whole}) × 100 ={" "}
            {formatNumber(isWhatPct)}%
          </Formula>
        </TabsContent>
      </Tabs>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* 2. Percentage increase                                              */
/* ------------------------------------------------------------------ */

function PercentageIncreaseCalc() {
  const [from, setFrom] = React.useState("200");
  const [to, setTo] = React.useState("250");

  const f = parseNumber(from);
  const t = parseNumber(to);
  const change = t - f;
  const denom = Math.abs(f);
  const pct = denom !== 0 ? (change / denom) * 100 : 0;
  const isIncrease = change >= 0;

  return (
    <div className="space-y-4">
      <div className="grid sm:grid-cols-2 gap-4">
        <Field label="From (original value)">
          <Input
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            inputMode="decimal"
          />
        </Field>
        <Field label="To (new value)">
          <Input
            value={to}
            onChange={(e) => setTo(e.target.value)}
            inputMode="decimal"
          />
        </Field>
      </div>
      <CopyableResult
        label={isIncrease ? "Percentage increase" : "Percentage decrease"}
        value={`${formatNumber(pct)}%`}
        accent={isIncrease ? "success" : "warning"}
        copyText={`${formatNumber(pct)}%`}
      />
      <div className="grid sm:grid-cols-2 gap-4">
        <ResultStat
          label="Absolute change"
          value={formatNumber(change)}
          sublabel="new − original"
        />
        <ResultStat
          label="New / original ratio"
          value={f !== 0 ? formatNumber(t / f) : "—"}
          sublabel="new ÷ original"
        />
      </div>
      <Formula>
        % change = ((new − original) ÷ |original|) × 100 = (({to} − {from}) ÷{" "}
        {formatNumber(denom)}) × 100 = {formatNumber(pct)}%
      </Formula>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* 3. Percentage decrease                                              */
/* ------------------------------------------------------------------ */

function PercentageDecreaseCalc() {
  const [from, setFrom] = React.useState("250");
  const [to, setTo] = React.useState("200");

  const f = parseNumber(from);
  const t = parseNumber(to);
  const decrease = f - t;
  const denom = Math.abs(f);
  const pct = denom !== 0 ? (decrease / denom) * 100 : 0;
  const isDecrease = decrease >= 0;

  return (
    <div className="space-y-4">
      <div className="grid sm:grid-cols-2 gap-4">
        <Field label="Original value">
          <Input
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            inputMode="decimal"
          />
        </Field>
        <Field label="New value">
          <Input
            value={to}
            onChange={(e) => setTo(e.target.value)}
            inputMode="decimal"
          />
        </Field>
      </div>
      <CopyableResult
        label={isDecrease ? "Percentage decrease" : "Percentage increase (negative decrease)"}
        value={`${formatNumber(pct)}%`}
        accent={isDecrease ? "warning" : "success"}
        copyText={`${formatNumber(pct)}%`}
      />
      <div className="grid sm:grid-cols-2 gap-4">
        <ResultStat
          label="Absolute decrease"
          value={formatNumber(decrease)}
          sublabel="original − new"
        />
        <ResultStat
          label="Remaining fraction of original"
          value={f !== 0 ? formatNumber(t / f) : "—"}
          sublabel="new ÷ original"
        />
      </div>
      <Formula>
        % decrease = ((original − new) ÷ |original|) × 100 = (({from} − {to}) ÷{" "}
        {formatNumber(denom)}) × 100 = {formatNumber(pct)}%
      </Formula>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* 4. Percentage difference                                            */
/* ------------------------------------------------------------------ */

function PercentageDifferenceCalc() {
  const [a, setA] = React.useState("50");
  const [b, setB] = React.useState("75");

  const an = parseNumber(a);
  const bn = parseNumber(b);
  const avg = (an + bn) / 2;
  const diff = Math.abs(an - bn);
  const pct = avg !== 0 ? (diff / Math.abs(avg)) * 100 : 0;

  return (
    <div className="space-y-4">
      <div className="grid sm:grid-cols-2 gap-4">
        <Field label="Value A">
          <Input
            value={a}
            onChange={(e) => setA(e.target.value)}
            inputMode="decimal"
          />
        </Field>
        <Field label="Value B">
          <Input
            value={b}
            onChange={(e) => setB(e.target.value)}
            inputMode="decimal"
          />
        </Field>
      </div>
      <CopyableResult
        label="Percentage difference between A and B"
        value={`${formatNumber(pct)}%`}
        accent="primary"
        copyText={`${formatNumber(pct)}%`}
      />
      <div className="grid sm:grid-cols-3 gap-4">
        <ResultStat label="Absolute difference" value={formatNumber(diff)} sublabel="|A − B|" />
        <ResultStat label="Average" value={formatNumber(avg)} sublabel="(A + B) ÷ 2" />
        <ResultStat
          label="Relative difference"
          value={`${formatNumber(pct)}%`}
          sublabel="diff ÷ avg × 100"
        />
      </div>
      <Formula>
        % difference = (|A − B| ÷ ((A + B) ÷ 2)) × 100 = (|{a} − {b}| ÷{" "}
        {formatNumber(avg)}) × 100 = {formatNumber(pct)}%
      </Formula>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* 5. Ratio                                                            */
/* ------------------------------------------------------------------ */

function RatioCalc() {
  const [a, setA] = React.useState("12");
  const [b, setB] = React.useState("18");
  const [c, setC] = React.useState("6");

  const an = Math.round(parseNumber(a));
  const bn = Math.round(parseNumber(b));
  const g = an === 0 && bn === 0 ? 0 : gcd(an, bn);
  const sa = g !== 0 ? an / g : an;
  const sb = g !== 0 ? bn / g : bn;

  const cn = parseNumber(c);
  const hasC = c.trim() !== "" && Number.isFinite(cn);
  const d = hasC && an !== 0 ? (bn * cn) / an : 0;

  return (
    <div className="space-y-4">
      <div className="grid sm:grid-cols-3 gap-4">
        <Field label="A">
          <Input value={a} onChange={(e) => setA(e.target.value)} inputMode="decimal" />
        </Field>
        <Field label="B">
          <Input value={b} onChange={(e) => setB(e.target.value)} inputMode="decimal" />
        </Field>
        <Field
          label="C (optional)"
          hint="Solve A:B = C:? — leave blank to skip"
        >
          <Input value={c} onChange={(e) => setC(e.target.value)} inputMode="decimal" />
        </Field>
      </div>
      <CopyableResult
        label="Simplified ratio A:B"
        value={`${sa} : ${sb}`}
        accent="primary"
        sublabel={`GCD(${an}, ${bn}) = ${g}`}
        copyText={`${sa} : ${sb}`}
      />
      {hasC && (
        <CopyableResult
          label={`If A:B = C:?, then D =`}
          value={formatNumber(d)}
          accent="success"
          sublabel={`${an}:${bn} = ${formatNumber(cn)}:${formatNumber(d)}`}
          copyText={formatNumber(d)}
        />
      )}
      <Formula>
        GCD(A, B) via Euclidean algorithm = {g}. Divide both by GCD:{" "}
        {an}:{bn} ÷ {g} = {sa}:{sb}
        {hasC && (
          <>
            . Solve A:B = C:D ⟹ D = (B × C) ÷ A = ({bn} × {formatNumber(cn)}) ÷{" "}
            {an} = {formatNumber(d)}
          </>
        )}
        .
      </Formula>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* 6. Average                                                          */
/* ------------------------------------------------------------------ */

function AverageCalc() {
  const [list, setList] = React.useState("10, 20, 30, 40, 50");

  const nums = React.useMemo(() => parseList(list), [list]);
  const count = nums.length;
  const sum = nums.reduce((a, b) => a + b, 0);
  const mean = count > 0 ? sum / count : 0;
  const min = count > 0 ? Math.min(...nums) : 0;
  const max = count > 0 ? Math.max(...nums) : 0;

  return (
    <div className="space-y-4">
      <Field label="Numbers (comma, space, or semicolon separated)">
        <Input
          value={list}
          onChange={(e) => setList(e.target.value)}
          placeholder="e.g. 10, 20, 30"
        />
      </Field>
      <CopyableResult
        label="Mean (average)"
        value={formatNumber(mean)}
        accent="primary"
        sublabel={`${count} value${count === 1 ? "" : "s"} parsed`}
        copyText={formatNumber(mean)}
      />
      <div className="grid sm:grid-cols-4 gap-4">
        <ResultStat label="Count" value={String(count)} />
        <ResultStat label="Sum" value={formatNumber(sum)} />
        <ResultStat label="Min" value={formatNumber(min)} />
        <ResultStat label="Max" value={formatNumber(max)} />
      </div>
      <Formula>
        mean = (sum of all values) ÷ (count) = (
        {nums.map(formatNumber).join(" + ") || "0"}) ÷ {count} ={" "}
        {formatNumber(mean)}
      </Formula>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* 7. Rounding                                                         */
/* ------------------------------------------------------------------ */

function RoundingCalc() {
  const [value, setValue] = React.useState("3.14159");
  const [places, setPlaces] = React.useState("2");

  const n = parseNumber(value);
  const p = Math.max(0, Math.min(20, Math.round(parseNumber(places))));
  const factor = Math.pow(10, p);
  const rounded = Math.round((n + Number.EPSILON) * factor) / factor;
  const roundedStr = rounded.toFixed(p);
  const nearest10 = Math.round(n / 10) * 10;
  const nearest100 = Math.round(n / 100) * 100;
  const nearest1000 = Math.round(n / 1000) * 1000;

  return (
    <div className="space-y-4">
      <div className="grid sm:grid-cols-2 gap-4">
        <Field label="Number">
          <Input
            value={value}
            onChange={(e) => setValue(e.target.value)}
            inputMode="decimal"
          />
        </Field>
        <Field label="Decimal places (0–20)">
          <Input
            value={places}
            onChange={(e) => setPlaces(e.target.value)}
            inputMode="decimal"
          />
        </Field>
      </div>
      <CopyableResult
        label={`Rounded to ${p} decimal place${p === 1 ? "" : "s"}`}
        value={roundedStr}
        accent="primary"
        copyText={roundedStr}
      />
      <div className="grid sm:grid-cols-3 gap-4">
        <ResultStat label="Nearest 10" value={formatNumber(nearest10)} />
        <ResultStat label="Nearest 100" value={formatNumber(nearest100)} />
        <ResultStat label="Nearest 1,000" value={formatNumber(nearest1000)} />
      </div>
      <Formula>
        Round to {p} dp: factor = 10^{p} = {formatNumber(factor)}. Rounded ={" "}
        Math.round({formatNumber(n)} × {formatNumber(factor)}) ÷{" "}
        {formatNumber(factor)} = {roundedStr}. Nearest 10/100/1000 use the same
        round-then-multiply logic.
      </Formula>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* 8. Square root & nth root                                           */
/* ------------------------------------------------------------------ */

function SqrtCalc() {
  const [value, setValue] = React.useState("72");
  const [rootN, setRootN] = React.useState("2");

  const n = parseNumber(value);
  const r = Math.max(2, Math.round(parseNumber(rootN)));
  const sqrtN = n >= 0 ? Math.sqrt(n) : NaN;
  const nthRoot = n >= 0 ? Math.pow(n, 1 / r) : NaN;

  const simplified = React.useMemo(() => {
    if (n < 0 || !Number.isFinite(n) || !Number.isInteger(n) || n === 0) {
      return null;
    }
    let coeff = 1;
    let rad = n;
    for (let i = 2; i * i <= rad; i++) {
      while (rad % (i * i) === 0) {
        coeff *= i;
        rad = rad / (i * i);
      }
    }
    return { coefficient: coeff, radicand: rad };
  }, [n]);

  const isPerfectSquare =
    simplified && simplified.radicand === 1 && n > 0;

  return (
    <div className="space-y-4">
      <div className="grid sm:grid-cols-2 gap-4">
        <Field label="Number (radicand)">
          <Input
            value={value}
            onChange={(e) => setValue(e.target.value)}
            inputMode="decimal"
          />
        </Field>
        <Field label="Root degree n (2 = square root)" hint="Use 2 for √, 3 for ∛, etc.">
          <Input
            value={rootN}
            onChange={(e) => setRootN(e.target.value)}
            inputMode="decimal"
          />
        </Field>
      </div>
      <CopyableResult
        label={r === 2 ? `√${value}` : `${r}√${value}`}
        value={formatNumber(r === 2 ? sqrtN : nthRoot)}
        accent="primary"
        copyText={formatNumber(r === 2 ? sqrtN : nthRoot)}
      />
      {r !== 2 && (
        <ResultStat
          label={`Square root of ${value} (√)`}
          value={formatNumber(sqrtN)}
        />
      )}
      {simplified && n > 0 && !isPerfectSquare && (
        <ResultStat
          label="Simplified radical"
          value={`${simplified.coefficient}√${simplified.radicand}`}
          sublabel={`${n} = ${simplified.coefficient}² × ${simplified.radicand}`}
        />
      )}
      {isPerfectSquare && (
        <ResultStat
          label="Perfect square"
          value={`${n} = ${simplified!.coefficient}²`}
          accent="success"
        />
      )}
      {n < 0 && (
        <ResultStat
          label="Note"
          value="Square root of a negative number is not real"
          accent="warning"
        />
      )}
      <Formula>
        √n = n^(1/2) = {formatNumber(sqrtN)}
        {r !== 2 && `; ${r}√n = n^(1/${r}) = ${formatNumber(nthRoot)}`}
        {simplified && !isPerfectSquare && n > 0 && (
          <>
            . Simplified: pull out perfect-square factors of {n} →{" "}
            {simplified.coefficient}² × {simplified.radicand} ={" "}
            {simplified.coefficient}√{simplified.radicand}
          </>
        )}
        .
      </Formula>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* 9. Exponent                                                         */
/* ------------------------------------------------------------------ */

function ExponentCalc() {
  const [base, setBase] = React.useState("2");
  const [exp, setExp] = React.useState("10");

  const b = parseNumber(base);
  const e = parseNumber(exp);
  const result = Math.pow(b, e);
  const isFinite = Number.isFinite(result);

  return (
    <div className="space-y-4">
      <div className="grid sm:grid-cols-2 gap-4">
        <Field label="Base">
          <Input
            value={base}
            onChange={(e) => setBase(e.target.value)}
            inputMode="decimal"
          />
        </Field>
        <Field label="Exponent">
          <Input
            value={exp}
            onChange={(e) => setExp(e.target.value)}
            inputMode="decimal"
          />
        </Field>
      </div>
      <CopyableResult
        label={`${base} ^ ${exp}`}
        value={isFinite ? formatNumber(result) : "Overflow"}
        accent="primary"
        copyText={isFinite ? formatNumber(result) : "Overflow"}
      />
      <div className="grid sm:grid-cols-2 gap-4">
        <ResultStat
          label="Base × exponent (for reference)"
          value={formatNumber(b * e)}
        />
        <ResultStat
          label="Reciprocal (base^−exp)"
          value={b !== 0 ? formatNumber(Math.pow(b, -e)) : "—"}
        />
      </div>
      <Formula>
        result = base^exponent = {base}^{exp} = {isFinite ? formatNumber(result) : "∞ (overflow)"}
        . Defined as repeated multiplication when the exponent is a positive
        integer, and via exp(e × ln(base)) in general.
      </Formula>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* 10. Scientific notation                                             */
/* ------------------------------------------------------------------ */

function ScientificNotationCalc() {
  const [value, setValue] = React.useState("123456.789");

  const n = parseNumber(value);

  const scientific = React.useMemo(() => {
    if (n === 0 || !Number.isFinite(n)) return { mantissa: 0, exp: 0, str: "0 × 10^0" };
    const exp = Math.floor(Math.log10(Math.abs(n)));
    const mantissa = n / Math.pow(10, exp);
    return { mantissa, exp, str: `${formatNumber(mantissa)} × 10^${exp}` };
  }, [n]);

  const eNotation = React.useMemo(() => {
    if (!Number.isFinite(n)) return "—";
    if (n === 0) return "0e0";
    const sign = scientific.exp >= 0 ? "+" : "";
    return `${formatNumber(scientific.mantissa)}e${sign}${scientific.exp}`;
  }, [n, scientific]);

  const engineering = React.useMemo(() => {
    if (n === 0 || !Number.isFinite(n)) return { mantissa: 0, exp: 0, str: "0 × 10^0" };
    let exp = Math.floor(Math.log10(Math.abs(n)));
    exp = Math.floor(exp / 3) * 3;
    const mantissa = n / Math.pow(10, exp);
    return { mantissa, exp, str: `${formatNumber(mantissa)} × 10^${exp}` };
  }, [n]);

  return (
    <div className="space-y-4">
      <Field label="Number">
        <Input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          inputMode="decimal"
        />
      </Field>
      <CopyableResult
        label="Scientific notation (a × 10^b, 1 ≤ |a| < 10)"
        value={scientific.str}
        accent="primary"
        copyText={scientific.str}
      />
      <div className="grid sm:grid-cols-2 gap-4">
        <ResultStat
          label="E-notation (programming)"
          value={eNotation}
          sublabel="same as scientific, with 'e' instead of × 10^"
        />
        <ResultStat
          label="Engineering notation"
          value={engineering.str}
          sublabel="exponent is a multiple of 3"
        />
      </div>
      <Formula>
        Scientific: a × 10^b where b = floor(log₁₀|n|) and a = n / 10^b (so 1 ≤
        |a| &lt; 10). Here {value} = {scientific.str}. Engineering uses the same
        formula but b is rounded down to the nearest multiple of 3, giving{" "}
        {engineering.str}. E-notation writes a × 10^b as `ae±b`: {eNotation}.
      </Formula>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* 11. GCD & LCM                                                       */
/* ------------------------------------------------------------------ */

function GcdLcmCalc() {
  const [list, setList] = React.useState("12, 18, 24");

  const nums = React.useMemo(
    () =>
      parseList(list)
        .map((n) => Math.abs(Math.round(n)))
        .filter((n) => n > 0),
    [list]
  );

  const gcdAll = nums.length > 0 ? nums.reduce((a, b) => gcd(a, b)) : 0;
  const lcmAll = nums.length > 0 ? nums.reduce((a, b) => lcm(a, b)) : 0;

  return (
    <div className="space-y-4">
      <Field label="Positive integers (comma, space, or semicolon separated)">
        <Input
          value={list}
          onChange={(e) => setList(e.target.value)}
          inputMode="decimal"
          placeholder="e.g. 12, 18, 24"
        />
      </Field>
      <div className="grid sm:grid-cols-2 gap-4">
        <CopyableResult
          label="GCD (greatest common divisor)"
          value={String(gcdAll)}
          accent="primary"
          sublabel={nums.length > 0 ? `gcd(${nums.join(", ")})` : "no input"}
          copyText={String(gcdAll)}
        />
        <CopyableResult
          label="LCM (least common multiple)"
          value={String(lcmAll)}
          accent="primary"
          sublabel={nums.length > 0 ? `lcm(${nums.join(", ")})` : "no input"}
          copyText={String(lcmAll)}
        />
      </div>
      <Formula>
        Euclidean algorithm for GCD(a, b): repeatedly replace (a, b) with (b, a
        mod b) until b = 0; then a is the GCD. For a list, fold left: gcd(a, b,
        c) = gcd(gcd(a, b), c). LCM(a, b) = |a × b| ÷ GCD(a, b); for a list, fold
        the same way. Inputs: [{nums.join(", ") || "—"}].
      </Formula>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* 12. Prime check & factorization                                     */
/* ------------------------------------------------------------------ */

function PrimeCalc() {
  const [value, setValue] = React.useState("84");

  const raw = parseNumber(value);
  const n = Math.round(raw);

  const factors = React.useMemo(() => primeFactors(Math.abs(n)), [n]);
  const isPrime = n >= 2 && factors.length === 1 && factors[0] === n;
  const factorizationStr = formatFactorization(factors);

  const verdict =
    n < 2
      ? { label: "Not prime (n < 2)", value: "No", accent: "default" as const }
      : isPrime
      ? { label: "Prime number", value: "Yes", accent: "success" as const }
      : { label: "Composite number", value: "No", accent: "warning" as const };

  return (
    <div className="space-y-4">
      <Field label="Number (positive integer)" hint="Decimals are rounded to the nearest integer">
        <Input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          inputMode="decimal"
        />
      </Field>
      <CopyableResult
        label={verdict.label}
        value={verdict.value}
        accent={verdict.accent}
        copyText={verdict.value}
      />
      {n >= 2 && !isPrime && (
        <CopyableResult
          label="Prime factorization"
          value={factorizationStr || "—"}
          sublabel={`Prime factors: ${factors.join(" × ")}`}
          accent="primary"
          copyText={factorizationStr}
        />
      )}
      {n >= 2 && isPrime && (
        <ResultStat
          label="Divisors"
          value={`1, ${n}`}
          sublabel="A prime has exactly two positive divisors"
        />
      )}
      <Formula>
        {n < 2 ? (
          <>By definition, integers less than 2 are neither prime nor composite.</>
        ) : isPrime ? (
          <>
            Trial division up to √{n} (≈ {formatNumber(Math.sqrt(n))}) finds no
            divisors, so {n} is prime.
          </>
        ) : (
          <>
            {n} = {factorizationStr}. Found by trial division: divide out 2
            while even, then test odd candidates i = 3, 5, 7, … up to √n.
          </>
        )}
      </Formula>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Scientific calculators (scientific, quadratic, logarithm, trig, factorial, perm/comb, std-dev) */
/* ------------------------------------------------------------------ */

function ScientificCalc() {
  const [expr, setExpr] = React.useState("sin(45) + log(100) + sqrt(16)");
  const [angle, setAngle] = React.useState<"deg" | "rad">("deg");
  const r = evaluate(expr, angle);
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Button variant={angle === "deg" ? "default" : "outline"} size="sm" onClick={() => setAngle("deg")}>Degrees</Button>
        <Button variant={angle === "rad" ? "default" : "outline"} size="sm" onClick={() => setAngle("rad")}>Radians</Button>
      </div>
      <Field label="Expression">
        <Input value={expr} onChange={e => setExpr(e.target.value)} className="font-mono text-lg" />
      </Field>
      <ResultStat label="Result" value={r.ok ? formatNumber(r.value) : (r.error || "Error")} accent="primary" />
      <div className="flex flex-wrap gap-2 text-xs">
        {["sin(", "cos(", "tan(", "log(", "ln(", "sqrt(", "pi", "e", "^", "abs("].map(s => (
          <button key={s} onClick={() => setExpr(p => p + s)} className="px-2 py-1 rounded border border-border bg-card hover:bg-accent font-mono">{s}</button>
        ))}
      </div>
      <Formula>Supports: sin, cos, tan, asin, acos, atan, log (base 10), ln (base e), sqrt, abs, exp, fact, pi, e, ^, %, parentheses. Angle mode applies to trig functions.</Formula>
    </div>
  );
}

function QuadraticCalc() {
  const [a, setA] = React.useState("1");
  const [b, setB] = React.useState("-5");
  const [c, setC] = React.useState("6");
  const A = parseNumber(a), B = parseNumber(b), C = parseNumber(c);
  const disc = B * B - 4 * A * C;
  let roots: string;
  if (A === 0) roots = "Not quadratic (a = 0)";
  else if (disc > 0) {
    const r1 = (-B + Math.sqrt(disc)) / (2 * A);
    const r2 = (-B - Math.sqrt(disc)) / (2 * A);
    roots = `x₁ = ${formatNumber(r1)}, x₂ = ${formatNumber(r2)}`;
  } else if (disc === 0) {
    const r = -B / (2 * A);
    roots = `x = ${formatNumber(r)} (double root)`;
  } else {
    const real = -B / (2 * A);
    const imag = Math.sqrt(-disc) / (2 * A);
    roots = `x = ${formatNumber(real)} ± ${formatNumber(imag)}i (complex)`;
  }
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-3">
        <Field label="a"><Input value={a} onChange={e => setA(e.target.value)} inputMode="decimal" /></Field>
        <Field label="b"><Input value={b} onChange={e => setB(e.target.value)} inputMode="decimal" /></Field>
        <Field label="c"><Input value={c} onChange={e => setC(e.target.value)} inputMode="decimal" /></Field>
      </div>
      <div className="rounded-xl bg-muted/30 p-3 text-center font-mono text-sm">
        {formatNumber(A)}x² + {formatNumber(B)}x + {formatNumber(C)} = 0
      </div>
      <ResultStat label="Discriminant" value={formatNumber(disc)} accent={disc > 0 ? "success" : disc < 0 ? "warning" : "default"} />
      <ResultStat label="Roots" value={roots} accent="primary" />
      <Formula>x = (−b ± √(b² − 4ac)) / (2a). Discriminant Δ = b² − 4ac. Δ &gt; 0 → two real roots; Δ = 0 → one real root; Δ &lt; 0 → two complex roots.</Formula>
    </div>
  );
}

function LogarithmCalc() {
  const [x, setX] = React.useState("1000");
  const [base, setBase] = React.useState("10");
  const X = parseNumber(x);
  const B = parseNumber(base);
  const ln = Math.log(X);
  const log10 = Math.log10(X);
  const log2 = Math.log2(X);
  const logBase = B > 0 && B !== 1 && X > 0 ? Math.log(X) / Math.log(B) : NaN;
  return (
    <div className="space-y-4">
      <div className="grid sm:grid-cols-2 gap-4">
        <Field label="Value (x)"><Input value={x} onChange={e => setX(e.target.value)} inputMode="decimal" /></Field>
        <Field label="Custom base (b)"><Input value={base} onChange={e => setBase(e.target.value)} inputMode="decimal" /></Field>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <ResultStat label="ln(x)" value={X > 0 ? formatNumber(ln) : "—"} />
        <ResultStat label="log₁₀(x)" value={X > 0 ? formatNumber(log10) : "—"} />
        <ResultStat label="log₂(x)" value={X > 0 ? formatNumber(log2) : "—"} />
        <ResultStat label={`log_${base}(x)`} value={!isNaN(logBase) ? formatNumber(logBase) : "—"} accent="primary" />
      </div>
      <Formula>log_b(x) = ln(x) / ln(b). Defined for x &gt; 0 and b &gt; 0, b ≠ 1.</Formula>
    </div>
  );
}

function TrigonometryCalc() {
  const [angle, setAngle] = React.useState("45");
  const [mode, setMode] = React.useState<"deg" | "rad">("deg");
  const a = parseNumber(angle);
  const rad = mode === "deg" ? a * Math.PI / 180 : a;
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Button variant={mode === "deg" ? "default" : "outline"} size="sm" onClick={() => setMode("deg")}>Degrees</Button>
        <Button variant={mode === "rad" ? "default" : "outline"} size="sm" onClick={() => setMode("rad")}>Radians</Button>
      </div>
      <Field label={`Angle (${mode})`}>
        <Input value={angle} onChange={e => setAngle(e.target.value)} inputMode="decimal" />
      </Field>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <ResultStat label="sin" value={formatNumber(Math.sin(rad))} />
        <ResultStat label="cos" value={formatNumber(Math.cos(rad))} />
        <ResultStat label="tan" value={formatNumber(Math.tan(rad))} />
        <ResultStat label="csc (1/sin)" value={formatNumber(1 / Math.sin(rad))} />
        <ResultStat label="sec (1/cos)" value={formatNumber(1 / Math.cos(rad))} />
        <ResultStat label="cot (1/tan)" value={formatNumber(1 / Math.tan(rad))} />
      </div>
      <Formula>sin(θ), cos(θ), tan(θ) = opp/hyp, adj/hyp, opp/adj. Reciprocals: csc, sec, cot. In degree mode, the angle is converted to radians before evaluating.</Formula>
    </div>
  );
}

function FactorialCalc() {
  const [n, setN] = React.useState("10");
  const N = Math.floor(parseNumber(n));
  let fact = 1;
  let overflow = false;
  if (N < 0) fact = NaN;
  else if (N > 170) overflow = true;
  else for (let i = 2; i <= N; i++) fact *= i;
  return (
    <div className="space-y-4">
      <Field label="n (non-negative integer)">
        <Input value={n} onChange={e => setN(e.target.value)} inputMode="numeric" />
      </Field>
      <ResultStat label={`${N}!`} value={overflow ? "Overflow (> 170!)" : (N < 0 ? "Undefined for negatives" : formatNumber(fact))} accent="primary" />
      <Formula>n! = n × (n−1) × (n−2) × … × 2 × 1. By convention, 0! = 1. For n &gt; 170 the result overflows double precision.</Formula>
    </div>
  );
}

function PermCombCalc() {
  const [n, setN] = React.useState("10");
  const [r, setR] = React.useState("3");
  const N = Math.floor(parseNumber(n));
  const R = Math.floor(parseNumber(r));
  let perm = NaN, comb = NaN;
  if (N >= 0 && R >= 0 && R <= N) {
    perm = 1; comb = 1;
    for (let i = 0; i < R; i++) { perm *= (N - i); comb *= (N - i); comb /= (i + 1); }
  }
  return (
    <div className="space-y-4">
      <div className="grid sm:grid-cols-2 gap-4">
        <Field label="n (total items)"><Input value={n} onChange={e => setN(e.target.value)} inputMode="numeric" /></Field>
        <Field label="r (chosen)"><Input value={r} onChange={e => setR(e.target.value)} inputMode="numeric" /></Field>
      </div>
      <div className="grid sm:grid-cols-2 gap-3">
        <ResultStat label={`nPr = ${N}P${R}`} value={isNaN(perm) ? "Invalid (need 0 ≤ r ≤ n)" : formatNumber(perm)} accent="primary" />
        <ResultStat label={`nCr = ${N}C${R}`} value={isNaN(comb) ? "Invalid (need 0 ≤ r ≤ n)" : formatNumber(comb)} accent="primary" />
      </div>
      <Formula>nPr = n! / (n−r)! — number of ordered arrangements. nCr = n! / (r!(n−r)!) — number of unordered selections.</Formula>
    </div>
  );
}

function StdDevCalc() {
  const [input, setInput] = React.useState("12, 15, 14, 19, 22, 18, 14, 15, 17, 20");
  const nums = input.split(/[\s,;]+/).filter(Boolean).map(s => parseFloat(s)).filter(n => !isNaN(n));
  const n = nums.length;
  const mean = n ? nums.reduce((a, b) => a + b, 0) / n : 0;
  const varPop = n ? nums.reduce((a, b) => a + (b - mean) ** 2, 0) / n : 0;
  const varSamp = n > 1 ? nums.reduce((a, b) => a + (b - mean) ** 2, 0) / (n - 1) : 0;
  return (
    <div className="space-y-4">
      <Field label="Data set (comma or space separated)">
        <Input value={input} onChange={e => setInput(e.target.value)} className="font-mono" />
      </Field>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <ResultStat label="Count" value={String(n)} />
        <ResultStat label="Mean" value={n ? formatNumber(mean) : "—"} />
        <ResultStat label="σ (population)" value={n ? formatNumber(Math.sqrt(varPop)) : "—"} accent="primary" />
        <ResultStat label="s (sample)" value={n > 1 ? formatNumber(Math.sqrt(varSamp)) : "—"} accent="primary" />
        <ResultStat label="σ² (population)" value={n ? formatNumber(varPop) : "—"} />
        <ResultStat label="s² (sample)" value={n > 1 ? formatNumber(varSamp) : "—"} />
      </div>
      <Formula>Population variance: σ² = Σ(xᵢ − x̄)² / n. Sample variance: s² = Σ(xᵢ − x̄)² / (n − 1). Standard deviation = √variance. Use population when you have all data; sample when you have a subset.</Formula>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Percentage Change (combined increase/decrease)                       */
/* ------------------------------------------------------------------ */

function PercentageChangeCalc() {
  const [from, setFrom] = React.useState("200");
  const [to, setTo] = React.useState("250");
  const f = parseNumber(from);
  const t = parseNumber(to);
  const change = t - f;
  const pct = f !== 0 ? (change / Math.abs(f)) * 100 : 0;
  const isIncrease = change >= 0;
  return (
    <div className="space-y-4">
      <div className="grid sm:grid-cols-2 gap-4">
        <Field label="From value (original)"><Input value={from} onChange={e => setFrom(e.target.value)} inputMode="decimal" /></Field>
        <Field label="To value (new)"><Input value={to} onChange={e => setTo(e.target.value)} inputMode="decimal" /></Field>
      </div>
      <ResultStat
        label={isIncrease ? "Percentage increase" : "Percentage decrease"}
        value={`${isIncrease ? "+" : ""}${formatNumber(pct)}%`}
        accent={isIncrease ? "success" : "warning"}
      />
      <div className="grid grid-cols-2 gap-3">
        <ResultStat label="Absolute change" value={formatNumber(change)} />
        <ResultStat label="Ratio" value={f !== 0 ? `${formatNumber(t / f)}×` : "—"} />
      </div>
      <Formula>Percentage change = ((new − original) ÷ |original|) × 100 = (({t} − {f}) ÷ |{f}|) × 100 = {formatNumber(pct)}%</Formula>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Main switcher                                                       */
/* ------------------------------------------------------------------ */

export function PercentageCalcs({ calcId }: { calcId: string }) {
  switch (calcId) {
    case "percentage":
      return <PercentageCalc />;
    case "percentage-increase":
      return <PercentageIncreaseCalc />;
    case "percentage-decrease":
      return <PercentageDecreaseCalc />;
    case "percentage-difference":
      return <PercentageDifferenceCalc />;
    case "percentage-change":
      return <PercentageChangeCalc />;
    case "ratio":
      return <RatioCalc />;
    case "average":
      return <AverageCalc />;
    case "rounding":
      return <RoundingCalc />;
    case "sqrt":
      return <SqrtCalc />;
    case "exponent":
      return <ExponentCalc />;
    case "scientific-notation":
      return <ScientificNotationCalc />;
    case "gcd-lcm":
      return <GcdLcmCalc />;
    case "prime":
      return <PrimeCalc />;
    case "scientific":
      return <ScientificCalc />;
    case "quadratic":
      return <QuadraticCalc />;
    case "logarithm":
      return <LogarithmCalc />;
    case "trigonometry":
      return <TrigonometryCalc />;
    case "factorial":
      return <FactorialCalc />;
    case "permutation-combination":
      return <PermCombCalc />;
    case "std-dev-variance":
      return <StdDevCalc />;
    default:
      return null;
  }
}

/** Alias — handles the same set of math calcIds. */
export const BasicMathCalcs = PercentageCalcs;

/** Alias — handles the same set of math calcIds. */
export const ScientificCalcs = PercentageCalcs;
