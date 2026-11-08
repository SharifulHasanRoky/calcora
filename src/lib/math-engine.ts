/**
 * CALCORA Math Expression Engine
 * A safe, dependency-free expression evaluator.
 *
 * Pipeline: source → tokenizer → shunting-yard (infix→RPN) → RPN evaluator.
 * NEVER uses eval() or Function().
 *
 * Supports: + - * / % ^, unary minus, parentheses,
 *   sin cos tan asin acos atan sinh cosh tanh,
 *   log (base 10), ln (base e), lg (base 2),
 *   sqrt, cbrt, abs, exp, floor, ceil, round, sign,
 *   fact (factorial), gcd, lcm, mod, pow,
 *   constants: pi, e, tau, phi,
 *   percentages: 50% == 0.5; 200+10% == 220 (engineering percent)
 */

export type TokenType =
  | "number"
  | "constant"
  | "operator"
  | "function"
  | "lparen"
  | "rparen"
  | "comma"
  | "percent";

export interface Token {
  type: TokenType;
  value: string;
  pos: number;
}

export interface Step {
  description: string;
  expression: string;
}

export interface EvalResult {
  value: number;
  ok: boolean;
  error?: string;
  steps?: Step[];
}

export const CONSTANTS: Record<string, number> = {
  pi: Math.PI,
  π: Math.PI,
  e: Math.E,
  τ: 2 * Math.PI,
  tau: 2 * Math.PI,
  phi: (1 + Math.sqrt(5)) / 2,
  φ: (1 + Math.sqrt(5)) / 2,
};

const FUNCTIONS = new Set([
  "sin", "cos", "tan", "asin", "acos", "atan",
  "sinh", "cosh", "tanh", "asinh", "acosh", "atanh",
  "log", "ln", "lg", "log2", "log10",
  "sqrt", "cbrt", "abs", "exp", "floor", "ceil", "round", "sign",
  "fact", "factorial", "gcd", "lcm", "mod", "max", "min", "pow",
  "deg", "rad",
]);

const FUNCTION_ARITY: Record<string, number> = {
  sin: 1, cos: 1, tan: 1, asin: 1, acos: 1, atan: 1,
  sinh: 1, cosh: 1, tanh: 1, asinh: 1, acosh: 1, atanh: 1,
  log: 1, ln: 1, lg: 1, log2: 1, log10: 1,
  sqrt: 1, cbrt: 1, abs: 1, exp: 1, floor: 1, ceil: 1, round: 1, sign: 1,
  fact: 1, factorial: 1, deg: 1, rad: 1,
  gcd: 2, lcm: 2, mod: 2, max: 2, min: 2, pow: 2,
};

/** Angle mode for trig functions */
export type AngleMode = "rad" | "deg";

/** Precedence for operators. Higher = binds tighter. */
const PRECEDENCE: Record<string, number> = {
  "+": 2,
  "-": 2,
  "*": 3,
  "/": 3,
  "%": 3, // modulo when between numbers (we disambiguate in tokenizer)
  "^": 5,
};

const RIGHT_ASSOC = new Set(["^"]);

