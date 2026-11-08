"use client";

import * as React from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Copy, Link2, Download } from "lucide-react";
import { toast } from "sonner";
import { useCalc } from "@/lib/calculators-store-bridge";

export function ShareDialog() {
  const { shareOpen, shareData, closeShare } = useCalc();
  const [shareUrl, setShareUrl] = React.useState("");

  React.useEffect(() => {
    if (shareOpen && shareData) {
      // Encode expression into URL hash (with explicit user consent — share action)
      try {
        const encoded = btoa(encodeURIComponent(shareData.expr));
        setShareUrl(`${window.location.origin}${window.location.pathname}#calc=${encoded}`);
      } catch {
        setShareUrl("");
      }
    }
  }, [shareOpen, shareData]);

  const copyText = (text: string, label: string) => {
    navigator.clipboard?.writeText(text).then(() => toast.success(`${label} copied`));
  };

  const downloadReport = () => {
    if (!shareData) return;
    const content = `CALCORA — Calculation Report
Generated: ${new Date().toLocaleString()}

Expression:
${shareData.expr}

Result:
${shareData.result}

${shareData.explanation ? `Explanation:\n${shareData.explanation}\n` : ""}
---
CALCORA — Every Calculation. One Beautiful Experience.
`;
    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `calcora-calculation-${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Report downloaded");
  };

  return (
    <Dialog open={shareOpen} onOpenChange={(o) => !o && closeShare()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Share calculation</DialogTitle>
          <DialogDescription>
            Copy the result, expression, or a shareable link. Sharing is explicit — your calculation is not made public until you share it.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          {shareData && (
            <>
              <div className="rounded-xl bg-muted/40 p-3 space-y-1">
                <div className="text-xs text-muted-foreground">Expression</div>
                <div className="font-mono text-sm break-all">{shareData.expr}</div>
                <div className="text-xs text-muted-foreground mt-2">Result</div>
                <div className="font-mono text-lg font-bold break-all">{shareData.result}</div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <Button variant="outline" onClick={() => copyText(shareData.result, "Result")}>
                  <Copy className="size-4" /> Copy result
                </Button>
                <Button variant="outline" onClick={() => copyText(shareData.expr, "Expression")}>
                  <Copy className="size-4" /> Copy expression
                </Button>
              </div>

              <Button variant="outline" className="w-full" onClick={downloadReport}>
                <Download className="size-4" /> Download report
              </Button>

              {shareUrl && (
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">Shareable link</label>
                  <div className="flex gap-2">
                    <Input readOnly value={shareUrl} className="text-xs font-mono" />
                    <Button size="icon" onClick={() => copyText(shareUrl, "Link")}>
                      <Link2 className="size-4" />
                    </Button>
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    The link encodes your expression in the URL. Anyone with the link can see the expression — share only with people you trust.
                  </p>
                </div>
              )}
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
