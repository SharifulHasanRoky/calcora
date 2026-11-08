"use client";

import * as React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Field, ResultStat } from "@/components/calc-page-shell";
import { toast } from "sonner";
import { Copy, RefreshCw, FileText, Hash } from "lucide-react";

export function TextTools({ calcId }: { calcId: string }) {
  switch (calcId) {
    case "word-counter": return <WordCounter />;
    case "character-counter": return <CharacterCounter />;
    case "lorem-ipsum": return <LoremIpsum />;
    case "number-to-words": return <NumberToWords />;
    default: return null;
  }
}

function WordCounter() {
  const [text, setText] = React.useState("The quick brown fox jumps over the lazy dog. Calculators make life easier — CALCORA brings them all into one beautiful place.");

  const words = text.trim() ? text.trim().split(/\s+/).length : 0;
  const characters = text.length;
  const charactersNoSpaces = text.replace(/\s/g, "").length;
  const sentences = (text.match(/[.!?]+(?:\s|$)/g) || []).length;
  const paragraphs = text.trim() ? text.trim().split(/\n+/).filter(p => p.trim()).length : 0;
  const lines = text ? text.split("\n").length : 0;
  const readingTime = Math.max(1, Math.ceil(words / 200)); // 200 wpm average
  const speakingTime = Math.max(1, Math.ceil(words / 130)); // 130 wpm average

  const stats = [
    { label: "Words", value: words, icon: FileText },
    { label: "Characters", value: characters, icon: Hash },
    { label: "Characters (no spaces)", value: charactersNoSpaces },
    { label: "Sentences", value: sentences },
    { label: "Paragraphs", value: paragraphs },
    { label: "Lines", value: lines },
  ];

  return (
    <div className="space-y-4">
      <Field label="Your text">
        <Textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          className="min-h-[200px] font-mono text-sm"
          placeholder="Paste or type your text here…"
        />
      </Field>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {stats.map(s => (
          <ResultStat key={s.label} label={s.label} value={s.value.toLocaleString()} />
        ))}
      </div>

      <div className="grid sm:grid-cols-2 gap-3">
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="text-xs text-muted-foreground uppercase tracking-wider">Reading time</div>
          <div className="text-lg font-bold mt-1">~{readingTime} min</div>
          <div className="text-xs text-muted-foreground mt-1">at 200 words/min</div>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="text-xs text-muted-foreground uppercase tracking-wider">Speaking time</div>
          <div className="text-lg font-bold mt-1">~{speakingTime} min</div>
          <div className="text-xs text-muted-foreground mt-1">at 130 words/min</div>
        </div>
      </div>

      <div className="rounded-xl bg-muted/30 border border-border p-4 text-sm text-muted-foreground">
        <strong className="text-foreground">How it works:</strong> Words are counted by splitting on whitespace. Sentences end with ., !, or ?. Paragraphs are separated by line breaks. Reading/speaking estimates use average adult rates.
      </div>
    </div>
  );
}

function CharacterCounter() {
  const [text, setText] = React.useState("");

  const chars = text.length;
  const charsNoSpaces = text.replace(/\s/g, "").length;
  const letters = (text.match(/[a-zA-Z]/g) || []).length;
  const digits = (text.match(/[0-9]/g) || []).length;
  const spaces = (text.match(/ /g) || []).length;
  const special = chars - letters - digits - spaces;

  return (
    <div className="space-y-4">
      <Field label="Text to count">
        <Textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          className="min-h-[160px] font-mono text-sm"
          placeholder="Start typing…"
          autoFocus
        />
      </Field>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <ResultStat label="Total characters" value={chars.toLocaleString()} accent="primary" />
        <ResultStat label="Without spaces" value={charsNoSpaces.toLocaleString()} />
        <ResultStat label="Letters" value={letters.toLocaleString()} />
        <ResultStat label="Digits" value={digits.toLocaleString()} />
        <ResultStat label="Spaces" value={spaces.toLocaleString()} />
        <ResultStat label="Special chars" value={special.toLocaleString()} />
      </div>

      <div className="rounded-xl bg-muted/30 border border-border p-4 text-sm text-muted-foreground">
        Useful for tweets (280), SMS (160), meta titles (60), meta descriptions (160), and other length-limited fields.
      </div>
    </div>
  );
}

