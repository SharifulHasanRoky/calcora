"use client";

import * as React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { ArrowLeftRight, Copy } from "lucide-react";
import { toast } from "sonner";

type UnitDef = { id: string; name: string; symbol: string; toBase: (v: number) => number; fromBase: (v: number) => number };
type CategoryDef = { id: string; name: string; baseUnit: string; primaryFrom: string; primaryTo: string; units: UnitDef[] };

const linear = (factor: number) => ({
  toBase: (v: number) => v * factor,
  fromBase: (v: number) => v / factor,
});

const CATEGORIES: CategoryDef[] = [
  {
    id: "length", name: "Length", baseUnit: "m", primaryFrom: "m", primaryTo: "ft",
    units: [
      { id: "nm", name: "Nanometer", symbol: "nm", ...linear(1e-9) },
      { id: "um", name: "Micrometer", symbol: "µm", ...linear(1e-6) },
      { id: "mm", name: "Millimeter", symbol: "mm", ...linear(0.001) },
      { id: "cm", name: "Centimeter", symbol: "cm", ...linear(0.01) },
      { id: "m", name: "Meter", symbol: "m", ...linear(1) },
      { id: "km", name: "Kilometer", symbol: "km", ...linear(1000) },
      { id: "in", name: "Inch", symbol: "in", ...linear(0.0254) },
      { id: "ft", name: "Foot", symbol: "ft", ...linear(0.3048) },
      { id: "yd", name: "Yard", symbol: "yd", ...linear(0.9144) },
      { id: "mi", name: "Mile", symbol: "mi", ...linear(1609.344) },
      { id: "nmi", name: "Nautical Mile", symbol: "nmi", ...linear(1852) },
      { id: "ly", name: "Light Year", symbol: "ly", ...linear(9.4607e15) },
    ],
  },
  {
    id: "weight", name: "Weight / Mass", baseUnit: "kg", primaryFrom: "kg", primaryTo: "lb",
    units: [
      { id: "mg", name: "Milligram", symbol: "mg", ...linear(1e-6) },
      { id: "g", name: "Gram", symbol: "g", ...linear(0.001) },
      { id: "kg", name: "Kilogram", symbol: "kg", ...linear(1) },
      { id: "t", name: "Metric Ton", symbol: "t", ...linear(1000) },
      { id: "oz", name: "Ounce", symbol: "oz", ...linear(0.028349523125) },
      { id: "lb", name: "Pound", symbol: "lb", ...linear(0.45359237) },
      { id: "st", name: "Stone", symbol: "st", ...linear(6.35029318) },
      { id: "ton-us", name: "US Ton", symbol: "ton", ...linear(907.18474) },
      { id: "ct", name: "Carat", symbol: "ct", ...linear(0.0002) },
    ],
  },
  {
    id: "temperature", name: "Temperature", baseUnit: "C", primaryFrom: "C", primaryTo: "F",
    units: [
      { id: "C", name: "Celsius", symbol: "°C", toBase: (v) => v, fromBase: (v) => v },
      { id: "F", name: "Fahrenheit", symbol: "°F", toBase: (v) => (v - 32) * 5 / 9, fromBase: (v) => v * 9 / 5 + 32 },
      { id: "K", name: "Kelvin", symbol: "K", toBase: (v) => v - 273.15, fromBase: (v) => v + 273.15 },
      { id: "R", name: "Rankine", symbol: "°R", toBase: (v) => (v - 491.67) * 5 / 9, fromBase: (v) => (v + 273.15) * 9 / 5 },
    ],
  },
  {
    id: "area", name: "Area", baseUnit: "m²", primaryFrom: "m2", primaryTo: "ft2",
    units: [
      { id: "mm2", name: "Square Millimeter", symbol: "mm²", ...linear(1e-6) },
      { id: "cm2", name: "Square Centimeter", symbol: "cm²", ...linear(1e-4) },
      { id: "m2", name: "Square Meter", symbol: "m²", ...linear(1) },
      { id: "ha", name: "Hectare", symbol: "ha", ...linear(10000) },
      { id: "km2", name: "Square Kilometer", symbol: "km²", ...linear(1e6) },
      { id: "in2", name: "Square Inch", symbol: "in²", ...linear(0.00064516) },
      { id: "ft2", name: "Square Foot", symbol: "ft²", ...linear(0.09290304) },
      { id: "yd2", name: "Square Yard", symbol: "yd²", ...linear(0.83612736) },
      { id: "acre", name: "Acre", symbol: "ac", ...linear(4046.8564224) },
      { id: "mi2", name: "Square Mile", symbol: "mi²", ...linear(2589988.110336) },
    ],
  },
  {
    id: "volume", name: "Volume", baseUnit: "L", primaryFrom: "l", primaryTo: "gal",
    units: [
      { id: "ml", name: "Milliliter", symbol: "mL", ...linear(0.001) },
      { id: "l", name: "Liter", symbol: "L", ...linear(1) },
      { id: "m3", name: "Cubic Meter", symbol: "m³", ...linear(1000) },
      { id: "cm3", name: "Cubic Centimeter", symbol: "cm³", ...linear(0.001) },
      { id: "in3", name: "Cubic Inch", symbol: "in³", ...linear(0.016387064) },
      { id: "ft3", name: "Cubic Foot", symbol: "ft³", ...linear(28.316846592) },
      { id: "tsp", name: "Teaspoon (US)", symbol: "tsp", ...linear(0.00492892159375) },
      { id: "tbsp", name: "Tablespoon (US)", symbol: "tbsp", ...linear(0.01478676478125) },
      { id: "floz", name: "Fluid Ounce (US)", symbol: "fl oz", ...linear(0.0295735295625) },
      { id: "cup", name: "Cup (US)", symbol: "cup", ...linear(0.2365882365) },
      { id: "pt", name: "Pint (US)", symbol: "pt", ...linear(0.473176473) },
      { id: "qt", name: "Quart (US)", symbol: "qt", ...linear(0.946352946) },
      { id: "gal", name: "Gallon (US)", symbol: "gal", ...linear(3.785411784) },
      { id: "gal-uk", name: "Gallon (UK)", symbol: "gal UK", ...linear(4.54609) },
    ],
  },
  {
    id: "speed", name: "Speed", baseUnit: "m/s", primaryFrom: "kmh", primaryTo: "mph",
    units: [
      { id: "mps", name: "Meter / second", symbol: "m/s", ...linear(1) },
      { id: "kmh", name: "Kilometer / hour", symbol: "km/h", ...linear(0.277777778) },
      { id: "mph", name: "Mile / hour", symbol: "mph", ...linear(0.44704) },
      { id: "fts", name: "Foot / second", symbol: "ft/s", ...linear(0.3048) },
      { id: "knot", name: "Knot", symbol: "kn", ...linear(0.514444444) },
      { id: "mach", name: "Mach (at sea level)", symbol: "Ma", ...linear(340.29) },
    ],
  },
  {
    id: "time", name: "Time", baseUnit: "s", primaryFrom: "h", primaryTo: "min",
    units: [
      { id: "ns", name: "Nanosecond", symbol: "ns", ...linear(1e-9) },
      { id: "us", name: "Microsecond", symbol: "µs", ...linear(1e-6) },
      { id: "ms", name: "Millisecond", symbol: "ms", ...linear(0.001) },
      { id: "s", name: "Second", symbol: "s", ...linear(1) },
      { id: "min", name: "Minute", symbol: "min", ...linear(60) },
      { id: "h", name: "Hour", symbol: "h", ...linear(3600) },
      { id: "day", name: "Day", symbol: "d", ...linear(86400) },
      { id: "week", name: "Week", symbol: "wk", ...linear(604800) },
      { id: "month", name: "Month (avg)", symbol: "mo", ...linear(2629800) },
      { id: "year", name: "Year (365d)", symbol: "yr", ...linear(31557600) },
      { id: "decade", name: "Decade", symbol: "dec", ...linear(315576000) },
      { id: "century", name: "Century", symbol: "c", ...linear(3155760000) },
    ],
  },
  {
    id: "data", name: "Data Storage", baseUnit: "B", primaryFrom: "MB", primaryTo: "GB",
    units: [
      { id: "bit", name: "Bit", symbol: "bit", ...linear(0.125) },
      { id: "B", name: "Byte", symbol: "B", ...linear(1) },
      { id: "KB", name: "Kilobyte (decimal)", symbol: "KB", ...linear(1000) },
      { id: "KiB", name: "Kibibyte", symbol: "KiB", ...linear(1024) },
      { id: "MB", name: "Megabyte (decimal)", symbol: "MB", ...linear(1e6) },
      { id: "MiB", name: "Mebibyte", symbol: "MiB", ...linear(1048576) },
      { id: "GB", name: "Gigabyte (decimal)", symbol: "GB", ...linear(1e9) },
      { id: "GiB", name: "Gibibyte", symbol: "GiB", ...linear(1073741824) },
      { id: "TB", name: "Terabyte (decimal)", symbol: "TB", ...linear(1e12) },
      { id: "TiB", name: "Tebibyte", symbol: "TiB", ...linear(1099511627776) },
      { id: "PB", name: "Petabyte", symbol: "PB", ...linear(1e15) },
    ],
  },
  {
    id: "energy", name: "Energy", baseUnit: "J", primaryFrom: "kcal", primaryTo: "kJ",
    units: [
      { id: "J", name: "Joule", symbol: "J", ...linear(1) },
      { id: "kJ", name: "Kilojoule", symbol: "kJ", ...linear(1000) },
      { id: "cal", name: "Calorie (small)", symbol: "cal", ...linear(4.184) },
      { id: "kcal", name: "Kilocalorie", symbol: "kcal", ...linear(4184) },
      { id: "Wh", name: "Watt-hour", symbol: "Wh", ...linear(3600) },
      { id: "kWh", name: "Kilowatt-hour", symbol: "kWh", ...linear(3600000) },
      { id: "eV", name: "Electronvolt", symbol: "eV", ...linear(1.602176634e-19) },
      { id: "BTU", name: "BTU", symbol: "BTU", ...linear(1055.05585262) },
      { id: "ftlb", name: "Foot-pound", symbol: "ft·lb", ...linear(1.3558179483314) },
    ],
  },
  {
    id: "pressure", name: "Pressure", baseUnit: "Pa", primaryFrom: "bar", primaryTo: "psi",
    units: [
      { id: "Pa", name: "Pascal", symbol: "Pa", ...linear(1) },
      { id: "kPa", name: "Kilopascal", symbol: "kPa", ...linear(1000) },
      { id: "MPa", name: "Megapascal", symbol: "MPa", ...linear(1e6) },
      { id: "bar", name: "Bar", symbol: "bar", ...linear(1e5) },
      { id: "mbar", name: "Millibar", symbol: "mbar", ...linear(100) },
      { id: "atm", name: "Atmosphere", symbol: "atm", ...linear(101325) },
      { id: "psi", name: "Pound / square inch", symbol: "psi", ...linear(6894.757293168) },
      { id: "torr", name: "Torr", symbol: "Torr", ...linear(133.322368421) },
      { id: "mmHg", name: "mm of Mercury", symbol: "mmHg", ...linear(133.322387415) },
    ],
  },
  {
    id: "power", name: "Power", baseUnit: "W", primaryFrom: "kW", primaryTo: "hp-mech",
    units: [
      { id: "mW", name: "Milliwatt", symbol: "mW", ...linear(0.001) },
      { id: "W", name: "Watt", symbol: "W", ...linear(1) },
      { id: "kW", name: "Kilowatt", symbol: "kW", ...linear(1000) },
      { id: "MW", name: "Megawatt", symbol: "MW", ...linear(1e6) },
      { id: "hp-mech", name: "Horsepower (mechanical)", symbol: "hp", ...linear(745.69987158227) },
      { id: "hp-metric", name: "Horsepower (metric)", symbol: "PS", ...linear(735.49875) },
      { id: "BTUh", name: "BTU / hour", symbol: "BTU/h", ...linear(0.29307107) },
      { id: "ftlbls", name: "Foot-pound / second", symbol: "ft·lb/s", ...linear(1.3558179483314) },
    ],
  },
  {
    id: "fuel", name: "Fuel Economy", baseUnit: "km/L", primaryFrom: "kml", primaryTo: "L100km",
    units: [
      { id: "kml", name: "Kilometer / liter", symbol: "km/L", ...linear(1) },
      { id: "L100km", name: "Liter / 100 km", symbol: "L/100km", toBase: (v) => v === 0 ? 0 : 100 / v, fromBase: (v) => v === 0 ? 0 : 100 / v },
      { id: "mpg-us", name: "Miles / gallon (US)", symbol: "mpg", toBase: (v) => v * 0.425143707, fromBase: (v) => v / 0.425143707 },
      { id: "mpg-uk", name: "Miles / gallon (UK)", symbol: "mpg UK", toBase: (v) => v * 0.35400604, fromBase: (v) => v / 0.35400604 },
    ],
  },
  {
    id: "angle", name: "Angle", baseUnit: "rad", primaryFrom: "deg", primaryTo: "rad",
    units: [
      { id: "rad", name: "Radian", symbol: "rad", ...linear(1) },
      { id: "deg", name: "Degree", symbol: "°", ...linear(Math.PI / 180) },
      { id: "grad", name: "Gradian", symbol: "grad", ...linear(Math.PI / 200) },
      { id: "arcmin", name: "Arcminute", symbol: "′", ...linear(Math.PI / 10800) },
      { id: "arcsec", name: "Arcsecond", symbol: "″", ...linear(Math.PI / 648000) },
      { id: "turn", name: "Turn", symbol: "turn", ...linear(2 * Math.PI) },
    ],
  },
  {
    id: "cooking", name: "Cooking", baseUnit: "mL", primaryFrom: "cup", primaryTo: "ml",
    units: [
      { id: "ml", name: "Milliliter", symbol: "mL", ...linear(1) },
      { id: "tsp", name: "Teaspoon", symbol: "tsp", ...linear(5) },
      { id: "tbsp", name: "Tablespoon", symbol: "tbsp", ...linear(15) },
      { id: "cup", name: "Cup", symbol: "cup", ...linear(240) },
      { id: "floz", name: "Fluid Ounce", symbol: "fl oz", ...linear(30) },
      { id: "pt", name: "Pint", symbol: "pt", ...linear(473) },
      { id: "qt", name: "Quart", symbol: "qt", ...linear(946) },
      { id: "stick", name: "Butter stick (US)", symbol: "stick", ...linear(118.294) },
    ],
  },
];

