"use client";

import * as React from "react";
import { Field, ResultStat } from "@/components/calc-page-shell";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Play, Pause, RotateCcw, Flag } from "lucide-react";
import { cn } from "@/lib/utils";

/* ------------------------------------------------------------------ */
/* Shared bits                                                          */
/* ------------------------------------------------------------------ */

/** Native date/datetime input styling matching the shadcn Input look. */
const DATE_INPUT_CLASS =
  "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

const DAY_MS = 24 * 60 * 60 * 1000;

function NoteBox({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-xl bg-muted/30 border border-border p-4 text-sm text-muted-foreground">
      {children}
    </div>
  );
}

/** Pad a number to 2 digits. */
function pad2(n: number): string {
  return String(Math.max(0, Math.floor(n))).padStart(2, "0");
}

/** Pad a number to 3 digits. */
function pad3(n: number): string {
  return String(Math.max(0, Math.floor(n))).padStart(3, "0");
}

/** Common IANA time zones for the timezone converter. */
const COMMON_TIMEZONES: string[] = [
  "UTC",
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
  "America/Toronto",
  "America/Sao_Paulo",
  "Europe/London",
  "Europe/Paris",
  "Europe/Berlin",
  "Europe/Moscow",
  "Africa/Cairo",
  "Asia/Dubai",
  "Asia/Kolkata",
  "Asia/Dhaka",
  "Asia/Singapore",
  "Asia/Tokyo",
  "Australia/Sydney",
  "Pacific/Auckland",
];

/* ------------------------------------------------------------------ */
/* 1. Online Timer (countdown)                                         */
/* ------------------------------------------------------------------ */

const TIMER_PRESETS: { label: string; seconds: number }[] = [
  { label: "1 min", seconds: 60 },
  { label: "5 min", seconds: 5 * 60 },
  { label: "10 min", seconds: 10 * 60 },
  { label: "25 min (Pomodoro)", seconds: 25 * 60 },
  { label: "60 min", seconds: 60 * 60 },
];

function playBeep() {
  try {
    const ctx = new (window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext })
        .webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.value = 880;
    osc.type = "sine";
    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 1.5);
    osc.start();
    osc.stop(ctx.currentTime + 1.5);
  } catch {
    /* ignore */
  }
}

