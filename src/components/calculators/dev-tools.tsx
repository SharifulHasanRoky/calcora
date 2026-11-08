"use client";

import * as React from "react";
import { Field, ResultStat } from "@/components/calc-page-shell";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Copy } from "lucide-react";

/* ------------------------------------------------------------------ */
/*  Router                                                             */
/* ------------------------------------------------------------------ */

export function DevTools({ calcId }: { calcId: string }) {
  switch (calcId) {
    case "css-clamp": return <CssClamp />;
    case "aspect-ratio": return <AspectRatio />;
    case "subnet-calculator": return <SubnetCalculator />;
    case "cidr-calculator": return <CidrCalculator />;
    default: return null;
  }
}

/* ------------------------------------------------------------------ */
/*  Shared helpers                                                     */
/* ------------------------------------------------------------------ */

function fmtNum(n: number, digits = 4): string {
  if (!Number.isFinite(n)) return "—";
  return parseFloat(n.toFixed(digits)).toString();
}

function copyText(text: string, label: string) {
  if (typeof navigator !== "undefined" && navigator.clipboard) {
    navigator.clipboard.writeText(text).then(
      () => toast.success(`${label} copied`),
      () => toast.error("Copy failed"),
    );
  } else {
    toast.error("Clipboard unavailable");
  }
}

/* ----- IPv4 helpers (shared by subnet + CIDR tools) ---------------- */

function ipToInt(ip: string): number | null {
  if (typeof ip !== "string") return null;
  const trimmed = ip.trim();
  if (!/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(trimmed)) return null;
  const parts = trimmed.split(".").map(p => parseInt(p, 10));
  if (parts.length !== 4 || parts.some(p => isNaN(p) || p < 0 || p > 255)) return null;
  return (((parts[0] << 24) | (parts[1] << 16) | (parts[2] << 8) | parts[3]) >>> 0);
}

function intToIp(n: number): string {
  return [(n >>> 24) & 255, (n >>> 16) & 255, (n >>> 8) & 255, n & 255].join(".");
}

function cidrToMask(cidr: number): number {
  if (cidr <= 0) return 0;
  if (cidr >= 32) return 0xffffffff;
  return (0xffffffff << (32 - cidr)) >>> 0;
}

function maskToCidr(mask: number): number | null {
  if (mask === 0) return 0;
  let cidr = 0;
  for (let i = 31; i >= 0; i--) {
    if ((mask >>> i) & 1) cidr++;
    else break;
  }
  return cidrToMask(cidr) === mask ? cidr : null;
}

function ipClass(firstOctet: number): string {
  if (firstOctet === 0) return "Reserved";
  if (firstOctet === 127) return "A (loopback)";
  if (firstOctet >= 1 && firstOctet <= 126) return "A";
  if (firstOctet >= 128 && firstOctet <= 191) return "B";
  if (firstOctet >= 192 && firstOctet <= 223) return "C";
  if (firstOctet >= 224 && firstOctet <= 239) return "D (multicast)";
  if (firstOctet >= 240 && firstOctet <= 255) return "E (reserved)";
  return "—";
}

function isPrivate(ip: string): boolean {
  const parts = ip.trim().split(".").map(p => parseInt(p, 10));
  if (parts.length !== 4 || parts.some(isNaN)) return false;
  if (parts[0] === 10) return true;
  if (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) return true;
  if (parts[0] === 192 && parts[1] === 168) return true;
  return false;
}

interface SubnetInfo {
  network: number;
  broadcast: number;
  firstHost: number;
  lastHost: number;
  hostCount: number;
  totalAddresses: number;
  mask: number;
  cidr: number;
}

