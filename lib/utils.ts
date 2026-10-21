export function formatCount(val: number | undefined | null): string {
  if (val === undefined || val === null || val === 0) return '00';
  if (val > 0 && val < 10) return `0${val}`;
  return `${val}`;
}

export function formatCurrency(val: number | undefined | null): string {
  if (val === undefined || val === null || val === 0) return '£00';
  return `£${val.toLocaleString()}`;
}

export function cn(...classes: (string | boolean | undefined | null)[]): string {
  return classes.filter(Boolean).join(' ');
}