function formatHMS(totalSeconds: number): string {
  const s = Math.max(0, Math.floor(totalSeconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  return `${pad2(h)}:${pad2(m)}:${pad2(sec)}`;
}

function OnlineTimer() {
  // Initial (configured) duration in seconds.
  const [hours, setHours] = React.useState(0);
  const [minutes, setMinutes] = React.useState(5);
  const [seconds, setSeconds] = React.useState(0);

  // Total duration the current countdown started from (for progress bar).
  const [totalDuration, setTotalDuration] = React.useState(5 * 60);
  // Remaining seconds, tracked with a target end timestamp so drift is avoided.
  const [remaining, setRemaining] = React.useState(5 * 60);
  const [running, setRunning] = React.useState(false);
  const [finished, setFinished] = React.useState(false);

  const endRef = React.useRef<number | null>(null);
  const intervalRef = React.useRef<ReturnType<typeof setInterval> | null>(null);

  const cleanup = React.useCallback(() => {
    if (intervalRef.current !== null) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  React.useEffect(() => {
    return cleanup;
  }, [cleanup]);

  // When user edits inputs while not running, sync remaining.
  React.useEffect(() => {
    if (!running) {
      const total =
        Math.max(0, hours) * 3600 +
        Math.max(0, minutes) * 60 +
        Math.max(0, seconds);
      setTotalDuration(Math.max(0, total));
      setRemaining(Math.max(0, total));
      setFinished(false);
    }
  }, [hours, minutes, seconds, running]);

  const tick = React.useCallback(() => {
    if (endRef.current === null) return;
    const diff = Math.ceil((endRef.current - Date.now()) / 1000);
    if (diff <= 0) {
      setRemaining(0);
      setRunning(false);
      setFinished(true);
      endRef.current = null;
      cleanup();
      playBeep();
      if (typeof navigator !== "undefined" && "vibrate" in navigator) {
        try {
          navigator.vibrate([200, 100, 200, 100, 400]);
        } catch {
          /* ignore */
        }
      }
      toast.info("Time's up!");
    } else {
      setRemaining(diff);
    }
  }, [cleanup]);

  const start = () => {
    if (remaining <= 0) {
      toast.error("Set a duration greater than zero first.");
      return;
    }
    setRunning(true);
    setFinished(false);
    endRef.current = Date.now() + remaining * 1000;
    cleanup();
    intervalRef.current = setInterval(tick, 1000);
  };

  const pause = () => {
    setRunning(false);
    cleanup();
    if (endRef.current !== null) {
      const diff = Math.ceil((endRef.current - Date.now()) / 1000);
      setRemaining(Math.max(0, diff));
      endRef.current = null;
    }
  };

  const reset = () => {
    cleanup();
    setRunning(false);
    setFinished(false);
    endRef.current = null;
    const total =
      Math.max(0, hours) * 3600 +
      Math.max(0, minutes) * 60 +
      Math.max(0, seconds);
    setTotalDuration(Math.max(0, total));
    setRemaining(Math.max(0, total));
  };

  const applyPreset = (sec: number) => {
    cleanup();
    setRunning(false);
    setFinished(false);
    endRef.current = null;
    const h = Math.floor(sec / 3600);
    const m = Math.floor((sec % 3600) / 60);
    const s = sec % 60;
    setHours(h);
    setMinutes(m);
    setSeconds(s);
    setTotalDuration(sec);
    setRemaining(sec);
  };

  const progress =
    totalDuration > 0 ? Math.max(0, (remaining / totalDuration) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Big display */}
      <div className="rounded-2xl border border-border bg-card p-6 sm:p-8 text-center">
        <div
          className={cn(
            "font-mono font-bold tabular-nums tracking-tight",
            "text-5xl sm:text-7xl",
            finished ? "text-warning" : "text-foreground"
          )}
          aria-live="polite"
        >
          {formatHMS(remaining)}
        </div>
        {finished && (
          <div className="mt-3 text-sm font-medium text-warning">
            Time&apos;s up!
          </div>
        )}

        {/* Progress bar */}
        <div className="mt-6 h-2 w-full rounded-full bg-muted overflow-hidden">
          <div
            className={cn(
              "h-full rounded-full transition-[width] duration-500 ease-linear",
              finished
                ? "bg-warning"
                : running
                ? "bg-primary"
                : "bg-primary/60"
            )}
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-wrap items-center justify-center gap-2">
        {!running ? (
          <Button onClick={start} disabled={remaining <= 0}>
            <Play className="size-4" /> Start
          </Button>
        ) : (
          <Button onClick={pause} variant="secondary">
            <Pause className="size-4" /> Pause
          </Button>
        )}
        <Button onClick={reset} variant="outline">
          <RotateCcw className="size-4" /> Reset
        </Button>
      </div>

      {/* Inputs */}
      <div className="grid sm:grid-cols-3 gap-4">
        <Field label="Hours">
          <Input
            type="number"
            min={0}
            max={23}
            value={hours}
            onChange={(e) =>
              setHours(Math.max(0, Math.min(23, Number(e.target.value) || 0)))
            }
            disabled={running}
          />
        </Field>
        <Field label="Minutes">
          <Input
            type="number"
            min={0}
            max={59}
            value={minutes}
            onChange={(e) =>
              setMinutes(Math.max(0, Math.min(59, Number(e.target.value) || 0)))
            }
            disabled={running}
          />
        </Field>
        <Field label="Seconds">
          <Input
            type="number"
            min={0}
            max={59}
            value={seconds}
            onChange={(e) =>
              setSeconds(Math.max(0, Math.min(59, Number(e.target.value) || 0)))
            }
            disabled={running}
          />
        </Field>
      </div>

      {/* Presets */}
      <div>
        <div className="text-sm font-medium text-foreground mb-2">
          Quick presets
        </div>
        <div className="flex flex-wrap gap-2">
          {TIMER_PRESETS.map((p) => (
            <Button
              key={p.label}
              variant="outline"
              size="sm"
              onClick={() => applyPreset(p.seconds)}
              disabled={running}
            >
              {p.label}
            </Button>
          ))}
        </div>
      </div>

      <NoteBox>
        Set a duration or pick a preset, then press Start. When the countdown
        reaches zero a beep will play and the device will vibrate (if supported).
        Pausing preserves the remaining time so you can resume.
      </NoteBox>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* 2. Online Stopwatch                                                 */
/* ------------------------------------------------------------------ */

interface Lap {
  index: number;
  split: number; // ms for this lap
  total: number; // ms total elapsed at this lap
}

function formatStopwatch(ms: number): string {
  const totalMs = Math.max(0, Math.floor(ms));
  const h = Math.floor(totalMs / 3_600_000);
  const m = Math.floor((totalMs % 3_600_000) / 60_000);
  const s = Math.floor((totalMs % 60_000) / 1000);
  const milli = totalMs % 1000;
  return `${pad2(h)}:${pad2(m)}:${pad2(s)}.${pad3(milli)}`;
}

function formatLap(ms: number): string {
  const totalMs = Math.max(0, Math.floor(ms));
  const m = Math.floor(totalMs / 60_000);
  const s = Math.floor((totalMs % 60_000) / 1000);
  const milli = totalMs % 1000;
  return `${pad2(m)}:${pad2(s)}.${pad3(milli)}`;
}

function OnlineStopwatch() {
  const [elapsed, setElapsed] = React.useState(0); // accumulated ms when paused
  const [display, setDisplay] = React.useState(0); // current visible ms
  const [running, setRunning] = React.useState(false);
  const [laps, setLaps] = React.useState<Lap[]>([]);

  const startRef = React.useRef<number | null>(null); // timestamp started at
  const baseRef = React.useRef<number>(0); // accumulated ms at start
  const rafRef = React.useRef<number | null>(null);
  const lastLapTotalRef = React.useRef<number>(0);

  const cancelRaf = React.useCallback(() => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
  }, []);

  React.useEffect(() => {
    return cancelRaf;
  }, [cancelRaf]);

  // Use a ref so the loop can schedule itself without referencing its own
  // declaration before it is initialized (which trips the
  // react-hooks/immutability rule).
  const loopRef = React.useRef<() => void>(() => {});
  React.useEffect(() => {
    loopRef.current = () => {
      if (startRef.current === null) return;
      const now = performance.now();
      setDisplay(baseRef.current + (now - startRef.current));
      rafRef.current = requestAnimationFrame(loopRef.current);
    };
  }, []);

  const start = () => {
    setRunning(true);
    startRef.current = performance.now();
    baseRef.current = elapsed;
    rafRef.current = requestAnimationFrame(loopRef.current);
  };

  const pause = () => {
    setRunning(false);
    cancelRaf();
    if (startRef.current !== null) {
      const now = performance.now();
      const newElapsed = baseRef.current + (now - startRef.current);
      setElapsed(newElapsed);
      setDisplay(newElapsed);
    }
    startRef.current = null;
  };

  const reset = () => {
    cancelRaf();
    setRunning(false);
    setElapsed(0);
    setDisplay(0);
    setLaps([]);
    startRef.current = null;
    baseRef.current = 0;
    lastLapTotalRef.current = 0;
  };

  const recordLap = () => {
    const currentTotal = display;
    const split = currentTotal - lastLapTotalRef.current;
    lastLapTotalRef.current = currentTotal;
    setLaps((prev) => [
      { index: prev.length + 1, split, total: currentTotal },
      ...prev,
    ]);
  };

  // Best & worst lap (excluding trivial 0-split laps).
  const validLaps = laps.filter((l) => l.index > 0);
  let bestLap: Lap | null = null;
  let worstLap: Lap | null = null;
  if (validLaps.length >= 2) {
    bestLap = validLaps.reduce((a, b) => (b.split < a.split ? b : a));
    worstLap = validLaps.reduce((a, b) => (b.split > a.split ? b : a));
  }

  return (
    <div className="space-y-6">
      {/* Big display */}
      <div className="rounded-2xl border border-border bg-card p-6 sm:p-8 text-center">
        <div
          className="font-mono font-bold tabular-nums tracking-tight text-5xl sm:text-7xl text-foreground"
          aria-live="polite"
        >
          {formatStopwatch(display)}
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-wrap items-center justify-center gap-2">
        {!running ? (
          <Button onClick={start}>
            <Play className="size-4" /> Start
          </Button>
        ) : (
          <Button onClick={pause} variant="secondary">
            <Pause className="size-4" /> Pause
          </Button>
        )}
        <Button onClick={recordLap} variant="outline" disabled={!running}>
          <Flag className="size-4" /> Lap
        </Button>
        <Button onClick={reset} variant="outline">
          <RotateCcw className="size-4" /> Reset
        </Button>
      </div>

      {/* Laps */}
      {laps.length > 0 && (
        <div className="rounded-2xl border border-border bg-card">
          <div className="flex items-center justify-between px-4 py-3 border-b border-border">
            <span className="text-sm font-semibold">Laps ({laps.length})</span>
            <span className="text-xs text-muted-foreground">
              Split / Total
            </span>
          </div>
          <div className="max-h-64 overflow-y-auto divide-y divide-border">
            {laps.map((lap) => {
              const isBest = bestLap && lap.index === bestLap.index;
              const isWorst = worstLap && lap.index === worstLap.index;
              return (
                <div
                  key={lap.index}
                  className="flex items-center justify-between px-4 py-2.5 text-sm"
                >
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-muted-foreground w-12">
                      #{lap.index}
                    </span>
                    {isBest && (
                      <span className="text-xs font-medium text-success">
                        fastest
                      </span>
                    )}
                    {isWorst && (
                      <span className="text-xs font-medium text-warning">
                        slowest
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-4 font-mono tabular-nums">
                    <span className="text-muted-foreground">
                      {formatLap(lap.split)}
                    </span>
                    <span className="text-foreground font-medium">
                      {formatLap(lap.total)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <NoteBox>
        Uses requestAnimationFrame for smooth millisecond updates. Pause and
        resume preserves the elapsed total. Press Lap during a run to record
        split times; the fastest and slowest laps (when you have at least two)
        are highlighted.
      </NoteBox>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* 3. World Clock                                                      */
/* ------------------------------------------------------------------ */

const CITIES: { name: string; tz: string }[] = [
  { name: "New York", tz: "America/New_York" },
  { name: "London", tz: "Europe/London" },
  { name: "Tokyo", tz: "Asia/Tokyo" },
  { name: "Sydney", tz: "Australia/Sydney" },
  { name: "Dubai", tz: "Asia/Dubai" },
  { name: "Singapore", tz: "Asia/Singapore" },
  { name: "Los Angeles", tz: "America/Los_Angeles" },
  { name: "Paris", tz: "Europe/Paris" },
  { name: "Mumbai", tz: "Asia/Kolkata" },
  { name: "Dhaka", tz: "Asia/Dhaka" },
  { name: "Toronto", tz: "America/Toronto" },
  { name: "Berlin", tz: "Europe/Berlin" },
];

interface CityClock {
  name: string;
  tz: string;
  time: string;
  date: string;
  hour: number;
  isDay: boolean;
}

function buildCityClock(name: string, tz: string, now: Date): CityClock {
  const time = new Intl.DateTimeFormat("en-US", {
    timeZone: tz,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).format(now);
  const date = new Intl.DateTimeFormat("en-US", {
    timeZone: tz,
    weekday: "short",
    month: "short",
    day: "numeric",
  }).format(now);
  const hourStr = new Intl.DateTimeFormat("en-US", {
    timeZone: tz,
    hour: "2-digit",
    hour12: false,
  }).format(now);
  const hour = parseInt(hourStr, 10);
  const isDay = hour >= 6 && hour < 18;
  return { name, tz, time, date, hour: Number.isFinite(hour) ? hour : 0, isDay };
}

function WorldClock() {
  const [now, setNow] = React.useState<Date | null>(null);

  React.useEffect(() => {
    setNow(new Date());
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const clocks: CityClock[] = CITIES.map((c) =>
    buildCityClock(c.name, c.tz, now ?? new Date(0))
  );

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {clocks.map((c) => (
          <div
            key={c.tz}
            className={cn(
              "rounded-2xl border p-4 flex flex-col gap-2",
              c.isDay
                ? "border-warning/30 bg-warning/5"
                : "border-indigo-400/30 bg-indigo-500/5"
            )}
          >
            <div className="flex items-start justify-between">
              <div>
                <div className="font-semibold text-foreground">{c.name}</div>
                <div className="text-xs text-muted-foreground">{c.date}</div>
              </div>
              <span
                className={cn(
                  "inline-flex size-8 items-center justify-center rounded-full",
                  c.isDay
                    ? "bg-warning/15 text-warning"
                    : "bg-indigo-500/15 text-indigo-300"
                )}
                title={c.isDay ? "Daytime" : "Nighttime"}
                aria-label={c.isDay ? "Daytime" : "Nighttime"}
              >
                {/* Sun icon */}
                {c.isDay ? (
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="size-4"
                  >
                    <circle cx="12" cy="12" r="4" />
                    <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
                  </svg>
                ) : (
                  /* Moon icon */
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="size-4"
                  >
                    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                  </svg>
                )}
              </span>
            </div>
            <div className="font-mono tabular-nums text-2xl font-bold text-foreground">
              {c.time}
            </div>
            <div className="text-xs text-muted-foreground">
              {c.isDay ? "Daytime" : "Nighttime"}
            </div>
          </div>
        ))}
      </div>

      <NoteBox>
        Times are computed with Intl.DateTimeFormat using each city&apos;s IANA
        timezone. The sun or moon icon shows whether it is currently daytime
        (06:00 - 17:59) or nighttime in that city. Updates every second.
      </NoteBox>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* 4. Timezone Converter                                               */
/* ------------------------------------------------------------------ */

function timezoneLabel(tz: string): string {
  // Show UTC offset alongside the zone id.
  try {
    const now = new Date();
    const fmt = new Intl.DateTimeFormat("en-US", {
      timeZone: tz,
      timeZoneName: "shortOffset",
    });
    const parts = fmt.formatToParts(now);
    const offsetPart = parts.find(
      (p) => p.type === "timeZoneName" && p.value
    );
    return `${tz} (${offsetPart?.value ?? ""})`;
  } catch {
    return tz;
  }
}

function toDatetimeLocalValue(d: Date): string {
  // YYYY-MM-DDTHH:MM in local time
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  return `${y}-${m}-${day}T${hh}:${mm}`;
}

function TimezoneConverter() {
  const [sourceTz, setSourceTz] = React.useState<string>(
    () => Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC"
  );
  const [targetTz, setTargetTz] = React.useState<string>("UTC");
  const [sourceValue, setSourceValue] = React.useState<string>(() =>
    toDatetimeLocalValue(new Date())
  );

  // Parse the source datetime-local value as if it were wall-clock in sourceTz,
  // then convert to a UTC ms timestamp.
  const sourceMs = React.useMemo<number | null>(() => {
    if (!sourceValue) return null;
    // The datetime-local value is "YYYY-MM-DDTHH:MM".
    const m = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/.exec(sourceValue);
    if (!m) return null;
    const [, yStr, moStr, dStr, hStr, miStr] = m;
    const y = Number(yStr);
    const mo = Number(moStr) - 1;
    const d = Number(dStr);
    const h = Number(hStr);
    const mi = Number(miStr);
    if (
      !Number.isFinite(y) ||
      !Number.isFinite(mo) ||
      !Number.isFinite(d) ||
      !Number.isFinite(h) ||
      !Number.isFinite(mi)
    ) {
      return null;
    }
    // Strategy: format the wall-clock time in the source tz, then find the UTC
    // instant whose time-in-source-tz matches. We do this by trying both the
    // as-if-local parse and adjusting for the offset difference.
    // Build a Date assuming the wall-clock is in UTC, then look up the source tz
    // offset for that instant and shift.
    const asIfUtc = Date.UTC(y, mo, d, h, mi, 0);
    // Offset of sourceTz at that instant (in minutes, sign per JS conventions).
    let sourceOffsetMin = 0;
    try {
      const sourceFormatted = new Intl.DateTimeFormat("en-US", {
        timeZone: sourceTz,
        timeZoneName: "shortOffset",
      }).formatToParts(new Date(asIfUtc));
      const offPart = sourceFormatted.find((p) => p.type === "timeZoneName");
      const offMatch = /GMT([+-]\d{1,2})(?::(\d{2}))?/.exec(
        offPart?.value ?? ""
      );
      if (offMatch) {
        const sign = offMatch[1].startsWith("-") ? -1 : 1;
        const hh = parseInt(offMatch[1].replace("+", "").replace("-", ""), 10);
        const mm = offMatch[2] ? parseInt(offMatch[2], 10) : 0;
        sourceOffsetMin = sign * (hh * 60 + mm);
      }
    } catch {
      /* ignore */
    }
    // If wall-clock "10:00 sourceTz" was treated as "10:00 UTC", the real UTC
    // instant is (asIfUtc - sourceOffsetMin*60_000).
    return asIfUtc - sourceOffsetMin * 60_000;
  }, [sourceValue, sourceTz]);

  const formatted = (tz: string, opts: Intl.DateTimeFormatOptions) => {
    if (sourceMs === null || !Number.isFinite(sourceMs)) return "—";
    try {
      return new Intl.DateTimeFormat("en-US", { timeZone: tz, ...opts }).format(
        new Date(sourceMs)
      );
    } catch {
      return "—";
    }
  };

  const fullDateOpts: Intl.DateTimeFormatOptions = {
    weekday: "short",
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  };

  const swap = () => {
    setSourceTz(targetTz);
    setTargetTz(sourceTz);
  };

  return (
    <div className="space-y-6">
      <div className="grid sm:grid-cols-2 gap-4">
        <Field label="Source timezone">
          <Select value={sourceTz} onValueChange={setSourceTz}>
            <SelectTrigger>
              <SelectValue placeholder="Select timezone" />
            </SelectTrigger>
            <SelectContent className="max-h-72">
              {COMMON_TIMEZONES.map((tz) => (
                <SelectItem key={tz} value={tz}>
                  {timezoneLabel(tz)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
        <Field label="Source date & time">
          <input
            type="datetime-local"
            className={DATE_INPUT_CLASS}
            value={sourceValue}
            onChange={(e) => setSourceValue(e.target.value)}
          />
        </Field>
      </div>

      <div className="flex justify-center">
        <Button variant="outline" size="sm" onClick={swap}>
          <RotateCcw className="size-4" /> Swap source / target
        </Button>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <Field label="Target timezone">
          <Select value={targetTz} onValueChange={setTargetTz}>
            <SelectTrigger>
              <SelectValue placeholder="Select timezone" />
            </SelectTrigger>
            <SelectContent className="max-h-72">
              {COMMON_TIMEZONES.map((tz) => (
                <SelectItem key={tz} value={tz}>
                  {timezoneLabel(tz)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
        <Field label="UTC equivalent" hint="Same moment, expressed as UTC">
          <div className="flex h-9 items-center rounded-md border border-input bg-muted/30 px-3 text-sm font-mono">
            {formatted("UTC", fullDateOpts)}
          </div>
        </Field>
      </div>

      <ResultStat
        label={`Time in ${targetTz}`}
        value={formatted(targetTz, fullDateOpts)}
        accent="primary"
        sublabel={`Source: ${formatted(sourceTz, fullDateOpts)}`}
      />

      <NoteBox>
        Enter a wall-clock time in the source timezone and the equivalent time
        in the target timezone (and UTC) is computed using Intl.DateTimeFormat.
        Daylight-saving rules for each zone are applied automatically based on
        the chosen date.
      </NoteBox>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* 5. Unix Timestamp Converter                                         */
/* ------------------------------------------------------------------ */

function UnixTimestamp() {
  const [mode, setMode] = React.useState<"to-date" | "to-ts">("to-date");
  const [tsInput, setTsInput] = React.useState<string>(() =>
    String(Math.floor(Date.now() / 1000))
  );
  const [dateInput, setDateInput] = React.useState<string>(() =>
    toDatetimeLocalValue(new Date())
  );
  const [live, setLive] = React.useState<number>(Date.now());

  React.useEffect(() => {
    const id = setInterval(() => setLive(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  // Timestamp -> Date
  const tsNum = Number(tsInput);
  const tsValid = tsInput.trim() !== "" && Number.isFinite(tsNum);
  const tsMs = tsValid ? tsNum * 1000 : null;

  const localFromTs =
    tsMs !== null ? new Date(tsMs).toLocaleString("en-US") : "—";
  const utcFromTs =
    tsMs !== null
      ? new Date(tsMs).toLocaleString("en-US", { timeZone: "UTC" }) +
        " UTC"
      : "—";
  const isoFromTs =
    tsMs !== null ? new Date(tsMs).toISOString() : "—";

  // Date -> Timestamp
  const dateMs = React.useMemo<number | null>(() => {
    if (!dateInput) return null;
    const d = new Date(dateInput);
    if (Number.isNaN(d.getTime())) return null;
    return d.getTime();
  }, [dateInput]);

  const fromSeconds = dateMs !== null ? Math.floor(dateMs / 1000) : null;
  const fromMillis = dateMs;
  const isoFromDate = dateMs !== null ? new Date(dateMs).toISOString() : "—";

  const copy = (label: string, value: string) => {
    if (!value || value === "—") return;
    navigator.clipboard?.writeText(value);
    toast.success(`${label} copied`);
  };

  return (
    <div className="space-y-6">
      {/* Live clock */}
      <div className="rounded-2xl border border-border bg-card p-5 text-center">
        <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
          Current Unix timestamp
        </div>
        <div className="font-mono tabular-nums text-4xl sm:text-5xl font-bold mt-1">
          {Math.floor(live / 1000)}
        </div>
        <div className="font-mono text-xs text-muted-foreground mt-1">
          {live} ms
        </div>
      </div>

      {/* Mode toggle */}
      <div className="inline-flex rounded-lg border border-border p-1 bg-muted/30">
        <button
          className={cn(
            "px-4 py-1.5 rounded-md text-sm font-medium transition-colors",
            mode === "to-date"
              ? "bg-background shadow-sm text-foreground"
              : "text-muted-foreground hover:text-foreground"
          )}
          onClick={() => setMode("to-date")}
        >
          Timestamp &rarr; Date
        </button>
        <button
          className={cn(
            "px-4 py-1.5 rounded-md text-sm font-medium transition-colors",
            mode === "to-ts"
              ? "bg-background shadow-sm text-foreground"
              : "text-muted-foreground hover:text-foreground"
          )}
          onClick={() => setMode("to-ts")}
        >
          Date &rarr; Timestamp
        </button>
      </div>

      {mode === "to-date" ? (
        <>
          <Field
            label="Unix timestamp (seconds)"
            hint="Supports negative values for dates before 1970."
          >
            <Input
              type="number"
              value={tsInput}
              onChange={(e) => setTsInput(e.target.value)}
              placeholder="e.g. 1700000000"
            />
          </Field>

          <div className="grid sm:grid-cols-2 gap-4">
            <ResultStat
              label="UTC date"
              value={utcFromTs}
              accent="primary"
              sublabel={isoFromTs}
            />
            <ResultStat
              label="Local date"
              value={localFromTs}
              sublabel="Your device timezone"
            />
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => copy("UTC date", utcFromTs)}
            >
              Copy UTC
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => copy("Local date", localFromTs)}
            >
              Copy local
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => copy("ISO 8601", isoFromTs)}
            >
              Copy ISO
            </Button>
          </div>
        </>
      ) : (
        <>
          <Field label="Date & time (local)">
            <input
              type="datetime-local"
              className={DATE_INPUT_CLASS}
              value={dateInput}
              onChange={(e) => setDateInput(e.target.value)}
            />
          </Field>

          <div className="grid sm:grid-cols-2 gap-4">
            <ResultStat
              label="Unix timestamp (seconds)"
              value={fromSeconds ?? "—"}
              accent="primary"
              sublabel={isoFromDate}
            />
            <ResultStat
              label="Unix timestamp (milliseconds)"
              value={fromMillis ?? "—"}
            />
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                fromSeconds !== null &&
                copy("Unix seconds", String(fromSeconds))
              }
            >
              Copy seconds
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                fromMillis !== null &&
                copy("Unix milliseconds", String(fromMillis))
              }
            >
              Copy milliseconds
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => copy("ISO 8601", isoFromDate)}
            >
              Copy ISO
            </Button>
          </div>
        </>
      )}

      <NoteBox>
        Unix time counts seconds (or milliseconds) since 1970-01-01 00:00:00
        UTC, ignoring leap seconds. Use the toggle to switch direction. The live
        counter at the top updates every second.
      </NoteBox>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* 6. Birthday Countdown                                               */
/* ------------------------------------------------------------------ */

function BirthdayCountdown() {
  // Default: a sample birth date. We use a date input (year optional in spirit
  // but the native input requires one; we still extract only month/day).
  const [birth, setBirth] = React.useState<string>("1995-06-15");
  const [now, setNow] = React.useState<number>(Date.now());

  React.useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const calc = React.useMemo(() => {
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(birth);
    if (!m) return null;
    const year = Number(m[1]);
    const month = Number(m[2]); // 1-12
    const day = Number(m[3]);
    if (
      !Number.isFinite(year) ||
      !Number.isFinite(month) ||
      !Number.isFinite(day) ||
      month < 1 ||
      month > 12 ||
      day < 1 ||
      day > 31
    ) {
      return null;
    }
    const nowDate = new Date(now);
    const currentYear = nowDate.getFullYear();

    // Try this year's birthday, then next year's.
    const tryBirthday = (y: number) => {
      const d = new Date(y, month - 1, day, 0, 0, 0, 0);
      // Clamp in case the day is invalid (e.g. Feb 30) - JS will overflow.
      return d;
    };

    let next = tryBirthday(currentYear);
    if (next.getTime() < new Date(currentYear, nowDate.getMonth(), nowDate.getDate(), 0, 0, 0, 0).getTime()) {
      next = tryBirthday(currentYear + 1);
    }

    const diffMs = next.getTime() - nowDate.getTime();
    const diffSec = Math.max(0, Math.floor(diffMs / 1000));
    const days = Math.floor(diffSec / 86400);
    const hours = Math.floor((diffSec % 86400) / 3600);
    const minutes = Math.floor((diffSec % 3600) / 60);
    const seconds = diffSec % 60;

    // Determine if the birthday is "today" (same month/day).
    const isToday =
      nowDate.getMonth() === month - 1 && nowDate.getDate() === day;

    // Age math
    let currentAge = currentYear - year;
    const hadBirthdayThisYear =
      nowDate.getMonth() > month - 1 ||
      (nowDate.getMonth() === month - 1 && nowDate.getDate() >= day);
    if (!hadBirthdayThisYear) currentAge -= 1;
    const nextAge = currentAge + 1;

    return {
      days,
      hours,
      minutes,
      seconds,
      isToday,
      currentAge,
      nextAge,
      nextDate: next,
      month,
      day,
    };
  }, [birth, now]);

  if (!calc) {
    return (
      <div className="space-y-6">
        <Field label="Birth date">
          <input
            type="date"
            className={DATE_INPUT_CLASS}
            value={birth}
            onChange={(e) => setBirth(e.target.value)}
          />
        </Field>
        <NoteBox>Enter a valid birth date to see the countdown.</NoteBox>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Field label="Birth date">
        <input
          type="date"
          className={DATE_INPUT_CLASS}
          value={birth}
          onChange={(e) => setBirth(e.target.value)}
        />
      </Field>

      {calc.isToday ? (
        <div className="rounded-2xl border border-success/40 bg-success/10 p-6 text-center">
          <div className="text-2xl font-bold text-success">
            Happy Birthday!
          </div>
          <div className="text-sm text-muted-foreground mt-1">
            It&apos;s your birthday today. You turn {calc.nextAge}.
          </div>
        </div>
      ) : (
        <div className="rounded-2xl border border-border bg-card p-6 text-center">
          <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            Time until your next birthday
          </div>
          <div className="font-mono tabular-nums text-4xl sm:text-5xl font-bold mt-2">
            {pad2(calc.days)}d : {pad2(calc.hours)}h : {pad2(calc.minutes)}m :{" "}
            {pad2(calc.seconds)}s
          </div>
          <div className="text-sm text-muted-foreground mt-3">
            {calc.days} day{calc.days === 1 ? "" : "s"} until{" "}
            {calc.nextDate.toLocaleDateString("en-US", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </div>
        </div>
      )}

      <div className="grid sm:grid-cols-2 gap-4">
        <ResultStat
          label="Current age"
          value={calc.currentAge}
          sublabel="Years"
        />
        <ResultStat
          label="Age on next birthday"
          value={calc.nextAge}
          accent="primary"
          sublabel="Years"
        />
      </div>

      <NoteBox>
        Enter your birth date and we&apos;ll compute the next occurrence (this
        year or next). The countdown updates every second. If today is your
        birthday, you&apos;ll see a celebratory message instead.
      </NoteBox>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* 7. Days Until Date                                                  */
/* ------------------------------------------------------------------ */

function DaysUntil() {
  const [target, setTarget] = React.useState<string>(() => {
    // Default: 30 days from today.
    const d = new Date();
    d.setDate(d.getDate() + 30);
    return toDatetimeLocalValue(d).slice(0, 10);
  });
  const [now, setNow] = React.useState<number>(Date.now());

  React.useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const calc = React.useMemo(() => {
    if (!target) return null;
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(target);
    if (!m) return null;
    const y = Number(m[1]);
    const mo = Number(m[2]) - 1;
    const d = Number(m[3]);
    if (!Number.isFinite(y) || !Number.isFinite(mo) || !Number.isFinite(d)) {
      return null;
    }
    const targetDate = new Date(y, mo, d, 0, 0, 0, 0);
    if (Number.isNaN(targetDate.getTime())) return null;

    const nowDate = new Date(now);
    // Normalize "today" to local midnight for whole-day math.
    const todayMidnight = new Date(
      nowDate.getFullYear(),
      nowDate.getMonth(),
      nowDate.getDate(),
      0,
      0,
      0,
      0
    );

    const diffMs = targetDate.getTime() - now;
    const diffSec = Math.floor(diffMs / 1000);
    const days = Math.floor(diffMs / DAY_MS);
    const wholeDays = Math.round(
      (targetDate.getTime() - todayMidnight.getTime()) / DAY_MS
    );
    const weeks = Math.floor(Math.abs(wholeDays) / 7);
    const remDays = Math.abs(wholeDays) % 7;

    const hours = Math.floor((diffSec % 86400) / 3600);
    const minutes = Math.floor((diffSec % 3600) / 60);
    const seconds = diffSec % 60;

    const isPast = diffMs < 0;

    // Year progress: how far through the current year we are.
    const yearStart = new Date(nowDate.getFullYear(), 0, 1).getTime();
    const yearEnd = new Date(nowDate.getFullYear() + 1, 0, 1).getTime();
    const yearProgress = ((now - yearStart) / (yearEnd - yearStart)) * 100;

    return {
      days,
      wholeDays,
      weeks,
      remDays,
      hours,
      minutes,
      seconds,
      isPast,
      targetDate,
      yearProgress: Math.min(100, Math.max(0, yearProgress)),
    };
  }, [target, now]);

  if (!calc) {
    return (
      <div className="space-y-6">
        <Field label="Target date">
          <input
            type="date"
            className={DATE_INPUT_CLASS}
            value={target}
            onChange={(e) => setTarget(e.target.value)}
          />
        </Field>
        <NoteBox>Enter a valid date to compute the countdown.</NoteBox>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Field label="Target date">
        <input
          type="date"
          className={DATE_INPUT_CLASS}
          value={target}
          onChange={(e) => setTarget(e.target.value)}
        />
      </Field>

      <ResultStat
        label={calc.isPast ? "Days since target date" : "Days until target date"}
        value={Math.abs(calc.wholeDays)}
        accent={calc.isPast ? "warning" : "primary"}
        sublabel={
          calc.isPast
            ? `${calc.targetDate.toLocaleDateString("en-US", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
              })} was ${Math.abs(calc.wholeDays)} day${
                Math.abs(calc.wholeDays) === 1 ? "" : "s"
              } ago`
            : `${calc.weeks} week${calc.weeks === 1 ? "" : "s"} and ${
                calc.remDays
              } day${calc.remDays === 1 ? "" : "s"}`
        }
      />

      <div className="rounded-2xl border border-border bg-card p-6 text-center">
        <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
          {calc.isPast ? "Time since (live)" : "Countdown (live)"}
        </div>
        <div className="font-mono tabular-nums text-3xl sm:text-4xl font-bold mt-2">
          {pad2(Math.abs(calc.days))}d : {pad2(calc.hours)}h :{" "}
          {pad2(calc.minutes)}m : {pad2(calc.seconds)}s
        </div>
        <div className="text-sm text-muted-foreground mt-2">
          {calc.targetDate.toLocaleDateString("en-US", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </div>
      </div>

      {/* Year progress */}
      <div>
        <div className="flex items-center justify-between text-sm mb-2">
          <span className="font-medium text-foreground">
            Progress through {new Date(now).getFullYear()}
          </span>
          <span className="font-mono text-muted-foreground">
            {calc.yearProgress.toFixed(1)}%
          </span>
        </div>
        <div className="h-3 w-full rounded-full bg-muted overflow-hidden">
          <div
            className="h-full rounded-full bg-primary transition-[width] duration-500"
            style={{ width: `${calc.yearProgress}%` }}
          />
        </div>
      </div>

      <NoteBox>
        Enter a future (or past) date to see the live countdown. The headline
        shows whole days, with weeks+days broken out below. The progress bar
        shows how far through the current calendar year we are.
      </NoteBox>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Router                                                              */
/* ------------------------------------------------------------------ */

export function TimerTools({ calcId }: { calcId: string }) {
  switch (calcId) {
    case "online-timer":
      return <OnlineTimer />;
    case "online-stopwatch":
      return <OnlineStopwatch />;
    case "world-clock":
      return <WorldClock />;
    case "timezone-converter":
      return <TimezoneConverter />;
    case "unix-timestamp":
      return <UnixTimestamp />;
    case "birthday-countdown":
      return <BirthdayCountdown />;
    case "days-until":
      return <DaysUntil />;
    default:
      return null;
  }
}
