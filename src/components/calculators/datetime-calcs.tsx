"use client";

import * as React from "react";
import { Field, ResultStat, num } from "@/components/calc-page-shell";
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
import { Switch } from "@/components/ui/switch";
import { parseNumber, formatNumber } from "@/lib/math-engine";
import { toast } from "sonner";
import { Copy } from "lucide-react";

/* ------------------------------------------------------------------ */
/* Shared bits                                                          */
/* ------------------------------------------------------------------ */

const DATE_INPUT_CLASS =
  "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

const DAY_MS = 24 * 60 * 60 * 1000;

/** Parse a YYYY-MM-DD string into a local Date at noon (avoids DST drift). */
function parseDate(s: string): Date | null {
  if (!s) return null;
  const parts = s.split("-").map(Number);
  if (parts.length !== 3 || parts.some((n) => !Number.isFinite(n))) return null;
  const [y, m, d] = parts;
  const date = new Date(y, m - 1, d, 12, 0, 0, 0);
  if (Number.isNaN(date.getTime())) return null;
  return date;
}

/** Format a Date back to a YYYY-MM-DD string for <input type="date">. */
function toDateInput(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** Today's date as YYYY-MM-DD (local). */
function todayInput(): string {
  return toDateInput(new Date());
}

/** Whole-day difference between two dates (end − start), rounded. */
function daysBetween(start: Date, end: Date): number {
  return Math.round((end.getTime() - start.getTime()) / DAY_MS);
}

/** Add (or subtract) calendar months, clamping the day to month length. */
function addMonths(date: Date, n: number): Date {
  const d = new Date(date.getTime());
  const day = d.getDate();
  d.setDate(1); // neutralize month-length edge cases
  d.setMonth(d.getMonth() + n);
  const lastDay = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
  d.setDate(Math.min(day, lastDay));
  return d;
}

const WEEKDAYS = [
  "Sunday", "Monday", "Tuesday", "Wednesday",
  "Thursday", "Friday", "Saturday",
];
const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

/** Pretty long-form date, e.g. "March 14, 2025". */
function formatLong(d: Date): string {
  return `${MONTHS[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
}

/** Parse a HH:MM string into hours/minutes, or null. */
function parseTime(s: string): { h: number; m: number } | null {
  const m = /^(\d{1,2}):(\d{2})$/.exec(s.trim());
  if (!m) return null;
  const h = +m[1];
  const min = +m[2];
  if (h < 0 || h > 23 || min < 0 || min > 59) return null;
  return { h, m: min };
}

function NoteBox({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-xl bg-muted/30 border border-border p-4 text-sm text-muted-foreground">
      {children}
    </div>
  );
}

function CopyableStat({
  label,
  displayValue,
  accent,
  sublabel,
}: {
  label: string;
  displayValue: string;
  accent?: "primary" | "success" | "warning" | "default";
  sublabel?: string;
}) {
  return (
    <div className="relative">
      <Button
        variant="ghost"
        size="icon"
        className="absolute top-2 right-2 size-7 text-muted-foreground hover:text-foreground"
        onClick={() => {
          navigator.clipboard?.writeText(displayValue);
          toast.success(`${label} copied`);
        }}
        aria-label={`Copy ${label}`}
      >
        <Copy className="size-3.5" />
      </Button>
      <ResultStat label={label} value={displayValue} accent={accent} sublabel={sublabel} />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* 1. Age Calculator                                                    */
/* ------------------------------------------------------------------ */

function AgeCalc() {
  const [birth, setBirth] = React.useState("1995-06-15");

  const calc = React.useMemo(() => {
    const birthDate = parseDate(birth);
    if (!birthDate) return null;
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 12, 0, 0, 0);

    let years = today.getFullYear() - birthDate.getFullYear();
    let months = today.getMonth() - birthDate.getMonth();
    let days = today.getDate() - birthDate.getDate();

    if (days < 0) {
      months -= 1;
      const prevMonth = new Date(today.getFullYear(), today.getMonth(), 0);
      days += prevMonth.getDate();
    }
    if (months < 0) {
      years -= 1;
      months += 12;
    }
    if (years < 0) {
      return { invalid: true as const };
    }

    const totalDays = daysBetween(birthDate, today);
    const totalWeeks = Math.floor(totalDays / 7);
    const totalHours = totalDays * 24;

    // Next birthday
    let nextBday = new Date(today.getFullYear(), birthDate.getMonth(), birthDate.getDate(), 12, 0, 0, 0);
    if (nextBday.getTime() < today.getTime()) {
      nextBday = new Date(today.getFullYear() + 1, birthDate.getMonth(), birthDate.getDate(), 12, 0, 0, 0);
    }
    const daysUntilBirthday = daysBetween(today, nextBday);

    return {
      invalid: false as const,
      years,
      months,
      days,
      totalDays,
      totalWeeks,
      totalHours,
      daysUntilBirthday,
      nextBday,
    };
  }, [birth]);

  if (!calc) {
    return (
      <div className="space-y-6">
        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="Birth date">
            <input
              type="date"
              className={DATE_INPUT_CLASS}
              value={birth}
              onChange={(e) => setBirth(e.target.value)}
            />
          </Field>
        </div>
        <NoteBox>Enter a valid birth date to compute your age.</NoteBox>
      </div>
    );
  }

  if (calc.invalid) {
    return (
      <div className="space-y-6">
        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="Birth date">
            <input
              type="date"
              className={DATE_INPUT_CLASS}
              value={birth}
              onChange={(e) => setBirth(e.target.value)}
            />
          </Field>
        </div>
        <NoteBox>The birth date is in the future. Choose a date in the past.</NoteBox>
      </div>
    );
  }

  const ageStr = `${calc.years} years, ${calc.months} months, ${calc.days} days`;

  return (
    <div className="space-y-6">
      <div className="grid sm:grid-cols-2 gap-4">
        <Field label="Birth date">
          <input
            type="date"
            className={DATE_INPUT_CLASS}
            value={birth}
            onChange={(e) => setBirth(e.target.value)}
          />
        </Field>
        <div className="text-xs text-muted-foreground self-end pb-2">
          Computed as of {formatLong(new Date())}
        </div>
      </div>

      <CopyableStat label="Age" displayValue={ageStr} accent="primary" />

      <div className="grid sm:grid-cols-3 gap-4">
        <ResultStat label="Total days lived" value={num(calc.totalDays, 0)} />
        <ResultStat label="Total weeks" value={num(calc.totalWeeks, 0)} />
        <ResultStat label="Total hours" value={num(calc.totalHours, 0)} />
      </div>

      <ResultStat
        label="Next birthday"
        value={`${num(calc.daysUntilBirthday, 0)} days`}
        sublabel={formatLong(calc.nextBday)}
        accent="warning"
      />

      <NoteBox>
        <strong className="text-foreground">How it works:</strong> Years are computed by
        subtracting the birth year from the current year, then adjusting if this year&apos;s
        birthday hasn&apos;t occurred yet. Remaining months and days are derived from the
        calendar gap, borrowing days from the previous month when needed. Totals use 24-hour
        days and ignore leap seconds.
      </NoteBox>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* 2. Days Between Dates                                               */
/* ------------------------------------------------------------------ */

function DaysBetweenCalc() {
  const [start, setStart] = React.useState("2024-01-01");
  const [end, setEnd] = React.useState("2024-12-31");

  const calc = React.useMemo(() => {
    const s = parseDate(start);
    const e = parseDate(end);
    if (!s || !e) return null;
    const totalDays = daysBetween(s, e);
    const absDays = Math.abs(totalDays);
    const weeks = Math.floor(absDays / 7);
    const remainder = absDays % 7;
    const monthsApprox = absDays / 30.4375;
    const yearsApprox = absDays / 365.25;
    const sign = totalDays < 0 ? -1 : 1;
    return {
      totalDays,
      absDays,
      weeks: sign * weeks,
      remainder,
      monthsApprox,
      yearsApprox,
    };
  }, [start, end]);

  if (!calc) {
    return (
      <div className="space-y-6">
        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="Start date">
            <input type="date" className={DATE_INPUT_CLASS} value={start} onChange={(e) => setStart(e.target.value)} />
          </Field>
          <Field label="End date">
            <input type="date" className={DATE_INPUT_CLASS} value={end} onChange={(e) => setEnd(e.target.value)} />
          </Field>
        </div>
        <NoteBox>Enter two valid dates to compute the gap between them.</NoteBox>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid sm:grid-cols-2 gap-4">
        <Field label="Start date">
          <input type="date" className={DATE_INPUT_CLASS} value={start} onChange={(e) => setStart(e.target.value)} />
        </Field>
        <Field label="End date">
          <input type="date" className={DATE_INPUT_CLASS} value={end} onChange={(e) => setEnd(e.target.value)} />
        </Field>
      </div>

      <CopyableStat
        label="Total days"
        displayValue={num(calc.totalDays, 0)}
        accent="primary"
        sublabel={calc.totalDays < 0 ? "End date is before start date" : "Inclusive of one endpoint"}
      />

      <div className="grid sm:grid-cols-3 gap-4">
        <ResultStat
          label="Weeks"
          value={`${num(calc.weeks, 0)} wk`}
          sublabel={`+ ${calc.remainder} days remainder`}
        />
        <ResultStat label="Months (approx)" value={num(calc.monthsApprox, 1)} sublabel="30.4375 days each" />
        <ResultStat label="Years (approx)" value={num(calc.yearsApprox, 2)} sublabel="365.25 days each" />
      </div>

      <NoteBox>
        <strong className="text-foreground">How it works:</strong> The total day count uses
        the difference between the two dates&apos; Unix timestamps, divided by 86,400,000 ms.
        Leap years are handled automatically by the Date object. Months and years are
        approximations based on average lengths (30.4375 days / 365.25 days) — for exact
        calendar months, use the Date Add/Subtract tool.
      </NoteBox>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* 3. Date Add / Subtract                                              */
/* ------------------------------------------------------------------ */

function DateAddSubtractCalc() {
  const [start, setStart] = React.useState(todayInput());
  const [op, setOp] = React.useState<"add" | "subtract">("add");
  const [amount, setAmount] = React.useState("90");
  const [unit, setUnit] = React.useState<"days" | "weeks" | "months" | "years">("days");

  const calc = React.useMemo(() => {
    const s = parseDate(start);
    const n = parseNumber(amount);
    if (!s || !Number.isFinite(n)) return null;
    const signed = op === "add" ? n : -n;
    let result = new Date(s.getTime());
    switch (unit) {
      case "days":
        result = new Date(s.getTime() + signed * DAY_MS);
        break;
      case "weeks":
        result = new Date(s.getTime() + signed * 7 * DAY_MS);
        break;
      case "months":
        result = addMonths(s, signed);
        break;
      case "years":
        result = addMonths(s, signed * 12);
        break;
    }
    return { result, dayOfWeek: WEEKDAYS[result.getDay()] };
  }, [start, op, amount, unit]);

  if (!calc) {
    return (
      <div className="space-y-6">
        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="Start date">
            <input type="date" className={DATE_INPUT_CLASS} value={start} onChange={(e) => setStart(e.target.value)} />
          </Field>
          <Field label="Operation">
            <Select value={op} onValueChange={(v) => setOp(v as "add" | "subtract")}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="add">Add</SelectItem>
                <SelectItem value="subtract">Subtract</SelectItem>
              </SelectContent>
            </Select>
          </Field>
          <Field label="Amount">
            <Input value={amount} onChange={(e) => setAmount(e.target.value)} inputMode="decimal" />
          </Field>
          <Field label="Unit">
            <Select value={unit} onValueChange={(v) => setUnit(v as "days" | "weeks" | "months" | "years")}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="days">Days</SelectItem>
                <SelectItem value="weeks">Weeks</SelectItem>
                <SelectItem value="months">Months</SelectItem>
                <SelectItem value="years">Years</SelectItem>
              </SelectContent>
            </Select>
          </Field>
        </div>
        <NoteBox>Enter a start date and an amount to compute the resulting date.</NoteBox>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid sm:grid-cols-2 gap-4">
        <Field label="Start date">
          <input type="date" className={DATE_INPUT_CLASS} value={start} onChange={(e) => setStart(e.target.value)} />
        </Field>
        <Field label="Operation">
          <Select value={op} onValueChange={(v) => setOp(v as "add" | "subtract")}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="add">Add</SelectItem>
              <SelectItem value="subtract">Subtract</SelectItem>
            </SelectContent>
          </Select>
        </Field>
        <Field label="Amount">
          <Input value={amount} onChange={(e) => setAmount(e.target.value)} inputMode="decimal" />
        </Field>
        <Field label="Unit">
          <Select value={unit} onValueChange={(v) => setUnit(v as "days" | "weeks" | "months" | "years")}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="days">Days</SelectItem>
              <SelectItem value="weeks">Weeks</SelectItem>
              <SelectItem value="months">Months</SelectItem>
              <SelectItem value="years">Years</SelectItem>
            </SelectContent>
          </Select>
        </Field>
      </div>

      <CopyableStat
        label="Resulting date"
        displayValue={formatLong(calc.result)}
        accent="primary"
        sublabel={`${calc.dayOfWeek} · ${toDateInput(calc.result)}`}
      />

      <NoteBox>
        <strong className="text-foreground">How it works:</strong> Days and weeks use exact
        millisecond arithmetic (86,400,000 ms per day). Months and years use calendar addition:
        the month is shifted and the day is clamped to the target month&apos;s length (e.g.,
        January 31 + 1 month = February 28 or 29). Year rollover is handled automatically.
      </NoteBox>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* 4. Time Duration                                                    */
/* ------------------------------------------------------------------ */

function TimeDurationCalc() {
  const [start, setStart] = React.useState("09:00");
  const [end, setEnd] = React.useState("17:30");
  const [nextDay, setNextDay] = React.useState(false);

  const calc = React.useMemo(() => {
    const s = parseTime(start);
    const e = parseTime(end);
    if (!s || !e) return null;
    let startMin = s.h * 60 + s.m;
    let endMin = e.h * 60 + e.m;
    if (nextDay) endMin += 24 * 60;
    if (endMin < startMin) endMin += 24 * 60; // auto next-day if end < start
    const totalMin = endMin - startMin;
    const hours = Math.floor(totalMin / 60);
    const mins = totalMin % 60;
    const decimalHours = totalMin / 60;
    const autoNextDay = endMin - startMin >= 24 * 60;
    return {
      totalMin,
      hours,
      mins,
      decimalHours,
      autoNextDay,
    };
  }, [start, end, nextDay]);

  if (!calc) {
    return (
      <div className="space-y-6">
        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="Start time">
            <input type="time" className={DATE_INPUT_CLASS} value={start} onChange={(e) => setStart(e.target.value)} />
          </Field>
          <Field label="End time">
            <input type="time" className={DATE_INPUT_CLASS} value={end} onChange={(e) => setEnd(e.target.value)} />
          </Field>
        </div>
        <NoteBox>Enter two valid times in 24-hour HH:MM format.</NoteBox>
      </div>
    );
  }

  const durationStr = `${String(calc.hours).padStart(2, "0")}:${String(calc.mins).padStart(2, "0")}`;

  return (
    <div className="space-y-6">
      <div className="grid sm:grid-cols-2 gap-4">
        <Field label="Start time">
          <input type="time" className={DATE_INPUT_CLASS} value={start} onChange={(e) => setStart(e.target.value)} />
        </Field>
        <Field label="End time">
          <input type="time" className={DATE_INPUT_CLASS} value={end} onChange={(e) => setEnd(e.target.value)} />
        </Field>
      </div>

      <div className="flex items-center gap-3 rounded-xl border border-border bg-card p-4">
        <Switch checked={nextDay} onCheckedChange={setNextDay} id="next-day" />
        <Label htmlFor="next-day" className="text-sm cursor-pointer">
          End time is on the next day
        </Label>
        {calc.autoNextDay && !nextDay && (
          <span className="text-xs text-muted-foreground ml-auto">
            Auto-detected: end falls before start
          </span>
        )}
      </div>

      <CopyableStat
        label="Duration"
        displayValue={durationStr}
        accent="primary"
        sublabel={`${calc.hours}h ${calc.mins}m`}
      />

      <div className="grid sm:grid-cols-2 gap-4">
        <ResultStat label="Total minutes" value={num(calc.totalMin, 0)} />
        <ResultStat label="Total hours (decimal)" value={formatNumber(calc.decimalHours, 3)} />
      </div>

      <NoteBox>
        <strong className="text-foreground">How it works:</strong> Times are converted to
        minutes since midnight; the difference is the duration in minutes. If the end time is
        earlier than the start time and the next-day toggle is off, the calculator assumes the
        end falls on the following day and adds 24 hours automatically. The decimal-hours
        value is useful for payroll and billing systems.
      </NoteBox>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* 5. Working Days Calculator                                          */
/* ------------------------------------------------------------------ */

function WorkingDaysCalc() {
  const [start, setStart] = React.useState("2024-01-01");
  const [end, setEnd] = React.useState("2024-03-31");
  const [weekend, setWeekend] = React.useState<"sun-sat" | "fri-sat">("sun-sat");

  const calc = React.useMemo(() => {
    const s = parseDate(start);
    const e = parseDate(end);
    if (!s || !e) return null;
    // Normalize: iterate day-by-day from the earlier to the later date (inclusive).
    const lo = s.getTime() <= e.getTime() ? s : e;
    const hi = s.getTime() <= e.getTime() ? e : s;
    const weekendSet = weekend === "sun-sat" ? new Set([0, 6]) : new Set([5, 6]);
    let total = 0;
    let weekendDays = 0;
    const cursor = new Date(lo.getTime());
    while (cursor.getTime() <= hi.getTime()) {
      total += 1;
      if (weekendSet.has(cursor.getDay())) weekendDays += 1;
      cursor.setDate(cursor.getDate() + 1);
    }
    const workingDays = total - weekendDays;
    const workingWeeks = workingDays / 5;
    return { total, weekendDays, workingDays, workingWeeks };
  }, [start, end, weekend]);

  if (!calc) {
    return (
      <div className="space-y-6">
        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="Start date">
            <input type="date" className={DATE_INPUT_CLASS} value={start} onChange={(e) => setStart(e.target.value)} />
          </Field>
          <Field label="End date">
            <input type="date" className={DATE_INPUT_CLASS} value={end} onChange={(e) => setEnd(e.target.value)} />
          </Field>
          <Field label="Weekend pattern">
            <Select value={weekend} onValueChange={(v) => setWeekend(v as "sun-sat" | "fri-sat")}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="sun-sat">Sat &amp; Sun (Western)</SelectItem>
                <SelectItem value="fri-sat">Fri &amp; Sat (Middle East)</SelectItem>
              </SelectContent>
            </Select>
          </Field>
        </div>
        <NoteBox>Enter two valid dates to compute the working-day count.</NoteBox>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid sm:grid-cols-2 gap-4">
        <Field label="Start date">
          <input type="date" className={DATE_INPUT_CLASS} value={start} onChange={(e) => setStart(e.target.value)} />
        </Field>
        <Field label="End date">
          <input type="date" className={DATE_INPUT_CLASS} value={end} onChange={(e) => setEnd(e.target.value)} />
        </Field>
        <Field label="Weekend pattern">
          <Select value={weekend} onValueChange={(v) => setWeekend(v as "sun-sat" | "fri-sat")}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="sun-sat">Sat &amp; Sun (Western)</SelectItem>
              <SelectItem value="fri-sat">Fri &amp; Sat (Middle East)</SelectItem>
            </SelectContent>
          </Select>
        </Field>
      </div>

      <CopyableStat
        label="Working days"
        displayValue={num(calc.workingDays, 0)}
        accent="primary"
        sublabel="Excludes weekends; both endpoints inclusive"
      />

      <div className="grid sm:grid-cols-3 gap-4">
        <ResultStat label="Total days" value={num(calc.total, 0)} />
        <ResultStat label="Weekend days" value={num(calc.weekendDays, 0)} />
        <ResultStat label="Working weeks" value={num(calc.workingWeeks, 1)} sublabel="Assumes a 5-day week" />
      </div>

      <NoteBox>
        <strong className="text-foreground">How it works:</strong> The calculator iterates
        through every calendar day from the start date to the end date (inclusive of both
        endpoints) and checks each day&apos;s <code>getDay()</code> value (0 = Sunday,
        6 = Saturday). Days matching the selected weekend pattern are excluded; the rest are
        counted as working days. Public holidays are not subtracted — add them manually if
        needed.
      </NoteBox>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* 6. Countdown Calculator                                             */
/* ------------------------------------------------------------------ */

function CountdownCalc() {
  const now = new Date();
  const nextNewYear = new Date(now.getFullYear() + 1, 0, 1, 0, 0, 0, 0);
  const [targetDate, setTargetDate] = React.useState(toDateInput(nextNewYear));
  const [targetTime, setTargetTime] = React.useState("00:00");
  const [tick, setTick] = React.useState(0);

  React.useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(id);
  }, []);

  const target = React.useMemo(() => {
    const d = parseDate(targetDate);
    const t = parseTime(targetTime);
    if (!d || !t) return null;
    return new Date(
      d.getFullYear(),
      d.getMonth(),
      d.getDate(),
      t.h,
      t.m,
      0,
      0
    );
  }, [targetDate, targetTime]);

  const remaining = React.useMemo(() => {
    // tick is read here to force recompute every second
    void tick;
    if (!target) return null;
    const nowMs = Date.now();
    const diff = target.getTime() - nowMs;
    const isPast = diff <= 0;
    const abs = Math.abs(diff);
    const days = Math.floor(abs / DAY_MS);
    const hours = Math.floor((abs % DAY_MS) / (60 * 60 * 1000));
    const minutes = Math.floor((abs % (60 * 60 * 1000)) / (60 * 1000));
    const seconds = Math.floor((abs % (60 * 1000)) / 1000);
    return { isPast, days, hours, minutes, seconds };
  }, [target, tick]);

  if (!target || !remaining) {
    return (
      <div className="space-y-6">
        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="Target date">
            <input type="date" className={DATE_INPUT_CLASS} value={targetDate} onChange={(e) => setTargetDate(e.target.value)} />
          </Field>
          <Field label="Target time (optional)">
            <input type="time" className={DATE_INPUT_CLASS} value={targetTime} onChange={(e) => setTargetTime(e.target.value)} />
          </Field>
        </div>
        <NoteBox>Enter a valid target date and time to start the countdown.</NoteBox>
      </div>
    );
  }

  const headline = `${num(remaining.days, 0)}d ${String(remaining.hours).padStart(2, "0")}h ${String(
    remaining.minutes
  ).padStart(2, "0")}m ${String(remaining.seconds).padStart(2, "0")}s`;

  return (
    <div className="space-y-6">
      <div className="grid sm:grid-cols-2 gap-4">
        <Field label="Target date">
          <input type="date" className={DATE_INPUT_CLASS} value={targetDate} onChange={(e) => setTargetDate(e.target.value)} />
        </Field>
        <Field label="Target time (optional)">
          <input type="time" className={DATE_INPUT_CLASS} value={targetTime} onChange={(e) => setTargetTime(e.target.value)} />
        </Field>
        <div className="text-xs text-muted-foreground self-end pb-2">
          Target: {formatLong(target)} at {targetTime}
        </div>
      </div>

      <CopyableStat
        label={remaining.isPast ? "Time elapsed" : "Time remaining"}
        displayValue={headline}
        accent={remaining.isPast ? "warning" : "primary"}
        sublabel={remaining.isPast ? "Target has passed" : "Updating every second"}
      />

      <div className="grid grid-cols-4 gap-3">
        <ResultStat label="Days" value={num(remaining.days, 0)} />
        <ResultStat label="Hours" value={String(remaining.hours).padStart(2, "0")} />
        <ResultStat label="Minutes" value={String(remaining.minutes).padStart(2, "0")} />
        <ResultStat label="Seconds" value={String(remaining.seconds).padStart(2, "0")} />
      </div>

      <NoteBox>
        <strong className="text-foreground">How it works:</strong> A <code>setInterval</code>{" "}
        loop fires once per second and forces a recompute of the gap between the current time
        and the target. The interval is cleared on unmount to prevent memory leaks. When the
        target time has passed, the display switches to elapsed mode and continues counting
        upward. Times use the viewer&apos;s local timezone.
      </NoteBox>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Main switch                                                          */
/* ------------------------------------------------------------------ */

export function DateTimeCalcs({ calcId }: { calcId: string }) {
  switch (calcId) {
    case "age":
      return <AgeCalc />;
    case "days-between":
      return <DaysBetweenCalc />;
    case "date-add-subtract":
      return <DateAddSubtractCalc />;
    case "time-duration":
      return <TimeDurationCalc />;
    case "working-days":
      return <WorkingDaysCalc />;
    case "countdown":
      return <CountdownCalc />;
    default:
      return null;
  }
}
