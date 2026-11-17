import { Storefront } from "@/components/storefront";
export const dynamic = "force-dynamic";
export default function Home() {
  let developmentData = false;
  try {
    const database = new URL(process.env.DATABASE_URL ?? "");
    developmentData = ["localhost", "127.0.0.1"].includes(database.hostname) && database.pathname.startsWith("/shaikhs_disposable_");
  } catch { /* Missing configuration is handled by API readiness checks. */ }
  return <>
    {developmentData && <aside className="development-banner" aria-label="Development environment">Development data · Orders, payments and revenue are simulated. No real transactions.</aside>}
    <Storefront />
  </>;
}