function computeSubnet(ipInt: number, cidr: number): SubnetInfo {
  const mask = cidrToMask(cidr);
  const network = (ipInt & mask) >>> 0;
  const broadcast = (network | (~mask >>> 0)) >>> 0;
  const firstHost =
    cidr >= 31 ? network : (network + 1) >>> 0;
  const lastHost =
    cidr >= 31 ? broadcast : (broadcast - 1) >>> 0;
  const totalAddresses = Math.pow(2, 32 - cidr);
  const hostCount =
    cidr >= 31 ? (cidr === 32 ? 1 : 2) : totalAddresses - 2;
  return { network, broadcast, firstHost, lastHost, hostCount, totalAddresses, mask, cidr };
}

function parseMaskInput(input: string): { cidr: number; mask: number } | null {
  const trimmed = input.trim();
  if (!trimmed) return null;

  // CIDR form: "/24" or "24"
  let cidrStr = trimmed;
  if (trimmed.startsWith("/")) cidrStr = trimmed.slice(1);
  if (/^\d+$/.test(cidrStr)) {
    const c = parseInt(cidrStr, 10);
    if (c >= 0 && c <= 32) return { cidr: c, mask: cidrToMask(c) };
  }

  // Dotted-decimal form: "255.255.255.0"
  const m = ipToInt(trimmed);
  if (m !== null) {
    const c = maskToCidr(m);
    if (c !== null) return { cidr: c, mask: m };
  }
  return null;
}

function parseCidrBlock(input: string): { ipInt: number; cidr: number; mask: number } | null {
  const trimmed = input.trim();
  const slash = trimmed.indexOf("/");
  if (slash < 0) return null;
  const ipPart = trimmed.slice(0, slash);
  const cidrPart = trimmed.slice(slash + 1);
  const ipInt = ipToInt(ipPart);
  if (ipInt === null) return null;
  const cidr = parseInt(cidrPart, 10);
  if (isNaN(cidr) || cidr < 0 || cidr > 32) return null;
  return { ipInt, cidr, mask: cidrToMask(cidr) };
}

const selectClass =
  "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:ring-ring/50 focus-visible:ring-[3px] focus-visible:border-ring outline-none";

/* ------------------------------------------------------------------ */
/*  1. CSS Clamp Calculator                                            */
/* ------------------------------------------------------------------ */

