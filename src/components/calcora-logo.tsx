import * as React from "react";

export function CalcoraLogo({ className = "", size = 32 }: { className?: string; size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      className={className}
      aria-label="CALCORA logo"
      role="img"
    >
      <rect width="64" height="64" rx="16" fill="url(#calcora-grad)" />
      <defs>
        <linearGradient id="calcora-grad" x1="0" y1="0" x2="64" y2="64" gradientUnits="userSpaceOnUse">
          <stop stopColor="#635BFF" />
          <stop offset="1" stopColor="#7C75FF" />
        </linearGradient>
      </defs>
      <rect x="14" y="12" width="36" height="40" rx="6" fill="#fff" />
      <rect x="18" y="16" width="28" height="9" rx="3" fill="#635BFF" />
      <circle cx="22.5" cy="33" r="2.4" fill="#635BFF" />
      <circle cx="32" cy="33" r="2.4" fill="#16A34A" />
      <circle cx="41.5" cy="33" r="2.4" fill="#635BFF" />
      <circle cx="22.5" cy="43" r="2.4" fill="#635BFF" />
      <circle cx="32" cy="43" r="2.4" fill="#635BFF" />
      <rect x="38" y="40.6" width="7" height="4.8" rx="2.4" fill="#16A34A" />
    </svg>
  );
}

export function CalcoraWordmark({ className = "" }: { className?: string }) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <CalcoraLogo size={30} />
      <div className="leading-none">
        <div className="font-bold text-[1.05rem] tracking-tight text-foreground">
          CALCO<span className="text-primary">RA</span>
        </div>
      </div>
    </div>
  );
}