/** Tokenize an expression string. */
export function tokenize(input: string): Token[] {
  const tokens: Token[] = [];
  let i = 0;
  const src = input.replace(/\s+/g, "");
  const n = src.length;

  while (i < n) {
    const ch = src[i];

    // Number: digits and one decimal point. Also scientific notation.
    if (/[0-9.]/.test(ch)) {
      let j = i;
      let num = "";
      while (j < n && /[0-9.]/.test(src[j])) {
        num += src[j];
        j++;
      }
      // Scientific notation: 1.5e-3 or 2e10
      if (j < n && (src[j] === "e" || src[j] === "E")) {
        // Make sure the 'e' is not the constant e (i.e., followed by digit/sign)
        if (j + 1 < n && (/[0-9+\-]/.test(src[j + 1]))) {
          num += "e";
          j++;
          if (src[j] === "+" || src[j] === "-") {
            num += src[j];
            j++;
          }
          while (j < n && /[0-9]/.test(src[j])) {
            num += src[j];
            j++;
          }
        }
      }
      // Validate number
      const parsed = parseFloat(num);
      if (isNaN(parsed)) {
        throw new Error(`Invalid number: "${num}"`);
      }
      // Check for trailing percent
      if (j < n && src[j] === "%") {
        // Engineering percent: handle at eval level via token sequence.
        tokens.push({ type: "number", value: num, pos: i });
        tokens.push({ type: "percent", value: "%", pos: j });
        i = j + 1;
      } else {
        tokens.push({ type: "number", value: num, pos: i });
        i = j;
      }
      continue;
    }

    // Letters: constants or functions
    if (/[a-zA-Zπτφ]/.test(ch)) {
      let j = i;
      let name = "";
      while (j < n && /[a-zA-Zπτφ]/.test(src[j])) {
        name += src[j];
        j++;
      }
      const lower = name.toLowerCase();
      if (FUNCTIONS.has(lower)) {
        tokens.push({ type: "function", value: lower, pos: i });
      } else if (lower in CONSTANTS || name in CONSTANTS) {
        const key = name in CONSTANTS ? name : lower;
        tokens.push({ type: "constant", value: key, pos: i });
      } else {
        throw new Error(`Unknown identifier: "${name}"`);
      }
      i = j;
      continue;
    }

    if (ch === "(") { tokens.push({ type: "lparen", value: ch, pos: i }); i++; continue; }
    if (ch === ")") { tokens.push({ type: "rparen", value: ch, pos: i }); i++; continue; }
    if (ch === ",") { tokens.push({ type: "comma", value: ch, pos: i }); i++; continue; }

    // Operators
    if ("+-*/^%".includes(ch)) {
      // Disambiguate % as modulo vs percent: percent tokens are emitted above after numbers.
      // A standalone % between two numbers/parens = modulo.
      tokens.push({ type: "operator", value: ch, pos: i });
      i++;
      continue;
    }

    // Alternative symbols
    if (ch === "×" || ch === "·") { tokens.push({ type: "operator", value: "*", pos: i }); i++; continue; }
    if (ch === "÷") { tokens.push({ type: "operator", value: "/", pos: i }); i++; continue; }
    if (ch === "−") { tokens.push({ type: "operator", value: "-", pos: i }); i++; continue; }
    if (ch === "^" || ch === "**") { tokens.push({ type: "operator", value: "^", pos: i }); i++; continue; }
    if (ch === "√") {
      tokens.push({ type: "function", value: "sqrt", pos: i });
      i++;
      continue;
    }

    throw new Error(`Unexpected character: "${ch}"`);
  }

  return tokens;
}

/** Insert implicit multiplication and convert unary minus. Returns new token list. */
function preprocess(tokens: Token[]): Token[] {
  const out: Token[] = [];
  for (let i = 0; i < tokens.length; i++) {
    const t = tokens[i];
    const prev = out[out.length - 1];

    // Unary minus / plus: at start, after operator, after lparen, after comma, after %, after function
    if (
      (t.type === "operator" && (t.value === "-" || t.value === "+")) &&
      (!prev ||
        prev.type === "operator" ||
        prev.type === "lparen" ||
        prev.type === "comma" ||
        prev.type === "function" ||
        prev.type === "percent")
    ) {
      // Replace unary minus with (0 - X) by emitting 0 then operator
      if (t.value === "-") {
        out.push({ type: "number", value: "0", pos: t.pos });
        out.push({ type: "operator", value: "-", pos: t.pos });
      }
      // Unary plus is a no-op; skip it.
      continue;
    }

    // Implicit multiplication:
    //  number/constant/rparen/percent  followed by  number/constant/lparen/function
    if (prev && (
      prev.type === "number" ||
      prev.type === "constant" ||
      prev.type === "rparen" ||
      prev.type === "percent"
    ) && (
      t.type === "number" ||
      t.type === "constant" ||
      t.type === "lparen" ||
      t.type === "function"
    )) {
      out.push({ type: "operator", value: "*", pos: t.pos });
    }

    out.push(t);
  }
  return out;
}

