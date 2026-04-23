/**
 * useCBNRate — returns the mock CBN daily FX rate (NGN per 1 USD).
 * In production this would pull from CBN's daily rate feed.
 */
export function useCBNRate() {
  const rate = 1580; // ₦/$1 — mock CBN daily rate
  const asOf = new Date().toISOString().split('T')[0];

  const toUSD = (ngn: number) => ngn / rate;
  const formatUSD = (ngn: number) =>
    new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 2,
    }).format(ngn / rate);

  return { rate, asOf, toUSD, formatUSD };
}
