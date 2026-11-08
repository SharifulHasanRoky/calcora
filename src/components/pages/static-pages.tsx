"use client";

import { CalcoraWordmark } from "@/components/calcora-logo";

export function AboutPage() {
  return (
    <div className="prose prose-slate dark:prose-invert max-w-2xl">
      <h1 className="text-3xl font-bold tracking-tight">About CALCORA</h1>
      <p className="text-lg text-muted-foreground mt-2">
        Every calculation. One beautiful experience.
      </p>
      <p>
        CALCORA is a premium, all-in-one online calculator platform built for students, professionals,
        business owners, freelancers, engineers, and everyday users. Instead of bouncing between five
        different websites for five different calculations, CALCORA brings basic math, scientific
        computing, finance, tax, health, business, marketing, date & time, unit conversion, and
        engineering tools under one consistent, beautiful roof.
      </p>
      <h2 className="text-xl font-semibold mt-8">Our principles</h2>
      <ul>
        <li><strong>Privacy-first.</strong> Calculations run in your browser. History and favorites are stored locally. No account required.</li>
        <li><strong>Mathematically accurate.</strong> A real expression parser (tokenizer → shunting-yard → evaluator) — never JavaScript <code>eval()</code>.</li>
        <li><strong>Transparent.</strong> Every result can be explained step by step. Tax and health formulas are sourced and dated.</li>
        <li><strong>Fast.</strong> Results update live as you type. The app is installable as a PWA and works offline.</li>
        <li><strong>Accessible.</strong> Keyboard navigation, semantic HTML, visible focus, and reduced-motion support throughout.</li>
      </ul>
      <h2 className="text-xl font-semibold mt-8">Disclaimer</h2>
      <p>
        CALCORA provides estimates for informational and educational purposes only. Tax, financial,
        and health results are not professional advice. Always consult a qualified professional for
        decisions that matter.
      </p>
      <div className="mt-10 pt-6 border-t border-border">
        <CalcoraWordmark />
      </div>
    </div>
  );
}

export function PrivacyPage() {
  return (
    <div className="prose prose-slate dark:prose-invert max-w-2xl">
      <h1 className="text-3xl font-bold tracking-tight">Privacy Policy</h1>
      <p className="text-sm text-muted-foreground">Last updated: {new Date().getFullYear()}</p>
      <p>
        CALCORA is built privacy-first. This page explains exactly what we do and do not collect.
      </p>
      <h2 className="text-xl font-semibold mt-6">What stays on your device</h2>
      <ul>
        <li>Your calculation history.</li>
        <li>Your favorited calculators.</li>
        <li>Your recently used calculators.</li>
        <li>Your theme preference (light/dark).</li>
      </ul>
      <p>
        All of the above are stored in your browser's local storage. They never leave your device.
        Clearing your browser data removes them permanently.
      </p>
      <h2 className="text-xl font-semibold mt-6">What we do not collect</h2>
      <ul>
        <li>We do not require an account.</li>
        <li>We do not collect the expressions you type or the results you compute.</li>
        <li>We do not collect personal health values from BMI or health calculators.</li>
        <li>We do not sell data.</li>
      </ul>
      <h2 className="text-xl font-semibold mt-6">Shareable links</h2>
      <p>
        When you explicitly choose to share a calculation, your expression is encoded into the URL.
        That link is only created when you click Share — never automatically.
      </p>
      <h2 className="text-xl font-semibold mt-6">External data</h2>
      <p>
        Currency conversion and certain live data features may call external APIs. Tax and health
        formulas are based on official public sources and are clearly dated. We do not transmit your
        calculation inputs to those services.
      </p>
    </div>
  );
}

export function TermsPage() {
  return (
    <div className="prose prose-slate dark:prose-invert max-w-2xl">
      <h1 className="text-3xl font-bold tracking-tight">Terms of Service</h1>
      <p className="text-sm text-muted-foreground">Last updated: {new Date().getFullYear()}</p>
      <p>
        By using CALCORA, you agree to the following terms.
      </p>
      <h2 className="text-xl font-semibold mt-6">No professional advice</h2>
      <p>
        CALCORA is a calculation utility. Tax, financial, health, and engineering results are
        estimates provided for informational purposes only. They are not legal, tax, financial,
        medical, or engineering advice. Always consult a qualified professional before making
        decisions based on these results.
      </p>
      <h2 className="text-xl font-semibold mt-6">Accuracy</h2>
      <p>
        We strive for mathematical accuracy and use a real expression parser rather than
        <code> eval()</code>. However, formulas, tax brackets, and reference data may lag behind
        official updates. Always verify critical calculations against authoritative sources.
      </p>
      <h2 className="text-xl font-semibold mt-6">Acceptable use</h2>
      <p>
        You may use CALCORA for personal and commercial calculation purposes. You may not attempt
        to disrupt the service, scrape content at scale, or resell CALCORA's calculators as a
        standalone product without permission.
      </p>
      <h2 className="text-xl font-semibold mt-6">Limitation of liability</h2>
      <p>
        CALCORA is provided "as is" without warranty of any kind. We are not liable for damages
        arising from the use of, or reliance on, calculation results.
      </p>
    </div>
  );
}
