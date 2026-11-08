"use client";

import * as React from "react";
import { Field, ResultStat } from "@/components/calc-page-shell";
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
import { parseNumber, formatNumber } from "@/lib/math-engine";
import { toast } from "sonner";
import { Copy } from "lucide-react";

/* ------------------------------------------------------------------ */
/* Conversion constants                                                */
/* ------------------------------------------------------------------ */

const M_PER_FT = 0.3048;
const M_PER_IN = 0.0254;
const FT2_PER_M2 = 10.76391041671;
const FT3_PER_M3 = 35.31466672149;
const FT_PER_M = 3.28083989501;
const YD3_PER_M3 = 1.3079506193144;
const L_PER_GAL = 3.785411784;

const CURRENCIES = [
  "USD", "EUR", "GBP", "INR", "BDT", "AUD", "CAD", "SGD", "JPY", "CNY",
] as const;

/* ------------------------------------------------------------------ */
/* Shared helpers                                                      */
/* ------------------------------------------------------------------ */

function FormulaBox({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-xl bg-muted/30 border border-border p-4 text-sm text-muted-foreground leading-relaxed">
      <strong className="text-foreground">Formula:</strong> {children}
    </div>
  );
}

function UnitToggle({
  value,
  onChange,
}: {
  value: "metric" | "imperial";
  onChange: (v: "metric" | "imperial") => void;
}) {
  return (
    <div className="inline-flex rounded-lg border border-border bg-card p-0.5">
      {(["metric", "imperial"] as const).map((opt) => (
        <button
          key={opt}
          type="button"
          onClick={() => onChange(opt)}
          className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors capitalize ${
            value === opt
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          {opt}
        </button>
      ))}
    </div>
  );
}

/** A ResultStat card with a copy-to-clipboard button in the top-right. */
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
  const text =
    copyText ?? (typeof value === "string" ? value : String(value ?? ""));
  return (
    <div className="relative">
      <ResultStat
        label={label}
        value={value}
        sublabel={sublabel}
        accent={accent}
      />
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

function formatMoney(n: number, currency = "USD"): string {
  if (!Number.isFinite(n)) return "—";
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
      maximumFractionDigits: 2,
    }).format(n);
  } catch {
    return `${currency} ${formatNumber(n)}`;
  }
}

