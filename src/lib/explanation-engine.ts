/**
 * CALCORA Explanation Engine
 * Generates mathematically-validated, step-by-step explanations.
 * NEVER uses AI to fabricate steps — only symbolic transformations that
 * are provably correct given the input expression.
 *
 * Strategies:
 *   1. Resolve constants (pi → 3.14159..., e → 2.71828...).
 *   2. Resolve percentages (50% → 0.5).
 *   3. Resolve unary minus.
 *   4. Show the RPN evaluation step-by-step (each binary op + each function call),
 *      substituting intermediate numeric results back into the infix expression.
 */

import { tokenize, toRPN, type AngleMode, type RpnToken, type Step, CONSTANTS } from "./math-engine";

interface ExprNode {
  type: "num" | "const" | "op" | "fn";
  value: string;
  arity?: number;
  children: ExprNode[];
}

/** Build an AST from RPN so we can render back to infix with substitutions. */
function buildAST(rpn: RpnToken[]): ExprNode | null {
  const stack: ExprNode[] = [];
  for (const tok of rpn) {
    if (tok.type === "num" || tok.type === "const") {
      stack.push({ ...tok, children: [] });
    } else if (tok.type === "op") {
      if (tok.value === "PCT") {
        const a = stack.pop();
        if (!a) throw new Error("Invalid");
        stack.push({ type: "op", value: "PCT", arity: 1, children: [a] });
      } else {
        const b = stack.pop();
        const a = stack.pop();
        if (!a || !b) throw new Error("Invalid");
        stack.push({ type: "op", value: tok.value, arity: 2, children: [a, b] });
      }
    } else if (tok.type === "fn") {
      const arity = tok.arity ?? 1;
      const args: ExprNode[] = [];
      for (let i = 0; i < arity; i++) {
        const v = stack.pop();
        if (!v) throw new Error("Invalid");
        args.unshift(v);
      }
      stack.push({ type: "fn", value: tok.value, arity, children: args });
    }
  }
  return stack.length === 1 ? stack[0] : null;
}

/** Render an AST node back to a human-readable infix string. */
function renderNode(node: ExprNode, parentPrec = 0): string {
  if (node.type === "num") {
    const n = parseFloat(node.value);
    return formatStep(n);
  }
  if (node.type === "const") {
    const sym = node.value === "π" || node.value === "pi" ? "π"
      : node.value === "e" ? "e"
      : node.value === "τ" || node.value === "tau" ? "τ"
      : node.value === "φ" || node.value === "phi" ? "φ"
      : node.value;
    return sym;
  }
  if (node.type === "op") {
    if (node.value === "PCT") {
      return `${renderNode(node.children[0], 6)}%`;
    }
    const op = node.value;
    const sym = op === "*" ? "×" : op === "/" ? "÷" : op === "^" ? "^" : op;
    const myPrec = op === "^" ? 5 : op === "*" || op === "/" ? 3 : 2;
    const left = renderNode(node.children[0], myPrec);
    const right = renderNode(node.children[1], op === "^" ? myPrec - 1 : myPrec + 1);
    const s = `${left} ${sym} ${right}`;
    return myPrec < parentPrec ? `(${s})` : s;
  }
  if (node.type === "fn") {
    const args = node.children.map(c => renderNode(c, 0)).join(", ");
    return `${node.value}(${args})`;
  }
  return "";
}

function formatStep(n: number): string {
  if (!Number.isFinite(n)) return String(n);
  if (n === 0) return "0";
  const abs = Math.abs(n);
  if (abs >= 1e10 || abs < 1e-6) return n.toExponential(6).replace(/\.?0+e/, "e");
  const rounded = parseFloat(n.toPrecision(10));
  let s = rounded.toString();
  if (s.includes(".") && !s.includes("e")) s = s.replace(/\.?0+$/, "");
  return s;
}

/** Resolve constants to their numeric values in the AST (returns substitution steps). */
function resolveConstants(node: ExprNode, steps: Step[]): ExprNode {
  if (node.type === "const") {
    const val = CONSTANTS[node.value];
    steps.push({
      description: `Substitute constant ${renderNode(node)} = ${formatStep(val)}`,
      expression: formatStep(val),
    });
    return { type: "num", value: String(val), children: [] };
  }
  if (node.type === "op" || node.type === "fn") {
    return { ...node, children: node.children.map(c => resolveConstants(c, steps)) };
  }
  return node;
}

