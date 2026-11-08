"use client";

import * as React from "react";
import { CalcPageShell, Field, ResultStat, money, num } from "@/components/calc-page-shell";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { parseNumber, formatNumber, evaluate } from "@/lib/math-engine";
import { toast } from "sonner";
import { Copy, Plus, X, ArrowLeftRight } from "lucide-react";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";

import { UniversalCalculator } from "@/components/calculators/universal-calculator";
import { MultiCalcWorkspace } from "@/components/calculators/multi-calc-workspace";
import { GraphingCalculator } from "@/components/calculators/graphing-calculator";
import { StatisticsCalculator } from "@/components/calculators/statistics-calculator";
import { FractionCalculator } from "@/components/calculators/fraction-calculator";
import { UniversalConverter } from "@/components/calculators/universal-converter";
import { TaxCalculators } from "@/components/calculators/tax-calculators";
import {
  PercentageCalcs,
} from "@/components/calculators/math-calcs";
import {
  FinanceCalcs,
} from "@/components/calculators/finance-calcs";
import {
  HealthCalcs,
} from "@/components/calculators/health-calcs";
import {
  DateTimeCalcs,
} from "@/components/calculators/datetime-calcs";
import {
  BusinessCalcs,
} from "@/components/calculators/business-calcs";
import {
  EngineeringCalcs,
} from "@/components/calculators/engineering-calcs";
import {
  EverydayCalcs,
} from "@/components/calculators/everyday-calcs";

export function CalcRouter({ calcId }: { calcId: string }) {
  // Universal / multi / graphing / stats / fraction
  if (calcId === "universal") return <CalcPageShell calcId={calcId}><UniversalCalculator /></CalcPageShell>;
  if (calcId === "multi-calc") return <CalcPageShell calcId={calcId}><MultiCalcWorkspace /></CalcPageShell>;
  if (calcId === "graphing") return <CalcPageShell calcId={calcId}><GraphingCalculator /></CalcPageShell>;
  if (calcId === "statistics") return <CalcPageShell calcId={calcId}><StatisticsCalculator /></CalcPageShell>;
  if (calcId === "fraction") return <CalcPageShell calcId={calcId}><FractionCalculator /></CalcPageShell>;
  if (calcId === "conv-universal") return <CalcPageShell calcId={calcId}><UniversalConverter /></CalcPageShell>;

  // Tax
  if (calcId.startsWith("tax-") || calcId === "vat" || calcId === "gst" || calcId === "sales-tax" || calcId === "capital-gains") {
    return <CalcPageShell calcId={calcId}><TaxCalculators calcId={calcId} /></CalcPageShell>;
  }

  // Math
  const mathIds = ["percentage","percentage-increase","percentage-decrease","percentage-difference","ratio","average","rounding","sqrt","exponent","scientific-notation","gcd-lcm","prime","scientific","quadratic","logarithm","trigonometry","factorial","permutation-combination","std-dev-variance"];
  if (mathIds.includes(calcId)) {
    return <CalcPageShell calcId={calcId}><MathCalcSwitcher calcId={calcId} /></CalcPageShell>;
  }

  // Finance
  const financeIds = ["loan","mortgage","emi","compound-interest","simple-interest","savings","investment","roi","cagr","profit-margin","markup","discount","future-value","present-value","break-even","salary","retirement","net-worth"];
  if (financeIds.includes(calcId)) {
    return <CalcPageShell calcId={calcId}><FinanceCalcSwitcher calcId={calcId} /></CalcPageShell>;
  }

  // Health
  const healthIds = ["bmi","bmr","tdee","calorie","ideal-weight","body-fat","macro","water","pace","heart-rate","waist-hip"];
  if (healthIds.includes(calcId)) {
    return <CalcPageShell calcId={calcId}><HealthCalcSwitcher calcId={calcId} /></CalcPageShell>;
  }

  // Date & time
  const dtIds = ["age","days-between","date-add-subtract","time-duration","working-days","countdown"];
  if (dtIds.includes(calcId)) {
    return <CalcPageShell calcId={calcId}><DateTimeCalcSwitcher calcId={calcId} /></CalcPageShell>;
  }

  // Converter (specific)
  const convIds = ["conv-length","conv-weight","conv-temperature","conv-area","conv-volume","conv-speed","conv-time","conv-data","conv-energy","conv-pressure","conv-power","conv-fuel","conv-angle","conv-cooking"];
  if (convIds.includes(calcId)) {
    return <CalcPageShell calcId={calcId}><UniversalConverter initialCategory={calcId.replace("conv-","")} /></CalcPageShell>;
  }

  // Business / marketing
  const bizIds = ["profit","business-valuation","inventory-turnover","shipping","cpm","cpc","ctr","cpa","roas","conversion-rate","cac","ltv"];
  if (bizIds.includes(calcId)) {
    return <CalcPageShell calcId={calcId}><BusinessCalcSwitcher calcId={calcId} /></CalcPageShell>;
  }

  // Engineering
  const engIds = ["concrete","paint","flooring","ohms-law","electricity-bill","fuel-cost"];
  if (engIds.includes(calcId)) {
    return <CalcPageShell calcId={calcId}><EngineeringCalcSwitcher calcId={calcId} /></CalcPageShell>;
  }

  // Everyday
  const everydayIds = ["tip","split-bill","unit-price","savings-goal","subscription"];
  if (everydayIds.includes(calcId)) {
    return <CalcPageShell calcId={calcId}><EverydayCalcSwitcher calcId={calcId} /></CalcPageShell>;
  }

  // Fallback
  return (
    <div className="text-center py-16">
      <p className="text-muted-foreground">Calculator "{calcId}" is coming soon.</p>
    </div>
  );
}

// Lightweight switcher wrappers — they delegate to the implementation files.
function MathCalcSwitcher({ calcId }: { calcId: string }) {
  // PercentageCalcs handles all math calcIds (basic + scientific).
  return <PercentageCalcs calcId={calcId} />;
}
function FinanceCalcSwitcher({ calcId }: { calcId: string }) {
  return <FinanceCalcs calcId={calcId} />;
}
function HealthCalcSwitcher({ calcId }: { calcId: string }) {
  return <HealthCalcs calcId={calcId} />;
}
function DateTimeCalcSwitcher({ calcId }: { calcId: string }) {
  return <DateTimeCalcs calcId={calcId} />;
}
function BusinessCalcSwitcher({ calcId }: { calcId: string }) {
  return <BusinessCalcs calcId={calcId} />;
}
function EngineeringCalcSwitcher({ calcId }: { calcId: string }) {
  return <EngineeringCalcs calcId={calcId} />;
}
function EverydayCalcSwitcher({ calcId }: { calcId: string }) {
  return <EverydayCalcs calcId={calcId} />;
}