function CssClamp() {
  const [minSize, setMinSize] = React.useState("16");
  const [maxSize, setMaxSize] = React.useState("32");
  const [minVp, setMinVp] = React.useState("320");
  const [maxVp, setMaxVp] = React.useState("1200");

  const min = parseFloat(minSize);
  const max = parseFloat(maxSize);
  const minV = parseFloat(minVp);
  const maxV = parseFloat(maxVp);

  const valid =
    [min, max, minV, maxV].every(n => Number.isFinite(n) && n > 0) &&
    max > min && maxV > minV;

  // slope = px change per px of viewport
  const slope = valid ? (max - min) / (maxV - minV) : 0;
  // Express preferred as: (pxPart) + (vwPart)vw
  const vwPart = slope * 100;
  const pxPart = min - slope * minV;
  const midVp = (minV + maxV) / 2;
  const preferredAtMid = (min + max) / 2;

  const cssValue = valid
    ? `clamp(${fmtNum(min)}px, ${fmtNum(pxPart)}px + ${fmtNum(vwPart)}vw, ${fmtNum(max)}px)`
    : "";
  const cssRule = `font-size: ${cssValue};`;

  return (
    <div className="space-y-4">
      <div className="grid sm:grid-cols-2 gap-4">
        <Field label="Min font size (px)" hint="Font size at the smallest viewport">
          <Input type="number" value={minSize} onChange={e => setMinSize(e.target.value)} min="1" step="any" className="font-mono" />
        </Field>
        <Field label="Max font size (px)" hint="Font size at the largest viewport">
          <Input type="number" value={maxSize} onChange={e => setMaxSize(e.target.value)} min="1" step="any" className="font-mono" />
        </Field>
        <Field label="Min viewport (px)" hint="Viewport width where min size applies">
          <Input type="number" value={minVp} onChange={e => setMinVp(e.target.value)} min="1" step="any" className="font-mono" />
        </Field>
        <Field label="Max viewport (px)" hint="Viewport width where max size applies">
          <Input type="number" value={maxVp} onChange={e => setMaxVp(e.target.value)} min="1" step="any" className="font-mono" />
        </Field>
      </div>

      {valid ? (
        <>
          <div className="rounded-2xl border border-border bg-card p-4">
            <div className="flex items-center justify-between gap-3 mb-2">
              <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Generated CSS</div>
              <Button variant="outline" size="sm" onClick={() => copyText(cssRule, "CSS rule")}>
                <Copy className="size-3.5" /> Copy
              </Button>
            </div>
            <pre className="font-mono text-sm bg-muted/40 rounded-md p-3 overflow-x-auto"><code>{cssRule}</code></pre>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <ResultStat label="Slope" value={fmtNum(slope)} sublabel="px per px of viewport" accent="primary" />
            <ResultStat label="Preferred at midpoint" value={`${fmtNum(preferredAtMid)}px`} sublabel={`at ${fmtNum(midVp)}px viewport`} accent="success" />
            <ResultStat label="VW coefficient" value={`${fmtNum(vwPart)}vw`} sublabel="slope × 100" />
            <ResultStat label="PX offset" value={`${fmtNum(pxPart)}px`} sublabel="base added to vw part" />
            <ResultStat label="Min size" value={`${fmtNum(min)}px`} sublabel={`at ≤ ${fmtNum(minV)}px viewport`} />
            <ResultStat label="Max size" value={`${fmtNum(max)}px`} sublabel={`at ≥ ${fmtNum(maxV)}px viewport`} />
          </div>

          <div className="rounded-2xl border border-border bg-card p-4">
            <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">
              Live preview — resize your browser window
            </div>
            <p
              style={{ fontSize: cssValue }}
              className="font-bold leading-tight text-foreground"
            >
              The quick brown fox jumps over the lazy dog.
            </p>
            <p
              style={{ fontSize: `clamp(${fmtNum(min * 0.625)}px, ${fmtNum(pxPart * 0.625)}px + ${fmtNum(vwPart * 0.625)}vw, ${fmtNum(max * 0.625)}px)` }}
              className="text-muted-foreground mt-3"
            >
              Body text scales proportionally with the heading above.
            </p>
          </div>
        </>
      ) : (
        <div className="text-center py-8 text-muted-foreground">
          Enter valid sizes and viewports. Max size must exceed min size, and max viewport must exceed min viewport.
        </div>
      )}

      <div className="rounded-xl bg-muted/30 border border-border p-4 text-sm text-muted-foreground">
        <strong className="text-foreground">About CSS clamp():</strong> The <code>clamp()</code> function lets a value scale fluidly between a minimum and maximum based on a preferred value, usually expressed in viewport units (vw). Below the min viewport the min size is used; above the max viewport the max size is used; in between, the size scales linearly. This is the modern, dependency-free way to do fluid typography. The preferred value is rewritten as <code>(pxPart) + (vwPart)vw</code> using the slope <code>(max − min) / (maxViewport − minViewport)</code>.
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  2. Aspect Ratio Calculator                                         */
/* ------------------------------------------------------------------ */

const RATIO_PRESETS: [string, string][] = [
  ["16", "9"], ["4", "3"], ["21", "9"], ["1", "1"], ["3", "2"], ["9", "16"], ["2", "3"],
];

function AspectRatio() {
  const [ratioW, setRatioW] = React.useState("16");
  const [ratioH, setRatioH] = React.useState("9");
  const [known, setKnown] = React.useState<"width" | "height">("width");
  const [value, setValue] = React.useState("1920");

  const rw = parseFloat(ratioW);
  const rh = parseFloat(ratioH);
  const v = parseFloat(value);

  const valid = [rw, rh, v].every(n => Number.isFinite(n) && n > 0);

  const decimal = valid ? rw / rh : 0;        // e.g. 1.778
  const percentage = valid ? (rh / rw) * 100 : 0; // e.g. 56.25
  const inverse = valid ? rh / rw : 0;

  const computedWidth = valid
    ? known === "width" ? v : v * (rw / rh)
    : 0;
  const computedHeight = valid
    ? known === "height" ? v : v * (rh / rw)
    : 0;

  // Fit a preview rectangle inside a 320×200 box while preserving the ratio
  const maxW = 320, maxH = 200;
  let prevW = 0, prevH = 0;
  if (valid) {
    const r = rw / rh;
    if (r >= maxW / maxH) { prevW = maxW; prevH = maxW / r; }
    else { prevH = maxH; prevW = maxH * r; }
  }

  const cssSnippet = valid
    ? `.aspect-box {\n  aspect-ratio: ${fmtNum(rw)} / ${fmtNum(rh)};\n  /* or padding-bottom: ${fmtNum(percentage)}%; */\n}`
    : "";

  return (
    <div className="space-y-4">
      <div>
        <div className="text-sm font-medium text-foreground mb-2">Common ratio presets</div>
        <div className="flex flex-wrap gap-2">
          {RATIO_PRESETS.map(([w, h]) => (
            <Button
              key={`${w}:${h}`}
              variant={ratioW === w && ratioH === h ? "default" : "outline"}
              size="sm"
              onClick={() => { setRatioW(w); setRatioH(h); }}
            >
              {w}:{h}
            </Button>
          ))}
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <Field label="Ratio width">
          <Input type="number" value={ratioW} onChange={e => setRatioW(e.target.value)} min="1" step="any" className="font-mono" />
        </Field>
        <Field label="Ratio height">
          <Input type="number" value={ratioH} onChange={e => setRatioH(e.target.value)} min="1" step="any" className="font-mono" />
        </Field>
        <Field label="Known dimension">
          <select value={known} onChange={e => setKnown(e.target.value as "width" | "height")} className={selectClass}>
            <option value="width">Width</option>
            <option value="height">Height</option>
          </select>
        </Field>
        <Field label={`${known === "width" ? "Width" : "Height"} value (px)`}>
          <Input type="number" value={value} onChange={e => setValue(e.target.value)} min="1" step="any" className="font-mono" />
        </Field>
      </div>

      {valid ? (
        <>
          <div className="grid sm:grid-cols-2 gap-4">
            <ResultStat
              label={known === "width" ? "Computed height" : "Computed width"}
              value={`${fmtNum(known === "width" ? computedHeight : computedWidth)}px`}
              accent="primary"
              sublabel={`from ${fmtNum(v)}px ${known}`}
            />
            <ResultStat
              label={known === "width" ? "Width (known)" : "Height (known)"}
              value={`${fmtNum(v)}px`}
              sublabel={`ratio ${fmtNum(rw)}:${fmtNum(rh)}`}
            />
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <ResultStat label="Decimal ratio" value={fmtNum(decimal)} sublabel={`${fmtNum(rw)} ÷ ${fmtNum(rh)}`} />
            <ResultStat label="Percentage" value={`${fmtNum(percentage)}%`} sublabel="CSS padding-bottom trick" accent="success" />
            <ResultStat label="Inverse ratio" value={fmtNum(inverse)} sublabel={`${fmtNum(rh)} ÷ ${fmtNum(rw)}`} />
          </div>

          <div className="rounded-2xl border border-border bg-card p-4">
            <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">Visual preview</div>
            <div className="flex items-center justify-center" style={{ minHeight: 220 }}>
              <div
                style={{ width: prevW, height: prevH }}
                className="rounded-lg flex items-center justify-center bg-primary text-primary-foreground font-mono text-sm shadow-md"
              >
                {fmtNum(rw)} : {fmtNum(rh)}
              </div>
            </div>
            <div className="text-xs text-muted-foreground text-center mt-3">
              Preview scaled to fit {Math.round(prevW)}×{Math.round(prevH)}px
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-card p-4">
            <div className="flex items-center justify-between gap-3 mb-2">
              <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider">CSS snippet</div>
              <Button variant="outline" size="sm" onClick={() => copyText(`aspect-ratio: ${fmtNum(rw)} / ${fmtNum(rh)};`, "CSS")}>
                <Copy className="size-3.5" /> Copy
              </Button>
            </div>
            <pre className="font-mono text-sm bg-muted/40 rounded-md p-3 overflow-x-auto"><code>{cssSnippet}</code></pre>
          </div>
        </>
      ) : (
        <div className="text-center py-8 text-muted-foreground">
          Enter a valid ratio (both numbers greater than zero) and a known dimension.
        </div>
      )}

      <div className="rounded-xl bg-muted/30 border border-border p-4 text-sm text-muted-foreground">
        <strong className="text-foreground">About aspect ratios:</strong> An aspect ratio is the proportional relationship between width and height (e.g. 16:9 means 16 units wide for every 9 tall). Modern CSS supports the <code>aspect-ratio</code> property directly. The padding-bottom trick (using a percentage equal to <code>height ÷ width × 100</code>) is a legacy technique for creating responsive boxes that maintain a fixed ratio before <code>aspect-ratio</code> existed.
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  3. Subnet Calculator                                               */
/* ------------------------------------------------------------------ */

function SubnetCalculator() {
  const [ip, setIp] = React.useState("192.168.1.10");
  const [maskInput, setMaskInput] = React.useState("/24");

  const ipInt = ipToInt(ip);
  const parsedMask = parseMaskInput(maskInput);
  const valid = ipInt !== null && parsedMask !== null;
  const info = valid && ipInt !== null && parsedMask !== null
    ? computeSubnet(ipInt, parsedMask.cidr)
    : null;

  const firstOctet = parseInt(ip.trim().split(".")[0] || "0", 10);
  const priv = valid ? isPrivate(ip) : false;
  const ipClassLabel = valid ? ipClass(firstOctet) : "—";

  return (
    <div className="space-y-4">
      <div className="grid sm:grid-cols-2 gap-4">
        <Field label="IP address" hint="IPv4, e.g. 192.168.1.10">
          <Input value={ip} onChange={e => setIp(e.target.value)} placeholder="192.168.1.10" className="font-mono" />
        </Field>
        <Field label="Subnet mask" hint="CIDR (/24) or dotted decimal (255.255.255.0)">
          <Input value={maskInput} onChange={e => setMaskInput(e.target.value)} placeholder="/24" className="font-mono" />
        </Field>
      </div>

      {valid && info ? (
        <>
          {/* Headline network address with copy */}
          <div className="rounded-2xl border border-primary/30 bg-primary/5 p-4">
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Network address</div>
                <div className="text-2xl font-bold font-mono mt-1 break-all">{intToIp(info.network)}</div>
                <div className="text-xs text-muted-foreground mt-1 font-mono">{ip}/{info.cidr}</div>
              </div>
              <Button variant="outline" size="sm" onClick={() => copyText(`${intToIp(info.network)}/${info.cidr}`, "CIDR block")} className="shrink-0">
                <Copy className="size-3.5" /> Copy
              </Button>
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <ResultStat label="Broadcast address" value={intToIp(info.broadcast)} accent="warning" />
            <ResultStat label="Subnet mask" value={intToIp(info.mask)} sublabel={`/${info.cidr}`} />
            <ResultStat label="Usable hosts" value={info.hostCount.toLocaleString()} sublabel="2^(32−cidr) − 2" accent="success" />
            <ResultStat label="CIDR notation" value={`/${info.cidr}`} sublabel={`${info.totalAddresses.toLocaleString()} total addresses`} />
          </div>

          {/* Wide range card */}
          <div className="rounded-2xl border border-border bg-card p-4">
            <div className="flex items-center justify-between gap-3 mb-1">
              <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Usable IP range</div>
              <Button variant="outline" size="sm" onClick={() => copyText(`${intToIp(info.firstHost)} - ${intToIp(info.lastHost)}`, "IP range")}>
                <Copy className="size-3.5" /> Copy
              </Button>
            </div>
            <div className="text-base sm:text-lg font-bold font-mono mt-1 break-all">
              {intToIp(info.firstHost)} <span className="text-muted-foreground font-normal">—</span> {intToIp(info.lastHost)}
            </div>
            <div className="text-xs text-muted-foreground mt-1">first usable — last usable</div>
          </div>

          <div className="rounded-2xl border border-border bg-card p-4">
            <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">Additional details</div>
            <dl className="grid sm:grid-cols-2 gap-x-6 gap-y-2 text-sm">
              <DetailRow label="IP class" value={ipClassLabel} />
              <DetailRow label="Private address" value={priv ? "Yes" : "No"} />
              <DetailRow label="First usable host" value={intToIp(info.firstHost)} mono />
              <DetailRow label="Last usable host" value={intToIp(info.lastHost)} mono />
              <DetailRow label="Total addresses" value={info.totalAddresses.toLocaleString()} mono />
              <DetailRow label="Usable hosts" value={info.hostCount.toLocaleString()} mono />
              <DetailRow
                label="Private range"
                value={priv ? privateRangeName(ip) : "Public (not RFC 1918)"}
              />
              <DetailRow label="Wildcard mask" value={intToIp((~info.mask) >>> 0)} mono />
            </dl>
          </div>
        </>
      ) : (
        <div className="text-center py-8 text-muted-foreground">
          Enter a valid IPv4 address (four octets 0–255) and a subnet mask in CIDR (<code>/0</code>–<code>/32</code>) or dotted-decimal form.
        </div>
      )}

      <div className="rounded-xl bg-muted/30 border border-border p-4 text-sm text-muted-foreground">
        <strong className="text-foreground">About subnets:</strong> A subnet mask divides an IP address into a network portion and a host portion. CIDR notation (e.g. <code>/24</code>) indicates how many leading bits form the network prefix. The network address is the first address in the subnet (all host bits 0); the broadcast is the last (all host bits 1). Usable host addresses exclude both. Private ranges (<code>10.x</code>, <code>172.16–31.x</code>, <code>192.168.x</code>) are defined in RFC 1918 and are not routable on the public internet.
      </div>
    </div>
  );
}

function privateRangeName(ip: string): string {
  const p = ip.trim().split(".").map(x => parseInt(x, 10));
  if (p[0] === 10) return "10.0.0.0/8 (RFC 1918)";
  if (p[0] === 172 && p[1] >= 16 && p[1] <= 31) return "172.16.0.0/12 (RFC 1918)";
  if (p[0] === 192 && p[1] === 168) return "192.168.0.0/16 (RFC 1918)";
  return "—";
}

function DetailRow({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex justify-between items-baseline gap-2 border-b border-border/50 py-1">
      <dt className="text-muted-foreground text-xs uppercase tracking-wider">{label}</dt>
      <dd className={mono ? "font-mono text-sm" : "text-sm"}>{value}</dd>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  4. CIDR Calculator                                                 */
/* ------------------------------------------------------------------ */

interface SubnetRow {
  cidr: number;
  network: number;
  firstHost: number;
  lastHost: number;
  broadcast: number;
  hostCount: number;
}

function buildSubnetGroups(parentNetwork: number, parentCidr: number): { label: string; rows: SubnetRow[] }[] {
  const groups: { label: string; rows: SubnetRow[] }[] = [];
  for (const offset of [1, 2, 3]) {
    const newCidr = parentCidr + offset;
    if (newCidr > 32) continue;
    const count = Math.pow(2, offset);
    const blockSize = Math.pow(2, 32 - newCidr);
    const rows: SubnetRow[] = [];
    for (let i = 0; i < count; i++) {
      const subNet = (parentNetwork + i * blockSize) >>> 0;
      const subBcast = (subNet + blockSize - 1) >>> 0;
      const subFirst = newCidr >= 31 ? subNet : (subNet + 1) >>> 0;
      const subLast = newCidr >= 31 ? subBcast : (subBcast - 1) >>> 0;
      const subHosts = newCidr >= 31 ? (newCidr === 32 ? 1 : 2) : blockSize - 2;
      rows.push({ cidr: newCidr, network: subNet, firstHost: subFirst, lastHost: subLast, broadcast: subBcast, hostCount: subHosts });
    }
    groups.push({ label: `${count} × /${newCidr} subnet${count > 1 ? "s" : ""}`, rows });
  }
  return groups;
}

function CidrCalculator() {
  const [cidrBlock, setCidrBlock] = React.useState("10.0.0.0/16");

  const parsed = parseCidrBlock(cidrBlock);
  const valid = parsed !== null;
  const info = valid && parsed !== null ? computeSubnet(parsed.ipInt, parsed.cidr) : null;
  const subnetGroups = valid && info !== null ? buildSubnetGroups(info.network, info.cidr) : [];

  const firstOctet = valid && parsed !== null
    ? (parsed.ipInt >>> 24) & 255
    : 0;
  const ipClassLabel = valid ? ipClass(firstOctet) : "—";
  const priv = valid && parsed !== null ? isPrivate(intToIp(parsed.ipInt)) : false;

  return (
    <div className="space-y-4">
      <Field label="CIDR block" hint="IPv4 CIDR notation, e.g. 10.0.0.0/16">
        <Input value={cidrBlock} onChange={e => setCidrBlock(e.target.value)} placeholder="10.0.0.0/16" className="font-mono" />
      </Field>

      {valid && info !== null && parsed !== null ? (
        <>
          {/* Headline CIDR block with copy */}
          <div className="rounded-2xl border border-primary/30 bg-primary/5 p-4">
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider">CIDR block</div>
                <div className="text-2xl font-bold font-mono mt-1 break-all">{intToIp(info.network)}/{info.cidr}</div>
                <div className="text-xs text-muted-foreground mt-1 font-mono">{intToIp(info.mask)} · {info.totalAddresses.toLocaleString()} addresses</div>
              </div>
              <Button variant="outline" size="sm" onClick={() => copyText(`${intToIp(info.network)}/${info.cidr}`, "CIDR block")} className="shrink-0">
                <Copy className="size-3.5" /> Copy
              </Button>
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <ResultStat label="Network address" value={intToIp(info.network)} accent="primary" />
            <ResultStat label="Broadcast address" value={intToIp(info.broadcast)} accent="warning" />
            <ResultStat label="Subnet mask" value={intToIp(info.mask)} sublabel={`/${info.cidr}`} />
            <ResultStat label="Usable hosts" value={info.hostCount.toLocaleString()} sublabel="2^(32−cidr) − 2" accent="success" />
          </div>

          {/* Wide range card */}
          <div className="rounded-2xl border border-border bg-card p-4">
            <div className="flex items-center justify-between gap-3 mb-1">
              <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Usable host range</div>
              <Button variant="outline" size="sm" onClick={() => copyText(`${intToIp(info.firstHost)} - ${intToIp(info.lastHost)}`, "Host range")}>
                <Copy className="size-3.5" /> Copy
              </Button>
            </div>
            <div className="text-base sm:text-lg font-bold font-mono mt-1 break-all">
              {intToIp(info.firstHost)} <span className="text-muted-foreground font-normal">—</span> {intToIp(info.lastHost)}
            </div>
            <div className="text-xs text-muted-foreground mt-1">first usable — last usable</div>
          </div>

          <div className="rounded-2xl border border-border bg-card p-4">
            <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">Block details</div>
            <dl className="grid sm:grid-cols-2 gap-x-6 gap-y-2 text-sm">
              <DetailRow label="CIDR prefix" value={`/${info.cidr}`} mono />
              <DetailRow label="Total addresses" value={info.totalAddresses.toLocaleString()} mono />
              <DetailRow label="Usable hosts" value={info.hostCount.toLocaleString()} mono />
              <DetailRow label="Wildcard mask" value={intToIp((~info.mask) >>> 0)} mono />
              <DetailRow label="IP class" value={ipClassLabel} />
              <DetailRow label="Private address" value={priv ? "Yes" : "No"} />
            </dl>
          </div>

          {/* Subnet division table */}
          {subnetGroups.length > 0 && (
            <div className="rounded-2xl border border-border bg-card p-4">
              <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">Subnet division</div>
              <p className="text-xs text-muted-foreground mb-4">
                Dividing <code className="font-mono">{intToIp(info.network)}/{info.cidr}</code> into smaller blocks. Each row shows a subnet's network, usable range, and broadcast.
              </p>
              <div className="space-y-5">
                {subnetGroups.map(group => (
                  <div key={group.label}>
                    <div className="text-sm font-semibold mb-2">{group.label}</div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs font-mono">
                        <thead>
                          <tr className="text-left text-muted-foreground border-b border-border">
                            <th className="py-1.5 pr-3 font-medium">Network</th>
                            <th className="py-1.5 pr-3 font-medium">CIDR</th>
                            <th className="py-1.5 pr-3 font-medium">First host</th>
                            <th className="py-1.5 pr-3 font-medium">Last host</th>
                            <th className="py-1.5 pr-3 font-medium">Broadcast</th>
                            <th className="py-1.5 font-medium text-right">Hosts</th>
                          </tr>
                        </thead>
                        <tbody>
                          {group.rows.map((row, i) => (
                            <tr key={i} className="border-b border-border/40">
                              <td className="py-1.5 pr-3">{intToIp(row.network)}</td>
                              <td className="py-1.5 pr-3">/{row.cidr}</td>
                              <td className="py-1.5 pr-3">{intToIp(row.firstHost)}</td>
                              <td className="py-1.5 pr-3">{intToIp(row.lastHost)}</td>
                              <td className="py-1.5 pr-3">{intToIp(row.broadcast)}</td>
                              <td className="py-1.5 text-right">{row.hostCount.toLocaleString()}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Quick copy buttons */}
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={() => copyText(intToIp(info.network), "Network")}>
              <Copy className="size-3.5" /> Network
            </Button>
            <Button variant="outline" size="sm" onClick={() => copyText(intToIp(info.broadcast), "Broadcast")}>
              <Copy className="size-3.5" /> Broadcast
            </Button>
            <Button variant="outline" size="sm" onClick={() => copyText(intToIp(info.mask), "Mask")}>
              <Copy className="size-3.5" /> Mask
            </Button>
          </div>
        </>
      ) : (
        <div className="text-center py-8 text-muted-foreground">
          Enter a valid IPv4 CIDR block in the form <code>ip/cidr</code> (e.g. <code>10.0.0.0/16</code>). The prefix must be 0–32.
        </div>
      )}

      <div className="rounded-xl bg-muted/30 border border-border p-4 text-sm text-muted-foreground">
        <strong className="text-foreground">About CIDR notation:</strong> Classless Inter-Domain Routing (CIDR) represents an IP network compactly as <code>ip/prefix</code>, where the prefix is the number of leading network bits. A <code>/24</code> has 256 total addresses (254 usable), a <code>/16</code> has 65,536 (65,534 usable), and a <code>/8</code> has 16,777,216. CIDR replaced the rigid classful system and enables flexible subnetting — any block can be subdivided into smaller blocks by increasing the prefix length, doubling the number of subnets with each additional bit.
      </div>
    </div>
  );
}