/** Resolve percentage operators: X% → X/100. */
function resolvePercent(node: ExprNode, steps: Step[]): ExprNode {
  if (node.type === "op" && node.value === "PCT") {
    const child = resolvePercent(node.children[0], steps);
    const val = evalNodeNumeric(child) / 100;
    steps.push({
      description: `Convert ${renderNode(node.children[0])}% → ${formatStep(evalNodeNumeric(child))} ÷ 100 = ${formatStep(val)}`,
      expression: formatStep(val),
    });
    return { type: "num", value: String(val), children: [] };
  }
  if (node.type === "op" || node.type === "fn") {
    return { ...node, children: node.children.map(c => resolvePercent(c, steps)) };
  }
  return node;
}

/** Quick numeric eval of an AST (for substitution). Assumes fully resolved. */
function evalNodeNumeric(node: ExprNode, angleMode: AngleMode = "deg"): number {
  if (node.type === "num") return parseFloat(node.value);
  if (node.type === "const") return CONSTANTS[node.value];
  if (node.type === "op") {
    if (node.value === "PCT") return evalNodeNumeric(node.children[0], angleMode) / 100;
    const a = evalNodeNumeric(node.children[0], angleMode);
    const b = evalNodeNumeric(node.children[1], angleMode);
    switch (node.value) {
      case "+": return a + b;
      case "-": return a - b;
      case "*": return a * b;
      case "/": return a / b;
      case "^": return Math.pow(a, b);
      case "%": return a - b * Math.floor(a / b);
    }
  }
  if (node.type === "fn") {
    const args = node.children.map(c => evalNodeNumeric(c, angleMode));
    const toRad = (x: number) => (angleMode === "deg" ? (x * Math.PI) / 180 : x);
    const fromRad = (x: number) => (angleMode === "deg" ? (x * 180) / Math.PI : x);
    switch (node.value) {
      case "sin": return Math.sin(toRad(args[0]));
      case "cos": return Math.cos(toRad(args[0]));
      case "tan": return Math.tan(toRad(args[0]));
      case "asin": return fromRad(Math.asin(args[0]));
      case "acos": return fromRad(Math.acos(args[0]));
      case "atan": return fromRad(Math.atan(args[0]));
      case "sqrt": return Math.sqrt(args[0]);
      case "cbrt": return Math.cbrt(args[0]);
      case "abs": return Math.abs(args[0]);
      case "exp": return Math.exp(args[0]);
      case "ln": return Math.log(args[0]);
      case "log": case "log10": return Math.log10(args[0]);
      case "lg": case "log2": return Math.log2(args[0]);
      case "floor": return Math.floor(args[0]);
      case "ceil": return Math.ceil(args[0]);
      case "round": return Math.round(args[0]);
      case "fact": case "factorial": {
        if (Number.isInteger(args[0]) && args[0] >= 0) {
          let r = 1; for (let i = 2; i <= args[0]; i++) r *= i; return r;
        }
        return NaN;
      }
      case "pow": return Math.pow(args[0], args[1]);
      case "gcd": {
        let a = Math.abs(Math.round(args[0])); let b = Math.abs(Math.round(args[1]));
        while (b) { [a, b] = [b, a % b]; } return a;
      }
      case "lcm": {
        if (args[0] === 0 || args[1] === 0) return 0;
        let a = Math.abs(Math.round(args[0])); let b = Math.abs(Math.round(args[1]));
        let g = a; let bb = b; while (bb) { [g, bb] = [bb, g % bb]; }
        return Math.abs(a * b) / g;
      }
      case "mod": return args[0] - args[1] * Math.floor(args[0] / args[1]);
      case "max": return Math.max(args[0], args[1]);
      case "min": return Math.min(args[0], args[1]);
      case "sign": return Math.sign(args[0]);
    }
  }
  return NaN;
}