function CurrencySelect({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
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

/** A numeric Input paired with a compact unit Select on the right. */
function UnitInput({
  value,
  onChange,
  unit,
  onUnitChange,
  options,
}: {
  value: string;
  onChange: (v: string) => void;
  unit: string;
  onUnitChange: (v: string) => void;
  options: string[];
}) {
  return (
    <div className="flex gap-2">
      <Input
        type="number"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="font-mono"
      />
      <Select value={unit} onValueChange={onUnitChange}>
        <SelectTrigger className="w-20">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {options.map((o) => (
            <SelectItem key={o} value={o}>
              {o}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

/* ============================================================
 * 1. Concrete Calculator
 *    Volume = L × W × D. Yields: 40 kg bag ≈ 0.015 m³,
 *    bulk premix bag ≈ 0.6 m³.
 * ============================================================ */
function ConcreteCalc() {
  const [system, setSystem] = React.useState<"metric" | "imperial">("metric");
  // metric
  const [lenUnit, setLenUnit] = React.useState<"m" | "cm">("m");
  const [widUnit, setWidUnit] = React.useState<"m" | "cm">("m");
  const [depUnit, setDepUnit] = React.useState<"m" | "cm">("cm");
  const [mLen, setMLen] = React.useState("5");
  const [mWid, setMWid] = React.useState("4");
  const [mDep, setMDep] = React.useState("10");
  // imperial
  const [iLen, setILen] = React.useState("16");
  const [iWid, setIWid] = React.useState("13");
  const [iDep, setIDep] = React.useState("4");

  const r = React.useMemo(() => {
    let L = 0;
    let W = 0;
    let D = 0;
    if (system === "metric") {
      L = parseNumber(mLen) * (lenUnit === "m" ? 1 : 0.01);
      W = parseNumber(mWid) * (widUnit === "m" ? 1 : 0.01);
      D = parseNumber(mDep) * (depUnit === "m" ? 1 : 0.01);
    } else {
      L = parseNumber(iLen) * M_PER_FT;
      W = parseNumber(iWid) * M_PER_FT;
      D = parseNumber(iDep) * M_PER_IN;
    }
    const volM3 = L * W * D;
    return {
      L,
      W,
      D,
      volM3,
      volYd3: volM3 * YD3_PER_M3,
      volFt3: volM3 * FT3_PER_M3,
      bags40kg: volM3 / 0.015,
      bagsPremix: volM3 / 0.6,
    };
  }, [
    system, mLen, mWid, mDep, lenUnit, widUnit, depUnit,
    iLen, iWid, iDep,
  ]);

  const dimLabel =
    system === "metric"
      ? `${formatNumber(r.L, 2)} m × ${formatNumber(r.W, 2)} m × ${formatNumber(r.D, 2)} m`
      : `${formatNumber(r.L / M_PER_FT, 1)} ft × ${formatNumber(r.W / M_PER_FT, 1)} ft × ${formatNumber(r.D / M_PER_IN, 1)} in`;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <Label className="text-sm font-medium">Measurement system</Label>
        <UnitToggle value={system} onChange={setSystem} />
      </div>

      {system === "metric" ? (
        <div className="grid sm:grid-cols-3 gap-4">
          <Field label="Length">
            <UnitInput value={mLen} onChange={setMLen} unit={lenUnit} onUnitChange={(v) => setLenUnit(v as "m" | "cm")} options={["m", "cm"]} />
          </Field>
          <Field label="Width">
            <UnitInput value={mWid} onChange={setMWid} unit={widUnit} onUnitChange={(v) => setWidUnit(v as "m" | "cm")} options={["m", "cm"]} />
          </Field>
          <Field label="Depth">
            <UnitInput value={mDep} onChange={setMDep} unit={depUnit} onUnitChange={(v) => setDepUnit(v as "m" | "cm")} options={["m", "cm"]} />
          </Field>
        </div>
      ) : (
        <div className="grid sm:grid-cols-3 gap-4">
          <Field label="Length (ft)">
            <Input type="number" value={iLen} onChange={(e) => setILen(e.target.value)} className="font-mono" />
          </Field>
          <Field label="Width (ft)">
            <Input type="number" value={iWid} onChange={(e) => setIWid(e.target.value)} className="font-mono" />
          </Field>
          <Field label="Depth (in)">
            <Input type="number" value={iDep} onChange={(e) => setIDep(e.target.value)} className="font-mono" />
          </Field>
        </div>
      )}

      <CopyableResult
        label="Concrete volume"
        value={`${formatNumber(r.volM3, 3)} m³`}
        sublabel={`${formatNumber(r.volYd3, 3)} yd³ · ${formatNumber(r.volFt3, 2)} ft³ · ${dimLabel}`}
        accent="primary"
        copyText={`${formatNumber(r.volM3, 3)} m^3 / ${formatNumber(r.volYd3, 3)} yd^3`}
      />

      <div className="grid sm:grid-cols-2 gap-4">
        <ResultStat
          label="40 kg premix bags"
          value={
            Number.isFinite(r.bags40kg) && r.bags40kg > 0
              ? Math.ceil(r.bags40kg).toString()
              : "0"
          }
          sublabel="Yield ≈ 0.015 m³ per bag (mixed)"
        />
        <ResultStat
          label="Bulk premix bags"
          value={
            Number.isFinite(r.bagsPremix) && r.bagsPremix > 0
              ? Math.ceil(r.bagsPremix).toString()
              : "0"
          }
          sublabel="Yield ≈ 0.6 m³ per bag (mixed)"
        />
      </div>

      <FormulaBox>
        Volume = length × width × depth (all converted to meters). 1 m³ = 1.308 yd³ = 35.315 ft³.
        Bag counts assume a typical 40 kg premix bag yields about 0.015 m³ of mixed concrete,
        while a bulk premix bag yields about 0.6 m³. Round up and add 5–10 % extra for spillage.
      </FormulaBox>
    </div>
  );
}

/* ============================================================
 * 2. Paint Calculator
 *    Wall area = perimeter × height. Paintable = wall × (1 − openings%).
 *    Paint (L) = paintable ÷ 10 × coats. Gallons = L ÷ 3.785.
 * ============================================================ */
function PaintCalc() {
  const [system, setSystem] = React.useState<"metric" | "imperial">("metric");
  const [length, setLength] = React.useState("6");
  const [width, setWidth] = React.useState("4");
  const [height, setHeight] = React.useState("2.5");
  const [opening, setOpening] = React.useState("10");
  const [coats, setCoats] = React.useState<"1" | "2">("2");

  const r = React.useMemo(() => {
    const toM = system === "metric" ? 1 : M_PER_FT;
    const L = parseNumber(length) * toM;
    const W = parseNumber(width) * toM;
    const H = parseNumber(height) * toM;
    const perimeter = 2 * (L + W);
    const wallArea = perimeter * H;
    const openingPct =
      Math.max(0, Math.min(100, parseNumber(opening))) / 100;
    const paintable = wallArea * (1 - openingPct);
    const paintableFt2 = paintable * FT2_PER_M2;
    const coveragePerL = 10; // m² per liter per coat
    const liters = (paintable / coveragePerL) * Number(coats);
    const gallons = liters / L_PER_GAL;
    return {
      L, W, H, perimeter, wallArea, paintable, paintableFt2, liters, gallons,
    };
  }, [system, length, width, height, opening, coats]);

  const u = system === "metric" ? "m" : "ft";

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <Label className="text-sm font-medium">Measurement system</Label>
        <UnitToggle value={system} onChange={setSystem} />
      </div>

      <div className="grid sm:grid-cols-3 gap-4">
        <Field label={`Room length (${u})`}>
          <Input
            type="number"
            value={length}
            onChange={(e) => setLength(e.target.value)}
            className="font-mono"
          />
        </Field>
        <Field label={`Room width (${u})`}>
          <Input
            type="number"
            value={width}
            onChange={(e) => setWidth(e.target.value)}
            className="font-mono"
          />
        </Field>
        <Field label={`Wall height (${u})`}>
          <Input
            type="number"
            value={height}
            onChange={(e) => setHeight(e.target.value)}
            className="font-mono"
          />
        </Field>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <Field label="Openings reduction (%)" hint="Doors & windows deduction">
          <Input
            type="number"
            value={opening}
            onChange={(e) => setOpening(e.target.value)}
            className="font-mono"
          />
        </Field>
        <Field label="Coats">
          <Select value={coats} onValueChange={(v) => setCoats(v as "1" | "2")}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1">1 coat</SelectItem>
              <SelectItem value="2">2 coats</SelectItem>
            </SelectContent>
          </Select>
        </Field>
      </div>

      <CopyableResult
        label="Paintable wall area"
        value={`${formatNumber(r.paintable, 2)} m²`}
        sublabel={`${formatNumber(r.paintableFt2, 2)} ft² · ${formatNumber(r.wallArea, 2)} m² before openings`}
        accent="primary"
        copyText={`${formatNumber(r.paintable, 2)} m^2 / ${formatNumber(r.paintableFt2, 2)} ft^2`}
      />

      <div className="grid sm:grid-cols-2 gap-4">
        <ResultStat
          label="Paint needed (liters)"
          value={`${formatNumber(r.liters, 2)} L`}
          sublabel={`Coverage ≈ 10 m²/L per coat · ${coats} coat(s)`}
        />
        <ResultStat
          label="Paint needed (gallons)"
          value={`${formatNumber(r.gallons, 2)} gal`}
          sublabel="1 gal ≈ 3.785 L"
        />
      </div>

      <FormulaBox>
        Wall area = 2 × (length + width) × height. Paintable area = wall area × (1 − openings%).
        Paint (L) = paintable area ÷ 10 × coats. Gallons = liters ÷ 3.785. Assumes ~10 m²/L
        coverage per coat, typical of standard interior wall paint.
      </FormulaBox>
    </div>
  );
}

/* ============================================================
 * 3. Flooring Calculator
 *    Planks (rows) = ceil(W ÷ pw × (1 + waste%)).
 *    Linear = rows × L (each plank spans the full length).
 * ============================================================ */
function FlooringCalc() {
  const [system, setSystem] = React.useState<"metric" | "imperial">("metric");
  const [length, setLength] = React.useState("5");
  const [width, setWidth] = React.useState("4");
  const [plankWidth, setPlankWidth] = React.useState("15");
  const [waste, setWaste] = React.useState("10");

  const r = React.useMemo(() => {
    const toM = system === "metric" ? 1 : M_PER_FT;
    const L = parseNumber(length) * toM;
    const W = parseNumber(width) * toM;
    // Plank width is entered in cm (metric) or in (imperial).
    const pwM =
      system === "metric"
        ? parseNumber(plankWidth) * 0.01
        : parseNumber(plankWidth) * M_PER_IN;
    const area = L * W;
    const areaFt2 = area * FT2_PER_M2;
    const wastePct = Math.max(0, parseNumber(waste)) / 100;
    const rowsRaw = pwM > 0 ? W / pwM : 0;
    const numRows = pwM > 0 ? Math.ceil(rowsRaw * (1 + wastePct)) : 0;
    const linearM = numRows * L;
    const linearFt = linearM * FT_PER_M;
    return { L, W, pwM, area, areaFt2, numRows, linearM, linearFt };
  }, [system, length, width, plankWidth, waste]);

  const u = system === "metric" ? "m" : "ft";
  const pwU = system === "metric" ? "cm" : "in";

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <Label className="text-sm font-medium">Measurement system</Label>
        <UnitToggle value={system} onChange={setSystem} />
      </div>

      <div className="grid sm:grid-cols-3 gap-4">
        <Field label={`Room length (${u})`}>
          <Input
            type="number"
            value={length}
            onChange={(e) => setLength(e.target.value)}
            className="font-mono"
          />
        </Field>
        <Field label={`Room width (${u})`}>
          <Input
            type="number"
            value={width}
            onChange={(e) => setWidth(e.target.value)}
            className="font-mono"
          />
        </Field>
        <Field label={`Plank width (${pwU})`}>
          <Input
            type="number"
            value={plankWidth}
            onChange={(e) => setPlankWidth(e.target.value)}
            className="font-mono"
          />
        </Field>
      </div>

      <Field label="Waste allowance (%)" hint="Cuts, offcuts, defects — 10% is typical">
        <Input
          type="number"
          value={waste}
          onChange={(e) => setWaste(e.target.value)}
          className="font-mono"
        />
      </Field>

      <CopyableResult
        label="Planks needed"
        value={Number.isFinite(r.numRows) ? `${r.numRows} planks` : "—"}
        sublabel={`Total linear: ${formatNumber(r.linearM, 2)} m / ${formatNumber(r.linearFt, 2)} ft`}
        accent="primary"
        copyText={`${r.numRows} planks · ${formatNumber(r.linearM, 2)} m`}
      />

      <div className="grid sm:grid-cols-2 gap-4">
        <ResultStat
          label="Room area"
          value={`${formatNumber(r.area, 2)} m²`}
          sublabel={`${formatNumber(r.areaFt2, 2)} ft²`}
        />
        <ResultStat
          label="Total linear length"
          value={`${formatNumber(r.linearM, 2)} m`}
          sublabel={`${formatNumber(r.linearFt, 2)} ft of planks`}
        />
      </div>

      <FormulaBox>
        Room area = length × width. Planks (rows) = ceil(room width ÷ plank width × (1 + waste%)).
        Each plank is assumed to span the full room length, so total linear length = planks × length.
        Adjust the waste allowance for diagonal layouts or pattern matching.
      </FormulaBox>
    </div>
  );
}

/* ============================================================
 * 4. Ohm's Law Calculator
 *    V = I × R · P = V × I = I² × R = V² ÷ R.
 *    Pick any two known values; the other two are derived.
 * ============================================================ */

type OhmsPair = "VI" | "VR" | "VP" | "IR" | "IP" | "RP";
type OhmsKey = "v" | "i" | "r" | "p";

const OHMS_PAIRS: {
  id: OhmsPair;
  label: string;
  a: { key: OhmsKey; label: string; unit: string };
  b: { key: OhmsKey; label: string; unit: string };
}[] = [
  { id: "VI", label: "Voltage & Current", a: { key: "v", label: "Voltage", unit: "V" }, b: { key: "i", label: "Current", unit: "A" } },
  { id: "VR", label: "Voltage & Resistance", a: { key: "v", label: "Voltage", unit: "V" }, b: { key: "r", label: "Resistance", unit: "Ω" } },
  { id: "VP", label: "Voltage & Power", a: { key: "v", label: "Voltage", unit: "V" }, b: { key: "p", label: "Power", unit: "W" } },
  { id: "IR", label: "Current & Resistance", a: { key: "i", label: "Current", unit: "A" }, b: { key: "r", label: "Resistance", unit: "Ω" } },
  { id: "IP", label: "Current & Power", a: { key: "i", label: "Current", unit: "A" }, b: { key: "p", label: "Power", unit: "W" } },
  { id: "RP", label: "Resistance & Power", a: { key: "r", label: "Resistance", unit: "Ω" }, b: { key: "p", label: "Power", unit: "W" } },
];

function OhmsLawCalc() {
  const [pair, setPair] = React.useState<OhmsPair>("VI");
  const [v, setV] = React.useState("12");
  const [i, setI] = React.useState("0.5");
  const [r, setR] = React.useState("24");
  const [p, setP] = React.useState("6");

  const result = React.useMemo(() => {
    const V = parseNumber(v);
    const I = parseNumber(i);
    const R = parseNumber(r);
    const P = parseNumber(p);
    let Vo = NaN;
    let Io = NaN;
    let Ro = NaN;
    let Po = NaN;
    switch (pair) {
      case "VI":
        Vo = V; Io = I;
        Ro = I !== 0 ? V / I : NaN;
        Po = V * I;
        break;
      case "VR":
        Vo = V; Ro = R;
        Io = R !== 0 ? V / R : NaN;
        Po = R !== 0 ? (V * V) / R : NaN;
        break;
      case "VP":
        Vo = V; Po = P;
        Io = V !== 0 ? P / V : NaN;
        Ro = P !== 0 ? (V * V) / P : NaN;
        break;
      case "IR":
        Io = I; Ro = R;
        Vo = I * R;
        Po = I * I * R;
        break;
      case "IP":
        Io = I; Po = P;
        Vo = I !== 0 ? P / I : NaN;
        Ro = I !== 0 ? P / (I * I) : NaN;
        break;
      case "RP":
        Ro = R; Po = P;
        Io = R > 0 && P >= 0 ? Math.sqrt(P / R) : NaN;
        Vo = R > 0 && P >= 0 ? Math.sqrt(P * R) : NaN;
        break;
    }
    return { V: Vo, I: Io, R: Ro, P: Po };
  }, [pair, v, i, r, p]);

  const active = OHMS_PAIRS.find((x) => x.id === pair)!;
  const stateMap: Record<OhmsKey, { val: string; set: (s: string) => void }> = {
    v: { val: v, set: setV },
    i: { val: i, set: setI },
    r: { val: r, set: setR },
    p: { val: p, set: setP },
  };

  const fmt = (n: number, unit: string) =>
    Number.isFinite(n) ? `${formatNumber(n, 6)} ${unit}` : "—";

  return (
    <div className="space-y-5">
      <Field label="Known values" hint="Pick any two — the other two are computed">
        <Select value={pair} onValueChange={(val) => setPair(val as OhmsPair)}>
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {OHMS_PAIRS.map((opt) => (
              <SelectItem key={opt.id} value={opt.id}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Field>

      <div className="grid sm:grid-cols-2 gap-4">
        <Field label={`${active.a.label} (${active.a.unit})`}>
          <Input
            type="number"
            value={stateMap[active.a.key].val}
            onChange={(e) => stateMap[active.a.key].set(e.target.value)}
            className="font-mono"
          />
        </Field>
        <Field label={`${active.b.label} (${active.b.unit})`}>
          <Input
            type="number"
            value={stateMap[active.b.key].val}
            onChange={(e) => stateMap[active.b.key].set(e.target.value)}
            className="font-mono"
          />
        </Field>
      </div>

      <CopyableResult
        label="Voltage (V)"
        value={fmt(result.V, "V")}
        sublabel={`I = ${fmt(result.I, "A")} · R = ${fmt(result.R, "Ω")} · P = ${fmt(result.P, "W")}`}
        accent="primary"
        copyText={fmt(result.V, "V")}
      />

      <div className="grid sm:grid-cols-3 gap-4">
        <ResultStat label="Current (I)" value={fmt(result.I, "A")} />
        <ResultStat label="Resistance (R)" value={fmt(result.R, "Ω")} />
        <ResultStat label="Power (P)" value={fmt(result.P, "W")} />
      </div>

      <FormulaBox>
        Ohm&apos;s law: V = I × R. Power: P = V × I = I² × R = V² ÷ R. Choose any two
        known quantities from the dropdown; the remaining two are derived automatically.
        Watch for divide-by-zero — if a value shows &ldquo;—&rdquo;, the chosen inputs
        do not uniquely determine that quantity.
      </FormulaBox>
    </div>
  );
}

/* ============================================================
 * 5. Electricity Bill Calculator
 *    Energy (kWh) = power (W) × hours × days ÷ 1000.
 *    Cost = energy × rate.
 * ============================================================ */
function ElectricityBillCalc() {
  const [power, setPower] = React.useState("60");
  const [hours, setHours] = React.useState("8");
  const [days, setDays] = React.useState("30");
  const [rate, setRate] = React.useState("0.15");
  const [currency, setCurrency] = React.useState("USD");

  const r = React.useMemo(() => {
    const P = parseNumber(power);
    const H = parseNumber(hours);
    const D = parseNumber(days);
    const R = parseNumber(rate);
    const dailyKwh = (P * H) / 1000;
    const totalKwh = dailyKwh * D;
    const monthlyKwh = dailyKwh * 30;
    const cost = totalKwh * R;
    const monthlyCost = monthlyKwh * R;
    const dailyCost = dailyKwh * R;
    return { dailyKwh, totalKwh, monthlyKwh, cost, monthlyCost, dailyCost };
  }, [power, hours, days, rate]);

  return (
    <div className="space-y-5">
      <div className="grid sm:grid-cols-2 gap-4">
        <Field label="Device power (W)" hint="Wattage of the appliance">
          <Input
            type="number"
            value={power}
            onChange={(e) => setPower(e.target.value)}
            className="font-mono"
          />
        </Field>
        <Field label="Hours per day">
          <Input
            type="number"
            value={hours}
            onChange={(e) => setHours(e.target.value)}
            className="font-mono"
          />
        </Field>
        <Field label="Number of days">
          <Input
            type="number"
            value={days}
            onChange={(e) => setDays(e.target.value)}
            className="font-mono"
          />
        </Field>
        <Field label="Electricity rate (per kWh)">
          <Input
            type="number"
            value={rate}
            onChange={(e) => setRate(e.target.value)}
            className="font-mono"
          />
        </Field>
      </div>

      <CurrencySelect value={currency} onChange={setCurrency} />

      <CopyableResult
        label="Total energy used"
        value={`${formatNumber(r.totalKwh, 2)} kWh`}
        sublabel={`Cost: ${formatMoney(r.cost, currency)} over ${formatNumber(parseNumber(days))} day(s)`}
        accent="primary"
        copyText={`${formatNumber(r.totalKwh, 2)} kWh · ${formatMoney(r.cost, currency)}`}
      />

      <div className="grid sm:grid-cols-3 gap-4">
        <ResultStat
          label="Daily usage"
          value={`${formatNumber(r.dailyKwh, 3)} kWh`}
          sublabel={formatMoney(r.dailyCost, currency)}
        />
        <ResultStat
          label="Monthly estimate"
          value={`${formatNumber(r.monthlyKwh, 2)} kWh`}
          sublabel={formatMoney(r.monthlyCost, currency)}
        />
        <ResultStat
          label="Total cost"
          value={formatMoney(r.cost, currency)}
          sublabel={`${formatNumber(parseNumber(days))} day(s)`}
        />
      </div>

      <FormulaBox>
        Energy (kWh) = power (W) × hours per day × days ÷ 1000. Cost = energy × rate.
        The monthly estimate assumes 30 days at the same daily usage pattern.
      </FormulaBox>
    </div>
  );
}

/* ============================================================
 * 6. Fuel Cost Calculator
 *    Fuel = distance ÷ efficiency. Cost = fuel × price.
 *    Cost per distance = total cost ÷ distance.
 * ============================================================ */
function FuelCostCalc() {
  const [system, setSystem] = React.useState<"metric" | "imperial">("metric");
  const [distance, setDistance] = React.useState("500");
  const [efficiency, setEfficiency] = React.useState("8");
  const [price, setPrice] = React.useState("1.50");
  const [currency, setCurrency] = React.useState("USD");

  const r = React.useMemo(() => {
    const D = parseNumber(distance);
    const E = parseNumber(efficiency);
    const P = parseNumber(price);
    const fuelNeeded = E > 0 ? D / E : 0;
    const totalCost = fuelNeeded * P;
    const costPerDist = D > 0 ? totalCost / D : 0;
    return { D, E, P, fuelNeeded, totalCost, costPerDist };
  }, [distance, efficiency, price]);

  const distUnit = system === "metric" ? "km" : "mi";
  const fuelUnit = system === "metric" ? "L" : "gal";
  const effUnit = system === "metric" ? "km/L" : "mpg";

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <Label className="text-sm font-medium">Measurement system</Label>
        <UnitToggle value={system} onChange={setSystem} />
      </div>

      <div className="grid sm:grid-cols-3 gap-4">
        <Field label={`Distance (${distUnit})`}>
          <Input
            type="number"
            value={distance}
            onChange={(e) => setDistance(e.target.value)}
            className="font-mono"
          />
        </Field>
        <Field label={`Fuel efficiency (${effUnit})`}>
          <Input
            type="number"
            value={efficiency}
            onChange={(e) => setEfficiency(e.target.value)}
            className="font-mono"
          />
        </Field>
        <Field label={`Fuel price (per ${fuelUnit})`}>
          <Input
            type="number"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            className="font-mono"
          />
        </Field>
      </div>

      <CurrencySelect value={currency} onChange={setCurrency} />

      <CopyableResult
        label="Total fuel cost"
        value={formatMoney(r.totalCost, currency)}
        sublabel={`${formatNumber(r.fuelNeeded, 2)} ${fuelUnit} over ${formatNumber(r.D)} ${distUnit}`}
        accent="primary"
        copyText={formatMoney(r.totalCost, currency)}
      />

      <div className="grid sm:grid-cols-2 gap-4">
        <ResultStat
          label="Fuel needed"
          value={`${formatNumber(r.fuelNeeded, 2)} ${fuelUnit}`}
          sublabel={`Efficiency: ${formatNumber(r.E)} ${effUnit}`}
        />
        <ResultStat
          label={`Cost per ${distUnit}`}
          value={formatMoney(r.costPerDist, currency)}
          sublabel={`Distance: ${formatNumber(r.D)} ${distUnit}`}
        />
      </div>

      <FormulaBox>
        Fuel needed = distance ÷ efficiency. Total cost = fuel needed × price. Cost per {distUnit} = total cost ÷ distance.
        Toggle the unit system to switch between km/L (metric) and mpg (imperial). 1 US gallon = 3.785 L; 1 mile = 1.609 km.
      </FormulaBox>
    </div>
  );
}

/* ============================================================
 * Exported switcher
 * ============================================================ */
export function EngineeringCalcs({ calcId }: { calcId: string }) {
  switch (calcId) {
    case "concrete":
      return <ConcreteCalc />;
    case "paint":
      return <PaintCalc />;
    case "flooring":
      return <FlooringCalc />;
    case "ohms-law":
      return <OhmsLawCalc />;
    case "electricity-bill":
      return <ElectricityBillCalc />;
    case "fuel-cost":
      return <FuelCostCalc />;
    case "watts-to-amps":
      return <WattsToAmpsCalc />;
    default:
      return null;
  }
}

function WattsToAmpsCalc() {
  const [watts, setWatts] = React.useState("1200");
  const [volts, setVolts] = React.useState("120");
  const [type, setType] = React.useState<"dc" | "ac-single">("dc");
  const [pf, setPf] = React.useState("0.9");
  const w = parseNumber(watts);
  const v = parseNumber(volts);
  const powerFactor = parseNumber(pf);
  let amps: number;
  if (type === "dc") amps = v !== 0 ? w / v : 0;
  else amps = v !== 0 && powerFactor !== 0 ? w / (v * powerFactor) : 0;
  return (
    <div className="space-y-4">
      <div className="grid sm:grid-cols-2 gap-4">
        <Field label="Power (Watts)"><Input value={watts} onChange={e => setWatts(e.target.value)} inputMode="decimal" /></Field>
        <Field label="Voltage (Volts)"><Input value={volts} onChange={e => setVolts(e.target.value)} inputMode="decimal" /></Field>
      </div>
      <div className="grid sm:grid-cols-2 gap-4">
        <Field label="Current type">
          <select value={type} onChange={e => setType(e.target.value as "dc" | "ac-single")} className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm">
            <option value="dc">DC (Direct Current)</option>
            <option value="ac-single">AC Single Phase</option>
          </select>
        </Field>
        {type === "ac-single" && (
          <Field label="Power factor (0–1)"><Input value={pf} onChange={e => setPf(e.target.value)} inputMode="decimal" /></Field>
        )}
      </div>
      <ResultStat label="Current (Amps)" value={formatNumber(amps)} accent="primary" />
      <FormulaBox>
        {type === "dc"
          ? "DC: I (A) = P (W) ÷ V (V). For DC circuits, current is simply power divided by voltage."
          : "AC single phase: I (A) = P (W) ÷ (V (V) × PF). Power factor (PF) typically 0.8–1.0 for resistive loads."}
      </FormulaBox>
    </div>
  );
}
