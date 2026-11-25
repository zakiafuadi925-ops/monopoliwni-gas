import { describe, expect, it } from 'vitest';
import { formatPercent, formatRupiah, formatRupiahShort } from '../format';

describe('format utilities', () => {
  it('formats IDR currency with thousand separators', () => {
    expect(formatRupiah(0)).toBe('Rp 0');
    expect(formatRupiah(1500000)).toBe('Rp 1.500.000');
    expect(formatRupiah(-250000)).toBe('- Rp 250.000');
    expect(formatRupiah(Number.NaN)).toBe('Rp 0');
  });

  it('formats compact IDR currency for badges and boards', () => {
    expect(formatRupiahShort(0)).toBe('Rp 0');
    expect(formatRupiahShort(250_000)).toBe('Rp 250 Rb');
    expect(formatRupiahShort(4_500_000)).toBe('Rp 4.5 Jt');
    expect(formatRupiahShort(2_000_000_000)).toBe('Rp 2 M');
    expect(formatRupiahShort(-1_500_000)).toBe('-Rp 1.5 Jt');
  });

  it('formats percentage with one decimal place', () => {
    expect(formatPercent(5)).toBe('5.0%');
    expect(formatPercent(6.25)).toBe('6.3%');
  });
});
