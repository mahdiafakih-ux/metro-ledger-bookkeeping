export function formatCents(cents: number, opts: { showCents?: boolean } = {}) {
  const dollars = cents / 100;
  return dollars.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: opts.showCents === false ? 0 : 2,
    maximumFractionDigits: opts.showCents === false ? 0 : 2,
  });
}

export function dollarsToCents(dollars: number) {
  return Math.round(dollars * 100);
}

export function centsToDollars(cents: number) {
  return cents / 100;
}
