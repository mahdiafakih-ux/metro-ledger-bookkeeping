// Phone-aware text search shared by the client and business agent routes.
// Phones are stored as typed ("(313) 555-0142"), so a digits-only search is
// matched by narrowing on the last four digits in SQL, then comparing digits.

export function digitsOnly(value: string) {
  return value.replace(/\D/g, "");
}

export function phoneMatches(stored: string, searchDigits: string) {
  const d = digitsOnly(stored);
  return d.length > 0 && d.includes(searchDigits);
}

/** Merge result lists by id, preserving order, capped at `limit`. */
export function mergeById<T extends { id: string }>(limit: number, ...lists: T[][]): T[] {
  const seen = new Set<string>();
  const out: T[] = [];
  for (const list of lists) {
    for (const row of list) {
      if (seen.has(row.id)) continue;
      seen.add(row.id);
      out.push(row);
      if (out.length >= limit) return out;
    }
  }
  return out;
}
