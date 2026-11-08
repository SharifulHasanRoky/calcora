"use client";

import * as React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { ArrowLeftRight, Copy, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { Field, ResultStat } from "@/components/calc-page-shell";

/**
 * Indicative exchange rates relative to 1 USD.
 * NOTE: These are approximate reference rates, not live.
 * For financial decisions, always verify with your bank or a live source.
 */
const RATES_TO_USD: Record<string, { rate: number; symbol: string; name: string }> = {
  USD: { rate: 1, symbol: "$", name: "US Dollar" },
  EUR: { rate: 0.92, symbol: "€", name: "Euro" },
  GBP: { rate: 0.79, symbol: "£", name: "British Pound" },
  INR: { rate: 83.25, symbol: "₹", name: "Indian Rupee" },
  JPY: { rate: 149.50, symbol: "¥", name: "Japanese Yen" },
  AUD: { rate: 1.52, symbol: "A$", name: "Australian Dollar" },
  CAD: { rate: 1.36, symbol: "C$", name: "Canadian Dollar" },
  CHF: { rate: 0.88, symbol: "Fr", name: "Swiss Franc" },
  CNY: { rate: 7.24, symbol: "¥", name: "Chinese Yuan" },
  BDT: { rate: 109.50, symbol: "৳", name: "Bangladeshi Taka" },
  SGD: { rate: 1.34, symbol: "S$", name: "Singapore Dollar" },
  AED: { rate: 3.67, symbol: "AED", name: "UAE Dirham" },
  MYR: { rate: 4.65, symbol: "RM", name: "Malaysian Ringgit" },
  PKR: { rate: 278.0, symbol: "₨", name: "Pakistani Rupee" },
  ZAR: { rate: 18.50, symbol: "R", name: "South African Rand" },
  NZD: { rate: 1.64, symbol: "NZ$", name: "New Zealand Dollar" },
  HKD: { rate: 7.82, symbol: "HK$", name: "Hong Kong Dollar" },
  SEK: { rate: 10.45, symbol: "kr", name: "Swedish Krona" },
  NOK: { rate: 10.75, symbol: "kr", name: "Norwegian Krone" },
  DKK: { rate: 6.85, symbol: "kr", name: "Danish Krone" },
  RUB: { rate: 92.50, symbol: "₽", name: "Russian Ruble" },
  BRL: { rate: 4.95, symbol: "R$", name: "Brazilian Real" },
  MXN: { rate: 17.20, symbol: "$", name: "Mexican Peso" },
  KRW: { rate: 1330, symbol: "₩", name: "South Korean Won" },
  TRY: { rate: 28.50, symbol: "₺", name: "Turkish Lira" },
};

export function CurrencyConverter({ preset }: { preset?: { from: string; to: string } }) {
  const [from, setFrom] = React.useState(preset?.from ?? "USD");
  const [to, setTo] = React.useState(preset?.to ?? "INR");
  const [amount, setAmount] = React.useState("100");

  const amountNum = parseFloat(amount);
  const fromRate = RATES_TO_USD[from]?.rate ?? 1;
  const toRate = RATES_TO_USD[to]?.rate ?? 1;
  // Convert: amount_in_from → USD → to
  const usd = amountNum / fromRate;
  const converted = usd * toRate;
  const rate = (1 / fromRate) * toRate; // 1 from = rate to

  const swap = () => { setFrom(to); setTo(from); };

  const formatMoney = (n: number, currency: string) => {
    if (!Number.isFinite(n)) return "—";
    const sym = RATES_TO_USD[currency]?.symbol ?? "";
    const decimals = currency === "JPY" || currency === "KRW" ? 0 : 2;
    return `${sym}${n.toLocaleString("en-US", { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}`;
  };

  return (
    <div className="space-y-4">
      <div className="rounded-xl bg-warning/10 border border-warning/30 p-3 text-xs text-muted-foreground">
        <strong className="text-foreground">Note:</strong> Rates are indicative reference values (approximate, as of late 2023). For transactions, always confirm with your bank or a live FX source.
      </div>

      <div className="rounded-2xl border border-border bg-card p-5 space-y-4">
        <Field label="Amount">
          <Input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="text-lg font-mono h-12"
          />
        </Field>

        <div className="grid sm:grid-cols-[1fr_auto_1fr] gap-3 items-end">
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">From</Label>
            <Select value={from} onValueChange={setFrom}>
              <SelectTrigger className="h-12"><SelectValue /></SelectTrigger>
              <SelectContent>
                {Object.entries(RATES_TO_USD).map(([code, info]) => (
                  <SelectItem key={code} value={code}>{code} — {info.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button variant="outline" size="icon" className="size-12 rounded-full self-center mx-auto" onClick={swap} aria-label="Swap currencies">
            <ArrowLeftRight className="size-4" />
          </Button>

          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">To</Label>
            <Select value={to} onValueChange={setTo}>
              <SelectTrigger className="h-12"><SelectValue /></SelectTrigger>
              <SelectContent>
                {Object.entries(RATES_TO_USD).map(([code, info]) => (
                  <SelectItem key={code} value={code}>{code} — {info.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="rounded-xl bg-muted/40 p-4 text-center">
          <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
            {amount || "0"} {from} =
          </div>
          <div className="text-3xl font-bold font-mono">
            {formatMoney(converted, to)}
          </div>
          <div className="text-sm text-muted-foreground mt-1">
            1 {from} = {formatMoney(rate, to)}
          </div>
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            className="flex-1"
            onClick={() => { navigator.clipboard?.writeText(formatMoney(converted, to)); toast.success("Copied"); }}
          >
            <Copy className="size-4" /> Copy result
          </Button>
        </div>
      </div>

      <div className="rounded-xl bg-muted/30 border border-border p-4 text-sm text-muted-foreground">
        <strong className="text-foreground">How it works:</strong> Conversion goes through USD as an intermediary: amount ÷ from-rate (to USD) × to-rate. Exchange rates fluctuate constantly — these are reference values for quick estimates only.
      </div>
    </div>
  );
}
