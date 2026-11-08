"use client";

import * as React from "react";
import { Field, ResultStat } from "@/components/calc-page-shell";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Copy, ArrowLeftRight } from "lucide-react";

/* ------------------------------------------------------------------ */
/* Shared helpers                                                       */
/* ------------------------------------------------------------------ */

const NATIVE_INPUT_CLASS =
  "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

/** Convert a decimal number to its binary representation.
 *  Handles positive/negative integers and finite decimals. */
function decToBin(n: number): string {
  if (Number.isInteger(n) && n >= 0) return n.toString(2);
  if (Number.isInteger(n) && n < 0) return "-" + Math.abs(n).toString(2);
  // For fractions
  const intPart = Math.floor(Math.abs(n));
  const fracPart = Math.abs(n) - intPart;
  let bin = (n < 0 ? "-" : "") + intPart.toString(2);
  if (fracPart > 0) {
    bin += ".";
    let f = fracPart;
    let count = 0;
    while (f > 0 && count < 32) {
      f *= 2;
      bin += Math.floor(f).toString();
      f -= Math.floor(f);
      count++;
    }
  }
  return bin;
}

/** Convert a whole number (1–3999) to a Roman numeral. */
function decToRoman(num: number): string {
  if (num < 1 || num > 3999 || !Number.isInteger(num)) return "—";
  const map: [number, string][] = [
    [1000, "M"], [900, "CM"], [500, "D"], [400, "CD"],
    [100, "C"], [90, "XC"], [50, "L"], [40, "XL"],
    [10, "X"], [9, "IX"], [5, "V"], [4, "IV"], [1, "I"],
  ];
  let result = "";
  for (const [v, s] of map) {
    while (num >= v) { result += s; num -= v; }
  }
  return result;
}

/** Parse a Roman numeral string into a number, or null if invalid.
 *  The result is re-converted back to validate the canonical form. */
function romanToDec(s: string): number | null {
  s = s.toUpperCase().trim();
  if (!s) return null;
  const map: Record<string, number> = { I: 1, V: 5, X: 10, L: 50, C: 100, D: 500, M: 1000 };
  if (!/^[MDCLXVI]+$/.test(s)) return null;
  let total = 0;
  let prev = 0;
  for (let i = s.length - 1; i >= 0; i--) {
    const v = map[s[i]];
    if (!v) return null;
    if (v < prev) total -= v;
    else { total += v; prev = v; }
  }
  // Validate by reconverting
  if (decToRoman(total) !== s) return null;
  return total;
}

/** Convert text to a space-separated string of 8-bit binary bytes
 *  (uses charCodeAt so each code unit becomes one byte). */
function textToBinary(text: string): string {
  return Array.from(text).map(c => c.charCodeAt(0).toString(2).padStart(8, "0")).join(" ");
}

/** Decode a binary string (spaces ignored) into text, 8 bits per character. */
function binaryToText(bin: string): string {
  const cleaned = bin.replace(/[^01]/g, "");
  if (cleaned.length % 8 !== 0) return "";
  let result = "";
  for (let i = 0; i < cleaned.length; i += 8) {
    const byte = cleaned.slice(i, i + 8);
    result += String.fromCharCode(parseInt(byte, 2));
  }
  return result;
}

/** Format an integer with locale-aware thousands separators. */
function fmtInt(n: number): string {
  if (!Number.isFinite(n)) return "—";
  return n.toLocaleString("en-US");
}

