"use client";

import * as React from "react";
import { Field, ResultStat, num } from "@/components/calc-page-shell";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
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

// ---------- Conversion constants ----------
const KG_PER_LB = 0.45359237;
const LB_PER_KG = 1 / KG_PER_LB;
const CM_PER_IN = 2.54;
const IN_PER_CM = 1 / CM_PER_IN;
const M_PER_IN = 0.0254;
const ML_PER_CUP = 240; // US legal cup, used for nutrition guidance

// ---------- Shared disclaimer ----------
function HealthDisclaimer() {
  return (
    <div className="rounded-xl bg-muted/30 border border-border p-4 text-xs text-muted-foreground">
      <strong className="text-foreground">Disclaimer:</strong> This calculator provides estimates for informational purposes only and is not a medical diagnosis. Consult a qualified healthcare professional for advice.
    </div>
  );
}

// ---------- Reusable unit toggle ----------
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

// ---------- Reusable copy-to-clipboard button ----------
function CopyButton({ value, label = "Copy" }: { value: string; label?: string }) {
  return (
    <Button
      variant="ghost"
      size="sm"
      className="h-7"
      onClick={() => {
        if (typeof navigator !== "undefined" && navigator.clipboard) {
          navigator.clipboard.writeText(value).then(
            () => toast.success("Copied to clipboard"),
            () => toast.error("Could not copy"),
          );
        }
      }}
    >
      <Copy className="size-3.5" /> {label}
    </Button>
  );
}

