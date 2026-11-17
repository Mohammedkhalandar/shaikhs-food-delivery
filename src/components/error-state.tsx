"use client";
import { useEffect, useId, useRef, useState } from "react";
import Link from "next/link";

export function ErrorState({ reset, digest, area = "route" }: { reset: () => void; digest?: string; area?: "route" | "root" }) {
  const title = useId();
  const reported = useRef(false);
  const [reportId, setReportId] = useState("");
  useEffect(() => {
    if (reported.current) return;
    reported.current = true;
    async function report() {
      try {
        const hash = digest ? Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(digest))), byte => byte.toString(16).padStart(2, "0")).join("") : undefined;
        const response = await fetch("/api/monitoring/client-error", { method: "POST", credentials: "same-origin", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ area, ...(hash ? { fingerprint: hash } : {}) }), signal: AbortSignal.timeout(5000) });
        if (response.ok) { const result = await response.json(); if (/^[a-f0-9-]{36}$/i.test(result.reportId)) setReportId(result.reportId); }
      } catch { /* Optional metadata report; recovery remains usable when offline. */ }
    }
    void report();
  }, [area, digest]);
  return <main className="release-error" aria-labelledby={title}>
    <style>{`.release-error{box-sizing:border-box;min-height:100dvh;background:#faf8f4;color:#22211f;font-family:Arial,sans-serif;display:flex;align-items:center;justify-content:center;padding:24px;margin:0}.release-error section{width:100%;max-width:560px;border-top:3px solid #c9511c;padding-top:28px}.release-error .wordmark{font:700 26px Georgia,serif;color:#a83e13;letter-spacing:-1px}.release-error h1{font:500 clamp(32px,7vw,48px)/1.15 Georgia,serif;margin:35px 0 18px}.release-error p{line-height:1.75;color:#625d55;font-size:16px}.release-error nav{display:flex;gap:12px;flex-wrap:wrap;margin-top:28px}.release-error button,.release-error a{box-sizing:border-box;display:inline-flex;align-items:center;justify-content:center;min-height:48px;padding:12px 18px;border:1px solid #c9511c;border-radius:8px;font:700 14px Arial,sans-serif;text-decoration:none;cursor:pointer}.release-error button{background:#b44316;color:#fff}.release-error a{background:transparent;color:#a83e13}.release-error :focus-visible{outline:3px solid #22211f;outline-offset:4px}.release-error small{display:block;margin-top:26px;color:#625d55;overflow-wrap:anywhere;font-size:12px}.release-error button:active{transform:translateY(1px)}@media(prefers-reduced-motion:reduce){.release-error button:active{transform:none}}`}</style>
    <section>
      <div className="wordmark">shaikh’s</div>
      <h1 id={title}>A little pause.<br />We’ll get you back.</h1>
      <p>This page couldn’t load. Try again, or return to the menu.</p>
      <p>If you were paying, check your orders before trying the payment again.</p>
      <nav aria-label="Page recovery"><button onClick={reset} type="button">Try again</button><Link href="/" prefetch={false}>Return to menu</Link></nav>
      <small role="status" aria-live="polite">{reportId ? `Support reference: ${reportId}` : "Try again when you’re ready."}</small>
    </section>
  </main>;
}
