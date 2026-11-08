"use client";

import * as React from "react";
import { Header, MobileSidebar } from "@/components/header";
import { Footer } from "@/components/footer";
import { HomePage } from "@/components/pages/home-page";
import { DirectoryPage } from "@/components/pages/directory-page";
import { AboutPage, PrivacyPage, TermsPage } from "@/components/pages/static-pages";
import { ShareDialog } from "@/components/share-dialog";
import { CalcRouter } from "@/components/calc-router";
import { useCalc } from "@/lib/calculators-store-bridge";

export default function Home() {
  const { activeView, activeCalcId } = useCalc();

  // Read shared calculation from URL hash on mount
  React.useEffect(() => {
    if (typeof window === "undefined") return;
    const hash = window.location.hash;
    const match = hash.match(/calc=([^&]+)/);
    if (match) {
      try {
        const expr = decodeURIComponent(atob(match[1]));
        // Pre-fill the universal calculator by switching to it
        const evt = new CustomEvent("calcora:prefill", { detail: expr });
        window.dispatchEvent(evt);
      } catch { /* ignore */ }
    }
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <MobileSidebar />
      <main className="flex-1 mx-auto w-full max-w-7xl px-4 sm:px-6 py-6 sm:py-8">
        {activeView === "home" && <HomePage />}
        {activeView === "directory" && <DirectoryPage />}
        {activeView === "about" && <AboutPage />}
        {activeView === "privacy" && <PrivacyPage />}
        {activeView === "terms" && <TermsPage />}
        {activeView === "calculator" && <CalcRouter calcId={activeCalcId} />}
      </main>
      <Footer />
      <ShareDialog />
    </div>
  );
}