const LOREM_WORDS = "lorem ipsum dolor sit amet consectetur adipiscing elit sed do eiusmod tempor incididunt ut labore et dolore magna aliqua enim ad minim veniam quis nostrud exercitation ullamco laboris nisi aliquip ex ea commodo consequat duis aute irure in reprehenderit voluptate velit esse cillum eu fugiat nulla pariatur excepteur sint occaecat cupidatat non proident sunt culpa qui officia deserunt mollit anim id est laborum".split(" ");

function LoremIpsum() {
  const [count, setCount] = React.useState("3");
  const [unit, setUnit] = React.useState<"paragraphs" | "sentences" | "words">("paragraphs");
  const [output, setOutput] = React.useState("");
  const [seed, setSeed] = React.useState(0);

  React.useEffect(() => {
    generate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [count, unit, seed]);

  const generate = () => {
    const n = Math.max(1, Math.min(100, parseInt(count) || 1));
    let result = "";
    if (unit === "paragraphs") {
      const paras: string[] = [];
      for (let p = 0; p < n; p++) {
        const sentences = 3 + Math.floor(Math.random() * 4);
        const sents: string[] = [];
        for (let s = 0; s < sentences; s++) {
          const words = 8 + Math.floor(Math.random() * 12);
          const w: string[] = [];
          for (let i = 0; i < words; i++) {
            w.push(LOREM_WORDS[Math.floor(Math.random() * LOREM_WORDS.length)]);
          }
          let sent = w.join(" ");
          sent = sent.charAt(0).toUpperCase() + sent.slice(1) + ".";
          sents.push(sent);
        }
        paras.push(sents.join(" "));
      }
      result = paras.join("\n\n");
    } else if (unit === "sentences") {
      const sents: string[] = [];
      for (let s = 0; s < n; s++) {
        const words = 8 + Math.floor(Math.random() * 12);
        const w: string[] = [];
        for (let i = 0; i < words; i++) {
          w.push(LOREM_WORDS[Math.floor(Math.random() * LOREM_WORDS.length)]);
        }
        let sent = w.join(" ");
        sent = sent.charAt(0).toUpperCase() + sent.slice(1) + ".";
        sents.push(sent);
      }
      result = sents.join(" ");
    } else {
      const w: string[] = [];
      for (let i = 0; i < n; i++) {
        w.push(LOREM_WORDS[Math.floor(Math.random() * LOREM_WORDS.length)]);
      }
      result = w.join(" ");
      result = result.charAt(0).toUpperCase() + result.slice(1) + ".";
    }
    setOutput(result);
  };

  return (
    <div className="space-y-4">
      <div className="grid sm:grid-cols-3 gap-3 items-end">
        <Field label="Count">
          <Input type="number" value={count} onChange={e => setCount(e.target.value)} min="1" max="100" />
        </Field>
        <Field label="Unit">
          <select value={unit} onChange={e => setUnit(e.target.value as typeof unit)} className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm">
            <option value="paragraphs">Paragraphs</option>
            <option value="sentences">Sentences</option>
            <option value="words">Words</option>
          </select>
        </Field>
        <Button onClick={() => setSeed(s => s + 1)} variant="outline">
          <RefreshCw className="size-4" /> Regenerate
        </Button>
      </div>

      <div className="rounded-xl border border-border bg-card p-4 min-h-[200px]">
        <pre className="text-sm whitespace-pre-wrap font-sans leading-relaxed">{output}</pre>
      </div>

      <div className="flex gap-2">
        <Button variant="outline" onClick={() => { navigator.clipboard?.writeText(output); toast.success("Copied to clipboard"); }}>
          <Copy className="size-4" /> Copy text
        </Button>
      </div>

      <div className="rounded-xl bg-muted/30 border border-border p-4 text-sm text-muted-foreground">
        Lorem ipsum is placeholder text used in design and publishing to fill space before real copy is ready. The text is derived from Cicero's "de Finibus Bonorum et Malorum" (45 BC).
      </div>
    </div>
  );
}

function NumberToWords() {
  const [num, setNum] = React.useState("12345");

  const n = parseFloat(num);
  const isValid = !isNaN(n) && Number.isFinite(n);

  function toWords(num: number): string {
    if (num === 0) return "zero";
    const ones = ["", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten", "eleven", "twelve", "thirteen", "fourteen", "fifteen", "sixteen", "seventeen", "eighteen", "nineteen"];
    const tens = ["", "", "twenty", "thirty", "forty", "fifty", "sixty", "seventy", "eighty", "ninety"];
    const scales = ["", "thousand", "million", "billion", "trillion", "quadrillion"];

    function threeDigit(n: number): string {
      let str = "";
      const h = Math.floor(n / 100);
      const rem = n % 100;
      if (h > 0) str += ones[h] + " hundred";
      if (rem > 0) {
        if (str) str += " and ";
        if (rem < 20) str += ones[rem];
        else {
          str += tens[Math.floor(rem / 10)];
          if (rem % 10 > 0) str += "-" + ones[rem % 10];
        }
      }
      return str;
    }

    let result = "";
    const isNeg = num < 0;
    num = Math.abs(num);

    const intPart = Math.floor(num);
    const decPart = Math.round((num - intPart) * 100);

    if (intPart === 0) {
      result = "zero";
    } else {
      const groups: number[] = [];
      let temp = intPart;
      while (temp > 0) {
        groups.push(temp % 1000);
        temp = Math.floor(temp / 1000);
      }
      for (let i = groups.length - 1; i >= 0; i--) {
        if (groups[i] === 0) continue;
        const g = threeDigit(groups[i]);
        result += (result ? " " : "") + g + (scales[i] ? " " + scales[i] : "");
      }
    }

    if (decPart > 0) {
      result += " point";
      const decStr = String(decPart).padStart(2, "0");
      for (const d of decStr) {
        result += " " + ones[parseInt(d)];
      }
    }

    return (isNeg ? "minus " : "") + result;
  }

  const words = isValid ? toWords(n) : "";
  const ordWord = isValid && Number.isInteger(n) && n > 0 && n <= 100 ? toOrdinal(n) : "";

  function toOrdinal(n: number): string {
    const w = toWords(n);
    if (w.endsWith("y")) return w.slice(0, -1) + "ieth";
    return w + "th";
  }

  return (
    <div className="space-y-4">
      <Field label="Number">
        <Input
          type="number"
          value={num}
          onChange={e => setNum(e.target.value)}
          className="font-mono text-lg"
          step="any"
        />
      </Field>

      {isValid ? (
        <>
          <ResultStat label="In words" value={words} accent="primary" />
          {ordWord && (
            <ResultStat label="Ordinal" value={ordWord} />
          )}
          <div className="rounded-xl border border-border bg-card p-4">
            <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Check</div>
            <div className="font-mono text-lg capitalize">{words}</div>
          </div>
          <Button variant="outline" onClick={() => { navigator.clipboard?.writeText(words); toast.success("Copied"); }}>
            <Copy className="size-4" /> Copy
          </Button>
        </>
      ) : (
        <div className="text-center py-8 text-muted-foreground">Enter a valid number.</div>
      )}

      <div className="rounded-xl bg-muted/30 border border-border p-4 text-sm text-muted-foreground">
        Converts integers and decimals up to quadrillions into English words. Useful for writing cheques, legal documents, and educational exercises.
      </div>
    </div>
  );
}
