/**
 * Format a number as Brazilian currency (R$)
 * Always shows exactly 2 decimal places
 */
export function formatCurrency(value: number): string {
  return value.toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

/**
 * Format a number as a percentage
 * Shows 1 decimal place for percentages
 */
export function formatPercentage(value: number): string {
  return value.toFixed(1);
}