// ---------- Reusable sex toggle ----------
function SexToggle({
  value,
  onChange,
}: {
  value: "male" | "female";
  onChange: (v: "male" | "female") => void;
}) {
  return (
    <div className="inline-flex rounded-lg border border-border bg-card p-0.5">
      {(["male", "female"] as const).map((s) => (
        <button
          key={s}
          type="button"
          onClick={() => onChange(s)}
          className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors capitalize ${
            value === s
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          {s}
        </button>
      ))}
    </div>
  );
}

// ---------- Activity levels ----------
const ACTIVITY_LEVELS = [
  { id: "sedentary", name: "Sedentary — little or no exercise", factor: 1.2 },
  { id: "light", name: "Light — 1-3 days/week", factor: 1.375 },
  { id: "moderate", name: "Moderate — 3-5 days/week", factor: 1.55 },
  { id: "active", name: "Active — 6-7 days/week", factor: 1.725 },
  { id: "very-active", name: "Very Active — physical job or daily training", factor: 1.9 },
] as const;

// ---------- Mifflin-St Jeor BMR ----------
function computeBMR(
  sex: "male" | "female",
  age: number,
  heightCm: number,
  weightKg: number,
): number {
  if (heightCm <= 0 || weightKg <= 0 || age <= 0) return NaN;
  const base = 10 * weightKg + 6.25 * heightCm - 5 * age;
  return sex === "male" ? base + 5 : base - 161;
}

// ---------- Time helpers ----------
function parseDuration(s: string): number {
  if (!s) return 0;
  const parts = s.split(":").map((p) => parseNumber(p));
  if (parts.length === 1) return parts[0];
  if (parts.length === 2) return parts[0] * 60 + parts[1];
  if (parts.length >= 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
  return 0;
}

function formatDuration(sec: number): string {
  if (!Number.isFinite(sec) || sec < 0) return "—";
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = Math.round(sec % 60);
  const mm = String(m).padStart(2, "0");
  const ss = String(s).padStart(2, "0");
  return h > 0 ? `${h}:${mm}:${ss}` : `${m}:${ss}`;
}

function formatPace(secPerUnit: number): string {
  if (!Number.isFinite(secPerUnit) || secPerUnit <= 0) return "—";
  const m = Math.floor(secPerUnit / 60);
  const s = Math.round(secPerUnit % 60);
  return `${m}:${String(s).padStart(2, "0")}`;
}

// ============================================================
// 1. BMI Calculator
// ============================================================
function BMICalc() {
  const [system, setSystem] = React.useState<"metric" | "imperial">("metric");
  const [cm, setCm] = React.useState("175");
  const [kg, setKg] = React.useState("70");
  const [ft, setFt] = React.useState("5");
  const [inch, setInch] = React.useState("9");
  const [lb, setLb] = React.useState("154");

  const r = React.useMemo(() => {
    let bmi = NaN;
    let heightM = 0;
    let heightIn = 0;
    let weightKg = 0;
    if (system === "metric") {
      const h = parseNumber(cm);
      const w = parseNumber(kg);
      heightM = h / 100;
      heightIn = h * IN_PER_CM;
      weightKg = w;
      if (h > 0 && w > 0) bmi = w / (heightM * heightM);
    } else {
      const f = parseNumber(ft);
      const i = parseNumber(inch);
      const w = parseNumber(lb);
      const totalIn = f * 12 + i;
      heightIn = totalIn;
      heightM = totalIn * M_PER_IN;
      weightKg = w * KG_PER_LB;
      if (totalIn > 0 && w > 0) bmi = (703 * w) / (totalIn * totalIn);
    }
    const healthyMinKg = 18.5 * heightM * heightM;
    const healthyMaxKg = 24.9 * heightM * heightM;
    return {
      bmi,
      heightM,
      heightIn,
      weightKg,
      healthyMinKg,
      healthyMaxKg,
      healthyMinLb: healthyMinKg * LB_PER_KG,
      healthyMaxLb: healthyMaxKg * LB_PER_KG,
    };
  }, [system, cm, kg, ft, inch, lb]);

  const category = React.useMemo(() => {
    if (!Number.isFinite(r.bmi)) return { name: "—", accent: "default" as const };
    if (r.bmi < 18.5) return { name: "Underweight", accent: "primary" as const };
    if (r.bmi < 25) return { name: "Healthy weight", accent: "success" as const };
    if (r.bmi < 30) return { name: "Overweight", accent: "warning" as const };
    if (r.bmi < 35) return { name: "Obesity (Class I)", accent: "warning" as const };
    if (r.bmi < 40) return { name: "Obesity (Class II)", accent: "warning" as const };
    return { name: "Obesity (Class III)", accent: "warning" as const };
  }, [r.bmi]);

  // Marker position: BMI 15..40 mapped to 0..100%
  const markerPos = React.useMemo(() => {
    if (!Number.isFinite(r.bmi)) return 0;
    const pct = ((r.bmi - 15) / (40 - 15)) * 100;
    return Math.max(0, Math.min(100, pct));
  }, [r.bmi]);

  const heightLabel =
    system === "metric"
      ? `${formatNumber(r.heightM * 100, 0)} cm`
      : `${Math.floor(r.heightIn / 12)} ft ${Math.round(r.heightIn % 12)} in`;

  return (
    <Tabs defaultValue="adults">
      <TabsList>
        <TabsTrigger value="adults">Adults</TabsTrigger>
      </TabsList>
      <TabsContent value="adults" className="space-y-5 mt-4">
        <div className="rounded-lg bg-muted/30 border border-border px-3 py-2 text-xs text-muted-foreground">
          Adult BMI classification applies to ages 20+. For children and teens, consult a pediatrician.
        </div>

        <div className="flex items-center justify-between gap-3 flex-wrap">
          <Label className="text-sm font-medium">Measurement system</Label>
          <UnitToggle value={system} onChange={setSystem} />
        </div>

        {system === "metric" ? (
          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="Height (cm)">
              <Input type="number" value={cm} onChange={(e) => setCm(e.target.value)} className="font-mono" />
            </Field>
            <Field label="Weight (kg)">
              <Input type="number" value={kg} onChange={(e) => setKg(e.target.value)} className="font-mono" />
            </Field>
          </div>
        ) : (
          <div className="grid sm:grid-cols-3 gap-4">
            <Field label="Height (ft)">
              <Input type="number" value={ft} onChange={(e) => setFt(e.target.value)} className="font-mono" />
            </Field>
            <Field label="Height (in)">
              <Input type="number" value={inch} onChange={(e) => setInch(e.target.value)} className="font-mono" />
            </Field>
            <Field label="Weight (lb)">
              <Input type="number" value={lb} onChange={(e) => setLb(e.target.value)} className="font-mono" />
            </Field>
          </div>
        )}

        {Number.isFinite(r.bmi) ? (
          <>
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1">
                <ResultStat
                  label="Your BMI"
                  value={r.bmi.toFixed(1)}
                  sublabel={category.name}
                  accent={category.accent}
                />
              </div>
              <CopyButton value={`BMI ${r.bmi.toFixed(1)} - ${category.name}`} />
            </div>

            {/* Animated BMI scale */}
            <div className="space-y-2">
              <div
                className="relative h-3 rounded-full overflow-hidden"
                style={{
                  background:
                    "linear-gradient(to right, #3b82f6 0% 16%, #22c55e 16% 38%, #eab308 38% 56%, #f97316 56% 70%, #ef4444 70% 100%)",
                }}
              >
                <div
                  className="absolute top-[-4px] w-1 h-5 bg-foreground rounded-full transition-all duration-300"
                  style={{ left: `calc(${markerPos}% - 2px)` }}
                  aria-label={`BMI marker at ${r.bmi.toFixed(1)}`}
                />
              </div>
              <div className="flex justify-between text-[10px] text-muted-foreground font-mono">
                <span>15</span>
                <span>18.5</span>
                <span>25</span>
                <span>30</span>
                <span>35</span>
                <span>40</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-[10px] text-muted-foreground pt-1">
                <Legend color="#3b82f6" label="Underweight" range="<18.5" />
                <Legend color="#22c55e" label="Healthy" range="18.5-24.9" />
                <Legend color="#eab308" label="Overweight" range="25-29.9" />
                <Legend color="#f97316" label="Obesity I" range="30-34.9" />
                <Legend color="#ef4444" label="Obesity II" range="35-39.9" />
                <Legend color="#b91c1c" label="Obesity III" range=">=40" />
              </div>
            </div>

            {/* Healthy weight range */}
            <div className="rounded-2xl border border-border bg-card p-4">
              <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
                Healthy weight range for your height
              </div>
              <div className="text-lg font-bold font-mono">
                {system === "metric"
                  ? `${formatNumber(r.healthyMinKg, 1)} - ${formatNumber(r.healthyMaxKg, 1)} kg`
                  : `${formatNumber(r.healthyMinLb, 1)} - ${formatNumber(r.healthyMaxLb, 1)} lb`}
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                BMI 18.5-24.9 at height {heightLabel}
              </div>
            </div>

            <div className="rounded-xl bg-muted/30 border border-border p-4 text-sm text-muted-foreground">
              <strong className="text-foreground">Formula:</strong>{" "}
              {system === "metric"
                ? "BMI = weight(kg) / (height(m))^2"
                : "BMI = 703 x weight(lb) / (height(in))^2"}
            </div>

            <div className="rounded-xl bg-muted/30 border border-border p-4 text-xs text-muted-foreground">
              <strong className="text-foreground">Disclaimer:</strong> BMI is a screening measure, not a diagnosis. It does not directly measure body fat or health. Consult a healthcare professional for advice.
            </div>
          </>
        ) : (
          <div className="text-center py-10 text-muted-foreground text-sm">
            Enter your height and weight to see your BMI.
          </div>
        )}

        <HealthDisclaimer />
      </TabsContent>
    </Tabs>
  );
}

function Legend({ color, label, range }: { color: string; label: string; range: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="inline-block size-2.5 rounded-sm shrink-0" style={{ background: color }} />
      <span className="text-foreground font-medium">{label}</span>
      <span className="ml-auto font-mono">{range}</span>
    </div>
  );
}

// ============================================================
// 2. BMR Calculator
// ============================================================
function BMRCalc() {
  const [system, setSystem] = React.useState<"metric" | "imperial">("metric");
  const [sex, setSex] = React.useState<"male" | "female">("male");
  const [age, setAge] = React.useState("30");
  const [cm, setCm] = React.useState("175");
  const [kg, setKg] = React.useState("70");
  const [ft, setFt] = React.useState("5");
  const [inch, setInch] = React.useState("9");
  const [lb, setLb] = React.useState("154");

  const bmr = React.useMemo(() => {
    let heightCm = 0;
    let weightKg = 0;
    if (system === "metric") {
      heightCm = parseNumber(cm);
      weightKg = parseNumber(kg);
    } else {
      const totalIn = parseNumber(ft) * 12 + parseNumber(inch);
      heightCm = totalIn * CM_PER_IN;
      weightKg = parseNumber(lb) * KG_PER_LB;
    }
    return computeBMR(sex, parseNumber(age), heightCm, weightKg);
  }, [system, sex, age, cm, kg, ft, inch, lb]);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <Label className="text-sm font-medium">Measurement system</Label>
        <UnitToggle value={system} onChange={setSystem} />
      </div>

      <Field label="Sex">
        <SexToggle value={sex} onChange={setSex} />
      </Field>

      <div className="grid sm:grid-cols-2 gap-4">
        <Field label="Age (years)">
          <Input type="number" value={age} onChange={(e) => setAge(e.target.value)} className="font-mono" />
        </Field>
        {system === "metric" ? (
          <>
            <Field label="Height (cm)">
              <Input type="number" value={cm} onChange={(e) => setCm(e.target.value)} className="font-mono" />
            </Field>
            <Field label="Weight (kg)">
              <Input type="number" value={kg} onChange={(e) => setKg(e.target.value)} className="font-mono" />
            </Field>
          </>
        ) : (
          <>
            <Field label="Height (ft)">
              <Input type="number" value={ft} onChange={(e) => setFt(e.target.value)} className="font-mono" />
            </Field>
            <Field label="Height (in)">
              <Input type="number" value={inch} onChange={(e) => setInch(e.target.value)} className="font-mono" />
            </Field>
            <Field label="Weight (lb)">
              <Input type="number" value={lb} onChange={(e) => setLb(e.target.value)} className="font-mono" />
            </Field>
          </>
        )}
      </div>

      {Number.isFinite(bmr) ? (
        <ResultStat
          label="Basal Metabolic Rate"
          value={`${num(bmr, 0)} kcal/day`}
          sublabel="Mifflin-St Jeor equation"
          accent="primary"
        />
      ) : (
        <div className="text-center py-10 text-muted-foreground text-sm">
          Enter valid values to compute your BMR.
        </div>
      )}

      <div className="rounded-xl bg-muted/30 border border-border p-4 text-sm text-muted-foreground">
        <strong className="text-foreground">Formula (Mifflin-St Jeor):</strong>
        <div className="mt-1 font-mono text-xs">
          Men: BMR = 10 x kg + 6.25 x cm - 5 x age + 5
          <br />
          Women: BMR = 10 x kg + 6.25 x cm - 5 x age - 161
        </div>
      </div>

      <HealthDisclaimer />
    </div>
  );
}

// ============================================================
// 3. TDEE Calculator
// ============================================================
function TDEECalc() {
  const [system, setSystem] = React.useState<"metric" | "imperial">("metric");
  const [sex, setSex] = React.useState<"male" | "female">("male");
  const [age, setAge] = React.useState("30");
  const [cm, setCm] = React.useState("175");
  const [kg, setKg] = React.useState("70");
  const [ft, setFt] = React.useState("5");
  const [inch, setInch] = React.useState("9");
  const [lb, setLb] = React.useState("154");
  const [activityId, setActivityId] = React.useState<string>("moderate");

  const activity = ACTIVITY_LEVELS.find((a) => a.id === activityId) ?? ACTIVITY_LEVELS[2];

  const { bmr, tdee } = React.useMemo(() => {
    let heightCm = 0;
    let weightKg = 0;
    if (system === "metric") {
      heightCm = parseNumber(cm);
      weightKg = parseNumber(kg);
    } else {
      const totalIn = parseNumber(ft) * 12 + parseNumber(inch);
      heightCm = totalIn * CM_PER_IN;
      weightKg = parseNumber(lb) * KG_PER_LB;
    }
    const b = computeBMR(sex, parseNumber(age), heightCm, weightKg);
    return { bmr: b, tdee: Number.isFinite(b) ? b * activity.factor : NaN };
  }, [system, sex, age, cm, kg, ft, inch, lb, activity]);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <Label className="text-sm font-medium">Measurement system</Label>
        <UnitToggle value={system} onChange={setSystem} />
      </div>

      <Field label="Sex">
        <SexToggle value={sex} onChange={setSex} />
      </Field>

      <div className="grid sm:grid-cols-2 gap-4">
        <Field label="Age (years)">
          <Input type="number" value={age} onChange={(e) => setAge(e.target.value)} className="font-mono" />
        </Field>
        {system === "metric" ? (
          <>
            <Field label="Height (cm)">
              <Input type="number" value={cm} onChange={(e) => setCm(e.target.value)} className="font-mono" />
            </Field>
            <Field label="Weight (kg)">
              <Input type="number" value={kg} onChange={(e) => setKg(e.target.value)} className="font-mono" />
            </Field>
          </>
        ) : (
          <>
            <Field label="Height (ft)">
              <Input type="number" value={ft} onChange={(e) => setFt(e.target.value)} className="font-mono" />
            </Field>
            <Field label="Height (in)">
              <Input type="number" value={inch} onChange={(e) => setInch(e.target.value)} className="font-mono" />
            </Field>
            <Field label="Weight (lb)">
              <Input type="number" value={lb} onChange={(e) => setLb(e.target.value)} className="font-mono" />
            </Field>
          </>
        )}
      </div>

      <Field label="Activity level" hint={`Multiplier: ${activity.factor}`}>
        <Select value={activityId} onValueChange={setActivityId}>
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {ACTIVITY_LEVELS.map((a) => (
              <SelectItem key={a.id} value={a.id}>
                {a.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Field>

      {Number.isFinite(tdee) ? (
        <div className="grid sm:grid-cols-2 gap-4">
          <ResultStat label="BMR" value={`${num(bmr, 0)} kcal/day`} sublabel="At complete rest" />
          <ResultStat
            label="TDEE"
            value={`${num(tdee, 0)} kcal/day`}
            sublabel={`BMR x ${activity.factor}`}
            accent="primary"
          />
        </div>
      ) : (
        <div className="text-center py-10 text-muted-foreground text-sm">
          Enter valid values to compute your TDEE.
        </div>
      )}

      <div className="rounded-xl bg-muted/30 border border-border p-4 text-sm text-muted-foreground">
        <strong className="text-foreground">Formula:</strong> TDEE = BMR (Mifflin-St Jeor) x activity factor.
        Activity factors: Sedentary 1.2, Light 1.375, Moderate 1.55, Active 1.725, Very Active 1.9.
      </div>

      <HealthDisclaimer />
    </div>
  );
}

// ============================================================
// 4. Daily Calorie Calculator
// ============================================================
function CalorieCalc() {
  const [system, setSystem] = React.useState<"metric" | "imperial">("metric");
  const [sex, setSex] = React.useState<"male" | "female">("male");
  const [age, setAge] = React.useState("30");
  const [cm, setCm] = React.useState("175");
  const [kg, setKg] = React.useState("70");
  const [ft, setFt] = React.useState("5");
  const [inch, setInch] = React.useState("9");
  const [lb, setLb] = React.useState("154");
  const [activityId, setActivityId] = React.useState<string>("moderate");
  const [goal, setGoal] = React.useState<"lose" | "maintain" | "gain">("maintain");

  const activity = ACTIVITY_LEVELS.find((a) => a.id === activityId) ?? ACTIVITY_LEVELS[2];

  const targets = React.useMemo(() => {
    let heightCm = 0;
    let weightKg = 0;
    if (system === "metric") {
      heightCm = parseNumber(cm);
      weightKg = parseNumber(kg);
    } else {
      const totalIn = parseNumber(ft) * 12 + parseNumber(inch);
      heightCm = totalIn * CM_PER_IN;
      weightKg = parseNumber(lb) * KG_PER_LB;
    }
    const b = computeBMR(sex, parseNumber(age), heightCm, weightKg);
    const tdee = Number.isFinite(b) ? b * activity.factor : NaN;
    return {
      bmr: b,
      tdee,
      lose: Number.isFinite(tdee) ? tdee - 500 : NaN,
      maintain: tdee,
      gain: Number.isFinite(tdee) ? tdee + 500 : NaN,
    };
  }, [system, sex, age, cm, kg, ft, inch, lb, activity]);

  const accent = (g: "lose" | "maintain" | "gain"): "primary" | "success" | "warning" | "default" =>
    goal === g ? "primary" : "default";

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <Label className="text-sm font-medium">Measurement system</Label>
        <UnitToggle value={system} onChange={setSystem} />
      </div>

      <Field label="Sex">
        <SexToggle value={sex} onChange={setSex} />
      </Field>

      <div className="grid sm:grid-cols-2 gap-4">
        <Field label="Age (years)">
          <Input type="number" value={age} onChange={(e) => setAge(e.target.value)} className="font-mono" />
        </Field>
        {system === "metric" ? (
          <>
            <Field label="Height (cm)">
              <Input type="number" value={cm} onChange={(e) => setCm(e.target.value)} className="font-mono" />
            </Field>
            <Field label="Weight (kg)">
              <Input type="number" value={kg} onChange={(e) => setKg(e.target.value)} className="font-mono" />
            </Field>
          </>
        ) : (
          <>
            <Field label="Height (ft)">
              <Input type="number" value={ft} onChange={(e) => setFt(e.target.value)} className="font-mono" />
            </Field>
            <Field label="Height (in)">
              <Input type="number" value={inch} onChange={(e) => setInch(e.target.value)} className="font-mono" />
            </Field>
            <Field label="Weight (lb)">
              <Input type="number" value={lb} onChange={(e) => setLb(e.target.value)} className="font-mono" />
            </Field>
          </>
        )}
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <Field label="Activity level" hint={`Multiplier: ${activity.factor}`}>
          <Select value={activityId} onValueChange={setActivityId}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {ACTIVITY_LEVELS.map((a) => (
                <SelectItem key={a.id} value={a.id}>
                  {a.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
        <Field label="Your goal">
          <Select value={goal} onValueChange={(v) => setGoal(v as typeof goal)}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="lose">Lose weight (~0.5 kg/week)</SelectItem>
              <SelectItem value="maintain">Maintain weight</SelectItem>
              <SelectItem value="gain">Gain weight (~0.5 kg/week)</SelectItem>
            </SelectContent>
          </Select>
        </Field>
      </div>

      {Number.isFinite(targets.tdee) ? (
        <div className="grid sm:grid-cols-3 gap-4">
          <ResultStat
            label="Lose weight"
            value={`${num(targets.lose, 0)} kcal`}
            sublabel="TDEE - 500"
            accent={accent("lose")}
          />
          <ResultStat
            label="Maintain"
            value={`${num(targets.maintain, 0)} kcal`}
            sublabel="= TDEE"
            accent={accent("maintain")}
          />
          <ResultStat
            label="Gain weight"
            value={`${num(targets.gain, 0)} kcal`}
            sublabel="TDEE + 500"
            accent={accent("gain")}
          />
        </div>
      ) : (
        <div className="text-center py-10 text-muted-foreground text-sm">
          Enter valid values to compute your calorie targets.
        </div>
      )}

      <div className="rounded-xl bg-muted/30 border border-border p-4 text-sm text-muted-foreground">
        <strong className="text-foreground">Method:</strong> Daily calories are based on TDEE (Mifflin-St Jeor BMR x activity factor).
        A deficit of 500 kcal/day produces roughly 0.5 kg of weight loss per week; a surplus of 500 kcal/day produces similar gain.
      </div>

      <HealthDisclaimer />
    </div>
  );
}

// ============================================================
// 5. Ideal Weight (Devine, Hamwi, Robinson)
// ============================================================
function IdealWeightCalc() {
  const [system, setSystem] = React.useState<"metric" | "imperial">("metric");
  const [sex, setSex] = React.useState<"male" | "female">("male");
  const [cm, setCm] = React.useState("175");
  const [ft, setFt] = React.useState("5");
  const [inch, setInch] = React.useState("9");

  const results = React.useMemo(() => {
    let heightIn = 0;
    if (system === "metric") {
      heightIn = parseNumber(cm) * IN_PER_CM;
    } else {
      heightIn = parseNumber(ft) * 12 + parseNumber(inch);
    }
    if (heightIn <= 0) return null;
    const delta = heightIn - 60;
    const devineKg = sex === "male" ? 50 + 2.3 * delta : 45.5 + 2.3 * delta;
    const hamwiKg = sex === "male" ? 48.0 + 2.7 * delta : 45.5 + 2.2 * delta;
    const robinsonKg = sex === "male" ? 52 + 1.9 * delta : 49 + 1.7 * delta;
    return {
      heightIn,
      devineKg,
      hamwiKg,
      robinsonKg,
      devineLb: devineKg * LB_PER_KG,
      hamwiLb: hamwiKg * LB_PER_KG,
      robinsonLb: robinsonKg * LB_PER_KG,
    };
  }, [system, sex, cm, ft, inch]);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <Label className="text-sm font-medium">Measurement system</Label>
        <UnitToggle value={system} onChange={setSystem} />
      </div>

      <Field label="Sex">
        <SexToggle value={sex} onChange={setSex} />
      </Field>

      {system === "metric" ? (
        <Field label="Height (cm)">
          <Input type="number" value={cm} onChange={(e) => setCm(e.target.value)} className="font-mono" />
        </Field>
      ) : (
        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="Height (ft)">
            <Input type="number" value={ft} onChange={(e) => setFt(e.target.value)} className="font-mono" />
          </Field>
          <Field label="Height (in)">
            <Input type="number" value={inch} onChange={(e) => setInch(e.target.value)} className="font-mono" />
          </Field>
        </div>
      )}

      {results ? (
        <div className="space-y-3">
          <ResultStat
            label="Ideal weight (Devine)"
            value={
              system === "metric"
                ? `${formatNumber(results.devineKg, 1)} kg`
                : `${formatNumber(results.devineLb, 1)} lb`
            }
            sublabel="Primary formula"
            accent="primary"
          />
          <div className="grid sm:grid-cols-2 gap-4">
            <ResultStat
              label="Hamwi"
              value={
                system === "metric"
                  ? `${formatNumber(results.hamwiKg, 1)} kg`
                  : `${formatNumber(results.hamwiLb, 1)} lb`
              }
            />
            <ResultStat
              label="Robinson"
              value={
                system === "metric"
                  ? `${formatNumber(results.robinsonKg, 1)} kg`
                  : `${formatNumber(results.robinsonLb, 1)} lb`
              }
            />
          </div>
        </div>
      ) : (
        <div className="text-center py-10 text-muted-foreground text-sm">
          Enter a valid height to compute your ideal weight.
        </div>
      )}

      <div className="rounded-xl bg-muted/30 border border-border p-4 text-xs text-muted-foreground font-mono">
        <strong className="text-foreground font-sans">Formulas</strong> (height in inches, computed for heights over 5 ft / 60 in):
        <div className="mt-1">
          Devine (men): 50 + 2.3 x (height_in - 60)
          <br />
          Devine (women): 45.5 + 2.3 x (height_in - 60)
          <br />
          Hamwi (men): 48.0 + 2.7 x (height_in - 60)
          <br />
          Hamwi (women): 45.5 + 2.2 x (height_in - 60)
          <br />
          Robinson (men): 52 + 1.9 x (height_in - 60)
          <br />
          Robinson (women): 49 + 1.7 x (height_in - 60)
        </div>
      </div>

      <HealthDisclaimer />
    </div>
  );
}

// ============================================================
// 6. Body Fat (US Navy method)
// ============================================================
function BodyFatCalc() {
  const [system, setSystem] = React.useState<"metric" | "imperial">("metric");
  const [sex, setSex] = React.useState<"male" | "female">("male");
  const [height, setHeight] = React.useState("175");
  const [neck, setNeck] = React.useState("38");
  const [waist, setWaist] = React.useState("85");
  const [hip, setHip] = React.useState("95");

  const result = React.useMemo(() => {
    // Convert all measurements to cm
    const toCm = (v: string) =>
      system === "metric" ? parseNumber(v) : parseNumber(v) * CM_PER_IN;
    const h = toCm(height);
    const n = toCm(neck);
    const w = toCm(waist);
    const hp = toCm(hip);
    if (h <= 0 || n <= 0 || w <= 0) return { bf: NaN, category: "—" };
    let bf = NaN;
    if (sex === "male") {
      if (w - n <= 0) return { bf: NaN, category: "—" };
      bf =
        86.01 * Math.log10(w - n) - 70.041 * Math.log10(h) + 36.76;
    } else {
      if (w + hp - n <= 0) return { bf: NaN, category: "—" };
      bf =
        163.205 * Math.log10(w + hp - n) - 97.684 * Math.log10(h) - 78.387;
    }
    bf = Math.max(0, Math.min(60, bf));
    let category = "—";
    if (Number.isFinite(bf)) {
      if (sex === "male") {
        if (bf < 6) category = "Essential (2-5%)";
        else if (bf < 14) category = "Athletes (6-13%)";
        else if (bf < 18) category = "Fitness (14-17%)";
        else if (bf < 25) category = "Average (18-24%)";
        else category = "Obese (>=25%)";
      } else {
        if (bf < 14) category = "Essential (10-13%)";
        else if (bf < 21) category = "Athletes (14-20%)";
        else if (bf < 25) category = "Fitness (21-24%)";
        else if (bf < 32) category = "Average (25-31%)";
        else category = "Obese (>=32%)";
      }
    }
    return { bf, category };
  }, [system, sex, height, neck, waist, hip]);

  const unitLabel = system === "metric" ? "cm" : "in";

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <Label className="text-sm font-medium">Measurement system</Label>
        <UnitToggle value={system} onChange={setSystem} />
      </div>

      <Field label="Sex">
        <SexToggle value={sex} onChange={setSex} />
      </Field>

      <div className="grid sm:grid-cols-2 gap-4">
        <Field label={`Height (${unitLabel})`}>
          <Input type="number" value={height} onChange={(e) => setHeight(e.target.value)} className="font-mono" />
        </Field>
        <Field label={`Neck (${unitLabel})`}>
          <Input type="number" value={neck} onChange={(e) => setNeck(e.target.value)} className="font-mono" />
        </Field>
        <Field label={`Waist (${unitLabel})`}>
          <Input type="number" value={waist} onChange={(e) => setWaist(e.target.value)} className="font-mono" />
        </Field>
        {sex === "female" && (
          <Field label={`Hip (${unitLabel})`}>
            <Input type="number" value={hip} onChange={(e) => setHip(e.target.value)} className="font-mono" />
          </Field>
        )}
      </div>

      {Number.isFinite(result.bf) ? (
        <ResultStat
          label="Body fat percentage"
          value={`${formatNumber(result.bf, 1)} %`}
          sublabel={result.category}
          accent="primary"
        />
      ) : (
        <div className="text-center py-10 text-muted-foreground text-sm">
          Enter valid measurements to estimate body fat. Waist must be larger than neck.
        </div>
      )}

      <div className="rounded-xl bg-muted/30 border border-border p-4 text-xs text-muted-foreground font-mono">
        <strong className="text-foreground font-sans">Formula (US Navy method, all measurements in cm)</strong>
        <div className="mt-1">
          Men: 86.010 x LOG10(waist - neck) - 70.041 x LOG10(height) + 36.76
          <br />
          Women: 163.205 x LOG10(waist + hip - neck) - 97.684 x LOG10(height) - 78.387
        </div>
      </div>

      <HealthDisclaimer />
    </div>
  );
}

// ============================================================
// 7. Macro Calculator
// ============================================================
const MACRO_SPLITS = {
  lose: { protein: 0.4, carb: 0.35, fat: 0.25 },
  maintain: { protein: 0.3, carb: 0.4, fat: 0.3 },
  gain: { protein: 0.3, carb: 0.45, fat: 0.25 },
} as const;

function MacroCalc() {
  const [calories, setCalories] = React.useState("2000");
  const [goal, setGoal] = React.useState<"lose" | "maintain" | "gain">("maintain");

  const cals = parseNumber(calories);
  const split = MACRO_SPLITS[goal];
  const proteinG = (cals * split.protein) / 4;
  const carbG = (cals * split.carb) / 4;
  const fatG = (cals * split.fat) / 9;

  return (
    <div className="space-y-5">
      <div className="grid sm:grid-cols-2 gap-4">
        <Field label="Daily calorie target (kcal)">
          <Input type="number" value={calories} onChange={(e) => setCalories(e.target.value)} className="font-mono" />
        </Field>
        <Field label="Goal">
          <Select value={goal} onValueChange={(v) => setGoal(v as typeof goal)}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="lose">Lose weight (40/35/25)</SelectItem>
              <SelectItem value="maintain">Maintain (30/40/30)</SelectItem>
              <SelectItem value="gain">Gain weight (30/45/25)</SelectItem>
            </SelectContent>
          </Select>
        </Field>
      </div>

      {cals > 0 ? (
        <>
          <div className="grid sm:grid-cols-3 gap-4">
            <ResultStat
              label="Protein"
              value={`${num(proteinG, 0)} g`}
              sublabel={`${num(cals * split.protein, 0)} kcal (${Math.round(split.protein * 100)}%)`}
              accent="primary"
            />
            <ResultStat
              label="Carbs"
              value={`${num(carbG, 0)} g`}
              sublabel={`${num(cals * split.carb, 0)} kcal (${Math.round(split.carb * 100)}%)`}
              accent="primary"
            />
            <ResultStat
              label="Fat"
              value={`${num(fatG, 0)} g`}
              sublabel={`${num(cals * split.fat, 0)} kcal (${Math.round(split.fat * 100)}%)`}
              accent="primary"
            />
          </div>

          {/* Visual macro bar */}
          <div className="space-y-2">
            <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Macro distribution</div>
            <div className="flex h-4 rounded-full overflow-hidden border border-border">
              <div className="bg-primary" style={{ width: `${split.protein * 100}%` }} title="Protein" />
              <div className="bg-emerald-500" style={{ width: `${split.carb * 100}%` }} title="Carbs" />
              <div className="bg-amber-500" style={{ width: `${split.fat * 100}%` }} title="Fat" />
            </div>
            <div className="flex justify-between text-[10px] text-muted-foreground">
              <span>Protein {Math.round(split.protein * 100)}%</span>
              <span>Carbs {Math.round(split.carb * 100)}%</span>
              <span>Fat {Math.round(split.fat * 100)}%</span>
            </div>
          </div>
        </>
      ) : (
        <div className="text-center py-10 text-muted-foreground text-sm">
          Enter a daily calorie target to compute macros.
        </div>
      )}

      <div className="rounded-xl bg-muted/30 border border-border p-4 text-sm text-muted-foreground">
        <strong className="text-foreground">Method:</strong> Protein and carbs provide 4 kcal/g, fat provides 9 kcal/g.
        Splits: Lose 40/35/25, Maintain 30/40/30, Gain 30/45/25 (protein/carb/fat).
      </div>

      <HealthDisclaimer />
    </div>
  );
}

// ============================================================
// 8. Water Intake
// ============================================================
function WaterCalc() {
  const [system, setSystem] = React.useState<"metric" | "imperial">("metric");
  const [weight, setWeight] = React.useState("70");
  const [exercise, setExercise] = React.useState("30");

  const result = React.useMemo(() => {
    const weightKg = system === "metric" ? parseNumber(weight) : parseNumber(weight) * KG_PER_LB;
    const exMin = parseNumber(exercise);
    if (weightKg <= 0) return { ml: NaN, liters: NaN, cups: NaN, baselineCups: 8 };
    const ml = weightKg * 35 + Math.max(0, exMin) * (350 / 30);
    return {
      ml,
      liters: ml / 1000,
      cups: ml / ML_PER_CUP,
      baselineCups: 8,
    };
  }, [system, weight, exercise]);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <Label className="text-sm font-medium">Measurement system</Label>
        <UnitToggle value={system} onChange={setSystem} />
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <Field label={`Weight (${system === "metric" ? "kg" : "lb"})`}>
          <Input type="number" value={weight} onChange={(e) => setWeight(e.target.value)} className="font-mono" />
        </Field>
        <Field label="Exercise time (min/day)" hint="+350 ml per 30 min of exercise">
          <Input type="number" value={exercise} onChange={(e) => setExercise(e.target.value)} className="font-mono" />
        </Field>
      </div>

      {Number.isFinite(result.liters) ? (
        <div className="grid sm:grid-cols-2 gap-4">
          <ResultStat
            label="Daily water intake"
            value={`${formatNumber(result.liters, 2)} L`}
            sublabel={`${num(result.ml, 0)} ml`}
            accent="primary"
          />
          <ResultStat
            label="Cups (240 ml each)"
            value={`${formatNumber(result.cups, 1)} cups`}
            sublabel={`Baseline is ~8 cups/day`}
          />
        </div>
      ) : (
        <div className="text-center py-10 text-muted-foreground text-sm">
          Enter your weight to estimate daily water intake.
        </div>
      )}

      <div className="rounded-xl bg-muted/30 border border-border p-4 text-sm text-muted-foreground">
        <strong className="text-foreground">Formula:</strong> Water (ml) = weight(kg) x 35 + exercise_minutes x (350/30).
        This is a baseline estimate; needs vary with climate, diet, and individual physiology.
      </div>

      <HealthDisclaimer />
    </div>
  );
}

// ============================================================
// 9. Running Pace
// ============================================================
function PaceCalc() {
  const [unit, setUnit] = React.useState<"km" | "mi">("km");
  const [distance, setDistance] = React.useState("5");
  const [time, setTime] = React.useState("25:00");

  const r = React.useMemo(() => {
    const d = parseNumber(distance);
    const totalSec = parseDuration(time);
    if (d <= 0 || totalSec <= 0) return null;
    const distKm = unit === "km" ? d : d * 1.609344;
    const distMi = unit === "mi" ? d : d / 1.609344;
    const secPerKm = totalSec / distKm;
    const secPerMi = totalSec / distMi;
    const speedKmh = distKm / (totalSec / 3600);
    const speedMph = distMi / (totalSec / 3600);
    return { secPerKm, secPerMi, speedKmh, speedMph, totalSec };
  }, [unit, distance, time]);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <Label className="text-sm font-medium">Distance unit</Label>
        <div className="inline-flex rounded-lg border border-border bg-card p-0.5">
          {(["km", "mi"] as const).map((u) => (
            <button
              key={u}
              type="button"
              onClick={() => setUnit(u)}
              className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                unit === u ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {u === "km" ? "Kilometers" : "Miles"}
            </button>
          ))}
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <Field label={`Distance (${unit})`}>
          <Input type="number" value={distance} onChange={(e) => setDistance(e.target.value)} className="font-mono" />
        </Field>
        <Field label="Time (HH:MM:SS or MM:SS)" hint="e.g. 25:00 or 1:05:30">
          <Input value={time} onChange={(e) => setTime(e.target.value)} className="font-mono" placeholder="25:00" />
        </Field>
      </div>

      {r ? (
        <>
          <div className="grid sm:grid-cols-2 gap-4">
            <ResultStat label="Pace per km" value={`${formatPace(r.secPerKm)} /km`} accent="primary" />
            <ResultStat label="Pace per mile" value={`${formatPace(r.secPerMi)} /mi`} />
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <ResultStat label="Speed (km/h)" value={formatNumber(r.speedKmh, 2)} />
            <ResultStat label="Speed (mph)" value={formatNumber(r.speedMph, 2)} />
          </div>
          <div className="rounded-2xl border border-border bg-card p-4">
            <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">Total time</div>
            <div className="text-lg font-bold font-mono">{formatDuration(r.totalSec)}</div>
          </div>
        </>
      ) : (
        <div className="text-center py-10 text-muted-foreground text-sm">
          Enter a distance and a valid time to compute pace.
        </div>
      )}

      <div className="rounded-xl bg-muted/30 border border-border p-4 text-sm text-muted-foreground">
        <strong className="text-foreground">Method:</strong> Pace = total_time / distance. Speed = distance / total_time.
        1 mile = 1.609344 km. Time accepts HH:MM:SS or MM:SS format.
      </div>

      <HealthDisclaimer />
    </div>
  );
}

// ============================================================
// 10. Heart Rate Zone
// ============================================================
const HR_ZONES = [
  { id: 1, name: "Zone 1 — Very Light", lo: 0.5, hi: 0.6, benefit: "Recovery, warm-up" },
  { id: 2, name: "Zone 2 — Light", lo: 0.6, hi: 0.7, benefit: "Endurance, fat burn" },
  { id: 3, name: "Zone 3 — Moderate", lo: 0.7, hi: 0.8, benefit: "Aerobic fitness" },
  { id: 4, name: "Zone 4 — Hard", lo: 0.8, hi: 0.9, benefit: "Anaerobic threshold" },
  { id: 5, name: "Zone 5 — Maximum", lo: 0.9, hi: 1.0, benefit: "Peak performance, intervals" },
] as const;

function HeartRateCalc() {
  const [age, setAge] = React.useState("30");
  const [resting, setResting] = React.useState("");

  const ageN = parseNumber(age);
  const restN = parseNumber(resting);
  const maxHr = ageN > 0 ? 220 - ageN : NaN;
  const useKarvonen = restN > 0 && Number.isFinite(maxHr);

  const zoneBpm = (lo: number, hi: number): [number, number] => {
    if (!Number.isFinite(maxHr)) return [NaN, NaN];
    if (useKarvonen) {
      const reserve = maxHr - restN;
      return [Math.round(reserve * lo + restN), Math.round(reserve * hi + restN)];
    }
    return [Math.round(maxHr * lo), Math.round(maxHr * hi)];
  };

  return (
    <div className="space-y-5">
      <div className="grid sm:grid-cols-2 gap-4">
        <Field label="Age (years)">
          <Input type="number" value={age} onChange={(e) => setAge(e.target.value)} className="font-mono" />
        </Field>
        <Field label="Resting heart rate (bpm, optional)" hint="Enables Karvonen formula">
          <Input type="number" value={resting} onChange={(e) => setResting(e.target.value)} className="font-mono" placeholder="e.g. 60" />
        </Field>
      </div>

      {Number.isFinite(maxHr) ? (
        <>
          <ResultStat
            label="Maximum heart rate"
            value={`${num(maxHr, 0)} bpm`}
            sublabel={`220 - age (${useKarvonen ? "Karvonen zones with resting HR" : "% of max HR"})`}
            accent="primary"
          />

          <div className="space-y-2">
            {HR_ZONES.map((z) => {
              const [loBpm, hiBpm] = zoneBpm(z.lo, z.hi);
              const widthPct = (z.hi - z.lo) * 100;
              const colors = ["bg-blue-500", "bg-emerald-500", "bg-yellow-500", "bg-orange-500", "bg-red-500"];
              return (
                <div key={z.id} className="rounded-xl border border-border bg-card p-3">
                  <div className="flex items-center justify-between gap-3 mb-1">
                    <div className="flex items-center gap-2">
                      <span className={`inline-block size-3 rounded-sm ${colors[z.id - 1]}`} />
                      <span className="text-sm font-medium">{z.name}</span>
                    </div>
                    <span className="text-sm font-mono font-bold">
                      {Number.isFinite(loBpm) ? `${loBpm}-${hiBpm} bpm` : "—"}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
                      <div
                        className={`h-full ${colors[z.id - 1]}`}
                        style={{ width: `${widthPct}%`, marginLeft: `${z.lo * 100}%` }}
                      />
                    </div>
                    <span className="text-[10px] text-muted-foreground w-24 text-right">{z.benefit}</span>
                  </div>
                  <div className="text-[10px] text-muted-foreground mt-0.5">
                    {Math.round(z.lo * 100)}-{Math.round(z.hi * 100)}% of max HR
                  </div>
                </div>
              );
            })}
          </div>
        </>
      ) : (
        <div className="text-center py-10 text-muted-foreground text-sm">
          Enter your age to compute heart rate zones.
        </div>
      )}

      <div className="rounded-xl bg-muted/30 border border-border p-4 text-sm text-muted-foreground">
        <strong className="text-foreground">Method:</strong> Max HR = 220 - age. Zones are 50-60%, 60-70%, 70-80%, 80-90%, 90-100% of max HR.
        When resting HR is provided, the Karvonen formula is used: target = (maxHR - restHR) x intensity + restHR.
      </div>

      <HealthDisclaimer />
    </div>
  );
}

// ============================================================
// 11. Waist-to-Hip Ratio
// ============================================================
function WaistHipCalc() {
  const [system, setSystem] = React.useState<"metric" | "imperial">("metric");
  const [sex, setSex] = React.useState<"male" | "female">("male");
  const [waist, setWaist] = React.useState("85");
  const [hip, setHip] = React.useState("95");

  const r = React.useMemo(() => {
    const w = parseNumber(waist);
    const h = parseNumber(hip);
    if (w <= 0 || h <= 0) return { whr: NaN, category: "—", level: "default" as const };
    const whr = w / h;
    let category = "—";
    let level: "success" | "warning" | "default" = "default";
    if (sex === "male") {
      if (whr < 0.9) {
        category = "Low risk";
        level = "success";
      } else if (whr < 1.0) {
        category = "Moderate risk";
        level = "warning";
      } else {
        category = "High risk";
        level = "warning";
      }
    } else {
      if (whr < 0.8) {
        category = "Low risk";
        level = "success";
      } else if (whr < 0.85) {
        category = "Moderate risk";
        level = "warning";
      } else {
        category = "High risk";
        level = "warning";
      }
    }
    return { whr, category, level };
  }, [waist, hip, sex]);

  const unitLabel = system === "metric" ? "cm" : "in";

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <Label className="text-sm font-medium">Measurement system</Label>
        <UnitToggle value={system} onChange={setSystem} />
      </div>

      <Field label="Sex">
        <SexToggle value={sex} onChange={setSex} />
      </Field>

      <div className="grid sm:grid-cols-2 gap-4">
        <Field label={`Waist (${unitLabel})`} hint="Measure at the narrowest point, just above the navel">
          <Input type="number" value={waist} onChange={(e) => setWaist(e.target.value)} className="font-mono" />
        </Field>
        <Field label={`Hip (${unitLabel})`} hint="Measure at the widest point of the hips/buttocks">
          <Input type="number" value={hip} onChange={(e) => setHip(e.target.value)} className="font-mono" />
        </Field>
      </div>

      {Number.isFinite(r.whr) ? (
        <ResultStat
          label="Waist-to-hip ratio"
          value={formatNumber(r.whr, 3)}
          sublabel={r.category}
          accent={r.level}
        />
      ) : (
        <div className="text-center py-10 text-muted-foreground text-sm">
          Enter waist and hip measurements to compute your WHR.
        </div>
      )}

      <div className="rounded-xl bg-muted/30 border border-border p-4 text-sm text-muted-foreground">
        <strong className="text-foreground">WHO risk thresholds:</strong>
        <div className="mt-1">
          Men: Low &lt; 0.90, Moderate 0.90-0.99, High &gt;= 1.00.
          <br />
          Women: Low &lt; 0.80, Moderate 0.80-0.84, High &gt;= 0.85.
        </div>
      </div>

      <HealthDisclaimer />
    </div>
  );
}

// ============================================================
// Switcher
// ============================================================
export function HealthCalcs({ calcId }: { calcId: string }) {
  switch (calcId) {
    case "bmi":
      return <BMICalc />;
    case "bmr":
      return <BMRCalc />;
    case "tdee":
      return <TDEECalc />;
    case "calorie":
      return <CalorieCalc />;
    case "ideal-weight":
      return <IdealWeightCalc />;
    case "body-fat":
      return <BodyFatCalc />;
    case "macro":
      return <MacroCalc />;
    case "water":
      return <WaterCalc />;
    case "pace":
      return <PaceCalc />;
    case "heart-rate":
      return <HeartRateCalc />;
    case "waist-hip":
      return <WaistHipCalc />;
    default:
      return null;
  }
}