export interface RpnToken {
  type: "num" | "op" | "fn" | "const";
  value: string;
  arity?: number;
}

/** Shunting-yard: infix → RPN */
export function toRPN(tokens: Token[]): RpnToken[] {
  const t = preprocess(tokens);
  const output: RpnToken[] = [];
  const stack: (Token & { arity?: number; argCount?: number })[] = [];

  for (const tok of t) {
    if (tok.type === "number") {
      output.push({ type: "num", value: tok.value });
    } else if (tok.type === "constant") {
      output.push({ type: "const", value: tok.value });
    } else if (tok.type === "percent") {
      // percent as a postfix operator on the previous operand: value/100
      output.push({ type: "op", value: "PCT", arity: 1 });
    } else if (tok.type === "function") {
      stack.push({ ...tok, argCount: 0 });
    } else if (tok.type === "comma") {
      while (stack.length && stack[stack.length - 1].type !== "lparen") {
        const popped = stack.pop()!;
        output.push(popped.type === "function" ? { type: "fn", value: popped.value, arity: FUNCTION_ARITY[popped.value] } : { type: "op", value: popped.value });
      }
      if (!stack.length) throw new Error("Misplaced comma or mismatched parentheses");
    } else if (tok.type === "operator") {
      while (stack.length) {
        const top = stack[stack.length - 1];
        if (top.type === "operator") {
          const topPrec = PRECEDENCE[top.value];
          const curPrec = PRECEDENCE[tok.value];
          if (topPrec > curPrec || (topPrec === curPrec && !RIGHT_ASSOC.has(tok.value))) {
            const popped = stack.pop()!;
            output.push({ type: "op", value: popped.value });
            continue;
          }
        }
        if (top.type === "function") {
          const popped = stack.pop()!;
          output.push({ type: "fn", value: popped.value, arity: FUNCTION_ARITY[popped.value] });
          continue;
        }
        break;
      }
      stack.push(tok);
    } else if (tok.type === "lparen") {
      stack.push(tok);
    } else if (tok.type === "rparen") {
      while (stack.length && stack[stack.length - 1].type !== "lparen") {
        const popped = stack.pop()!;
        output.push(popped.type === "function" ? { type: "fn", value: popped.value, arity: FUNCTION_ARITY[popped.value] } : { type: "op", value: popped.value });
      }
      if (!stack.length) throw new Error("Mismatched parentheses");
      stack.pop(); // remove lparen
      // If a function is on top, pop it to output
      if (stack.length && stack[stack.length - 1].type === "function") {
        const popped = stack.pop()!;
        output.push({ type: "fn", value: popped.value, arity: FUNCTION_ARITY[popped.value] });
      }
    }
  }
  while (stack.length) {
    const popped = stack.pop()!;
    if (popped.type === "lparen" || popped.type === "rparen") {
      throw new Error("Mismatched parentheses");
    }
    output.push(popped.type === "function" ? { type: "fn", value: popped.value, arity: FUNCTION_ARITY[popped.value] } : { type: "op", value: popped.value });
  }
  return output;
}

function factorial(n: number): number {
  if (n < 0 || !Number.isInteger(n)) {
    // Gamma extension for non-integers
    if (n < 0 && Number.isInteger(n)) throw new Error("Factorial of negative integer");
    return gamma(n + 1);
  }
  if (n > 170) return Infinity;
  let r = 1;
  for (let i = 2; i <= n; i++) r *= i;
  return r;
}

