"use client";

import * as React from "react";
import { CalcPageShell } from "@/components/calc-page-shell";

import { UniversalCalculator } from "@/components/calculators/universal-calculator";
import { MultiCalcWorkspace } from "@/components/calculators/multi-calc-workspace";
import { GraphingCalculator } from "@/components/calculators/graphing-calculator";
import { StatisticsCalculator } from "@/components/calculators/statistics-calculator";
import { FractionCalculator } from "@/components/calculators/fraction-calculator";
import { UniversalConverter, type PresetPair } from "@/components/calculators/universal-converter";
import { TaxCalculators } from "@/components/calculators/tax-calculators";
import { PercentageCalcs } from "@/components/calculators/math-calcs";
import { FinanceCalcs } from "@/components/calculators/finance-calcs";
import { FinanceCalcsExtra } from "@/components/calculators/finance-calcs-extra";
import { HealthCalcs } from "@/components/calculators/health-calcs";
import { DateTimeCalcs } from "@/components/calculators/datetime-calcs";
import { BusinessCalcs } from "@/components/calculators/business-calcs";
import { EngineeringCalcs } from "@/components/calculators/engineering-calcs";
import { EverydayCalcs } from "@/components/calculators/everyday-calcs";
import { TextTools } from "@/components/calculators/text-tools";
import { TimerTools } from "@/components/calculators/timer-tools";
import { NumberSystemTools } from "@/components/calculators/number-system-tools";
import { DevTools } from "@/components/calculators/dev-tools";
import { RandomTools } from "@/components/calculators/random-tools";
import { CurrencyConverter } from "@/components/calculators/currency-converter";

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

  // Math (basic + scientific)
  const mathIds = ["percentage","percentage-increase","percentage-decrease","percentage-difference","percentage-change","ratio","average","rounding","sqrt","exponent","scientific-notation","gcd-lcm","prime","scientific","quadratic","logarithm","trigonometry","factorial","permutation-combination","std-dev-variance"];
  if (mathIds.includes(calcId)) {
    return <CalcPageShell calcId={calcId}><PercentageCalcs calcId={calcId} /></CalcPageShell>;
  }

  // Finance (extra: SIP, FD, salary-hourly)
  const financeExtraIds = ["sip","fd","salary-hourly"];
  if (financeExtraIds.includes(calcId)) {
    return <CalcPageShell calcId={calcId}><FinanceCalcsExtra calcId={calcId} /></CalcPageShell>;
  }

  // Finance (original)
  const financeIds = ["loan","mortgage","emi","compound-interest","simple-interest","savings","investment","roi","cagr","profit-margin","markup","discount","future-value","present-value","break-even","salary","retirement","net-worth"];
  if (financeIds.includes(calcId)) {
    return <CalcPageShell calcId={calcId}><FinanceCalcs calcId={calcId} /></CalcPageShell>;
  }

  // Health
  const healthIds = ["bmi","bmr","tdee","calorie","ideal-weight","body-fat","macro","water","pace","heart-rate","waist-hip"];
  if (healthIds.includes(calcId)) {
    return <CalcPageShell calcId={calcId}><HealthCalcs calcId={calcId} /></CalcPageShell>;
  }

  // Date & time (original)
  const dtIds = ["age","days-between","date-add-subtract","time-duration","working-days","countdown"];
  if (dtIds.includes(calcId)) {
    return <CalcPageShell calcId={calcId}><DateTimeCalcs calcId={calcId} /></CalcPageShell>;
  }

  // Timer tools (new)
  const timerIds = ["online-timer","online-stopwatch","world-clock","timezone-converter","unix-timestamp","birthday-countdown","days-until"];
  if (timerIds.includes(calcId)) {
    return <CalcPageShell calcId={calcId}><TimerTools calcId={calcId} /></CalcPageShell>;
  }

  // Converter (specific category pages)
  const convIds = ["conv-length","conv-weight","conv-temperature","conv-area","conv-volume","conv-speed","conv-time","conv-data","conv-energy","conv-pressure","conv-power","conv-fuel","conv-angle","conv-cooking"];
  if (convIds.includes(calcId)) {
    return <CalcPageShell calcId={calcId}><UniversalConverter initialCategory={calcId.replace("conv-","")} /></CalcPageShell>;
  }

  // Dedicated unit conversion pages (route to UniversalConverter with preset)
  const unitPresets: Record<string, PresetPair> = {
    "celsius-to-fahrenheit": { category: "temperature", from: "C", to: "F" },
    "fahrenheit-to-celsius": { category: "temperature", from: "F", to: "C" },
    "kg-to-lbs": { category: "weight", from: "kg", to: "lb" },
    "lbs-to-kg": { category: "weight", from: "lb", to: "kg" },
    "km-to-miles": { category: "length", from: "km", to: "mi" },
    "miles-to-km": { category: "length", from: "mi", to: "km" },
    "inches-to-cm": { category: "length", from: "in", to: "cm" },
    "cm-to-inches": { category: "length", from: "cm", to: "in" },
    "meters-to-feet": { category: "length", from: "m", to: "ft" },
    "feet-to-meters": { category: "length", from: "ft", to: "m" },
    "liters-to-gallons": { category: "volume", from: "l", to: "gal" },
    "gallons-to-liters": { category: "volume", from: "gal", to: "l" },
    "ounces-to-grams": { category: "weight", from: "oz", to: "g" },
    "grams-to-pounds": { category: "weight", from: "g", to: "lb" },
    "mph-to-kmh": { category: "speed", from: "mph", to: "kmh" },
    "kmh-to-mph": { category: "speed", from: "kmh", to: "mph" },
    "mm-to-inches": { category: "length", from: "mm", to: "in" },
    "yards-to-meters": { category: "length", from: "yd", to: "m" },
    "cm-to-feet": { category: "length", from: "cm", to: "ft" },
    "cm-to-mm": { category: "length", from: "cm", to: "mm" },
    "inches-to-mm": { category: "length", from: "in", to: "mm" },
  };
  if (calcId in unitPresets) {
    return <CalcPageShell calcId={calcId}><UniversalConverter preset={unitPresets[calcId]} /></CalcPageShell>;
  }

  // Currency converter (universal + specific pairs)
  const currencyPairPresets: Record<string, { from: string; to: string }> = {
    "usd-to-inr": { from: "USD", to: "INR" },
    "inr-to-usd": { from: "INR", to: "USD" },
    "eur-to-usd": { from: "EUR", to: "USD" },
    "usd-to-eur": { from: "USD", to: "EUR" },
    "usd-to-cad": { from: "USD", to: "CAD" },
    "usd-to-gbp": { from: "USD", to: "GBP" },
    "gbp-to-eur": { from: "GBP", to: "EUR" },
    "usd-to-jpy": { from: "USD", to: "JPY" },
    "aud-to-usd": { from: "AUD", to: "USD" },
  };
  if (calcId === "currency-converter") {
    return <CalcPageShell calcId={calcId}><CurrencyConverter /></CalcPageShell>;
  }
  if (calcId in currencyPairPresets) {
    return <CalcPageShell calcId={calcId}><CurrencyConverter preset={currencyPairPresets[calcId]} /></CalcPageShell>;
  }

  // Business / marketing
  const bizIds = ["profit","business-valuation","inventory-turnover","shipping","cpm","cpc","ctr","cpa","roas","conversion-rate","cac","ltv"];
  if (bizIds.includes(calcId)) {
    return <CalcPageShell calcId={calcId}><BusinessCalcs calcId={calcId} /></CalcPageShell>;
  }

  // Engineering
  const engIds = ["concrete","paint","flooring","ohms-law","electricity-bill","fuel-cost","watts-to-amps"];
  if (engIds.includes(calcId)) {
    return <CalcPageShell calcId={calcId}><EngineeringCalcs calcId={calcId} /></CalcPageShell>;
  }

  // Everyday
  const everydayIds = ["tip","split-bill","unit-price","savings-goal","subscription"];
  if (everydayIds.includes(calcId)) {
    return <CalcPageShell calcId={calcId}><EverydayCalcs calcId={calcId} /></CalcPageShell>;
  }

  // Text tools
  const textIds = ["word-counter","character-counter","lorem-ipsum","number-to-words"];
  if (textIds.includes(calcId)) {
    return <CalcPageShell calcId={calcId}><TextTools calcId={calcId} /></CalcPageShell>;
  }

  // Number system tools
  const nsIds = ["roman-numerals","decimal-to-binary","binary-to-decimal","hex-to-decimal","hex-to-binary","binary-to-hex","octal-converter","text-to-binary","binary-translator","timestamp-to-date","date-to-timestamp"];
  if (nsIds.includes(calcId)) {
    return <CalcPageShell calcId={calcId}><NumberSystemTools calcId={calcId} /></CalcPageShell>;
  }

  // Developer tools
  const devIds = ["css-clamp","aspect-ratio","subnet-calculator","cidr-calculator"];
  if (devIds.includes(calcId)) {
    return <CalcPageShell calcId={calcId}><DevTools calcId={calcId} /></CalcPageShell>;
  }

  // Random & utility
  const utilIds = ["random-number","dice-roller","coin-flip","tally-counter"];
  if (utilIds.includes(calcId)) {
    return <CalcPageShell calcId={calcId}><RandomTools calcId={calcId} /></CalcPageShell>;
  }

  // Fallback
  return (
    <div className="text-center py-16">
      <p className="text-muted-foreground">Calculator "{calcId}" is coming soon.</p>
    </div>
  );
}