/** Generate a step-by-step explanation. Returns null if not supported. */
export function explain(expr: string, angleMode: AngleMode = "deg"): { steps: Step[]; result: number } | null {
  try {
    if (!expr || !expr.trim()) return null;
    const tokens = tokenize(expr);
    if (!tokens.length) return null;
    const rpn = toRPN(tokens);
    const ast = buildAST(rpn);
    if (!ast) return null;

    const steps: Step[] = [];
    steps.push({
      description: "Original expression",
      expression: renderNode(ast),
    });

    // Step 1: substitute constants
    const constSteps: Step[] = [];
    const astAfterConst = resolveConstants(ast, constSteps);
    if (constSteps.length > 0) {
      steps.push({
        description: "Substitute mathematical constants",
        expression: renderNode(astAfterConst),
      });
      steps.push(...constSteps);
    }

    // Step 2: resolve percentages
    const pctSteps: Step[] = [];
    const astAfterPct = resolvePercent(astAfterConst, pctSteps);
    if (pctSteps.length > 0) {
      steps.push({
        description: "Resolve percentages",
        expression: renderNode(astAfterPct),
      });
      steps.push(...pctSteps);
    }

    // Step 3: walk the tree and evaluate one operation at a time, deepest-first
    // We do this by repeatedly finding a reducible node and substituting its value.
    let workAst = deepClone(astAfterPct);
    let safety = 100;
    while (!isFullyNumeric(workAst) && safety-- > 0) {
      const reduced = reduceOneStep(workAst, angleMode, steps);
      if (!reduced) break;
      workAst = reduced;
    }

    const result = evalNodeNumeric(astAfterPct, angleMode);
    steps.push({
      description: "Final result",
      expression: formatStep(result),
    });
    return { steps, result };
  } catch {
    return null;
  }
}

function deepClone(node: ExprNode): ExprNode {
  return { ...node, children: node.children.map(deepClone) };
}

function isFullyNumeric(node: ExprNode): boolean {
  return node.type === "num";
}

/** Find the deepest reducible sub-expression, evaluate it, and substitute. */
function reduceOneStep(node: ExprNode, angleMode: AngleMode, steps: Step[]): ExprNode | null {
  // If a child is reducible, recurse.
  if (node.type === "op" || node.type === "fn") {
    for (let i = 0; i < node.children.length; i++) {
      if (!isFullyNumeric(node.children[i])) {
        const reduced = reduceOneStep(node.children[i], angleMode, steps);
        if (reduced) {
          node.children[i] = reduced;
          return node;
        }
      }
    }
    // All children are numeric — evaluate this node.
    if (node.type === "op") {
      if (node.value === "PCT") {
        const val = evalNodeNumeric(node, angleMode);
        const before = renderNode(node);
        steps.push({
          description: `Evaluate ${before} = ${formatStep(val)}`,
          expression: formatStep(val),
        });
        return { type: "num", value: String(val), children: [] };
      }
      const a = evalNodeNumeric(node.children[0], angleMode);
      const b = evalNodeNumeric(node.children[1], angleMode);
      let val: number;
      let detail = "";
      const sym = node.value === "*" ? "×" : node.value === "/" ? "÷" : node.value;
      switch (node.value) {
        case "+": val = a + b; detail = `${formatStep(a)} + ${formatStep(b)} = ${formatStep(val)}`; break;
        case "-": val = a - b; detail = `${formatStep(a)} − ${formatStep(b)} = ${formatStep(val)}`; break;
        case "*": val = a * b; detail = `${formatStep(a)} × ${formatStep(b)} = ${formatStep(val)}`; break;
        case "/": val = a / b; detail = `${formatStep(a)} ÷ ${formatStep(b)} = ${formatStep(val)}`; break;
        case "^": val = Math.pow(a, b); detail = `${formatStep(a)}^${formatStep(b)} = ${formatStep(val)}`; break;
        case "%": val = a - b * Math.floor(a / b); detail = `${formatStep(a)} mod ${formatStep(b)} = ${formatStep(val)}`; break;
        default: return null;
      }
      steps.push({
        description: `Evaluate ${detail}`,
        expression: formatStep(val),
      });
      return { type: "num", value: String(val), children: [] };
    }
    if (node.type === "fn") {
      const args = node.children.map(c => evalNodeNumeric(c, angleMode));
      const val = evalNodeNumeric(node, angleMode);
      const argsStr = args.map(formatStep).join(", ");
      steps.push({
        description: `${node.value}(${argsStr}) = ${formatStep(val)}`,
        expression: formatStep(val),
      });
      return { type: "num", value: String(val), children: [] };
    }
  }
  return null;
}