// Lanczos approximation for gamma
function gamma(z: number): number {
  const g = 7;
  const c = [
    0.99999999999980993, 676.5203681218851, -1259.1392167224028,
    771.32342877765313, -176.61502916214059, 12.507343278686905,
    -0.13857109526572012, 9.9843695780195716e-6, 1.5056327351493116e-7,
  ];
  if (z < 0.5) {
    return Math.PI / (Math.sin(Math.PI * z) * gamma(1 - z));
  }
  z -= 1;
  let x = c[0];
  for (let i = 1; i < g + 2; i++) {
    x += c[i] / (z + i);
  }
  const t = z + g + 0.5;
  return Math.sqrt(2 * Math.PI) * Math.pow(t, z + 0.5) * Math.exp(-t) * x;
}

function gcd(a: number, b: number): number {
  a = Math.abs(Math.round(a));
  b = Math.abs(Math.round(b));
  while (b) { [a, b] = [b, a % b]; }
  return a;
}

function lcm(a: number, b: number): number {
  if (a === 0 || b === 0) return 0;
  return Math.abs(Math.round(a) * Math.round(b)) / gcd(a, b);
}

/** Evaluate an RPN token stream. */
function evalRPN(rpn: RpnToken[], angleMode: AngleMode = "deg"): number {
  const stack: number[] = [];
  const toRad = (x: number) => (angleMode === "deg" ? (x * Math.PI) / 180 : x);
  const fromRad = (x: number) => (angleMode === "deg" ? (x * 180) / Math.PI : x);

  for (const tok of rpn) {
    if (tok.type === "num") {
      stack.push(parseFloat(tok.value));
    } else if (tok.type === "const") {
      stack.push(CONSTANTS[tok.value]);
    } else if (tok.type === "op") {
      switch (tok.value) {
        case "PCT": {
          // postfix percent: divide top by 100
          const a = stack.pop();
          if (a === undefined) throw new Error("Invalid expression");
          stack.push(a / 100);
          break;
        }
        case "%": {
          // modulo
          const b = stack.pop();
          const a = stack.pop();
          if (a === undefined || b === undefined) throw new Error("Invalid expression");
          if (b === 0) throw new Error("Modulo by zero");
          stack.push(a - b * Math.floor(a / b));
          break;
        }
        default: {
          const b = stack.pop();
          const a = stack.pop();
          if (a === undefined || b === undefined) throw new Error("Invalid expression");
          switch (tok.value) {
            case "+": stack.push(a + b); break;
            case "-": stack.push(a - b); break;
            case "*": stack.push(a * b); break;
            case "/":
              if (b === 0) throw new Error("Division by zero");
              stack.push(a / b); break;
            case "^": stack.push(Math.pow(a, b)); break;
          }
        }
      }
    } else if (tok.type === "fn") {
      const arity = tok.arity ?? 1;
      const args: number[] = [];
      for (let k = 0; k < arity; k++) {
        const v = stack.pop();
        if (v === undefined) throw new Error(`Not enough arguments for ${tok.value}`);
        args.unshift(v);
      }
      switch (tok.value) {
        case "sin": stack.push(Math.sin(toRad(args[0]))); break;
        case "cos": stack.push(Math.cos(toRad(args[0]))); break;
        case "tan": stack.push(Math.tan(toRad(args[0]))); break;
        case "asin": stack.push(fromRad(Math.asin(args[0]))); break;
        case "acos": stack.push(fromRad(Math.acos(args[0]))); break;
        case "atan": stack.push(fromRad(Math.atan(args[0]))); break;
        case "sinh": stack.push(Math.sinh(args[0])); break;
        case "cosh": stack.push(Math.cosh(args[0])); break;
        case "tanh": stack.push(Math.tanh(args[0])); break;
        case "asinh": stack.push(Math.asinh(args[0])); break;
        case "acosh": stack.push(Math.acosh(args[0])); break;
        case "atanh": stack.push(Math.atanh(args[0])); break;
        case "log": case "log10": stack.push(Math.log10(args[0])); break;
        case "ln": stack.push(Math.log(args[0])); break;
        case "lg": case "log2": stack.push(Math.log2(args[0])); break;
        case "sqrt":
          if (args[0] < 0) throw new Error("Square root of negative number");
          stack.push(Math.sqrt(args[0])); break;
        case "cbrt": stack.push(Math.cbrt(args[0])); break;
        case "abs": stack.push(Math.abs(args[0])); break;
        case "exp": stack.push(Math.exp(args[0])); break;
        case "floor": stack.push(Math.floor(args[0])); break;
        case "ceil": stack.push(Math.ceil(args[0])); break;
        case "round": stack.push(Math.round(args[0])); break;
        case "sign": stack.push(Math.sign(args[0])); break;
        case "deg": stack.push((args[0] * 180) / Math.PI); break;
        case "rad": stack.push((args[0] * Math.PI) / 180); break;
        case "fact": case "factorial": stack.push(factorial(args[0])); break;
        case "gcd": stack.push(gcd(args[0], args[1])); break;
        case "lcm": stack.push(lcm(args[0], args[1])); break;
        case "mod": {
          if (args[1] === 0) throw new Error("Modulo by zero");
          stack.push(args[0] - args[1] * Math.floor(args[0] / args[1]));
          break;
        }
        case "max": stack.push(Math.max(args[0], args[1])); break;
        case "min": stack.push(Math.min(args[0], args[1])); break;
        case "pow": stack.push(Math.pow(args[0], args[1])); break;
        default: throw new Error(`Unknown function: ${tok.value}`);
      }
    }
  }

  if (stack.length !== 1) {
    throw new Error("Invalid expression");
  }
  return stack[0];
}

