/**
 * Format numbers into Indonesian Rupiah currency format.
 */
export function formatRupiah(amount: number): string {
  if (isNaN(amount)) return 'Rp 0';
  const isNegative = amount < 0;
  const absAmount = Math.abs(Math.round(amount));
  const formatted = absAmount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return `${isNegative ? '- ' : ''}Rp ${formatted}`;
}

/**
 * Compact format for badges or boards (e.g. Rp 4,5 Jt, Rp 250 Rb).
 */
export function formatRupiahShort(amount: number): string {
  if (isNaN(amount)) return 'Rp 0';
  const isNegative = amount < 0;
  const absAmount = Math.abs(amount);

  let result = '';
  if (absAmount >= 1_000_000_000) {
    const val = (absAmount / 1_000_000_000).toFixed(1).replace('.0', '');
    result = `Rp ${val} M`;
  } else if (absAmount >= 1_000_000) {
    const val = (absAmount / 1_000_000).toFixed(1).replace('.0', '');
    result = `Rp ${val} Jt`;
  } else if (absAmount >= 1_000) {
    const val = (absAmount / 1_000).toFixed(0);
    result = `Rp ${val} Rb`;
  } else {
    result = `Rp ${absAmount}`;
  }

  return `${isNegative ? '-' : ''}${result}`;
}

export function formatPercent(val: number): string {
  return `${val.toFixed(1)}%`;
}
