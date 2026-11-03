export type Currency = 'USD' | 'INR';

export function getCurrencySymbol(currency?: string): string {
  if (currency === 'INR') return '₹';
  return '$';
}

export function formatCurrency(amount: number | string | undefined | null, currency?: string): string {
  const num = Number(amount) || 0;
  const symbol = getCurrencySymbol(currency);
  return `${symbol}${num.toLocaleString()}`;
}

