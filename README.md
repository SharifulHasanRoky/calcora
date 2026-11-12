# CALCORA

**Every Calculation. One Beautiful Experience.**

CALCORA is a premium, all-in-one online calculator platform built with Next.js 16, TypeScript, Tailwind CSS 4, and shadcn/ui. It features **170+ calculators** across **14 categories** — from basic math to country-specific tax, health, finance, developer tools, and everyday utilities.

## Features

- **Universal Calculator** — 6 modes (Basic, Scientific, Programmer with BIN/OCT/DEC/HEX, Fraction, Statistics, Graphing) with shared history panel
- **Live calculation engine** — custom expression parser (tokenizer → shunting-yard → RPN evaluator), never uses `eval()`
- **Explain my calculation** — mathematically-validated step-by-step solutions
- **Intelligent history** — pin, copy, delete, clear (stored in localStorage)
- **Multi-calculation workspace** — run multiple calculations side by side
- **Smart unit converter** — 14 categories (length, weight, temperature, area, volume, speed, time, data, energy, pressure, power, fuel, angle, cooking)
- **Currency converter** — 24 currencies with dedicated pair pages
- **Country-specific tax calculators** — US, UK, Canada, Australia, Bangladesh, India, Malaysia, UAE, Singapore, Germany (verified 2024 brackets)
- **Health calculators** — BMI (with animated scale), BMR, TDEE, body fat, macros, and more
- **Date & time tools** — age, days between, timer, stopwatch, world clock, timezone converter
- **Text tools** — word counter, character counter, lorem ipsum, number to words
- **Number system tools** — Roman numerals, base converters, text↔binary, timestamp
- **Developer tools** — CSS clamp, aspect ratio, subnet/CIDR calculator
- **Random utilities** — dice roller, coin flip, tally counter, random number generator
- **Dark/light theme** — full theme support with system preference
- **PWA-ready** — installable, works offline
- **Privacy-first** — no account required, all calculations local
- **Keyboard support** — full keyboard interaction in the universal calculator
- **Shareable calculations** — copy result, download report, shareable URL
- **Mobile-first responsive** — touch-friendly, works on all screen sizes

## Calculator Categories

| Category | Count | Examples |
|----------|-------|----------|
| Mathematics | 19 | Percentage, Scientific, Quadratic, Graphing, Statistics |
| Finance | 21 | Loan, Mortgage, EMI, SIP, FD, Compound Interest, ROI, CAGR |
| Tax | 14 | Country-specific income tax (10 countries), VAT, GST, Capital Gains |
| Health & Fitness | 11 | BMI, BMR, TDEE, Body Fat, Macros, Water Intake |
| Date & Time | 13 | Age, Days Between, Timer, Stopwatch, World Clock, Timezone |
| Converters | 47 | Unit + Currency (dedicated pair pages included) |
| Business | 4 | Profit, Valuation, Inventory, Shipping |
| Marketing | 8 | CPM, CPC, CTR, CPA, ROAS, CAC, LTV |
| Engineering | 7 | Concrete, Paint, Ohm's Law, Watts to Amps |
| Everyday Tools | 5 | Tip, Split Bill, Unit Price, Savings Goal |
| Text Tools | 4 | Word Counter, Character Counter, Lorem Ipsum, Number to Words |
| Number System | 11 | Roman, Base converters, Text↔Binary, Timestamp |
| Developer Tools | 4 | CSS Clamp, Aspect Ratio, Subnet, CIDR |
| Random & Utility | 4 | Random Number, Dice, Coin Flip, Tally |

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript 5
- **Styling**: Tailwind CSS 4
- **UI Components**: shadcn/ui (New York) + Lucide icons
- **State**: Zustand (client state) + localStorage persistence
- **Fonts**: Inter (body) + JetBrains Mono (numeric display)

## Getting Started

```bash
# Install dependencies
bun install

# Run development server
bun run dev

# Open http://localhost:3000
```

## Project Structure

```
src/
├── app/
│   ├── layout.tsx          # Root layout with theme provider
│   ├── page.tsx            # Main page (SPA with state-based routing)
│   └── globals.css         # Brand colors + dark theme
├── components/
│   ├── calcora-logo.tsx    # Brand logo
│   ├── header.tsx          # Sticky header + mobile sidebar
│   ├── footer.tsx          # Footer
│   ├── calc-page-shell.tsx # Calculator page template
│   ├── calc-router.tsx     # calcId → component router
│   ├── calculator-card.tsx # Directory cards
│   ├── share-dialog.tsx    # Share modal
│   ├── pages/              # Home, Directory, About, Privacy, Terms
│   └── calculators/        # All calculator components
│       ├── universal-calculator.tsx
│       ├── multi-calc-workspace.tsx
│       ├── graphing-calculator.tsx
│       ├── statistics-calculator.tsx
│       ├── fraction-calculator.tsx
│       ├── universal-converter.tsx
│       ├── currency-converter.tsx
│       ├── tax-calculators.tsx
│       ├── math-calcs.tsx
│       ├── finance-calcs.tsx
│       ├── finance-calcs-extra.tsx
│       ├── health-calcs.tsx
│       ├── datetime-calcs.tsx
│       ├── timer-tools.tsx
│       ├── business-calcs.tsx
│       ├── engineering-calcs.tsx
│       ├── everyday-calcs.tsx
│       ├── text-tools.tsx
│       ├── number-system-tools.tsx
│       ├── dev-tools.tsx
│       └── random-tools.tsx
├── lib/
│   ├── math-engine.ts      # Expression parser & evaluator (no eval)
│   ├── explanation-engine.ts # Step-by-step explainer
│   ├── calculators.ts      # Calculator directory (170+ entries)
│   └── store.ts             # Zustand global store
└── public/
    ├── icon.svg
    ├── manifest.webmanifest
    ├── robots.txt
    └── sitemap.xml
```

## Design System

| Token | Light | Dark |
|-------|-------|------|
| Primary | `#635BFF` | `#7C75FF` |
| Background | `#F8FAFC` | `#0B1020` |
| Surface | `#FFFFFF` | `#131A2E` |
| Text | `#111827` | `#F1F5F9` |
| Success | `#16A34A` | `#4ADE80` |
| Error | `#DC2626` | `#F87171` |

8px spacing system, 0.75rem default radius, subtle shadows, micro-interactions.

## Privacy

- No account required
- All calculations run in your browser
- History and favorites stored in localStorage (never sent to servers)
- Shareable links only created when you explicitly click Share
- No tracking of calculation inputs

## Disclaimer

Tax, financial, and health calculators provide **estimates for informational purposes only** — not professional advice. Tax brackets are verified against official sources for the listed tax year. Always consult a qualified professional for decisions that matter.

## License

MIT