/** Convert a Date to the value of a datetime-local input. */
function toDatetimeLocal(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/** Human-readable relative time, e.g. "3 days ago" or "in 2 hours". */
function relativeTime(diffSec: number): string {
  const abs = Math.abs(diffSec);
  const future = diffSec > 0;
  let qty: number;
  let unit: string;
  if (abs < 60) { qty = abs; unit = "second"; }
  else if (abs < 3600) { qty = Math.floor(abs / 60); unit = "minute"; }
  else if (abs < 86400) { qty = Math.floor(abs / 3600); unit = "hour"; }
  else if (abs < 86400 * 30) { qty = Math.floor(abs / 86400); unit = "day"; }
  else if (abs < 86400 * 365) { qty = Math.floor(abs / (86400 * 30)); unit = "month"; }
  else { qty = Math.floor(abs / (86400 * 365)); unit = "year"; }
  return `${future ? "in " : ""}${qty} ${unit}${qty === 1 ? "" : "s"}${future ? "" : " ago"}`;
}

function NoteBox({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-xl bg-muted/30 border border-border p-4 text-sm text-muted-foreground">
      {children}
    </div>
  );
}

function CopyButton({ value, label, disabled }: { value: string; label: string; disabled?: boolean }) {
  return (
    <Button
      variant="outline"
      size="sm"
      disabled={disabled || !value}
      onClick={() => {
        if (value) {
          navigator.clipboard?.writeText(value);
          toast.success(`${label} copied`);
        }
      }}
    >
      <Copy className="size-4" /> Copy {label.toLowerCase()}
    </Button>
  );
}

const ROMAN_TABLE: { sym: string; val: number }[] = [
  { sym: "M", val: 1000 },
  { sym: "CM", val: 900 },
  { sym: "D", val: 500 },
  { sym: "CD", val: 400 },
  { sym: "C", val: 100 },
  { sym: "XC", val: 90 },
  { sym: "L", val: 50 },
  { sym: "XL", val: 40 },
  { sym: "X", val: 10 },
  { sym: "IX", val: 9 },
  { sym: "V", val: 5 },
  { sym: "IV", val: 4 },
  { sym: "I", val: 1 },
];

/* ------------------------------------------------------------------ */
/* 1. Roman Numerals                                                    */
/* ------------------------------------------------------------------ */

function RomanNumerals() {
  const [num, setNum] = React.useState("2024");
  const [roman, setRoman] = React.useState("MMXXIV");

  const n = parseInt(num, 10);
  const numValid = Number.isInteger(n) && n >= 1 && n <= 3999;
  const romanOut = numValid ? decToRoman(n) : "—";

  const dec = romanToDec(roman);
  const romanValid = dec !== null;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <ArrowLeftRight className="size-4" />
        Bidirectional converter — switch tabs to reverse the direction.
      </div>

      <Tabs defaultValue="n2r">
        <TabsList>
          <TabsTrigger value="n2r">Number → Roman</TabsTrigger>
          <TabsTrigger value="r2n">Roman → Number</TabsTrigger>
        </TabsList>

        <TabsContent value="n2r" className="space-y-4 pt-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="Number (1 – 3999)" hint="Standard Roman numerals cover 1 to 3999.">
              <Input
                type="number"
                value={num}
                onChange={(e) => setNum(e.target.value)}
                min={1}
                max={3999}
                className="font-mono text-lg"
              />
            </Field>
            <div className="self-end pb-2 text-xs text-muted-foreground">
              {numValid ? (
                <>Try 1, 4, 9, 40, 90, 400, 900, 3999 to see subtractive pairs.</>
              ) : (
                <span className="text-destructive">Enter a whole number from 1 to 3999.</span>
              )}
            </div>
          </div>

          <ResultStat label="Roman numeral" value={romanOut} accent="primary" />

          <CopyButton value={numValid ? romanOut : ""} label="Roman numeral" />

          <NoteBox>
            <strong className="text-foreground">How it works:</strong> Roman numerals use combinations of letters from the Latin alphabet (I, V, X, L, C, D, M). The largest value is subtracted first, with subtractive pairs like 4 (IV), 9 (IX), 40 (XL), 90 (XC), 400 (CD), and 900 (CM) keeping each symbol from repeating more than three times in a row.
          </NoteBox>
        </TabsContent>

        <TabsContent value="r2n" className="space-y-4 pt-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="Roman numeral" hint="Letters I, V, X, L, C, D, M (case-insensitive).">
              <Input
                value={roman}
                onChange={(e) => setRoman(e.target.value)}
                placeholder="e.g. MMXXIV"
                className="font-mono text-lg uppercase"
              />
            </Field>
            <div className="self-end pb-2 text-xs text-muted-foreground">
              {roman.trim() === "" ? (
                <>Enter a Roman numeral to convert.</>
              ) : romanValid ? (
                <>Valid Roman numeral.</>
              ) : (
                <span className="text-destructive">Invalid Roman numeral — check the spelling and ordering.</span>
              )}
            </div>
          </div>

          {romanValid ? (
            <ResultStat label="Decimal value" value={fmtInt(dec as number)} accent="primary" />
          ) : (
            <ResultStat label="Decimal value" value="—" />
          )}

          <CopyButton value={romanValid ? String(dec) : ""} label="Decimal value" />

          <NoteBox>
            <strong className="text-foreground">How it works:</strong> Each symbol maps to a value (I=1, V=5, X=10, L=50, C=100, D=500, M=1000). Symbols are summed left to right, except when a smaller symbol precedes a larger one — then it is subtracted. CALCORA re-converts the result back to verify the input was the canonical form.
          </NoteBox>
        </TabsContent>
      </Tabs>

      {/* Reference table */}
      <div className="rounded-2xl border border-border bg-card p-5">
        <h2 className="font-semibold mb-3">Reference table</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
          {ROMAN_TABLE.map(({ sym, val }) => (
            <div
              key={sym}
              className="flex items-center justify-between rounded-lg border border-border bg-background px-3 py-2"
            >
              <span className="font-mono font-semibold text-lg">{sym}</span>
              <span className="text-sm text-muted-foreground">{val.toLocaleString()}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* 2. Decimal to Binary                                                 */
/* ------------------------------------------------------------------ */

function DecimalToBinary() {
  const [val, setVal] = React.useState("42");

  const n = parseFloat(val);
  const valid = !isNaN(n) && Number.isFinite(n);

  const bin = valid ? decToBin(n) : "—";
  const isInt = valid && Number.isInteger(n);
  const hex = isInt ? Math.abs(n).toString(16).toUpperCase() : "—";
  const oct = isInt ? Math.abs(n).toString(8) : "—";

  return (
    <div className="space-y-6">
      <div className="grid sm:grid-cols-2 gap-4">
        <Field label="Decimal number" hint="Integers and decimals. Negative values use a leading minus sign.">
          <Input
            type="number"
            step="any"
            value={val}
            onChange={(e) => setVal(e.target.value)}
            className="font-mono text-lg"
          />
        </Field>
        <div className="self-end pb-2 text-xs text-muted-foreground">
          {valid ? (
            <>
              Supports up to 32 fractional bits. Negative decimals are shown with a minus
              prefix (not two&apos;s complement).
            </>
          ) : (
            <span className="text-destructive">Enter a valid number.</span>
          )}
        </div>
      </div>

      <div className="grid sm:grid-cols-3 gap-4">
        <ResultStat label="Binary" value={bin} accent="primary" />
        <ResultStat label="Hexadecimal" value={hex} />
        <ResultStat label="Octal" value={oct} />
      </div>

      <CopyButton value={valid ? bin : ""} label="binary result" />

      <NoteBox>
        <strong className="text-foreground">How it works:</strong> The integer part is divided
        by 2 repeatedly, collecting remainders in reverse. The fractional part is multiplied
        by 2 repeatedly, collecting the integer portions. The two parts are concatenated with
        a binary point. For negative numbers CALCORA shows a leading minus sign rather than a
        fixed-width two&apos;s complement representation. Hex and octal are derived from the
        absolute integer value using <code>Number.toString(16)</code> and <code>toString(8)</code>.
      </NoteBox>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* 3. Binary to Decimal                                                 */
/* ------------------------------------------------------------------ */

function BinaryToDecimal() {
  const [val, setVal] = React.useState("101010");

  const cleaned = val.trim();
  const isValidBinary = /^[01]+$/.test(cleaned);
  const dec = isValidBinary ? parseInt(cleaned, 2) : NaN;
  const hex = isValidBinary ? dec.toString(16).toUpperCase() : "—";
  const oct = isValidBinary ? dec.toString(8) : "—";

  return (
    <div className="space-y-6">
      <div className="grid sm:grid-cols-2 gap-4">
        <Field label="Binary number" hint="Only the digits 0 and 1 are allowed.">
          <Input
            value={val}
            onChange={(e) => setVal(e.target.value)}
            placeholder="e.g. 101010"
            className="font-mono text-lg"
          />
        </Field>
        <div className="self-end pb-2 text-xs text-muted-foreground">
          {cleaned === "" ? (
            <>Enter a binary number to convert.</>
          ) : isValidBinary ? (
            <>{cleaned.length} bit{cleaned.length === 1 ? "" : "s"} of input.</>
          ) : (
            <span className="text-destructive">Invalid binary: only 0 and 1 allowed.</span>
          )}
        </div>
      </div>

      <div className="grid sm:grid-cols-3 gap-4">
        <ResultStat label="Decimal" value={isValidBinary ? fmtInt(dec) : "—"} accent="primary" />
        <ResultStat label="Hexadecimal" value={hex} />
        <ResultStat label="Octal" value={oct} />
      </div>

      <CopyButton value={isValidBinary ? String(dec) : ""} label="decimal result" />

      <NoteBox>
        <strong className="text-foreground">How it works:</strong> Each bit position contributes
        2 raised to its place value (rightmost bit = 2⁰). Summing all set bits yields the decimal
        equivalent. For example, <code>101010</code> = 32 + 8 + 2 = 42. The hex and octal forms
        are produced from the same decimal integer using <code>toString(16)</code> and{" "}
        <code>toString(8)</code>.
      </NoteBox>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* 4. Hex to Decimal                                                    */
/* ------------------------------------------------------------------ */

function HexToDecimal() {
  const [val, setVal] = React.useState("2A");

  const cleaned = val.trim().replace(/^0x/i, "").toUpperCase();
  const isValidHex = /^[0-9A-F]+$/.test(cleaned);
  const dec = isValidHex ? parseInt(cleaned, 16) : NaN;
  const bin = isValidHex ? dec.toString(2) : "—";
  const oct = isValidHex ? dec.toString(8) : "—";

  return (
    <div className="space-y-6">
      <div className="grid sm:grid-cols-2 gap-4">
        <Field label="Hexadecimal number" hint="Digits 0-9 and A-F. Optional 0x prefix.">
          <Input
            value={val}
            onChange={(e) => setVal(e.target.value)}
            placeholder="e.g. 2A or 0x2A"
            className="font-mono text-lg uppercase"
          />
        </Field>
        <div className="self-end pb-2 text-xs text-muted-foreground">
          {cleaned === "" ? (
            <>Enter a hex number to convert.</>
          ) : isValidHex ? (
            <>{cleaned.length} hex digit{cleaned.length === 1 ? "" : "s"}.</>
          ) : (
            <span className="text-destructive">Invalid hex: only 0-9 and A-F allowed.</span>
          )}
        </div>
      </div>

      <div className="grid sm:grid-cols-3 gap-4">
        <ResultStat label="Decimal" value={isValidHex ? fmtInt(dec) : "—"} accent="primary" />
        <ResultStat label="Binary" value={bin} />
        <ResultStat label="Octal" value={oct} />
      </div>

      <CopyButton value={isValidHex ? String(dec) : ""} label="decimal result" />

      <NoteBox>
        <strong className="text-foreground">How it works:</strong> Each hex digit represents
        exactly 4 bits, so a single hex digit ranges 0–15. Hex values are compact:{" "}
        <code>FF</code> in hex equals 255 in decimal and <code>11111111</code> in binary. The{" "}
        <code>0x</code> prefix is optional and stripped automatically before parsing.
      </NoteBox>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* 5. Hex to Binary                                                     */
/* ------------------------------------------------------------------ */

function HexToBinary() {
  const [val, setVal] = React.useState("2A");

  const cleaned = val.trim().replace(/^0x/i, "").toUpperCase();
  const isValidHex = /^[0-9A-F]+$/.test(cleaned);
  // Pad each hex digit to 4 bits, space-separated for readability
  const binSpaced = isValidHex
    ? cleaned
        .split("")
        .map(d => parseInt(d, 16).toString(2).padStart(4, "0"))
        .join(" ")
    : "—";
  const binContinuous = isValidHex ? binSpaced.replace(/\s/g, "") : "—";

  return (
    <div className="space-y-6">
      <div className="grid sm:grid-cols-2 gap-4">
        <Field label="Hexadecimal number" hint="Each hex digit becomes 4 bits, space-separated for readability.">
          <Input
            value={val}
            onChange={(e) => setVal(e.target.value)}
            placeholder="e.g. 2A"
            className="font-mono text-lg uppercase"
          />
        </Field>
        <div className="self-end pb-2 text-xs text-muted-foreground">
          {cleaned === "" ? (
            <>Enter a hex number to convert.</>
          ) : isValidHex ? (
            <>{cleaned.length * 4} bits total ({cleaned.length} nibble{cleaned.length === 1 ? "" : "s"}).</>
          ) : (
            <span className="text-destructive">Invalid hex: only 0-9 and A-F allowed.</span>
          )}
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <ResultStat label="Binary (per nibble)" value={binSpaced} accent="primary" />
        <ResultStat label="Binary (continuous)" value={binContinuous} />
      </div>

      <CopyButton value={isValidHex ? binContinuous : ""} label="binary result" />

      <NoteBox>
        <strong className="text-foreground">How it works:</strong> Each hexadecimal digit maps
        to a fixed 4-bit nibble (0 = 0000, F = 1111). The conversion is direct, with no
        arithmetic on the overall value, which is why hex is so commonly used as a shorthand
        for binary in low-level programming, color values, and memory addresses.
      </NoteBox>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* 6. Binary to Hex                                                     */
/* ------------------------------------------------------------------ */

function BinaryToHex() {
  const [val, setVal] = React.useState("101010");

  const cleaned = val.trim();
  const isValidBinary = /^[01]+$/.test(cleaned);
  // Group bits from the right into 4-bit chunks, padding with leading zeros
  const padded = isValidBinary ? cleaned.padStart(Math.ceil(cleaned.length / 4) * 4, "0") : "";
  const groups = isValidBinary ? padded.match(/.{4}/g) || [] : [];
  const hex = isValidBinary
    ? groups.map(g => parseInt(g, 2).toString(16).toUpperCase()).join("")
    : "—";
  const grouped = isValidBinary
    ? groups.map(g => parseInt(g, 2).toString(16).toUpperCase()).join(" ")
    : "—";

  return (
    <div className="space-y-6">
      <div className="grid sm:grid-cols-2 gap-4">
        <Field label="Binary number" hint="Bits are grouped from the right into 4-bit nibbles.">
          <Input
            value={val}
            onChange={(e) => setVal(e.target.value)}
            placeholder="e.g. 101010"
            className="font-mono text-lg"
          />
        </Field>
        <div className="self-end pb-2 text-xs text-muted-foreground">
          {cleaned === "" ? (
            <>Enter a binary number to convert.</>
          ) : isValidBinary ? (
            <>{groups.length} nibble{groups.length === 1 ? "" : "s"} after padding.</>
          ) : (
            <span className="text-destructive">Invalid binary: only 0 and 1 allowed.</span>
          )}
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <ResultStat label="Hexadecimal" value={hex} accent="primary" />
        <ResultStat label="Grouped (per nibble)" value={grouped} />
      </div>

      <CopyButton value={isValidBinary ? hex : ""} label="hex result" />

      <NoteBox>
        <strong className="text-foreground">How it works:</strong> Bits are padded on the left
        with zeros until the length is a multiple of 4, then split into 4-bit nibbles. Each
        nibble maps directly to a single hex digit (0000 → 0, 1111 → F). For example,{" "}
        <code>101010</code> pads to <code>00101010</code>, which splits into{" "}
        <code>0010 1010</code> → <code>2 A</code>.
      </NoteBox>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* 7. Octal Converter (all bases at once)                               */
/* ------------------------------------------------------------------ */

function OctalConverter() {
  const [base, setBase] = React.useState<"10" | "2" | "8" | "16">("10");
  const [val, setVal] = React.useState("42");

  const baseNames: Record<string, string> = {
    "10": "Decimal",
    "2": "Binary",
    "8": "Octal",
    "16": "Hexadecimal",
  };
  const baseCharset: Record<string, RegExp> = {
    "10": /^-?\d+$/,
    "2": /^[01]+$/,
    "8": /^[0-7]+$/,
    "16": /^[0-9a-fA-F]+$/,
  };
  const baseHint: Record<string, string> = {
    "10": "digits 0-9 (optional leading -)",
    "2": "digits 0 and 1 only",
    "8": "digits 0 through 7",
    "16": "digits 0-9 and A-F",
  };

  const cleaned = val.trim();
  const isValid = baseCharset[base].test(cleaned);
  const dec = isValid ? parseInt(cleaned.replace(/^-/, ""), parseInt(base, 10)) * (cleaned.startsWith("-") ? -1 : 1) : NaN;

  return (
    <div className="space-y-6">
      <div className="grid sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="octal-base-select" className="text-sm font-medium text-foreground">
            Input base
          </Label>
          <select
            id="octal-base-select"
            value={base}
            onChange={(e) => setBase(e.target.value as typeof base)}
            className={NATIVE_INPUT_CLASS}
          >
            <option value="10">Decimal (base 10)</option>
            <option value="2">Binary (base 2)</option>
            <option value="8">Octal (base 8)</option>
            <option value="16">Hexadecimal (base 16)</option>
          </select>
        </div>
        <Field label={`Value in ${baseNames[base].toLowerCase()}`} hint={`Allowed: ${baseHint[base]}`}>
          <Input
            value={val}
            onChange={(e) => setVal(e.target.value)}
            placeholder={`Enter a ${baseNames[base].toLowerCase()} value`}
            className="font-mono text-lg"
          />
        </Field>
      </div>

      {!isValid && cleaned !== "" && (
        <div className="text-sm text-destructive">
          Invalid input for {baseNames[base]}: only {baseHint[base]} allowed.
        </div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <ResultStat label="Decimal" value={isValid ? fmtInt(dec) : "—"} accent="primary" />
        <ResultStat label="Binary" value={isValid ? Math.abs(dec).toString(2) : "—"} />
        <ResultStat label="Octal" value={isValid ? Math.abs(dec).toString(8) : "—"} />
        <ResultStat label="Hexadecimal" value={isValid ? Math.abs(dec).toString(16).toUpperCase() : "—"} />
      </div>

      <CopyButton value={isValid ? String(dec) : ""} label="decimal result" />

      <NoteBox>
        <strong className="text-foreground">How it works:</strong> Pick the base of your input
        value, then CALCORA parses it using <code>parseInt(value, base)</code> and re-renders
        the equivalent number in all four common bases simultaneously. Base 2 uses digits 0-1,
        base 8 uses 0-7, base 10 uses 0-9, and base 16 uses 0-9 plus A-F. This is the fastest
        way to see one value represented everywhere at once.
      </NoteBox>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* 8. Text to Binary                                                    */
/* ------------------------------------------------------------------ */

function TextToBinary() {
  const [text, setText] = React.useState("Hello, CALCORA!");

  const bytes = React.useMemo(() => {
    const encoded = new TextEncoder().encode(text);
    return Array.from(encoded).map(b => b.toString(2).padStart(8, "0"));
  }, [text]);

  const spaced = bytes.join(" ");
  const continuous = bytes.join("");

  return (
    <div className="space-y-6">
      <Field label="Text to convert">
        <Textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Type or paste text here…"
          className="min-h-[120px] font-mono text-sm"
        />
      </Field>

      <div className="grid sm:grid-cols-2 gap-4">
        <ResultStat label="Characters" value={fmtInt(text.length)} />
        <ResultStat label="Bytes (UTF-8)" value={fmtInt(bytes.length)} />
      </div>

      <Field label="Binary (space-separated bytes)">
        <div className="relative">
          <Textarea
            readOnly
            value={spaced}
            className="min-h-[120px] font-mono text-sm break-all pr-10"
          />
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-2 right-2 size-7 text-muted-foreground hover:text-foreground"
            onClick={() => {
              navigator.clipboard?.writeText(spaced);
              toast.success("Binary copied");
            }}
            aria-label="Copy binary"
          >
            <Copy className="size-3.5" />
          </Button>
        </div>
      </Field>

      <Field label="Binary (continuous)">
        <div className="relative">
          <Textarea
            readOnly
            value={continuous}
            className="min-h-[80px] font-mono text-sm break-all pr-10"
          />
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-2 right-2 size-7 text-muted-foreground hover:text-foreground"
            onClick={() => {
              navigator.clipboard?.writeText(continuous);
              toast.success("Binary copied");
            }}
            aria-label="Copy continuous binary"
          >
            <Copy className="size-3.5" />
          </Button>
        </div>
      </Field>

      <NoteBox>
        <strong className="text-foreground">How it works:</strong> CALCORA encodes the text as
        UTF-8 using the browser&apos;s <code>TextEncoder</code>, then converts each byte to its
        8-bit binary representation. ASCII characters (a-z, 0-9, punctuation) fit in a single
        byte; multibyte characters such as emojis or accented letters occupy 2-4 bytes.
      </NoteBox>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* 9. Binary Translator (Binary → Text)                                 */
/* ------------------------------------------------------------------ */

function BinaryTranslator() {
  const [val, setVal] = React.useState("01001000 01101001");

  const cleaned = val.replace(/[^01]/g, "");
  const isValidLength = cleaned.length % 8 === 0;
  const isValid = cleaned.length > 0 && isValidLength;
  const text = isValid ? binaryToText(cleaned) : "";
  const bytes = isValid ? cleaned.match(/.{8}/g) || [] : [];

  return (
    <div className="space-y-6">
      <Field label="Binary input" hint="8-bit groups, space-separated or continuous.">
        <Textarea
          value={val}
          onChange={(e) => setVal(e.target.value)}
          placeholder="e.g. 01001000 01101001"
          className="min-h-[120px] font-mono text-sm"
        />
      </Field>

      {cleaned === "" ? (
        <div className="text-sm text-muted-foreground">Enter binary digits to decode.</div>
      ) : !isValidLength ? (
        <div className="text-sm text-destructive">
          Invalid input: total bit count must be a multiple of 8 (got {cleaned.length} bit
          {cleaned.length === 1 ? "" : "s"}).
        </div>
      ) : null}

      {isValid && (
        <>
          <ResultStat label="Decoded text" value={text || "(non-printable)"} accent="primary" />

          {bytes.length > 0 && (
            <div className="rounded-2xl border border-border bg-card p-4">
              <div className="text-xs text-muted-foreground uppercase tracking-wider mb-2">
                Byte breakdown
              </div>
              <div className="flex flex-wrap gap-2">
                {bytes.map((b, i) => (
                  <div
                    key={i}
                    className="rounded-md border border-border bg-background px-2 py-1 font-mono text-xs"
                  >
                    <span className="text-muted-foreground">{b}</span>
                    <span className="mx-1 text-muted-foreground">→</span>
                    <span>{text[i] || "·"}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <CopyButton value={text} label="decoded text" />
        </>
      )}

      <NoteBox>
        <strong className="text-foreground">How it works:</strong> Whitespace and any non-binary
        characters are stripped, then the remaining bits are split into 8-bit groups. Each group
        is parsed as a single byte and converted to its corresponding character via{" "}
        <code>String.fromCharCode</code>. Inputs that don&apos;t divide evenly into 8-bit bytes
        are rejected so the output is never silently truncated.
      </NoteBox>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* 10. Unix Timestamp to Date                                           */
/* ------------------------------------------------------------------ */

function TimestampToDate() {
  const [val, setVal] = React.useState(() => String(Math.floor(Date.now() / 1000)));

  const parsed = parseFloat(val);
  const valid = !isNaN(parsed) && Number.isFinite(parsed);
  // Auto-detect milliseconds: if |value| > 1e12 it's almost certainly ms, not seconds
  const isMs = valid && Math.abs(parsed) > 1e12;
  const ms = valid ? (isMs ? parsed : parsed * 1000) : NaN;
  const date = valid ? new Date(ms) : null;
  const dateValid = !!date && !isNaN(date.getTime());

  const nowMs = Date.now();
  const diffSec = valid ? Math.round((ms - nowMs) / 1000) : 0;
  const relStr = dateValid ? relativeTime(diffSec) : "—";

  return (
    <div className="space-y-6">
      <div className="grid sm:grid-cols-2 gap-4">
        <Field label="Unix timestamp" hint="Seconds or milliseconds — CALCORA auto-detects.">
          <Input
            type="number"
            step="any"
            value={val}
            onChange={(e) => setVal(e.target.value)}
            className="font-mono text-lg"
          />
        </Field>
        <div className="self-end pb-2 text-xs text-muted-foreground">
          {valid ? (
            isMs ? (
              <>
                Detected as <strong className="text-foreground">milliseconds</strong>{" "}
                (value &gt; 10¹²).
              </>
            ) : (
              <>
                Detected as <strong className="text-foreground">seconds</strong>. Multiplied
                by 1000 before rendering.
              </>
            )
          ) : (
            <span className="text-destructive">Enter a valid numeric timestamp.</span>
          )}
        </div>
      </div>

      {valid && dateValid ? (
        <>
          <ResultStat
            label="Local time"
            value={date!.toLocaleString()}
            accent="primary"
            sublabel={Intl.DateTimeFormat().resolvedOptions().timeZone}
          />

          <div className="grid sm:grid-cols-2 gap-4">
            <ResultStat label="UTC time" value={date!.toUTCString()} />
            <ResultStat label="ISO 8601" value={date!.toISOString()} />
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <ResultStat label="Seconds" value={fmtInt(Math.floor(ms / 1000))} />
            <ResultStat label="Milliseconds" value={fmtInt(Math.floor(ms))} />
            <ResultStat
              label="Day of week"
              value={date!.toLocaleDateString("en-US", { weekday: "long" })}
            />
            <ResultStat label="Relative" value={relStr} />
          </div>

          <CopyButton value={String(Math.floor(ms / 1000))} label="timestamp (seconds)" />
        </>
      ) : (
        valid && (
          <div className="text-sm text-destructive">Timestamp is out of range.</div>
        )
      )}

      <NoteBox>
        <strong className="text-foreground">How it works:</strong> A Unix timestamp counts
        seconds (or milliseconds) since 1970-01-01 00:00:00 UTC, excluding leap seconds. Values
        above 10¹² are interpreted as milliseconds because the seconds counter won&apos;t reach
        that magnitude until the year 33,658. CALCORA renders the same instant in your local
        timezone and in UTC, plus the relative distance from now.
      </NoteBox>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* 11. Date to Unix Timestamp                                           */
/* ------------------------------------------------------------------ */

function DateToTimestamp() {
  const [val, setVal] = React.useState(() => toDatetimeLocal(new Date()));

  const date = val ? new Date(val) : null;
  const valid = !!date && !isNaN(date.getTime());
  const ms = valid ? date!.getTime() : NaN;
  const sec = valid ? Math.floor(ms / 1000) : NaN;

  return (
    <div className="space-y-6">
      <div className="grid sm:grid-cols-2 gap-4">
        <Field label="Date and time" hint="Local time, used as-is for the timestamp.">
          <input
            type="datetime-local"
            value={val}
            onChange={(e) => setVal(e.target.value)}
            className={NATIVE_INPUT_CLASS}
            step="1"
          />
        </Field>
        <div className="self-end pb-2 text-xs text-muted-foreground">
          {valid ? (
            <>
              Interpreted as local time ({Intl.DateTimeFormat().resolvedOptions().timeZone}).
            </>
          ) : (
            <span className="text-destructive">Pick a valid date and time.</span>
          )}
        </div>
      </div>

      {valid && (
        <>
          <ResultStat
            label="Unix timestamp (seconds)"
            value={fmtInt(sec)}
            accent="primary"
          />

          <div className="grid sm:grid-cols-2 gap-4">
            <ResultStat label="Milliseconds" value={fmtInt(ms)} />
            <ResultStat label="UTC" value={date!.toUTCString()} />
          </div>

          <CopyButton value={String(sec)} label="timestamp (seconds)" />
        </>
      )}

      <NoteBox>
        <strong className="text-foreground">How it works:</strong> A{" "}
        <code>datetime-local</code> input returns a string in the user&apos;s local timezone.
        CALCORA converts that to a JavaScript <code>Date</code> object — which stores instants
        as milliseconds since the Unix epoch — and reports both the second and millisecond forms
        of the timestamp. Use the second value for most APIs; the millisecond value matches{" "}
        <code>Date.now()</code> and JavaScript&apos;s native <code>Date.getTime()</code>.
      </NoteBox>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Router                                                               */
/* ------------------------------------------------------------------ */

export function NumberSystemTools({ calcId }: { calcId: string }) {
  switch (calcId) {
    case "roman-numerals": return <RomanNumerals />;
    case "decimal-to-binary": return <DecimalToBinary />;
    case "binary-to-decimal": return <BinaryToDecimal />;
    case "hex-to-decimal": return <HexToDecimal />;
    case "hex-to-binary": return <HexToBinary />;
    case "binary-to-hex": return <BinaryToHex />;
    case "octal-converter": return <OctalConverter />;
    case "text-to-binary": return <TextToBinary />;
    case "binary-translator": return <BinaryTranslator />;
    case "timestamp-to-date": return <TimestampToDate />;
    case "date-to-timestamp": return <DateToTimestamp />;
    default: return null;
  }
}
