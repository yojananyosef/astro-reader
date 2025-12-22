export function normalizePlanId(id: unknown, fallback: string): string {
  if (typeof id === "string" && id.trim().length > 0) return id;
  if (typeof fallback === "string") return fallback;
  return "";
}