/** Main entry point: evaluate an expression. */
export function evaluate(expr: string, angleMode: AngleMode = "deg"): EvalResult {
  if (!expr || !expr.trim()) {
    return { value: 0, ok: false, error: "Empty expression" };
  }
  try {
    const tokens = tokenize(expr);
    if (tokens.length === 0) return { value: 0, ok: false, error: "Empty expression" };
    const rpn = toRPN(tokens);
    const value = evalRPN(rpn, angleMode);
    if (!Number.isFinite(value)) {
      return { value: 0, ok: false, error: "Result is not finite (overflow or undefined)" };
    }
    return { value, ok: true };
  } catch (e) {
    return { value: 0, ok: false, error: (e as Error).message };
  }
}

/** Format a number for display. */
export function formatNumber(n: number, maxDigits = 12): string {
  if (!Number.isFinite(n)) return n > 0 ? "∞" : (n < 0 ? "-∞" : "NaN");
  if (n === 0) return "0";
  const abs = Math.abs(n);
  if (abs >= 1e15 || (abs < 1e-9 && abs > 0)) {
    return n.toExponential(6).replace(/\.?0+e/, "e");
  }
  // Round to 12 significant digits to avoid floating point noise
  const rounded = parseFloat(n.toPrecision(12));
  let s = rounded.toString();
  // Trim trailing zeros in decimals
  if (s.includes(".") && !s.includes("e")) {
    s = s.replace(/\.?0+$/, "");
  }
  // Add thousands separators for the integer part
  if (abs >= 1000 && !s.includes("e")) {
    const [intPart, decPart] = s.split(".");
    const sign = intPart.startsWith("-") ? "-" : "";
    const intAbs = sign ? intPart.slice(1) : intPart;
    const withSep = intAbs.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    s = sign + withSep + (decPart ? "." + decPart : "");
  }
  return s;
}

/** Format a number as currency. */
export function formatCurrency(n: number, currency = "USD", locale = "en-US"): string {
  try {
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency,
      maximumFractionDigits: 2,
    }).format(n);
  } catch {
    return `${currency} ${formatNumber(n)}`;
  }
}

/** Parse a numeric string with thousands separators. */
export function parseNumber(s: string): number {
  if (typeof s === "number") return s;
  if (!s) return 0;
  const cleaned = s.toString().replace(/,/g, "").replace(/\s/g, "");
  const n = parseFloat(cleaned);
  return isNaN(n) ? 0 : n;
}