export interface PresetPair {
  category: string;
  from: string;
  to: string;
}

export function UniversalConverter({ initialCategory, preset }: { initialCategory?: string; preset?: PresetPair }) {
  const initial = (preset?.category && CATEGORIES.find(c => c.id === preset.category))
    ? preset.category
    : (initialCategory && CATEGORIES.find(c => c.id === initialCategory))
    ? initialCategory
    : "length";
  const [catId, setCatId] = React.useState(initial);
  const cat = CATEGORIES.find(c => c.id === catId) ?? CATEGORIES[0];
  const [fromUnit, setFromUnit] = React.useState(preset?.from ?? cat.primaryFrom);
  const [toUnit, setToUnit] = React.useState(preset?.to ?? cat.primaryTo);
  const [fromValue, setFromValue] = React.useState("1");

  // Reset units when category changes
  React.useEffect(() => {
    if (preset && catId === preset.category) {
      setFromUnit(preset.from);
      setToUnit(preset.to);
    } else {
      setFromUnit(cat.primaryFrom);
      setToUnit(cat.primaryTo);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [catId]);

  const fromU = cat.units.find(u => u.id === fromUnit) ?? cat.units[0];
  const toU = cat.units.find(u => u.id === toUnit) ?? cat.units[1] ?? cat.units[0];

  const fromNum = parseFloat(fromValue);
  const baseValue = isNaN(fromNum) ? NaN : fromU.toBase(fromNum);
  const toValueNum = isNaN(baseValue) || !Number.isFinite(baseValue) ? NaN : toU.fromBase(baseValue);
  const toValue: string = isNaN(toValueNum) ? "" : String(toValueNum);

  const swap = () => {
    setFromUnit(toU.id);
    setToUnit(fromU.id);
    if (toValue !== "" && !isNaN(parseFloat(toValue))) setFromValue(toValue);
  };

  const formatResult = (v: number) => {
    if (!Number.isFinite(v)) return "—";
    if (Math.abs(v) >= 1e9 || (Math.abs(v) < 1e-6 && v !== 0)) return v.toExponential(6);
    const r = parseFloat(v.toPrecision(10));
    return r.toString();
  };

  // All units table
  const allConversions = cat.units.map(u => ({
    unit: u,
    value: isNaN(baseValue) ? NaN : u.fromBase(baseValue),
  }));

  return (
    <div className="space-y-4">
      {/* Category selector */}
      <div className="flex flex-wrap gap-2">
        {CATEGORIES.map(c => (
          <button
            key={c.id}
            onClick={() => setCatId(c.id)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${
              catId === c.id ? "bg-primary text-primary-foreground border-primary" : "bg-card border-border text-muted-foreground hover:text-foreground hover:border-primary/40"
            }`}
          >
            {c.name}
          </button>
        ))}
      </div>

      {/* Two-way converter */}
      <div className="rounded-2xl border border-border bg-card p-4 sm:p-5">
        <div className="grid sm:grid-cols-[1fr_auto_1fr] gap-3 items-end">
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">From</Label>
            <Input
              type="number"
              value={fromValue}
              onChange={(e) => setFromValue(e.target.value)}
              className="text-lg font-mono h-12"
            />
            <Select value={fromUnit} onValueChange={setFromUnit}>
              <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
              <SelectContent>
                {cat.units.map(u => <SelectItem key={u.id} value={u.id}>{u.name} ({u.symbol})</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <Button variant="outline" size="icon" className="size-12 rounded-full self-center mx-auto" onClick={swap} aria-label="Swap units">
            <ArrowLeftRight className="size-4" />
          </Button>

          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">To</Label>
            <div className="text-lg font-mono h-12 px-3 rounded-xl border border-border bg-muted/30 flex items-center font-bold">
              {toValue === "" ? "—" : formatResult(parseFloat(toValue))}
            </div>
            <Select value={toUnit} onValueChange={setToUnit}>
              <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
              <SelectContent>
                {cat.units.map(u => <SelectItem key={u.id} value={u.id}>{u.name} ({u.symbol})</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-border text-sm text-muted-foreground break-all">
          <span className="font-mono">{fromValue || "0"} {fromU.symbol}</span>
          {" = "}
          <span className="font-mono font-bold text-foreground">{toValue === "" ? "—" : formatResult(parseFloat(toValue))} {toU.symbol}</span>
          <Button
            variant="ghost"
            size="sm"
            className="ml-2 h-7"
            onClick={() => { navigator.clipboard?.writeText(formatResult(parseFloat(toValue))); toast.success("Copied"); }}
          >
            <Copy className="size-3.5" /> Copy
          </Button>
        </div>
      </div>

      {/* All units table */}
      <div className="rounded-2xl border border-border bg-card overflow-hidden">
        <div className="px-4 py-3 border-b border-border">
          <h3 className="font-semibold text-sm">All {cat.name.toLowerCase()} conversions</h3>
        </div>
        <div className="max-h-80 overflow-y-auto">
          {allConversions.map(({ unit, value }) => (
            <div key={unit.id} className="flex items-center justify-between px-4 py-2 border-b border-border/50 hover:bg-accent/20">
              <span className="text-sm">{unit.name} <span className="text-muted-foreground text-xs">({unit.symbol})</span></span>
              <span className="font-mono text-sm font-medium">{isNaN(value) ? "—" : formatResult(value)}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
