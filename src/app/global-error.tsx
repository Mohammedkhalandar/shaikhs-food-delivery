"use client";
import { ErrorState } from "@/components/error-state";
export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <html lang="en"><body style={{ margin: 0 }}><ErrorState reset={reset} digest={error.digest} area="root" /></body></html>;
}
