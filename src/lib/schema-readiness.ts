export const requiredMigrations = [
  "202611050001_initial",
  "202611130001_checkout_integrity",
  "202611130002_cod_settlement",
  "202611130003_payment_security",
  "202611130004_operations",
  "202611130005_staff_menu_earnings",
  "202611130006_addresses_zones",
  "202611130007_recovery_notifications",
  "202611130008_restaurant_finance",
  "202611130009_finance_indexes",
  "202611140001_admin_onboarding",
  "202611140002_inventory",
  "202611140003_review_cases",
  "202611140004_email_verification",
  "202611150001_reviews_promotions",
] as const;
export function migrationsReady(rows: { migration_name: string; finished_at: Date | null; rolled_back_at: Date | null }[]) {
  const active = rows.filter(row => !row.rolled_back_at);
  return !active.some(row => !row.finished_at) && requiredMigrations.every(name => active.some(row => row.migration_name === name && row.finished_at));
}
