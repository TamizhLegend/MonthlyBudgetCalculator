const INR_LOCALE = 'en-IN';
const INR_CURRENCY = 'INR';

export type FormatCurrencyOptions = {
  /** Override minimum fraction digits (default 2). */
  minimumFractionDigits?: number;
  /** Override maximum fraction digits (default 2). */
  maximumFractionDigits?: number;
  /**
   * Compact axis/label form (e.g. ₹1.5K). Uses Intl compact notation when available;
   * falls back to a simple k-suffix for large values.
   */
  compact?: boolean;
  /**
   * When true, always show a leading "+" for positive amounts (useful for deltas).
   * Negative amounts keep their normal minus sign from Intl.
   */
  signed?: boolean;
};

/**
 * Format a numeric amount as Indian Rupees for display.
 * Does not convert FX — only changes symbol/locale formatting.
 */
export function formatCurrency(
  amount: number,
  options: FormatCurrencyOptions = {}
): string {
  const {
    minimumFractionDigits = 2,
    maximumFractionDigits = 2,
    compact = false,
    signed = false,
  } = options;

  const value = Number(amount) || 0;

  if (compact) {
    try {
      return new Intl.NumberFormat(INR_LOCALE, {
        style: 'currency',
        currency: INR_CURRENCY,
        notation: 'compact',
        maximumFractionDigits: 1,
      }).format(value);
    } catch {
      const abs = Math.abs(value);
      const prefix = value < 0 ? '-' : '';
      if (abs >= 1000) {
        return `${prefix}₹${(abs / 1000).toFixed(1)}k`;
      }
      return `${prefix}₹${abs}`;
    }
  }

  const formatted = value.toLocaleString(INR_LOCALE, {
    style: 'currency',
    currency: INR_CURRENCY,
    minimumFractionDigits,
    maximumFractionDigits,
  });

  if (signed && value > 0) {
    return `+${formatted}`;
  }

  return formatted;
}
